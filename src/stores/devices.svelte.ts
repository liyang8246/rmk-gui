import type { ConnectedDevice, TransportInfo } from '../rynk'
import type { KeyboardError } from './keyboard'
import { isTauri } from '@tauri-apps/api/core'
import { toast } from '../lib/toast.svelte'
import { canUseWebHid, canUseWebUsb, closeAllSessions, discover, requestHidDevice, requestUsbDevice, withDeadline } from '../rynk'
import { explainKeyboardError, keyboardStore, toKeyboardError } from './keyboard'

/// Set by an explicit disconnect: a reload must land on the connect screen,
/// not silently re-adopt the keyboard the user just left. Any deliberate
/// connect clears it.
const STAY_DISCONNECTED_KEY = 'rmk-stay-disconnected'

/// Opening can park forever, not just fail — a wedged device, a BLE link that
/// never completes. Generous enough for a slow radio, but bounded, so the
/// store always gets its `connecting` state back.
const OPEN_TIMEOUT_MS = 15_000

async function connectWithDeadline(info: TransportInfo): Promise<ConnectedDevice> {
  const opening = info.connect()
  try {
    return await withDeadline(opening, OPEN_TIMEOUT_MS, 'connect timed out')
  }
  catch (e) {
    // An open that succeeds after the deadline would hold the port and block
    // every later attempt; close it whenever it finally lands.
    void opening.then(d => d.link.close()).catch(() => {})
    throw e
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
      // Marks are per-row; a row that vanished takes its mark with it.
      this.#failed = this.#failed.filter(id => this.#devices.some(d => d.id === id))
    }
    catch (e) {
      this.fail(toKeyboardError(e))
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
    }
    catch (e) {
      this.fail(toKeyboardError(e), info.id)
    }
  }

  /// `id` is the row to mark failed; picker- and scan-level faults have no
  /// row. `#connectedId`/`#connectedKind` are left alone — their getters gate
  /// on the connected phase, which a failure has already ended.
  private fail(error: KeyboardError, id?: string) {
    const help = explainKeyboardError(error)
    toast.error(help.title, help.hint)
    if (id !== undefined) this.#failed.push(id)
  }

  hasFailed(id: string): boolean {
    return this.#failed.includes(id)
  }

  /// Browser path: the picker the browser opens *is* the device list, and it
  /// needs the click that called this to still be the active user gesture.
  /// `hid` reaches a Bluetooth keyboard the OS already bonded; Web Bluetooth
  /// would demand a second pairing and cannot see an established one.
  async pick(kind: 'usb' | 'hid'): Promise<void> {
    if (this.#connecting) return
    localStorage.removeItem(STAY_DISCONNECTED_KEY)
    this.#connecting = `web-${kind}`
    try {
      // The picker only grants access; the grant then joins the same list every
      // other device comes from, so one device never has two identities.
      const handle = kind === 'hid' ? await requestHidDevice() : await requestUsbDevice()
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

  get browserTransports(): ('usb' | 'hid')[] {
    if (isTauri()) return []
    return [
      ...(canUseWebUsb() ? ['usb' as const] : []),
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
