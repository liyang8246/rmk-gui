import type { Result } from 'neverthrow'
import type {
  BehaviorConfig,
  BleStatus,
  Combo,
  DeviceCapabilities,
  EncoderAction,
  Fork,
  KeyAction,
  LockStatus,
  MacroData,
  MatrixState,
  Morse,
  PeripheralStatus,
  RynkClient,
  Session,
  StorageResetMode,
  TopicEvent,
} from '../rynk'
import type { KeyboardError } from './keyboard/errors'
import type { KeyboardConfig, KeyboardDevice, KeyboardStatus } from './keyboard/types'
import { err, errAsync, ResultAsync } from 'neverthrow'
import { match, P } from 'ts-pattern'
import { toKeyboardError } from './keyboard/errors'

let client: RynkClient | null = null
let chain: Promise<void> = Promise.resolve()
let topicsReady = false
let unsubscribe: (() => void) | null = null

function notConnected<T>(): ResultAsync<T, KeyboardError> {
  return errAsync<T, KeyboardError>({ type: 'invalid', cause: 'not connected' })
}

function invalid(cause: string): ResultAsync<void, KeyboardError> {
  return errAsync<void, KeyboardError>({ type: 'invalid', cause })
}

function enqueue<T>(fn: () => ResultAsync<T, KeyboardError>): ResultAsync<T, KeyboardError> {
  const result: Promise<Result<T, KeyboardError>> = chain
    .then(() => fn())
    .then(
      (r: Result<T, KeyboardError>) => r,
      (e: unknown) => err<T, KeyboardError>(toKeyboardError(e)),
    )
  chain = result.then(
    () => {},
    () => {},
  )
  return new ResultAsync(result)
}

function runCommand<T>(call: (c: RynkClient) => Promise<T>): ResultAsync<T, KeyboardError> {
  return enqueue(() => {
    const c = client
    if (!c) return notConnected<T>()
    return ResultAsync.fromThrowable(() => call(c), toKeyboardError)()
  })
}

interface Mutation<T> {
  push: () => T
  call: (c: RynkClient) => Promise<void>
  undo: (snapshot: T) => void
}

function runMutation<T>(m: Mutation<T>): ResultAsync<void, KeyboardError> {
  return enqueue(() => {
    const c = client
    if (!c) return notConnected<void>()
    const snapshot = m.push()
    return ResultAsync.fromThrowable(() => m.call(c), toKeyboardError)()
      .orTee(() => m.undo(snapshot))
  })
}

async function fetchKeymap(c: RynkClient, caps: DeviceCapabilities): Promise<KeyAction[][][]> {
  const keymap: KeyAction[][][] = []
  const flat = await c.read_all_keymap()
  const expected = caps.num_layers * caps.num_rows * caps.num_cols
  if (flat.length !== expected)
    throw new Error(`keymap: got ${flat.length} actions, expected ${expected}`)
  for (let layer = 0; layer < caps.num_layers; layer++) {
    const rows: KeyAction[][] = []
    for (let r = 0; r < caps.num_rows; r++) {
      const start = (layer * caps.num_rows + r) * caps.num_cols
      rows.push(flat.slice(start, start + caps.num_cols))
    }
    keymap.push(rows)
  }
  return keymap
}

async function fetchEncoders(c: RynkClient, caps: DeviceCapabilities): Promise<EncoderAction[][]> {
  const encoders: EncoderAction[][] = []
  for (let e = 0; e < caps.num_encoders; e++) {
    const layers: EncoderAction[] = []
    for (let l = 0; l < caps.num_layers; l++) {
      layers.push(await c.get_encoder(e, l))
    }
    encoders.push(layers)
  }
  return encoders
}

async function fetchForks(c: RynkClient, caps: DeviceCapabilities): Promise<Fork[]> {
  const forks: Fork[] = []
  for (let i = 0; i < caps.max_forks; i++) {
    forks.push(await c.get_fork(i))
  }
  return forks
}

async function fetchMacros(c: RynkClient, caps: DeviceCapabilities): Promise<number[]> {
  const out: number[] = []
  while (out.length < caps.macro_space_size) {
    const { data } = await c.get_macro(out.length)
    if (!data.length) break
    out.push(...data)
  }
  return out.slice(0, caps.macro_space_size)
}

async function fetchConfig(c: RynkClient, caps: DeviceCapabilities): Promise<KeyboardConfig> {
  const behavior = await c.get_behavior()
  const defaultLayer = await c.get_default_layer()
  const keymap = await fetchKeymap(c, caps)
  const encoders = await fetchEncoders(c, caps)
  const combos = await c.read_all_combos()
  const morses = await c.read_all_morses()
  const forks = await fetchForks(c, caps)
  const macros = await fetchMacros(c, caps)
  return { behavior, combos, defaultLayer, encoders, forks, keymap, macros, morses }
}

async function fetchStatus(c: RynkClient, caps: DeviceCapabilities): Promise<KeyboardStatus> {
  const lockStatus = await c.get_lock_status()
  const batteryStatus = caps.ble_enabled ? await c.get_battery_status() : 'Unavailable'
  const bleStatus = caps.ble_enabled ? await c.get_ble_status() : null
  const connectionStatus = await c.get_connection_status()
  const connectionType = await c.get_connection_type()
  const currentLayer = await c.get_current_layer()
  const ledIndicator = await c.get_led_indicator()
  const matrixState = lockStatus.locked ? null : await c.get_matrix_state()
  const sleepState = await c.get_sleep_state()
  const wpm = await c.get_wpm()
  const peripheralStatus: PeripheralStatus[] = []
  for (let i = 0; i < caps.num_split_peripherals; i++) {
    peripheralStatus.push(await c.get_peripheral_status(i))
  }
  return {
    batteryStatus,
    bleStatus,
    connectionStatus,
    connectionType,
    currentLayer,
    ledIndicator,
    lockStatus,
    matrixState,
    peripheralStatus,
    sleepState,
    wpm,
  }
}

export const useKeyboardStore = defineStore('keyboard', () => {
  const device = ref<KeyboardDevice | null>(null)
  const config = ref<KeyboardConfig | null>(null)
  const status = ref<KeyboardStatus | null>(null)
  const topicSeq = ref(0)
  const lastTopic = ref<TopicEvent | null>(null)

  function applyTopic(event: TopicEvent): void {
    const s = status.value
    if (!s) return
    match(event)
      .with({ LayerChange: P.select() }, (x) => { s.currentLayer = x })
      .with({ WpmUpdate: P.select() }, (x) => { s.wpm = x })
      .with({ ConnectionChange: P.select() }, (x) => { s.connectionStatus = x })
      .with({ SleepState: P.select() }, (x) => { s.sleepState = x })
      .with({ LedIndicatorChange: P.select() }, (x) => { s.ledIndicator = x })
      .with({ BatteryStatusChange: P.select() }, (x) => { s.batteryStatus = x })
      .exhaustive()
    lastTopic.value = event
    topicSeq.value++
  }

  function attach(session: Session): ResultAsync<void, KeyboardError> {
    return ResultAsync.fromThrowable(async () => {
      client = session.client
      chain = Promise.resolve()
      topicsReady = false
      unsubscribe = session.onTopic((event) => {
        if (topicsReady) applyTopic(event)
      })

      const capabilities = await session.client.get_capabilities()
      const info = await session.client.get_device_info()
      const layout = await session.client.get_layout()
      const nextConfig = await fetchConfig(session.client, capabilities)
      const nextStatus = await fetchStatus(session.client, capabilities)

      device.value = { capabilities, info, layout }
      config.value = nextConfig
      status.value = nextStatus
      topicsReady = true
    }, toKeyboardError)()
  }

  function detach(): void {
    unsubscribe?.()
    unsubscribe = null
    topicsReady = false
    client = null
    chain = Promise.resolve()
    device.value = null
    config.value = null
    status.value = null
  }

  function setKey(
    layer: number,
    row: number,
    col: number,
    action: KeyAction,
  ): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')
    const layerArr = config.value.keymap[layer]
    if (!layerArr) return invalid(`layer ${layer} out of range`)
    const rowArr = layerArr[row]
    if (!rowArr) return invalid(`row ${row} out of range`)
    if (col < 0 || col >= rowArr.length) return invalid(`col ${col} out of range`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.keymap[layer]![row]![col]!
        config.value!.keymap[layer]![row]![col] = action
        return snapshot
      },
      call: c => c.set_key(layer, row, col, action),
      undo: (snapshot) => { if (config.value) config.value.keymap[layer]![row]![col] = snapshot },
    })
  }

  function setKeymap(keymap: KeyAction[][][]): ResultAsync<void, KeyboardError> {
    const caps = device.value?.capabilities
    if (!config.value || !caps) return invalid('not connected')
    if (keymap.length !== caps.num_layers)
      return invalid(`keymap: ${keymap.length} layers, expected ${caps.num_layers}`)
    for (const [l, rows] of keymap.entries()) {
      if (rows.length !== caps.num_rows)
        return invalid(`keymap layer ${l}: ${rows.length} rows, expected ${caps.num_rows}`)
      for (const [r, row] of rows.entries()) {
        if (row.length !== caps.num_cols)
          return invalid(`keymap layer ${l} row ${r}: ${row.length} cols, expected ${caps.num_cols}`)
      }
    }
    const flat = keymap.flat().flat()

    return runMutation({
      push: () => {
        const snapshot = config.value!.keymap
        config.value!.keymap = keymap
        return snapshot
      },
      call: c => c.write_all_keymap(flat),
      undo: (snapshot) => { if (config.value) config.value.keymap = snapshot },
    })
  }

  function setCombos(combos: Combo[]): ResultAsync<void, KeyboardError> {
    const caps = device.value?.capabilities
    if (!config.value || !caps) return invalid('not connected')
    if (combos.length !== caps.max_combos)
      return invalid(`combos: ${combos.length}, expected ${caps.max_combos}`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.combos
        config.value!.combos = combos
        return snapshot
      },
      call: c => c.write_all_combos(combos),
      undo: (snapshot) => { if (config.value) config.value.combos = snapshot },
    })
  }

  function setMorses(morses: Morse[]): ResultAsync<void, KeyboardError> {
    const caps = device.value?.capabilities
    if (!config.value || !caps) return invalid('not connected')
    if (morses.length !== caps.max_morse)
      return invalid(`morses: ${morses.length}, expected ${caps.max_morse}`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.morses
        config.value!.morses = morses
        return snapshot
      },
      call: c => c.write_all_morses(morses),
      undo: (snapshot) => { if (config.value) config.value.morses = snapshot },
    })
  }

  function setEncoder(
    encoderId: number,
    layer: number,
    action: EncoderAction,
  ): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')
    const enc = config.value.encoders[encoderId]
    if (!enc) return invalid(`encoder ${encoderId} out of range`)
    if (layer < 0 || layer >= enc.length) return invalid(`layer ${layer} out of range`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.encoders[encoderId]![layer]!
        config.value!.encoders[encoderId]![layer] = action
        return snapshot
      },
      call: c => c.set_encoder(encoderId, layer, action),
      undo: (snapshot) => { if (config.value) config.value.encoders[encoderId]![layer] = snapshot },
    })
  }

  function setCombo(index: number, combo: Combo): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')
    if (index < 0 || index >= config.value.combos.length) return invalid(`combo ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.combos[index]!
        config.value!.combos[index] = combo
        return snapshot
      },
      call: c => c.set_combo(index, combo),
      undo: (snapshot) => { if (config.value) config.value.combos[index] = snapshot },
    })
  }

  function setMorse(index: number, morse: Morse): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')
    if (index < 0 || index >= config.value.morses.length) return invalid(`morse ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.morses[index]!
        config.value!.morses[index] = morse
        return snapshot
      },
      call: c => c.set_morse(index, morse),
      undo: (snapshot) => { if (config.value) config.value.morses[index] = snapshot },
    })
  }

  function setFork(index: number, fork: Fork): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')
    if (index < 0 || index >= config.value.forks.length) return invalid(`fork ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.forks[index]!
        config.value!.forks[index] = fork
        return snapshot
      },
      call: c => c.set_fork(index, fork),
      undo: (snapshot) => { if (config.value) config.value.forks[index] = snapshot },
    })
  }

  function setMacro(offset: number, data: MacroData): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')
    const bytes = data.data
    if (offset < 0 || offset + bytes.length > config.value.macros.length)
      return invalid(`macro offset ${offset}+${bytes.length} out of range`)

    return runMutation({
      push: () => {
        const snapshot = bytes.map((_, i) => config.value!.macros[offset + i]!)
        bytes.forEach((b, i) => {
          config.value!.macros[offset + i] = b
        })
        return snapshot
      },
      call: c => c.set_macro(offset, data),
      undo: (snapshot) => {
        if (!config.value) return
        snapshot.forEach((old, i) => {
          config.value!.macros[offset + i] = old
        })
      },
    })
  }

  function setMacroRegion(bytes: number[]): ResultAsync<void, KeyboardError> {
    const caps = device.value?.capabilities
    if (!config.value || !caps) return invalid('not connected')
    if (bytes.length !== caps.macro_space_size)
      return invalid(`macros: ${bytes.length} bytes, expected ${caps.macro_space_size}`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.macros
        config.value!.macros = bytes
        return snapshot
      },
      call: async (c) => {
        const chunk = Math.max(1, caps.macro_chunk_size)
        for (let offset = 0; offset < bytes.length; offset += chunk) {
          await c.set_macro(offset, { data: bytes.slice(offset, offset + chunk) })
        }
      },
      undo: (snapshot) => { if (config.value) config.value.macros = snapshot },
    })
  }

  function setBehavior(behavior: BehaviorConfig): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')

    return runMutation({
      push: () => {
        const snapshot = config.value!.behavior
        config.value!.behavior = behavior
        return snapshot
      },
      call: c => c.set_behavior(behavior),
      undo: (snapshot) => { if (config.value) config.value.behavior = snapshot },
    })
  }

  function setDefaultLayer(layer: number): ResultAsync<void, KeyboardError> {
    if (!config.value) return invalid('not connected')
    if (layer < 0 || layer >= config.value.keymap.length)
      return invalid(`default layer ${layer} out of range`)

    return runMutation({
      push: () => {
        const snapshot = config.value!.defaultLayer
        config.value!.defaultLayer = layer
        return snapshot
      },
      call: c => c.set_default_layer(layer),
      undo: (snapshot) => { if (config.value) config.value.defaultLayer = snapshot },
    })
  }

  function refreshStatus(): ResultAsync<void, KeyboardError> {
    const caps = device.value?.capabilities
    if (!caps) return notConnected<void>()
    return runCommand(async (c) => {
      status.value = await fetchStatus(c, caps)
    })
  }

  function refreshMatrix(): ResultAsync<MatrixState, KeyboardError> {
    return runCommand(c => c.get_matrix_state())
      .andTee((m) => { if (status.value) status.value.matrixState = m })
  }

  function refreshLockStatus(): ResultAsync<LockStatus, KeyboardError> {
    return runCommand(c => c.get_lock_status())
      .andTee((s) => { if (status.value) status.value.lockStatus = s })
  }

  function lock(): ResultAsync<void, KeyboardError> {
    return runCommand(async (c) => {
      await c.lock()
      const next = await c.get_lock_status()
      if (!status.value) return
      status.value.lockStatus = next
      status.value.matrixState = null
    })
  }

  function unlockPoll(): ResultAsync<LockStatus, KeyboardError> {
    return runCommand(async (c) => {
      const next = await c.unlock_poll()
      if (status.value) {
        status.value.lockStatus = next
        if (!next.locked && !status.value.matrixState)
          status.value.matrixState = await c.get_matrix_state()
      }
      return next
    })
  }

  function refreshBleStatus(): ResultAsync<BleStatus, KeyboardError> {
    return runCommand(c => c.get_ble_status())
      .andTee((s) => { if (status.value) status.value.bleStatus = s })
  }

  function switchBleProfile(slot: number): ResultAsync<void, KeyboardError> {
    return bleProfileCmd(slot, (c, s) => c.switch_ble_profile(s))
  }

  function clearBleProfile(slot: number): ResultAsync<void, KeyboardError> {
    return bleProfileCmd(slot, (c, s) => c.clear_ble_profile(s))
  }

  function bleProfileCmd(
    slot: number,
    call: (c: RynkClient, slot: number) => Promise<void>,
  ): ResultAsync<void, KeyboardError> {
    const caps = device.value?.capabilities
    if (!caps) return notConnected<void>()
    if (!caps.ble_enabled) return invalid('device has no BLE')
    if (slot < 0 || slot >= caps.num_ble_profiles) return invalid(`ble profile ${slot} out of range`)
    return runCommand(async (c) => {
      await call(c, slot)
      if (status.value) status.value.bleStatus = await c.get_ble_status()
    })
  }

  function reboot(): ResultAsync<void, KeyboardError> {
    return runCommand(c => c.reboot())
  }

  function bootloaderJump(): ResultAsync<void, KeyboardError> {
    return runCommand(c => c.bootloader_jump())
  }

  function storageReset(mode: StorageResetMode): ResultAsync<void, KeyboardError> {
    const caps = device.value?.capabilities
    if (!caps) return notConnected<void>()
    return runCommand(async (c) => {
      await c.storage_reset(mode)
      config.value = await fetchConfig(c, caps)
    })
  }

  return {
    attach,
    bootloaderJump,
    clearBleProfile,
    config,
    detach,
    device,
    lastTopic,
    lock,
    reboot,
    refreshBleStatus,
    refreshLockStatus,
    refreshMatrix,
    refreshStatus,
    setBehavior,
    setCombo,
    setCombos,
    setDefaultLayer,
    setEncoder,
    setFork,
    setKey,
    setKeymap,
    setMacro,
    setMacroRegion,
    setMorse,
    setMorses,
    status,
    storageReset,
    switchBleProfile,
    topicSeq,
    unlockPoll,
  }
})
