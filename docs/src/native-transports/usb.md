# USB (Vendor Bulk)

Source: `rynk/rynk-usb/src/lib.rs`

## Overview

`rynk-usb` is a raw-USB transport for the Rynk host library, built on
[`nusb`](https://docs.rs/nusb) (pure Rust, async, no libusb). It talks to the
firmware's vendor bulk interface and recognises Rynk keyboards by the interface
class triple the firmware advertises:

```rust
// rmk-types::protocol::rynk
pub const RYNK_USB_INTERFACE_CLASS: u8 = 0xFF;
pub const RYNK_USB_INTERFACE_SUBCLASS: u8 = 0x52;
pub const RYNK_USB_INTERFACE_PROTOCOL: u8 = 0x52;
```

The triple is the USB counterpart to BLE's service UUID: it identifies a device
as Rynk before connecting, independent of the user-configured VID/PID. There is
no serial port, so nothing an OS serial driver or another tool can sit on, and
no DTR to reset an MCU.

## Discovery

```rust
pub async fn discover() -> Result<Vec<UsbDevice>, RynkHostError>
```

`UsbDevice::discover()` walks `nusb::list_devices()` and keeps every device
carrying the vendor interface — one `UsbDevice` per keyboard. Enumeration reads
cached descriptors and never opens a device; the chosen device is opened once,
by `connect()`.

### Identity

`UsbDevice::id()` returns the `nusb::DeviceId` — stable across enumerations
while the keyboard stays plugged in. It plays the role the serial transport's
port path used to: a picked entry is matched back to a fresh `discover()` list
at connect time.

## RynkDevice Implementation

```rust
impl RynkDevice for UsbDevice {
    type Read = UsbReader;
    type Write = UsbWriter;

    fn label(&self) -> String { /* product string, or "USB vvvv:pppp" */ }

    async fn open(self) -> Result<(UsbReader, UsbWriter), RynkHostError> {
        /* open → claim vendor interface → resolve the bulk endpoint pair */
    }
}
```

- **`label()`** — the USB product string, falling back to the numeric ids when
  the descriptor carried none. Available before connecting, so a picker can
  name even a keyboard that will fail the handshake.
- **`open()`** — opens the device, claims the vendor interface, and finds its
  bulk IN/OUT endpoints. A device unplugged since discovery surfaces as a
  normal `RynkHostError`.

## The Halves

- **`UsbReader`** — `nusb`'s `EndpointRead` transfer pump behind the
  `embedded-io` tokio adapter, reading 4096-byte transfers (a whole Rynk frame,
  and a multiple of both Full- and High-Speed packet sizes). Zero-length
  packets — the firmware's transfer delimiters — are absorbed by the pump.
- **`UsbWriter`** — one bulk transfer per `write`, awaited to completion. The
  Rynk driver never flushes, so a buffering writer that submits only full
  transfers would strand frames.

Dropping the halves (with the owning session) ends the Rynk **session** only:
the keyboard stays connected and usable.

## Native Only

This crate is native-only (not WASM). Browsers reach the same vendor interface
through WebUSB — rmk-gui's `WebUsbLink` speaks to it with the same class-triple
filter.

## Example

```rust,no_run
# async fn run() -> Result<(), Box<dyn std::error::Error>> {
use rynk::RynkDevice;
use rynk_usb::UsbDevice;
let device = UsbDevice::discover()
    .await?
    .into_iter()
    .next()
    .ok_or("no Rynk keyboard found")?;
let mut client = device.connect().await?;

let caps = *client.capabilities();
println!("{}×{}×{} keymap", caps.num_layers, caps.num_rows, caps.num_cols);
# Ok(()) }
```

`rynk-ble` mirrors this flow; see [BLE (GATT)](./ble.md).
