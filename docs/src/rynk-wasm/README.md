# Rynk-WASM Overview

`rynk-wasm` is the browser-facing Rynk host client. It compiles the typed
`rynk::Client` protocol layer to WebAssembly and exposes a `RynkClient` API to
JavaScript. This crate is the core of `rmk-gui` — every configuration and status
call the application makes flows through it.

The browser page owns browser transports such as WebUSB and WebHID. The wasm
package owns the Rynk protocol state machine.

## Architecture

```text
WebUSB / WebHID / another browser transport
        -> JsByteLink { label, send, recv }
        -> transport::WasmReader / WasmWriter
        -> rynk::Client + rynk::Driver
        -> RynkClient methods exposed to JavaScript
```

This split is intentional: browser permissions, chooser UI, stream locks, and
hot-plug events stay in JS, while request/response typing, topic handling, and
protocol validation stay in Rust. The boundary between the two is a narrow
byte-stream interface (`JsByteLink`) that any browser transport can implement —
the already-open link itself is the web transport's `RynkDevice`.

## Prerequisites

- A Chromium browser such as Chrome or Edge. WebUSB and WebHID are not
  available in Firefox or Safari.
- Wasm target: `rustup target add wasm32-unknown-unknown`
- Packager: `cargo install wasm-pack`

## Build & Serve

```bash
cd rynk/rynk-wasm
wasm-pack build --target web        # emits ./pkg/ with generated JS and .d.ts files
python3 -m http.server 8000         # localhost is a secure context for WebUSB / WebHID
```

Open Chrome or Edge at `http://localhost:8000` and use `index.html` as the
reference shell — it connects via Web Serial (USB) or WebHID (BLE); `rmk-gui`'s
own WebUSB and WebHID links live in `src/rynk/web.ts`. `localhost` is a secure
context, which these APIs require — an IP address will not work.

Upstream CI runs the same package build so binding generation is checked
without committing generated files. In `rmk-gui`,
`scripts/build-rynk-wasm.py` runs this build and vendors the resulting `pkg/`
into `src/rynk/wasm/`, preferring a local RMK checkout (`RMK_REPO` or the
sibling `../rmk`) and otherwise downloading the published crate source for the
pinned version.

## TypeScript Declarations

`wasm-pack` generates `.d.ts` declarations alongside the JS glue in `pkg/`. The
generated types are precise:

- Every request argument and response of the `endpoints!` methods (see
  [RynkClient API](./client.md)) is a tsify wire type, so each maps to a
  concrete TypeScript type — no `JsValue` or `any` in the method signatures.
  (`connect(link)` is the exception: `JsByteLink` is a JS-defined extern type,
  typed `any`.)
- wasm-bindgen marshals the tsify wire types across the wasm ABI.
- Errors convert to JS `Error` objects via `RynkHostError: Into<JsValue>`, with
  stable `name` values such as `Disconnected`, `Rejected`, and `Unsupported`.

## Minimal Usage

Import the generated wasm package, create a JS byte link, connect it, then call
typed client methods:

```js
import init, { connect } from './pkg/rynk_wasm.js'

await init()

const link = await openUsbByteLink()
const client = await connect(link)

console.log('protocol', await client.get_version())
console.log('capabilities', await client.get_capabilities())
console.log('current layer', await client.get_current_layer());

// Pull topic pushes (layer changes, WPM, ...) until the link closes.
(async () => {
  try { for (;;) console.log('topic', await client.next_topic()) }
  catch (e) { console.log('disconnected:', e.message) }
})()

// Disconnect by closing the byte link; the topic loop above then ends.
await link.close()
```

The object passed to `connect(link)` only needs this shape (the `JsByteLink`
interface):

```js
{
  label: 'My Keyboard',   // string shown in logs and device pickers
  async send(bytes) {
    // Uint8Array from wasm -> browser transport
  },
  async recv() {
    // Browser transport -> Uint8Array for wasm.
    // Return an empty Uint8Array only when the link is closed.
  },
}
```

The page owns the link's lifetime: it opens the link before `connect` and
closes it on teardown. `rynk-wasm` never calls a `close()` method — the
`link.close()` above is the page's own teardown API, not part of the
`JsByteLink` contract.

Every `RynkClient` method is `&self`, so the parked topic loop and up to four
request calls run concurrently, full-duplex, with replies matched back by
sequence number.

A topic pump loop drives `next_topic()` in a `for (;;)` loop until the
await rejects with `Disconnected`. This mirrors the native
`Client::next_topic()` pull:

```js
async function pumpTopics(client) {
  try {
    for (;;) console.log('topic', await client.next_topic())
  }
  catch {
    // Disconnected/closed — teardown owns the UI reset.
  }
}
```

See [Lifecycle](./lifecycle.md) for the full connect/disconnect teardown
pattern.

## Crate Structure

The crate is `#![cfg(target_arch = "wasm32")]` — native targets compile an
empty crate. Four source files make up the package:

- `src/lib.rs` — Crate root gated to `wasm32`. Declares the `catalog`,
  `client`, and `transport` modules. The `#[wasm_bindgen(start)]` `init()`
  function sets the panic hook (`console_error_panic_hook`) and initializes
  `console_log` at `Debug` level.
- `src/client.rs` — `RynkClient` exposed via `#[wasm_bindgen]`. Contains the
  `connect()` entry point, `next_topic()`, and the `endpoints!` macro that
  generates the typed request methods from the native client shape. With no
  resident task to pump the `Driver`, the in-flight calls elect one via
  `RynkClient::drive`.
- `src/transport.rs` — `JsByteLink` (the JS-owned byte link as an extern type)
  implements `RynkDevice`; its `open()` hands out the `WasmReader` /
  `WasmWriter` halves that adapt `send`/`recv` to the `rynk::io::Read` /
  `Write` traits, parking in-flight `recv()` and `send()` promises so
  cancelled reads and writes resume them instead of starting duplicates.
- `src/catalog.rs` — The keycode tables, handed to JS whole
  (`all_hid_keycodes`, `hid_keycode_values`, `all_consumer_keys`,
  `all_system_control_keys`), so a host can iterate every keycode the firmware
  understands instead of keeping its own copy.

Dependencies (from `Cargo.toml`): `rynk` (with the `wasm` feature),
`embassy-futures`, `embassy-sync`, `wasm-bindgen`, `wasm-bindgen-futures`,
`js-sys`, `console_error_panic_hook`, `console_log`, and `log`.

## Where to Go Next

- [RynkClient API](./client.md) — every method, the `endpoints!` macro, and JS
  error names
- [Wasm Transport](./transport.md) — how `JsByteLink` becomes the
  `Read`/`Write` halves
- [Lifecycle](./lifecycle.md) — connect flow, cancelled calls, topic
  overflow, reconnect
- [JS Byte Link Implementations](./js-byte-link.md) — WebUSB and WebHID
  reference code
