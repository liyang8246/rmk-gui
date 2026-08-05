import type { TauriByteLink } from './tauri'
import type { WebHidLink, WebUsbLink } from './web'
import { isTauri } from '@tauri-apps/api/core'
import { closeAllSessions, connectBle, connectTcp, connectUsb, discoverBle, discoverTcp, discoverUsb } from './tauri'
import { grantedHidDevices, grantedUsbDevices, hidLabel, openHid, openUsb, usbLabel } from './web'

export type ByteLink = TauriByteLink | WebUsbLink | WebHidLink

export interface ConnectedDevice {
  link: ByteLink
  label: string
}

export interface TransportInfo {
  kind: 'usb' | 'ble' | 'tcp' | 'hid'
  /// Stable across scans (USB device id / BLE id / socket address); identifies
  /// the live session so a rescan can leave it alone.
  id: string
  label: string
  connect: () => Promise<ConnectedDevice>
  /// Web only: the `USBDevice`/`HIDDevice` this entry stands for. Neither API
  /// gives a device an id, so the object itself is the identity — it lets a
  /// freshly granted handle be matched back to its row in the list.
  handle?: USBDevice | HIDDevice
}

/// Devices reachable without a user gesture. Native builds enumerate the
/// transports directly; the browser offers what the user has already granted —
/// both APIs list that, so a granted USB keyboard and a granted HID device
/// appear alike. Names come straight off the USB descriptors.
export async function discover(): Promise<TransportInfo[]> {
  if (!isTauri()) {
    const [usbs, hids] = await Promise.all([grantedUsbDevices(), grantedHidDevices()])
    return [
      ...usbs.map((device, i) => ({
        kind: 'usb' as const,
        id: `usb:${device.vendorId}:${device.productId}:${device.serialNumber ?? i}`,
        label: usbLabel(device),
        connect: () => openUsb(device),
        handle: device,
      })),
      ...hids.map(device => ({
        kind: 'hid' as const,
        id: `hid:${device.vendorId}:${device.productId}:${device.productName}`,
        label: hidLabel(device),
        connect: () => openHid(device),
        handle: device,
      })),
    ]
  }
  const [usbs, bles, tcps] = await Promise.all([
    discoverUsb().catch(() => []),
    discoverBle().catch(() => []),
    discoverTcp().catch(() => []),
  ])
  return [
    ...usbs.map(u => ({ kind: 'usb' as const, id: u.id, label: u.name, connect: () => connectUsb(u.id, u.name) })),
    ...bles.map((b) => {
      const label = b.name ?? b.id
      return { kind: 'ble' as const, id: b.id, label, connect: () => connectBle(b.id, label) }
    }),
    ...tcps.map((t) => {
      return { kind: 'tcp' as const, id: t.addr, label: t.name, connect: () => connectTcp(t.addr, t.name) }
    }),
  ]
}

export { connectClient, keycodeTables, withDeadline } from './core'
export type { JsByteLink } from './core'
export { closeAllSessions }
export type * from './wasm/rynk_wasm.js'
export { canUseWebHid, canUseWebUsb, requestHidDevice, requestUsbDevice } from './web'
