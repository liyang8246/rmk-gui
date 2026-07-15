# RMK GUI — Development TODO

> Based on the rynk protocol API surface documented in `docs/`.
> Items are ordered by dependency: transport first, then data, then UI.

---

## Phase 1: rynk-wasm Build & Transport Layer

- [ ] **1.1** Add `wasm-pack` build script to package.json / CI
  - Build rynk-wasm from `.slim/clonedeps/repos/HaoboGu__rmk/rynk/rynk-wasm/` with `wasm-pack build --target web`
  - Output `pkg/` into `src/lib/rynk-wasm/` or similar, gitignored (build artifact)
  - Copy `.d.ts` type declarations alongside

- [ ] **1.2** Implement Web Serial `JsByteLink`
  - `navigator.serial.requestPort()` inside user gesture
  - Buffered link: one reader feeds rx, `send` / `recv` / `close`
  - `probeVersion()` — raw GetVersion frame, ignore topic pushes, parse `{ major, minor }`
  - Reference: `docs/src/rynk-wasm/js-byte-link.md`

- [ ] **1.3** Implement WebHID `JsByteLink` (BLE via OS HID)
  - `navigator.hid.requestDevice({ filters: [{ usagePage: 0xFF60, usage: 0x61 }] })`
  - 32-byte report fragmentation + reassembly (frame LEN field trims padding)
  - `probeVersion()`, `send` / `recv` / `close`
  - Reference: `docs/src/rynk-wasm/js-byte-link.md`

- [ ] **1.4** Tauri permissions for Web Serial / WebHID
  - Tauri WebView2 supports `navigator.serial` and `navigator.hid` on Windows
  - Verify CSP and capability config don't block these APIs
  - May need `csp: null` (already set) and specific WebView2 flags

- [ ] **1.5** Connect flow (version probe → loadCore → connect)
  - `loadCore(major)` dynamic import keyed by protocol major
  - `await core.default()` → `await core.connect(link, label)`
  - Store `RynkClient` and `DeviceCapabilities` in app state
  - Reference: `docs/src/rynk-wasm/lifecycle.md`

---

## Phase 2: Connection State & Lifecycle

- [ ] **2.1** Connection store (SolidJS createStore / context)
  - State: `disconnected` | `connecting` | `connected` | `error`
  - Hold `RynkClient`, `DeviceCapabilities`, device label
  - Single client instance (single-borrow rule: await one call before next)

- [ ] **2.2** Disconnect & teardown
  - Close JsByteLink → null client → reset UI
  - Handle `Disconnected` rejection from `next_event()` pump
  - Reference: `docs/src/rynk-wasm/lifecycle.md` "Recipe: Handling Disconnect"

- [ ] **2.3** Auto-reconnect
  - `navigator.serial.getPorts()` / `navigator.hid.getDevices()` for previously granted devices
  - Listen to `connect` / `disconnect` events on both APIs
  - Reconnect when idle, teardown on active transport removal

- [ ] **2.4** Topic pump loop
  - `for (;;)` loop calling `client.next_event()`
  - Route `TopicEvent` variants to UI state stores (LayerChange, WpmUpdate, ConnectionChange, etc.)
  - Check `events_dropped()` → re-read critical state via matching `Get*` call
  - Do NOT issue client requests from inside the pump (single-borrow rule)
  - Reference: `docs/src/rynk-wasm/lifecycle.md` "Recipe: Topic Pump Loop"

---

## Phase 3: Layout & Keymap Display

- [ ] **3.1** Fetch and decode `LayoutInfo`
  - `client.get_layout()` → `LayoutInfo { default_variant, variants }`
  - Handle empty layout (firmware built without `[layout].map`)
  - Reference: `docs/src/rynk/layout.md`

- [ ] **3.2** Render keyboard layout visually
  - Draw keys from `Variant.keys` (rect = center + size, rotation, rect2 for L-shaped)
  - Draw encoders from `Variant.encoders`
  - Variant switcher (ANSI / ISO / etc.)
  - Canvas or SVG rendering, key-units to pixel mapping

- [ ] **3.3** Fetch keymap data
  - If `bulk_transfer_supported`: use `get_keymap_bulk` / `set_keymap_bulk`
  - If not: fall back to per-key `get_key(layer, row, col)`
  - Iterate by `num_layers × num_rows × num_cols` from capabilities
  - Reference: `docs/src/rynk/api-reference.md` §5

- [ ] **3.4** Display key actions on layout
  - Map `KeyAction` to display label (keycode name, or No, or Morse, etc.)
  - Layer selector tabs (0..num_layers-1)
  - Click a key to edit its action

---

## Phase 4: Keymap Editing

- [ ] **4.1** Key action picker / editor
  - Visual keycode picker (categories: letters, numbers, modifiers, function, media, etc.)
  - Support all `KeyAction` variants the firmware uses
  - `set_key(layer, row, col, action)` on save

- [ ] **4.2** Default layer setting
  - `get_default_layer()` / `set_default_layer(layer)`
  - Show current default layer indicator in UI

- [ ] **4.3** Encoder action editing
  - `get_encoder(encoder_id, layer)` / `set_encoder(encoder_id, layer, action)`
  - Show encoders on layout if `num_encoders > 0`

- [ ] **4.4** Bulk keymap write
  - When `bulk_transfer_supported`: `set_keymap_bulk` for batched saves
  - Write-all flow: collect all layer edits, push in one batch
  - Progress indicator for large keymaps

---

## Phase 5: Combos, Forks, Morse, Macros

- [ ] **5.1** Combo editor
  - `get_combo(index)` / `set_combo(index, config)` for each slot (0..max_combos-1)
  - If `bulk_transfer_supported`: use `get/set_combo_bulk` or read_all/write_all
  - UI: list combos, edit trigger keys + output action
  - Gated by `max_combos > 0` in capabilities

- [ ] **5.2** Fork editor
  - `get_fork(index)` / `set_fork(index, config)` for each slot (0..max_forks-1)
  - Gated by `max_forks > 0`

- [ ] **5.3** Morse editor
  - `get_morse(index)` / `set_morse(index, config)` for each slot (0..max_morse-1)
  - If `bulk_transfer_supported`: use `get/set_morse_bulk` or read_all/write_all
  - Gated by `max_morse > 0`

- [ ] **5.4** Macro editor
  - `get_macro(offset)` / `set_macro(offset, data)` — chunk by `macro_chunk_size`
  - Short chunk is NOT end-of-data: parse macro encoding for termination
  - Iterate `offset` from 0 to `macro_space_size` in `macro_chunk_size` steps
  - Gated by `macro_space_size > 0`

---

## Phase 6: Behavior & System

- [ ] **6.1** Behavior config editor
  - `get_behavior()` / `set_behavior(config)`
  - Edit: `combo_timeout_ms`, `oneshot_timeout_ms`, `tap_interval_ms`, `tap_capslock_interval_ms`
  - Numeric input fields with save button

- [ ] **6.2** System actions
  - `reboot()` button (fire-and-forget, show confirmation)
  - `bootloader_jump()` button (DFU mode, fire-and-forget)
  - `storage_reset(mode)` — `Full` or `LayoutOnly`, gated by `storage_enabled`
  - Confirmation dialog for destructive actions

---

## Phase 7: Lock Gate & Security

- [ ] **7.1** Lock status display
  - `get_lock_status()` → show locked/unlocked state
  - Detect permanently locked (`locked && key_positions.length === 0`)
  - Show unlock button when locked and challenge keys are configured

- [ ] **7.2** Unlock ceremony UI
  - Poll `unlock_poll()` every ~150ms while user holds challenge keys
  - Show `remaining_keys` countdown
  - Success when `locked` flips to `false`
  - Firmware window lapses ~500ms after polls stop; cancel = stop polling
  - Reference: `docs/src/rynk/api-reference.md` §3, `docs/src/integration.md` "Lock Gate UI"

- [ ] **7.3** Gated command handling
  - `get_matrix_state()` returns `Rejected` with `name="Rejected"` when locked
  - Show "locked" indicator on gated UI sections
  - Prompt unlock ceremony when user tries a gated action while locked

---

## Phase 8: Status & Connection Monitoring

- [ ] **8.1** Live status dashboard
  - `get_current_layer()` — active layer indicator (also via `LayerChange` topic)
  - `get_wpm()` — WPM display (also via `WpmUpdate` topic)
  - `get_sleep_state()` — sleep indicator (also via `SleepState` topic)
  - `get_led_indicator()` — caps/num/scroll lock (also via `LedIndicatorChange` topic)

- [ ] **8.2** Matrix state visualizer
  - `get_matrix_state()` → pressed bitmap, gated behind lock
  - Highlight pressed keys on layout in real-time
  - Requires unlock if locked

- [ ] **8.3** Connection info panel
  - `get_connection_type()` — USB / BLE
  - `get_connection_status()` — full status (also via `ConnectionChange` topic)
  - BLE-only (gated by `ble_enabled`):
    - `get_ble_status()` — active profile, connection state
    - `switch_ble_profile(slot)` — profile switcher
    - `clear_ble_profile(slot)` — unbond (with confirmation)

- [ ] **8.4** Battery & peripheral status
  - `get_battery_status()` — BLE only (`ble_enabled`)
  - `get_peripheral_status(slot)` — split only (`is_split`), iterate `num_split_peripherals`
  - Capability gating: hide UI when feature absent, show "unavailable" not "error"

---

## Phase 9: Polish & Integration

- [ ] **9.1** Device info panel
  - `get_capabilities()` → full capabilities table (num_layers, num_rows, num_cols, max_combos, etc.)
  - `get_version()` → protocol version display
  - `get_device_info()` → vendor/product/manufacturer/serial (if available)

- [ ] **9.2** Error handling & toasts
  - Map JS error `name` values to user-friendly messages:
    - `Disconnected` → "Connection lost, reconnecting..."
    - `Unsupported` → "This feature is not available on this keyboard"
    - `Rejected` → "Device rejected the request (locked? invalid?)"
    - `VersionMismatch` → "Protocol version mismatch, update firmware or app"
    - `TransportError` → "Communication error"
  - Toast/notification system for transient errors

- [ ] **9.3** Capability-driven UI
  - Show/hide all UI sections based on `DeviceCapabilities`:
    - `ble_enabled` → battery, BLE status, BLE profile controls
    - `bulk_transfer_supported` → bulk sync buttons
    - `is_split` → peripheral status
    - `storage_enabled` → storage reset
    - `max_combos > 0` → combo editor
    - `max_morse > 0` → morse editor
    - `max_forks > 0` → fork editor
    - `macro_space_size > 0` → macro editor
    - `num_encoders > 0` → encoder editor
  - Locally-gated rejects (`Unsupported`) keep the link alive — never treat as fatal

- [ ] **9.4** Keyboard layout import (rynk-kle)
  - Integrate `rynk-kle` WASM bindings (`convert_kle`, `keyboard_toml_to_vial`, `decode_layout`)
  - Import KLE JSON / Vial `vial.json` → preview layout
  - Export current layout to `vial.json`
  - Reference: `docs/src/kle.md`
