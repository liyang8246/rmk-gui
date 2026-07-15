# Serial (USB CDC)

Source: `rynk/rynk-serial/src/lib.rs`

## Overview

`rynk-serial` is a USB CDC-ACM serial transport for the Rynk host library,
built on [`tokio-serial`](https://docs.rs/tokio-serial). It discovers Rynk
keyboards by the `RYNK_SERIAL_MAGIC` marker — the string `"rynk:"` — that the
firmware prepends to the USB serial number. This is an immutable tag the
firmware emits regardless of the user-configured VID or serial string, so a host
can pick Rynk keyboards out of all serial ports without probing every device.

The marker is the serial transport's counterpart to BLE's service UUID: it
identifies a device as Rynk before connecting.

## Discovery

`SerialDevice::discover()` lists the USB CDC ports whose serial number carries
the magic marker, returning one `SerialDevice` per keyboard.

```rust
pub async fn discover() -> Result<Vec<SerialDevice>, RynkHostError>
```

Discovery deliberately never opens a port. The OS caches the serial string at
USB enumeration time, so the marker can be read on Windows, macOS, and Linux
without touching the device. This matters because opening a CDC port toggles
DTR, which resets some MCUs — only the device the user picks is opened, exactly
once, during `connect()`.

### macOS deduplication

macOS exposes a single USB CDC device as both `/dev/cu.*` and `/dev/tty.*`.
`rynk_serial_ports()` keeps only the `cu.*` node so the picker does not list the
same keyboard twice. Other platforms have no `cu.*` sibling, so the filter is a
no-op there.

## SerialDevice

```rust
pub struct SerialDevice {
    pub path: String,
    pub name: Option<String>,
}
```

| Field  | Type             | Description                                      |
|--------|------------------|--------------------------------------------------|
| `path` | `String`         | Port path (e.g. `/dev/cu.usbmodem`, `COM3`).    |
| `name` | `Option<String>` | USB product string from the device descriptor, if it carried one. |

### Methods

- **`label()`** — returns the USB product name, falling back to the port path
  when the descriptor carried none. This is the display label a device picker
  shows.
- **`open()`** — opens the port at 115200 baud, then clears the input buffer
  (`ClearBuffer::Input`) to discard stale bytes left over from a prior session.
  A device unplugged since discovery surfaces as a normal `RynkHostError`.

### Why 115200?

```rust
const CDC_BAUD_RATE: u32 = 115_200;
```

USB CDC-ACM devices ignore the baud rate — it is required by the serial API but
has no effect on the USB endpoint. The constant exists only to satisfy the
`tokio_serial::new` builder.

## SerialTransport

```rust
pub struct SerialTransport {
    io: FromTokio<SerialStream>,
}
```

`SerialTransport` wraps `embedded_io_adapters::tokio_1::FromTokio<SerialStream>`,
adapting a `tokio-serial` stream to Rynk's `Read + Write` traits. Dropping the
owning `Client` ends the Rynk session only; the keyboard stays connected and
usable.

```rust
impl rynk::io::ErrorType for SerialTransport {
    type Error = std::io::Error;
}

impl Read for SerialTransport { /* delegates to self.io.read */ }
impl Write for SerialTransport { /* delegates to self.io.write; flush is a no-op */ }
```

## RynkDevice Implementation

`SerialDevice` implements `RynkDevice`:

```rust
impl RynkDevice for SerialDevice {
    type Transport = SerialTransport;

    fn label(&self) -> String { /* product name or port path */ }

    async fn open(self) -> Result<SerialTransport, RynkHostError> { /* open + clear */ }
}
```

- `type Transport = SerialTransport` — the byte link `Client::connect` consumes.
- `open()` opens the port and clears the input buffer. A device unplugged since
  discovery surfaces as a normal `RynkHostError`, not a panic.

The full connect flow (`label` → `open` → `connect`) is driven by the
`RynkDevice` trait; see [Architecture](../rynk/architecture.md).

## Native Only

This crate is native-only (not WASM). It depends on `tokio-serial` and the
`embedded-io-adapters` `tokio-1` feature, neither of which target
`wasm32-unknown-unknown`. For browser serial access, use
[rynk-wasm Web Serial](../rynk-wasm/js-byte-link.md).

## Example

From `rynk/README.md` — discover marked Rynk keyboards, pick one, and open it
(the handshake runs inside `connect`):

```rust,no_run
# async fn run() -> Result<(), Box<dyn std::error::Error>> {
// Discover marked Rynk keyboards, pick one, and open it (the handshake runs
// inside `connect`). `rynk-ble` mirrors this flow.
use rynk::RynkDevice;
use rynk_serial::SerialDevice;
let device = SerialDevice::discover()
    .await?
    .into_iter()
    .next()
    .ok_or("no Rynk keyboard found")?;
let mut client = device.connect().await?;

let caps = *client.capabilities();
println!("{}×{}×{} keymap", caps.num_layers, caps.num_rows, caps.num_cols);

let key = client.get_key(0, 0, 0).await?;
println!("L0(0,0) = {key:?}");
# Ok(()) }
```

`rynk-ble` mirrors this flow; see [BLE (GATT)](./ble.md).
