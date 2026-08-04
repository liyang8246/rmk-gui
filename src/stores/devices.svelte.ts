import type { ConnectedDevice, TransportInfo } from '../rynk'
import type { KeyboardError } from './keyboard'
import { isTauri } from '@tauri-apps/api/core'
import { rememberDeviceName } from '../lib/device-names'
import { toast } from '../lib/toast.svelte'
import { canUseWebHid, canUseWebSerial, closeAllSessions, discover, requestHidDevice, requestSerialPort } from '../rynk'
import { explainKeyboardError, keyboardStore, toKeyboardError } from './keyboard'

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/// Set by an explicit disconnect: a reload must land on the connect screen,
/// not silently re-adopt the keyboard the user just left. Any deliberate
/// connect clears it.
const STAY_DISCONNECTED_KEY = 'rmk-stay-disconnected'

/// Opening can park forever, not just fail: WebHID open/sendReport never
/// settles on some devices that match the usage filter without being RMK
/// keyboards. Generous enough for a slow BLE link, but bounded, so the store
/// always gets its `connecting` state back. Named TransportError so the error
/// mapping reads it as the link's fault, not the app's.
const OPEN_TIMEOUT_MS = 15_000

async function connectWithDeadline(info: TransportInfo): Promise<ConnectedDevice> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const opening = info.connect()
  try {
    return await Promise.race([
      opening,
      new Promise<never>((_res, rej) => {
        timer = setTimeout(() => {
          const e = new Error('connect timed out')
          e.name = 'TransportError'
          rej(e)
        }, OPEN_TIMEOUT_MS)
      }),
    ])
  }
  catch (e) {
    // An open that succeeds after the deadline would hold the port and block
    // every later attempt; close it whenever it finally lands.
    opening.then(d => void d.link.close().catch(() => {})).catch(() => {})
    throw e
  }
  finally {
    clearTimeout(timer)
  }
}

class DeviceStoreClass {
  #devices = $state<TransportInfo[]>([])
  #scanning = $state(false)
  /// Transport id being connected, so only that row shows a spinner.
  #connecting = $state<string | null>(null)
  /// Rows whose last connect attempt failed: falling back to 'ready' would be
  /// a lie about a keyboard that just proved otherwise. A new attempt on the
  /// same row clears its mark.
  #failed = $state<string[]>([])
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
    catch (e) {
      toast.error(describe(e))
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
    if (localStorage.getItem(STAY_DISCONNECTED_KEY) !== null) return
    const only = this.#devices.length === 1 ? this.#devices[0] : undefined
    if (only && !keyboardStore.connection) await this.connect(only)
  }

  async connect(info: TransportInfo): Promise<void> {
    if (this.#connecting) return
    localStorage.removeItem(STAY_DISCONNECTED_KEY)
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
    this.#failed = this.#failed.filter(id => id !== info.id)
    try {
      const result = await keyboardStore.initStore(await connectWithDeadline(info))
      if (result.isErr()) {
        this.fail(result.error, info.id)
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
      this.fail(toKeyboardError(e), info.id)
    }
  }

  /// `id` is the row to mark failed; picker-level faults have no row.
  private fail(error: KeyboardError, id?: string) {
    const help = explainKeyboardError(error)
    toast.error(help.title, help.hint)
    if (id !== undefined) this.#failed.push(id)
    this.#connectedId = null
    this.#connectedKind = null
  }

  hasFailed(id: string): boolean {
    return this.#failed.includes(id)
  }

  /// Browser path: the picker the browser opens *is* the device list, and it
  /// needs the click that called this to still be the active user gesture.
  /// `hid` reaches a Bluetooth keyboard the OS already bonded; Web Bluetooth
  /// would demand a second pairing and cannot see an established one.
  async pick(kind: 'serial' | 'hid'): Promise<void> {
    if (this.#connecting) return
    localStorage.removeItem(STAY_DISCONNECTED_KEY)
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
      if (!(e instanceof DOMException && e.name === 'NotFoundError')) {
        this.fail(toKeyboardError(e))
      }
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
    localStorage.setItem(STAY_DISCONNECTED_KEY, '1')
    this.#connectedId = null
    this.#connectedKind = null
    await keyboardStore.disconnect()
  }
}

export const deviceStore = new DeviceStoreClass()
