# Protocol & Wire Format

Rynk is RMK's native host-communication protocol. It carries RMK's canonical
types (`KeyAction`, `Combo`, `Morse`, `Fork`, `EncoderAction`, `BatteryStatus`,
`BleStatus`) on the wire as a 3-byte fixed header plus a postcard-encoded
payload, COBS-framed. This page documents the wire format, the command table,
frame routing, error handling, and the versioning contract.

Source: `rmk-types/src/protocol/rynk/mod.rs`

## 1. Wire Format

Every Rynk frame is a fixed 3-byte header followed by a variable-length
payload:

```text
┌──────────────┬───────────┐
│ CMD u16 LE   │ SEQ u8    │  ← 3-byte header
├──────────────┴───────────┤
│ postcard-encoded payload │
└──────────────────────────┘
```

### Header fields

| Field | Type       | Description                                                    |
|-------|------------|----------------------------------------------------------------|
| CMD   | `u16` (LE) | Command identifier. `0x0000–0x7FFF` request/response; `0x8000–0xFFFF` topic (server→host push). |
| SEQ   | `u8`       | Sequence number of the current request. Topics always send SEQ = 0. |

There is no length field — framing is COBS's job.

### COBS framing

On the wire the whole frame, header included, is
[COBS](https://en.wikipedia.org/wiki/Consistent_Overhead_Byte_Stuffing)-encoded
and terminated by a single `0x00` delimiter. COBS removes every `0x00` from
the frame body, so the delimiter is unambiguous and the byte stream is
self-synchronizing: after garbage, a truncated frame, or an oversized frame,
the receiver (`Deframer`) skips to the next `0x00` and resyncs. A frame's
length comes from its delimiter, not from a header field.

`encode_frame` streams `header ++ postcard(payload)` through the COBS
encoder; `RynkHeader::peek` decodes just the header out of a still-encoded
frame (used by the dongle to route by CMD without decoding the frame). The
worst-case wire size of a logical frame is
`max_wire_size(frame_size) = frame_size + frame_size / 254 + 2` — the
streaming-COBS code bytes plus the delimiter.

### Serialization

The payload is encoded with [postcard](https://github.com/jamesmunns/postcard),
a compact binary serde format. Postcard is positional, so field order in the
Rust struct directly determines the wire layout.

### Response envelope

Requests are sent as the bare postcard struct — unwrapped. Responses wrap the
payload in a postcard `Result<T, RynkError>`:

- `Ok(value)` — the request succeeded; `value` is the response type (`()` for
  `Set*` commands).
- `Err(rynk_error)` — the firmware rejected the request.

This means a successful response payload is exactly one byte larger than the
bare `T` (postcard's `Result` tag is a single byte); an error reply's payload
is the tag plus the encoded `RynkError`, independent of `T`.

### Sizing

One parameter drives every derived size: `rynk_buffer_size` in
`keyboard.toml` (`constants::RYNK_BUFFER_SIZE`, default 488). It is the
physical RAM of each frame buffer; COBS framing overhead is deducted
internally.

| Constant                | Value   | Meaning                                                  |
|-------------------------|---------|----------------------------------------------------------|
| `RYNK_HEADER_SIZE`      | 3       | Fixed header size.                                        |
| `RYNK_MAX_PAYLOAD_SIZE` | derived | Largest payload one frame can carry: the largest logical frame that COBS-encodes into `RYNK_BUFFER_SIZE` bytes, minus the header. |

Firmware builds assert at compile time that `RYNK_MAX_PAYLOAD_SIZE` covers
the largest payload either the endpoint table or the topic table can produce
(bulk included), so adding a command can never overrun the buffer — the
build fails with an "increase `rynk_buffer_size`" message instead.

Source: `rmk-types/src/protocol/rynk/message.rs` (`RYNK_HEADER_SIZE`,
`RYNK_MAX_PAYLOAD_SIZE`, `max_wire_size`, `encode_frame`), `deframer.rs`
(`Deframer`)

## 2. Command Identifier (Cmd)

`Cmd` is the 16-bit identifier carried in the header CMD field:

```rust
#[repr(transparent)]
#[derive(Copy, Clone, PartialEq, Eq, Hash)]
pub struct Cmd(u16);
```

It is `repr(transparent)` over `u16`, so it has the exact same wire layout as
a raw `u16`.

### Methods

| Method                      | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `Cmd::from_raw(raw: u16)`   | Build a `Cmd` from its raw wire value.                   |
| `Cmd::from_le_bytes([u8; 2])` | Build a `Cmd` from the header's little-endian CMD bytes. |
| `Cmd::raw(self) -> u16`     | Return the raw wire value.                               |
| `Cmd::to_le_bytes(self) -> [u8; 2]` | Return the header's little-endian CMD bytes.   |
| `Cmd::is_topic(self) -> bool` | Returns `true` for topic/unsolicited push CMDs (high bit set). |

### Topic bit

The most significant bit (`0x8000`) marks a topic:

```rust
const RYNK_TOPIC_BIT: u16 = 0x8000;
```

- `0x0000..=0x7FFF` (bit 15 = 0): request/response pairs.
- `0x8000..=0xFFFF` (bit 15 = 1): topics (server → host push).

Source: `rmk-types/src/protocol/rynk/command.rs` (`Cmd`, `RYNK_TOPIC_BIT`)

## 3. Command Table

The `endpoints!` macro defines request/response endpoints. Each row binds a
named `Cmd` to its request and response payload types:

```rust
endpoints! {
    GetVersion = 0x0001: () => ProtocolVersion;
    GetKeyAction = 0x0101: KeyPosition => KeyAction;
    // ...
}
```

The syntax is uniform: `Name = cmd_value: Request => Response;` — there are
no per-row markers. Feature gating is applied with `#[cfg(feature = "_ble")]`
and `#[cfg(feature = "split")]` attributes on individual rows.

Firmware (non-`host`) builds fold every request and wrapped response — bulk
included — into `MAX_ENDPOINT_PAYLOAD`, which the compile-time assertion
checks against `RYNK_MAX_PAYLOAD_SIZE` (see Sizing above). Host builds skip
the fold: they allocate, and bulk payloads carry no `MaxSize` there. Bulk
page capacities are derived from the same buffer (`MAX_BULK_ITEMS` and
`MAX_BULK_KEYS` in `payload/bulk_capacity.rs`) and advertised to hosts as
`max_bulk_items`/`max_bulk_keys` in `DeviceCapabilities`.

### Endpoint reference

The table below lists every endpoint, organized by domain. The high byte
encodes the domain; the low byte encodes the command within that domain.

#### System (`0x00xx`)

| Cmd        | Value    | Request           | Response        | Notes                                  |
|------------|----------|-------------------|-----------------|----------------------------------------|
| GetVersion | `0x0001` | `()`              | `ProtocolVersion` | Frozen across all majors.            |
| GetCapabilities | `0x0002` | `()`         | `DeviceCapabilities` | Feature/layout snapshot.          |
| Reboot     | `0x0003` | `()`              | `()`            | No reply (use `send_no_reply`).        |
| BootloaderJump | `0x0004` | `()`         | `()`            | No reply.                              |
| StorageReset | `0x0005` | `StorageResetMode` | `()`          |                                        |
| GetLockStatus | `0x0006` | `()`           | `LockStatus`    | Pure read, no side effects.            |
| UnlockPoll | `0x0007` | `()`              | `LockStatus`    | Arms/refreshes unlock attempt.         |
| Lock       | `0x0008` | `()`              | `()`            | Relock immediately.                   |
| GetLayout  | `0x0009` | `u32` (offset)    | `LayoutChunk`   | Paged compressed layout blob.          |
| GetDeviceInfo | `0x000A` | `()`           | `DeviceInfo`    | Identity strings, USB ids.             |

#### Keymap (`0x01xx`) — includes encoders

| Cmd             | Value    | Request               | Response               | Notes      |
|-----------------|----------|-----------------------|------------------------|------------|
| GetKeyAction    | `0x0101` | `KeyPosition`         | `KeyAction`            |            |
| SetKeyAction    | `0x0102` | `SetKeyRequest`       | `()`                   |            |
| GetDefaultLayer | `0x0103` | `()`                  | `u8`                   |            |
| SetDefaultLayer | `0x0104` | `u8`                  | `()`                   |            |
| GetEncoderAction | `0x0105` | `GetEncoderRequest` | `EncoderAction`        |            |
| SetEncoderAction | `0x0106` | `SetEncoderRequest` | `()`                   |            |
| GetKeymapBulk   | `0x0107` | `GetKeymapBulkRequest` | `GetKeymapBulkResponse` | Bulk page  |
| SetKeymapBulk   | `0x0108` | `SetKeymapBulkRequest` | `()`                   | Bulk page  |

#### Macro (`0x02xx`)

| Cmd      | Value    | Request           | Response    | Notes |
|----------|----------|-------------------|-------------|-------|
| GetMacro | `0x0201` | `GetMacroRequest` | `MacroData` |       |
| SetMacro | `0x0202` | `SetMacroRequest` | `()`        |       |

#### Combo (`0x03xx`)

| Cmd          | Value    | Request              | Response               | Notes     |
|--------------|----------|----------------------|------------------------|-----------|
| GetCombo     | `0x0301` | `u8`                 | `Combo`                |           |
| SetCombo     | `0x0302` | `SetComboRequest`    | `()`                   |           |
| GetComboBulk | `0x0303` | `GetComboBulkRequest` | `GetComboBulkResponse` | Bulk page |
| SetComboBulk | `0x0304` | `SetComboBulkRequest` | `()`                   | Bulk page |

#### Morse (`0x04xx`)

| Cmd           | Value    | Request              | Response               | Notes     |
|---------------|----------|----------------------|------------------------|-----------|
| GetMorse      | `0x0401` | `u8`                 | `Morse`                |           |
| SetMorse      | `0x0402` | `SetMorseRequest`    | `()`                   |           |
| GetMorseBulk  | `0x0403` | `GetMorseBulkRequest` | `GetMorseBulkResponse` | Bulk page |
| SetMorseBulk  | `0x0404` | `SetMorseBulkRequest` | `()`                   | Bulk page |

#### Fork (`0x05xx`)

| Cmd     | Value    | Request           | Response | Notes |
|---------|----------|-------------------|----------|-------|
| GetFork | `0x0501` | `u8`              | `Fork`   |       |
| SetFork | `0x0502` | `SetForkRequest`  | `()`     |       |

#### Behavior (`0x06xx`)

| Cmd                | Value    | Request          | Response         | Notes |
|--------------------|----------|------------------|------------------|-------|
| GetBehaviorConfig  | `0x0601` | `()`             | `BehaviorConfig` |       |
| SetBehaviorConfig  | `0x0602` | `BehaviorConfig` | `()`             |       |

#### Connection (`0x07xx`)

| Cmd                | Value    | Request | Response          | Notes          |
|--------------------|----------|---------|-------------------|----------------|
| GetConnectionType  | `0x0701` | `()`    | `ConnectionType`  |                |
| GetConnectionStatus | `0x0702` | `()`   | `ConnectionStatus`| Full snapshot. |
| GetBleStatus       | `0x0703` | `()`    | `BleStatus`        | `_ble`         |
| SwitchBleProfile   | `0x0704` | `u8`    | `()`              | `_ble`         |
| ClearBleProfile    | `0x0705` | `u8`    | `()`              | `_ble`         |

#### Status (`0x08xx`)

| Cmd                 | Value    | Request | Response          | Notes                              |
|---------------------|----------|---------|-------------------|------------------------------------|
| GetCurrentLayer     | `0x0801` | `()`    | `u8`              |                                    |
| GetMatrixState      | `0x0802` | `()`    | `MatrixState`     |                                    |
| GetBatteryStatus    | `0x0803` | `()`    | `BatteryStatus`   | `_ble`                             |
| GetPeripheralStatus | `0x0804` | `u8`    | `PeripheralStatus`| `split`                            |
| GetWpm              | `0x0805` | `()`    | `u16`             | Snapshot of `WpmUpdate` topic.     |
| GetSleepState       | `0x0806` | `()`    | `bool`            | Snapshot of `SleepState` topic.    |
| GetLedIndicator     | `0x0807` | `()`    | `LedIndicator`    | Snapshot of `LedIndicatorChange`.  |

Source: `rmk-types/src/protocol/rynk/command.rs` (`endpoints!` table)

## 4. Topic Table

The `topics!` macro defines topic pushes — unsolicited messages sent from the
server (firmware) to the host. Each row binds a named `Cmd` (high bit set) to
its payload type:

```rust
topics! {
    LayerChange = 0x8001: u8;
    WpmUpdate = 0x8002: u16;
    // ...
}
```

### Topic reference

| Topic               | Value    | Payload           | Notes    |
|---------------------|----------|-------------------|----------|
| LayerChange         | `0x8001` | `u8`              |          |
| WpmUpdate           | `0x8002` | `u16`             |          |
| ConnectionChange    | `0x8003` | `ConnectionStatus`|          |
| SleepState          | `0x8004` | `bool`            |          |
| LedIndicatorChange  | `0x8005` | `LedIndicator`    |          |
| BatteryStatusChange | `0x8006` | `BatteryStatus`   | `_ble`   |

Source: `rmk-types/src/protocol/rynk/command.rs` (`topics!` table)

### TopicEvent

The macro generates a `TopicEvent` enum with one variant per topic row. Both
the firmware and host compile against the same table, so the producer and
consumer halves share one definition:

```rust
pub enum TopicEvent {
    LayerChange(u8),
    WpmUpdate(u16),
    ConnectionChange(ConnectionStatus),
    SleepState(bool),
    LedIndicatorChange(LedIndicator),
    #[cfg(feature = "_ble")]
    BatteryStatusChange(BatteryStatus),
}
```

Key methods:

- `TopicEvent::decode(cmd: Cmd, payload: &[u8]) -> Option<Self>` — decode a
  topic frame's payload. Returns `None` for a `cmd` outside the topic table,
  or a payload that fails to decode. Trailing bytes are ignored.
- `TopicEvent::encode(&self, buf: &mut [u8]) -> Result<usize, RynkError>` —
  encode this event into `buf` as a COBS-framed topic frame (SEQ = 0),
  returning the framed length. The caller sends `&buf[..len]`.

### Delivery semantics

Topics push with SEQ = 0 and are best-effort:

- On the host, topic events are buffered in a bounded queue
  (`TOPIC_QUEUE_CAPACITY` = 8). If the queue is full when a new topic
  arrives, the oldest is dropped with only a debug log — there is no drop
  counter.
- Over BLE, a topic push is a GATT notification; if the notification is lost
  on the air, there is no retransmission at the protocol level.

Consumers that need reliable state should re-read the corresponding snapshot
endpoint (e.g. `GetCurrentLayer`) rather than relying solely on topics.

Source: `rmk-types/src/protocol/rynk/command.rs` (`TopicEvent`),
`rynk/src/driver.rs` (`TOPIC_QUEUE_CAPACITY`)

## 5. Frame Routing

A session is a `Client` + `Driver` pair, created by `RynkDevice::connect`.
The `Client` is the protocol surface: typed requests plus the topic stream,
all taking `&self`, so one shared client can serve request calls and a topic
loop at the same time. The `Driver` owns the transport's read and write
halves and moves the bytes: `Driver::run` writes queued request frames out,
cuts incoming COBS frames back out of the byte stream with a `Deframer`, and
routes each one by the topic bit in its CMD:

```text
request()    encode → message channel ─→ Driver: write_all
Driver: read → deframe → route by the CMD topic bit:
         topic frame → decode → topic queue ─→ next_topic()
         reply frame → SEQ-matched slot ─→ request(): decode
```

Up to `MAX_IN_FLIGHT` requests run concurrently (4 on alloc builds; 1 on
no-alloc builds, which pay a full frame buffer per slot). Each in-flight
request claims a slot and a SEQ; SEQs cycle `1..=255` — 0 marks a free slot,
so it is never handed out. Replies are matched back by SEQ, so they may
complete in any order. Callers beyond the limit wait for a free slot instead
of flooding the device.

### Routing rules

1. **Topic** (CMD high bit set) — a recognized topic is decoded and buffered
   into the topic queue, later drained by `next_topic()`; an unrecognized one
   is skipped with a debug log. The read loop never blocks on a topic frame;
   it keeps reading.
2. **Reply** (SEQ matches an in-flight request) — the frame is delivered to
   that request's slot. `request()` then checks the CMD for a mismatch
   (`CmdMismatch`) and decodes the payload as `Result<T, RynkError>`.
   Trailing bytes after the decoded value cause `TrailingBytes`.
3. **Unmatched** (no slot waits on that SEQ, or SEQ = 0) — a cancelled
   request's late reply or a fire-and-forget command's echo; the frame is
   dropped with a debug log.

At session start the writer sends a lone `0x00` delimiter before the first
request, so stale bytes in the peer's receive buffer (an OS port probe, a
prior session's half-frame) end as garbage instead of merging with the first
frame. Garbled or oversized inbound frames are skipped by the `Deframer`,
which resyncs at the next `0x00`.

### Topic queue

- Capacity: 8 events (`TOPIC_QUEUE_CAPACITY`).
- On overflow, the oldest event is dropped with only a debug log. There
  is no drop counter — topics are best-effort by contract, so consumers
  re-read critical state with the matching snapshot endpoint.

### Link lifecycle

- Cancelling a call is safe: its slot is freed on drop and a late reply is
  dropped as unmatched. Cancelling `Driver::run` is safe too — it takes
  `&mut self` and keeps the receive state in the struct, so a cancelled run
  loses no bytes.
- A dead link makes `Driver::run` return the error that ended it
  (`Disconnected` at EOF, `Io` on a transport fault). There is no in-band
  death signal: a call awaiting on the `Client` of a dead session never
  finishes on its own, so run the driver in the same `select` as everything
  that awaits on the `Client`.
- There is no built-in timeout (the crate has no async runtime): a silent
  peer keeps a call pending until the surrounding `select` cancels it;
  callers that need a deadline use their runtime's timeout.

Source: `rynk/src/driver.rs` (`Client`, `Driver`, `MAX_IN_FLIGHT`),
`rynk/src/device.rs` (`RynkDevice::connect`)

## 6. Error Types

Rynk has two error layers: the firmware-side error carried in the response
envelope, and the host-side error thrown by the client.

### RynkError (firmware-side)

Returned inside the response envelope's `Result<T, RynkError>`. The enum is
`#[non_exhaustive]` to allow adding variants without a major bump:

```rust
#[non_exhaustive]
pub enum RynkError {
    Malformed,       // The request could not be decoded
    NotReady,        // Device is not in a state to satisfy the request
    StorageFault,    // Persistent storage failed on a write path
    Internal,        // Internal firmware fault
    Unimplemented,   // Command recognized but handler not implemented yet
    Invalid,         // Request decoded cleanly but is semantically invalid
    UnknownCmd,      // Frame well-formed but CMD unknown
    Locked,          // Command gated by lock; complete unlock ceremony first
    Busy,            // Transient backpressure; retry once in-flight requests complete
}
```

`Busy` means the reply did not fit the buffer space left beside pipelined
requests still queued in the session buffer — the request itself was valid.

Source: `rmk-types/src/protocol/rynk/error.rs`

### RynkHostError (host-side)

Thrown by `Client` methods and `RynkDevice::connect`. These cover transport,
framing, versioning, and envelope-decoding failures:

| Variant            | Description                                                       |
|--------------------|-------------------------------------------------------------------|
| `Disconnected`     | Transport disconnected (EOF on the read half).                    |
| `Io(ErrorKind)`    | I/O error from the transport.                                     |
| `Transport(&'static str, String)` | A transport step (GATT attach, port open, …) failed; the detail string is what a device picker shows when the chosen device can't be reached. |
| `DeviceNotFound(String)` | No matching device found during discovery.                 |
| `VersionMismatch { firmware_major, firmware_minor, host_major, host_max_minor }` | Protocol major version mismatch; firmware speaks a different major. |
| `Rejected(RynkError)` | Firmware received the request but answered with an error.     |
| `Encode(Cmd)`      | Request failed to encode, or exceeds the device's advertised `max_payload_size`. |
| `Deserialize { cmd, source }` | Response decode failed; `source` is the `postcard::Error`. |
| `Layout(String)`   | `GetLayout` blob inflate or decode failed.                        |
| `TrailingBytes { cmd }` | Response had trailing bytes after the decoded value.         |
| `CmdMismatch { sent, got }` | Response CMD did not match the request CMD.             |
| `Unsupported(Cmd, &'static str)` | Capabilities reject the command before touching the wire. |

`Transport`, `DeviceNotFound`, and `Layout` exist only on alloc builds.

Source: `rynk/src/driver.rs` (`RynkHostError`)

### Rejected flattens the wire envelope

When the firmware replies with `Err(rynk_error)`, the client decodes the
envelope and flattens the inner `RynkError` into
`RynkHostError::Rejected(RynkError)`. This keeps the firmware-side error
visible to the host application without exposing the postcard `Result` wrapper
at the API boundary.

## 7. Versioning & Compatibility

### ProtocolVersion

```rust
pub struct ProtocolVersion {
    pub major: u8,
    pub minor: u8,
}
```

The current protocol version is `CURRENT = { major: 0, minor: 1 }`.

Source: `rmk-types/src/protocol/rynk/payload/system.rs`
(`ProtocolVersion::CURRENT`)

### Handshake rules

`GetVersion` (`0x0001`) and its `Result<ProtocolVersion, RynkError>` reply
are frozen across all versions — the probe itself is stable, so a host can
always ask for the version before negotiating anything else.

During `RynkDevice::connect()` the handshake sends `GetVersion` and
`GetCapabilities` pipelined in one round trip; the version gate still runs
before the capability snapshot is released (`handshake` in
`rynk/src/device.rs`):

- **Major mismatch** — hard reject with `VersionMismatch`. The host must use
  a tool matching the firmware's major, or flash firmware matching the host.
- **Same major, newer minor** — connect, with an informational log. New
  commands or topics may be unavailable on the host, but existing ones keep
  working.

### Compatibility contract

Within a major version, changes must keep old hosts working:

- **Adding** a new `Cmd` or topic is a **minor** bump. Old peers answer
  `UnknownCmd` for the new request, or ignore trailing topic bytes they do not
  recognize.
- **Reshaping** an existing request/response — including appending a field —
  is a **major** bump. Hosts reject trailing response bytes via
  `TrailingBytes`, so any change to a payload's shape breaks old peers.

### Snapshot tests

Two golden files (exercised by `tests.rs`) catch accidental wire drift:
`snapshots/wire_values.snap` pins one postcard-encoded exemplar per wire
type, and `snapshots/wire_frames.snap` pins one full frame (header +
payload) per protocol message. Any field reorder, type change, variant
renumber, or CMD renumber flips the bytes and fails CI; if the change is
intentional, bump `ProtocolVersion::CURRENT` and regenerate the snapshots.

Source: `rmk-types/src/protocol/rynk/tests.rs`

## 8. Constants

| Constant                | Value                              | Description                                                |
|-------------------------|------------------------------------|------------------------------------------------------------|
| `RYNK_HEADER_SIZE`      | `3`                                | Fixed header size (CMD + SEQ).                              |
| `RYNK_MAX_PAYLOAD_SIZE` | derived from `RYNK_BUFFER_SIZE`    | Largest payload one frame can carry (see Sizing in §1).     |
| `RYNK_BLE_CHUNK_SIZE`   | `244`                              | Largest single GATT write/notification on Rynk BLE characteristics. |
| `RYNK_HID_REPORT_SIZE`  | `32`                               | Fixed size of one Rynk-over-WebHID report (`RynkHidService`). |
| `RYNK_SERVICE_UUID`     | `0x10900067537f4f0a9b55929e271f61ab` | Rynk GATT service UUID.                                  |
| `RYNK_INPUT_CHAR_UUID`  | `0x80f9319b0c7443a59738c59d6dda3db9` | Rynk `input_data` characteristic UUID.                   |
| `RYNK_OUTPUT_CHAR_UUID` | `0x198025246f90434693c263dbc509ab55` | Rynk `output_data` characteristic UUID.                  |
| `RYNK_MAGIC`            | `"rynk:"`                          | Informational marker prepended to the USB serial number (`lsusb`/system reports can identify RMK devices); discovery matches the vendor interface triple below instead. |
| `RYNK_USB_INTERFACE_CLASS` | `0xFF`                          | Class of the Rynk vendor-specific USB bulk interface.       |
| `RYNK_USB_INTERFACE_SUBCLASS` | `0x52` (`'R'`)               | Subclass of the Rynk USB interface.                         |
| `RYNK_USB_INTERFACE_PROTOCOL` | `0x52` (`'R'`)               | Protocol of the Rynk USB interface.                         |

Source: `rmk-types/src/protocol/rynk/mod.rs`,
`rmk-types/src/protocol/rynk/message.rs` (`RYNK_HEADER_SIZE`,
`RYNK_MAX_PAYLOAD_SIZE`)
