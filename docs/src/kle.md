# rynk-kle: Layout Conversion

Source: `rynk/rynk-kle/README.md`, `rynk/rynk-kle/Cargo.toml`

## Overview

`rynk-kle` converts a physical keyboard layout between
[KLE](http://www.keyboard-layout-editor.com/) / [Vial](https://get.vial.today/)
JSON and RMK/Rynk's `[layout]` section. It is a library, not a CLI; the
`rmkit layout` CLI in [rmkit](https://github.com/haobogu/rmkit) wraps it. The
`wasm` feature exposes the same pipeline to JavaScript.

The crate builds as both an `rlib` (for native consumers like `rmkit`) and a
`cdylib` (for `wasm-pack`):

```toml
[lib]
crate-type = [
  "rlib",
  "cdylib"
]
```

## Forward: KLE to RMK Layout

```rust
pub fn convert_kle(json: &serde_json::Value) -> Generated
```

`convert_kle` accepts either a raw KLE JSON export or a `vial.json` (the same
KLE blob wrapped in `layouts.keymap`). It returns:

```rust
pub struct Generated {
    pub display_toml: String,
    pub inner_layout_toml: String,
    pub warnings: Vec<String>,
}
```

### What is converted

- Key positions and cap sizes
- Split gaps (spacing between split halves)
- Rotation
- ISO / L-shaped caps
- Encoders
- VIA layout options

The output is rendered as `map` tokens plus `[layout.shapes]` and
`[[layout.variant]]` entries. KLE carries no keycodes, so no `[keymap]` section
is emitted — this is a pure physical-layout conversion.

## Reverse: RMK Layout to Vial

```rust
pub fn keyboard_toml_to_vial(toml: &str) // in to_kle module
```

`to_kle::keyboard_toml_to_vial` converts a `keyboard.toml`'s `[layout]` section
back into a minimal `vial.json`. Only the default layout variant is emitted.
Encoders are rendered as Vial clockwise / counter-clockwise switch pairs.

## Decode: Layout TOML to LayoutInfo

```rust
pub fn decode_layout(toml: &str) -> LayoutInfo
```

`decode_layout` parses any `[layout]` TOML into `layout::LayoutInfo`
(re-exported from `rynk`). It uses the real wire path: `rmk-config` builds the
same compressed blob the firmware serves over the `GetLayout` command, then the
blob is inflated and postcard-decoded with the host types. The result is exactly
what a Rynk host sees when it reads a keyboard's layout.

This means the decode path exercises the same builder the firmware uses, not a
hand-rolled parser — so it catches drift between the host's view of a layout
and the firmware's.

## Round-Trip Verification

Every generated `[layout]` round-trips through
`rmk_config::layout_blob_from_toml` — the same builder the firmware uses to
produce the compressed layout blob. The fixture suite verifies that a rendered
layout is preserved through the `vial.json` to `[layout]` to `vial.json` path:

```text
vial.json  --convert_kle-->  [layout]  --keyboard_toml_to_vial-->  vial.json
```

This guards against silent conversion regressions: if the forward and reverse
paths disagree on any physical property, the fixture fails.

## WASM Bindings

```sh
cd rynk/rynk-kle
wasm-pack build --target web --features wasm
```

The `wasm` feature enables `wasm-bindgen` and `serde-wasm-bindgen`. The crate
exports string-in / plain-object-out bindings:

| Binding                       | Input         | Output                          |
|-------------------------------|---------------|---------------------------------|
| `convert_kle(json)`           | KLE JSON string | `Generated` object (display_toml, inner_layout_toml, warnings) |
| `keyboard_toml_to_vial(toml)` | `keyboard.toml` string | `vial.json` object |
| `decode_layout(toml)`         | `[layout]` TOML string | `LayoutInfo` object for drawing a preview |

All bindings take a string and return a plain JS object, matching the
convention of `rynk-wasm`: keep the JS side simple, keep the typed logic in
Rust.
