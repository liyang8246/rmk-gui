# Rynk Overview

Rynk is RMK's native host-communication protocol. It enables a host application
to read and write a running keyboard's configuration — keymap, combos, forks,
morse, macros, behavior — and observe live status, all over a byte-stream link.

## Design Philosophy

Rynk is built around three core principles:

### 1. Runtime-Free Core

The `rynk` crate (the protocol client) depends only on `embedded-io-async`
traits — no `tokio`, no `embassy`, no async runtime. A transport crate
implements `Read + Write`, hands the link to `Client::connect`, and the client
drives the protocol. This means the same protocol logic works on native
desktop, embedded `no_std`, and `wasm32`.

### 2. Shared Typed Command Table

Both the firmware and host compile against a single command table in
`rmk-types::protocol::rynk::command`. Each command (`Cmd`) is bound to its
request and response payload types at compile time via the `Endpoint` trait.
Topic pushes (server→host) are similarly typed via the `Topic` trait. The two
ends of the wire can never disagree about a message's types.

### 3. Transport-Agnostic Byte Link

All transports — USB serial, BLE GATT, browser Web Serial/WebHID — present the
same `embedded-io-async` `Read + Write` interface to the client. The
`RynkDevice` trait abstracts the lifecycle common to every transport
(`label` → `open` → `connect`), while discovery remains transport-specific.

## Crate Workspace

```
rynk/
├── src/              # rynk: core protocol client
│   ├── lib.rs        # crate root, re-exports
│   ├── driver.rs     # Client<T>: framing, SEQ correlation, topic queue, lifecycle
│   ├── api.rs        # Typed endpoint methods + topic decoding
│   ├── device.rs     # RynkDevice trait
│   └── layout.rs     # LayoutInfo: compressed blob → typed layout
├── rynk-wasm/        # Browser WASM client (core for rmk-gui)
│   └── src/
│       ├── lib.rs    # wasm32-gated crate root, init()
│       ├── client.rs # RynkClient: #[wasm_bindgen] API + endpoints! macro
│       ├── device.rs # WebDevice: RynkDevice for browser
│       └── transport.rs # WasmTransport: JsByteLink → Read/Write
├── rynk-serial/      # USB CDC-ACM serial transport (native)
├── rynk-ble/         # BLE GATT transport (native)
└── rynk-kle/         # KLE/Vial layout conversion (native + wasm)
```

## Protocol at a Glance

- **Wire format**: 5-byte header (`CMD u16 LE | SEQ u8 | LEN u16 LE`) + postcard-encoded payload
- **Commands**: `0x0000–0x7FFF` request/response; `0x8000–0xFFFF` topic (server→host push)
- **Serialization**: [postcard](https://github.com/jamesmunns/postcard) (compact binary serde)
- **Responses**: wrapped in `Result<T, RynkError>` envelope
- **Versioning**: `GetVersion` handshake; major mismatch = hard reject, minor = informational
- **Topics**: best-effort push, pull-based delivery via `next_event()`

## Data Flow

```text
Host Application
    │
    ├── rynk-wasm (browser) ─── JsByteLink ─── Web Serial / WebHID
    ├── rynk-serial (native) ── SerialTransport ── USB CDC-ACM
    └── rynk-ble (native) ──── BleTransport ──── BLE GATT
    │
    └──► Client<T: Read + Write> ──► Rynk Protocol ──► RMK Firmware
```

The host application chooses a transport, discovers a Rynk keyboard, opens the
link, and hands it to `Client::connect()`. The handshake negotiates the
protocol version and caches device capabilities. Typed methods then drive
request/response round trips, while `next_event()` pulls topic pushes from a
bounded queue.

## Where to Go Next

- [Architecture](./architecture.md) — Client/Transport/Device split, `RynkDevice` trait
- [Protocol & Wire Format](./protocol.md) — framing, commands, topics, errors
- [API Reference](./api-reference.md) — full typed method surface
- [Rynk-WASM Overview](../rynk-wasm/README.md) — the core for this application
