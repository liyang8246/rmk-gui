import type { ConnectedDevice, Session, TransportInfo } from '../rynk'
import type { KeyboardError } from './keyboard/errors'
import { connectSession, discover, requestHidDevice, requestSerialPort } from '../rynk'
import { toKeyboardError } from './keyboard/errors'

export type ConnectionPhase = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ConnectionState {
  phase: ConnectionPhase
  label: string
  cause?: KeyboardError
}

let session: Session | null = null

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<TransportInfo[]>([])
  const scanning = ref(false)
  const connecting = ref(false)
  const connection = ref<ConnectionState | null>(null)
  const connectedId = ref<string | null>(null)
  const connectedKind = ref<TransportInfo['kind'] | null>(null)

  async function scan(): Promise<void> {
    scanning.value = true
    try {
      devices.value = await discover()
    } finally {
      scanning.value = false
    }
  }

  async function drop(): Promise<void> {
    const dying = session
    session = null
    connectedId.value = null
    connectedKind.value = null
    useKeyboardStore().detach()
    await dying?.close()
  }

  function handleDeath(cause: unknown): void {
    if (!session) return
    session = null
    connectedId.value = null
    connectedKind.value = null
    useKeyboardStore().detach()
    connection.value = {
      phase: 'error',
      label: connection.value?.label ?? '',
      cause: toKeyboardError(cause),
    }
  }

  async function open(info: TransportInfo): Promise<void> {
    const keyboard = useKeyboardStore()
    connection.value = { phase: 'connecting', label: info.label }

    let opened: ConnectedDevice | null = null
    let cause: KeyboardError | null = null
    try {
      opened = await info.connect()
      const next = await connectSession(opened.link, opened.label, handleDeath)
      session = next

      const attached = await keyboard.attach(next)
      if (attached.isErr()) {
        cause = attached.error
      } else {
        const label = keyboard.device?.info.product_name.trim() || next.label
        connection.value = { phase: 'connected', label }
        connectedId.value = info.id
        connectedKind.value = info.kind
        return
      }
    } catch (e) {
      cause = toKeyboardError(e)
    }

    keyboard.detach()
    const dying = session
    session = null
    connectedId.value = null
    connectedKind.value = null
    if (dying) {
      await dying.close().catch(() => {})
    } else if (opened) {
      await opened.link.close().catch(() => {})
    }
    connection.value = { phase: 'error', label: info.label, cause: cause! }
    throw cause
  }

  async function connect(info: TransportInfo): Promise<void> {
    if (connecting.value) return
    connecting.value = true
    try {
      if (session) await drop()
      await open(info)
    } finally {
      connecting.value = false
    }
  }

  async function pick(kind: 'serial' | 'hid'): Promise<void> {
    if (connecting.value) return
    connecting.value = true
    try {
      const handle = kind === 'hid' ? await requestHidDevice() : await requestSerialPort()
      if (session) await drop()
      await scan()
      const listed = devices.value.find(d => d.handle === handle)
      if (listed) await open(listed)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'NotFoundError')) throw e
    } finally {
      connecting.value = false
    }
  }

  async function disconnect(): Promise<void> {
    const label = connection.value?.label ?? ''
    const dying = session
    session = null
    connectedId.value = null
    connectedKind.value = null
    useKeyboardStore().detach()
    connection.value = { phase: 'disconnected', label }
    await dying?.close()
  }

  return {
    connect,
    connectedId,
    connectedKind,
    connection,
    connecting,
    devices,
    disconnect,
    pick,
    scan,
  }
})
