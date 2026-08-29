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
│                 │ JsByteLink { label, send, recv, close }    │
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
    │  └─ ble (rynk-ble / bluest) │
    └─────────────────────────────┘
```

## File Layout

```text
src-tauri/src/
├── main.rs                 — fn main() + tauri::Builder + generate_handler
└── transport/
    ├── mod.rs              — Session model, spawn_tokio_io/spawn_session, rynk_pump, rynk_send/recv/close/close_all
    ├── usb.rs              — UsbDeviceInfo, rynk_discover_usb, rynk_connect_usb
    ├── tcp.rs              — TcpDeviceInfo, rynk_discover_tcp, rynk_connect_tcp
    └── ble.rs              — BleDeviceInfo, rynk_discover_ble, rynk_connect_ble

src/rynk/
├── index.ts               — Unified discover() + connect API, isTauri() detection
├── tauri.ts               — TauriByteLink + discover/connect helpers (invoke)
└── web.ts                 — WebUsbLink (WebUSB) + WebHidLink (WebHID)
```

## Tauri Commands

Ten commands, all returning `Result<T, String>` except `rynk_discover_tcp`,
which returns a plain `Vec<TcpDeviceInfo>` — the probe cannot fail, only come
up empty:

| Command | Module | Purpose |
|---------|--------|---------|
| `rynk_discover_usb` | `usb.rs` | List devices carrying the Rynk vendor interface triple |
| `rynk_discover_ble` | `ble.rs` | List OS-connected BLE devices exposing the Rynk service (no scan) |
| `rynk_discover_tcp` | `tcp.rs` | Probe `127.0.0.1:7965` (dev-only, 300ms timeout) |
| `rynk_connect_usb` | `usb.rs` | Open device, claim the vendor interface |
| `rynk_connect_ble` | `ble.rs` | Open via `rynk-ble` (GATT attach), pump the halves |
| `rynk_connect_tcp` | `tcp.rs` | Connect TCP, split read/write |
| `rynk_send` | `mod.rs` | Write bytes to session (waits for write ack) |
| `rynk_recv` | `mod.rs` | Read bytes from session (parks until data) |
| `rynk_close` | `mod.rs` | Close session, drop transport |
| `rynk_close_all` | `mod.rs` | Close every session (frontend teardown) |

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

The `oneshot` ack on `Send` is critical: `rynk_send` resolves only once the
task has written the bytes into the transport, honoring the rynk transport
contract ("A successful `write` MUST commit the returned bytes"). Without
it, the frontend's awaited `send()` would resolve while the bytes still sat
queued in the command channel.

### Reader/writer task

Each transport spawns a `tokio::spawn` task that owns the transport and runs
a `tokio::select!` loop:

- **TCP** (`spawn_tokio_io`): uses `tokio::io::split` to get separate
  `AsyncRead` + `AsyncWrite` halves. The select loop reads from the read half
  and writes from the command channel.
- **USB and BLE** (`rynk_pump` via `spawn_session`): the same loop shape over
  the `embedded-io-async` halves `rynk-usb` / `rynk-ble` hand out
  (`UsbReader`/`UsbWriter`, `BleReader`/`BleWriter`). `spawn_session`
  registers a session around a pump built at the caller's concrete types —
  the pump's future only proves `Send` once the halves are concrete.

All three produce `(cmd_tx, data_rx)` feeding into the same `Session` struct.
The unification point is the Session contract, not a shared spawn function.

### EOF signaling

When the transport reads `Ok(0)` or an error, the task sends `Vec::new()`
(empty array) on `data_tx` and breaks. `rynk_recv` returns this empty array.
The frontend's `TauriByteLink.recv()` returns `new Uint8Array(0)`, which
`WasmReader` reads as `Ok(0)` (EOF) — the rynk driver surfaces that as
`RynkHostError::Disconnected`.

## USB Transport

### Discovery

`rynk_discover_usb` calls `rynk_usb::UsbDevice::discover()`, which matches the
vendor interface class triple (`0xFF/0x52/0x52`) against every USB device —
VID/PID never enter into it. Enumeration reads cached descriptors and opens
nothing; the returned `id` is the `nusb::DeviceId` formatted as a string, and
the label is the descriptor's product string (falling back to the numeric
`vid:pid` when the descriptor carries none).

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

### Library: rynk-ble

rmk-gui uses the upstream [`rynk-ble`](https://crates.io/crates/rynk-ble)
crate (built on `bluest`). Everything BLE-specific — the service and
characteristic UUIDs (from `rmk-types::protocol::rynk`), the GATT attach, the
notification stream, write chunking — lives upstream; `ble.rs` is a thin
adapter that feeds the halves `rynk-ble` hands out into the same session pump
as USB.

### Discovery

There is no scan: a keyboard the host is typing on is already connected, and
a connected peripheral stops advertising — scanning would never find it.
`BleDevice::discover()` asks the adapter for already-connected devices
exposing the Rynk service UUID, which is also the only way to tell a Rynk
keyboard from any other.

`rynk_discover_ble` wraps the call in a 3s timeout (`DISCOVER_TIMEOUT`): an
adapter that is off, or whose permission the user has not answered, parks in
`wait_available` instead of erroring — and the device list waits on every
transport, so an unbounded BLE probe would hide the USB keyboards too.

Each device is identified by its `bluest` `DeviceId` formatted as a string —
the stable picker key, unlike the BLE name, which may be absent or shared.

### Connect

`rynk_connect_ble` re-discovers, matches the id back to a device, and calls
`device.open()`: `rynk-ble` connects, discovers the service and
characteristics by UUID, and subscribes — bounded by its `GATT_TIMEOUT`
(10s), since those GATT operations carry no inherent timeout. `open()`
returns only once the subscription is live (the order the firmware needs
before the client's first write), yielding the `BleReader`/`BleWriter`
halves fed to `rynk_pump`.

Write chunking lives in `rynk-ble`'s `BleWriter`: one write-without-response
per chunk, capped to the characteristic's `max_write_len` clamped to
`[BLE_SAFE_WRITE = 20, RYNK_BLE_CHUNK_SIZE = 244]`.

## Frontend

### TauriByteLink (`src/rynk/tauri.ts`)

Wraps Tauri `invoke` calls into the `JsByteLink` shape:

```typescript
class TauriByteLink {
  constructor(private sessionId: string, readonly label: string) {}
  async send(frame: Uint8Array) { await invoke('rynk_send', { session: ..., data: Array.from(frame) }) }
  async recv(): Promise<Uint8Array> { return new Uint8Array(await invoke('rynk_recv', ...)) }
  async close() { await invoke('rynk_close', ...) }
}
```

`rynk-wasm` only ever uses `label`, `send`, and `recv`; `close()` (and
`closeAllSessions()` → `rynk_close_all`) is the page's teardown — the
protocol layer never closes a link.

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

Each `TransportInfo` carries a `connect()` closure that returns a
`ConnectedDevice { link, label }`. The caller hands the link to
`connectClient(link)` (`src/rynk/core.ts`), which probes the protocol
version, loads the wasm, and calls `core.connect(link)` — `connect` takes
only the link; the label rides on the link itself. The protocol layer takes
over from there.

Granting a new device needs the browser's picker, which must run inside a user
gesture — `requestUsbDevice()` / `requestHidDevice()` are the click-handler
entry points; the grant then joins the same `discover()` list.
