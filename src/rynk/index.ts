import type { TauriByteLink } from './tauri'
import type { HidProtocol, WebHidLink, WebUsbLink } from './web'
import { isTauri } from '@tauri-apps/api/core'
import {
  closeAllSessions,
  connectBle,
  connectTcp,
  connectUsb,
  connectVialHid,
  discoverBle,
  discoverTcp,
  discoverUsb,
  discoverVialHid,
} from './tauri'
import { grantedHidDevices, grantedUsbDevices, hidLabel, hidProtocol, openHid, openUsb, usbLabel } from './web'

export type ByteLink = TauriByteLink | WebUsbLink | WebHidLink

/// Which wire protocol a transport entry speaks — decided by the interface it
/// was found on (rynk vendor interface / 0xFF14 vs the Vial 0xFF60 page), so
/// no probe is needed to route the connect.
export type Protocol = HidProtocol

export interface ConnectedDevice {
  link: ByteLink
  label: string
  protocol: Protocol
}

export interface TransportInfo {
  kind: 'usb' | 'ble' | 'tcp' | 'hid'
  protocol: Protocol
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
        protocol: 'rynk' as const,
        id: `usb:${device.vendorId}:${device.productId}:${device.serialNumber ?? i}`,
        label: usbLabel(device),
        connect: () => openUsb(device),
        handle: device,
      })),
      ...hids.map(device => ({
        kind: 'hid' as const,
        protocol: hidProtocol(device) ?? 'rynk',
        id: `hid:${device.vendorId}:${device.productId}:${device.productName}`,
        label: hidLabel(device),
        connect: () => openHid(device),
        handle: device,
      })),
    ]
  }
  const [usbs, bles, tcps, vials] = await Promise.all([
    discoverUsb().catch(() => []),
    discoverBle().catch(() => []),
    discoverTcp().catch(() => []),
    discoverVialHid().catch(() => []),
  ])
  return [
    ...usbs.map(u => ({
      kind: 'usb' as const,
      protocol: 'rynk' as const,
      id: u.id,
      label: u.name,
      connect: () => connectUsb(u.id, u.name),
    })),
    ...bles.map((b) => {
      const label = b.name ?? b.id
      return { kind: 'ble' as const, protocol: 'rynk' as const, id: b.id, label, connect: () => connectBle(b.id, label) }
    }),
    ...tcps.map((t) => {
      return { kind: 'tcp' as const, protocol: 'rynk' as const, id: t.addr, label: t.name, connect: () => connectTcp(t.addr, t.name) }
    }),
    // A Vial keyboard the OS already bonded over Bluetooth surfaces from the
    // same HID enumeration; `kind` keeps the connect screen's tabs honest.
    ...vials.map(v => ({
      kind: v.bluetooth ? 'hid' as const : 'usb' as const,
      protocol: 'vial' as const,
      id: v.id,
      label: v.name,
      connect: () => connectVialHid(v.id, v.name),
    })),
  ]
}

export { connectClient, connectVial, keycodeTables, withDeadline } from './core'
export type { JsByteLink, KeyboardClient } from './core'
export { closeAllSessions }
export type * from './wasm/rynk_wasm.js'
export { canUseWebHid, canUseWebUsb, requestHidDevice, requestUsbDevice } from './web'
