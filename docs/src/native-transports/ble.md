# BLE (GATT)

Source: `rynk/rynk-ble/src/lib.rs`

## Overview

`rynk-ble` is a BLE GATT transport for the Rynk host library, built on
[`bluest`](https://docs.rs/bluest). A Rynk keyboard is identified by its service
UUID (`RYNK_SERVICE_UUID`), not its user-settable BLE name — the counterpart to
the serial transport's serial magic marker. The service UUID is defined by the
firmware and is not user-configurable, so it reliably identifies a Rynk keyboard
regardless of what the user named it.

## GATT Service & Characteristics

| Constant               | Value                                          | Role                              |
|------------------------|------------------------------------------------|-----------------------------------|
| `RYNK_SERVICE_UUID`    | `0x10900067_537f_4f0a_9b55_929e271f61ab`       | Rynk GATT service (root).         |
| `RYNK_INPUT_CHAR_UUID`  | `0x80f9319b_0c74_43a5_9738_c59d6dda3db9`       | `input_data` characteristic (notifications). |
| `RYNK_OUTPUT_CHAR_UUID` | `0x19802524_6f90_4346_93c2_63dbc509ab55`       | `output_data` characteristic (GATT writes). |
| `RYNK_BLE_CHUNK_SIZE`  | `244`                                          | Largest single GATT write/notification. |

The input characteristic carries firmware-to-host data as notifications; the
output characteristic carries host-to-firmware data as GATT writes.

## Discovery

`BleDevice::discover()` lists already-connected devices exposing the Rynk
service UUID — no scan, no attach.

```rust
pub async fn discover() -> Result<Vec<BleDevice>, RynkHostError>
```

Discovery requires Bluetooth permission. A denied or powered-off adapter hangs
inside `wait_available` rather than erroring, so the host should ensure
Bluetooth is available before calling.

```rust
pub struct BleDevice {
    pub name: Option<String>,
    adapter: Adapter,
    device: Device,
}
```

`BleDevice` holds cheap `bluest` handles, not a live session. `connect()`
performs the first attach.

- **`id()`** — returns a stable `DeviceId` picker key. Unlike the BLE name,
  which may be absent or shared across devices, the ID is unique and stable.

## Connect Flow

`BleDevice::open()` (the `RynkDevice` implementation) performs three bounded
steps:

1. **`adapter.connect_device(&device)`** — bounded by a 5-second timeout
   (`GATT_TIMEOUT`). GATT steps carry no inherent timeout, so a radio-silent
   device would otherwise pend forever.
2. **`discover_characteristic()`** — finds the input and output characteristics
   inside the Rynk service. Missing service or characteristics return
   `DeviceNotFound`.
3. **`attach()`** — subscribes to the input characteristic notifications:
   - The generator owns the input characteristic and the `notify()` borrow
     inside one pinned state machine — no self-referential struct, no leak, no
     background task.
   - A synthetic empty first chunk acks that the subscription is live;
     consuming it here means `attach` returns only once subscribed, which is
     the order the firmware needs before the client's first write.
   - Blocks on the readiness ack (bounded 5s). A silent device that never acks
     returns `Disconnected` or an I/O timeout error.

A failure at any step means the device is gone or is not a Rynk keyboard.

## BleTransport

```rust
pub struct BleTransport {
    output: Characteristic,
    input: BoxStream<'static, Vec<u8>>,
    write_chunk: usize,
    pending: Vec<u8>,
    pos: usize,
    name: Option<String>,
    _adapter: Adapter,
}
```

### Write side

- **`output: Characteristic`** — the write side uses acknowledged GATT writes.
- **`write_chunk`** — clamped to `[BLE_SAFE_WRITE=20, RYNK_BLE_CHUNK_SIZE=244]`,
  using the characteristic's advertised `max_write_len_async` (falling back to
  20, the ATT-minimum MTU payload).
- **`write()`** — one GATT write per call, acknowledged. A dropped chunk would
  desync the firmware's reassembler, so writes are not fire-and-forget.

### Read side

- **`input: BoxStream`** — the read side is an async generator yielding
  notification chunks. The `notify()` borrow stays inside one pinned state
  machine; dropping the transport unsubscribes (bluest's guard runs) and frees
  the characteristic.
- **`read()`** — yields notification chunks. When the generator ends (notify
  error or disconnect), `read()` returns `0` (EOF), which surfaces as
  `Disconnected` in the client.
- **`pending` / `pos`** — holds a notification chunk larger than one `read`
  buffer across reads.

### Metadata

- **`device_name()`** — returns the connected keyboard's BLE name, if it
  advertised one.
- **`_adapter`** — holds a clone of the adapter so the GATT connection (owned by
  the central) outlives the `BleDevice`.

## Native Only

This crate is native-only (not WASM). `bluest` cannot run in a browser. For
browser BLE, see [rynk-wasm WebHID](../rynk-wasm/js-byte-link.md) — a pure
browser cannot reach Rynk's custom 128-bit GATT service on an OS-bonded
keyboard, so `rynk-wasm` uses WebHID over the existing OS HID link instead.

## RynkDevice Implementation

```rust
impl RynkDevice for BleDevice {
    type Transport = BleTransport;

    fn label(&self) -> String { /* BLE name or DeviceId fallback */ }

    async fn open(self) -> Result<BleTransport, RynkHostError> { /* connect + discover + attach */ }
}
```

`open()` connects, discovers characteristics, and subscribes — once, no retry.
A failure means the device is gone or isn't a Rynk keyboard.

The full connect flow mirrors the serial transport; see
[Serial (USB CDC)](./serial.md).
