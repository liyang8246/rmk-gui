# WasmTransport

`WasmTransport` adapts a JS-owned byte link to the `rynk::io::Read` and `Write`
traits. It is the bridge between the browser transport (Web Serial, WebHID, or
any custom `JsByteLink`) and the protocol client.

Source: `rynk/rynk-wasm/src/transport.rs`

## WasmTransport

```rust
pub struct WasmTransport {
    link: JsByteLink,
    label: String,
    recv: Option<RecvFuture>,
    pending: Vec<u8>,
}
```

`WasmTransport` is a buffered transport over a `JsByteLink`. Its fields:

- `link: JsByteLink` — the JS byte link handle. Cloned into futures so they own
  all they borrow.
- `label: String` — the display name the page supplied for this device, carried
  from `WebDevice::open()` so the connected client can read it back via
  `label()`.
- `recv: Option<RecvFuture>` — one in-flight `recv()` call, boxed and parked
  here so a cancelled `read()` does not lose data.
- `pending: Vec<u8>` — buffered bytes drained from the last `recv()` chunk, not
  yet consumed by `read()`.

```rust
impl WasmTransport {
    pub fn new(link: JsByteLink, label: String) -> Self {
        Self { link, label, recv: None, pending: Vec::new() }
    }

    pub fn label(&self) -> &str {
        &self.label
    }
}
```

The `ErrorType` implementation uses `ErrorKind` (from `rynk::io`), matching the
`embedded-io-async` error model the native transports use.

## JsByteLink (extern type)

`JsByteLink` is a `#[wasm_bindgen]` extern type — a JS object with three async
methods. Rust calls them across the ABI; the browser page implements them:

```rust
#[wasm_bindgen]
extern "C" {
    pub type JsByteLink;

    #[wasm_bindgen(method, catch)]
    async fn send(this: &JsByteLink, frame: Uint8Array) -> Result<(), JsValue>;

    #[wasm_bindgen(method, catch)]
    async fn recv(this: &JsByteLink) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    async fn close(this: &JsByteLink) -> Result<(), JsValue>;
}
```

- `send(frame: Uint8Array) -> Result<()>` — send bytes to the browser transport.
  Must deliver bytes in order and resolve only after the transport has accepted
  them.
- `recv() -> Result<JsValue>` — receive bytes. Returns a `Uint8Array` of any
  non-empty chunk size; returns an empty `Uint8Array` only at EOF (link closed).
- `close() -> Result<()>` — release browser resources (locks, devices). Should
  be idempotent.

The JS-side shape is documented in
[JS Byte Link Implementations](./js-byte-link.md).

## Read Implementation

`WasmTransport` implements `rynk::io::Read`. The client calls `read(&mut buf)`
to fill a scratch buffer; `WasmTransport` refills `pending` from `recv()` once
the current chunk is drained:

```rust
impl Read for WasmTransport {
    async fn read(&mut self, buf: &mut [u8]) -> Result<usize, Self::Error> {
        // Refill once the current chunk is drained.
        while self.pending.is_empty() {
            if self.recv.is_none() {
                let link: JsByteLink = self.link.clone().unchecked_into();
                self.recv = Some(Box::pin(async move { link.recv().await }));
            }
            // Poll in place: a cancelled read() leaves the future parked in self.
            let value = self.recv.as_mut().unwrap().await
                .map_err(|_| ErrorKind::Other)?;
            self.recv = None;
            let Ok(chunk) = value.dyn_into::<Uint8Array>() else {
                return Ok(0); // invalid link implementation
            };
            if chunk.length() == 0 {
                return Ok(0); // EOF
            }
            self.pending = chunk.to_vec();
        }
        let n = buf.len().min(self.pending.len());
        buf[..n].copy_from_slice(&self.pending[..n]);
        self.pending.drain(..n);
        Ok(n)
    }
}
```

Key behaviors:

- **One in-flight `recv()`**: the future is boxed and parked in `self.recv`. If
  the `read()` is cancelled (the `await` is dropped), the future is not lost —
  it stays parked and is re-polled on the next `read()`. This means a cancelled
  read does not lose already-requested data.
- **Invalid type handling**: `recv()` returns `JsValue`. If it is not a
  `Uint8Array` (the link is misbehaving), `read()` returns `Ok(0)`. The `rynk`
  client maps `Ok(0)` to `Disconnected`.
- **EOF**: an empty `Uint8Array` (`new Uint8Array(0)`) means the link is closed.
  `read()` returns `Ok(0)`, and `rynk` maps that to `Disconnected`.
- **Chunk size**: `recv()` may return any non-empty chunk size. `WasmTransport`
  buffers it in `pending` and copies `min(buf.len(), pending.len())` per
  `read()`, draining the remainder on subsequent calls. The client's frame
  reassembly handles arbitrary chunk boundaries.
- **JS error**: if `recv()` rejects (the JS method throws), `read()` returns
  `ErrorKind::Other`, which the client maps to `RynkHostError::Io`.

## Write Implementation

`WasmTransport` implements `rynk::io::Write`:

```rust
impl Write for WasmTransport {
    async fn write(&mut self, buf: &[u8]) -> Result<usize, Self::Error> {
        self.link
            .send(Uint8Array::from(buf))
            .await
            .map_err(|_| ErrorKind::Other)?;
        Ok(buf.len())
    }

    async fn flush(&mut self) -> Result<(), Self::Error> {
        Ok(())
    }
}
```

- `write(buf) -> usize` — wraps `buf` in a `Uint8Array` and calls
  `link.send()`. Returns `buf.len()` on success (the full buffer is always
  handed to the link in one call).
- `flush() -> ()` — no-op. The transport contract is that `send()` resolves only
  after the browser transport has accepted the bytes, so writes are delivered
  without an explicit flush.

If `send()` rejects (JS throws), `write()` returns `ErrorKind::Other`, which the
client maps to `RynkHostError::Io` and latches the link dead.

## Drop Behavior

```rust
impl Drop for WasmTransport {
    fn drop(&mut self) {
        let link: JsByteLink = self.link.clone().unchecked_into();
        spawn_local(async move {
            let _ = link.close().await;
        });
    }
}
```

When `WasmTransport` is dropped (the `RynkClient` goes out of scope, or the link
is replaced), `Drop` clones the link handle and spawns `link.close()` via
`spawn_local`. This releases the browser transport resources (serial port lock,
HID device handle) even if the JS side did not call `close()` explicitly.

`close()` should be idempotent — the JS implementation must tolerate being
called more than once (once from `Drop`, once from the page's teardown). Both
built-in links guard against double-close.

## JsByteLink Contract

`JsByteLink` is a byte-stream boundary, not a high-level Rynk API. The full
contract (from `rynk/rynk-wasm/README.md`):

- **`send(bytes)`** receives bytes from Rust and must deliver them in order. It
  should resolve only after the browser transport has accepted the bytes.
- **`recv()`** must wait until bytes are available or the link is closed. It may
  return any non-empty chunk size; it does not need to return exactly one Rynk
  frame. The client reassembles frames from arbitrary chunk boundaries.
- **`recv()`** returns `new Uint8Array(0)` only for EOF. That becomes
  `Disconnected` in the wasm API.
- **`close()`** should release locks, close devices, and wake any pending
  `recv()`. It should be idempotent.
- **Only `rynk-wasm` should call `recv()` after `connect()`.** If your page
  needs to probe the protocol version first, do it before calling `connect()`.
  The page's own `recv()`/`probeVersion()` loop must stop before handing the
  link to `connect()`.
- **Transport-specific framing must be hidden below this boundary.** For
  example, WebHID report padding must be stripped so wasm sees the same clean
  Rynk byte stream that Web Serial exposes.

Reference implementations for both built-in transports are in
[JS Byte Link Implementations](./js-byte-link.md).
