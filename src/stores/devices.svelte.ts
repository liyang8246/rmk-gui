import type { TransportInfo } from '../rynk'
import { isTauri } from '@tauri-apps/api/core'
import { canUseWebHid, canUseWebSerial, closeAllSessions, discover, requestHidDevice, requestSerialPort } from '../rynk'
import { keyboardStore } from './keyboard'

class DeviceStoreClass {
  #devices = $state<TransportInfo[]>([])
  #scanning = $state(false)
  /// Transport id being connected, so only that row shows a spinner.
  #connecting = $state<string | null>(null)
  #connectedId = $state<string | null>(null)
  #connectedKind = $state<TransportInfo['kind'] | null>(null)
  #booted = false

  get devices() { return this.#devices }
  get scanning() { return this.#scanning }
  get connecting() { return this.#connecting }

  /// Only meaningful while the session is live: the keyboard store owns the
  /// connection, and it can drop the link without telling us which id died.
  get connectedId() {
    return keyboardStore.connection?.phase === 'connected' ? this.#connectedId : null
  }

  /// How this app is talking to the keyboard — a different question from which
  /// transport the keyboard is typing over, which `activeOutput` answers.
  get connectedKind() {
    return keyboardStore.connection?.phase === 'connected' ? this.#connectedKind : null
  }

  async scan(): Promise<void> {
    this.#scanning = true
    try {
      this.#devices = await discover()
    }
    finally {
      this.#scanning = false
    }
  }

  /// Startup: drop sessions a reloaded frontend left holding the port, list
  /// what is attached, and connect when there is exactly one candidate.
  async boot(): Promise<void> {
    if (this.#booted) return
    this.#booted = true
    // Native only: a reloaded frontend leaves the Rust side holding the port.
    if (isTauri()) await closeAllSessions().catch(() => {})
    await this.scan()
    const only = this.#devices.length === 1 ? this.#devices[0] : undefined
    if (only && !keyboardStore.connection) await this.connect(only)
  }

  async connect(info: TransportInfo): Promise<void> {
    if (this.#connecting) return
    this.#connecting = info.id
    try {
      if (keyboardStore.connection) await keyboardStore.resetStore()
      await this.open(info)
    }
    finally {
      this.#connecting = null
    }
  }

  /// Opens a listed device into the keyboard store. Assumes the caller owns
  /// `#connecting` and has already dropped any previous session.
  private async open(info: TransportInfo): Promise<void> {
    const result = await keyboardStore.initStore(await info.connect())
    if (result.isErr()) {
      this.#connectedId = null
      this.#connectedKind = null
      throw result.error
    }
    this.#connectedId = info.id
    this.#connectedKind = info.kind
  }

  /// Browser path: the picker the browser opens *is* the device list, and it
  /// needs the click that called this to still be the active user gesture.
  /// `hid` reaches a Bluetooth keyboard the OS already bonded; Web Bluetooth
  /// would demand a second pairing and cannot see an established one.
  async pick(kind: 'serial' | 'hid'): Promise<void> {
    if (this.#connecting) return
    this.#connecting = `web-${kind}`
    try {
      // The picker only grants access; the grant then joins the same list every
      // other device comes from, so one device never has two identities.
      const handle = kind === 'hid' ? await requestHidDevice() : await requestSerialPort()
      if (keyboardStore.connection) await keyboardStore.resetStore()
      await this.scan()
      const listed = this.#devices.find(d => d.handle === handle)
      if (listed) {
        this.#connecting = listed.id
        await this.open(listed)
      }
    }
    catch (e) {
      // NotFoundError is the user dismissing the picker, not a failure.
      if (!(e instanceof DOMException && e.name === 'NotFoundError')) throw e
    }
    finally {
      this.#connecting = null
    }
  }

  get browserTransports(): ('serial' | 'hid')[] {
    if (isTauri()) return []
    return [
      ...(canUseWebSerial() ? ['serial' as const] : []),
      ...(canUseWebHid() ? ['hid' as const] : []),
    ]
  }

  async disconnect(): Promise<void> {
    this.#connectedId = null
    this.#connectedKind = null
    await keyboardStore.disconnect()
  }
}

export const deviceStore = new DeviceStoreClass()
