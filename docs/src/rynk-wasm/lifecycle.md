# Lifecycle & Dead States

This chapter covers the connect flow, the version-probe pattern, link lifecycle
rules, topic queue overflow, and disconnect/reconnect handling. Understanding
these is critical for building a reliable `rmk-gui`: a mishandled cancelled read
or an unobserved topic overflow will leave the client in a dead state with no
obvious error.

The protocol client (`rynk::Client<T>`) owns the link lifecycle. Its source is
`rynk/src/driver.rs`.

## Connect Flow

The full connect sequence, as implemented by the `index.html` reference shell:

1. **JS opens the browser transport** (Web Serial or WebHID) via a user gesture
   (button click). Both APIs require a user activation.
2. **JS optionally probes the version**: `link.probeVersion()` returns
   `{ major, minor }` by sending a raw `GetVersion` frame and reading the reply.
3. **JS loads the version-matched wasm**: `loadCore(major)` dynamically imports
   the wasm package for the reported protocol major.
4. **`await core.default()`** — runs the `wasm_bindgen` `init()` (panic hook +
   `console_log`). Idempotent.
5. **`await core.connect(link, label)`** — runs the Rynk handshake over the JS
   link (negotiates version, caches capabilities) and returns a `RynkClient`.

```js
l = await openLink();

const { major, minor } = await l.probeVersion();
log(`${label}: protocol v${major}.${minor} — loading rynk-wasm…`);

core = await loadCore(major);
await core.default();            // wasm-bindgen init (idempotent)

client = await core.connect(l, device?.productName || null);
```

Source: `rynk/rynk-wasm/index.html`, lines 270-286 (the `connectVia` function).

If the page does not probe the version, it can call `connect()` directly — the
handshake inside `connect()` also negotiates the version and rejects on a major
mismatch with `VersionMismatch`. The pre-probe exists so the page can load a
protocol-major-specific wasm build before the handshake runs inside wasm.

## Versioned Loading

The Rynk frame envelope (5-byte header: `CMD u16 LE | SEQ u8 | LEN u16 LE`) and
the `GetVersion` request are intended to stay stable across protocol majors.
`index.html` uses that stability to probe the device first, then load the wasm
package for the reported major:

```js
async function loadCore(major) {
  switch (major) {
    case 0: // protocol v0.x (ProtocolVersion::CURRENT = {0, 1})
    case 1:
      return await import("./pkg/rynk_wasm.js");
    default:
      throw new Error(`no rynk-core wasm for protocol major ${major}`);
  }
}
```

Source: `rynk/rynk-wasm/index.html`, lines 245-253.

Today there is one wasm package, so both major 0 and 1 load it. When protocol v2
lands, `loadCore(major)` can select a second wasm build while keeping the same
JS byte-link implementations — the `JsByteLink` contract is version-independent.

The `probeVersion()` method is implemented in JS (not in wasm) because it must
run before the version-matched wasm is loaded. It sends a raw `GetVersion`
frame and reads the reply, ignoring any topic pushes that arrive first:

```js
async probeVersion() {
  await writer.write(frame(CMD_GET_VERSION, 1, new Uint8Array(0)));
  // Ignore topic pushes that arrive before the reply.
  let f;
  do { f = await readFrame(); } while (f.cmd & RYNK_TOPIC_BIT);
  if (f.payload.length < 3 || f.payload[0] !== 0x00) {
    throw new Error(`bad version reply: [${f.payload}]`);
  }
  return { major: f.payload[1], minor: f.payload[2] };
}
```

The reply payload is `Result<ProtocolVersion, RynkError>` in postcard: byte 0 is
`0x00` for `Ok`, then `major` and `minor`.

## Link Lifecycle — Critical Rules

The most important rule for a `rmk-gui` developer:

> **A cancelled read or write LATCHES THE LINK DEAD.**

The `rynk::Client` tracks two in-flight flags:

```rust
pub struct Client<T: Read + Write> {
    // ...
    dead: bool,
    /// Set across the `write_all` in `send_request`, cleared once it completes.
    send_in_flight: bool,
    /// Set while assembling an inbound frame. If the future is cancelled, the
    /// flag remains set so the next operation rejects the desynchronized link.
    receive_in_flight: bool,
    // ...
}
```

Source: `rynk/src/driver.rs`, lines 143-150.

How it works:

- `send_in_flight` is set `true` across the `transport.write_all()` call in
  `send_request()`, then cleared when it completes.
- `receive_in_flight` is set `true` across `next_frame_inner()` (frame
  reassembly from `transport.read()`), then cleared when it completes.
- If either flag is still `true` when a new operation starts, the link is
  latched dead: `dead` is set to `true` and the call returns `Disconnected`
  immediately.

```rust
async fn send_request<Req: Serialize>(&mut self, cmd: Cmd, req: &Req) -> Result<u8, RynkHostError> {
    if self.dead || self.send_in_flight || self.receive_in_flight {
        // A cancelled wire operation leaves the stream desynced.
        self.dead = true;
        return Err(RynkHostError::Disconnected);
    }
    // ...
    self.send_in_flight = true;
    let result = self.transport.write_all(msg.frame()).await;
    self.send_in_flight = false;
    // ...
}
```

### Why cancellation is fatal

Cancelling a `read()` or `write()` mid-flight leaves the stream boundary
unknowable. The client may have written half a frame, or read half a frame and
discarded the rest. There is no safe way to resynchronize, so the link is
declared dead.

In JS, cancellation happens when the `await` on a client method is dropped — for
example, a `Promise.race` with a timeout, or navigating away from the page while
a call is in flight. The `wasm-bindgen` future is dropped, which cancels the
underlying Rust future.

### is_alive()

```rust
pub fn is_alive(&self) -> bool {
    !self.dead && !self.send_in_flight && !self.receive_in_flight
}
```

`is_alive()` returns `false` immediately after a cancelled operation — before
the next call latches `dead`. This is not exposed to JS directly, but it
documents the internal state: once `send_in_flight` or `receive_in_flight` is
stuck `true`, the link is already dead from the client's perspective.

### Recovery

There is no in-band recovery for a latched-dead link. The only path forward:

1. Close the JS link — `await link.close()`. This EOFs the transport.
2. Drop the `RynkClient` (null out the JS reference). `WasmTransport::drop`
   also calls `link.close()`.
3. Reconnect: re-open the browser transport and call `connect()` again.

Broken links fail fast: every later call returns `Disconnected` without touching
the wire. This prevents the client from hanging on a dead transport.

## Topic Queue Overflow

Topic pushes (server-to-host, CMD high bit set) are buffered in a bounded queue
inside the client:

```rust
/// Topic frames buffered before the oldest is dropped.
const EVENT_QUEUE_CAPACITY: usize = 64;
```

Source: `rynk/src/driver.rs`, line 41.

When the queue is full and a new topic arrives, the oldest topic is dropped and
`events_dropped` is incremented:

```rust
if self.events.len() == EVENT_QUEUE_CAPACITY {
    self.events.pop_front();
    self.events_dropped += 1;
}
```

`events_dropped()` reports the observable overflow count. If it is non-zero,
topic values may be stale — re-read critical state with the matching `Get*`
call instead of trusting the last topic push:

```js
const dropped = client.events_dropped();
if (dropped > 0) {
  console.warn(`${dropped} topics dropped — re-reading current layer`);
  const layer = await client.get_current_layer();
}
```

On BLE, OS-level notification drops are invisible to the client.
`events_dropped` only counts overflow the client can observe (queue full), not
notifications the OS never delivered.

## Disconnect & Reconnect

### Normal disconnect

Closing the JS link EOFs the transport — `recv()` returns an empty
`Uint8Array`, `WasmTransport::read()` returns `Ok(0)`, and the client maps that
to `Disconnected`. Any parked `next_event()` rejects with `Disconnected`, ending
the topic pump loop.

JS-side teardown:

```js
async function teardown() {
  // Closing the link EOFs the transport, ending any parked next_event() pump.
  if (l) await l.close();
  else if (port) { try { await port.close(); } catch {} }
  port = null; device = null; l = null; core = null; client = null; connected = false;
  // ... reset UI ...
}
```

Source: `rynk/rynk-wasm/index.html`, lines 258-267.

### Auto-reconnect

After a disconnect, the page can reconnect to previously granted devices without
a new chooser prompt:

- `navigator.serial.getPorts()` — serial ports the user previously granted.
- `navigator.hid.getDevices()` — HID devices the user previously granted.

```js
async function grantedSerialPort() {
  try { return navigator.serial ? (await navigator.serial.getPorts())[0] || null : null; }
  catch { return null; }
}
async function grantedHidDevice() {
  try {
    const devs = navigator.hid ? await navigator.hid.getDevices() : [];
    return devs.find((d) => (d.collections || []).some((c) => c.usagePage === 0xFF60)) || devs[0] || null;
  } catch { return null; }
}
```

Source: `rynk/rynk-wasm/index.html`, lines 370-379.

### Transport removal events

The browser fires `connect` / `disconnect` events on `navigator.serial` and
`navigator.hid` when a device is plugged or unplugged. The reference shell uses
them to auto-connect when idle and to tear down when the active transport is
removed:

```js
// Reconnect when idle; disconnect on active transport removal.
navigator.serial?.addEventListener?.("connect", () => { if (!connected) autoConnect(); });
navigator.hid?.addEventListener?.("connect", () => { if (!connected) autoConnect(); });
const onDrop = () => { if (connected) teardown().then(() => log("\n— transport disconnected —")); };
navigator.serial?.addEventListener?.("disconnect", onDrop);
navigator.hid?.addEventListener?.("disconnect", onDrop);
```

Source: `rynk/rynk-wasm/index.html`, lines 399-403.

The pattern: reconnect when idle, disconnect on active transport removal. Do
not attempt to reconnect over an active transport that was just removed — tear
down first, then let the `connect` event (if the device reappears) drive the
reconnect.

## Recipe: Handling Disconnect

The reference shell's teardown function, annotated:

```js
let port = null, device = null, l = null, core = null, client = null, connected = false;

async function teardown() {
  // Closing the link EOFs the transport, ending any parked next_event() pump.
  // Always close the link first so the topic pump's next_event() rejects.
  if (l) await l.close();
  else if (port) { try { await port.close(); } catch {} }
  // Null out all references so the RynkClient (and its WasmTransport) is dropped.
  // WasmTransport::drop also calls link.close() — safe because close is idempotent.
  port = null; device = null; l = null; core = null; client = null; connected = false;
  // Reset UI state.
  serialBtn.textContent = "Connect via Serial (USB)";
  bleBtn.textContent = "Connect via BLE (WebHID)";
  serialBtn.disabled = false; bleBtn.disabled = false;
  unlockBtn.hidden = true; unlockBtn.disabled = false;
}
```

Key points:

- Close the link before nulling the client reference. This ensures the parked
  `next_event()` pump rejects with `Disconnected` and exits its loop.
- Nulling `client` drops the `RynkClient`, which drops `WasmTransport`, which
  calls `link.close()` again via `spawn_local`. This is safe because `close()`
  is idempotent.
- The `connectVia` wrapper calls `teardown()` in its `catch` block too, so a
  failed connect attempt releases the transport for the next retry.

## Recipe: Topic Pump Loop

The topic pump mirrors the native `Client::next_event()` pull. It runs in a
`for (;;)` loop until `next_event()` rejects:

```js
async function pumpTopics(c) {
  try {
    for (;;) log("topic " + JSON.stringify(await c.next_event()));
  } catch {
    // Disconnected/closed — teardown owns the UI reset.
  }
}
```

Source: `rynk/rynk-wasm/index.html`, lines 65-71.

The pump is fire-and-forget (not awaited) — it runs concurrently with the rest
of the page. When the link closes, `next_event()` rejects with `Disconnected`
and the `catch` block exits silently. The `teardown()` function (called
separately) owns the UI reset, so the pump does not need to touch the DOM.

Do not issue client requests from inside the pump loop — that would violate the
single-borrow rule (the pump holds `&mut self` across the `next_event()` await).
If you need to react to a topic, set a flag and handle it outside the pump, or
let the pump finish its current `next_event()` before issuing the request.
