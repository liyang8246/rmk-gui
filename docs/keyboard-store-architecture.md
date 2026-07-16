# Keyboard Store 架构

## 技术选型

`solid-js/store` — 路径级响应式 + `reconcile` + `produce`，零额外依赖。

## 关键约束: RynkClient 单借用

`RynkClient` 所有方法都取 `&mut self`，JS 必须 await 一个调用结束才能发下一个。
`next_event()` 会 park 在 `transport.read()` 上，期间 `receive_in_flight = true`。
此时任何并发 `set_*` 调用会永久杀死 client (`dead = true`)。

**结论**: 不能同时跑 topic loop 和 sync processor。改为单驱动循环。

## 状态分层

```
store
├── connection      连接元数据
├── device           设备信息 — 只读
├── config           可编辑配置 — 需同步到键盘
├── status           运行时状态 — 只读, 轮询驱动
└── sync             同步健康
```

`config` 是唯一需要同步到键盘的切片。`status` 由轮询单向写入，不触发回写。

所有类型均来自 `src/rynk/wasm/rynk_wasm.d.ts`，`import type` 直接引用。

### connection

| 字段 | 类型 | 说明 |
|------|------|------|
| `connected` | `boolean` | 是否已连接 |
| `transport` | `'serial' \| 'ble' \| 'tcp' \| null` | 传输方式 |
| `label` | `string \| null` | 设备显示名 |
| `protocolVersion` | `ProtocolVersion \| null` | 协议版本 (major + minor) |
| `client` | `RynkClient \| null` | WASM 句柄, sync 层调它发命令 |

### device — 连接时读一次，只读

| 字段 | 类型 | 说明 |
|------|------|------|
| `capabilities` | `DeviceCapabilities \| null` | 硬件能力 (层数/行列数/旋钮数/bulk上限等) |
| `info` | `DeviceInfo \| null` | 设备身份 (rmk_version/VID/PID/厂商/产品名/序列号) |
| `layout` | `LayoutInfo \| null` | 物理布局 (variants + keys + encoders 位置) |

### config — 可编辑，需同步到键盘

| 字段 | 类型 | 说明 | RynkClient 写入 API |
|------|------|------|---------------------|
| `keymap` | `KeyAction[][][]` | `[layer][row][col]` 每格按键动作 | `set_keymap_bulk` |
| `encoders` | `EncoderAction[][]` | `[encoder_id][layer]` 旋钮 CW/CCW 动作 | `set_encoder` |
| `combos` | `Combo[]` | 组合键配置 | `set_combo_bulk` |
| `macros` | `number[]` | flat 字节流, 按 offset 读写 | `set_macro` |
| `morse` | `Morse[]` | 摩斯键配置 | `set_morse_bulk` |
| `forks` | `Fork[]` | key override 配置 | `set_fork` |
| `behavior` | `BehaviorConfig \| null` | 全局时序参数 (combo_timeout_ms, tap_interval_ms 等) | `set_behavior` |
| `defaultLayer` | `number` | 默认层 | `set_default_layer` |

### status — 只读，轮询驱动

| 字段 | 类型 | 来源 |
|------|------|------|
| `currentLayer` | `number` | `get_current_layer` |
| `connection` | `ConnectionStatus \| null` | `get_connection_status` |
| `battery` | `BatteryStatus \| null` | `get_battery_status` |
| `bleStatus` | `BleStatus \| null` | `get_ble_status` |
| `matrixState` | `MatrixState \| null` | `get_matrix_state` |
| `ledIndicator` | `LedIndicator \| null` | `get_led_indicator` |
| `sleepState` | `boolean` | `get_sleep_state` |
| `wpm` | `number` | `get_wpm` |
| `lockStatus` | `LockStatus \| null` | `get_lock_status` |
| `eventsDropped` | `number` | `client.events_dropped()` |

### sync

| 字段 | 类型 | 说明 |
|------|------|------|
| `syncing` | `boolean` | 正在写入键盘 |
| `errors` | `{ slice: string, error: string, timestamp: number }[]` | 最近的同步失败记录 |

## 处理流程

### 1. 连接 + 初始同步

```
connect(link)
  → connectClient(link)           WASM 握手, 拿到 RynkClient
  → 读 device (capabilities/info/layout)
  → 读 config 全量 (get_keymap_bulk / get_combo_bulk / ...)
    → 同时写入 store + shadow      diff = 0, 不触发回写
  → 读 status 一次
  → 启动 driver loop
```

### 2. UI 编辑 → 同步

```
editConfig(mutator)
  ├─ snapshot before = clone(store.config)
  ├─ setStore(produce(mutator))       store 立即更新, UI 即时响应
  ├─ snapshot after = clone(store.config)
  ├─ changes = diff(before, after)   只找本次编辑改了哪些路径
  └─ eventQueue.push({ changes })    一个 event 入队, 上限 50 条 (满了丢最旧)

Driver loop (单循环, 串行所有 client 操作):
  while connected:
    1. 如果 eventQueue 非空:
       取队首 event
         → re-apply: 把 event 的 newValue 重写回 store (直接 setStore, 不走 editConfig)
           (防止前一个 event 失败回滚覆盖了本次编辑的值)
         → await sendChanges(client, changes)
         → 成功: shadow[path] = newValue
         → 失败: store[path] = shadow[path]  (逐路径回滚)
       继续循环 (不 sleep, 优先处理 sync)

    2. 如果 eventQueue 为空:
       轮询一个 status 字段
         → currentLayer 每次都轮询 (用户需要实时反馈当前层)
         → 其余字段 (battery/bleStatus/matrixState/...) 轮换, 每次一个
         → await client.get_xxx()
         → setStore('status', ..., reconcile(result))
         → sleep 500ms
```

**关键**: sync 和 status 轮询在同一个循环里，永远不会并发调用 client。
sync 有优先权——队列非空时不 sleep、不轮询。
re-apply 必须保留——没有它，前一个事件失败回滚会覆盖后续事件的值。

**已知行为**: 固件推送的 topic 帧会在 `request_raw` 内部被缓冲到 client 的内部队列 (容量 64)，
但我们不调用 `next_event()` 来排空它。队列满后 `eventsDropped` 会单调增长。
这是预期行为——轮询已覆盖 topic 的功能，`eventsDropped` 不应视为错误信号。

### 3. 断连

```
任何 client 调用抛出 Disconnected
  → setStore('connection', 'connected', false)
  → driver loop 退出
  → flush eventQueue (清空, 不保留旧事件)
  → 重连后: 重新初始同步, 从干净状态开始
```

重连时清空队列——旧事件可能引用已失效的键盘状态，直接丢弃更安全。

## 核心约束

| 约束 | 保证方式 |
|------|---------|
| RynkClient 单借用 | 单 driver loop, sync 和轮询不并发 |
| 一次编辑 = 一个事件 | `editConfig` 内 snapshot + diff + push 一个 event |
| 严格串行, 绝不合并 | driver loop 一次处理一个 event, `await` 等键盘 |
| 失败回滚当前事件 | 回滚目标是 `shadow[path]` (键盘实际态) |
| 无 echo | 初始同步写 store + shadow (diff=0); 轮询只写 status (不碰 config) |
| 无 debounce | event 立即入队, driver loop 立即处理 |
| 断连安全 | 清空队列, 重连后全量重读 |

## 文件结构

```
src/store/
  types.ts                  状态类型定义
  store.ts                  createStore + 全局单例导出
  edit.ts                   editConfig() — 唯一的 config 编辑入口
  shadow.ts                 shadow copy (非响应式, 记录键盘实际状态)
  diff.ts                   diffConfigs() — before/after 快照差异 → PathChange[]
  sync.ts                   sendChanges() — 按 slice 分组, 合连续路径为 bulk, 调 RynkClient
  driver.ts                 单 driver loop (sync 优先 + status 轮询, 内联轮询逻辑)
  actions.ts                高层 action: connect, loadConfig, disconnect
```
