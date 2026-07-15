# Physical Layout

Rynk serves the keyboard's physical layout — key positions, sizes, rotation,
encoders, and render variants — as an opaque compressed blob via the
`GetLayout` command. The host reassembles the pages, inflates them, and
decodes the result into a typed `LayoutInfo`. This page documents the blob
encoding, the paging protocol, and the types the host decodes into.

Source: `rynk/src/layout.rs`, `rmk-types/src/protocol/rynk/payload/layout.rs`

## 1. Overview

The firmware serves the physical layout as an opaque, compressed blob that
it never decodes itself. The host is responsible for:

1. Reassembling the blob pages served by `GetLayout`.
2. Inflating the compressed bytes (raw DEFLATE).
3. Postcard-decoding the inflated bytes into `LayoutInfo`.

The blob mirrors the build-time producer in `rmk-config`'s `layout.rs`
field-for-field. Postcard is positional, so the field order must match exactly.
The cross-crate match is maintained by hand because `rmk-config` is a
build-dependency of `rmk-types` (no back-edge), so the two crates cannot share
a single type definition.

### Empty blob

If the firmware was built without a `[layout].map` entry in `keyboard.toml`,
the blob is empty. An empty blob decodes to an empty `LayoutInfo` (no
variants), not an error. This lets a host gracefully handle keyboards that do
not ship a visual layout.

Source: `rynk/src/layout.rs:1-10`, `rmk-types/src/protocol/rynk/payload/layout.rs:1-13`

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
}

pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

pub struct Encoder {
    pub id: u8,
    pub x: f32,
    pub y: f32,
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

**`Rect`**

- `x`, `y` — center coordinates, in key-units.
- `w`, `h` — width and height, in key-units.

**`Encoder`**

- `id` — encoder identifier.
- `x`, `y` — center coordinates, in key-units.

An encoder is a fixed 1u knob: it is never resized, rotated, or L-shaped, so
its placement is just a center point.

Source: `rynk/src/layout.rs:13-67`

## 3. Blob Encoding

The layout blob is raw DEFLATE-compressed bytes containing a postcard-encoded
`LayoutInfo`. The firmware produces the bytes at build time via `rmk-config`
and serves them without interpretation — it just copies
`blob[offset..offset+N]` into each `LayoutChunk` response.

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

The blob carries no version byte of its own. Its postcard schema (the host
`LayoutInfo` and its `rmk-config` mirror) is part of the wire contract, so
reshaping it — including appending a field — is a protocol **major** bump,
exactly like reshaping any response payload.

Source: `rynk/src/layout.rs:69-90`, `rmk-types/src/protocol/rynk/payload/layout.rs:1-13`

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

`Client::get_layout()` pages from offset 0 until the collected bytes reach
`total_len`:

```rust
pub async fn get_layout(&mut self) -> Result<LayoutInfo, RynkHostError> {
    const MAX_LAYOUT_BLOB_LEN: usize = 64 * 1024;
    let mut collected: Vec<u8> = Vec::new();
    let mut total: Option<usize> = None;
    loop {
        let chunk = self.request::<command::GetLayout>(&(collected.len() as u32)).await?;
        let total_len = *total.get_or_insert(chunk.total_len as usize);
        if total_len > MAX_LAYOUT_BLOB_LEN {
            return Err(RynkHostError::Layout(format!(
                "advertised layout blob length {total_len} exceeds maximum {MAX_LAYOUT_BLOB_LEN}"
            )));
        }
        if chunk.bytes.is_empty() {
            break;
        }
        collected.extend_from_slice(&chunk.bytes);
        if collected.len() >= total_len {
            break;
        }
    }
    collected.truncate(total.unwrap_or(0));
    LayoutInfo::from_compressed_blob(&collected).map_err(RynkHostError::Layout)
}
```

### Paging rules

1. **Offset-based** — each request sends `collected.len()` as the byte
   offset. The firmware returns `blob[offset..]` up to one page.
2. **`total_len` is trusted** — the host trusts the first page's `total_len`
   and stops paging once `collected.len() >= total_len`. A device that ignores
   the offset and loops the same page still lands here rather than spinning
   forever.
3. **`truncate(total)`** — after the loop, `collected` is truncated to
   `total_len`. A device that over-reports a page length cannot make the host
   inflate more than the advertised blob.
4. **Empty page stops the loop** — an empty `bytes` page breaks immediately.
   This also covers the empty-blob case (firmware built without a layout):
   the first page is empty, the loop breaks, and
   `from_compressed_blob(&[])` returns an empty `LayoutInfo`.
5. **64 KB upper bound** — if `total_len` exceeds `MAX_LAYOUT_BLOB_LEN`
   (64 KiB), the request fails with `RynkHostError::Layout`.

Source: `rynk/src/api.rs:208-236`, `rmk-types/src/protocol/rynk/payload/layout.rs:21-37`

## 5. WASM Type Generation

All layout types derive `tsify::Tsify` with `into_wasm_abi` and
`from_wasm_abi` under the `wasm` feature:

```rust
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct LayoutInfo {
    pub default_variant: u8,
    pub variants: Vec<Variant>,
}
```

This applies to `Rect`, `Key`, `Encoder`, `Variant`, and `LayoutInfo`.

### Why this matters

`wasm-pack build` generates precise `.d.ts` TypeScript declarations from
these derives. Because every field is a concrete type (not `any`), the
generated bindings give the host application — including `rmk-gui` —
compile-time type safety when consuming layout data from WASM. There are no
`any` types in the generated declarations; every field maps to a concrete
TypeScript interface.

Source: `rynk/src/layout.rs:13-67`
