# API Reference

The typed endpoint surface Rynk exposes to a host application. Every method
below lives on `Client`, is `async`, and takes `&self` — one shared client
serves concurrent request calls and a topic loop at the same time. All
examples assume a connected session; see [Architecture](./architecture.md)
for the session model.

Source: `rynk/src/api.rs`, `rynk/src/driver.rs`, `rynk/src/device.rs`,
`rmk-types/src/protocol/rynk/payload/system.rs`.

## 1. Client Overview

A session is a `Client` plus a `Driver`, created together by
`RynkDevice::connect`. The `Client` carries the protocol surface — typed
requests and the topic stream — and owns SEQ correlation, the in-flight slot
pool, a topic queue, and the capability snapshot taken at handshake time. The
`Driver` owns the link's read/write halves and moves the bytes: `Driver::run`
pumps both directions until the link dies, then returns the fatal error.

```rust
pub struct Client {
    // request channel to the driver, SEQ-matched reply slots,
    // topic queue, cached capability snapshot ...
}

pub struct Driver<R: Read, W: Write> {
    // the link's read/write halves plus frame-reassembly state
}
```

Up to `MAX_IN_FLIGHT` (4 on alloc builds, 1 on no-alloc builds) requests can
run concurrently; replies are matched back by SEQ, so they may complete in
any order. Callers beyond the pool wait for a free slot instead of flooding
the device. Cancelling a call is safe: its slot is freed and a late reply is
dropped as unmatched.

Source: `Client`, `Driver`, and `MAX_IN_FLIGHT` in `rynk/src/driver.rs`.

### `RynkDevice::connect() -> (Client, Driver)`

The one entry point, implemented per transport (USB serial, BLE, web). It
opens the link and drives the handshake — `GetVersion` and `GetCapabilities`
ride **one** round trip, joined:

1. `GetVersion` — rejects only a **major**-version mismatch
   (`RynkHostError::VersionMismatch`). A newer **minor** is accepted (logged
   as informational); commands/topics new to that minor are simply
   unavailable.
2. `GetCapabilities` — cached on the client and used for every later
   capability gate and for request-size limits.

```rust
let (client, mut driver) = device.connect().await?;
```

Runtime-free, so no handshake timeout: a silent peer hangs here — callers
that need a bound wrap `connect` in their runtime's timeout. Connection
identity (serial path, BLE name) comes from `RynkDevice::label()` on the
not-yet-connected handle, not from the client.

Source: `RynkDevice::connect` and `handshake` in `rynk/src/device.rs`.

### Driving a session

There is no in-band death signal: a call waiting on a dead session never
finishes on its own. Run `Driver::run` in the same `select` as everything
that awaits on the `Client` — when the driver returns, the `select` exits
and drops the session, cancelling any parked request or `next_topic()` call.

```rust
select3(
    driver.run(&client),                     // returns when the link dies
    async { loop { handle(client.next_topic().await); } },
    async { /* typed requests on &client */ },
).await;
```

There is no liveness probe and no drop counter. The link's fatal error is
`Driver::run`'s return value; topic-queue overflow silently drops the oldest
event (topics are best-effort by contract — re-read critical state with the
matching `Get*` call).

Source: crate docs in `rynk/src/lib.rs`, `Driver::run` in
`rynk/src/driver.rs`.

## 2. System

### `get_version() -> ProtocolVersion`

Read the firmware's protocol version. This is the same value `connect()`
probed; useful only for diagnostics after the handshake.

```rust
pub async fn get_version(&self) -> Result<ProtocolVersion, RynkHostError>
```

Source: `Client::get_version` in `rynk/src/api.rs`.

### `get_capabilities() -> DeviceCapabilities`

Return the capability set saved during the connect handshake. Capabilities
are firmware constants, so **nothing is sent to the device** — this is a free
read of the cached snapshot, the same data the crate-internal capability
gates use.

```rust
pub async fn get_capabilities(&self) -> Result<DeviceCapabilities, RynkHostError>
```

Source: `Client::get_capabilities` in `rynk/src/api.rs`.

### `get_device_info() -> DeviceInfo`

Read the firmware and device identity — for display and per-device host
profiles; feature gating stays with `get_capabilities()`.

```rust
pub struct DeviceInfo {
    /// Version of the `rmk` crate baked into the firmware.
    pub rmk_version: FirmwareVersion, // { major, minor, patch }
    pub vendor_id: u16,
    pub product_id: u16,
    // each string at most 32 bytes (DEVICE_INFO_STRING_SIZE)
    pub manufacturer: String<DEVICE_INFO_STRING_SIZE>,
    pub product_name: String<DEVICE_INFO_STRING_SIZE>,
    pub serial_number: String<DEVICE_INFO_STRING_SIZE>,
}
```

Source: `Client::get_device_info` in `rynk/src/api.rs`, `DeviceInfo` in
`rmk-types/src/protocol/rynk/payload/system.rs`.

### `reboot()`

Fire-and-forget: the firmware resets before its session loop can reply, so
`Ok(())` only means the request frame was queued for the driver's writer —
keep the driver running long enough to write it out. Sent via
`send_no_reply` — no response is waited for.

```rust
pub async fn reboot(&self) -> Result<(), RynkHostError>
```

Source: `Client::reboot` in `rynk/src/api.rs`.

### `bootloader_jump()`

Jump to the bootloader (DFU mode). Same fire-and-forget contract as
[`reboot()`](#reboot): `Ok(())` means the frame was queued, not that the
jump completed. **Gated behind the lock** on the firmware side (see
[Gated commands](#gated-commands)).

Source: `Client::bootloader_jump` in `rynk/src/api.rs`.

### `storage_reset(mode: StorageResetMode)`

Reset persistent storage. Rejected locally — without touching the wire — when
`!storage_enabled`, where the wipe would be a silent no-op. Also **gated
behind the lock** on the firmware side.

```rust
pub enum StorageResetMode {
    /// Reset all stored data — including keymap and BLE bonds.
    Full,
    /// Reset only the layout/keymap data, preserving BLE bonds.
    LayoutOnly,
}
```

```rust
pub async fn storage_reset(&self, mode: StorageResetMode) -> Result<(), RynkHostError>
```

Source: `Client::storage_reset` in `rynk/src/api.rs`, `StorageResetMode` in
`rmk-types/src/protocol/rynk/payload/system.rs`.

## 3. Lock Gate & Security

Some commands are gated behind a physical-presence unlock ceremony. The lock
is a firmware-side gate: a locked device rejects gated commands with
`RynkError::Locked`, which the client flattens to
`RynkHostError::Rejected(RynkError::Locked)`.

### `get_lock_status() -> LockStatus`

Pure read, no side effects. Returns the challenge to hold and the current
progress of any armed attempt.

```rust
pub async fn get_lock_status(&self) -> Result<LockStatus, RynkHostError>
```

Source: `Client::get_lock_status` in `rynk/src/api.rs`.

### `unlock_poll() -> LockStatus`

Arm or refresh a physical-presence unlock attempt and sample the held
challenge keys. Poll every ~150 ms while the user holds the challenge keys:
`remaining_keys` counts down, and the attempt succeeds (`locked == false`)
once all are held simultaneously. The firmware window lapses ~500 ms after
polls stop, so cancelling is simply "stop polling."

```rust
pub async fn unlock_poll(&self) -> Result<LockStatus, RynkHostError>
```

Source: `Client::unlock_poll` in `rynk/src/api.rs`, `RYNK_UNLOCK_WINDOW` in
`rmk/src/host/rynk/mod.rs`.

### `lock()`

Relock immediately. A no-op on an `insecure` device (one built with
`insecure` set in its lock config).

```rust
pub async fn lock(&self) -> Result<(), RynkHostError>
```

Source: `Client::lock` in `rynk/src/api.rs`.

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

Source: `LockStatus` in `rmk-types/src/protocol/rynk/payload/system.rs`.

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

Always gated: `bootloader_jump()`, `storage_reset()`, `get_matrix_state()`,
and (on BLE builds) `clear_ble_profile()`. When the firmware is built with
`write_requires_unlock` in its `[host]` config, every config write
(`set_key`, `set_default_layer`, `set_encoder`, `set_macro`, `set_combo`,
`set_morse`, `set_fork`, `set_behavior`, and the `Set*Bulk` endpoints — so
also the `write_all_*` pagers) is gated too. A locked device returns
`RynkError::Locked`, which the client flattens to
`RynkHostError::Rejected(RynkError::Locked)`.

Source: `requires_unlock` in `rmk/src/host/rynk/mod.rs`, `LockConfig` in
`rmk/src/config/lock.rs`.

## 4. Keymap

### `get_key(layer, row, col) -> KeyAction`

Read one key's action.

```rust
pub async fn get_key(&self, layer: u8, row: u8, col: u8)
    -> Result<KeyAction, RynkHostError>
```

Source: `Client::get_key` in `rynk/src/api.rs`.

### `set_key(layer, row, col, action)`

Write one key's action.

```rust
pub async fn set_key(&self, layer: u8, row: u8, col: u8, action: KeyAction)
    -> Result<(), RynkHostError>
```

Source: `Client::set_key` in `rynk/src/api.rs`.

### `get_default_layer() -> u8` / `set_default_layer(layer)`

Read or set the default layer index.

```rust
pub async fn get_default_layer(&self) -> Result<u8, RynkHostError>
pub async fn set_default_layer(&self, layer: u8) -> Result<(), RynkHostError>
```

Source: `Client::get_default_layer` / `Client::set_default_layer` in
`rynk/src/api.rs`.

### `get_encoder(encoder_id, layer) -> EncoderAction` / `set_encoder(encoder_id, layer, action)`

Read or write both rotation actions for one encoder on one layer.

```rust
pub async fn get_encoder(&self, encoder_id: u8, layer: u8)
    -> Result<EncoderAction, RynkHostError>
pub async fn set_encoder(&self, encoder_id: u8, layer: u8, action: EncoderAction)
    -> Result<(), RynkHostError>
```

Source: `Client::get_encoder` / `Client::set_encoder` in `rynk/src/api.rs`.

### `get_layout() -> LayoutInfo`

Read the physical layout. The firmware serves it as an opaque, compressed
blob paged over `GetLayout` (by byte offset); the first page reports the
blob's `total_len` and fixes the page size, then the remaining pages are
fetched concurrently on the in-flight lanes, and the blob is inflated and
decoded into `LayoutInfo`. An advertised blob length over 64 KiB is rejected
with `RynkHostError::Layout`. An empty blob (firmware built without a
`[layout].map`) yields an empty `LayoutInfo`, not an error. Alloc builds
only.

See [layout.md](./layout.md) for the `LayoutInfo` structure and blob format.

Source: `Client::get_layout` in `rynk/src/api.rs`.

## 5. Bulk Transfer & Full-Resource Sync

Bulk endpoints transfer whole tables in page-sized chunks. They are an
optional firmware feature — a device built without `bulk_transfer_supported`
rejects every bulk method locally, without touching the wire.

### Capability gate

```rust
fn require_bulk_transfer(&self, cmd: Cmd) -> Result<(), RynkHostError> {
    if self.capabilities.bulk_transfer_supported { Ok(()) }
    else { Err(RynkHostError::Unsupported(cmd, "bulk transfer not supported")) }
}
```

Returns `RynkHostError::Unsupported` **without a wire send** when
`!bulk_transfer_supported`. The link stays alive — the session remains usable.
This is critical for UI: surface "feature unavailable," not "disconnected."

Source: `Client::require_bulk_transfer` in `rynk/src/api.rs`.

### Low-level bulk methods

Each low-level method fetches or writes one page starting at a given cursor.
A read page holds up to `max_bulk_keys` keys (keymap) or `max_bulk_items`
entries (combos/morse).

```rust
// Keymap
pub async fn get_keymap_bulk(
    &self, layer: u8, start_row: u8, start_col: u8,
) -> Result<GetKeymapBulkResponse, RynkHostError>

pub async fn set_keymap_bulk(
    &self, request: SetKeymapBulkRequest,
) -> Result<(), RynkHostError>

// Combos
pub async fn get_combo_bulk(
    &self, start_index: u8,
) -> Result<GetComboBulkResponse, RynkHostError>

pub async fn set_combo_bulk(
    &self, request: SetComboBulkRequest,
) -> Result<(), RynkHostError>

// Morse
pub async fn get_morse_bulk(
    &self, start_index: u8,
) -> Result<GetMorseBulkResponse, RynkHostError>

pub async fn set_morse_bulk(
    &self, request: SetMorseBulkRequest,
) -> Result<(), RynkHostError>
```

`get_keymap_bulk` walks forward through the keymap column by column, then
row by row, then layer by layer: up to `max_bulk_keys` keys, fewer at the
keymap's end. A start position outside the keymap is rejected with
`RynkError::Invalid`. `get_combo_bulk` / `get_morse_bulk` return an empty
page for a `start_index` past the last slot.

Source: `Client::get_keymap_bulk` … `Client::set_morse_bulk` in
`rynk/src/api.rs`.

### High-level pagers

The pagers auto-chunk so callers do not manage cursors, and run their pages
concurrently on the `MAX_IN_FLIGHT` lanes. They are the recommended way to
sync a whole table. Alloc builds only.

```rust
// Read the whole keymap (every layer, in get_keymap_bulk order)
pub async fn read_all_keymap(&self) -> Result<Vec<KeyAction>, RynkHostError>

// Write the whole keymap
pub async fn write_all_keymap(&self, actions: Vec<KeyAction>) -> Result<(), RynkHostError>

// Combos
pub async fn read_all_combos(&self) -> Result<Vec<Combo>, RynkHostError>
pub async fn write_all_combos(&self, configs: Vec<Combo>) -> Result<(), RynkHostError>

// Morse
pub async fn read_all_morses(&self) -> Result<Vec<Morse>, RynkHostError>
pub async fn write_all_morses(&self, configs: Vec<Morse>) -> Result<(), RynkHostError>
```

Source: `Client::read_all_keymap` … `Client::write_all_morses` in
`rynk/src/api.rs`.

### Pager behavior

- **Read pagers** (`read_all_*`) split the resource into fixed-size windows
  that the lanes — one per in-flight slot — claim from a shared cursor and
  read concurrently. Windows are sized so
  one round trip fills them even while the other lanes' requests sit parked
  in the firmware's shared frame buffer (parked requests shrink the reply a
  page can carry). A reply window squeezed to nothing comes back as
  `RynkError::Busy` and is retried (up to 16 times per window). Only a start
  past the device's last item pages empty; the final stitch stops at the
  first gap, so a device with fewer items than the capability-derived total
  still terminates cleanly.

- **Write pagers** (`write_all_*`) pack pages by each item's **real encoded
  size** up to the device's `max_payload_size` — several times denser than
  the advertised worst-case counts — then spread the pages evenly across the
  lanes. An item too big to fit a frame alone fails with
  `RynkHostError::Encode` before anything is sent. A failed page stops its
  lane while the others go on, so a failure can leave part of the write
  applied. When bulk is unsupported, the low-level `Set*Bulk` capability
  gate rejects the first page with `Unsupported`.

Source: `Client::read_all`, `Client::write_all`, and `split_pages` in
`rynk/src/api.rs`.

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

Source: `keymap_pos` in `rynk/src/api.rs`.

## 6. Combos, Forks, Morse, Macros

Single-entry read/write for the configuration tables. Each takes an index
(or offset, for macros) and a config value.

```rust
// Combos
pub async fn get_combo(&self, index: u8) -> Result<Combo, RynkHostError>
pub async fn set_combo(&self, index: u8, config: Combo) -> Result<(), RynkHostError>

// Forks
pub async fn get_fork(&self, index: u8) -> Result<Fork, RynkHostError>
pub async fn set_fork(&self, index: u8, config: Fork) -> Result<(), RynkHostError>

// Morse
pub async fn get_morse(&self, index: u8) -> Result<Morse, RynkHostError>
pub async fn set_morse(&self, index: u8, config: Morse) -> Result<(), RynkHostError>

// Macros
pub async fn get_macro(&self, offset: u16) -> Result<MacroData, RynkHostError>
pub async fn set_macro(&self, offset: u16, data: MacroData) -> Result<(), RynkHostError>
```

Source: `Client::get_combo` … `Client::set_macro` in `rynk/src/api.rs`.

### Macro chunking contract

Macros live in a flat byte region addressed by `offset`; its byte size is
the `macro_space_size` capability (`0` disables the macro data endpoints).
The firmware always replies to `get_macro` with exactly its build-time
`macro_chunk_size`, **zero-filling past the end** of its macro space. The
end of the data therefore **never** shows up as a short chunk — parse the
macro encoding itself for termination. Writes past the end of the device's macro
space are truncated by the firmware.

Source: `Client::get_macro` / `Client::set_macro` in `rynk/src/api.rs`,
`DeviceCapabilities::{macro_space_size, macro_chunk_size}` in
`rmk-types/src/protocol/rynk/payload/system.rs`.

## 7. Behavior

### `get_behavior() -> BehaviorConfig` / `set_behavior(config)`

Read or write the global behavior (timing) configuration.

```rust
pub async fn get_behavior(&self) -> Result<BehaviorConfig, RynkHostError>
pub async fn set_behavior(&self, config: BehaviorConfig) -> Result<(), RynkHostError>
```

```rust
pub struct BehaviorConfig {
    pub combo_timeout_ms: u16,
    pub oneshot_timeout_ms: u16,
    pub tap_interval_ms: u16,
    pub tap_capslock_interval_ms: u16,
    /// Default profile for morse/tap-hold keys; per-key profiles override
    /// it. A `None` field falls back to the firmware default.
    pub morse_default_profile: MorseProfile,
    /// Flow-tap window: a morse key pressed within this time of the
    /// previous key press is forced to its tap action.
    pub morse_prior_idle_time_ms: u16,
}
```

Source: `Client::get_behavior` / `Client::set_behavior` in
`rynk/src/api.rs`, `BehaviorConfig` in
`rmk-types/src/protocol/rynk/payload/system.rs`.

## 8. Status

### `get_current_layer() -> u8`

Read the currently active layer.

Source: `Client::get_current_layer` in `rynk/src/api.rs`.

### `get_matrix_state() -> MatrixState`

Read the matrix scan bitmap. **Gated behind the lock** — a locked device
returns `RynkError::Locked`, flattened to `RynkHostError::Rejected`.

Source: `Client::get_matrix_state` in `rynk/src/api.rs`.

### `get_battery_status() -> BatteryStatus`

Read battery status. BLE firmware only — rejected locally with
`Unsupported` when `!ble_enabled`, without touching the wire.

```rust
pub async fn get_battery_status(&self) -> Result<BatteryStatus, RynkHostError>
```

Source: `Client::get_battery_status` in `rynk/src/api.rs`.

### `get_peripheral_status(slot) -> PeripheralStatus`

Read one split peripheral's status by slot. Split keyboards only — rejected
locally with `Unsupported` when `!is_split`, without touching the wire.

```rust
pub async fn get_peripheral_status(&self, slot: u8)
    -> Result<PeripheralStatus, RynkHostError>
```

Source: `Client::get_peripheral_status` in `rynk/src/api.rs`.

### `get_wpm() -> u16`

Read the current words-per-minute estimate. Sourced from the same state that
the `WpmUpdate` topic pushes.

Source: `Client::get_wpm` in `rynk/src/api.rs`.

### `get_sleep_state() -> bool`

Read the firmware's sleep state. Sourced from the `SleepState` topic
snapshot.

Source: `Client::get_sleep_state` in `rynk/src/api.rs`.

### `get_led_indicator() -> LedIndicator`

Read the host LED indicator state (caps/num/scroll lock, etc.). Sourced from
the `LedIndicatorChange` topic snapshot.

Source: `Client::get_led_indicator` in `rynk/src/api.rs`.

## 9. Connection

### `get_connection_type() -> ConnectionType`

Read the active connection type (USB / BLE).

Source: `Client::get_connection_type` in `rynk/src/api.rs`.

### `get_connection_status() -> ConnectionStatus`

Read the full connection status — the same payload the `ConnectionChange`
topic pushes. Useful for recovering a missed push.

```rust
pub async fn get_connection_status(&self) -> Result<ConnectionStatus, RynkHostError>
```

Source: `Client::get_connection_status` in `rynk/src/api.rs`.

### `get_ble_status() -> BleStatus`

Read BLE status (active profile, connection state). BLE firmware only —
rejected locally with `Unsupported` when `!ble_enabled`, without touching the
wire.

Source: `Client::get_ble_status` in `rynk/src/api.rs`.

### `switch_ble_profile(slot)`

Switch to a BLE profile by slot. BLE firmware only; rejected locally with
`Unsupported` otherwise.

```rust
pub async fn switch_ble_profile(&self, slot: u8) -> Result<(), RynkHostError>
```

Source: `Client::switch_ble_profile` in `rynk/src/api.rs`.

### `clear_ble_profile(slot)`

Clear (unbond) a BLE profile by slot. Tears down the active link if it
targets the connected profile. BLE firmware only; rejected locally with
`Unsupported` otherwise. **Gated behind the lock** on the firmware side —
deleting a bond opens a re-pair hijack window.

```rust
pub async fn clear_ble_profile(&self, slot: u8) -> Result<(), RynkHostError>
```

Source: `Client::clear_ble_profile` in `rynk/src/api.rs`.

## 10. Capability Gating Summary

Several commands are rejected **locally** — before any wire send — when the
cached capabilities say the feature is absent. This is the central principle
that lets a UI distinguish "feature unavailable" from "disconnected."

| Gate | Method | Rejects locally when | Error |
|------|--------|----------------------|-------|
| `require_ble` | `get_battery_status`, `get_ble_status`, `switch_ble_profile`, `clear_ble_profile` | `!ble_enabled` | `Unsupported` |
| `require_bulk_transfer` | `get/set_keymap_bulk`, `get/set_combo_bulk`, `get/set_morse_bulk` (and through them the `read_all_*` / `write_all_*` pagers) | `!bulk_transfer_supported` | `Unsupported` |
| (inline) | `storage_reset` | `!storage_enabled` | `Unsupported` |
| (inline) | `get_peripheral_status` | `!is_split` | `Unsupported` |

```rust
fn require_ble(&self, cmd: Cmd) -> Result<(), RynkHostError> {
    if self.capabilities.ble_enabled { Ok(()) }
    else { Err(RynkHostError::Unsupported(cmd, "BLE not enabled")) }
}
```

**Key principle**: locally-gated rejects return `RynkHostError::Unsupported`
and do **not** kill the link — the session stays usable. This is critical
for UI: show "feature unavailable," not "disconnected."

Source: `Client::require_ble`, `Client::require_bulk_transfer`,
`Client::storage_reset`, `Client::get_peripheral_status` in
`rynk/src/api.rs`.

## 11. Topic Delivery

Topics are firmware-to-host pushes (server to host). Delivery is
**pull-based**, not callback: the host calls `next_topic()` to drain a bounded
queue.

### `next_topic() -> TopicEvent`

Receive the next recognized topic push, decoded into a typed `TopicEvent`.
Queued topics are returned first. Topics the driver did not recognize (or
whose payload failed to decode) were already skipped when they arrived, with
a debug log. Cancelling this future is safe; if the link dies it never
finishes on its own — the surrounding `select` (or, in wasm, the pump arm)
must cancel it. Only one task should consume topics: the queue behind the
client is competitively consumed.

```rust
pub async fn next_topic(&self) -> TopicEvent
```

Source: `Client::next_topic` in `rynk/src/driver.rs`.

### Best-effort delivery

Topics are **best-effort**: the link can drop a push.

- **Full queue** — the in-client topic queue holds `TOPIC_QUEUE_CAPACITY` (8)
  events. When it is full, the oldest topic is evicted silently — there is no
  drop counter.
- **BLE notification loss** — on a BLE transport, an OS-level notification
  drop is invisible to the client.

When a push may have been missed, re-read the critical state with the
matching `Get*` call. For example, after a possible `ConnectionChange` loss,
call `get_connection_status()` — it returns the same payload the topic would
have delivered.

Source: `TOPIC_QUEUE_CAPACITY` and the topic arm of `Driver::run` in
`rynk/src/driver.rs`.
