# Lifecycle & Dead States

This chapter covers the connect flow, the version-probe pattern, link lifecycle
and cancellation rules, topic queue overflow, and disconnect/reconnect
handling. The division of labor to keep in mind for `rmk-gui`: the **page owns
the link's lifetime** — it opens the link before `connect()` and closes it on
teardown; nothing inside the wasm ever closes it — while the wasm owns the
**session**, a `rynk::Client` + `Driver` pair (`rynk/src/driver.rs`) wrapped by
`RynkClient` (`rynk/rynk-wasm/src/client.rs`).

## Connect Flow

The full connect sequence, as implemented by the `connectVia` function in the
`index.html` demo shell:

1. **JS opens the browser transport** via a user gesture (button click). The
   demo offers Web Serial (USB) and WebHID (BLE); `rmk-gui` uses WebUSB and
   WebHID instead (`src/rynk/web.ts`). The gesture is required for the
   first-time chooser (`requestPort()` / `requestDevice()`); previously granted
   devices reopen without one.
2. **JS probes the version**: `link.probeVersion()` returns `{ major, minor }`
   by sending a raw `GetVersion` frame and reading the reply.
3. **JS loads the version-matched wasm**: `loadCore(major)` dynamically imports
   the wasm package for the reported protocol major.
4. **`await core.default()`** — runs the `wasm_bindgen` `init()` (panic hook +
   `console_log`). Idempotent.
5. **`await core.connect(link)`** — runs the Rynk handshake over the JS link
   (version check + capability snapshot) and returns a `RynkClient`.

```js
l = await openLink()

const { major, minor } = await l.probeVersion()
log(`${label}: protocol v${major}.${minor} — loading rynk-wasm…`)

core = await loadCore(major)
await core.default() // wasm-bindgen init (idempotent)

client = await core.connect(l)
```

Source: `connectVia` in `rynk/rynk-wasm/index.html`. `rmk-gui` runs the same
sequence in `connectClient` (`src/rynk/core.ts`).

`connect()` takes only the `JsByteLink` — the display label is the link's own
required `label` property. The handshake sends `GetVersion` and
`GetCapabilities` in one round trip and rejects on a major mismatch with
`VersionMismatch` (`handshake` in `rynk/src/device.rs`). If the page does not
probe the version, it can call `connect()` directly — the pre-probe exists so
the page can load a protocol-major-specific wasm build before the handshake
runs inside wasm.

## Versioned Loading

The Rynk frame envelope (3-byte header `CMD u16 LE | SEQ u8`, COBS-encoded on
the wire and `0x00`-delimited) and the `GetVersion` request are frozen across
protocol versions. The demo uses that stability to probe the device first, then
load the wasm package for the reported major:

```js
async function loadCore(major) {
  switch (major) {
    case 0: // protocol v0.x (ProtocolVersion::CURRENT = {0, 1})
      return await import('./pkg/rynk_wasm.js')
    default:
      throw new Error(`no rynk-core wasm for protocol major ${major}`)
  }
}
```

Source: `loadCore` in `rynk/rynk-wasm/index.html`; `rmk-gui`'s version
(`src/rynk/core.ts`) maps majors 0 and 1 to the same module. When protocol v2
lands, `loadCore(major)` can select a second wasm build while keeping the same
JS byte-link implementations — the `JsByteLink` contract is
version-independent.

The `probeVersion()` method is implemented in JS (in the demo's `framedLink`)
because it must run before the version-matched wasm is loaded. Since
`GetVersion` is frozen, a literal frame serves: `PROBE_GET_VERSION` is
`[0x00, 0x02, 0x01, 0x02, 0x01, 0x00]` — a stale-byte `0x00` sync, then the
COBS-encoded `GetVersion` (cmd `0x0001`, seq 1, no payload). The probe sends it
and reads frames, ignoring any topic pushes that arrive first:

```js
async probeVersion() {
  await send(PROBE_GET_VERSION);
  // Ignore topic pushes that arrive before the reply.
  let f;
  do { f = await readFrame(); } while (f.cmd & RYNK_TOPIC_BIT);
  if (f.payload.length < 3 || f.payload[0] !== 0x00) {
    throw new Error(`bad version reply: [${f.payload}]`);
  }
  return { major: f.payload[1], minor: f.payload[2] };
}
```

The reply payload is `Result<ProtocolVersion, RynkError>` in postcard: byte 0
is `0x00` for `Ok`, then `major` and `minor`. `rmk-gui`'s `probeVersion`
(`src/rynk/core.ts`) adds an idle watchdog so a silent device fails the probe
instead of parking it forever.

## Link Lifecycle — Critical Rules

Two rules for a `rmk-gui` developer:

> **The page owns the link. Nothing inside the wasm ever closes it.**

Dropping the `RynkClient` ends the session but leaves the link open; teardown
must call `link.close()` itself (see the recipe below). Source: module docs in
`rynk/rynk-wasm/src/transport.rs`.

> **Cancelling a call is safe.**

Dropping the `await` on any client method — a `Promise.race` with a timeout,
navigating away mid-call — leaves the session healthy. The client has no
built-in timeout (`Client::request` in `rynk/src/driver.rs`), so racing calls
against a deadline is the intended pattern; `rmk-gui`'s `withDeadline`
(`src/rynk/core.ts`) does exactly that.

What makes cancellation safe:

- **Requests**: each in-flight request claims a slot keyed by its SEQ.
  `SlotGuard` frees the slot on drop, so a cancelled request's late reply
  matches no slot and is dropped as unmatched (`SlotGuard` and `Driver::run` in
  `rynk/src/driver.rs`).
- **The wire never desyncs**: `WasmWriter` parks its in-flight `send()` — JS
  promises cannot be cancelled, and two live sends would interleave their
  bytes — and drains it before starting the next write. `WasmReader` parks its
  in-flight `recv()` the same way (`rynk/rynk-wasm/src/transport.rs`).
- **The pump resumes**: `Driver::run` takes `&mut self` with all receive state
  (buffer + `Deframer`) in the struct, and has no await between `read` and
  `commit`, so a cancelled run is simply re-entered later with no bytes lost.

### Who pumps the driver

There is no resident task in the wasm, so the in-flight calls elect one:
`RynkClient::drive` races each call's future against locking the driver. The
lock winner runs `Driver::run`, pumping both directions for every parked call,
and releases the lock when its own future resolves — handing the pump to a
parked call. Source: `RynkClient::drive` in `rynk/rynk-wasm/src/client.rs`.

### Dead links

A dead link is still terminal. `Driver::run` returns when the link dies (EOF
maps to `Disconnected`, transport faults to `Io`); the error surfaces from
whichever call was pumping and reproduces for every later call — the closed
transport keeps reporting EOF, so broken links fail fast instead of hanging.
There is no liveness probe and no in-band recovery. The only path forward:

1. Close the JS link — `await link.close()`.
2. Drop the `RynkClient` (null out the JS reference).
3. Reconnect: re-open the browser transport and run the connect flow again on
   a fresh link.

## Topic Queue Overflow

Topic pushes (server-to-host, CMD high bit set) are decoded by the driver and
buffered in a bounded queue inside the client:

```rust
/// How many topic events can queue up before the oldest is dropped.
const TOPIC_QUEUE_CAPACITY: usize = 8;
```

Source: `TOPIC_QUEUE_CAPACITY` in `rynk/src/driver.rs`.

When the queue is full and a new topic arrives, the driver drops the oldest
(the read loop must never block) and logs at debug level. There is no drop
counter and no JS accessor: overflow is silent by design, because topics are
best-effort by contract — any missed push can be recovered with the matching
`get_*` call. Two consequences for `rmk-gui`:

- Keep a `next_topic()` pump parked whenever a session is open, so the queue
  drains as fast as topics arrive.
- When a value matters, re-read it with the matching getter
  (`get_current_layer()`, …) instead of trusting the last topic push.

Below the client, transports can lose data invisibly too — BLE notifications
or HID reports the OS never delivered. COBS framing resyncs the byte stream at
the next `0x00` delimiter, so the session survives; the lost pushes fall under
the same best-effort contract.

## Disconnect & Reconnect

### Normal disconnect

Closing the JS link EOFs the transport — `recv()` resolves an empty
`Uint8Array`, `WasmReader::read` returns `Ok(0)`, and `Driver::run` returns
`Disconnected`. The error surfaces from whichever call was pumping; with the
demo's topic pump parked that is `next_topic()`, whose rejection ends the pump
loop.

### Auto-reconnect

After a disconnect, the page can reconnect to previously granted devices
without a new chooser prompt:

```js
// Auto-reconnect only to previously granted devices. Prefer USB, then WebHID.
async function grantedSerialPort() {
  try { return navigator.serial ? (await navigator.serial.getPorts())[0] || null : null; }
  catch { return null; }
}
async function grantedHidDevice() {
  try {
    const devs = navigator.hid ? await navigator.hid.getDevices() : [];
    return devs.find((d) => (d.collections || []).some((c) => c.usagePage === 0xFF14)) || devs[0] || null;
  } catch { return null; }
}
```

Source: `grantedSerialPort` / `grantedHidDevice` / `autoConnect` in
`rynk/rynk-wasm/index.html`. `rmk-gui`'s equivalents live in
`src/rynk/web.ts`: `grantedUsbDevices()` filters `navigator.usb.getDevices()`
by the Rynk vendor interface class triple (class `0xFF`, subclass `0x52`,
protocol `0x52`), and `grantedHidDevices()` filters by the vendor usage
(`usagePage 0xFF14`, `usage 0x61`).

### Transport removal events

The browser fires `connect` / `disconnect` events on `navigator.serial` and
`navigator.hid` when a device is plugged or unplugged (`navigator.usb` fires
the same pair for `rmk-gui`'s WebUSB path). A page can use them to
auto-connect when idle and to tear down when the active transport is removed:

```js
// Reconnect when idle; disconnect on active transport removal.
navigator.serial?.addEventListener?.('connect', () => { if (!connected) autoConnect() })
navigator.hid?.addEventListener?.('connect', () => { if (!connected) autoConnect() })
const onDrop = () => { if (connected) teardown().then(() => log('\n— transport disconnected —')) }
navigator.serial?.addEventListener?.('disconnect', onDrop)
navigator.hid?.addEventListener?.('disconnect', onDrop)
```

On Web Serial and WebUSB an unplug also fails the link's pending read, so the
link signals EOF on its own and the events are only UI signal. On WebHID,
input reports simply stop arriving — nothing rejects — so the `disconnect`
handler (whose teardown closes the link) is what actually ends the session.

The pattern: reconnect when idle, tear down on active transport removal. Do
not attempt to reconnect over an active transport that was just removed — tear
down first, then let the `connect` event (if the device reappears) drive the
reconnect.

## Recipe: Handling Disconnect

The demo shell's teardown function, annotated:

```js
let port = null, device = null, l = null, core = null, client = null, connected = false

async function teardown() {
  // Clear refs before closing: link shutdown rejects pumpTopics, which
  // otherwise re-enters teardown.
  const link = l, p = port
  port = null; device = null; l = null; core = null; client = null; connected = false
  // ... reset UI ...
  if (link) await link.close()
  else if (p) { try { await p.close() } catch {} }
}
```

Key points:

- Clear the references **before** closing. The topic pump's `catch` calls
  `teardown()` when it observes link failure; nulling `client` first (plus the
  pump's `client === c` guard) keeps that from re-entering a teardown that is
  already running.
- Closing the link is the page's job. Nulling `client` drops the `RynkClient`
  session, but nothing inside the wasm closes the link.
- The `connectVia` wrapper calls `teardown()` in its `catch` block too, so a
  failed connect attempt releases the transport for the next retry.

## Recipe: Topic Pump Loop

The topic pump mirrors the native `Client::next_topic()` pull. It runs until
`next_topic()` rejects, and in the demo it owns teardown when it is the first
to observe link failure:

```js
// The topic pump owns teardown when it first observes link failure.
async function pumpTopics(c) {
  try {
    for (;;) {
      const ev = await c.next_topic()
      logTopic(`${new Date().toLocaleTimeString('en-GB')} ${JSON.stringify(ev)}`)
    }
  } catch {
    if (client === c) { await teardown(); log('\n— transport disconnected —') }
  }
}
```

Source: `pumpTopics` in `rynk/rynk-wasm/index.html`.

The pump is fire-and-forget (not awaited) — it runs concurrently with the rest
of the page. The `client === c` guard pins the pump to its own session, so a
stale pump from a previous session cannot tear down the next one.

Issuing requests while the pump is parked — even from inside the loop body —
is fine: every `RynkClient` method takes `&self`, and the session is
full-duplex. A parked `next_topic()` and up to `MAX_IN_FLIGHT` (4) requests
run concurrently, with replies matched back by SEQ. The demo leans on this:
its unlock ceremony polls `unlock_poll()` while topic pushes from the held
keys keep streaming into the Topics pane.
