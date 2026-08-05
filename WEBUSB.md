# USB 传输替换方案:WebUSB + Vendor Bulk 接口

| | |
|---|---|
| **状态** | 定稿(2026-08-04 评审后更新) |
| **范围** | rmk 固件 USB 描述符与 rynk 传输;rmk 仓库 `rynk/` host 传输 crate;rmk-gui Web/Tauri 两侧的 USB 通路 |

---

## 1. 背景

rmk-gui 与固件之间说 rynk 协议(COBS 分帧字节流),USB 通路现状是两条:浏览器走 Web Serial 对固件的 CDC-ACM 接口;Tauri 经上游 `rynk-serial` crate(serialport)对同一接口。HID vendor collection(usage page 0xFF14,rmk#1022 从 Via/Vial 的 0xFF60 挪开)是给蓝牙场景的 WebHID 通路。

这套现状有四个结构性问题,都出在 CDC-ACM 上,且每一个都已在代码里付出了代价:

1. **端口被占用,串口枚举一身泥**:ACM 端口是系统串口,ModemManager、终端工具、flash 脚本都可能抓走它,产生一类"连不上且原因不明"的故障。`rynk-serial` 为串口枚举背着 macOS `tty.`/`cu.` 去重和 serial marker 前缀匹配;`usb_log` + rynk 双 CDC 会把一台键盘发现成两台。打开 CDC 端口还会翻转 DTR(复位部分 MCU),discovery 因此被迫"只读不开",连接时得重新枚举一遍才能把 path 变回设备。
2. **拿不到设备名**:Web Serial 的 `getInfo()` 规范上只暴露 VID/PID([WICG/serial#175](https://github.com/WICG/serial/issues/175) 悬而未决)。GUI 为绕这个缺口已经养出一套补丁机器:`device-names.ts` 的 localStorage 记名、握手成功后回写、discover 里 remembered → HID 同胞设备 → 裸 `USB 4c4b:4644` 的三级 fallback。
3. **Android 不可用**:Android Chrome 不支持 Web Serial 和 WebHID,手机浏览器完全无法配置 USB 键盘;WebUSB 是 Android 上唯一可用的设备 API。
4. **端点开销**:CDC 占 2 个接口 + IAD + 3 个端点(2 IN + 1 OUT)。nRF52840 只有 EP1–7 共 7 个 IN 端点,全家桶配置(keyboard + composite + steno + `usb_log` + rynk)正好 7/7 打满;vendor bulk 接口只要 1 接口 + 2 端点,省 1 个 IN 和约 40 字节配置描述符。

## 2. 目标与时机

固件新增一个 vendor-specific bulk 接口承载 rynk 字节流;浏览器用 WebUSB、Tauri 用 raw USB(nusb)连接它。授权即可读 USB 描述符的产品名与序列号(包括握手失败的设备);rynk 的 CDC-ACM 传输移除。

**必须赶在 v0.9 发布前落地。** rynk 未随任何正式版发布(最新 tag `rmk-v0.8.2` 早于 rynk 合入),此时替换,CDC 传输等于从未发布过,"旧固件不被新 GUI 支持"只影响手上的开发板,兼容性代价为零。拖过 v0.9,就要承担真实的发布顺序与用户升级窗口(见风险 4)。

## 3. 设计决策

1. **替换而非并存**:rynk 的 CDC-ACM 传输彻底移除,不保留 feature flag——保留它意味着占用问题与端点开销都还在,且两条 USB 通路永远都要维护。代价是 Tauri 侧必须同步迁移到 raw USB。USB 日志不受影响:`usb_log` 走 `embassy-usb-logger` 自己的通道,与 rynk 传输无关。
2. **不复用现有接口跑 WebUSB**:HID 是 WebUSB 的 protected class,规范禁止 claim;CDC 接口在 macOS/Windows 上被内核驱动(AppleUSBACM / usbser.sys)占有,claim 失败。必须是新的 vendor 接口。
3. **按接口三元组识别设备,不再依赖 serial number 标记**:vendor 接口固定 `class=0xFF, subclass=0x52 ('R'), protocol=0x52`(选值避开 ADB/fastboot 的 `0x42` 事实标准 subclass 空间;发布后冻结)。WebUSB 的 picker filter 与 nusb 枚举都能按这三元组精确匹配,与 VID/PID 解耦,自定义 VID/PID 的键盘无需任何额外配置即可被发现。serial number 里的 `rynk:` 前缀保留为纯信息用途(`lsusb`/系统报告可辨识 RMK 设备),发现不再依赖它;固件里 "so hosts can identify RMK devices cheaply" 的注释随之改掉。
4. **GUI 直接迁移,不做过渡**:USB 通路只有 WebUSB/nusb 一条,Web Serial 与 serialport 代码整体删除。换来的是 GUI 里没有双路径分支、没有次级入口,连接页保持单一心智。
5. **原生传输仍是 rmk 仓库的 host crate**:native USB 传输不属于 rmk-gui——现状的 `rynk-serial` 就是 rmk 仓库 `rynk/` 下实现 `RynkDevice` 的 crate,rmk-gui 只是 git 依赖加 40 行胶水。迁移形态保持对称:rmk 仓库新增 `rynk/rynk-usb`(nusb + `RynkDevice`,与 `rynk-ble` 并列),删除 `rynk-serial`,rmk-gui 换依赖。固件接口与 host crate 同仓同步出,不存在跨仓发布时序。nusb 纯 Rust、异步、免 libusb,顺带消掉 serialport 的 libudev/版本约束。

## 4. 详细设计

### 固件接口

- 单一 vendor 接口:`bInterfaceClass=0xFF, bInterfaceSubClass=0x52, bInterfaceProtocol=0x52`,一对 bulk endpoint(FS 64B / HS 512B)。
- 字节流与 CDC 一致:COBS 分帧,`0x00` 定界,rynk 协议不感知传输差异。发送侧整帧写入、长度为 wMaxPacketSize 整数倍时补 ZLP——现有 `RynkUsbTx` 逻辑原样平移。
- **读侧契约差异**:raw bulk OUT 的 `read` 要求缓冲区 ≥ wMaxPacketSize,而 `run_session` 用 `df.tail()` 读、尾部空间可小于一包。现在是 CDC `BufferedReceiver` 的一包 scratch 在兜底;新传输保留同样的 buffered 适配层(照搬现有 `RX_BUF` 模式)。
- **MS OS 2.0 descriptors**:`Builder::msos_descriptor` 声明 header,vendor function 上用 `FunctionBuilder::msos_feature` 挂 `WINUSB` compatible ID + `DeviceInterfaceGUIDs` registry property。复合设备中 compatible ID 落在正确 function 上这件事由 embassy-usb 的 function subset API 结构性保证。
- **iSerialNumber 改为 per-unit**:现状 USB 构建的 serial 是全型号相同的构建串,`serialNumber` 区分不了两台同型号键盘,Chrome 的 WebUSB 授权持久化也按 VID/PID/serial 记设备。发现已与 serial 解耦(决策 3),正好换成芯片 UID(nRF BLE 构建已在用 `get_serial_number()`);Vial 构建的 `vial:` magic 仍需留在 serial 里,UID 以字段并存,顺序尊重 BLE 长度截断。
- **builder 静态缓冲扩容**:`usb/mod.rs` 里 `BOS_DESC`/`MSOS_DESC` 现各 16 字节。MS OS 2.0 descriptor set 约 178 字节(MSOS_DESC → 256);BOS 需容纳 28 字节 platform capability,加 WebUSB capability 再 +24(BOS_DESC → 64)。
- 可选:BOS WebUSB capability + landing page URL。注意桌面 Chrome 已移除插入设备时的 landing page 通知,该体验仅 Android 生效,不做任何 UX 依赖。

### Web 传输(rmk-gui)

`src/rynk/web-usb.ts` 新增 `WebUsbLink`,结构同 `WebHidLink`:

- `requestDevice({ filters: [{ classCode: 0xFF, subclassCode: 0x52, protocolCode: 0x52 }] })`;
- `open() → selectConfiguration(1) → claimInterface(n)`(n 按三元组匹配,不硬编码);接收侧 `transferIn` 循环推入现有 `BufferedLink`(长度取 wMaxPacketSize 整数倍,否则整包到达报 overflow),发送侧 `transferOut` 直写;
- **pump 先行**:`open()` 后立刻挂起 `transferIn` 循环,再发 probe。bulk 没有 DTR,固件感知不到 host 离开(现状 CDC 同样不用 DTR,非新问题);上个会话悄悄消失时,固件的 service loop 可能停在一笔没人读的 topic 写上,先读才能排掉它,probe 会跳过这些 stale 帧。顺序颠倒的症状是"第二次连接永远超时";
- 设备名取 `device.productName`,授权即持久可读;`device.serialNumber` 可区分两台同型号键盘,取代现在靠列表位置的临时办法;
- 命名补丁机器整体删除:`device-names.ts`、devices store 的握手回写、discover 的三级 fallback,连同 Web Serial 传输一起;
- `navigator.usb` 的 `disconnect` 事件触发 `end()`,与现有断链→teardown 流程衔接;
- 连接流程沿用现有的空闲看门狗与 open deadline,无需新超时逻辑。

### 原生传输(rmk 仓库 + Tauri)

- rmk 仓库新增 `rynk/rynk-usb`:nusb 枚举设备 → 匹配接口三元组 → claim → bulk in/out,实现 `RynkDevice`(label 取描述符 product string);`rynk-serial` 删除。
- **测试迁移先行**:`rynk-serial` 的 PTY `scripted_firmware` 握手测试是唯一在真实字节流上验证 `connect()` 的测试,删除 crate 前先搬进 rynk core,用内存 duplex 跑。
- rmk-gui src-tauri:`serial.rs` → `usb.rs`,命令改为 `rynk_discover_usb` / `rynk_connect_usb`;依赖从 `rynk-serial` 换成 `rynk-usb`。发现不再需要"只读不开"的绕路——raw USB 枚举读描述符本来就不打开设备,也没有 DTR 语义。

### 影响范围

USB 通路整体切换,旧固件(CDC)不再被新 GUI 支持(时机见第 2 节,代价为零的窗口)。蓝牙通路(WebHID / btleplug)与 qemu 测试夹具(TCP)不受本方案影响。

## 5. 工程集成

- **rmk 固件**:vendor 接口 + MS OS 2.0 descriptors + builder 缓冲扩容;移除 rynk 的 CDC 传输(`usb_log` 独立,不受影响);rynk service 挂接新传输(含读侧一包 scratch 适配);serial 前缀注释修正。
- **rmk host crates**:新增 `rynk/rynk-usb`,删除 `rynk-serial`,握手测试先迁入 rynk core。
- **rmk-gui**:新增 `web-usb.ts` 传输并入 discover;删除 Web Serial 传输与整套命名补丁(`device-names.ts` 等);src-tauri 换依赖、`serial.rs` → `usb.rs`。
- 文档:`docs/src/native-transports` 与 `rmk-gui-transport.md` 增补 WebUSB/nusb 通路。

## 6. 风险

1. **Windows 上 MS OS 2.0 是两条通路的单点**:Chrome(WebUSB)只能打开绑了 WinUSB 的接口,nusb 同样依赖 WinUSB 绑定——描述符不生效则 Windows 全平台不可用。首插体验在 Windows 10/11 实机验证优先级最高;per-function 落点已由 embassy-usb 保证,残余风险在 IAD/接口序号后续变动。
2. **Windows 描述符缓存**:MS OS descriptor 按 VID/PID(+bcdDevice)首次查询后缓存于注册表,后续修改描述符不生效。不止开发期:用户 toggling `usb_log`/steno 等 feature 会改接口布局,同 VID/PID/bcdDevice 撞旧缓存,WinUSB 绑错或绑不上,表现为"重刷固件后 Windows 连不上"。`bcdDevice` 不绑定 RMK 版本号,由接口布局派生(布局哈希取低字节);开发期清缓存(`usbflags`)写进固件侧开发文档。
3. **Linux 权限**:usbfs 节点默认 root 属主,Chrome(WebUSB)与 Tauri(nusb)都需要 udev 规则才能访问——并非新增负担,现状的 CDC 同样要手动加 `dialout` 组,WebHID 蓝牙通路本就需要 hidraw 规则(Vial 有同样先例)。规则按接口三元组匹配即可覆盖任意 VID/PID:`SUBSYSTEM=="usb", ENV{ID_USB_INTERFACES}=="*:ff5252:*", TAG+="uaccess"`;随文档与 Tauri 打包分发。
4. **时机滑落**:若未能赶在 v0.9 发布前合入,退化为原发布顺序问题——固件版本必须先行,未升级固件的用户在 USB tab 什么都看不到,连接页空态文案要指向固件升级。
5. **Android 实机验证**:claim vendor 接口按接口进行,理论上不碰 HID、打字不受影响——但 Android 支持是本方案的头部收益,需实机确认打字不断流,并验证系统 USB 授权弹窗的流程。
