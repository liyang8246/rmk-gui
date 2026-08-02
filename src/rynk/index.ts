import type { TauriByteLink } from './tauri'
import type { WebByteLink } from './web'
import { isTauri } from '@tauri-apps/api/core'
import { closeAllSessions, connectBle, connectSerial, connectTcp, discoverBle, discoverSerial, discoverTcp } from './tauri'

export type ByteLink = TauriByteLink | WebByteLink

export interface ConnectedDevice {
  link: ByteLink
  label: string
}

export interface TransportInfo {
  kind: 'serial' | 'ble' | 'tcp'
  /// Stable across scans (port path / BLE id / socket address); identifies the
  /// live session so a rescan can leave it alone.
  id: string
  label: string
  connect: () => Promise<ConnectedDevice>
}

/// Web mode cannot enumerate: `navigator.serial.requestPort()` needs a user
/// gesture and opens the browser's own picker, so callers use connectWebSerial.
export function canDiscover(): boolean {
  return isTauri()
}

export async function discover(): Promise<TransportInfo[]> {
  if (!canDiscover()) return []
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
export { connectWebHid, connectWebSerial } from './web'
