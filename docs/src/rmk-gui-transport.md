# rmk-gui Transport Layer

This chapter documents rmk-gui's native byte-pipe transport layer — the Tauri
backend commands and frontend `ByteLink` abstraction that feed bytes to
`rynk-wasm`.

## Design Principle

**rynk-wasm is the single protocol layer.** The Tauri backend never touches
the rynk protocol — no `get_key`, no `set_key`, no framing. It is a dumb byte
relay: discover devices, open a connection, pipe bytes in and out. The
frontend loads the same `rynk-wasm` package in both Web and Tauri modes and
hands it a `JsByteLink`. The backend's only job is to produce that link.

```text
┌─────────────── Frontend (webview / wasm) ──────────────────┐
│                                                             │
│  rynk-wasm                                                  │
│  ┌─────────────────────────────────┐                        │
│  │ connect(JsByteLink) → RynkClient│  get_key / set_key / … │
│  └──────────────┬──────────────────┘                        │
│                 │ JsByteLink { send, recv, close }           │
│  ┌──────────────┴──────────────────┐                        │
│  │ TauriByteLink / WebUsbLink /    │                        │
│  │ WebHidLink                      │                        │
│  └──────────────┬──────────────────┘                        │
└─────────────────┼───────────────────────────────────────────┘
                  │
    ┌─────────────┴──────────────┐
    │  Tauri backend (Rust)       │     │  Web (browser)
    │  invoke('rynk_send/recv')   │     │  navigator.usb / navigator.hid
    │  ┌─ usb (rynk-usb / nusb)   │     │  ┌─ WebUsbLink (vendor bulk)
    │  ├─ tcp (tokio TcpStream)   │     │  └─ WebHidLink (BLE-bonded)
    │  └─ ble (btleplug)          │
    └─────────────────────────────┘
```

## File Layout

```text
src-tauri/src/
├── main.rs                 — fn main() + tauri::Builder + generate_handler
└── transport/
    ├── mod.rs              — Session model, spawn_tokio_io, rynk_pump, rynk_send/recv/close
    ├── usb.rs              — UsbDeviceInfo, rynk_discover_usb, rynk_connect_usb
    ├── tcp.rs              — TcpDeviceInfo, rynk_discover_tcp, rynk_connect_tcp
    └── ble.rs              — BleDeviceInfo, rynk_discover_ble, rynk_connect_ble

src/rynk/
├── index.ts               — Unified discover() + connect API, isTauri() detection
├── tauri.ts               — TauriByteLink + discover/connect helpers (invoke)
└── web.ts                 — WebUsbLink (WebUSB) + WebHidLink (WebHID)
```

## Tauri Commands

Nine commands, all returning `Result<T, String>` except `rynk_discover_tcp`
(which has no `State` parameter):

| Command | Module | Purpose |
|---------|--------|---------|
| `rynk_discover_usb` | `usb.rs` | List devices carrying the Rynk vendor interface triple |
| `rynk_discover_ble` | `ble.rs` | Scan for BLE devices advertising Rynk service UUID |
| `rynk_discover_tcp` | `tcp.rs` | Probe `127.0.0.1:7965` (dev-only, 300ms timeout) |
| `rynk_connect_usb` | `usb.rs` | Open device, claim the vendor interface |
| `rynk_connect_ble` | `ble.rs` | Connect + discover GATT + subscribe + spawn task |
| `rynk_connect_tcp` | `tcp.rs` | Connect TCP, split read/write |
| `rynk_send` | `mod.rs` | Write bytes to session (waits for write ack) |
| `rynk_recv` | `mod.rs` | Read bytes from session (parks until data) |
| `rynk_close` | `mod.rs` | Close session, drop transport |

## Session Model

Every connection — USB, TCP, or BLE — produces the same `Session` struct:

```rust
struct Session {
    cmd_tx: mpsc::Sender<SessionCmd>,           // send/close commands → task
    data_rx: Arc<Mutex<mpsc::Receiver<Vec<u8>>>>, // recv ← task
}
```

`Arc<Mutex<>>` on `data_rx` is required because `rynk_recv` must release the
global sessions lock before awaiting `rx.recv()`. Without the `Arc` clone,
the sessions lock would be held across the recv await, serializing all
sessions behind one parked recv.

### SessionCmd

```rust
enum SessionCmd {
    Send(Vec<u8>, oneshot::Sender<()>),  // write + ack when done
    Close,
}
```

The `oneshot` ack on `Send` is critical: it serializes writes so two rapid
sends from the frontend cannot reorder at the task. `rynk_send` awaits the
ack before returning, honoring the rynk transport contract ("a successful
write MUST commit the bytes").

### Reader/writer task

Each transport spawns a `tokio::spawn` task that owns the transport and runs
a `tokio::select!` loop:

- **TCP** (`spawn_tokio_io`): uses `tokio::io::split` to get separate
  `AsyncRead` + `AsyncWrite` halves. The select loop reads from the read half
  and writes from the command channel.
- **USB** (`rynk_pump`): the same loop shape over the `embedded-io-async`
  halves `rynk-usb` hands out.
- **BLE** (`rynk_connect_ble`): uses btleplug's `notifications()` stream for
  reads and `peripheral.write()` for writes. Same select loop shape, different
  read source.

Both produce `(cmd_tx, data_rx)` feeding into the same `Session` struct. The
unification point is the Session contract, not a shared spawn function.

### EOF signaling

When the transport reads `Ok(0)` or an error, the task sends `Vec::new()`
(empty array) on `data_tx` and breaks. `rynk_recv` returns this empty array.
The frontend's `TauriByteLink.recv()` returns `new Uint8Array(0)`, which
`WasmTransport` interprets as EOF → `RynkHostError::Disconnected`.

## USB Transport

### Discovery

`rynk_discover_usb` calls `rynk_usb::UsbDevice::discover()`, which matches the
vendor interface class triple (`0xFF/0x52/0x52`) against every USB device —
VID/PID never enter into it. Enumeration reads cached descriptors and opens
nothing; the returned `id` is the `nusb::DeviceId` formatted as a string, and
the label is the descriptor's product string.

### Connect

`rynk_connect_usb` re-discovers and matches the id back to a device (the role
the serial transport's port path used to play), opens it, claims the vendor
interface, and feeds the bulk halves to `rynk_pump`.

## TCP Transport

### Discovery

`rynk_discover_tcp` probes `127.0.0.1:7965` (the QEMU serial port) with a
300ms timeout. In release builds, it returns an empty vec — QEMU is a
dev-only tool.

Uses `127.0.0.1` instead of `localhost` to avoid IPv6 `::1` resolution
mismatches with QEMU's IPv4-only listener.

### Connect

`rynk_connect_tcp` connects a `tokio::net::TcpStream`, splits it, and feeds
to `spawn_tokio_io`.

## BLE Transport

### Library: btleplug

rmk-gui uses [`btleplug`](https://crates.io/crates/btleplug) 0.12 — a
`Send + Sync` BLE library supporting Windows (WinRT), macOS (CoreBluetooth),
and Linux (BlueZ). Unlike `bluest` (used by the upstream `rynk-ble` crate),
btleplug's `Peripheral` and `Adapter` types are `Send`, so BLE sessions use
plain `tokio::spawn` — no `std::thread` + `LocalSet` workaround needed.

### Constants

Hardcoded in `ble.rs` (kept in sync with `rmk-types::protocol::rynk`):

```rust
const RYNK_SERVICE_UUID: Uuid    = Uuid::from_u128(0x10900067_537f_4f0a_9b55_929e271f61ab);
const RYNK_INPUT_CHAR_UUID: Uuid  = Uuid::from_u128(0x80f9319b_0c74_43a5_9738_c59d6dda3db9);
const RYNK_OUTPUT_CHAR_UUID: Uuid = Uuid::from_u128(0x19802524_6f90_4346_93c2_63dbc509ab55);
const BLE_SAFE_WRITE: usize       = 20;
const RYNK_BLE_CHUNK_SIZE: usize  = 244;
```

### Discovery

`rynk_discover_ble` scans for devices advertising the Rynk service UUID:

1. `adapter.start_scan(ScanFilter { services: [RYNK_SERVICE_UUID] })`
2. `sleep(2s)` — let the scan populate results
3. `adapter.peripherals()` — collect discovered devices
4. `adapter.stop_scan()` — stop scanning (important on Linux/BlueZ)

Each device is identified by `peripheral.id().to_string()` — the
cross-platform stable identifier. On macOS, `address()` returns all-zeros
(CoreBluetooth doesn't expose BD_ADDR), so `id()` must be used instead.

### Connect

`rynk_connect_ble` performs five steps:

1. Re-enumerate `adapter.peripherals()` and find the matching `id()`
2. `peripheral.connect()`
3. `peripheral.discover_services()`
4. Find input/output characteristics by UUID
5. `peripheral.subscribe(&input)` + `peripheral.notifications()`

Then spawns a `tokio::spawn` task that:
- Reads from the notification stream → `data_tx`
- Writes from `cmd_rx` → `peripheral.write()` with `WriteType::WithResponse`
- On `Close`: `unsubscribe()` + `disconnect()` + break

### Write chunking

BLE writes are chunked to `mtu - 3` clamped to `[20, 244]`:

```rust
let write_chunk = (peripheral.mtu() as usize).saturating_sub(3)
    .clamp(BLE_SAFE_WRITE, RYNK_BLE_CHUNK_SIZE);
```

The MTU may not be negotiated yet at connect time (defaults to 23), so the
`clamp(20, 244)` lower bound keeps writes safe even with a stale MTU.

## Frontend

### TauriByteLink (`src/rynk/tauri.ts`)

Wraps Tauri `invoke` calls into the `JsByteLink` shape:

```typescript
class TauriByteLink {
  constructor(private sessionId: string) {}
  async send(frame: Uint8Array) { await invoke('rynk_send', { session: ..., data: Array.from(frame) }) }
  async recv(): Promise<Uint8Array> { return new Uint8Array(await invoke('rynk_recv', ...)) }
  async close() { await invoke('rynk_close', ...) }
}
```

### WebUsbLink (`src/rynk/web.ts`)

Wraps `navigator.usb` into the same `JsByteLink` shape. The device is matched
and claimed by the vendor interface triple; a pump keeps a `transferIn`
pending from the moment the link exists (bulk has no DTR, so a previous
session's unread topic push is drained by the next session's first reads);
`transferOut` writes frames whole. `WebHidLink` is the same shape over the
vendor HID collection an OS-bonded Bluetooth keyboard exposes.

### Unified API (`src/rynk/index.ts`)

`discover()` detects Tauri vs Web at runtime and returns `TransportInfo[]`:

```typescript
async function discover(): Promise<TransportInfo[]> {
  if (!isTauri()) {
    // Web: everything the user has already granted, no gesture needed.
    const [usbs, hids] = await Promise.all([grantedUsbDevices(), grantedHidDevices()])
    // Map each into { kind, id, label, connect, handle }
  }
  const [usbs, bles, tcps] = await Promise.all([
    discoverUsb().catch(() => []),
    discoverBle().catch(() => []),
    discoverTcp().catch(() => []),
  ])
  // Map each into { kind, id, label, connect: () => Promise<ConnectedDevice> }
}
```

Each `TransportInfo` carries a `connect()` closure that returns a `ByteLink`.
The caller passes this to `rynk-wasm`'s `core.connect(link, label)` — the
protocol layer takes over from there.

Granting a new device needs the browser's picker, which must run inside a user
gesture — `requestUsbDevice()` / `requestHidDevice()` are the click-handler
entry points; the grant then joins the same `discover()` list.
