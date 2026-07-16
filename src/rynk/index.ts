import type { TauriByteLink } from './tauri'
import type { WebByteLink } from './web'
import { isTauri } from '@tauri-apps/api/core'

export type ByteLink = TauriByteLink | WebByteLink

export interface TransportInfo {
  kind: 'serial' | 'ble' | 'tcp'
  label: string
  connect: () => Promise<ByteLink>
}

export async function discover(): Promise<TransportInfo[]> {
  if (!isTauri())
    return []
  const { discoverSerial, discoverBle, connectSerial, connectBle } = await import('./tauri')
  const [serials, bles] = await Promise.all([
    discoverSerial().catch(() => []),
    discoverBle().catch(() => []),
  ])
  return [
    ...serials.map(s => ({ kind: 'serial' as const, label: s.name ?? s.path, connect: () => connectSerial(s.path) })),
    ...bles.map(b => ({ kind: 'ble' as const, label: b.name ?? b.id, connect: () => connectBle(b.id) })),
  ]
}

export async function connectTcp(addr: string): Promise<ByteLink> {
  const { connectTcp: tcp } = await import('./tauri')
  return tcp(addr)
}

export async function connectWebSerialPort(): Promise<ByteLink> {
  const { connectWebSerial } = await import('./web')
  return connectWebSerial()
}
