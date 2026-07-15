# API Reference

The typed endpoint surface Rynk exposes to a host application. Every method
below lives on `Client<T>` and is `async`. All examples assume a connected
client; see [Architecture](./architecture.md) for the Client/Transport/Device
split.

Source: `rynk/src/api.rs`, `rynk/src/driver.rs`,
`rmk-types/src/protocol/rynk/payload/system.rs`.

## 1. Client Overview

`Client` is generic over any byte link that implements the `embedded-io-async`
`Read + Write` traits. It owns framing, SEQ correlation, a topic queue, and the
cached capability snapshot taken at handshake time.

```rust
pub struct Client<T: Read + Write> {
    transport: T,
    // frame reassembly, SEQ, link-lifecycle flags, topic queue, cached caps ...
}
```

Source: `rynk/src/driver.rs:135-159`.

### `connect(transport) -> Result<Self, RynkHostError>`

The constructor. Drives the handshake in two round trips:

1. `GetVersion` — rejects only a **major**-version mismatch. A newer
   **minor** is accepted (logged as informational); commands/topics new to that
   minor are simply unavailable.
2. `GetCapabilities` — cached on the client and used for every later
   capability gate. Also grows the TX scratch buffer to the negotiated frame
   limit.

```rust
let mut client = Client::connect(transport).await?;
```

Source: `rynk/src/driver.rs:191-221`.

### `capabilities() -> &DeviceCapabilities`

A borrowed view of the snapshot taken at connect time. This is what the
crate-internal capability gates read; application code that needs the same
data should prefer the cached `capabilities()` over re-querying the wire with
`get_capabilities()`.

Source: `rynk/src/driver.rs:225-227`.

### `transport() -> &T`

Borrow the owned transport — e.g. to read connection identity (serial port
name, BLE address) that lives on the transport, not the protocol.

Source: `rynk/src/driver.rs:230-232`.

### `is_alive() -> bool`

Returns `false` as soon as the link is unusable. A cancelled `read` or `write`
poisons the client: `is_alive()` reads `false` immediately, before the next
call latches the `dead` flag.

```rust
pub fn is_alive(&self) -> bool {
    !self.dead && !self.send_in_flight && !self.receive_in_flight
}
```

Source: `rynk/src/driver.rs:236-238`.

### `events_dropped() -> u64`

Count of topic frames evicted from the bounded event queue (capacity 64)
while `next_event()` lagged. Counts only overflow the client can observe — on
BLE, an OS-level notification drop is invisible. Re-read critical state with
the matching `Get*` call if this is non-zero.

Source: `rynk/src/driver.rs:243-245`.

## 2. System

### `get_version() -> ProtocolVersion`

Read the firmware's protocol version. This is the same value `connect()`
probed; useful only for diagnostics after the handshake.

```rust
pub async fn get_version(&mut self) -> Result<ProtocolVersion, RynkHostError>
```

Source: `rynk/src/api.rs:73-75`.

### `get_capabilities() -> DeviceCapabilities`

Re-read the capability set from the wire. Prefer the cached
[`capabilities()`](#capabilities---devicecapabilities) snapshot taken at
connect time; call this only when you suspect the cached copy is stale (it
never changes without a reconnect, so in practice you rarely need it).

Source: `rynk/src/api.rs:79-81`.

### `reboot()`

Fire-and-forget: the firmware resets before its session loop can reply, so
`Ok(())` only means the request frame was handed to the link. Sent via
`send_no_reply` — no response is waited for.

```rust
pub async fn reboot(&mut self) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:86-88`.

### `bootloader_jump()`

Jump to the bootloader (DFU mode). Same fire-and-forget contract as
[`reboot()`](#reboot): `Ok(())` means the frame was sent, not that the jump
completed.

Source: `rynk/src/api.rs:92-94`.

### `storage_reset(mode: StorageResetMode)`

Reset persistent storage. Rejected locally — without touching the wire — when
`!storage_enabled`, where the wipe would be a silent no-op.

`StorageResetMode` is a `#[non_exhaustive]` enum:

```rust
pub enum StorageResetMode {
    /// Reset all stored data — including keymap and BLE bonds.
    Full,
    /// Reset only the layout/keymap data, preserving BLE bonds.
    LayoutOnly,
}
```

```rust
pub async fn storage_reset(&mut self, mode: StorageResetMode) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:99-104`,
`rmk-types/src/protocol/rynk/payload/system.rs:142-147`.

## 3. Lock Gate & Security

Some commands are gated behind a physical-presence unlock ceremony. The lock
is a firmware-side gate: a locked device rejects gated commands with
`RynkError::Locked`, which the client flattens to
`RynkHostError::Rejected(RynkError::Locked)`.

### `get_lock_status() -> LockStatus`

Pure read, no side effects. Returns the challenge to hold and the current
progress of any armed attempt.

```rust
pub async fn get_lock_status(&mut self) -> Result<LockStatus, RynkHostError>
```

Source: `rynk/src/api.rs:111-113`.

### `unlock_poll() -> LockStatus`

Arm or refresh a physical-presence unlock attempt and sample the held
challenge keys. Poll every ~150 ms while the user holds the challenge keys:
`remaining_keys` counts down, and the attempt succeeds (`locked == false`)
once all are held simultaneously. The firmware window lapses ~500 ms after
polls stop, so cancelling is simply "stop polling."

```rust
pub async fn unlock_poll(&mut self) -> Result<LockStatus, RynkHostError>
```

Source: `rynk/src/api.rs:123-125`.

### `lock()`

Relock immediately. A no-op on an `insecure` device (one built without
`unlock_keys`).

```rust
pub async fn lock(&mut self) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:128-130`.

### LockStatus

```rust
pub struct LockStatus {
    pub locked: bool,
    /// An unlock attempt is armed (host is polling; window not yet lapsed).
    pub unlocking: bool,
    /// Challenge keys not currently held; `== key_positions.len()` when no
    /// attempt is armed.
    pub remaining_keys: u8,
    /// The challenge itself: physical `(row, col)` the user must hold.
    /// Empty while `locked` ⇒ permanently locked (no `unlock_keys` configured).
    pub key_positions: Vec<(u8, u8), 4>,
}
```

Source: `rmk-types/src/protocol/rynk/payload/system.rs:117-128`.

### Unlock ceremony

1. Call `get_lock_status()`. If `locked == false`, you are already unlocked.
2. If `key_positions` is empty **while `locked` is true**, the device is
   **permanently locked** — no `unlock_keys` are configured in `keyboard.toml`.
   No amount of polling will unlock it.
3. Otherwise, poll `unlock_poll()` roughly every 150 ms while the user holds
   the challenge keys at the reported `key_positions`.
4. `remaining_keys` counts down as keys are held; the attempt succeeds when
   `locked` flips to `false`.
5. The firmware window lapses ~500 ms after polls stop. To cancel, simply
   stop polling — no explicit cancel command exists.

### Gated commands

`get_matrix_state()` is gated behind the lock. A locked device returns
`RynkError::Locked`, which the client flattens to
`RynkHostError::Rejected(RynkError::Locked)`.

## 4. Keymap

### `get_key(layer, row, col) -> KeyAction`

Read one key's action.

```rust
pub async fn get_key(&mut self, layer: u8, row: u8, col: u8)
    -> Result<KeyAction, RynkHostError>
```

Source: `rynk/src/api.rs:133-136`.

### `set_key(layer, row, col, action)`

Write one key's action.

```rust
pub async fn set_key(&mut self, layer: u8, row: u8, col: u8, action: KeyAction)
    -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:139-145`.

### `get_default_layer() -> u8` / `set_default_layer(layer)`

Read or set the default layer index.

```rust
pub async fn get_default_layer(&mut self) -> Result<u8, RynkHostError>
pub async fn set_default_layer(&mut self, layer: u8) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:148-155`.

### `get_encoder(encoder_id, layer) -> EncoderAction` / `set_encoder(encoder_id, layer, action)`

Read or write both rotation actions for one encoder on one layer.

```rust
pub async fn get_encoder(&mut self, encoder_id: u8, layer: u8)
    -> Result<EncoderAction, RynkHostError>
pub async fn set_encoder(&mut self, encoder_id: u8, layer: u8, action: EncoderAction)
    -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:158-171`.

### `get_layout() -> LayoutInfo`

Read the physical layout. The firmware serves it as an opaque, compressed
blob paged over `GetLayout`; this method reassembles every page (by byte
offset), inflates the blob, and decodes it into `LayoutInfo`. An empty blob
(firmware built without a `[layout].map`) yields an empty `LayoutInfo`, not
an error.

See [layout.md](./layout.md) for the `LayoutInfo` structure and blob format.

Source: `rynk/src/api.rs:208-236`.

## 5. Bulk Transfer & Full-Resource Sync

Bulk endpoints transfer whole tables in page-sized chunks. They are an
optional firmware feature — a device built without `bulk_transfer_supported`
rejects every bulk method locally, without touching the wire.

### Capability gate

```rust
fn require_bulk_transfer(&self, cmd: Cmd) -> Result<(), RynkHostError> {
    if self.capabilities().bulk_transfer_supported { Ok(()) }
    else { Err(RynkHostError::Unsupported(cmd, "bulk transfer not supported")) }
}
```

Returns `RynkHostError::Unsupported` **without a wire send** when
`!bulk_transfer_supported`. The link stays alive (`is_alive()` remains true).
This is critical for UI: surface "feature unavailable," not "disconnected."

Source: `rynk/src/api.rs:54-60`.

### Low-level bulk methods

Each low-level method fetches or writes one page starting at a given cursor.
Page size is bounded by `max_bulk_keys` (keymap) or `max_bulk_configs`
(combos/morse).

```rust
// Keymap
pub async fn get_keymap_bulk(
    &mut self, layer: u8, start_row: u8, start_col: u8,
) -> Result<GetKeymapBulkResponse, RynkHostError>

pub async fn set_keymap_bulk(
    &mut self, request: SetKeymapBulkRequest,
) -> Result<(), RynkHostError>

// Combos
pub async fn get_combo_bulk(
    &mut self, start_index: u8,
) -> Result<GetComboBulkResponse, RynkHostError>

pub async fn set_combo_bulk(
    &mut self, request: SetComboBulkRequest,
) -> Result<(), RynkHostError>

// Morse
pub async fn get_morse_bulk(
    &mut self, start_index: u8,
) -> Result<GetMorseBulkResponse, RynkHostError>

pub async fn set_morse_bulk(
    &mut self, request: SetMorseBulkRequest,
) -> Result<(), RynkHostError>
```

`get_keymap_bulk` walks forward through the row-major, layer-major keymap:
up to `max_bulk_keys` keys, fewer at the keymap's end. An out-of-geometry
position is rejected with `RynkError::Invalid`.

Source: `rynk/src/api.rs:179-201`, `253-265`, `293-305`.

### High-level pagers

The pagers auto-chunk by `max_bulk_keys` / `max_bulk_configs` so callers do
not manage cursors. They are the recommended way to sync a whole table.

```rust
// Read the whole keymap (every layer, row-major)
pub async fn read_all_keymap(&mut self) -> Result<Vec<KeyAction>, RynkHostError>

// Write the whole keymap in max_bulk_keys chunks
pub async fn write_all_keymap(&mut self, actions: &[KeyAction]) -> Result<(), RynkHostError>

// Combos
pub async fn read_all_combos(&mut self) -> Result<Vec<Combo>, RynkHostError>
pub async fn write_all_combos(&mut self, configs: &[Combo]) -> Result<(), RynkHostError>

// Morse
pub async fn read_all_morses(&mut self) -> Result<Vec<Morse>, RynkHostError>
pub async fn write_all_morses(&mut self, configs: &[Morse]) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:325-400`.

### Pager behavior

- **Read pagers** (`read_all_*`) page from cursor 0 until the computed
  `total` items are read, or a short/empty page marks the firmware's clamped
  end. They stop on an empty clamped page *before* reaching `total`, so a
  device that under-reports its slot count still terminates cleanly.

  ```rust
  async fn read_all<Item>(/* ... */) {
      while (start as usize) < total {
          let page = fetch(self, start).await?;
          if page.is_empty() { break; }  // firmware paged out early
          start += page.len() as u16;
          out.extend(page);
      }
  }
  ```

  Source: `rynk/src/api.rs:404-420`.

- **Write pagers** (`write_all_*`) chunk the input into page-sized `Set*Bulk`
  calls. The page size comes from capabilities (`max_bulk_keys` /
  `max_bulk_configs`). When bulk is unsupported, `page` is 0 — the pager
  chunks by `page.max(1)` so the first `store` call hits the low-level
  capability gate (returning `Unsupported`) instead of panicking in
  `chunks(0)`.

  Source: `rynk/src/api.rs:424-441`.

### `keymap_pos(cursor, rows, cols)`

Map a flat, row-major, layer-major key cursor to its `(layer, row, col)`
address for the device's `rows` x `cols` geometry. `u16` arithmetic since the
keymap can exceed 255 keys; the address components each fit in `u8`.

```rust
fn keymap_pos(cursor: u16, rows: u16, cols: u16) -> (u8, u8, u8) {
    let layer = cursor / (rows * cols);
    let row   = (cursor / cols) % rows;
    let col   = cursor % cols;
    (layer as u8, row as u8, col as u8)
}
```

Source: `rynk/src/api.rs:536-541`.

## 6. Combos, Forks, Morse, Macros

Single-entry read/write for the configuration tables. Each takes an index
(or offset, for macros) and a config value.

```rust
// Combos
pub async fn get_combo(&mut self, index: u8) -> Result<Combo, RynkHostError>
pub async fn set_combo(&mut self, index: u8, config: Combo) -> Result<(), RynkHostError>

// Forks
pub async fn get_fork(&mut self, index: u8) -> Result<Fork, RynkHostError>
pub async fn set_fork(&mut self, index: u8, config: Fork) -> Result<(), RynkHostError>

// Morse
pub async fn get_morse(&mut self, index: u8) -> Result<Morse, RynkHostError>
pub async fn set_morse(&mut self, index: u8, config: Morse) -> Result<(), RynkHostError>

// Macros
pub async fn get_macro(&mut self, offset: u16) -> Result<MacroData, RynkHostError>
pub async fn set_macro(&mut self, offset: u16, data: MacroData) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:239-320`.

### Macro chunking contract

Macros live in a flat byte region addressed by `offset`. The firmware always
replies to `get_macro` with exactly its build-time `macro_chunk_size`,
**zero-filling past the end** of its macro space. A short chunk is therefore
**not** an end-of-data signal — parse the macro encoding itself for
termination. Writes past the end of the device's macro space are truncated by
the firmware.

Source: `rynk/src/api.rs:307-320`,
`rmk-types/src/protocol/rynk/payload/system.rs:45`.

## 7. Behavior

### `get_behavior() -> BehaviorConfig` / `set_behavior(config)`

Read or write the global behavior (timing) configuration.

```rust
pub async fn get_behavior(&mut self) -> Result<BehaviorConfig, RynkHostError>
pub async fn set_behavior(&mut self, config: BehaviorConfig) -> Result<(), RynkHostError>
```

`BehaviorConfig` holds four global timing fields:

```rust
pub struct BehaviorConfig {
    pub combo_timeout_ms: u16,
    pub oneshot_timeout_ms: u16,
    pub tap_interval_ms: u16,
    pub tap_capslock_interval_ms: u16,
}
```

Source: `rynk/src/api.rs:444-451`,
`rmk-types/src/protocol/rynk/payload/system.rs:153-158`.

## 8. Status

### `get_current_layer() -> u8`

Read the currently active layer.

Source: `rynk/src/api.rs:454-456`.

### `get_matrix_state() -> MatrixState`

Read the matrix scan bitmap. **Gated behind the lock** — a locked device
returns `RynkError::Locked`, flattened to `RynkHostError::Rejected`.

Source: `rynk/src/api.rs:459-461`.

### `get_battery_status() -> BatteryStatus`

Read battery status. BLE firmware only — rejected locally with
`Unsupported` when `!ble_enabled`, without touching the wire.

```rust
pub async fn get_battery_status(&mut self) -> Result<BatteryStatus, RynkHostError>
```

Source: `rynk/src/api.rs:465-468`.

### `get_peripheral_status(slot) -> PeripheralStatus`

Read one split peripheral's status by slot. Split keyboards only — rejected
locally with `Unsupported` when `!is_split`, without touching the wire.

```rust
pub async fn get_peripheral_status(&mut self, slot: u8)
    -> Result<PeripheralStatus, RynkHostError>
```

Source: `rynk/src/api.rs:473-481`.

### `get_wpm() -> u16`

Read the current words-per-minute estimate. Sourced from the same state that
the `WpmUpdate` topic pushes.

Source: `rynk/src/api.rs:484-486`.

### `get_sleep_state() -> bool`

Read the firmware's sleep state. Sourced from the `SleepState` topic
snapshot.

Source: `rynk/src/api.rs:489-491`.

### `get_led_indicator() -> LedIndicator`

Read the host LED indicator state (caps/num/scroll lock, etc.). Sourced from
the `LedIndicatorChange` topic snapshot.

Source: `rynk/src/api.rs:494-496`.

## 9. Connection

### `get_connection_type() -> ConnectionType`

Read the active connection type (USB / BLE).

Source: `rynk/src/api.rs:499-501`.

### `get_connection_status() -> ConnectionStatus`

Read the full connection status — the same payload the `ConnectionChange`
topic pushes. Useful for recovering a missed push.

```rust
pub async fn get_connection_status(&mut self) -> Result<ConnectionStatus, RynkHostError>
```

Source: `rynk/src/api.rs:505-507`.

### `get_ble_status() -> BleStatus`

Read BLE status (active profile, connection state). BLE firmware only —
rejected locally with `Unsupported` when `!ble_enabled`, without touching the
wire.

Source: `rynk/src/api.rs:512-515`.

### `switch_ble_profile(slot)`

Switch to a BLE profile by slot. BLE firmware only; rejected locally with
`Unsupported` otherwise.

```rust
pub async fn switch_ble_profile(&mut self, slot: u8) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:519-522`.

### `clear_ble_profile(slot)`

Clear (unbond) a BLE profile by slot. Tears down the active link if it
targets the connected profile. BLE firmware only; rejected locally with
`Unsupported` otherwise.

```rust
pub async fn clear_ble_profile(&mut self, slot: u8) -> Result<(), RynkHostError>
```

Source: `rynk/src/api.rs:527-530`.

## 10. Capability Gating Summary

Several commands are rejected **locally** — before any wire send — when the
cached capabilities say the feature is absent. This is the central principle
that lets a UI distinguish "feature unavailable" from "disconnected."

| Gate | Method | Rejects locally when | Error |
|------|--------|----------------------|-------|
| `require_ble` | `get_battery_status`, `get_ble_status`, `switch_ble_profile`, `clear_ble_profile` | `!ble_enabled` | `Unsupported` |
| `require_bulk_transfer` | `get/set_keymap_bulk`, `get/set_combo_bulk`, `get/set_morse_bulk` | `!bulk_transfer_supported` | `Unsupported` |
| (inline) | `storage_reset` | `!storage_enabled` | `Unsupported` |
| (inline) | `get_peripheral_status` | `!is_split` | `Unsupported` |

```rust
fn require_ble(&self, cmd: Cmd) -> Result<(), RynkHostError> {
    if self.capabilities().ble_enabled { Ok(()) }
    else { Err(RynkHostError::Unsupported(cmd, "BLE not enabled")) }
}
```

**Key principle**: locally-gated rejects return `RynkHostError::Unsupported`
and do **not** kill the link — `is_alive()` stays `true`. This is critical
for UI: show "feature unavailable," not "disconnected."

Source: `rynk/src/api.rs:54-70`, `99-103`, `473-479`.

## 11. Topic Delivery

Topics are firmware-to-host pushes (server to host). Delivery is
**pull-based**, not callback: the host calls `next_event()` to drain a bounded
queue.

### `next_event() -> IncomingTopic`

Read the next topic push, decoded into a typed `IncomingTopic`. Queued topics
are returned first. Cancelling this future poisons the client: drop it and
reconnect rather than calling again.

```rust
pub async fn next_event(&mut self) -> Result<IncomingTopic, RynkHostError>
```

`IncomingTopic` distinguishes recognized from unrecognized pushes:

```rust
pub enum IncomingTopic {
    /// A recognized topic, decoded by the shared topic table.
    Topic(TopicEvent),
    /// A topic this build doesn't recognize, or one whose payload failed
    /// to decode.
    Unknown(TopicFrame),
}
```

Source: `rynk/src/api.rs:32-50`.

### Best-effort delivery

Topics are **best-effort**: the link can drop a push.

- **Full queue** — the in-client event queue has capacity 64. When it is
  full, the oldest topic is evicted and `events_dropped` is incremented. The
  client only observes its own queue overflow.
- **BLE notification loss** — on a BLE transport, an OS-level notification
  drop is invisible to the client and does not increment `events_dropped`.

When a push may have been missed, re-read the critical state with the
matching `Get*` call. For example, after a possible `ConnectionChange` loss,
call `get_connection_status()` — it returns the same payload the topic would
have delivered.

Source: `rynk/src/api.rs:24-31`, `rynk/src/driver.rs:286-298`.
