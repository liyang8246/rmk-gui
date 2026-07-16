import { invoke } from '@tauri-apps/api/core'

// JsByteLink bridge to native rynk transport (serial / BLE / TCP).
export class TauriByteLink {
  constructor(private sessionId: string) {}

  async send(frame: Uint8Array): Promise<void> {
    await invoke('rynk_send', { session: this.sessionId, data: Array.from(frame) })
  }

  async recv(): Promise<Uint8Array> {
    const data = await invoke<number[]>('rynk_recv', { session: this.sessionId })
    return new Uint8Array(data)
  }

  async close(): Promise<void> {
    await invoke('rynk_close', { session: this.sessionId })
  }
}

// Discovery + connect API.
export interface SerialDeviceInfo { path: string, name: string | null }
export interface BleDeviceInfo { id: string, name: string | null }
export interface TcpDeviceInfo { addr: string, name: string }

export async function discoverSerial(): Promise<SerialDeviceInfo[]> {
  return invoke<SerialDeviceInfo[]>('rynk_discover_serial')
}

export async function discoverBle(): Promise<BleDeviceInfo[]> {
  return invoke<BleDeviceInfo[]>('rynk_discover_ble')
}

export async function discoverTcp(): Promise<TcpDeviceInfo[]> {
  return invoke<TcpDeviceInfo[]>('rynk_discover_tcp')
}

export async function connectSerial(path: string): Promise<TauriByteLink> {
  const sessionId = await invoke<string>('rynk_connect_serial', { path })
  return new TauriByteLink(sessionId)
}

export async function connectBle(id: string): Promise<TauriByteLink> {
  const sessionId = await invoke<string>('rynk_connect_ble', { id })
  return new TauriByteLink(sessionId)
}

export async function connectTcp(addr: string): Promise<TauriByteLink> {
  const sessionId = await invoke<string>('rynk_connect_tcp', { addr })
  return new TauriByteLink(sessionId)
}
