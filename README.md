<div align="center">
<img src="./src-tauri/icons/icon.png" alt="RMK GUI" width="128" />
<h3>
Gui configuration for <a href="https://github.com/rmk-rs/rmk">RMK</a> based on <a href="https://github.com/tauri-apps/tauri">Tauri</a> and <a href="https://nuxt.com">Nuxt</a>
</h3>
</div>

## Warn

本项目当前正处于史诗级屎山构建阶段, 建议您保持安全距离观赏.

This project is currently in the process of building an epic-level shit mountain. It is recommended to observe from a
safe distance.

## Install

Go to the release page to download the corresponding installation package. Supports Windows (x64/x86), Linux (x64/arm64)
and macOS 10.15+ (intel/apple).

## Features

- Based on Rust and Tauri2 frameworks.
- Nuxt 4 + Pinia frontend. The UI is intentionally empty for now; what lives
  here is the rynk transport and the keyboard store.
- Talks the rynk protocol over USB serial, BLE, and Web Serial.
- Support for Windows, macOS, and Linux.

## Development

Make sure you have Rust, NodeJS and Python installed on your system.

1. Clone the repository:
   ```bash
   git clone https://github.com/liyang8246/rmk-gui.git
   cd rmk-gui
   ```
2. Install dependencies:
   ```bash
   pnpm install
   rustup target add wasm32-unknown-unknown
   cargo install wasm-pack
   ```
3. Build the protocol client:
   ```bash
   pnpm build:wasm
   ```
   `app/rynk/wasm/` is a build artifact and is not checked in, so this step is
   required before anything else runs. It compiles `rynk-wasm` from a sibling
   `../rmk` checkout when one exists, otherwise it clones `rmk-rs/rmk`; set
   `RMK_REPO` to point somewhere else.
4. Start the development server:
   ```bash
   pnpm dev:web     # browser only
   pnpm dev:tauri   # desktop app — runs dev:web itself, don't start both
   ```
5. Build the application:
   ```bash
   pnpm build:web
   pnpm build:tauri  # runs build:web itself
   ```

No keyboard at hand? `pnpm qemu` runs a riscv fixture firmware in QEMU and
serves its rynk protocol over TCP port 7965, so the app has a virtual keyboard
to connect to. It needs `qemu-system-riscv32` and the
`riscv32imac-unknown-none-elf` rust target.

### Checking

```bash
pnpm typecheck   # vue-tsc
CI=true pnpm lint
```

`CI=true` matters for linting: the eslint config detects editors and relaxes
some rules, so a bare `pnpm lint` is more permissive than CI.

## Roadmap

Too many to write

## Acknowledgement

RMK-GUI was based on or inspired by these projects and so on:

- [Tauri](https://github.com/tauri-apps/tauri) A framework for building tiny, fast binaries for all major desktop and
  mobile platforms.
- [Nuxt](https://nuxt.com) The Vue framework for building full-stack web applications.
- [Vue](https://vuejs.org) The progressive JavaScript framework.
- [Pinia](https://pinia.vuejs.org) The Vue store library.
- [Vial-gui](https://github.com/vial-kb/vial-gui) An open-source cross-platform (Windows, Linux and Mac) GUI and a QMK
  fork for configuring your keyboard in real time.
- [RMK](https://github.com/rmk-rs/rmk) Rust keyboard firmware library with layers, macros, real-time keymap editing,
  wireless(BLE) and split support.

## License

RMK-GUI is licensed under either of

- Apache License, Version 2.0 (LICENSE-APACHE or
  [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0))
- MIT license (LICENSE-MIT or [http://opensource.org/licenses/MIT](http://opensource.org/licenses/MIT))

at your option.
