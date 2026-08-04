import type { ConnectedDevice } from './index'

/// The firmware's `RynkHidService` report, and the vendor-defined usage it sits
/// on. Serial and HID carry the same Rynk byte stream; only the framing differs.
const RYNK_HID_REPORT_SIZE = 32
const RYNK_HID_USAGE_PAGE = 0xFF60
const RYNK_HID_USAGE = 0x61
/// The firmware's collection is the only one on the report; report id 0.
const RYNK_HID_REPORT_ID = 0

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}

/// Buffers device→host bytes and hands them to `recv` a chunk at a time, which
/// is the shape `connectClient` expects. Shared by both web transports.
abstract class BufferedLink {
  protected rx: Uint8Array = new Uint8Array(0)
  protected closed = false
  private wake: (() => void) | null = null

  protected push(bytes: Uint8Array) {
    if (!bytes.length) return
    this.rx = concat(this.rx, bytes)
    this.signal()
  }

  protected end() {
    this.closed = true
    this.signal()
  }

  private signal() {
    const w = this.wake
    this.wake = null
    w?.()
  }

  async recv(): Promise<Uint8Array> {
    while (this.rx.length === 0 && !this.closed)
      await new Promise<void>((res) => { this.wake = res })
    const chunk = this.rx
    this.rx = new Uint8Array(0)
    return chunk
  }
}

export class WebByteLink extends BufferedLink {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private writer: WritableStreamDefaultWriter<Uint8Array>

  constructor(private port: SerialPort, readonly label: string) {
    super()
    this.reader = port.readable!.getReader()
    this.writer = port.writable!.getWriter()
    void this.pump()
  }

  private async pump() {
    for (;;) {
      const { value, done } = await this.reader.read()
      if (done) break
      if (value) this.push(value)
    }
    this.end()
  }

  async send(frame: Uint8Array): Promise<void> {
    await this.writer.write(frame)
  }

  async close(): Promise<void> {
    await this.reader.cancel()
    this.reader.releaseLock()
    await this.writer.abort()
    this.writer.releaseLock()
    this.end()
    // The link owns the port for the session: leaving it open would make the
    // next connect to the same port fail with InvalidStateError.
    try {
      await this.port.close()
    }
    catch {
      // Already closed, or the device was unplugged.
    }
  }
}

/// WebHID reaches the vendor report on a keyboard the OS has already bonded, so
/// a Bluetooth keyboard is editable from the browser without Web Bluetooth —
/// which would demand its own pairing the OS has already done.
export class WebHidLink extends BufferedLink {
  private listener: (event: HIDInputReportEvent) => void

  constructor(private device: HIDDevice, readonly label: string) {
    super()
    this.listener = (event) => {
      const { buffer, byteOffset, byteLength } = event.data
      // Reports are fixed-size and zero-padded. COBS treats those zeros as frame
      // delimiters, so the padding decodes to empty frames and is discarded.
      this.push(new Uint8Array(buffer, byteOffset, byteLength))
    }
    device.addEventListener('inputreport', this.listener)
  }

  async send(frame: Uint8Array): Promise<void> {
    for (let offset = 0; offset < frame.length; offset += RYNK_HID_REPORT_SIZE) {
      const report = new Uint8Array(RYNK_HID_REPORT_SIZE)
      report.set(frame.subarray(offset, offset + RYNK_HID_REPORT_SIZE))
      await this.device.sendReport(RYNK_HID_REPORT_ID, report)
    }
  }

  async close(): Promise<void> {
    this.device.removeEventListener('inputreport', this.listener)
    this.end()
    // close() queues behind any sendReport the device never accepted, so it can
    // park as long as the send does. The session is already over once the
    // listener is gone — give the OS handle a moment, then move on rather than
    // wedge the teardown that the connect screen is waiting on.
    await Promise.race([
      this.device.close().catch(() => {}),
      new Promise<void>(resolve => setTimeout(resolve, 1_000)),
    ])
  }
}

export function hidLabel(device: HIDDevice): string {
  if (device.productName) return device.productName
  const id = (n: number) => n.toString(16).padStart(4, '0')
  return `HID ${id(device.vendorId)}:${id(device.productId)}`
}

export function canUseWebHid(): boolean {
  return typeof navigator !== 'undefined' && 'hid' in navigator
}

export function canUseWebSerial(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

/// Web Serial reports only the USB ids, never the product string or the `rynk:`
/// serial marker the native transport recognises a keyboard by — so this is as
/// specific as a browser-side label can be.
export function serialLabel(port: SerialPort): string {
  const { usbVendorId, usbProductId } = port.getInfo()
  if (usbVendorId === undefined || usbProductId === undefined) return 'Serial port'
  const id = (n: number) => n.toString(16).padStart(4, '0')
  return `USB ${id(usbVendorId)}:${id(usbProductId)}`
}

async function openSerial(port: SerialPort): Promise<ConnectedDevice> {
  // `readable` is null until the port is open; a port kept from an earlier
  // session in this page is already open and must not be opened twice.
  if (!port.readable) await port.open({ baudRate: 115200 })
  const label = serialLabel(port)
  return { link: new WebByteLink(port, label), label }
}

/// Must run inside a click: the browser's own port picker needs the gesture.
/// Returns the handle rather than a session, so the caller can connect through
/// the same list every already-granted device uses.
export async function requestSerialPort(): Promise<SerialPort> {
  return navigator.serial.requestPort()
}

/// Ports the user has already granted this origin. Like the WebHID list these
/// need no gesture, so a granted keyboard shows up in the picker and can be
/// reconnected on launch.
export async function grantedSerialPorts(): Promise<SerialPort[]> {
  if (!canUseWebSerial()) return []
  return navigator.serial.getPorts().catch(() => [])
}

export async function connectGrantedSerial(port: SerialPort): Promise<ConnectedDevice> {
  return openSerial(port)
}

async function openHid(device: HIDDevice): Promise<ConnectedDevice> {
  if (!device.opened) await device.open()
  const label = hidLabel(device)
  return { link: new WebHidLink(device, label), label }
}

/// Must run inside a click: the browser's own device picker needs the gesture.
export async function requestHidDevice(): Promise<HIDDevice> {
  const devices = await navigator.hid.requestDevice({
    filters: [{ usagePage: RYNK_HID_USAGE_PAGE, usage: RYNK_HID_USAGE }],
  })
  const device = devices[0]
  if (!device) throw new Error('no keyboard chosen')
  return device
}

/// Keyboards the user has already granted this origin. Unlike `requestDevice`
/// these need no gesture, so the app can offer them as a list or reconnect.
export async function grantedHidDevices(): Promise<HIDDevice[]> {
  if (!canUseWebHid()) return []
  const devices = await navigator.hid.getDevices().catch(() => [])
  return devices.filter(d =>
    d.collections.some(c => c.usagePage === RYNK_HID_USAGE_PAGE && c.usage === RYNK_HID_USAGE),
  )
}

export async function connectGrantedHid(device: HIDDevice): Promise<ConnectedDevice> {
  return openHid(device)
}
