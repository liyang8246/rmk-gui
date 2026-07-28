import type { Result } from 'neverthrow'
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
import type { KeyboardConfig, KeyboardDevice, KeyboardStatus, KeyboardStore } from './types'
import { err, ResultAsync } from 'neverthrow'
import { defineStore } from 'pinia'
import { match, P } from 'ts-pattern'
import { ref } from 'vue'
import { connectClient } from '../../rynk'
import { toKeyboardError } from './errors'

const session = {
  client: null as RynkClient | null,
  // Held from initStore until resetStore; KeyboardSession owns client.free + link.close.
  connected: null as ConnectedDevice | null,
  // Serialize client calls: protocol allows one request in flight at a time.
  chain: Promise.resolve() as Promise<void>,
  // False until store is populated; topic loop drains without applying during init.
  topicsReady: false,
}

// Swallows individual failures so one Err does not short-circuit subsequent calls.
function enqueue<T>(
  fn: () => ResultAsync<T, KeyboardError>,
): ResultAsync<T, KeyboardError> {
  const result: Promise<Result<T, KeyboardError>> = session.chain
    .then(() => fn())
    .then(
      (r: Result<T, KeyboardError>) => r,
      (e: unknown) => err<T, KeyboardError>(toKeyboardError(e)),
    )
  session.chain = result.then(
    () => {},
    () => {},
  )
  return new ResultAsync(result)
}

// Optimistic update: push → call → undo (Err).
interface Mutation {
  push: () => void
  call: (c: RynkClient) => Promise<void>
  undo: () => void
}

function runMutation(m: Mutation): ResultAsync<void, KeyboardError> {
  const client = session.client
  if (!client) throw new Error('not connected')
  m.push()
  const wrapped = ResultAsync.fromThrowable(() => m.call(client), toKeyboardError)
  return enqueue(() => wrapped().orTee(m.undo))
}

async function fetchKeymap(client: RynkClient, caps: DeviceCapabilities): Promise<KeyAction[][][]> {
  const keymap: KeyAction[][][] = []
  for (let layer = 0; layer < caps.num_layers; layer++) {
    const { actions } = await client.get_keymap_bulk(layer, 0, 0)
    const rows: KeyAction[][] = []
    for (let r = 0; r < caps.num_rows; r++) {
      const row: KeyAction[] = []
      for (let c = 0; c < caps.num_cols; c++) {
        row.push(actions[r * caps.num_cols + c]!)
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
  const batteryStatus = caps.ble_enabled ? await client.get_battery_status() : 'Unavailable'
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

// Actions return ResultAsync (not instanceof Promise), so Pinia $onAction after/onError
// won't fire for async results. Error handling is via neverthrow .match()/.map() at call sites.
export const useKeyboardStore = defineStore('keyboard', () => {
  const connection = ref<KeyboardStore['connection']>(null)
  const device = ref<KeyboardStore['device']>(null)
  const config = ref<KeyboardStore['config']>(null)
  const status = ref<KeyboardStore['status']>(null)

  async function startTopicLoop(client: RynkClient): Promise<void> {
    try {
      while (session.client === client) {
        const event = await client.next_topic()
        if (session.client !== client) break
        if (!session.topicsReady) continue
        match(event)
          .with({ LayerChange: P.select() }, (x) => { status.value!.currentLayer = x })
          .with({ WpmUpdate: P.select() }, (x) => { status.value!.wpm = x })
          .with({ ConnectionChange: P.select() }, (x) => { status.value!.connectionStatus = x })
          .with({ SleepState: P.select() }, (x) => { status.value!.sleepState = x })
          .with({ LedIndicatorChange: P.select() }, (x) => { status.value!.ledIndicator = x })
          .with({ BatteryStatusChange: P.select() }, (x) => { status.value!.batteryStatus = x })
          .exhaustive()
      }
    } catch { } // link died
  }

  async function doInit(connected: ConnectedDevice): Promise<void> {
    session.connected = connected
    try {
      connection.value = { phase: 'connecting', label: connected.label }

      const { client } = await connectClient(connected.link)
      session.client = client
      void startTopicLoop(client)

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
      const newStatus = await fetchStatus(client, capabilities)

      const newConfig: KeyboardConfig = {
        behavior,
        combos,
        defaultLayer,
        encoders,
        forks,
        keymap,
        macros,
        morses,
      }
      const newDevice: KeyboardDevice = {
        capabilities,
        info,
        version,
        layout,
      }
      connection.value = { phase: 'connected', label: connected.label }
      device.value = newDevice
      config.value = newConfig
      status.value = newStatus
      session.chain = Promise.resolve()
      session.topicsReady = true
    } catch (e) {
      await resetStore()
      throw e
    }
  }

  function initStore(connected: ConnectedDevice): ResultAsync<void, KeyboardError> {
    return ResultAsync.fromThrowable(() => doInit(connected), toKeyboardError)()
  }

  async function resetStore(): Promise<void> {
    const connected = session.connected
    const client = session.client
    session.connected = null
    session.client = null
    session.chain = Promise.resolve()
    session.topicsReady = false
    connection.value = null
    device.value = null
    config.value = null
    status.value = null
    client?.free()
    await connected?.link?.close()
  }

  function setKey(
    layer: number,
    row: number,
    col: number,
    action: KeyAction,
  ): ResultAsync<void, KeyboardError> {
    const snapshot = config.value!.keymap[layer]![row]![col]!
    return runMutation({
      push: () => { config.value!.keymap[layer]![row]![col] = action },
      call: c => c.set_key(layer, row, col, action),
      undo: () => { if (config.value) config.value.keymap[layer]![row]![col] = snapshot },
    })
  }

  function setEncoder(
    encoderId: number,
    layer: number,
    action: EncoderAction,
  ): ResultAsync<void, KeyboardError> {
    const snapshot = config.value!.encoders[encoderId]![layer]!
    return runMutation({
      push: () => { config.value!.encoders[encoderId]![layer] = action },
      call: c => c.set_encoder(encoderId, layer, action),
      undo: () => { if (config.value) config.value.encoders[encoderId]![layer] = snapshot },
    })
  }

  function setCombo(index: number, combo: Combo): ResultAsync<void, KeyboardError> {
    const snapshot = config.value!.combos[index]!
    return runMutation({
      push: () => { config.value!.combos[index] = combo },
      call: c => c.set_combo(index, combo),
      undo: () => { if (config.value) config.value.combos[index] = snapshot },
    })
  }

  function setMorse(index: number, morse: Morse): ResultAsync<void, KeyboardError> {
    const snapshot = config.value!.morses[index]!
    return runMutation({
      push: () => { config.value!.morses[index] = morse },
      call: c => c.set_morse(index, morse),
      undo: () => { if (config.value) config.value.morses[index] = snapshot },
    })
  }

  function setFork(index: number, fork: Fork): ResultAsync<void, KeyboardError> {
    const snapshot = config.value!.forks[index]!
    return runMutation({
      push: () => { config.value!.forks[index] = fork },
      call: c => c.set_fork(index, fork),
      undo: () => { if (config.value) config.value.forks[index] = snapshot },
    })
  }

  function setMacro(offset: number, data: MacroData): ResultAsync<void, KeyboardError> {
    const bytes = data.data
    const snapshot = bytes.map((_, i) => config.value!.macros[offset + i]!)
    return runMutation({
      push: () => {
        bytes.forEach((b, i) => {
          config.value!.macros[offset + i] = b
        })
      },
      call: c => c.set_macro(offset, data),
      undo: () => {
        if (!config.value) return
        snapshot.forEach((old, i) => {
          config.value!.macros[offset + i] = old
        })
      },
    })
  }

  function setBehavior(behavior: BehaviorConfig): ResultAsync<void, KeyboardError> {
    const snapshot = config.value!.behavior
    return runMutation({
      push: () => { config.value!.behavior = behavior },
      call: c => c.set_behavior(behavior),
      undo: () => { if (config.value) config.value.behavior = snapshot },
    })
  }

  function setDefaultLayer(layer: number): ResultAsync<void, KeyboardError> {
    const snapshot = config.value!.defaultLayer
    return runMutation({
      push: () => { config.value!.defaultLayer = layer },
      call: c => c.set_default_layer(layer),
      undo: () => { if (config.value) config.value.defaultLayer = snapshot },
    })
  }

  return {
    connection,
    device,
    config,
    status,
    initStore,
    resetStore,
    setKey,
    setEncoder,
    setCombo,
    setMorse,
    setFork,
    setMacro,
    setBehavior,
    setDefaultLayer,
  }
})
