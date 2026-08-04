import type { ConnectedDevice } from './index'

/// The firmware's `RynkHidReport`, and the vendor-defined usage it sits on.
/// USB bulk and HID carry the same Rynk byte stream; only the framing differs.
/// 0xFF14 is Rynk's own page — rmk-rs/rmk#1022 moved it off 0xFF60, which
/// Via/Vial keyboards use, so their boards no longer match the picker filter.
const RYNK_HID_REPORT_SIZE = 32
const RYNK_HID_USAGE_PAGE = 0xFF14
const RYNK_HID_USAGE = 0x61
/// The firmware's collection is the only one on the report; report id 0.
const RYNK_HID_REPORT_ID = 0

/// The RMK vendor bulk interface — the class triple the firmware advertises
/// (`RYNK_USB_INTERFACE_*` in rmk-types), matched instead of any VID/PID.
const RYNK_USB_CLASS = 0xFF
const RYNK_USB_SUBCLASS = 0x52
const RYNK_USB_PROTOCOL = 0x52
/// Covers a whole Rynk frame per transfer, and is a multiple of both Full- and
/// High-Speed bulk packet sizes — a partial-packet read length would error the
/// moment the device sends a full packet.
const USB_READ_SIZE = 4096

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
    // Each chunk arrives in its own transfer/event buffer, so adopting it
    // outright is safe — the copy is only needed when a backlog exists.
    this.rx = this.rx.length === 0 ? bytes : concat(this.rx, bytes)
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

/// Best-effort teardown that never wedges the caller: a close can queue
/// behind a transfer the device never accepted, and teardown is what the
/// connect screen waits on. The session is already over when this runs — the
/// OS handle gets a moment, then we move on.
async function boundedClose(work: Promise<unknown>): Promise<void> {
  await Promise.race([
    work.catch(() => {}),
    new Promise<void>(resolve => setTimeout(resolve, 1_000)),
  ])
}

interface VendorInterface {
  interfaceNumber: number
  epIn: number
  epOut: number
}

/// The Rynk vendor interface on a device, or null when it carries none —
/// readable from cached descriptors without opening the device, so this both
/// filters `getDevices()` and locates the endpoints to claim.
function vendorInterface(device: USBDevice): VendorInterface | null {
  for (const configuration of device.configurations) {
    for (const iface of configuration.interfaces) {
      for (const alt of iface.alternates) {
        if (
          alt.interfaceClass !== RYNK_USB_CLASS
          || alt.interfaceSubclass !== RYNK_USB_SUBCLASS
          || alt.interfaceProtocol !== RYNK_USB_PROTOCOL
        ) {
          continue
        }
        const epIn = alt.endpoints.find(e => e.direction === 'in' && e.type === 'bulk')
        const epOut = alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk')
        if (epIn && epOut) {
          return {
            interfaceNumber: iface.interfaceNumber,
            epIn: epIn.endpointNumber,
            epOut: epOut.endpointNumber,
          }
        }
      }
    }
  }
  return null
}

export class WebUsbLink extends BufferedLink {
  /// The pump starts here, before the caller's first send: bulk has no DTR, so
  /// the firmware never learns the previous session's host vanished and may be
  /// parked on a topic write no one read — only a pending IN transfer drains
  /// it. The version probe skips those stale frames.
  constructor(
    private device: USBDevice,
    private iface: VendorInterface,
    readonly label: string,
  ) {
    super()
    void this.pump()
  }

  private async pump() {
    try {
      while (!this.closed) {
        const result = await this.device.transferIn(this.iface.epIn, USB_READ_SIZE)
        if (result.status === 'stall') {
          await this.device.clearHalt('in', this.iface.epIn)
          continue
        }
        if (result.data) {
          this.push(new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength))
        }
      }
    }
    catch {
      // Unplugged, or close() aborted the pending transfer.
    }
    this.end()
  }

  async send(frame: Uint8Array): Promise<void> {
    // A fresh buffer, not the caller's view: transferOut wants plain
    // ArrayBuffer backing, which a view over shared memory cannot promise.
    const buf = new Uint8Array(frame.length)
    buf.set(frame)
    await this.device.transferOut(this.iface.epOut, buf)
  }

  async close(): Promise<void> {
    this.end()
    // close() also aborts the pump's pending transferIn.
    await boundedClose(
      this.device.releaseInterface(this.iface.interfaceNumber)
        .catch(() => {})
        .then(() => this.device.close()),
    )
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
    await boundedClose(this.device.close())
  }
}

/// Descriptor product string, or the numeric ids when it carried none. The
/// name comes with the grant — no handshake needed, so even a keyboard that
/// never connects has one.
function deviceLabel(
  prefix: string,
  d: { productName?: string | null, vendorId: number, productId: number },
): string {
  if (d.productName) return d.productName
  const id = (n: number) => n.toString(16).padStart(4, '0')
  return `${prefix} ${id(d.vendorId)}:${id(d.productId)}`
}

export function hidLabel(device: HIDDevice): string {
  return deviceLabel('HID', device)
}

export function usbLabel(device: USBDevice): string {
  return deviceLabel('USB', device)
}

function canUse(api: 'usb' | 'hid'): boolean {
  return typeof navigator !== 'undefined' && api in navigator
}

export function canUseWebHid(): boolean {
  return canUse('hid')
}

export function canUseWebUsb(): boolean {
  return canUse('usb')
}

export async function openUsb(device: USBDevice): Promise<ConnectedDevice> {
  const iface = vendorInterface(device)
  if (!iface) throw new Error('no Rynk vendor interface on this device')
  if (!device.opened) await device.open()
  if (device.configuration === null) {
    await device.selectConfiguration(device.configurations[0]!.configurationValue)
  }
  await device.claimInterface(iface.interfaceNumber)
  const label = usbLabel(device)
  return { link: new WebUsbLink(device, iface, label), label }
}

/// Must run inside a click: the browser's own device picker needs the gesture.
export async function requestUsbDevice(): Promise<USBDevice> {
  return navigator.usb.requestDevice({
    filters: [{
      classCode: RYNK_USB_CLASS,
      subclassCode: RYNK_USB_SUBCLASS,
      protocolCode: RYNK_USB_PROTOCOL,
    }],
  })
}

/// Keyboards the user has already granted this origin. Like the WebHID list
/// these need no gesture, so a granted keyboard shows up in the app's own list
/// and can be reconnected on launch.
export async function grantedUsbDevices(): Promise<USBDevice[]> {
  if (!canUseWebUsb()) return []
  const devices = await navigator.usb.getDevices().catch(() => [])
  return devices.filter(d => vendorInterface(d) !== null)
}

export async function openHid(device: HIDDevice): Promise<ConnectedDevice> {
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
