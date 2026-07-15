# Architecture

Rynk's architecture separates protocol logic, transport I/O, and device
lifecycle into distinct layers. This separation is what lets the same client
run over USB serial, BLE GATT, and browser transports.

## Three-Layer Split

### Layer 1: Protocol Client (`rynk::Client<T>`)

The `Client` is the protocol state machine. It is generic over any byte link
implementing `embedded-io-async` `Read + Write`:

```rust
pub struct Client<T: Read + Write> {
    transport: T,
    rx_buf: Vec<u8>,           // frame reassembly buffer
    read_scratch: Box<[u8]>,  // per-read scratch
    next_seq: u8,             // request sequence number (1..=255)
    dead: bool,               // link is unrecoverable
    events: VecDeque<TopicFrame>, // queued topic pushes
    capabilities: DeviceCapabilities, // cached at handshake
    // ...
}
```

Source: `rynk/src/driver.rs:135-159`

The client owns:
- **Framing** — reassembles arbitrary chunk boundaries from `read()` into
  complete 5-byte-header + payload frames.
- **SEQ correlation** — assigns a sequence number per request; matches replies
  by SEQ; drops stale replies.
- **Topic queueing** — topic pushes (CMD high bit set) are buffered in a
  `VecDeque` (capacity 64) and drained by `next_event()`.
- **Link lifecycle** — tracks `send_in_flight` / `receive_in_flight` flags;
  a cancelled wire operation latches the link dead.

Requests are serialized through `&mut self` — no background task, no shared
state. Each method borrows the client for one await; the next call must wait.

### Layer 2: Transport

A transport implements `embedded-io-async` `Read + Write` (re-exported as
`rynk::io`). The transport contract is:

- **Writes deliver without flush** — `Client` never calls `flush()`. A
  successful `write` MUST commit the returned bytes. On a lossy medium (BLE),
  use acknowledged writes; a lost chunk desyncs the firmware's reassembler
  with no mid-frame resync.
- **`read()` may return arbitrary chunk boundaries** — the client reassembles
  frames. `Ok(0)` means the link is gone and surfaces as
  `RynkHostError::Disconnected`.
- **Cancelling a read abandons the byte stream** — drop the client and
  reconnect before issuing another operation.

Source: `rynk/src/lib.rs:17-31`

### Layer 3: Device Lifecycle (`RynkDevice` trait)

`RynkDevice` abstracts the lifecycle common to every transport:

```rust
pub trait RynkDevice: Sized {
    type Transport: Read + Write;

    /// Display text for a device picker (serial path / BLE name).
    fn label(&self) -> String;

    /// Open the link without handshaking.
    async fn open(self) -> Result<Self::Transport, RynkHostError>;

    /// Connect: open the link + complete the Rynk handshake.
    async fn connect(self) -> Result<Client<Self::Transport>, RynkHostError> {
        Client::connect(self.open().await?).await
    }
}
```

Source: `rynk/src/device.rs:34-54`

The trait covers only what is universal: `label`, `open`, and `connect` (the
default, which calls `open` then `Client::connect`). Discovery is deliberately
**not** part of the trait — enumerating USB ports, listing BLE services, and
driving a browser chooser share no signature, so each transport exposes its
own `discover()`.

| Transport | Discovery | Link |
|-----------|-----------|------|
| `rynk-serial` | `SerialDevice::discover()` — enumerate USB CDC ports by magic marker | `SerialTransport` (tokio-serial) |
| `rynk-ble` | `BleDevice::discover()` — list already-connected devices by service UUID | `BleTransport` (bluest GATT) |
| `rynk-wasm` | JS owns discovery (browser chooser) | `WasmTransport` (JsByteLink) |

The web transport cannot enumerate from WASM, so it implements `RynkDevice`
without `discover` — JS runs the chooser and hands the already-open link.

## Handshake Flow

`Client::connect(transport)` runs the handshake:

1. **`GetVersion`** — sends `Cmd::GetVersion` (frozen across all protocol
   majors). If `version.major != ProtocolVersion::CURRENT.major`, returns
   `RynkHostError::VersionMismatch`. A newer minor logs a warning but connects.
2. **`GetCapabilities`** — sends `Cmd::GetCapabilities`. The response
   (`DeviceCapabilities`) is cached; it drives capability gating, buffer
   sizing, and bulk page sizes.
3. **TX buffer growth** — grows the reusable TX scratch to the negotiated
   `max_frame_size` (header + `max_payload_size`).

```text
Host                          Firmware
  │── GetVersion (SEQ=1) ─────►│
  │◄── ProtocolVersion ──────│
  │   (major match? → continue) │
  │── GetCapabilities (SEQ=2)─►│
  │◄── DeviceCapabilities ────│
  │   (cached; TX buffer grown)│
```

Source: `rynk/src/driver.rs:191-221`

## Frame Routing

Once connected, every inbound byte stream is reassembled into frames and
routed by the 5-byte header:

```text
RECV   transport → read (arbitrary chunks) → reassemble whole frames
       then route each frame by its header:

         topic   CMD high bit set (0x8000+)  → event queue (drained by next_event)
         reply   SEQ matches our request      → returned by request()
         stale   SEQ from a past request       → dropped
```

Source: `rynk/src/driver.rs:8-20`

## Runtime Freedom

The core `rynk` crate has no async runtime. `Client::connect` carries no
handshake timeout — a silent peer would hang here. Callers that need a bound
wrap it in their runtime's timeout:

```rust
// Native (tokio)
let client = tokio::time::timeout(
    Duration::from_secs(5),
    Client::connect(transport),
).await??;
```

The BLE transport (`rynk-ble`) internally bounds its GATT connect/discovery/
subscribe steps. The web transport inherits whatever timeout the JS byte link
provides.
