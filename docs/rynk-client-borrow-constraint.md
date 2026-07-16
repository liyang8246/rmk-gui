# RynkClient 单借用约束分析

## 问题

`RynkClient`（WASM 导出）的所有方法都取 `&mut self`。`next_event()` 和 `set_*()` 不能并发调用，否则 client 永久死亡。

## 根因

### 时间线

1. **调 `await client.next_event()`**

   `next_event()` 内部调 `next_topic_frame()`（`driver.rs:248`）：
   ```rust
   pub async fn next_topic_frame(&mut self) -> Result<TopicFrame, RynkHostError> {
       if let Some(frame) = self.events.pop_front() {
           return Ok(frame);     // 队列里有 → 立刻返回，不 park
       }
       // 队列空 → 往下走，要读字节
       loop {
           let (header, payload) = self.next_frame().await?;
       }
   }
   ```

2. **`next_frame()` 设 flag 再 park**（`driver.rs:351`）：
   ```rust
   async fn next_frame(&mut self) -> Result<(RynkHeader, Vec<u8>), RynkHostError> {
       if self.send_in_flight || self.receive_in_flight {
           self.dead = true;              // 有在飞的 → 杀死
           return Err(RynkHostError::Disconnected);
       }
       self.receive_in_flight = true;     // ← 标记"我在读"
       let result = self.next_frame_inner().await;  // ← park 在这等字节
       self.receive_in_flight = false;    // 读完了才清除
       result
   }
   ```

   `next_frame_inner` 循环调 `self.transport.read()`，最终调到 `link.recv()`，即 `invoke('rynk_recv')` —— 一个 Tauri 命令，等 Rust 端 tokio channel 吐字节。

3. **await 时 JS 事件循环空闲，`editConfig` 跑了，调 `await client.set_key(...)`**

   `set_key` 内部调 `send_request`（`driver.rs:325`）：
   ```rust
   async fn send_request<Req: Serialize>(&mut self, cmd: Cmd, req: &Req) -> Result<u8, RynkHostError> {
       if self.dead || self.send_in_flight || self.receive_in_flight {
           self.dead = true;   // ← receive_in_flight 是 true（next_event 设的）
           return Err(RynkHostError::Disconnected);  // 杀死 client
       }
       // ... 正常发送
   }
   ```

   **client 永久死亡。** 之后所有调用都直接返回 `Disconnected`。

### 为什么 JS 能拿到控制权

WASM async 底层就是 JS Promise。`next_event()` await 的是 `link.recv()` → `invoke('rynk_recv')` → 一个 pending 的 JS Promise。await 一个 pending Promise 时 JS 事件循环是空闲的，可以跑别的代码——比如 `editConfig` 调 `set_*`。

所以问题不是"JS 拿不回控制权"，而是 rynk driver 内部的安全检查：`next_event()` park 之前设了 `receive_in_flight = true`，`set_*()` 进来看到这个 flag 就把 client 标 dead。

### 为什么 rynk driver 不允许并发

rynk 跑在 BLE/Serial/TCP 上，单字节流。`transport.read()` 返回任意大小的字节块——可能半个帧、一个帧、两个半帧。Client 要在 `rx_buf` 里累积字节、拼装完整帧。

如果两个 `read()` 并发跑，字节会被两个 reader 抢走，各自拼不出完整帧。

### 但分帧已经做好了

rynk driver **确实已经做好了分帧**。`request_raw` 在等自己响应时，如果收到 topic 帧，会自动入队到 `events`（`VecDeque<TopicFrame>`，容量 64）：

```rust
// driver.rs:283-314 (request_raw 内部)
loop {
    let (header, payload) = self.next_frame().await?;
    if header.cmd.is_topic() {
        // topic 帧 → 入队，继续等自己的响应
        if self.events.len() == EVENT_QUEUE_CAPACITY { ... }
        self.events.push_back(TopicFrame { cmd: header.cmd, payload });
    } else if header.seq == seq {
        // 自己的响应 → 返回
        return env.map_err(RynkHostError::Rejected);
    }
    // stale seq → 丢弃
}
```

而且 `next_event()` 在队列非空时直接返回，不 park：

```rust
// driver.rs:249
if let Some(frame) = self.events.pop_front() {
    return Ok(frame);  // 队列里有 → 直接返回，不 park
}
```

真正的问题只有一个：**队列空时 `next_event()` park 在 `transport.read()` 上无限等待**。这时 `receive_in_flight = true`，`set_*` 进来就会杀 client。

## rynk-wasm 的设计缺陷

rynk driver 没有一个后台 read pump 持续读字节、拼帧、按 CMD 分发到 response queue 和 topic queue。

如果有后台 pump：
- `receive_in_flight` 由 pump 管理（始终 true，但不再是"禁止并发"的信号）
- `set_*` 只需要 enqueue 请求、等 pump 把响应送回来
- `next_event()` 只需要从 topic queue 取，空了就 await 一个 condition variable
- 两者自然并发，互不阻塞

当前设计用 `receive_in_flight` / `send_in_flight` 两个 flag 禁止并发操作，是最简单的实现，但把"单字节流必须串行读"错误地扩大成了"所有操作必须串行"。

## 对 rmk-gui 的影响

因为 rynk-wasm 有这个约束，rmk-gui 的 store 不能用独立的 topic loop + sync processor 双循环架构。当前方案是**单 driver loop**：

```
while connected:
  if eventQueue 非空:
    await client.set_xxx()   // 处理编辑
  else:
    await client.next_event() // 等 topic，但会 park
```

但这意味着 `next_event()` park 时无法响应新的 `editConfig`——要么牺牲实时性（轮询），要么需要 rynk-wasm 修复。

## 后续修复方向

### 方案 A：修复 rynk-wasm（推荐）

在 `Client` 内部加一个常驻 read pump：
- pump 持续读字节、拼帧
- 收到 topic 帧 → push 到 `events` 队列 + 唤醒 `next_event()` 的 waiter
- 收到 response 帧 → 匹配 SEQ，唤醒对应 `request_raw()` 的 waiter
- `set_*` 和 `next_event()` 各自只等自己的结果，不直接调 `transport.read()`

这样 `receive_in_flight` 不再需要，`set_*` 和 `next_event()` 自然并发。

### 方案 B：给 `next_event()` 加超时

`next_event()` 接受一个 timeout 参数。park 超时后返回 `Ok(None)`，JS 拿回控制权可以发 `set_*`。

简单但浪费——没 topic 时也在空转，有 topic 时可能延迟一个 timeout 周期。

### 方案 C：rmk-gui 侧单循环（当前方案）

不修改 rynk-wasm，用一个循环交替执行 sync 和 topic。`next_event()` park 期间无法响应编辑，但因为单次编辑是 `await set_xxx()`（同步等待结果），实际上不会和 `next_event()` 并发——只要保证不同时 await 两者。

问题是：`next_event()` park 时来了 `editConfig`，没法打断 park。
