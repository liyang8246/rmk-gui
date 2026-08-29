# Integration with rmk-gui

Source: `rynk/rynk-wasm/README.md`, `rynk/rynk-wasm/index.html`

## Overview

rmk-gui integrates `rynk-wasm` as its core communication layer with RMK
keyboards. The split is deliberate: the browser/Tauri page owns the transport
(WebUSB or WebHID), and `rynk-wasm` owns the protocol state machine.
Browser permissions, chooser UI, stream locks, and hot-plug events stay in JS;
request/response typing, topic handling, and protocol validation stay in Rust.

The reference implementation is `rynk/rynk-wasm/index.html` — study it as the
canonical example before building rmk-gui's integration layer.

## Architecture

```text
rmk-gui (Tauri/Svelte)
  │
  ├── User gesture → navigator.usb.requestDevice() / navigator.hid.requestDevice()
  ├── JsByteLink { label, send, recv } — owns browser transport
  ├── rynk-wasm pkg (wasm-pack output)
  │   ├── connect(link) → RynkClient
  │   ├── Typed methods (get_key, set_key, get_layout, etc.)
  │   └── next_topic() → TopicEvent (layer changes, WPM, etc.)
  └── Topic pump loop → UI state updates
```

The object passed to `connect(link)` only needs this shape:

```js
{
  label: "My keyboard", // display name; rynk-wasm reads it, never sets it

  async send(bytes) {
    // Uint8Array from wasm -> browser transport
  },
  async recv() {
    // Browser transport -> Uint8Array for wasm.
    // Return an empty Uint8Array only when the link is closed.
  },
}
```

Closing the link is the page's job: `rynk-wasm` never calls a `close` method
and does not require one. Give the link your own `close()` and call it on
every exit path — including a rejected `connect()` — releasing the device and
waking any pending `recv()`, which then returns the EOF empty array.

## Connect Recipe

The connect flow must begin inside a user gesture (button click) because
WebUSB and WebHID both require one for `requestDevice()`.

1. **User clicks connect button** (user gesture required for WebUSB/WebHID).
2. **Open browser transport, create `JsByteLink`** with its `label` set.
3. **(Optional) Probe version:** `link.probeVersion()` returns `{ major, minor }`.
   Any pre-`connect()` probing must finish before `connect()` — only
   `rynk-wasm` may call `recv()` afterwards.
4. **Load version-matched wasm:** `loadCore(major)` dynamically imports
   `./pkg/rynk_wasm.js`.
5. **Wasm init:** `await core.default()` — runs `wasm-bindgen` init (idempotent).
6. **Connect:** `await core.connect(link)` — handshake, returns `RynkClient`.
   The client carries no display name; keep showing `link.label`.
7. **Cache capabilities:** `await client.get_capabilities()` — gate UI on the
   result.

```js
l = await openLink() // sets l.label from the chooser / device.productName
const { major, minor } = await l.probeVersion()
core = await loadCore(major)
await core.default()
client = await core.connect(l)
const caps = await client.get_capabilities()
```

## Capability-Based UI Gating

Use the `get_capabilities()` result to show or hide UI sections. A capability
flag tells you whether a feature exists on this keyboard; calling a method
gated behind a missing capability returns an `Unsupported` error (with
`e.name === "Unsupported"`, nothing sent on the wire), but the link stays
alive — it is not a fatal error.

| Capability                  | `false` means                                          |
|-----------------------------|--------------------------------------------------------|
| `ble_enabled`              | Hide battery, BLE status, BLE profile controls.      |
| `bulk_transfer_supported`  | Use single-key get/set instead of bulk.              |
| `is_split`                 | Hide peripheral status.                               |
| `storage_enabled`           | Hide storage reset.                                   |

The reference implementation maps `Unsupported` to a neutral glyph (not an
error):

```js
async function show(label, fn) {
  try {
    const v = await fn()
    // render value
  }
  catch (e) {
    const kind = (e && e.name) || 'Error'
    // Unsupported -> unavailable (not an error), Rejected -> warning, else error
  }
}
```

## Topic Pump Loop

Topic pushes (layer changes, WPM updates, etc.) are pulled, not delivered by
callback. Drive `next_topic()` in a loop. It parks until the next recognized
topic and rejects with `Disconnected` at EOF. The session is full duplex: the
parked pump loop and request calls run concurrently on the same client.

```js
async function pumpTopics(client) {
  try {
    for (;;) {
      const event = await client.next_topic()
      // Update UI: LayerChange -> highlight layer, WpmUpdate -> WPM display, etc.
    }
  }
  catch (e) {
    // Disconnected — teardown owns UI reset
  }
}
```

The topic queue holds 8 events (`TOPIC_QUEUE_CAPACITY`); when the pump lags,
the oldest event is dropped silently — there is no drop counter. Treat topics
as hints, and re-read critical state via the matching `Get*` snapshot method
whenever the UI must be consistent (e.g. after resuming from a stall).

## Disconnect & Reconnect

### Disconnect

Closing the `JsByteLink` EOFs the transport, which causes `next_topic()` to
reject with `Disconnected`. The teardown sequence:

- Close the link (the page's own `close()` — see above).
- Null the client.
- Reset UI state.
- Re-enable the connect buttons.

```js
async function teardown() {
  if (l) await l.close()
  l = null; core = null; client = null; connected = false
  // reset UI, re-enable connect buttons
}
```

### Auto-reconnect

Use `navigator.usb.getDevices()` and `navigator.hid.getDevices()` to find
previously granted devices. Listen to the `connect` / `disconnect` events on
both APIs:

- **Reconnect when idle** — a `connect` event fires while not connected; try
  the previously granted device.
- **Disconnect on active transport removal** — a `disconnect` event fires
  while connected; tear down the active session.

```js
navigator.usb?.addEventListener?.('connect', () => { if (!connected) autoConnect() })
navigator.hid?.addEventListener?.('connect', () => { if (!connected) autoConnect() })
navigator.usb?.addEventListener?.('disconnect', () => { if (connected) teardown() })
navigator.hid?.addEventListener?.('disconnect', () => { if (connected) teardown() })
```

## Lock Gate UI

Some commands (e.g. `get_matrix_state`) are gated behind a lock. When the
keyboard is locked, these return `Rejected` with `e.name === "Rejected"`.

### Lock states

```js
const status = await client.get_lock_status()
```

- **`status.locked && status.key_positions.length === 0`** — permanently locked.
  The user must set `[host].unlock_keys` in `keyboard.toml` and reflash; there
  is no runtime unlock path.
- **`status.locked && status.key_positions.length > 0`** — show the unlock
  button. The user must hold the listed physical keys.

### Unlock ceremony

Poll `unlock_poll()` every ~150ms while the user holds the challenge keys.
`remaining_keys` counts down; when it reaches `0`, the keyboard is unlocked.

```js
const start = await client.get_lock_status();
if (!start.locked) return; // already unlocked
if (start.key_positions.length === 0) {
  // permanently locked — set [host].unlock_keys in keyboard.toml
  return;
}
for (;;) {
  const s = await client.unlock_poll();
  if (!s.locked) { /* unlocked */ break; }
  // s.remaining_keys counts down
  await new Promise((r) => setTimeout(r, 150));
}
```

The firmware unlock window lapses ~500ms after polls stop. To cancel, simply
stop polling.

## Full Keymap Sync

Use the capability flags to choose the sync strategy:

- **If `bulk_transfer_supported`** — call the whole-resource pagers
  `read_all_keymap()` / `write_all_keymap(actions)`. They page
  `get_keymap_bulk` / `set_keymap_bulk` internally with up to four requests in
  flight (`MAX_IN_FLIGHT` concurrent lanes, not a sequential loop), and return
  or accept a flat `KeyAction` array of length
  `num_layers * num_rows * num_cols` in layer-major, then row, then column
  order. `read_all_combos` / `write_all_combos` and `read_all_morses` /
  `write_all_morses` follow the same pattern, and `get_layout` reads its
  layout-blob pages concurrently the same way.
- **If not** — fall back to per-key `get_key(layer, row, col)` /
  `set_key(layer, row, col, action)`; the bulk endpoints (pagers included)
  return `Unsupported` without sending anything.

Use the capabilities (`num_layers`, `num_rows`, `num_cols`) to iterate the
keymap grid.

## Macro Handling

`get_macro(offset)` always returns exactly `macro_chunk_size` bytes,
zero-filled past the end of macro space. There is never a short final chunk
to signal end-of-data — parse the macro encoding itself for termination, and
iterate `offset` by `macro_chunk_size` until the encoding signals end.

## Reference Implementation

`rynk/rynk-wasm/index.html` is the canonical reference. It demonstrates:

- Version probe flow (`probeVersion` to `loadCore` to `connect`)
- Topic pump loop
- Auto-reconnect via `getPorts()` / `getDevices()`
- Transport-disconnect handling
- Unlock ceremony UI
- Capability-based show/hide of features

Study it before building rmk-gui's integration layer. The `index.html` file
contains a complete WebHID `JsByteLink` (BLE keyboards over the OS HID link:
usage page `0xFF14`, fixed 32-byte reports whose zero padding decodes as empty
COBS frames the Rynk deframer discards). Its Web Serial button is legacy — it
dates from the earlier CDC transport and does not reach current firmware — and
there is no upstream WebUSB link: rmk-gui's WebUSB `JsByteLink` lives in
`src/rynk/web.ts`.
