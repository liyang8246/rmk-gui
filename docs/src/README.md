# Introduction

This documentation covers the **Rynk** protocol ecosystem — RMK's native
host-communication protocol for configuring and monitoring mechanical keyboard
firmware at runtime.

The primary audience is developers building applications (such as
**rmk-gui**) that communicate with RMK-powered keyboards. The core focus is
**rynk-wasm**, the browser-facing WASM client that this application depends on,
but all Rynk-related components are documented here for completeness.

## What is Rynk?

Rynk is a lightweight binary protocol that lets a host application read and
write a running RMK keyboard's keymap, combos, forks, morse sequences, macros,
and behavior configuration, and observe live status (layer changes, WPM,
connection state, battery, etc.) — all without reflashing firmware.

The protocol is:

- **Runtime-free** — the core client (`rynk` crate) has no async runtime
  dependency; concrete transports (serial, BLE, WASM) live in separate crates.
- **Typed** — a shared command table (`rmk-types`) binds each command to its
  request/response payload types, so the firmware and host can never disagree
  about a message's shape.
- **Versioned** — a `GetVersion` handshake establishes compatibility; major
  mismatches are hard-rejected, same-major minors connect with a warning.
- **Transport-agnostic** — the same `Client<T>` drives USB serial, BLE GATT,
  and browser (Web Serial / WebHID) transports through a common
  `embedded-io-async` byte-link interface.

## Crate Map

| Crate | Role | Target |
|-------|------|--------|
| `rynk` | Core protocol client: framing, handshake, typed API | `no_std`-compatible |
| `rynk-wasm` | Browser-facing WASM client (wasm-pack) | `wasm32-unknown-unknown` |
| `rynk-serial` | USB CDC-ACM serial transport | native (tokio) |
| `rynk-ble` | BLE GATT transport | native (bluest) |
| `rynk-kle` | KLE/Vial JSON ↔ RMK layout conversion | native + WASM |

## Source Repository

The Rynk source code is available as a cloned dependency at:

```
.slim/clonedeps/repos/HaoboGu__rmk/rynk/
```

All file references in this documentation point to paths within that clone.
