import type { TauriByteLink } from './tauri'
import type { WebByteLink, WebHidLink } from './web'
import { isTauri } from '@tauri-apps/api/core'
import { rememberedDeviceName } from '../lib/device-names'
import { closeAllSessions, connectBle, connectSerial, connectTcp, discoverBle, discoverSerial, discoverTcp } from './tauri'
import { connectGrantedHid, connectGrantedSerial, grantedHidDevices, grantedSerialPorts, hidLabel, serialLabel } from './web'

export type ByteLink = TauriByteLink | WebByteLink | WebHidLink

export interface ConnectedDevice {
  link: ByteLink
  label: string
}

export interface TransportInfo {
  kind: 'serial' | 'ble' | 'tcp' | 'hid'
  /// Stable across scans (port path / BLE id / socket address); identifies the
  /// live session so a rescan can leave it alone.
  id: string
  label: string
  connect: () => Promise<ConnectedDevice>
  /// Web only: the `SerialPort`/`HIDDevice` this entry stands for. Neither API
  /// gives a device an id, so the object itself is the identity — it lets a
  /// freshly granted handle be matched back to its row in the list.
  handle?: SerialPort | HIDDevice
}

/// Devices reachable without a user gesture. Native builds enumerate the
/// transports directly; the browser offers what the user has already granted —
/// both APIs list that, so a granted port and a granted HID device appear alike.
export async function discover(): Promise<TransportInfo[]> {
  if (!isTauri()) {
    const [ports, devices] = await Promise.all([grantedSerialPorts(), grantedHidDevices()])
    /// Web Serial withholds the product string, so the name comes from the
    /// keyboard: what it reported over the protocol on a previous connection,
    /// which is the same name the app shows once connected. Only until then
    /// does the USB descriptor string of a granted HID sibling stand in — one
    /// keyboard exposes both interfaces under the same ids.
    const nameOf = (vendorId?: number, productId?: number): string | undefined => {
      if (vendorId === undefined || productId === undefined) return undefined
      const remembered = rememberedDeviceName(vendorId, productId)
      if (remembered) return remembered
      return devices.find(d => d.vendorId === vendorId && d.productId === productId)?.productName
    }
    return [
      // Neither API exposes a device id, so identity is what each does report,
      // plus the position that disambiguates two identical keyboards.
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

export { connectClient, keycodeTables } from './core'
export type { JsByteLink } from './core'
export { closeAllSessions }
export type * from './wasm/rynk_wasm.js'
export { canUseWebHid, canUseWebSerial, requestHidDevice, requestSerialPort } from './web'
