import type { DfuMode, DfuTarget } from '../lib/dfu'
import { DFU_CLASS, DFU_PROTOCOL_MODE, DFU_PROTOCOL_RUNTIME, DFU_SUBCLASS, transferSizeOf } from '../lib/dfu'
import { canUseWebUsb, usbLabel } from './web'

const GET_DESCRIPTOR = 0x06
const DESC_CONFIGURATION = 0x02

interface DfuInterface {
  number: number
  mode: DfuMode
}

/// The DFU interface on a device, or null when it carries none. Readable from
/// cached descriptors, so it filters `getDevices()` without opening.
function dfuInterface(device: USBDevice): DfuInterface | null {
  for (const configuration of device.configurations) {
    for (const iface of configuration.interfaces) {
      for (const alt of iface.alternates) {
        if (alt.interfaceClass !== DFU_CLASS || alt.interfaceSubclass !== DFU_SUBCLASS) continue
        if (alt.interfaceProtocol === DFU_PROTOCOL_MODE) return { number: iface.interfaceNumber, mode: 'dfu' }
        if (alt.interfaceProtocol === DFU_PROTOCOL_RUNTIME) return { number: iface.interfaceNumber, mode: 'runtime' }
      }
    }
  }
  return null
}

export function dfuModeOf(device: USBDevice): DfuMode | null {
  return dfuInterface(device)?.mode ?? null
}

/// Must run inside a click: the browser's own device picker needs the gesture.
/// A bootloader enumerates with its own ids, so the grant a keyboard already
/// has does not cover it — the picker is needed once per bootloader.
export async function requestDfuDevice(): Promise<USBDevice> {
  return navigator.usb.requestDevice({
    filters: [
      { classCode: DFU_CLASS, subclassCode: DFU_SUBCLASS, protocolCode: DFU_PROTOCOL_MODE },
      { classCode: DFU_CLASS, subclassCode: DFU_SUBCLASS, protocolCode: DFU_PROTOCOL_RUNTIME },
    ],
  })
}

/// DFU-capable devices the user has already granted this origin, plugged in
/// right now: bootloaders, and applications that can reboot into one.
export async function grantedDfuDevices(): Promise<USBDevice[]> {
  if (!canUseWebUsb()) return []
  const devices = await navigator.usb.getDevices().catch(() => [])
  return devices.filter(d => dfuInterface(d) !== null)
}

export class WebUsbDfu implements DfuTarget {
  private constructor(
    private device: USBDevice,
    private iface: number,
    readonly transferSize: number,
    readonly label: string,
  ) {}

  static async open(device: USBDevice): Promise<WebUsbDfu> {
    const iface = dfuInterface(device)
    if (!iface) throw new Error('no DFU interface on this device')
    if (!device.opened) await device.open()
    if (device.configuration === null) {
      await device.selectConfiguration(device.configurations[0]!.configurationValue)
    }
    await device.claimInterface(iface.number)
    // WebUSB exposes no class-specific descriptors, so the functional
    // descriptor — and the block size in it — is read off the wire.
    const result = await device.controlTransferIn({
      requestType: 'standard',
      recipient: 'device',
      request: GET_DESCRIPTOR,
      value: DESC_CONFIGURATION << 8,
      index: 0,
    }, 255)
    const size = result.data ? transferSizeOf(view(result.data)) : null
    if (size === null) {
      await device.close().catch(() => {})
      throw new Error('device has no DFU functional descriptor')
    }
    return new WebUsbDfu(device, iface.number, size, usbLabel(device))
  }

  private setup(request: number, value: number): USBControlTransferParameters {
    return { requestType: 'class', recipient: 'interface', request, value, index: this.iface }
  }

  async out(request: number, value: number, data?: Uint8Array): Promise<void> {
    // `slice` gives the transfer its own ArrayBuffer, which a view over the
    // image's shared buffer cannot promise.
    const result = await this.device.controlTransferOut(this.setup(request, value), data?.slice() ?? new Uint8Array(0))
    if (result.status !== 'ok') throw new Error(`DFU request ${request} rejected: ${result.status}`)
  }

  async in(request: number, value: number, length: number): Promise<Uint8Array> {
    const result = await this.device.controlTransferIn(this.setup(request, value), length)
    if (result.status !== 'ok' || !result.data) throw new Error(`DFU request ${request} failed: ${result.status}`)
    return view(result.data)
  }

  async restart(): Promise<void> {
    await this.device.reset()
  }

  async close(): Promise<void> {
    await this.device.releaseInterface(this.iface).catch(() => {})
    await this.device.close().catch(() => {})
  }
}

function view(data: DataView): Uint8Array {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
}
