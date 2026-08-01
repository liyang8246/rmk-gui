<div align="center">
<img src="./src-tauri/icons/icon.png" alt="Clash" width="128" />
<h3>
Gui configuration for <a href="https://github.com/rmk-rs/rmk">RMK</a> based on <a href="https://github.com/tauri-apps/tauri">Tauri</a> and <a href="https://github.com/nuxt/nuxt">Nuxt</a>
<h3>
</div>

## Warn

本项目当前正处于史诗级屎山构建阶段, 建议您保持安全距离观赏.

This project is currently in the process of building an epic-level shit mountain. It is recommended to observe from a
safe distance.

## Install

Go to the release page to download the corresponding installation package Supports Windows (x64/x86), Linux (x64/arm64)
and macOS 10.15+ (intel/apple).

## Features

- Based on Rust and Tauri2 frameworks.
- Concise and modern user interface.
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
   `src/rynk/wasm/` is a build artifact and is not checked in, so this step is
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

### Testing

```bash
pnpm test        # unit tests — no device and no wasm build needed
pnpm test:qemu   # end-to-end against the riscv fixture firmware
pnpm check       # svelte-check
CI=true pnpm lint
```

`pnpm test:qemu` builds and runs `qemu/` itself, so there is nothing to start by
hand. It needs `qemu-system-riscv32` (`brew install qemu`, or
`apt install qemu-system-misc` on Debian/Ubuntu), the
`riscv32imac-unknown-none-elf` target, and step 3 to have run. Don't leave
`pnpm qemu` running alongside it — the fixture's serial port serves one client
at a time.

`CI=true` matters for linting: the eslint config detects editors and relaxes
some rules, so a bare `pnpm lint` is more permissive than CI.

## Roadmap

Too many to write

## Acknowledgement

RMK-GUI was based on or inspired by these projects and so on:

- [Tauri](https://github.com/tauri-apps/tauri) A framework for building tiny, fast binaries for all major desktop and
  mobile platforms.
- [Nuxt](https://github.com/nuxt/nuxt) An open source framework that makes web development intuitive and powerful.
- [PrimeVue](https://github.com/primefaces/primevue) A free open-source Vue 3 UI component library with rich features.
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
