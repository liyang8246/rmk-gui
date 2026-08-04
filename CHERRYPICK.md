# Cherry-pick log: feat/pick-rynk-logic

从 `liyang8246/rmk-gui` PR #86（合并 commit `1aa5dc6`）中提取纯逻辑/连接代码，
丢弃全部 UI 组件、CSS、图标脚本，在新分支 `feat/pick-rynk-logic` 上重建。

基点: `4c5e95f` (main, 2026-08-04 之前的最后一个 commit)
终点: `2cc7c32` (feat/pick-rynk-logic HEAD)

## 前置条件

wasm 类型必须匹配 rmk main 最新版本，否则 svelte-check 会报类型缺失:

```bash
python3 scripts/build-rynk-wasm.py   # 默认从 ../rmk 或临时 clone 构建
```

## 14 个 commit 搬运明细

按原始时间顺序排列。标记说明:
- **直接** = 原样 cherry-pick，无修改
- **混合** = cherry-pick -n 后丢弃 UI 文件，仅保留逻辑

| # | 新 commit | 原 commit | 方式 | 保留内容 | 丢弃内容 |
|---|-----------|-----------|------|----------|----------|
| 1 | `4d4d0f3` | `1afb3e0` | 直接 | COBS 编码修复（>254 字节） | — |
| 2 | `6088e92` | `185d02d` | 混合 | link death 检测 + lock/BLE/系统命令（store 核心） | `StateBar.svelte` |
| 3 | `2cf5d68` | `89aff60` | 混合 | `canDiscover()` / `connectWebSerial` 导出 | `App.svelte` |
| 4 | `e0301ce` | `5d332f7` | 直接 | 94 个单元测试 + qemu 冒烟测试 + vitest 配置 | — |
| 5 | `7ac165a` | `fdac29b` | 直接 | TESTING.md 测试计划 | — |
| 6 | `06954e6` | `4d1c867` | 直接 | README 开发文档 | — |
| 7 | `b6a6f42` | `2784902` | 直接 | README 技术栈修正 | — |
| 8 | `2982898` | `2ddd8bc` | 混合 | probeVersion 超时 + endSession teardown + `describeKeyboardError` + CI 最小权限 + qemu 端口分配 | `App.svelte`, `StateBar.svelte` |
| 9 | `196ce15` | `742e3f7` | 直接 | session 标签用键盘上报名 | — |
| 10 | `315254a` | `5c912a0` | 直接 | qemu 测试等 UART 就绪 | — |
| 11 | `e91448c` | `38bbd25` | 直接 | 传输层重构：删 DeviceDescriptor，加 stable id | — |
| 12 | `052f23f` | `7c094cc` | 直接 | 配置器核心层：keycatalog/layout/keycode/matrix/deviceStore | — |
| 13 | `c6139d2` | `1d89795` | 混合 | Rust 传输层重写（rynk-serial/rynk-ble crate）+ WebHid + device-names/hid-table/macro-codec 等 lib + `setMacroRegion` | 全部 .svelte 组件、CSS、SVG、图标脚本、UI pages |
| 14 | `2cc7c32` | `780b5ca` | 混合 | `STAY_DISCONNECTED_KEY` localStorage 逻辑 | bits-ui 迁移全部 UI |

## 丢弃的文件清单

以下文件在原 commit 中存在但被主动丢弃:

- `src/components/*.svelte` — 全部新增 UI 组件（Board, KeyboardBasic, Keycap, KeycodeSelect, LayerTabs, LogoCard, MiniKey, Toast, TopBar, Workspace, ui/*）
- `src/pages/*.svelte` — 新增/修改的页面（Behavior, Connect, Device, Keymap）
- `src/assets/css/main.css` — 样式重写
- `src/assets/img/logo.svg`
- `scripts/build-icons.ts`, `scripts/icon-scan.ts` — 图标构建脚本
- `src/lib/icons.json`, `src/lib/icons.ts`, `src/lib/icons.test.ts` — 图标注册
- `src/main.ts` 中的 `registerIcons()` 调用（恢复原样）

## 验证

```bash
npx svelte-check --tsconfig ./tsconfig.json   # 0 errors, 0 warnings
npx eslint .                                    # 0 errors
npx vitest run                                  # 94 passed
```
