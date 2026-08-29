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
  dependency; concrete transports (USB, BLE, WASM) live in separate crates.
- **Typed** — a shared command table (`rmk-types`) binds each command to its
  request/response payload types, so the firmware and host can never disagree
  about a message's shape.
- **Versioned** — a `GetVersion` handshake establishes compatibility; major
  mismatches are hard-rejected, same-major minors connect (a newer firmware
  minor just logs a note).
- **Transport-agnostic** — the same `Client` + `Driver` pair drives raw USB,
  BLE GATT, and browser (WebUSB / WebHID) transports through common
  `embedded-io-async` `Read`/`Write` byte links.

## Crate Map

| Crate | Role | Target |
|-------|------|--------|
| `rynk` | Core protocol client: framing, handshake, typed API | `no_std`-compatible |
| `rynk-wasm` | Browser-facing WASM client (wasm-pack) | `wasm32-unknown-unknown` |
| `rynk-usb` | Raw-USB vendor bulk transport (nusb) | native (tokio) |
| `rynk-ble` | BLE GATT transport | native (bluest) |
| `rynk-kle` | KLE/Vial JSON ↔ RMK layout conversion | native + WASM |

## Source Repository

Rynk lives in the [RMK repository](https://github.com/rmk-rs/rmk) under
`rynk/`, with the shared protocol types in `rmk-types/`. This documentation
covers the `rynk*` 0.3.0 releases published on crates.io.

File references in this documentation (such as `rynk/src/driver.rs`) are
paths relative to that repository's root.
