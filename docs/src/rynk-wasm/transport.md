# WasmReader & WasmWriter

The wasm transport adapts a JS-owned byte link to the `rynk::io::Read` and
`Write` traits. `JsByteLink` — the object the page hands to `connect()` over
WebUSB, WebHID, or any custom implementation — implements `rynk::RynkDevice`,
and its `open()` hands out the two halves: `WasmReader` and `WasmWriter`.

The page owns the link's lifetime: it opens the link before `connect` and
closes it on teardown — nothing on the Rust side closes it.

Source: `rynk/rynk-wasm/src/transport.rs`

## JsByteLink (extern type)

`JsByteLink` is a `#[wasm_bindgen]` extern type — a JS object with a `label`
string property and two async methods. Rust calls them across the ABI; the
browser page implements them:

```rust
#[wasm_bindgen]
extern "C" {
    #[derive(Clone)]
    pub type JsByteLink;

    #[wasm_bindgen(method, getter, js_name = label)]
    fn js_label(this: &JsByteLink) -> String;

    // Raw `Promise` imports (not `async`) so the halves get nameable
    // futures they can park across cancelled `read`s and `write`s.
    #[wasm_bindgen(method, catch)]
    fn send(this: &JsByteLink, frame: Uint8Array) -> Result<Promise, JsValue>;

    #[wasm_bindgen(method, catch)]
    fn recv(this: &JsByteLink) -> Result<Promise, JsValue>;
}
```

- `label` — the display name the page supplied for this device, surfaced as
  `RynkDevice::label()`.
- `send(frame: Uint8Array)` — send bytes to the browser transport. Must deliver
  bytes in order and resolve only after the transport has accepted them.
- `recv()` — receive bytes. Returns a `Uint8Array` of any non-empty chunk size;
  returns an empty `Uint8Array` only at EOF (link closed).

There is no `close` binding: closing the link is the page's job (see the
contract below). The JS-side shape is documented in
[JS Byte Link Implementations](./js-byte-link.md).

## RynkDevice Implementation

The browser owns discovery (the WebUSB/WebHID chooser) and opens the link, so
the already-open `JsByteLink` itself is the transport's `RynkDevice`. `open()`
only wraps it into the two halves; the trait's provided `connect()` then runs
the same handshake as the native transports:

```rust
impl RynkDevice for JsByteLink {
    type Read = WasmReader;
    type Write = WasmWriter;

    fn label(&self) -> String {
        self.js_label()
    }

    async fn open(self) -> Result<(WasmReader, WasmWriter), RynkHostError> {
        Ok((
            WasmReader { link: self.clone(), recv: None, pending: Vec::new(), pos: 0 },
            WasmWriter { link: self, send: None },
        ))
    }
}
```

Both halves implement `ErrorType` with `ErrorKind` (from `rynk::io`), matching
the `embedded-io-async` error model the native transports use.

## WasmReader

```rust
pub struct WasmReader {
    link: JsByteLink,
    /// In-flight `recv()`, parked so a cancelled `read` resumes it.
    recv: Option<JsFuture>,
    /// Holds a chunk larger than one `read` buffer across reads.
    pending: Vec<u8>,
    pos: usize,
}
```

`Read::read(&mut buf)` fills the caller's scratch buffer, refilling from
`recv()` once the current chunk is drained:

```rust
impl Read for WasmReader {
    async fn read(&mut self, buf: &mut [u8]) -> Result<usize, Self::Error> {
        if buf.is_empty() {
            return Ok(0);
        }
        // Refill once the current chunk is drained.
        while self.pos >= self.pending.len() {
            if self.recv.is_none() {
                self.recv = Some(JsFuture::from(self.link.recv().map_err(|_| ErrorKind::Other)?));
            }
            let value = self.recv.as_mut().unwrap().await;
            self.recv = None;
            let value = value.map_err(|_| ErrorKind::Other)?;
            // Only an empty byte array is EOF; any other JS value is invalid data.
            let chunk = value.dyn_into::<Uint8Array>().map_err(|_| ErrorKind::InvalidData)?;
            if chunk.length() == 0 {
                return Ok(0); // EOF
            }
            self.pending = chunk.to_vec();
            self.pos = 0;
        }
        let n = buf.len().min(self.pending.len() - self.pos);
        buf[..n].copy_from_slice(&self.pending[self.pos..self.pos + n]);
        self.pos += n;
        Ok(n)
    }
}
```

Key behaviors:

- **One in-flight `recv()`**: the `JsFuture` is parked in `self.recv`. If the
  `read()` is cancelled (the `await` is dropped), the future is not lost — it
  stays parked and is resumed on the next `read()`, so a cancelled read does
  not lose already-requested data.
- **EOF**: an empty `Uint8Array` (`new Uint8Array(0)`) means the link is
  closed. `read()` returns `Ok(0)`, and the `rynk` driver maps that to
  `RynkHostError::Disconnected`.
- **Invalid type**: if `recv()` resolves to anything that is not a
  `Uint8Array`, the link is misbehaving and `read()` returns
  `ErrorKind::InvalidData`.
- **Chunk size**: `recv()` may return any non-empty chunk size. The reader
  keeps the chunk in `pending`, copies `min(buf.len(), remaining)` per
  `read()`, and advances `pos` until the chunk is consumed. The driver's frame
  reassembly handles arbitrary chunk boundaries.
- **JS error**: if `recv()` throws or its promise rejects, `read()` returns
  `ErrorKind::Other`. The driver maps read errors to `RynkHostError::Io`.

## WasmWriter

```rust
pub struct WasmWriter {
    link: JsByteLink,
    /// In-flight `send()`, parked so a cancelled `write` drains it instead of
    /// starting a second one: JS promises do not cancel, and two live sends
    /// interleave their bytes.
    send: Option<JsFuture>,
}
```

```rust
impl WasmWriter {
    /// Waits until no `send` is in flight, clearing the parked one only once it
    /// resolves so a cancel here re-parks it rather than dropping it.
    async fn drain(&mut self) -> Result<(), ErrorKind> {
        if let Some(send) = self.send.as_mut() {
            let done = send.await;
            self.send = None;
            done.map_err(|_| ErrorKind::Other)?;
        }
        Ok(())
    }
}

impl Write for WasmWriter {
    async fn write(&mut self, buf: &[u8]) -> Result<usize, Self::Error> {
        if buf.is_empty() {
            return Ok(0);
        }
        self.drain().await?; // a cancelled `write` leaves its send running
        self.send = Some(JsFuture::from(
            self.link.send(Uint8Array::from(buf)).map_err(|_| ErrorKind::Other)?,
        ));
        self.drain().await?;
        Ok(buf.len())
    }

    async fn flush(&mut self) -> Result<(), Self::Error> {
        Ok(())
    }
}
```

Key behaviors:

- **Cancel-safe writes**: cancelling a `write()` cannot stop the JS `send`
  promise it already started, and two live sends interleave their bytes into
  frames the firmware can only discard. So the in-flight `send` is parked in
  `self.send`, and the next `write()` drains it to completion before starting
  a new one. This matters because the wasm pump (`RynkClient::drive`) drops
  `Driver::run` — possibly mid-frame — whenever a call it was carrying
  resolves.
- **Full-buffer writes**: `write()` hands the whole buffer to `link.send()` in
  one call and returns `buf.len()` on success.
- **`flush()` is a no-op**: the contract is that `send()` resolves only after
  the browser transport has accepted the bytes, so writes are delivered
  without an explicit flush.
- **JS error**: if `send()` throws or its promise rejects, `write()` returns
  `ErrorKind::Other`, which the driver maps to `RynkHostError::Io`.

## JsByteLink Contract

`JsByteLink` is a byte-stream boundary, not a high-level Rynk API. The full
contract (from `rynk/rynk-wasm/README.md`):

- **`label`** is a string naming the device. `rynk-wasm` reads it only when the
  host asks (`RynkDevice::label`); `connect()` does not.
- **`send(bytes)`** receives bytes from Rust and must deliver them in order. It
  should resolve only after the browser transport has accepted the bytes.
- **`recv()`** must wait until bytes are available or the link is closed. It may
  return any non-empty chunk size; it does not need to return exactly one Rynk
  frame. The driver reassembles frames from arbitrary chunk boundaries.
- **`recv()`** returns `new Uint8Array(0)` only for EOF. That becomes
  `Disconnected` in the wasm API.
- **Closing the link is the page's job** — `rynk-wasm` never calls a `close`
  method and does not require one. Close on every exit path, including a
  rejected `connect()`: release the device and wake any pending `recv()`,
  which then returns the EOF empty array.
- **Only `rynk-wasm` should call `recv()` after `connect()`.** If your page
  needs to probe the protocol version first, do it before calling `connect()`.
- **Transport-specific framing lives below this boundary.** WebHID reports are
  a fixed size, so the link splits outgoing bytes across reports and passes
  incoming reports through as-is: the zero padding decodes as empty COBS
  frames, which the Rynk deframer discards.

Reference implementations for both built-in transports are in
[JS Byte Link Implementations](./js-byte-link.md).
