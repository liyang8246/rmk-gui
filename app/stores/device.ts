import type { ConnectedDevice, Session, TransportInfo } from '../rynk'
import type { KeyboardError } from './keyboard/errors'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { connectSession, discover, requestHidDevice, requestSerialPort } from '../rynk'
import { toKeyboardError } from './keyboard/errors'

export type ConnectionPhase = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ConnectionState {
  phase: ConnectionPhase
  label: string
  cause?: KeyboardError
}

let session: Session | null = null

function isPickerCancel(error: KeyboardError): boolean {
  return error.type === 'unknown' && error.cause instanceof DOMException && error.cause.name === 'NotFoundError'
}

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<TransportInfo[]>([])
  const scanning = ref(false)
  const connecting = ref(false)
  const connection = ref<ConnectionState | null>(null)
  const connectedId = ref<string | null>(null)
  const connectedKind = ref<TransportInfo['kind'] | null>(null)

  function scan(): ResultAsync<void, KeyboardError> {
    scanning.value = true
    return ResultAsync.fromThrowable(discover, toKeyboardError)()
      .andTee((found) => { devices.value = found })
      .map(() => undefined)
      .andTee(() => { scanning.value = false })
      .orTee(() => { scanning.value = false })
  }

  function drop(): ResultAsync<void, KeyboardError> {
    const dying = session
    session = null
    connectedId.value = null
    connectedKind.value = null
    useKeyboardStore().detach()
    if (!dying) return okAsync<void, KeyboardError>(undefined)
    return ResultAsync.fromThrowable(() => dying.close(), toKeyboardError)()
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

  async function cleanup(info: TransportInfo, opened: ConnectedDevice | null, cause: KeyboardError): Promise<void> {
    useKeyboardStore().detach()
    const dying = session
    session = null
    connectedId.value = null
    connectedKind.value = null
    if (dying) await dying.close().catch(() => {})
    else if (opened) await opened.link.close().catch(() => {})
    connection.value = { phase: 'error', label: info.label, cause }
  }

  function failOpen(info: TransportInfo, opened: ConnectedDevice | null, cause: KeyboardError): ResultAsync<void, KeyboardError> {
    return ResultAsync.fromSafePromise(cleanup(info, opened, cause))
      .andThen(() => errAsync<void, KeyboardError>(cause))
  }

  function open(info: TransportInfo): ResultAsync<void, KeyboardError> {
    const keyboard = useKeyboardStore()
    connection.value = { phase: 'connecting', label: info.label }

    let opened: ConnectedDevice | null = null
    return ResultAsync.fromThrowable(async () => {
      opened = await info.connect()
      const next = await connectSession(opened.link, opened.label, handleDeath)
      session = next
      return next
    }, toKeyboardError)()
      .andThen(next => keyboard.attach(next).map(() => next))
      .andTee((next) => {
        const name = keyboard.device?.info.product_name.trim()
        const label = name === undefined || name === '' ? next.label : name
        connection.value = { phase: 'connected', label }
        connectedId.value = info.id
        connectedKind.value = info.kind
      })
      .map(() => undefined)
      .orElse(error => failOpen(info, opened, error))
  }

  function connect(info: TransportInfo): ResultAsync<void, KeyboardError> {
    if (connecting.value) return okAsync<void, KeyboardError>(undefined)
    connecting.value = true
    return (session ? drop() : okAsync<void, KeyboardError>(undefined))
      .andThen(() => open(info))
      .andTee(() => { connecting.value = false })
      .orTee(() => { connecting.value = false })
  }

  function pick(kind: 'serial' | 'hid'): ResultAsync<void, KeyboardError> {
    if (connecting.value) return okAsync<void, KeyboardError>(undefined)
    connecting.value = true
    return ResultAsync.fromThrowable(
      (): Promise<HIDDevice | SerialPort | null> => (kind === 'hid' ? requestHidDevice() : requestSerialPort()),
      toKeyboardError,
    )()
      .andThen((handle) => {
        if (!handle) return okAsync<void, KeyboardError>(undefined)
        return (session ? drop() : okAsync<void, KeyboardError>(undefined))
          .andThen(() => scan())
          .andThen(() => {
            const listed = devices.value.find(d => d.handle === handle)
            return listed ? open(listed) : okAsync<void, KeyboardError>(undefined)
          })
      })
      .andTee(() => { connecting.value = false })
      .orTee(() => { connecting.value = false })
      .orElse(error => (isPickerCancel(error) ? okAsync<void, KeyboardError>(undefined) : errAsync<void, KeyboardError>(error)))
  }

  function disconnect(): ResultAsync<void, KeyboardError> {
    const label = connection.value?.label ?? ''
    connection.value = { phase: 'disconnected', label }
    return drop()
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
