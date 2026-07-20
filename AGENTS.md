# AGENTS.md

## Comment Policy

No verbose/long comments, no ornate dividers (`──`, box-drawing, ASCII art), no restating what code already shows. One-line comments only, and only for a non-obvious *why* (invariant, platform quirk, wire layout, cross-file sync, real TODO). When in doubt, delete it.

## Cloned Dependency Source

Read-only dependency source repositories are available under
`.slim/clonedeps/repos/` for inspection. Do not edit these clones.

- `.slim/clonedeps/repos/HaoboGu__rmk/` - `HaoboGu/rmk` at `feat/rynk` (`e3480dec`); rynk protocol source (full-duplex header+payload protocol, RynkHidService, WASM/TS type generation, command handlers) to help rmk-gui adapt the new communication protocol.
- `.slim/clonedeps/repos/deviceplug__btleplug/` - `deviceplug/btleplug` at `0.12.0` (`ee381ac`); BLE API source for Peripheral/Central traits, notification stream, and write chunking behavior.
