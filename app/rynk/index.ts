import type { TauriByteLink } from './tauri'
import type { WebByteLink, WebHidLink } from './web'
import { isTauri } from '@tauri-apps/api/core'
import { closeAllSessions, connectBle, connectSerial, connectTcp, discoverBle, discoverSerial, discoverTcp } from './tauri'
import { connectGrantedHid, connectGrantedSerial, grantedHidDevices, grantedSerialPorts, hidLabel, serialLabel } from './web'

export type ByteLink = TauriByteLink | WebByteLink | WebHidLink

export interface ConnectedDevice {
  link: ByteLink
  label: string
}

export interface TransportInfo {
  kind: 'serial' | 'ble' | 'tcp' | 'hid'
  id: string
  label: string
  connect: () => Promise<ConnectedDevice>
  handle?: SerialPort | HIDDevice
}

export async function discover(): Promise<TransportInfo[]> {
  if (!isTauri()) {
    const [ports, devices] = await Promise.all([grantedSerialPorts(), grantedHidDevices()])
    const nameOf = (vendorId?: number, productId?: number): string | undefined => {
      if (vendorId === undefined || productId === undefined) return undefined
      return devices.find(d => d.vendorId === vendorId && d.productId === productId)?.productName
    }
    return [
      ...ports.map((port, i) => {
        const { usbVendorId, usbProductId } = port.getInfo()
        return {
          kind: 'serial' as const,
          id: `serial:${usbVendorId}:${usbProductId}:${i}`,
          label: nameOf(usbVendorId, usbProductId) ?? serialLabel(port),
          connect: () => connectGrantedSerial(port),
          handle: port,
        }
      }),
      ...devices.map(device => ({
        kind: 'hid' as const,
        id: `hid:${device.vendorId}:${device.productId}:${device.productName}`,
        label: nameOf(device.vendorId, device.productId) ?? hidLabel(device),
        connect: () => connectGrantedHid(device),
        handle: device,
      })),
    ]
  }
  const [serials, bles, tcps] = await Promise.all([
    discoverSerial().catch(() => []),
    discoverBle().catch(() => []),
    discoverTcp().catch(() => []),
  ])
  return [
    ...serials.map((s) => {
      const label = s.name ?? s.path
      return { kind: 'serial' as const, id: s.path, label, connect: () => connectSerial(s.path, label) }
    }),
    ...bles.map((b) => {
      const label = b.name ?? b.id
      return { kind: 'ble' as const, id: b.id, label, connect: () => connectBle(b.id, label) }
    }),
    ...tcps.map((t) => {
      return { kind: 'tcp' as const, id: t.addr, label: t.name, connect: () => connectTcp(t.addr, t.name) }
    }),
  ]
}

export { connect } from './core'
export type { JsByteLink } from './core'
export { connectSession } from './session'
export type { Session } from './session'
export { closeAllSessions }
export type * from './wasm/rynk_wasm.js'
export { canUseWebHid, canUseWebSerial, requestHidDevice, requestSerialPort } from './web'
