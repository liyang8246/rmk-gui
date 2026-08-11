# rmk-gui 测试方案

| | |
|---|---|
| **状态** | 待评审 |
| **范围** | rmk-gui 前端（TypeScript / Svelte）的端到端自动化测试 |

---

## 1. 背景

rmk-gui 是 RMK 键盘的图形配置工具，Tauri v2 + Svelte 5。与固件之间说 rynk 协议；协议客户端不在本仓库，而是上游 `rmk-rs/rmk` 的 `rynk-wasm` 编译产物，由 `scripts/build-rynk-wasm.py` 构建后落到 `src/rynk/wasm/`。

代码现状：手写约 1060 行 TypeScript/Svelte + 375 行 Rust。核心是 `src/stores/keyboard/keyboard.svelte.ts`（456 行），负责设备数据的读取重排、写入分页、乐观更新回滚与推送分发；`src/rynk/` 是传输与协议引导层；`src/components/` 中只有键盘布局渲染有实质逻辑；`src-tauri/` 提供 serial / BLE / TCP 三种字节通道。

仓库当前没有任何自动化测试：无 test runner、无测试文件、无 `test` script，Rust 侧无 `#[cfg(test)]`，CI 仅执行 lint 与 build。

## 2. 目标

**G1 — 抓住上游协议演进对 rmk-gui 的影响。** `rynk-wasm` 随上游 `rmk-rs/rmk` 持续变化，rmk-gui 对它存在一批隐含假设：扁平键位数组的排列顺序、宏分块的读取语义、推送事件变体的集合、capabilities 各字段的用法、错误码的取值范围。上游改动使这些假设不再成立时，测试必须红。这类破坏当前完全没有防护，且不会在类型检查中暴露。

**G2 — 覆盖 rmk-gui 自身的逻辑。** 设备发现与选择、数据重排、写入分页、乐观更新回滚、并发串行化、推送分发、连接拆除顺序、布局渲染几何。

## 3. 测试对象

被测代码集中在传输引导层（`src/rynk/`）、store（`src/stores/keyboard/`）与键盘布局渲染（`src/components/Keyboard.svelte`），分五类：

- **发现与连接** —— 枚举可用设备、选择其一、建立会话并完成协议握手。
- **读取路径** —— 把设备返回的扁平数组、分块数据、按 capabilities 边界的重复查询，整理成 store 的结构化模型。
- **写入路径** —— 参数校验、整表分页写入，以及乐观更新与失败回滚。
- **并发与生命周期** —— 写入的串行化、推送事件的分发、连接拆除的顺序。
- **渲染** —— 布局数据到界面几何的换算（含旋转与包围盒）。

选择这五类的依据是失效模式：**它们出错时程序不会崩溃，而是让数据被静默写错**——例如键位展开顺序与回写的拍平顺序不一致时，用户的整张键位表会被打乱，而界面、日志、类型检查均无异常。这类缺陷靠人工使用很难发现，是自动化测试收益最高的部分。

`qemu/` 下的模拟固件是端到端链路的设备端。它的几何、键位、编码器映射、预置数据与推送节奏都是确定且已知的，因此可以作为断言的基准——详见 §5.5。

## 4. 方案设计

### 4.1 总体架构

端到端链路，测试宿主为单个 Node 进程，QEMU 是它拉起的另外两个进程（开放固件 + 锁定固件）：

```
qemu-system-riscv32 ×2  ──TCP──▶  tests/ipc.ts
   开放 / 锁定 (--features locked)      │  Tauri invoke 桩 + TCP 会话管理
                                        ▼
                            src/rynk/index.ts   discover()          (真)
                            src/rynk/tauri.ts   TauriByteLink       (真)
                                        ▼
                            keyboardStore.initStore(connected)
                                        │
                                        ├── connectClient()   COBS 探测 + 真实 wasm 客户端
                                        └── store 全链路       重排 / 分页 / 回滚 / topic 分发
                                        ▼
                            mount(Keyboard, { target })       jsdom 真实 DOM
```

### 4.2 关键设计决策

**D1 — 运行环境选择 Vitest + jsdom，而非真实浏览器**

| 方案 | 评估 |
|---|---|
| Playwright / Vitest browser mode | 需安装浏览器、起 dev server、跨进程通信；断言 UI 几何时要读渲染盒 |
| **Vitest + jsdom（采纳）** | 单进程；`keyStyle()` 把 `width`/`height`/`left`/`top`/`transform` 直接写入内联 style，jsdom 不做布局也能精确读取，**断言精度反而高于量像素** |
| 纯 Node 无 DOM | 无法覆盖点击选中等交互 |

**D2 — 以最小 IPC 桩覆盖设备发现与选择，但不测 `src-tauri` 的 Rust 实现**

设备发现与选择（`src/rynk/index.ts` 的 `discover()`、`src/rynk/tauri.ts` 的连接封装）是 rmk-gui 自己的代码，属于测试对象。它们经 `@tauri-apps/api/core` 的 `invoke` 与 Rust 通信，而 `invoke` 的实现是一行 `window.__TAURI_INTERNALS__.invoke(cmd, args, options)`，`isTauri()` 是 `!!(globalThis || window).isTauri`——这个接缝天然存在，注入两行即可接管，**无需改动任何源码**。

因此 `tests/ipc.ts` 只做两件事：向 `discover()` 报告一个 TCP 设备，以及为选中的设备建立到 QEMU 的 TCP 会话。它**不是** `src-tauri` 的等价实现，也不承担验证 Rust transport 的职责——那 375 行 Rust 本方案不覆盖。桩的语义（尤其是 `rynk_recv` 以空数组表示 EOF）需与 Rust 侧一致，否则测的是桩的行为。

## 5. 详细设计

### 5.1 目录结构

```
vitest.config.ts
tests/
  qemu.ts               globalSetup：构建 + 启动两个 QEMU 实例，provide 地址，拆除
  ipc.ts                Tauri invoke 桩 + TCP 会话管理
  fixture.ts            固件夹具的已知行为常量（断言基准，见 §5.5）
  connect.test.ts       设备发现、选择、连接、能力读取
  store.test.ts         数据读取、写入、校验、回滚、串行化、错误映射
  lifecycle.test.ts     topic 推送与分发、连接拆除
  locked.test.ts        锁定固件的连接与锁门行为
  keyboard-ui.test.ts   Keyboard.svelte 渲染几何与交互
  smoke.test.ts         构建产物冒烟
```

新增依赖仅 `vitest` 与 `jsdom`；`@sveltejs/vite-plugin-svelte@^7` 已在。

### 5.2 运行时配置

独立于 `vite.config.ts`（后者携带 tailwind 插件、`strictPort:1420`、依赖 `TAURI_ENV_PLATFORM` 的 build target，均不适用）。

```ts
export default defineConfig({
  plugins: [svelte({ dynamicCompileOptions: () => ({ generate: 'client' }) })],
  resolve: {
    alias: { '~': src, '@': src },
    conditions: [...defaultClientConditions],
  },
  ssr: { resolve: { conditions: [...defaultClientConditions] } },
  test: {
    environment: 'jsdom',
    globalSetup: ['tests/qemu.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
})
```

三处配置各有原因，均不可省：

- `dynamicCompileOptions: generate: 'client'` — vite-plugin-svelte 依据 consumer 推导 generate 模式，Vitest 下会推导为 `'server'`，导致 `.svelte.ts` 中的 `$state` 编译为 no-op。
- `resolve.conditions` 含 `browser` — `svelte@5.56.8` 的根导出为条件分支（`browser` → `index-client.js`，`default` → `index-server.js`），缺失时取到 SSR 版的 `mount`/`flushSync`。
- `fileParallelism: false` — QEMU 的 `-serial tcp::PORT,server,nowait` 同时只接受一个客户端。

前两条属于**静默失效**：配置缺失不会报错，表现为 `$state` 不响应、测试行为难以解释。落地时应在写任何用例之前先确认二者生效。

`tsconfig.json` 的 `include` 追加 `"tests/**/*.ts"`，使 `pnpm check` 覆盖测试代码。

**测试隔离**：Vitest 为每个测试文件使用独立模块注册表，`keyboardStore` 单例与模块级 `session` 对象天然跨文件隔离；文件内以 `afterEach(() => keyboardStore.resetStore())` 复位。

### 5.3 设备夹具编排（`tests/qemu.ts`）

1. 若 `RMK_E2E_ADDR` 已设置则直接复用，跳过构建与启动。
2. 前置检查：`qemu-system-riscv32` 缺失、或 `src/rynk/wasm/rynk_wasm_bg.wasm` 缺失（该目录 gitignore，需先 `pnpm build:wasm`）时，给出可直接执行的修复提示而非底层错误。
3. 构建两份固件，**使用各自独立的 target 目录**——共用 `qemu/target` 会让两个 feature set 相互触发全量重建：
   ```
   cargo build --release --target-dir target/e2e-open
   cargo build --release --features locked --target-dir target/e2e-locked
   ```
4. 向 OS 申请两个空闲端口（`net.createServer().listen(0)`）。**不使用 7965**——该端口被 `pnpm qemu` 与 `rynk_discover_tcp`（debug 构建）占用，并行开发时会冲突。
5. 就绪探测：QEMU 先 bind 后才启动固件，故"端口可连"不足以判定就绪；需每 100 ms 探测，连通后再等待收到首个字节（固件的 `test_topics` 每 200 ms 推送一次，正常在约 250 ms 内出字节）。
6. 通过 `provide('qemuAddr', ...)` 与 `provide('qemuLockedAddr', ...)` 下发地址。两个实例并发常驻，锁定用例因而只是同一次运行中的普通文件，不需要第二轮串行执行。
7. 拆除：SIGTERM → 2 s 后 SIGKILL，并注册 `process.on('exit')` 兜底，避免 Vitest 异常退出时遗留进程占用端口。失败时输出 QEMU 的 semihosting 尾部日志。

### 5.4 IPC 桩与字节通道（`tests/ipc.ts`）

注入两行接管 IPC 边界：

```ts
globalThis.isTauri = true
window.__TAURI_INTERNALS__ = { invoke: (cmd, args) => dispatch(cmd, args) }
```

实现的命令及其语义（须与 `src-tauri/src/transport/mod.rs` 一致）：

| 命令 | 行为 |
|---|---|
| `rynk_discover_tcp` | 返回 `[{ addr, name: 'QEMU' }]`，addr 由 globalSetup 下发 |
| `rynk_discover_serial` / `rynk_discover_ble` | 返回 `[]`；另提供可注入抛错的开关，用于验证 `discover()` 的单传输容错 |
| `rynk_connect_tcp` | 建立 socket（`setNoDelay(true)`，回环上 Nagle 会为每次往返增加 40 ms），返回 `{ session, descriptor }` |
| `rynk_send` | 在 socket write callback 中 resolve（wasm 的 `WasmWriter` 依赖此语义） |
| `rynk_recv` | 长轮询：有数据即返回，无数据则挂起；**EOF / error 返回空数组**（断连哨兵） |
| `rynk_close` / `rynk_close_all` | 销毁 socket 并唤醒挂起的 `recv` |
| 未知 session id | `send`/`close` 静默返回 ok，`recv` 返回空数组（与 Rust 侧当前的宽容行为一致） |

wasm 预初始化：`mod.default({ module_or_path: await readFile(...) })`。此后 `connectClient` 内那句无参 `core.default()` 因 `__wbg_init` 的早返回而成为 no-op，**生产代码无需任何改动**。

### 5.5 断言基准（`tests/fixture.ts`）

端到端测试的价值来自**有确定的期望值可比**。`qemu/` 固件的行为完全确定，因此断言直接使用这些已知值，而不是从被测代码自身推导——后者是自指的：若 rmk-gui 对线路格式的假设本身就错了，推导出的期望值会跟着一起错，测试反而通过。

夹具的已知行为，来源为 `qemu/keyboard.toml` 与 `qemu/src/main.rs`：

| 类别 | 已知值 |
|---|---|
| 矩阵几何 | 4 行 × 12 列，2 层，2 个编码器 |
| 能力开关 | storage / ble / split / lighting 均关闭（crate 以 `default-features = false, features = ["rynk"]` 构建） |
| 键位 layer 0 | QWERTY。`(0,0)=Q`、`(0,11)=P`、`(0,5)`与`(0,6)=No`、`(2,5)=LCtrl`、`(3,0)=Escape`、`(3,8)=LayerOn(1)`、`(3,11)=Enter` |
| 键位 layer 1 | 48 个位置全部 `Transparent` |
| 编码器 | `(0,0)`=音量增/减、`(1,0)`=PageUp/Down、`(0,1)`=Kp+/Kp−、`(1,1)`=Home/End |
| 预置数据 | 1 个 Fork（trigger=A，negative=B，positive=C，bindable）；1 个 Morse；combos 全空 |
| 布局 | 42 个键（48 个矩阵位减去未映射的 6 个）；左区 `r=+10°`、右区 `r=-10°`；`(2,5)` 与 `(2,6)` 高 1.5u，其余 1u |
| 推送 | 每 200 ms 一轮：LayerChange 在 0/1 间交替、WpmUpdate 每次 +7、LedIndicator、SleepState、ConnectionStatus。**不含** BatteryStatusChange（固件未启用 ble） |
| 锁定固件 | `--features locked`：解锁键位 `(0,0)` 与 `(0,11)`，`insecure = false`，`write_requires_unlock = false` |

常量集中在 `tests/fixture.ts` 单一文件。夹具变更时只改这一处——这是接受"断言绑定夹具"这一代价的前提。

### 5.6 测试用例

标注 **G1** 者为捕获上游协议演进的主力（§2）；其余服务于 G2。

#### `connect.test.ts` — 发现、选择与连接

1. **G1 · 设备发现** — `discover()` 返回一个 `kind: 'tcp'`、`label: 'QEMU'` 的条目；调用发生在 `closeAllSessions()` 之后；串口或 BLE 枚举抛错时其余传输仍正常返回（验证 per-transport 的 `.catch(() => [])` 隔离）；label 回退规则（`name ?? path` / `name ?? id`）正确。
2. **键盘选择** — 从 `discover()` 的结果中选定一项并调用其 `connect()`，得到的 `ConnectedDevice` 携带正确的 label 与 descriptor；将其交给 `initStore()` 完成连接。这是应用里"选哪块键盘"的实际路径。
3. **G1 · 连接与能力** — `connection.phase` 由 `connecting` 变为 `connected`；`capabilities` 与 §5.5 的几何和能力开关逐项相符；`device.info` 的厂商与产品名符合固件声明。
4. **连接失败** — 选择一个不可达地址时 `initStore()` 返回 `err`，且 `connection`/`device`/`config`/`status` 四个字段全部保持 `null`（`doInit` 的全有或全无语义）。
5. **重连** — `resetStore()` 后重新发现并连接成功。固件 `main()` 在 EOF 后重入 `run_session`，wasm 侧会先发 `0x00` 冲刷；此项落地时优先验证，若不稳定则退化为同一连接内的回读比对。

#### `store.test.ts` — 数据读取与写入

6. **G1 · 键位读取** — `config.keymap` 形状为 `[2][4][12]`；layer 0 的七个抽查位与 §5.5 相符；layer 1 全部 `Transparent`。**这是验证扁平数组展开顺序的关键用例**：上游若改变层/行/列主序，抽查位会取到错误的键。
7. **G1 · 编码器读取** — `config.encoders` 形状 `[2][2]`，四组值与 §5.5 相符。验证 `fetchEncoders` 的双层循环下标顺序。
8. **G1 · 宏分块** — `config.macros.length === 256` 且初始全零。验证 `fetchMacros` 的分块遍历能走完、能终止、末尾截断正确。
9. **G1 · 集合读取** — combos / morses / forks 长度均为 8；fork slot 0 与 §5.5 的预置值相符，其余为默认值。
10. **键位写入往返** — `setKey` 改一个键 → 重新读取一致 → 恢复；`setKeymap` 整表写入 → 重新 `initStore` → 逐项与写入值相等。验证 `keymap.flat().flat()` 与 `fetchKeymap` 严格互逆。**本方案价值最高的单条断言。**
11. **前置校验** — 越界（`setKey` 的 layer/row/col、`setCombo(-1)`、`setMacro` offset 越界）与形状不符（`setKeymap` 层/行/列数）返回 `{type:'invalid'}`，cause 字符串精确匹配，**且不向设备发出任何请求**。
12. **乐观更新与回滚** — 成功时本地与设备一致；失败时本地复原并返回 `err`。含 `setMacro` 的部分回滚（offset 5 写 3 字节，失败后 5..7 复原、4 与 8 不受影响）。
13. **乐观更新时序** — `push()` 执行在 `enqueue` 的回调中（微任务），非同步：调用后立即读到旧值，一个 tick 后读到新值。
14. **串行化** — 连续发起 5 个 `setKey` 不 await，全部成功且顺序正确；其中一个失败不破坏后续链。
15. **G1 · 错误映射** — 触发一次真实的设备拒绝（如越界的 `set_encoder`），断言 `toKeyboardError` 得到 `{type:'rynk', code:'Invalid'}`；另对 `link closed`、`name:'Disconnected'` 各一条。**已知缺口**：`RYNK_ERROR_CODES` 用 `satisfies` 约束，只校验可赋值性不校验穷尽性，故上游新增错误码不会被抓住（当前 `Busy` 即已遗漏，落入 `{type:'unknown'}`）。用例断言现状并标注 TODO。

#### `lifecycle.test.ts` — 推送与拆除

16. **G1 · 推送内容** — 采集约 1.5 s：五种事件均出现；LayerChange 在 0/1 间交替；相邻 WpmUpdate 差值为 7；BatteryStatusChange 不出现。断言只针对同类事件的序列，不断言跨类的全局顺序。上游新增事件变体时 `startTopicLoop` 的 `.exhaustive()` 会抛，本用例捕获。
17. **推送分发** — 各事件写入的是对应的 status 字段（`LayerChange`→`currentLayer`、`WpmUpdate`→`wpm` 等）。
18. **`topicsReady` 门控** — init 期间 `#status` 仍为 null，此时到达的 topic 不得解引用它，全程无异常。
19. **拆除顺序** — 在 `next_topic()` 挂起时调用 `resetStore()`，不抛异常，四个 `$state` 字段全部清空。顺序错误时 wasm-bindgen 会抛 use-after-free。
20. **幂等性** — `resetStore()` 重复调用、未连接时调用均不抛异常。

#### `locked.test.ts` — 锁定固件

21. **锁定状态报告** — `get_lock_status()` 返回 `locked: true`、`remaining_keys: 2`、解锁键位为 `(0,0)` 与 `(0,11)`。
22. **锁门拒绝** — 受锁保护的调用（如 `get_matrix_state()`）被拒绝，`toKeyboardError` 得到 `{type:'rynk', code:'Locked'}`。
23. **解锁流程武装** — `unlock_poll()` 使状态进入 `unlocking: true`。测试无法驱动物理矩阵，因此 `remaining_keys` 永远到不了 0；断言的是解锁流程被正确武装，这正是解锁 UI 的轮询所依赖的。
24. **写门与锁门分离** — 因固件 `write_requires_unlock = false`，锁定状态下 `set_key` 仍应成功。此项确保 UI 的只读门控依据 `write_requires_unlock` 而非 `locked`。
25. **已知问题：锁定键盘无法连接** — `fetchStatus` 无条件调用受锁保护的 `get_matrix_state()`，而 `doInit` 在其失败时走全有或全无的回滚路径，因此**锁定状态的键盘当前完全连不上**；`App.svelte:13` 又未检查 `initStore` 的返回值，界面会静默渲染 0 个键。本用例断言这一现状并标注 TODO，待锁定 UI 落地时一并修复。

#### `keyboard-ui.test.ts` — 渲染与交互

26. **G1 · 渲染数量与标识** — 渲染出 42 个 key div；所有 `row,col` 互不重复（`{#each}` 的 keyed identity）。上游改变 `LayoutInfo` 的 variants/keys 结构时红。
27. **逐键几何** — 左区键 `transform: rotate(10deg)`、右区键 `rotate(-10deg)`；`(2,5)` 与 `(2,6)` 的 `height` 为 96px，其余为 64px；`width` 与各自 `rect.w × 64` 相符。
28. **AABB 归一化** — 所有 key 的 `left`/`top` 解析后均 `>= 0`（`bounds.minX`/`minY` 可为负，减错方向会产生负偏移）。
29. **选中交互** — 点击某键使其获得 `bg-primary`、其余为 `bg-base-300`；点击另一键时选中转移；点击容器空白处全部取消（验证 key 的 `stopPropagation` 与容器 handler 的配合）。事件以 `new Event('pointerdown', { bubbles: true })` 派发即可——handler 仅使用 `stopPropagation`，不依赖 jsdom 的 PointerEvent 支持。断言前 `flushSync()`。
30. **未连接态** — 渲染 0 个键，容器 `width:0px;height:0px`。

#### `smoke.test.ts` — 构建产物

31. **构建产物可加载** — 将 `pnpm build:web` 产出的 `dist/index.html` 与其入口 bundle 载入 jsdom，确认应用能挂载、无未捕获异常。用于兜住"开发态正常、打包后因 import 分析或 wasm 资源路径而挂掉"这一类问题。`dist/` 不存在时跳过；CI 中排在 `pnpm build:web` 之后。

## 6. 工程集成

### 6.1 npm scripts

```text
"test":       "vitest run",
"test:watch": "vitest"
```

### 6.2 CI

新增一个 Linux-only job，与现有 6-OS 构建矩阵并行（不进入关键路径，墙钟时间不变）：安装 `qemu-system-misc`、`riscv32imac-unknown-none-elf` target、`wasm-pack`，执行 `pnpm build:wasm` 与 `pnpm build:web` 后 `pnpm test`。

**须一并处理的依赖一致性问题**：`.cargo/config.toml` 为 gitignore 的本地文件，因此 CI 中固件由 cargo 从 `git+rmk.git` 解析，而 `scripts/build-rynk-wasm.py` 会**另外**再拉一次源码。两次独立拉取若落在不同 commit（拉移动分支时必然如此），固件与 wasm 客户端将来自不同的协议 commit，测试会以难以定位的线路错误失败。

处理方式：`qemu/Cargo.toml` 与 `scripts/build-rynk-wasm.py` 都按同一个 rmk commit 固定（rev pin，而非 `branch = "main"`），两次独立拉取因此必然同源，CI 不需要共享 checkout，也不设 `RMK_REPO`；升级时三处 pin（含 `src-tauri/Cargo.toml`）一起改。`qemu/run.mjs` 采用与 `build-rynk-wasm.py` 相同的解析顺序（`RMK_REPO` → 同级 `../rmk`），解析到则通过 `cargo --config` 把 `[patch]` 指向该 checkout。本地开发同样受益：有同级 `../rmk` 时固件与 wasm 客户端自动同源。

顺带纳入（各一行，成本可忽略）：现有 `ci` job 的 ubuntu 分支增加 `pnpm check`（svelte-check 当前为 105 files / 0 errors）；`eslint.config.mjs` 的 `'qemu/**'` 忽略项收窄为 `'qemu/src/**'` + `'qemu/target/**'`，使 `qemu/run.mjs` 与新增 harness 脚本纳入 lint。

## 7. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| §5.2 的两条编译配置静默失效 | `$state` 不响应，测试行为无法解释 | 在写任何用例之前先验证二者生效 |
| 断言绑定固件夹具，夹具调整时需同步改测试 | 维护成本 | 常量全部集中在 `tests/fixture.ts` 单一文件；夹具与断言基准本就应当一起变更 |
| QEMU 单客户端限制导致并发连接失败 | 测试随机失败 | `fileParallelism: false`；`afterEach` 中确保 `resetStore()` 释放连接 |
| CI 中固件与 wasm 客户端协议版本不一致 | 难以定位的线路错误 | §6.2 的单次 clone + `[patch]` 方案 |
| 固件重连行为不确定 | 用例 5、10 依赖 QEMU 接受第二次连接 | 落地时优先验证；若不稳定，退化为同一连接内以 `read_all_keymap` 回读比对 |
| 首次运行需构建两份 riscv 固件 | 冷启动约 1–2 分钟 | `hookTimeout: 60_000`；两份使用独立 target 目录以保持增量；`RMK_E2E_ADDR` 提供手动模式绕过 |
| `src-tauri` 的 375 行 Rust transport 无覆盖 | 串口/BLE 发现、MTU 分块、session 生命周期无防护 | 本方案不覆盖，属已知缺口 |
