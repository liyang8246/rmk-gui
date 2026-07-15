# Rynk-WASM Overview

`rynk-wasm` is the browser-facing Rynk host client. It compiles the typed
`rynk::Client` protocol layer to WebAssembly and exposes a `RynkClient` API to
JavaScript. This crate is the core of `rmk-gui` — every configuration and status
call the application makes flows through it.

The browser page owns browser transports such as Web Serial and WebHID. The wasm
package owns the Rynk protocol state machine.

## Architecture

```text
Web Serial / WebHID / another browser transport
        -> JsByteLink { send, recv, close }
        -> transport::WasmTransport
        -> rynk::Client
        -> RynkClient methods exposed to JavaScript
```

This split is intentional: browser permissions, chooser UI, stream locks, and
hot-plug events stay in JS, while request/response typing, topic handling, and
protocol validation stay in Rust. The boundary between the two is a narrow
byte-stream interface (`JsByteLink`) that any browser transport can implement.

## Prerequisites

- A Chromium browser such as Chrome or Edge. Web Serial and WebHID are not
  available in Firefox or Safari.
- Wasm target: `rustup target add wasm32-unknown-unknown`
- Packager: `cargo install wasm-pack`

## Build & Serve

```bash
cd rynk/rynk-wasm
wasm-pack build --target web        # emits ./pkg/ with generated JS and .d.ts files
python3 -m http.server 8000         # localhost is a secure context for Web Serial / WebHID
```

Open Chrome or Edge at `http://localhost:8000` and use `index.html` as the
reference shell. `localhost` is a secure context, which Web Serial and WebHID
require — an IP address will not work.

CI runs the same package build so binding generation is checked without
committing generated files.

## TypeScript Declarations

`wasm-pack` generates `.d.ts` declarations alongside the JS glue in `pkg/`. The
generated types are precise:

- The `endpoints!` macro (see [RynkClient API](./client.md)) uses `tsify` so
  every request body and response type maps to a concrete TypeScript type — no
  `JsValue` or `any` leaks into the declarations.
- Body and response types are tsify wire types, marshalled across the wasm ABI
  by `serde-wasm-bindgen`.
- Errors convert to JS `Error` objects via `RynkHostError: Into<JsValue>`, with
  stable `name` values such as `Disconnected`, `Rejected`, and `Unsupported`.

## Minimal Usage

Import the generated wasm package, create a JS byte link, connect it, then call
typed client methods:

```js
import init, { connect } from "./pkg/rynk_wasm.js";

await init();

const link = await openSerialByteLink();
const client = await connect(link);

console.log("protocol", await client.get_version());
console.log("capabilities", await client.get_capabilities());
console.log("current layer", await client.get_current_layer());

// Pull topic pushes (layer changes, WPM, ...) until the link closes.
(async () => {
  try { for (;;) console.log("topic", await client.next_event()); }
  catch (e) { console.log("disconnected:", e.message); }
})();

// Disconnect by closing the byte link; the topic loop above then ends.
await link.close();
```

The object passed to `connect(link)` only needs this shape (the `JsByteLink`
interface):

```js
{
  async send(bytes) {
    // Uint8Array from wasm -> browser transport
  },
  async recv() {
    // Browser transport -> Uint8Array for wasm.
    // Return an empty Uint8Array only when the link is closed.
  },
  async close() {
    // Release browser resources. Safe to call more than once.
  },
}
```

A topic pump loop drives `next_event()` in a `for (;;)` loop until the
await rejects with `Disconnected`. This mirrors the native
`Client::next_event()` pull used by `rynk-serial` and `rynk-ble`:

```js
async function pumpTopics(client) {
  try {
    for (;;) console.log("topic", await client.next_event());
  } catch {
    // Disconnected/closed — teardown owns the UI reset.
  }
}
```

See [Lifecycle & Dead States](./lifecycle.md) for the full connect/disconnect
teardown pattern.

## Crate Structure

The crate is `#![cfg(target_arch = "wasm32")]` — native targets compile an empty
crate. Four source files make up the package:

- `src/lib.rs` — Crate root gated to `wasm32`. Exports the `client`, `device`,
  and `transport` modules. The `#[wasm_bindgen(start)]` `init()` function sets
  the panic hook (`console_error_panic_hook`) and initializes `console_log` at
  `Debug` level.
- `src/client.rs` — `RynkClient` exposed via `#[wasm_bindgen]`. Contains the
  `connect()` entry point and the `endpoints!` macro that generates the typed
  request methods from the native client shape.
- `src/device.rs` — `WebDevice` implements `RynkDevice`. It wraps an
  already-open `JsByteLink` plus the page-supplied label; `open()` constructs
  the `WasmTransport`.
- `src/transport.rs` — `WasmTransport` adapts `JsByteLink` to the
  `rynk::io::Read` / `Write` traits, buffering received bytes and parking a
  single in-flight `recv()` future.

Dependencies (from `Cargo.toml`): `rynk` (with the `wasm` feature),
`wasm-bindgen`, `wasm-bindgen-futures`, `js-sys`,
`console_error_panic_hook`, `console_log`, `log`, and `serde-wasm-bindgen`.

## Where to Go Next

- [RynkClient API](./client.md) — every method, the `endpoints!` macro, and JS
  error names
- [WasmTransport](./transport.md) — how `JsByteLink` becomes `Read`/`Write`
- [Lifecycle & Dead States](./lifecycle.md) — connect flow, cancelled reads,
  topic overflow, reconnect
- [JS Byte Link Implementations](./js-byte-link.md) — Web Serial and WebHID
  reference code
