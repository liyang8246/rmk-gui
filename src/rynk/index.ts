import type { TauriByteLink } from './tauri'
import type { WebByteLink } from './web'
import { isTauri } from '@tauri-apps/api/core'
import { connectBle, connectSerial, connectTcp, discoverBle, discoverSerial, discoverTcp } from './tauri'

export type ByteLink = TauriByteLink | WebByteLink

export interface DeviceDescriptor {
  vendor_id: number
  product_id: number
  manufacturer: string
  product_name: string
  serial_number: string
}

export interface ConnectedDevice {
  link: ByteLink
  descriptor: DeviceDescriptor
}

export interface TransportInfo {
  kind: 'serial' | 'ble' | 'tcp'
  label: string
  descriptor: DeviceDescriptor
  connect: () => Promise<ConnectedDevice>
}

export async function discover(): Promise<TransportInfo[]> {
  if (!isTauri()) return []
  const [serials, bles, tcps] = await Promise.all([
    discoverSerial().catch(() => []),
    discoverBle().catch(() => []),
    discoverTcp().catch(() => []),
  ])
  return [
    ...serials.map(s => ({ kind: 'serial' as const, label: s.name ?? s.path, descriptor: s.descriptor, connect: () => connectSerial(s.path, s.descriptor) })),
    ...bles.map(b => ({ kind: 'ble' as const, label: b.name ?? b.id, descriptor: b.descriptor, connect: () => connectBle(b.id) })),
    ...tcps.map(t => ({ kind: 'tcp' as const, label: t.name, descriptor: t.descriptor, connect: () => connectTcp(t.addr) })),
  ]
}

export { connectClient } from './core'
export type { JsByteLink } from './core'
export type * from './wasm/rynk_wasm.js'
