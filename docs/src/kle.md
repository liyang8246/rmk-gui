# rynk-kle: Layout Conversion

Source: `rynk/rynk-kle/README.md`, `rynk/rynk-kle/Cargo.toml`

## Overview

`rynk-kle` converts a physical keyboard layout between
[KLE](http://www.keyboard-layout-editor.com/) / [Vial](https://get.vial.today/)
JSON and RMK/Rynk's `[layout]` section. It is a library, not a CLI; the
`rmkit layout` CLI in [rmkit](https://github.com/rmk-rs/rmkit) wraps it. The
`wasm` feature exposes the same pipeline to JavaScript.

The crate builds as both an `rlib` (for native consumers like `rmkit`) and a
`cdylib` (for `wasm-pack`):

```toml
[lib]
crate-type = ["rlib", "cdylib"]
```

## Forward: KLE to RMK Layout

```rust
pub fn convert_kle(root: &serde_json::Value) -> Result<Generated, String>
```

`convert_kle` accepts either a raw KLE JSON export or a `vial.json` (the same
KLE blob wrapped in `layouts.keymap`). It returns:

```rust
pub struct Generated {
    /// A complete TOML snippet containing `[layout]`, shapes, and variants.
    pub layout_toml: String,
    pub warnings: Vec<String>,
}
```

When the input carries no VIA `row,col` legends (a plain KLE export), matrix
positions are assigned row-major from key placement and a warning is added to
`Generated::warnings`.

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
pub fn keyboard_toml_to_vial(text: &str) -> Result<serde_json::Value, String>
```

`keyboard_toml_to_vial` converts a `keyboard.toml`'s `[layout]` section
back into a minimal `vial.json`. Only the default layout variant is emitted.
Encoders are rendered as Vial clockwise / counter-clockwise switch pairs.

## Decode: Layout TOML to LayoutInfo

```rust
pub fn decode_layout(text: &str) -> Result<layout::LayoutInfo, String>
```

`decode_layout` parses `[layout]` TOML — a full `keyboard.toml` or a bare
`rows`/`cols`/`map` snippet — into `layout::LayoutInfo` (re-exported from
`rynk`). It goes through `rmk_config::layout_info_from_toml`, the same builder
that produces the compressed blob the firmware serves over the `GetLayout`
command. The result is exactly what a Rynk host decodes from that blob when it
reads a keyboard's layout.

This means the decode path exercises the same builder the firmware uses, not a
hand-rolled parser — so it catches drift between the host's view of a layout
and the firmware's.

## Round-Trip Verification

The unit tests in `src/to_layout.rs` feed every generated `[layout]` back
through `decode_layout`, so RMK's own builder must accept it. The fixture suite
(`tests/fixtures/*.json`) verifies that a rendered layout is preserved through
the `vial.json` to `[layout]` to `vial.json` path:

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
exports string-in bindings:

| Binding                       | Input         | Output                          |
|-------------------------------|---------------|---------------------------------|
| `convert_kle(json)`           | KLE JSON string | `Generated` object (layout_toml, warnings) |
| `keyboard_toml_to_vial(toml)` | `keyboard.toml` string | `vial.json` as a pretty-printed JSON string |
| `decode_layout(toml)`         | `[layout]` TOML string | `LayoutInfo` object for drawing a preview |

All bindings take a string; `convert_kle` and `decode_layout` return plain JS
objects, matching the convention of `rynk-wasm`: keep the JS side simple, keep
the typed logic in Rust.
