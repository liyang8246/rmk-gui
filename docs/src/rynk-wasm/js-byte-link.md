# JS Byte Link Implementations

This chapter is a complete reference for the two built-in `JsByteLink`
implementations: Web Serial (USB) and WebHID (BLE over the OS HID link). Both
are drawn from the `index.html` reference shell.

Source: `rynk/rynk-wasm/index.html` and `rynk/rynk-wasm/README.md`

## Overview

Both built-in links present the same `JsByteLink` shape to WASM:

```js
{
  async send(bytes) { /* Uint8Array -> browser transport */ },
  async recv() { /* browser transport -> Uint8Array; empty at EOF */ },
  async close() { /* release browser resources; idempotent */ },
}
```

Only the JS code that opens and normalizes the browser transport differs. Web
Serial streams raw Rynk frame bytes directly. WebHID fragments each Rynk frame
into fixed 32-byte HID reports and reassembles them back into the clean byte
stream before WASM sees them.

Both links also implement an optional `probeVersion()` method used before
`connect()` to select a version-matched wasm build (see
[Lifecycle & Dead States](./lifecycle.md)).

## Web Serial (USB)

Web Serial opens the keyboard's USB CDC-ACM serial port and streams raw Rynk
frame bytes over it. No framing adaptation is needed — the serial stream is
already a byte stream.

### Opening the port

`navigator.serial.requestPort()` must be called inside a user gesture (a button
click). The port is then opened at 115200 baud:

```js
port = await navigator.serial.requestPort();
await port.open({ baudRate: 115200 });
return link(port);
```

Source: `rynk/rynk-wasm/index.html`, lines 326-331.

### Buffered link

The reference implementation uses a buffered link: one reader task drains the
port into an `rx` buffer, and consumers read from `rx`. This supports the
pre-load version probe (which needs to read frames) and the `recv()` contract
simultaneously:

```js
function link(port) {
  const reader = port.readable.getReader();
  let writer;
  try {
    writer = port.writable.getWriter();
  } catch (e) {
    reader.releaseLock();   // don't leak the read lock if acquiring the writer fails
    throw e;
  }
  let rx = new Uint8Array(0);
  let closed = false;
  let wake = null;          // resolve fn of a consumer waiting on `rx`

  const signal = () => { if (wake) { const w = wake; wake = null; w(); } };

  // Drain the port into rx until EOF.
  (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && value.length) { rx = concat(rx, value); signal(); }
      }
    } catch {}
    closed = true;
    signal();
  })();

  // Check rx and install wake synchronously to avoid missed wakeups.
  async function ready() {
    while (rx.length === 0 && !closed) await new Promise((res) => { wake = res; });
  }
  async function fill(n) {
    while (rx.length < n) {
      if (closed) throw new Error("port closed");
      await ready();
    }
  }
  async function readFrame() {
    await fill(RYNK_HEADER);
    const len = rx[3] | (rx[4] << 8);
    await fill(RYNK_HEADER + len);
    const f = rx.slice(0, RYNK_HEADER + len);
    rx = rx.slice(RYNK_HEADER + len);
    return { cmd: f[0] | (f[1] << 8), seq: f[2], payload: f.slice(RYNK_HEADER) };
  }

  return {
    // Probe GetVersion before loading wasm.
    async probeVersion() {
      await writer.write(frame(CMD_GET_VERSION, 1, new Uint8Array(0)));
      let f;
      do { f = await readFrame(); } while (f.cmd & RYNK_TOPIC_BIT);
      if (f.payload.length < 3 || f.payload[0] !== 0x00) {
        throw new Error(`bad version reply: [${f.payload}]`);
      }
      return { major: f.payload[1], minor: f.payload[2] };
    },
    async send(f) { await writer.write(f); },
    async recv() {
      await ready();
      if (rx.length > 0) { const c = rx; rx = new Uint8Array(0); return c; }
      return new Uint8Array(0);
    },
    async close() {
      try { await reader.cancel(); } catch {}
      try { await writer.abort(); } catch {}
      try { await port.close(); } catch {}
    },
  };
}
```

Source: `rynk/rynk-wasm/index.html`, lines 98-172.

### Method summary

- **`probeVersion()`** — sends a `GetVersion` frame (`CMD_GET_VERSION = 0x0001`,
  seq 1, empty body), reads frames until a non-topic reply arrives, parses the
  version from the postcard `Result<ProtocolVersion, RynkError>` payload.
- **`send(f)`** — `writer.write(f)`. The serial writer accepts a `Uint8Array`
  directly.
- **`recv()`** — waits until `rx` has bytes or the port is closed, then returns
  the entire buffered chunk. Returns `new Uint8Array(0)` at EOF.
- **`close()`** — cancels the reader, aborts the writer, closes the port. Each
  step is wrapped in `try/catch` so a partially-open state still closes cleanly.

### Rynk frame constants

The JS side needs these constants to build and parse raw frames (for the version
probe only — after `connect()`, the wasm client handles all framing):

```js
const RYNK_HEADER = 5;            // cmd:u16 LE, seq:u8, len:u16 LE
const RYNK_TOPIC_BIT = 0x8000;    // CMD high bit set: server-to-host topic push
const CMD_GET_VERSION = 0x0001;
```

## WebHID (BLE over OS HID)

WebHID reaches the firmware's vendor HID report (`RynkHidService`) via the
existing OS HID link. This works for BLE keyboards that are already bonded at
the OS level — there is no pairing prompt.

### Opening the device

`navigator.hid.requestDevice()` must be called inside a user gesture. The
filter targets the Rynk vendor usage page `0xFF60` and usage `0x61`:

```js
const devs = await navigator.hid.requestDevice({
  filters: [{ usagePage: 0xFF60, usage: 0x61 }]
});
if (!devs.length) throw new Error("no WebHID device chosen");
device = devs[0];
if (!device.opened) await device.open();
return hidLink(device);
```

Source: `rynk/rynk-wasm/index.html`, lines 333-340.

### 32-byte report framing

Each Rynk frame is fragmented into fixed 32-byte HID reports. The firmware's
`RynkHidService` uses report ID 0 and a fixed report size of 32 bytes:

```js
const RYNK_HID_REPORT_SIZE = 32;  // firmware RynkHidService report
```

**Sending** — one Rynk frame is split into 32-byte reports, each padded to the
full report size with zeros:

```js
async function sendFramed(bytes) {
  for (let off = 0; off < bytes.length; off += N) {
    const chunk = bytes.subarray(off, off + N);
    const report = new Uint8Array(N);
    report.set(chunk);
    await device.sendReport(0, report);   // report ID 0
  }
}
```

Source: `rynk/rynk-wasm/index.html`, lines 210-217.

### Reassembly

**Receiving** — the `remaining` counter trims the final report's padding using
the frame's LEN field (bytes 3-4 of the Rynk header). This strips HID padding so
WASM sees the same clean Rynk byte stream as serial:

```js
function hidLink(device) {
  const N = RYNK_HID_REPORT_SIZE;     // 32
  let rx = new Uint8Array(0);
  let remaining = 0;   // bytes left in the in-flight rynk frame; 0 at a boundary
  let closed = false;
  let wake = null;
  const signal = () => { if (wake) { const w = wake; wake = null; w(); } };

  // Trim final-report padding using the frame LEN field.
  const onReport = (event) => {
    const d = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
    if (remaining === 0) remaining = RYNK_HEADER + (d[3] | (d[4] << 8));
    const take = Math.min(remaining, d.length);
    remaining -= take;
    rx = concat(rx, d.slice(0, take));
    signal();
  };
  device.addEventListener("inputreport", onReport);

  // ... ready(), fill(), readFrame() — same pattern as the serial link ...

  return {
    async probeVersion() { /* same as serial, using sendFramed */ },
    async send(f) { await sendFramed(f); },
    async recv() { /* same as serial */ },
    async close() {
      closed = true;
      device.removeEventListener("inputreport", onReport);
      try { await device.close(); } catch {}
      signal();
    },
  };
}
```

Source: `rynk/rynk-wasm/index.html`, lines 176-242.

The reassembly logic in `onReport`:

1. **When `remaining === 0`**: a new frame is starting. Read the frame's LEN
   from the Rynk header (bytes 3-4, little-endian) and set
   `remaining = RYNK_HEADER + len` (the total frame size).
2. **Take `min(remaining, d.length)` bytes** from each report. This trims the
   zero-padding from the final report of a frame.
3. **Decrement `remaining`** by the number of bytes taken. When it reaches 0,
   the next report starts a new frame.

This is why the `JsByteLink` contract says "transport-specific framing must be
hidden below this boundary." The WASM client never sees the 32-byte report
structure — it sees a continuous Rynk byte stream, identical to what Web Serial
exposes.

### Method summary

- **`probeVersion()`** — same as serial, but sends via `sendFramed()`.
- **`send(f)`** — `sendFramed(f)`, splitting the frame into 32-byte reports.
- **`recv()`** — same as serial: drains `rx`, returns chunks, empty at EOF.
- **`close()`** — removes the `inputreport` listener, closes the HID device,
  signals any parked `recv()`.

## Why WebHID not Web Bluetooth

A pure browser cannot reach Rynk's custom 128-bit GATT service on an OS-bonded
keyboard. The reasons:

- **Web Bluetooth cannot attach a bonded keyboard at all.** Web Bluetooth
  requires its own pairing flow; it cannot ride an existing OS bond. A keyboard
  already bonded to the OS (as BLE keyboards normally are) cannot be accessed
  by Web Bluetooth.
- **WebHID reaches the firmware's vendor HID report.** The firmware exposes
  `RynkHidService` as a vendor HID report (usage page `0xFF60`). WebHID can
  access vendor HID reports via the existing OS HID link — the same path the OS
  uses to deliver keyboard input. So there is no pairing prompt; the user only
  grants HID access once via the chooser.

Rynk's custom-GATT BLE transport (`rynk-ble`, native `bluest`) is a separate
native-only path for desktop tools that can perform their own BLE pairing:

```bash
cargo run -p rynk --example hw_test -- ble
```

## RynkHidService Requirement

The firmware must expose `RynkHidService` with usage page `0xFF60`. A build
without that HID report will not appear in the WebHID chooser — the
`navigator.hid.requestDevice()` filter will match nothing.

If the WebHID chooser is empty:

- Confirm the firmware build includes `RynkHidService` (check the keyboard's
  `keyboard.toml` or Rust configuration for the HID report descriptor).
- Confirm the device is connected and bonded at the OS level (it should appear
  in the OS Bluetooth settings as a paired keyboard).
- Use a Chromium browser (Chrome or Edge) over `http://localhost`. Firefox and
  Safari do not expose `navigator.hid`.

## Minimal Web Serial Link

This is the smallest useful `JsByteLink` shape, without the buffered reader or
version probe. It is sufficient for `connect()` when the page does not need to
probe the version before loading wasm:

```js
async function openSerialByteLink() {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  const reader = port.readable.getReader();
  const writer = port.writable.getWriter();
  let closed = false;

  return {
    async send(bytes) {
      await writer.write(bytes);
    },

    async recv() {
      if (closed) return new Uint8Array(0);
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          closed = true;
          return new Uint8Array(0);
        }
        if (value && value.length) return value;
      }
    },

    async close() {
      closed = true;
      try { await reader.cancel(); } catch {}
      try { reader.releaseLock(); } catch {}
      try { await writer.close(); } catch {}
      try { writer.releaseLock(); } catch {}
      try { await port.close(); } catch {}
    },
  };
}
```

Source: `rynk/rynk-wasm/README.md`, lines 116-152.

Call `requestPort()` inside a user gesture such as a button click. The
`index.html` reference shell uses a more complete buffered version that
supports the pre-load version probe — see the [Web Serial](#web-serial-usb)
section above for that implementation.
