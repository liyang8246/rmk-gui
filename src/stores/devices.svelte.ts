import type { TransportInfo } from '../rynk'
import { isTauri } from '@tauri-apps/api/core'
import { rememberDeviceName } from '../lib/device-names'
import { canUseWebHid, canUseWebSerial, closeAllSessions, discover, requestHidDevice, requestSerialPort } from '../rynk'
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
  #connectedKind = $state<TransportInfo['kind'] | null>(null)
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
    this.#error = null
    try {
      const result = await keyboardStore.initStore(await info.connect())
      if (result.isErr()) {
        this.#error = describeKeyboardError(result.error)
        this.#connectedId = null
        this.#connectedKind = null
        return
      }
      this.#connectedId = info.id
      this.#connectedKind = info.kind
      // The keyboard is the only source of its own name in a browser, so learn
      // it here — Web Serial will not report it on the next launch.
      const identity = keyboardStore.device?.info
      if (identity) {
        rememberDeviceName(identity.vendor_id, identity.product_id, identity.product_name)
      }
    }
    catch (e) {
      this.#error = describe(e)
      this.#connectedId = null
      this.#connectedKind = null
    }
  }

  /// Browser path: the picker the browser opens *is* the device list, and it
  /// needs the click that called this to still be the active user gesture.
  /// `hid` reaches a Bluetooth keyboard the OS already bonded; Web Bluetooth
  /// would demand a second pairing and cannot see an established one.
  async pick(kind: 'serial' | 'hid'): Promise<void> {
    if (this.#connecting) return
    this.#connecting = `web-${kind}`
    this.#error = null
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
      if (!(e instanceof DOMException && e.name === 'NotFoundError')) this.#error = describe(e)
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
    this.#error = null
    await keyboardStore.disconnect()
  }
}

export const deviceStore = new DeviceStoreClass()
