import type { TransportInfo } from '../rynk'
import { canDiscover, closeAllSessions, connectWebSerial, discover } from '../rynk'
import { describeKeyboardError, keyboardStore } from './keyboard'

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

class DeviceStoreClass {
  #devices = $state<TransportInfo[]>([])
  #scanning = $state(false)
  /// Transport id being connected, so only that row shows a spinner.
  #connecting = $state<string | null>(null)
  #connectedId = $state<string | null>(null)
  #error = $state<string | null>(null)
  #booted = false

  get devices() { return this.#devices }
  get scanning() { return this.#scanning }
  get connecting() { return this.#connecting }
  get error() { return this.#error }

  /// Only meaningful while the session is live: the keyboard store owns the
  /// connection, and it can drop the link without telling us which id died.
  get connectedId() {
    return keyboardStore.connection?.phase === 'connected' ? this.#connectedId : null
  }

  async scan(): Promise<void> {
    if (!canDiscover()) return
    this.#scanning = true
    try {
      this.#devices = await discover()
    }
    catch (e) {
      this.#error = describe(e)
    }
    finally {
      this.#scanning = false
    }
  }

  /// Startup: drop sessions a reloaded frontend left holding the port, list what
  /// is attached, and connect when there is exactly one candidate.
  async boot(): Promise<void> {
    if (this.#booted || !canDiscover()) return
    this.#booted = true
    await closeAllSessions().catch(() => {})
    await this.scan()
    const only = this.#devices.length === 1 ? this.#devices[0] : undefined
    if (only && !keyboardStore.connection) await this.connect(only)
  }

  async connect(info: TransportInfo): Promise<void> {
    if (this.#connecting) return
    this.#connecting = info.id
    this.#error = null
    try {
      if (keyboardStore.connection) await keyboardStore.resetStore()
      const result = await keyboardStore.initStore(await info.connect())
      if (result.isErr()) {
        this.#error = describeKeyboardError(result.error)
        this.#connectedId = null
        return
      }
      this.#connectedId = info.id
    }
    catch (e) {
      this.#error = describe(e)
      this.#connectedId = null
    }
    finally {
      this.#connecting = null
    }
  }

  /// Browser path: the port picker is the device list, and it needs the click
  /// that called this to still be the active user gesture.
  async connectWebSerial(): Promise<void> {
    if (this.#connecting) return
    this.#connecting = 'web-serial'
    this.#error = null
    try {
      if (keyboardStore.connection) await keyboardStore.resetStore()
      const result = await keyboardStore.initStore(await connectWebSerial())
      if (result.isErr()) this.#error = describeKeyboardError(result.error)
      else this.#connectedId = 'web-serial'
    }
    catch (e) {
      // NotFoundError is the user dismissing the picker, not a failure.
      if (!(e instanceof DOMException && e.name === 'NotFoundError')) this.#error = describe(e)
    }
    finally {
      this.#connecting = null
    }
  }

  async disconnect(): Promise<void> {
    this.#connectedId = null
    this.#error = null
    await keyboardStore.disconnect()
  }
}

export const deviceStore = new DeviceStoreClass()
