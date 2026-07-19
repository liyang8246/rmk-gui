import type {
  BehaviorConfig,
  Combo,
  ConnectedDevice,
  DeviceCapabilities,
  EncoderAction,
  Fork,
  KeyAction,
  MacroData,
  Morse,
  PeripheralStatus,
  RynkClient,
} from '../../rynk'
import type { KeyboardError } from './errors'
import type { KeyboardConfig, KeyboardDevice, KeyboardStatus } from './types'
import { ResultAsync } from 'neverthrow'
import { produce } from 'solid-js/store'
import { match, P } from 'ts-pattern'
import { connectClient } from '../../rynk'
import { toKeyboardError } from './errors'
import { session, setStore, store } from './store'
import { runMutation } from './utils'

export function initStore(connected: ConnectedDevice): ResultAsync<void, KeyboardError> {
  return ResultAsync.fromThrowable(() => doInit(connected), toKeyboardError)()
}

export async function resetStore(): Promise<void> {
  const connected = session.connected
  const client = session.client
  session.connected = null
  session.client = null
  session.chain = Promise.resolve()
  setStore({
    connection: null,
    device: null,
    config: null,
    status: null,
  })
  client?.free()
  await connected?.link?.close()
}

async function doInit(connected: ConnectedDevice): Promise<void> {
  session.connected = connected
  try {
    setStore('connection', { phase: 'connecting', label: connected.label })

    const { client } = await connectClient(connected.link)
    session.client = client

    const version = await client.get_version()
    const info = await client.get_device_info()
    const capabilities = await client.get_capabilities()
    const layout = await client.get_layout()
    const behavior = await client.get_behavior()
    const defaultLayer = await client.get_default_layer()
    const keymap = await fetchKeymap(client, capabilities)
    const encoders = await fetchEncoders(client, capabilities)
    const combos = (await client.get_combo_bulk(0)).configs
    const morses = (await client.get_morse_bulk(0)).configs
    const forks = await fetchForks(client, capabilities)
    const macros = await fetchMacros(client, capabilities)
    const status = await fetchStatus(client, capabilities)

    const config: KeyboardConfig = {
      behavior,
      combos,
      defaultLayer,
      encoders,
      forks,
      keymap,
      macros,
      morses,
    }
    const device: KeyboardDevice = {
      capabilities,
      info,
      version,
      layout,
    }
    setStore({
      connection: { phase: 'connected', label: connected.label },
      device,
      config,
      status,
    })
    session.chain = Promise.resolve()
    void startTopicLoop(client)
  } catch (e) {
    await resetStore()
    throw e
  }
}

async function startTopicLoop(client: RynkClient): Promise<void> {
  try {
    while (session.client === client) {
      const event = await client.next_topic()
      if (session.client !== client) break
      match(event)
        .with({ LayerChange: P.select() }, x => setStore('status', 'currentLayer', x))
        .with({ WpmUpdate: P.select() }, x => setStore('status', 'wpm', x))
        .with({ ConnectionChange: P.select() }, x => setStore('status', 'connectionStatus', x))
        .with({ SleepState: P.select() }, x => setStore('status', 'sleepState', x))
        .with({ LedIndicatorChange: P.select() }, x => setStore('status', 'ledIndicator', x))
        .with({ BatteryStatusChange: P.select() }, x => setStore('status', 'batteryStatus', x))
        .exhaustive()
    }
  } catch { } // link died
}

async function fetchKeymap(client: RynkClient, caps: DeviceCapabilities): Promise<KeyAction[][][]> {
  const keymap: KeyAction[][][] = []
  for (let layer = 0; layer < caps.num_layers; layer++) {
    const { actions } = await client.get_keymap_bulk(layer, 0, 0)
    const rows: KeyAction[][] = []
    for (let r = 0; r < caps.num_rows; r++) {
      const row: KeyAction[] = []
      for (let c = 0; c < caps.num_cols; c++) {
        row.push(actions[r * caps.num_cols + c])
      }
      rows.push(row)
    }
    keymap.push(rows)
  }
  return keymap
}

// TODO: switch to bulk fetch — num_encoders×num_layers round trips is slow on large keyboards.
async function fetchEncoders(client: RynkClient, caps: DeviceCapabilities): Promise<EncoderAction[][]> {
  const encoders: EncoderAction[][] = []
  for (let e = 0; e < caps.num_encoders; e++) {
    const layers: EncoderAction[] = []
    for (let l = 0; l < caps.num_layers; l++) {
      layers.push(await client.get_encoder(e, l))
    }
    encoders.push(layers)
  }
  return encoders
}

// TODO: switch to bulk fetch — max_forks round trips is slow on large keyboards.
async function fetchForks(client: RynkClient, caps: DeviceCapabilities): Promise<Fork[]> {
  const forks: Fork[] = []
  for (let i = 0; i < caps.max_forks; i++) {
    forks.push(await client.get_fork(i))
  }
  return forks
}

async function fetchMacros(client: RynkClient, caps: DeviceCapabilities): Promise<number[]> {
  if (caps.macro_space_size === 0) return []
  // TODO: verify get_macro(offset) chunking — may return less than macro_space_size per call.
  const { data } = await client.get_macro(0)
  return data
}

// Serial awaits: protocol allows one request in flight at a time.
async function fetchStatus(client: RynkClient, caps: DeviceCapabilities): Promise<KeyboardStatus> {
  const batteryStatus = await client.get_battery_status()
  const connectionStatus = await client.get_connection_status()
  const currentLayer = await client.get_current_layer()
  const ledIndicator = await client.get_led_indicator()
  const lockStatus = await client.get_lock_status()
  const matrixState = await client.get_matrix_state()
  const sleepState = await client.get_sleep_state()
  const wpm = await client.get_wpm()
  const peripheralStatus: PeripheralStatus[] = []
  for (let i = 0; i < caps.num_split_peripherals; i++) {
    peripheralStatus.push(await client.get_peripheral_status(i))
  }
  return {
    batteryStatus,
    connectionStatus,
    currentLayer,
    ledIndicator,
    lockStatus,
    matrixState,
    peripheralStatus,
    sleepState,
    wpm,
  }
}

export function setKey(
  layer: number,
  row: number,
  col: number,
  action: KeyAction,
): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.keymap[layer][row][col]
  return runMutation({
    push: () => setStore('config', 'keymap', layer, row, col, action),
    call: c => c.set_key(layer, row, col, action),
    undo: () => { if (store.config) setStore('config', 'keymap', layer, row, col, snapshot) },
  })
}

export function setEncoder(
  encoderId: number,
  layer: number,
  action: EncoderAction,
): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.encoders[encoderId][layer]
  return runMutation({
    push: () => setStore('config', 'encoders', encoderId, layer, action),
    call: c => c.set_encoder(encoderId, layer, action),
    undo: () => { if (store.config) setStore('config', 'encoders', encoderId, layer, snapshot) },
  })
}

export function setCombo(index: number, config: Combo): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.combos[index]
  return runMutation({
    push: () => setStore('config', 'combos', index, config),
    call: c => c.set_combo(index, config),
    undo: () => { if (store.config) setStore('config', 'combos', index, snapshot) },
  })
}

export function setMorse(index: number, config: Morse): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.morses[index]
  return runMutation({
    push: () => setStore('config', 'morses', index, config),
    call: c => c.set_morse(index, config),
    undo: () => { if (store.config) setStore('config', 'morses', index, snapshot) },
  })
}

export function setFork(index: number, config: Fork): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.forks[index]
  return runMutation({
    push: () => setStore('config', 'forks', index, config),
    call: c => c.set_fork(index, config),
    undo: () => { if (store.config) setStore('config', 'forks', index, snapshot) },
  })
}

export function setMacro(offset: number, data: MacroData): ResultAsync<void, KeyboardError> {
  const bytes = data.data
  const snapshot = bytes.map((_, i) => store.config!.macros[offset + i])
  return runMutation({
    push: () => setStore('config', 'macros', produce((draft) => {
      bytes.forEach((b, i) => {
        draft[offset + i] = b
      })
    })),
    call: c => c.set_macro(offset, data),
    undo: () => {
      if (!store.config) return
      setStore('config', 'macros', produce((draft) => {
        snapshot.forEach((old, i) => {
          draft[offset + i] = old
        })
      }))
    },
  })
}

export function setBehavior(config: BehaviorConfig): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.behavior
  return runMutation({
    push: () => setStore('config', 'behavior', config),
    call: c => c.set_behavior(config),
    undo: () => { if (store.config) setStore('config', 'behavior', snapshot) },
  })
}

export function setDefaultLayer(layer: number): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.defaultLayer
  return runMutation({
    push: () => setStore('config', 'defaultLayer', layer),
    call: c => c.set_default_layer(layer),
    undo: () => { if (store.config) setStore('config', 'defaultLayer', snapshot) },
  })
}
