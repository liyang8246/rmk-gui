import type { TauriByteLink } from './tauri'
import type { WebByteLink } from './web'
import { isTauri } from '@tauri-apps/api/core'
import { connectBle, connectSerial, connectTcp, discoverBle, discoverSerial, discoverTcp } from './tauri'

export type ByteLink = TauriByteLink | WebByteLink

export interface TransportInfo {
  kind: 'serial' | 'ble' | 'tcp'
  label: string
  connect: () => Promise<ByteLink>
}

export async function discover(): Promise<TransportInfo[]> {
  if (!isTauri()) return []
  const [serials, bles, tcps] = await Promise.all([
    discoverSerial().catch(() => []),
    discoverBle().catch(() => []),
    discoverTcp().catch(() => []),
  ])
  return [
    ...serials.map(s => ({ kind: 'serial' as const, label: s.name ?? s.path, connect: () => connectSerial(s.path) })),
    ...bles.map(b => ({ kind: 'ble' as const, label: b.name ?? b.id, connect: () => connectBle(b.id) })),
    ...tcps.map(t => ({ kind: 'tcp' as const, label: t.name, connect: () => connectTcp(t.addr) })),
  ]
}
