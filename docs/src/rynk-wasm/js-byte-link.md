# JS Byte Link Implementations

This chapter is a complete reference for the two built-in browser `JsByteLink`
implementations: WebUSB (the vendor bulk interface, for USB keyboards) and
WebHID (the vendor HID report, for BLE keyboards the OS has already bonded).

Source: `src/rynk/web.ts` and `src/rynk/core.ts` (this repository)

## Overview

Both links present the same `JsByteLink` shape to WASM:

```ts
interface JsByteLink {
  send: (frame: Uint8Array) => Promise<void>
  recv: () => Promise<Uint8Array>   // empty at EOF
  close: () => Promise<void>        // release browser resources; idempotent
  readonly label: string
}
```

Only the code that opens and normalizes the browser transport differs. WebUSB
streams raw COBS-framed Rynk bytes over a bulk endpoint pair. WebHID fragments
each frame into fixed 32-byte HID reports — the zero padding decodes as empty
COBS frames and is discarded, so WASM sees the same clean byte stream either
way. No length-based reassembly is needed: `0x00` delimits frames.

The version probe is not a link method. `probeVersion(link)` in
`src/rynk/core.ts` runs over any `JsByteLink` before the wasm build is chosen
(see [Lifecycle & Dead States](./lifecycle.md)).

## BufferedLink

Both links share one base class: a buffer that collects device→host bytes and
hands them to `recv()` a chunk at a time.

```ts
abstract class BufferedLink {
  protected push(bytes: Uint8Array)  // transport delivers bytes
  protected end()                    // transport hit EOF; recv() returns empty
  async recv(): Promise<Uint8Array>  // parks until bytes or EOF
}
```

`push()` wakes a parked `recv()`; `end()` marks EOF so every later `recv()`
resolves to an empty chunk — which the WASM transport reads as
`RynkHostError::Disconnected`.

## WebUSB (Vendor Bulk)

WebUSB claims the firmware's vendor bulk interface, recognized by the class
triple the firmware advertises — never by VID/PID:

```ts
const RYNK_USB_CLASS = 0xFF
const RYNK_USB_SUBCLASS = 0x52
const RYNK_USB_PROTOCOL = 0x52
```

### Opening the device

`navigator.usb.requestDevice()` must be called inside a user gesture. The
filter matches the triple, so only Rynk keyboards appear in the chooser:

```ts
const device = await navigator.usb.requestDevice({
  filters: [{ classCode: 0xFF, subclassCode: 0x52, protocolCode: 0x52 }],
})
```

Already-granted keyboards need no gesture — `navigator.usb.getDevices()`
returns them (filtered by the same triple, read from cached descriptors), which
is how the app lists devices and reconnects on launch. The descriptor's
`productName` is readable the moment the grant exists, before any handshake.

Opening claims the interface and resolves the bulk endpoint pair from the
descriptors (never hardcoded):

```ts
await device.open()
if (device.configuration === null)
  await device.selectConfiguration(device.configurations[0].configurationValue)
await device.claimInterface(interfaceNumber)
```

### The pump starts before the first send

`WebUsbLink`'s constructor immediately parks a `transferIn` on the IN
endpoint. Bulk has no DTR, so the firmware never learns that a previous
session's host vanished — it may be parked on a topic write no one read, and
only a pending IN transfer drains it. The version probe skips those stale
frames. Starting the pump late (after the first send) wedges exactly that
reconnect case.

```ts
private async pump() {
  while (!this.closed) {
    const result = await this.device.transferIn(this.epIn, USB_READ_SIZE)
    if (result.status === 'stall') { await this.device.clearHalt('in', this.epIn); continue }
    if (result.data) this.push(new Uint8Array(result.data.buffer, ...))
  }
  this.end()
}
```

`USB_READ_SIZE` is 4096 — a whole Rynk frame per transfer, and a multiple of
both Full- and High-Speed packet sizes. A read length that is not a multiple of
`wMaxPacketSize` errors the moment the device sends a full packet.

### Method summary

- **`send(f)`** — one `transferOut` with the whole frame, copied into a fresh
  buffer (the API wants plain `ArrayBuffer` backing).
- **`recv()`** — `BufferedLink`: returns buffered chunks, empty at EOF. An
  unplug rejects the pending `transferIn`, which ends the pump and signals EOF.
- **`close()`** — releases the interface and closes the device, bounded by a
  1s race so a wedged stack cannot hold up the teardown; the pending
  `transferIn` is aborted by the close.

## WebHID (BLE over OS HID)

WebHID reaches the firmware's `RynkHidReport` via the existing OS HID link.
This works for BLE keyboards that are already bonded at the OS level — there
is no pairing prompt.

### Opening the device

The filter targets Rynk's own vendor usage page. `0xFF14` is deliberate:
rmk-rs/rmk#1022 moved it off `0xFF60`, which Via/Vial keyboards use, so their
boards no longer match the chooser filter.

```ts
const RYNK_HID_USAGE_PAGE = 0xFF14
const RYNK_HID_USAGE = 0x61

const devices = await navigator.hid.requestDevice({
  filters: [{ usagePage: RYNK_HID_USAGE_PAGE, usage: RYNK_HID_USAGE }],
})
```

`navigator.hid.getDevices()` lists already-granted keyboards without a
gesture, filtered by the same usage on their `collections`.

### 32-byte report framing

Each Rynk frame is fragmented into fixed 32-byte reports with report ID 0,
zero-padded to the full report size:

```ts
async send(frame: Uint8Array): Promise<void> {
  for (let offset = 0; offset < frame.length; offset += 32) {
    const report = new Uint8Array(32)
    report.set(frame.subarray(offset, offset + 32))
    await this.device.sendReport(0, report)
  }
}
```

Receiving needs no reassembly bookkeeping: every `inputreport` event's bytes
are pushed as-is. COBS treats the zero padding as frame delimiters, so it
decodes to empty frames and is discarded. The WASM client never sees the
32-byte report structure — it sees the same continuous Rynk byte stream the
bulk endpoint exposes.

### Method summary

- **`send(f)`** — splits the frame into 32-byte reports via `sendReport(0, …)`.
- **`recv()`** — `BufferedLink`, fed by the `inputreport` listener.
- **`close()`** — removes the listener, signals EOF, then closes the OS handle
  bounded by a 1s race: `close()` queues behind any `sendReport` the device
  never accepted, and the session is already over once the listener is gone.

## The Version Probe

`probeVersion(link)` sends a COBS-framed `GetVersion` (cmd `0x0001`, seq 1,
empty payload) and scans delimited frames until the reply lands, skipping
interleaved topic pushes. It runs under an **idle watchdog**, not a total cap:
every answer rearms a 5s window, so a slow link that is still talking gets to
keep going — only silence gives up. The watchdog covers the send as well:
`sendReport`/`transferOut` can itself park forever on a granted device that is
not actually speaking rynk, and a deadline that starts after the send never
fires for it.

## Why WebHID not Web Bluetooth

A pure browser cannot reach Rynk's custom 128-bit GATT service on an OS-bonded
keyboard:

- **Web Bluetooth cannot attach a bonded keyboard at all.** It requires its own
  pairing flow; it cannot ride an existing OS bond.
- **WebHID reaches the firmware's vendor HID report** over the same OS link
  that delivers keystrokes — no pairing prompt, one chooser grant.

Rynk's custom-GATT BLE transport (`rynk-ble`) is a separate native-only path
for desktop tools that can perform their own BLE pairing.

## RynkHidReport Requirement

The firmware must expose `RynkHidReport` with usage page `0xFF14`. If the
WebHID chooser is empty:

- Confirm the firmware build includes the `rynk` feature (the report is gated
  on it).
- Confirm the device is connected and bonded at the OS level.
- Use a Chromium browser over `http://localhost` or HTTPS. Firefox and Safari
  expose neither `navigator.usb` nor `navigator.hid`.

## Minimal WebUSB Link

The smallest useful `JsByteLink`, without the shared buffer class — enough for
`connect()` when nothing else needs the stream:

```js
async function openUsbByteLink() {
  const device = await navigator.usb.requestDevice({
    filters: [{ classCode: 0xFF, subclassCode: 0x52, protocolCode: 0x52 }],
  })
  await device.open()
  if (device.configuration === null) await device.selectConfiguration(1)
  // Resolve interfaceNumber / epIn / epOut from device.configurations by the
  // class triple; hardcoded here as 0/1/1 for brevity.
  await device.claimInterface(0)

  return {
    label: device.productName ?? 'RMK keyboard',
    async send(bytes) {
      const buf = new Uint8Array(bytes.length)
      buf.set(bytes)
      await device.transferOut(1, buf)
    },
    async recv() {
      const r = await device.transferIn(1, 4096).catch(() => null)
      if (!r?.data) return new Uint8Array(0) // unplugged: EOF
      return new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength)
    },
    async close() {
      try { await device.releaseInterface(0) } catch {}
      try { await device.close() } catch {}
    },
  }
}
```

Call `requestDevice()` inside a user gesture such as a button click. The full
implementation in `src/rynk/web.ts` adds the shared buffer, the pump-first
rule, and stall recovery.
