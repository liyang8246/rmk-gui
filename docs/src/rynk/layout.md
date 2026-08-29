# Physical Layout

Rynk serves the keyboard's physical layout — key positions, sizes, rotation,
encoders, and render variants — as an opaque compressed blob via the
`GetLayout` command. The host reassembles the pages, inflates them, and
decodes the result into a typed `LayoutInfo`. This page documents the blob
encoding, the paging protocol, and the types the host decodes into.

Source: `rmk-config/src/layout.rs` (types and blob builder), `rynk/src/layout.rs`
(re-export), `rmk-types/src/protocol/rynk/payload/layout.rs` (`LayoutChunk`)

## 1. Overview

The firmware serves the physical layout as an opaque, compressed blob that
it never decodes itself. The host is responsible for:

1. Reassembling the blob pages served by `GetLayout`.
2. Inflating the compressed bytes (raw DEFLATE).
3. Postcard-decoding the inflated bytes into `LayoutInfo`.

The layout types live in `rmk-config` — the crate that builds the blob at
build time — and `rynk::layout` re-exports them
(`pub use rmk_config::layout::{Encoder, Key, LayoutInfo, Rect, Region, Variant}`),
so producer and decoder share one definition and can't drift. The wire crate
`rmk-types` defines only the paging envelope `LayoutChunk`; the decoded tree
stays out of it so that `#![no_std]` crate remains alloc-free.

### Empty blob

If the firmware was built without a `[layout].map` entry in `keyboard.toml`,
the blob is empty. An empty blob decodes to an empty `LayoutInfo` (no
variants), not an error. This lets a host gracefully handle keyboards that do
not ship a visual layout.

Source: `rynk/src/layout.rs`, `LayoutInfo::empty` in `rmk-config/src/layout.rs`

## 2. LayoutInfo Type

The decoded physical layout is a tree of variants, each with its own keys and
encoders:

```rust
pub struct LayoutInfo {
    pub default_variant: u8,
    pub variants: Vec<Variant>,
}

pub struct Variant {
    pub name: String,
    pub keys: Vec<Key>,
    pub encoders: Vec<Encoder>,
}

pub struct Key {
    pub row: u8,
    pub col: u8,
    pub rect: Rect,
    pub r: f32,
    pub rect2: Option<Rect>,
    pub pivot: Option<Region>,
}

pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

pub struct Region {
    pub deg: f32,
    pub px: f32,
    pub py: f32,
}

pub struct Encoder {
    pub id: u8,
    pub x: f32,
    pub y: f32,
    pub pivot: Option<Region>,
}
```

### Field semantics

**`LayoutInfo`**

- `default_variant` — index into `variants` identifying the variant to render
  by default.
- `variants` — one entry per render variant.

**`Variant`**

- `name` — human-readable variant name (e.g. `"ANSI"`, `"ISO"`).
- `keys` — the keys in this variant.
- `encoders` — the encoders in this variant.

A hidden key reflows the tokens after it — encoders included — so each
variant carries its own encoder positions rather than sharing them globally.

**`Key`**

- `row`, `col` — matrix position.
- `rect` — the key's outline rectangle (center + size), in key-units.
- `r` — rotation of the whole key in degrees. `r` rotates the entire key,
  including `rect2` if present.
- `rect2` — optional second rectangle for L-shaped keys (ISO Enter, big-ass
  Enter). When present, the key is rendered as the union of `rect` and
  `rect2`.
- `pivot` — the rotation region that placed this key. Editor metadata only:
  `rect`/`r` already carry the final geometry. `None` means the flat frame.

**`Rect`**

- `x`, `y` — center coordinates, in key-units.
- `w`, `h` — width and height, in key-units.

**`Region`**

The authoring rotation region (KLE's `(r, rx, ry)` cluster triple) a key or
encoder was placed by, in the same flat frame as `rect` centers:

- `deg` — the region's rotation angle in degrees.
- `px`, `py` — the pivot point.

Equal `Region` values mean one rigid cluster; `Key::r - deg` is the residual
own-center angle.

**`Encoder`**

- `id` — encoder identifier.
- `x`, `y` — center coordinates, in key-units.
- `pivot` — the region that swung the center; the knob itself carries no
  angle.

An encoder is a fixed 1u knob: it is never resized or L-shaped, so its
placement is just a center point.

Source: `Rect`, `Region`, `Key`, `Encoder`, `Variant`, `LayoutInfo` in
`rmk-config/src/layout.rs`, re-exported by `rynk::layout`

## 3. Blob Encoding

The layout blob is raw DEFLATE-compressed bytes containing a postcard-encoded
`LayoutInfo`. `rmk-config` produces the bytes at build time —
`build_layout_blob` (exposed to tooling as `layout_blob_from_toml`) encodes
the `LayoutInfo` with `postcard::to_allocvec` and compresses it with
`miniz_oxide::deflate::compress_to_vec(&bytes, 10)`. The firmware serves the
result without interpretation — it just copies `blob[offset..offset+N]` into
each `LayoutChunk` response.

### from_compressed_blob

```rust
impl LayoutInfo {
    pub fn from_compressed_blob(blob: &[u8]) -> Result<Self, String> {
        if blob.is_empty() {
            return Ok(Self::empty());
        }

        let inflated = miniz_oxide::inflate::decompress_to_vec(blob)
            .map_err(|e| format!("inflate failed: {e}"))?;
        postcard::from_bytes(&inflated)
            .map_err(|e| format!("decode failed: {e}"))
    }
}
```

- An empty blob returns `LayoutInfo::empty()` (no variants).
- Otherwise, the blob is inflated with `miniz_oxide` (DEFLATE decompression)
  and the inflated bytes are postcard-decoded.
- Inflation or decode failure returns a `String` error message.

### No version byte

The blob carries no version byte of its own. Its postcard schema (the
`LayoutInfo` tree) is part of the wire contract, so reshaping it — including
appending a field — is a protocol **major** bump, exactly like reshaping any
response payload.

Source: `LayoutInfo::from_compressed_blob` and `build_layout_blob` in
`rmk-config/src/layout.rs`, module docs in
`rmk-types/src/protocol/rynk/payload/layout.rs`

## 4. GetLayout Paging

`GetLayout` serves the compressed blob one page at a time. The request takes a
`u32` byte offset; the response is a `LayoutChunk`:

```rust
pub struct LayoutChunk {
    pub total_len: u32,
    pub bytes: Vec<u8, RYNK_BLE_CHUNK_SIZE>,
}
```

- `total_len` — the whole compressed blob length (constant across pages), so
  the host knows when it has collected every page.
- `bytes` — one page of the blob, at most `RYNK_BLE_CHUNK_SIZE` (244) bytes,
  sized to fit a single BLE GATT notification.

### Client paging logic

`Client::get_layout()` fetches the first page alone, then reads the rest
concurrently:

```rust
pub async fn get_layout(&self) -> Result<LayoutInfo, RynkHostError> {
    const MAX_LAYOUT_BLOB_LEN: usize = 64 * 1024;
    let first = self.request::<command::GetLayout>(&0u32).await?;
    let total_len = first.total_len as usize;
    if total_len > MAX_LAYOUT_BLOB_LEN {
        return Err(RynkHostError::Layout(alloc::format!(
            "advertised layout blob length {total_len} exceeds maximum {MAX_LAYOUT_BLOB_LEN}"
        )));
    }
    // The first page fixes the page size, which is all [`Self::read_all`] needs to
    // read the rest on lanes — one round trip per `MAX_IN_FLIGHT` pages instead of
    // one each. It re-reads page 0, which rides an existing lane and costs nothing.
    let page = first.bytes.len();
    let mut blob: Vec<u8> = if page == 0 || total_len <= page {
        first.bytes.to_vec()
    } else {
        self.read_all(total_len, page, async |c, offset| {
            Ok(c.request::<command::GetLayout>(&(offset as u32)).await?.bytes.to_vec())
        })
        .await?
    };
    blob.truncate(total_len);
    LayoutInfo::from_compressed_blob(&blob).map_err(RynkHostError::Layout)
}
```

### Paging rules

1. **Offset-based** — each request carries a byte offset; the firmware
   returns `blob[offset..]` up to one page.
2. **First page up front** — offset 0 is requested alone. Its `total_len` is
   validated immediately, and its byte count fixes the page size. If the
   first page is empty or already covers the whole blob, no further requests
   are sent.
3. **Concurrent lanes** — otherwise `Client::read_all` fetches the pages on
   up to `MAX_IN_FLIGHT` (4) lanes, each lane claiming a window of offsets —
   one round trip per `MAX_IN_FLIGHT` pages instead of one each. Page 0 is
   re-read; it rides an existing lane. A short page (a reply squeezed by a
   concurrent pipelined request) makes its lane re-fetch from where the short
   page stopped instead of leaving a gap; the collected pages are stitched in
   offset order with overlaps trimmed.
4. **`truncate(total_len)`** — after assembly, `blob` is truncated to
   `total_len`. A device that over-reports a page length cannot make the host
   inflate more than the advertised blob.
5. **Empty-blob case** — a firmware built without a layout answers the first
   request with an empty page: `blob` stays empty and
   `from_compressed_blob(&[])` returns an empty `LayoutInfo`.
6. **64 KB upper bound** — if the first page's `total_len` exceeds
   `MAX_LAYOUT_BLOB_LEN` (64 KiB), the request fails with
   `RynkHostError::Layout` before any further paging.

Source: `Client::get_layout` and `Client::read_all` in `rynk/src/api.rs`,
`LayoutChunk` in `rmk-types/src/protocol/rynk/payload/layout.rs`

## 5. WASM Type Generation

All layout types derive `tsify::Tsify` with `into_wasm_abi` and
`from_wasm_abi` under the `wasm` feature:

```rust
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct LayoutInfo {
    pub default_variant: u8,
    pub variants: Vec<Variant>,
}
```

This applies to `Rect`, `Region`, `Key`, `Encoder`, `Variant`, and
`LayoutInfo`.

### Why this matters

`wasm-pack build` generates precise `.d.ts` TypeScript declarations from
these derives. Because every field is a concrete type (not `any`), the
generated bindings give the host application — including `rmk-gui` —
compile-time type safety when consuming layout data from WASM. There are no
`any` types in the generated declarations; every field maps to a concrete
TypeScript interface.

Source: `rmk-config/src/layout.rs` (types re-exported by `rynk::layout`)
