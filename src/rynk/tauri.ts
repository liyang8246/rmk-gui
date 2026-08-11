import type { ConnectedDevice } from './index'
import { invoke } from '@tauri-apps/api/core'

export class TauriByteLink {
  constructor(private sessionId: string, readonly label: string) {}

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

interface UsbDeviceInfo { id: string, name: string }
interface BleDeviceInfo { id: string, name: string | null }
interface TcpDeviceInfo { addr: string, name: string }

export async function discoverUsb(): Promise<UsbDeviceInfo[]> {
  return invoke<UsbDeviceInfo[]>('rynk_discover_usb')
}

export async function discoverBle(): Promise<BleDeviceInfo[]> {
  return invoke<BleDeviceInfo[]>('rynk_discover_ble')
}

export async function discoverTcp(): Promise<TcpDeviceInfo[]> {
  return invoke<TcpDeviceInfo[]>('rynk_discover_tcp')
}

export async function connectUsb(id: string, label: string): Promise<ConnectedDevice> {
  const session = await invoke<string>('rynk_connect_usb', { id })
  return { link: new TauriByteLink(session, label), label }
}

export async function connectBle(id: string, label: string): Promise<ConnectedDevice> {
  const session = await invoke<string>('rynk_connect_ble', { id })
  return { link: new TauriByteLink(session, label), label }
}

export async function closeAllSessions(): Promise<void> {
  await invoke('rynk_close_all')
}

export async function connectTcp(addr: string, label: string): Promise<ConnectedDevice> {
  const session = await invoke<string>('rynk_connect_tcp', { addr })
  return { link: new TauriByteLink(session, label), label }
}
