# Keyboard Store 架构

## 技术选型

`solid-js/store` — 路径级响应式 + `reconcile` + `produce`，零额外依赖。

## 关键约束: RynkClient 单借用

`RynkClient` 所有方法都取 `&mut self`，JS 必须 await 一个调用结束才能发下一个。

`next_event()` 存在已知 bug（作者已确认为误设计），不可用。
**当前方案: 不使用 `next_event()`**，status 全量轮询 (`get_*`)，单驱动循环串行所有 client 调用。

> 详见 `docs/rynk-client-borrow-constraint.md`。rynk-wasm 修复后可引入独立 topic loop，
> 但当前设计不依赖它——轮询已覆盖 topic 功能。

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

### connection — null 表示未连接

| 字段 | 类型 | 说明 |
|------|------|------|
| `transport` | `'serial' \| 'ble' \| 'tcp'` | 传输方式 |
| `label` | `string` | 设备显示名 |
| `protocolVersion` | `ProtocolVersion` | 协议版本 (major + minor) |

`connection` 为 `null` 时表示未连接。`RynkClient` 句柄存在 `clientHolder`（非响应式）, 不在 store 里。

### device — 连接时读一次，只读

| 字段 | 类型 | 说明 |
|------|------|------|
| `capabilities` | `DeviceCapabilities` | 硬件能力 (层数/行列数/旋钮数/bulk上限等) |
| `layout` | `LayoutInfo` | 物理布局 (variants + keys + encoders 位置) |

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
| `queueDepth` | `number` | 当前同步队列深度 |
| `errors` | `{ slice: string, error: string, timestamp: number }[]` | 最近的同步失败记录 |

## 处理流程

### 1. 连接 + 初始同步

```
connect(link)
  → connectClient(link)           WASM 握手, 拿到 RynkClient
  → 读 device (capabilities/layout)  串行 await, 不能 Promise.all
  → 读 config 全量 (get_keymap_bulk / get_combo_bulk / ...)  串行 await
    → 同时写入 store + shadow      diff = 0, 不触发回写
  → 读 status 一次                 串行 await
  → 启动 driver loop
```

### 2. UI 编辑 → 同步

```
editConfig(mutator)
  ├─ 检查 eventQueue 是否已满 → 满了 throw (store 未改动, 调用方等待 drain 后重试)
  ├─ beforeRefs = shallow copy of store.config slice refs
  ├─ setStore(produce(mutator))       store 立即更新, UI 即时响应
  ├─ 遍历 slice: ref 不等才 deepEqual diff → 只找本次编辑改了哪些路径
  └─ eventQueue.push({ changes }) + setStore('sync', 'queueDepth', n)
                                      一个 event 入队, 上限 50 条 (满了 throw)

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

**`next_event()` 不使用**。固件推送的 topic 帧（当前层变化、矩阵状态等）通过
轮询 `get_*` 获取，不依赖 `next_event()` 驱动。`eventsDropped` 记录在 `status` 中
供可观测性使用, 不作为错误信号驱动恢复。

### 3. 断连

```
任何 client 调用抛出 Disconnected
  → free WASM client (Symbol.dispose, try/catch)
  → clientHolder.client = null
  → setStore('connection', null)
  → driver loop 退出
  → flush eventQueue (清空, 不保留旧事件)
  → 重连后: 重新初始同步, 从干净状态开始
```

重连时清空队列——旧事件可能引用已失效的键盘状态，直接丢弃更安全。
`connectKeyboard` 会在开头防御性地 free 已存在的 client。

## 核心约束

| 约束 | 保证方式 |
|------|---------|
| RynkClient 单借用 | 单 driver loop, sync 和轮询不并发 |
| 不使用 `next_event()` | status 全量轮询 `get_*`, topic 帧不消费 |
| 一次编辑 = 一个事件 | `editConfig` 内 shallow ref + diff + push 一个 event |
| 严格串行, 绝不合并 | driver loop 一次处理一个 event, `await` 等键盘 |
| 失败回滚当前事件 | 回滚目标是 `shadow[path]` (键盘实际态) |
| 队列满保护 | `editConfig` 在 `produce` 前检查队列, 满了 throw, store 不改动 |
| 无 echo | 初始同步写 store + shadow (diff=0); 轮询只写 status (不碰 config) |
| 无 debounce | event 立即入队, driver loop 立即处理 |
| 断连安全 | free client + 清空队列, 重连后全量重读 |

## 文件结构

```
src/store/
  keyboard.ts               状态类型 + createStore 单例 + shadow + editConfig + diff
  actions.ts                connect/disconnect + 全量 config fetch + pollStatusOnce
  driver.ts                 单 driver loop (sync 优先 + status 轮询, 内联轮询逻辑)
  sync.ts                   sendChanges — 按 slice 分组, 合连续路径为 bulk, 调 RynkClient
  index.ts                  re-export
```
