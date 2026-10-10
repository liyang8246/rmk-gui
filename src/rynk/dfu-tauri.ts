import type { DfuMode, DfuTarget } from '../lib/dfu'
import { invoke } from '@tauri-apps/api/core'
import { transferSizeOf } from '../lib/dfu'

const GET_DESCRIPTOR = 0x06
const DESC_CONFIGURATION = 0x02

export interface DfuDeviceInfo { id: string, name: string, mode: DfuMode }

/// DFU-capable devices plugged in right now, by their interface class triple:
/// bootloaders, and applications that can reboot into one.
export async function discoverDfu(): Promise<DfuDeviceInfo[]> {
  return invoke<DfuDeviceInfo[]>('dfu_discover')
}

interface Opened { session: string, label: string, interface: number }

export class TauriDfu implements DfuTarget {
  private constructor(
    private session: string,
    private iface: number,
    readonly transferSize: number,
    readonly label: string,
  ) {}

  static async open(id: string): Promise<TauriDfu> {
    const opened = await invoke<Opened>('dfu_open', { id })
    // The block size sits in the DFU functional descriptor, read off the wire
    // the same way the browser path does.
    const config = new Uint8Array(await invoke<number[]>('dfu_control_in', {
      session: opened.session,
      controlType: 'standard',
      recipient: 'device',
      request: GET_DESCRIPTOR,
      value: DESC_CONFIGURATION << 8,
      index: 0,
      length: 255,
    }))
    const size = transferSizeOf(config)
    if (size === null) {
      await invoke('dfu_close', { session: opened.session }).catch(() => {})
      throw new Error('device has no DFU functional descriptor')
    }
    return new TauriDfu(opened.session, opened.interface, size, opened.label)
  }

  async out(request: number, value: number, data?: Uint8Array): Promise<void> {
    await invoke('dfu_control_out', {
      session: this.session,
      controlType: 'class',
      recipient: 'interface',
      request,
      value,
      index: this.iface,
      data: Array.from(data ?? []),
    })
  }

  async in(request: number, value: number, length: number): Promise<Uint8Array> {
    return new Uint8Array(await invoke<number[]>('dfu_control_in', {
      session: this.session,
      controlType: 'class',
      recipient: 'interface',
      request,
      value,
      index: this.iface,
      length,
    }))
  }

  async restart(): Promise<void> {
    await invoke('dfu_reset', { session: this.session })
  }

  async close(): Promise<void> {
    await invoke('dfu_close', { session: this.session }).catch(() => {})
  }
}
