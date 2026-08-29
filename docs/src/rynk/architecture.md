# Architecture

Rynk's architecture separates protocol logic, transport I/O, and device
lifecycle into distinct layers. This separation is what lets the same client
run over raw USB, BLE GATT, and browser transports.

## Three-Layer Split

### Layer 1: Protocol Session (`rynk::Client` + `rynk::Driver<R, W>`)

The protocol layer is a pair created together by `RynkDevice::connect`: the
`Client` is the protocol surface (typed requests plus the topic stream), and
the `Driver` is the byte pump that owns the transport halves:

```rust
pub struct Client {
    message: Channel<CS, FrameBytes, 1>,     // encoded requests waiting for the writer
    slots: [Slot; MAX_IN_FLIGHT],            // in-flight requests; replies delivered by SEQ
    free: Channel<CS, usize, MAX_IN_FLIGHT>, // free slot indices; extra callers wait here
    topics: Channel<CS, TopicEvent, TOPIC_QUEUE_CAPACITY>, // queued topic pushes
    next_seq: AtomicU8,                      // request sequence number (1..=255)
    capabilities: DeviceCapabilities,        // cached at handshake
}

pub struct Driver<R: Read, W: Write> {
    reader: R,
    writer: W,
    buf: Vec<u8>,  // receive buffer; frames are cut out of it in place
    df: Deframer,  // finds COBS frame boundaries across arbitrary read chunks
}
```

Source: `rynk/src/driver.rs` (`Client`, `Driver`)

The **client** owns:
- **SEQ correlation** — assigns a sequence number per request (cycling
  `1..=255`; 0 marks a free slot). Up to `MAX_IN_FLIGHT` = 4 requests run
  concurrently (1 on no-alloc builds); replies are matched back by SEQ, so
  they may complete in any order. Callers beyond the pool wait on the
  free-list for a slot instead of flooding the device.
- **Request encoding** — each request is encoded into its own frame, capped
  by the device's advertised `max_payload_size`; an oversized request fails
  as `RynkHostError::Encode` and never reaches the link.
- **Topic queueing** — decoded topic pushes are buffered in a bounded queue
  (`TOPIC_QUEUE_CAPACITY` = 8, oldest dropped on overflow) and drained by
  `next_topic()`.

The **driver** owns:
- **Framing** — reassembles arbitrary chunk boundaries from `read()` into
  whole frames (the `Deframer` resyncs at the next `0x00` delimiter after
  any garbage) and `write_all`s outgoing frames — preceded by a lone `0x00`
  on startup, so stale bytes in the peer's receive buffer end as garbage
  instead of merging with the first request.
- **Link lifecycle** — `Driver::run` pumps both directions until the link
  dies, then returns the error that ended it.

Every `Client` method takes `&self`, so one shared client serves concurrent
request calls and a topic loop at the same time — no background task inside
the crate; the driver is the only thing that touches the transport. There is
no in-band death signal: a call parked on a dead session never finishes on
its own, so run `driver.run(&client)` in the same `select` as everything that
awaits on the `Client` — when the driver returns, the `select` exits and
drops the session, cancelling any parked request or `next_topic()` call.
Cancelling an individual call is safe: its slot is freed on drop and a late
reply is dropped as unmatched.

### Layer 2: Transport

A transport supplies the link's read and write halves — `RynkDevice::open()`
hands out `(Self::Read, Self::Write)` implementing `embedded-io-async`
`Read` / `Write` (re-exported as `rynk::io`, so the trait version always
matches). The pump relies on:

- **Writes deliver without flush** — the driver never calls `flush()`. A
  successful `write` MUST commit the returned bytes. On a lossy medium (BLE),
  use acknowledged writes; a lost chunk desyncs the firmware's reassembler
  with no mid-frame resync.
- **`read()` may return arbitrary chunk boundaries** — the driver reassembles
  frames. `Ok(0)` means the link is gone and surfaces as
  `RynkHostError::Disconnected` from `Driver::run`.
- **Reads must be cancel-safe** — a read cancelled before completion consumes
  nothing; the session `select` (and wasm's per-call pumping) cancels the
  pump freely.
- **Writes must be cancel-safe** — a cancelled `write` whose bytes are still
  going out must finish before the next one starts, or the two interleave
  into a frame the firmware can only discard.

Source: `rynk/src/lib.rs` (Transport contract)

### Layer 3: Device Lifecycle (`RynkDevice` trait)

`RynkDevice` abstracts the lifecycle common to every transport:

```rust
pub trait RynkDevice: Sized {
    /// The device→host half of the byte link this device opens.
    type Read: Read;
    /// The host→device half of the byte link this device opens.
    type Write: Write;

    /// Display text for a device picker (serial path / BLE name).
    fn label(&self) -> String;

    /// Open the link without handshaking. Consumes the handle:
    /// an open link is one session.
    async fn open(self) -> Result<(Self::Read, Self::Write), RynkHostError>;

    /// Connect: open the link + complete the Rynk handshake.
    async fn connect(self) -> Result<(Client, Driver<Self::Read, Self::Write>), RynkHostError> {
        /* open(), then handshake over the normal pumps — see Handshake Flow */
    }
}
```

Source: `rynk/src/device.rs` (`RynkDevice`)

The trait covers only what is universal: `label`, `open`, and `connect` (the
default, which opens the link and handshakes into a live `Client` + `Driver`
pair). Discovery is deliberately **not** part of the trait — enumerating USB
ports, listing BLE services, and driving a browser chooser share no
signature, so each transport exposes its own `discover()`.

| Transport | Discovery | Link |
|-----------|-----------|------|
| `rynk-usb` | `UsbDevice::discover()` — match the vendor interface class triple | `UsbReader` / `UsbWriter` (nusb bulk halves) |
| `rynk-ble` | `BleDevice::discover()` — list already-connected devices by service UUID | `BleReader` / `BleWriter` (bluest GATT) |
| `rynk-wasm` | JS owns discovery (browser chooser) | `WasmReader` / `WasmWriter` (JsByteLink) |

The web transport cannot enumerate from WASM, so it implements `RynkDevice`
without `discover` — JS runs the chooser and hands the already-open link.

## Handshake Flow

`RynkDevice::connect` opens the link, then races the driver against the
handshake — `select(driver.run(&client), handshake(&client))` — so the
handshake rides the normal pumps, and topics arriving meanwhile queue up for
`next_topic()` as usual:

1. **`GetVersion` + `GetCapabilities`, joined** — both requests are sent
   concurrently (they each take an in-flight slot), so the whole handshake
   costs one round trip. The version gate still runs before the capabilities
   are released.
2. **Version gate** — `GetVersion` is frozen across all protocol majors. If
   `version.major != ProtocolVersion::CURRENT.major`, connect returns
   `RynkHostError::VersionMismatch`. A newer minor logs a note but connects.
3. **Capability snapshot** — the `DeviceCapabilities` response is cached on
   the `Client` before it is shared; it drives capability gating
   (`RynkHostError::Unsupported`), outgoing request size limits
   (`max_payload_size`), and bulk page sizes (`max_bulk_keys` for the keymap,
   `max_bulk_items` for combos and morses).

```text
Host                              Firmware
  │── GetVersion (SEQ=1) ────────►│
  │── GetCapabilities (SEQ=2) ───►│   (both in flight — one round trip)
  │◄──────── ProtocolVersion ─────│
  │◄──────── DeviceCapabilities ──│
  │   (major match? → capabilities cached on the Client)
```

Source: `rynk/src/device.rs` (`RynkDevice::connect`, `handshake`)

## Frame Routing

A frame is a 3-byte header (`CMD u16 LE | SEQ u8`) plus a postcard payload;
on the wire it is COBS-encoded and ends with a `0x00`, so after any garbage
the stream finds the next frame boundary again on its own. The driver routes
each inbound frame by the topic bit in its CMD:

```text
SEND   request() → encode (COBS) → message channel → Driver: write_all

RECV   transport → read (arbitrary chunks) → Deframer cuts whole frames
       then route each frame by its header:

         topic   CMD high bit set (0x8000+)   → topic queue (drained by next_topic)
         reply   SEQ matches an in-flight slot → returned by that request()
         stale   no slot waits on this SEQ     → dropped
```

Source: `rynk/src/driver.rs` (module docs, `Driver::run`)

## Runtime Freedom

The core `rynk` crate has no async runtime. `RynkDevice::connect` carries no
handshake timeout — a silent peer would hang here. Callers that need a bound
wrap it in their runtime's timeout:

```rust
// Native (tokio)
let (client, driver) = tokio::time::timeout(
    Duration::from_secs(5),
    device.connect(),
).await??;
```

The BLE transport (`rynk-ble`) internally bounds its GATT connect/discovery/
subscribe steps. The web transport inherits whatever timeout the JS byte link
provides.
