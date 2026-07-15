# Protocol & Wire Format

Rynk is RMK's native host-communication protocol. It carries RMK's canonical
types (`KeyAction`, `Combo`, `Morse`, `Fork`, `EncoderAction`, `BatteryStatus`,
`BleStatus`) on the wire as a 5-byte fixed header plus a postcard-encoded
payload. This page documents the wire format, the command table, frame
routing, error handling, and the versioning contract.

Source: `rmk-types/src/protocol/rynk/mod.rs`

## 1. Wire Format

Every Rynk frame is a fixed 5-byte header followed by a variable-length
payload:

```text
┌──────────────┬───────────┬────────────────────┐
│ CMD u16 LE   │ SEQ u8    │ LEN u16 LE         │  ← 5-byte header
├──────────────┴───────────┴────────────────────┤
│              postcard-encoded payload         │  ← LEN bytes
└───────────────────────────────────────────────┘
```

### Header fields

| Field | Type       | Description                                                    |
|-------|------------|----------------------------------------------------------------|
| CMD   | `u16` (LE) | Command identifier. `0x0000–0x7FFF` request/response; `0x8000–0xFFFF` topic (server→host push). |
| SEQ   | `u8`       | Sequence number of the current request. Topics always send SEQ = 0. |
| LEN   | `u16` (LE) | Payload byte count.                                            |

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

This means a response payload is exactly one byte larger than the bare `T`
(postcard's `Result` tag is a single byte).

### Buffer constants

| Constant              | Value | Meaning                                                  |
|-----------------------|-------|----------------------------------------------------------|
| `RYNK_HEADER_SIZE`    | 5     | Fixed header size.                                        |
| `RYNK_MIN_BUFFER_SIZE`| header + `RYNK_MAX_PAYLOAD` | Minimum buffer to hold any single non-bulk message. |

`RYNK_MAX_PAYLOAD` is the largest postcard-encoded payload across every
non-bulk endpoint and topic, folded at compile time from the command table so
adding a command can never under-size the buffer.

Source: `rmk-types/src/protocol/rynk/message.rs`

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

Source: `rmk-types/src/protocol/rynk/command.rs:35-69`

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

The syntax is: `Name = cmd_value: Request => Response;`

A row may carry an optional `@bulk` marker before its name. A `@bulk` endpoint
is gated behind the `bulk` feature and excluded from the
`MAX_ENDPOINT_PAYLOAD` fold: its payload is sized dynamically (bulk transfer,
whose element count tracks `RYNK_BUFFER_SIZE`), so it must not drive the
buffer floor — the buffer drives it, not the other way around.

Feature gating is applied with `#[cfg(feature = "_ble")]` and
`#[cfg(feature = "split")]` attributes on individual rows.

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
| GetKeymapBulk   | `0x0107` | `GetKeymapBulkRequest` | `GetKeymapBulkResponse` | `@bulk`  |
| SetKeymapBulk   | `0x0108` | `SetKeymapBulkRequest` | `()`                   | `@bulk`  |

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
| GetComboBulk | `0x0303` | `GetComboBulkRequest` | `GetComboBulkResponse` | `@bulk` |
| SetComboBulk | `0x0304` | `SetComboBulkRequest` | `()`                   | `@bulk` |

#### Morse (`0x04xx`)

| Cmd           | Value    | Request              | Response               | Notes     |
|---------------|----------|----------------------|------------------------|-----------|
| GetMorse      | `0x0401` | `u8`                 | `Morse`                |           |
| SetMorse      | `0x0402` | `SetMorseRequest`    | `()`                   |           |
| GetMorseBulk  | `0x0403` | `GetMorseBulkRequest` | `GetMorseBulkResponse` | `@bulk` |
| SetMorseBulk  | `0x0404` | `SetMorseBulkRequest` | `()`                   | `@bulk` |

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

Source: `rmk-types/src/protocol/rynk/command.rs:211-288`

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

Source: `rmk-types/src/protocol/rynk/command.rs:291-300`

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

- `TopicEvent::cmd(&self) -> Cmd` — the `Cmd` this event is pushed under.
- `TopicEvent::decode(cmd: Cmd, payload: &[u8]) -> Option<Self>` — decode a
  topic frame's payload. Returns `None` for a `cmd` outside the topic table,
  or a payload that fails to decode. Trailing bytes are ignored.
- `TopicEvent::encode(&self, buf: &mut [u8]) -> Result<RynkMessage, RynkError>`
  — encode this event into `buf` as a topic frame. The caller sends
  `msg.frame()`.

### Delivery semantics

Topics push with SEQ = 0 and are best-effort:

- On the host, topic frames are buffered in an event queue. If the queue is
  full when a new frame arrives, the oldest frame is dropped and the
  `events_dropped` counter is incremented.
- Over BLE, a topic push is a GATT notification; if the notification is lost
  on the air, there is no retransmission at the protocol level.

Consumers that need reliable state should re-read the corresponding snapshot
endpoint (e.g. `GetCurrentLayer`) rather than relying solely on topics.

Source: `rmk-types/src/protocol/rynk/command.rs:169-207`

## 5. Frame Routing

The `Client` handles transport framing, SEQ correlation, and topic queueing.
A frame is the 5-byte header plus a postcard payload. The inbound stream
routes each reassembled frame by its CMD and SEQ:

```text
SEND   request(&req) → encode + assign SEQ → write_all → transport

RECV   transport → read (arbitrary chunks) → reassemble whole frames,
       then route each frame by its 5-byte header:

         topic   CMD high bit set          → event queue, drained by next_event()
         reply   SEQ matches our request   → returned by request()
         stale   SEQ from a past request   → dropped
```

### Routing rules

1. **Topic** (CMD high bit set) — the frame is buffered into the event queue
   and later drained by `next_event()`. The reply loop does not return on a
   topic frame; it keeps reading.
2. **Reply** (SEQ matches the outstanding request) — the frame is returned to
   the caller of `request()`. The CMD is checked for a mismatch
   (`CmdMismatch`), and the payload is decoded as `Result<T, RynkError>`.
   Trailing bytes after the decoded value cause `TrailingBytes`.
3. **Stale** (SEQ from a past request, or unknown) — the frame is silently
   dropped and the loop continues.

### Event queue

- Capacity: 64 frames (`EVENT_QUEUE_CAPACITY`).
- On overflow, the oldest frame is dropped and `events_dropped` is
  incremented. A debug log records the cumulative drop count.
- `events_dropped()` exposes the counter so consumers can detect lag and
  re-read critical state.

### Link lifecycle

- Cancelling an in-progress read makes the stream boundary unknowable; the
  next operation latches the link dead and requires reconnecting.
- Broken links latch dead so later calls fail fast with `Disconnected`.
- `is_alive()` returns `false` immediately after a cancelled wire operation,
  before the next call latches `dead`.

Source: `rynk/src/driver.rs:1-26`, `rynk/src/driver.rs:41-52`, `rynk/src/driver.rs:273-315`

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
}
```

Source: `rmk-types/src/protocol/rynk/error.rs`

### RynkHostError (host-side)

Thrown by `Client` methods. These cover transport, framing, versioning, and
envelope-decoding failures:

| Variant            | Description                                                       |
|--------------------|-------------------------------------------------------------------|
| `Disconnected`     | Transport disconnected or link latched dead.                     |
| `Io(String)`       | I/O error from the transport.                                     |
| `DeviceNotFound(String)` | No matching device found during discovery.                 |
| `VersionMismatch` | Protocol major version mismatch; firmware speaks a different major. |
| `Rejected(RynkError)` | Firmware accepted the request but answered with an error.     |
| `Encode(Cmd)`      | Request encode failed (e.g. request exceeds TX buffer).          |
| `TooLarge`         | Encoded frame exceeds the device's advertised `max_payload_size`. |
| `Deserialize`      | Response decode failed.                                           |
| `Layout(String)`   | `GetLayout` blob inflate or decode failed.                        |
| `TrailingBytes`    | Response had trailing bytes after the decoded value.              |
| `CmdMismatch`      | Response CMD did not match the request CMD.                       |
| `InboundTooLarge`  | Inbound frame exceeds the negotiated maximum.                    |
| `TopicCmd(Cmd)`    | A topic-range `Cmd` was passed to a request method.              |
| `Unsupported(Cmd)` | Capabilities reject the command before touching the wire.        |

Source: `rynk/src/driver.rs:55-103`

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

Source: `rmk-types/src/protocol/rynk/payload/system.rs:16-24`

### Handshake rules

`GetVersion` (`0x0001`) and its `Result<ProtocolVersion, RynkError>` reply
are frozen across all versions — the probe itself is stable, so a host can
always ask for the version before negotiating anything else.

During `Client::connect()`:

- **Major mismatch** — hard reject with `VersionMismatch`. The host must use
  a tool matching the firmware's major, or flash firmware matching the host.
- **Same major, newer minor** — connect with a log warning. New commands or
  topics may be unavailable on the host, but existing ones keep working.

### Compatibility contract

Within a major version, changes must keep old hosts working:

- **Adding** a new `Cmd` or topic is a **minor** bump. Old peers answer
  `UnknownCmd` for the new request, or ignore trailing topic bytes they do not
  recognize.
- **Reshaping** an existing request/response — including appending a field —
  is a **major** bump. Hosts reject trailing response bytes via
  `TrailingBytes`, so any change to a payload's shape breaks old peers.

### Snapshot tests

Golden snapshot files in `snapshots/*.snap` (exercised by `tests.rs`) catch
accidental wire drift. Each snapshot records the exact postcard bytes for a
command's request and response; any change to the encoded form fails the test.

Source: `rmk-types/src/protocol/rynk/mod.rs:36-45`

## 8. Constants

| Constant                | Value                              | Description                                                |
|-------------------------|------------------------------------|------------------------------------------------------------|
| `RYNK_HEADER_SIZE`      | `5`                                | Fixed header size (CMD + SEQ + LEN).                        |
| `RYNK_MIN_BUFFER_SIZE`   | `RYNK_HEADER_SIZE + RYNK_MAX_PAYLOAD` | Minimum buffer for any single non-bulk message.        |
| `RYNK_BLE_CHUNK_SIZE`   | `244`                              | Largest single GATT write/notification on Rynk BLE characteristics. |
| `RYNK_HID_REPORT_SIZE`  | `32`                               | Fixed size of one Rynk-over-WebHID report (`RynkHidService`). |
| `RYNK_SERVICE_UUID`     | `0x10900067537f4f0a9b55929e271f61ab` | Rynk GATT service UUID.                                  |
| `RYNK_INPUT_CHAR_UUID`  | `0x80f9319b0c7443a59738c59d6dda3db9` | Rynk `input_data` characteristic UUID.                   |
| `RYNK_OUTPUT_CHAR_UUID` | `0x198025246f90434693c263dbc509ab55` | Rynk `output_data` characteristic UUID.                  |
| `RYNK_SERIAL_MAGIC`     | `"rynk:"`                          | Immutable marker prepended to USB serial number so a host can pick RMK keyboards out of all serial ports without probing every device. |

Source: `rmk-types/src/protocol/rynk/mod.rs:64-80`
