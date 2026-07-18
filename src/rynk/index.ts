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
  label: string
}

export interface TransportInfo {
  kind: 'serial' | 'ble' | 'tcp'
  label: string
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
    ...serials.map((s) => {
      const label = s.name ?? s.path
      return { kind: 'serial' as const, label, connect: () => connectSerial(s.path, label) }
    }),
    ...bles.map((b) => {
      const label = b.name ?? b.id
      return { kind: 'ble' as const, label, connect: () => connectBle(b.id, label) }
    }),
    ...tcps.map((t) => {
      const label = t.name
      return { kind: 'tcp' as const, label, connect: () => connectTcp(t.addr, label) }
    }),
  ]
}

export { connectClient } from './core'
export type { JsByteLink } from './core'
export type * from './wasm/rynk_wasm.js'
