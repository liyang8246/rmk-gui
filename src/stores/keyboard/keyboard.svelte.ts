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
import type { ConnectionState, KeyboardConfig, KeyboardDevice, KeyboardStatus } from './types'
import { err, errAsync, ResultAsync } from 'neverthrow'
import { match, P } from 'ts-pattern'
import { connectClient } from '../../rynk'
import { toKeyboardError } from './errors'

const session = {
  client: null as RynkClient | null,
  connected: null as ConnectedDevice | null,
  chain: Promise.resolve() as Promise<void>,
  topicsReady: false,
}

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

interface Mutation<T> {
  push: () => T
  call: (c: RynkClient) => Promise<void>
  undo: (snapshot: T) => void
}

function runMutation<T>(m: Mutation<T>): ResultAsync<void, KeyboardError> {
  return enqueue(() => {
    const client = session.client
    if (!client) throw new Error('not connected')
    const snapshot = m.push()
    return ResultAsync.fromThrowable(() => m.call(client), toKeyboardError)()
      .orTee(() => m.undo(snapshot))
  })
}

async function fetchKeymap(client: RynkClient, caps: DeviceCapabilities): Promise<KeyAction[][][]> {
  const keymap: KeyAction[][][] = []
  // read_all_keymap pages the whole thing; a single get_keymap_bulk caps at
  // max_bulk_keys and silently drops the tail of a larger layer.
  const flat = await client.read_all_keymap()
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

async function fetchForks(client: RynkClient, caps: DeviceCapabilities): Promise<Fork[]> {
  const forks: Fork[] = []
  for (let i = 0; i < caps.max_forks; i++) {
    forks.push(await client.get_fork(i))
  }
  return forks
}

async function fetchMacros(client: RynkClient, caps: DeviceCapabilities): Promise<number[]> {
  // No upstream pager for macros: each chunk is exactly macro_chunk_size bytes,
  // zero-filled past the end, so walk the whole space by chunk.
  const out: number[] = []
  while (out.length < caps.macro_space_size) {
    const { data } = await client.get_macro(out.length)
    if (!data.length) break
    out.push(...data)
  }
  return out.slice(0, caps.macro_space_size)
}

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

function invalid(cause: string): ResultAsync<void, KeyboardError> {
  return errAsync<void, KeyboardError>({ type: 'invalid', cause })
}

class KeyboardStoreClass {
  #connection = $state<ConnectionState | null>(null)
  #device = $state<KeyboardDevice | null>(null)
  #config = $state<KeyboardConfig | null>(null)
  #status = $state<KeyboardStatus | null>(null)

  get connection() { return this.#connection }
  get device() { return this.#device }
  get config() { return this.#config }
  get status() { return this.#status }

  private async startTopicLoop(client: RynkClient): Promise<void> {
    try {
      while (session.client === client) {
        const event = await client.next_topic()
        if (session.client !== client) break
        if (!session.topicsReady) continue
        match(event)
          .with({ LayerChange: P.select() }, (x) => { this.#status!.currentLayer = x })
          .with({ WpmUpdate: P.select() }, (x) => { this.#status!.wpm = x })
          .with({ ConnectionChange: P.select() }, (x) => { this.#status!.connectionStatus = x })
          .with({ SleepState: P.select() }, (x) => { this.#status!.sleepState = x })
          .with({ LedIndicatorChange: P.select() }, (x) => { this.#status!.ledIndicator = x })
          .with({ BatteryStatusChange: P.select() }, (x) => { this.#status!.batteryStatus = x })
          .exhaustive()
      }
    } catch { }
  }

  private async doInit(connected: ConnectedDevice): Promise<void> {
    session.connected = connected
    try {
      this.#connection = { phase: 'connecting', label: connected.label }

      const { client } = await connectClient(connected.link)
      session.client = client
      void this.startTopicLoop(client)

      const version = await client.get_version()
      const info = await client.get_device_info()
      const capabilities = await client.get_capabilities()
      const layout = await client.get_layout()
      const behavior = await client.get_behavior()
      const defaultLayer = await client.get_default_layer()
      const keymap = await fetchKeymap(client, capabilities)
      const encoders = await fetchEncoders(client, capabilities)
      const combos = await client.read_all_combos()
      const morses = await client.read_all_morses()
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
      this.#connection = { phase: 'connected', label: connected.label }
      this.#device = newDevice
      this.#config = newConfig
      this.#status = newStatus
      session.chain = Promise.resolve()
      session.topicsReady = true
    } catch (e) {
      await this.resetStore()
      throw e
    }
  }

  initStore(connected: ConnectedDevice): ResultAsync<void, KeyboardError> {
    return ResultAsync.fromThrowable(() => this.doInit(connected), toKeyboardError)()
  }

  async resetStore(): Promise<void> {
    const connected = session.connected
    const client = session.client
    session.connected = null
    session.client = null
    session.chain = Promise.resolve()
    session.topicsReady = false
    this.#connection = null
    this.#device = null
    this.#config = null
    this.#status = null
    client?.free()
    await connected?.link?.close()
  }

  setKey(
    layer: number,
    row: number,
    col: number,
    action: KeyAction,
  ): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    const layerArr = this.#config.keymap[layer]
    if (!layerArr) return invalid(`layer ${layer} out of range`)
    const rowArr = layerArr[row]
    if (!rowArr) return invalid(`row ${row} out of range`)
    if (col < 0 || col >= rowArr.length) return invalid(`col ${col} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.keymap[layer]![row]![col]!
        this.#config!.keymap[layer]![row]![col] = action
        return snapshot
      },
      call: c => c.set_key(layer, row, col, action),
      undo: (snapshot) => { if (this.#config) this.#config.keymap[layer]![row]![col] = snapshot },
    })
  }

  setEncoder(
    encoderId: number,
    layer: number,
    action: EncoderAction,
  ): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    const enc = this.#config.encoders[encoderId]
    if (!enc) return invalid(`encoder ${encoderId} out of range`)
    if (layer < 0 || layer >= enc.length) return invalid(`layer ${layer} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.encoders[encoderId]![layer]!
        this.#config!.encoders[encoderId]![layer] = action
        return snapshot
      },
      call: c => c.set_encoder(encoderId, layer, action),
      undo: (snapshot) => { if (this.#config) this.#config.encoders[encoderId]![layer] = snapshot },
    })
  }

  setCombo(index: number, combo: Combo): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (index < 0 || index >= this.#config.combos.length) return invalid(`combo ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.combos[index]!
        this.#config!.combos[index] = combo
        return snapshot
      },
      call: c => c.set_combo(index, combo),
      undo: (snapshot) => { if (this.#config) this.#config.combos[index] = snapshot },
    })
  }

  setMorse(index: number, morse: Morse): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (index < 0 || index >= this.#config.morses.length) return invalid(`morse ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.morses[index]!
        this.#config!.morses[index] = morse
        return snapshot
      },
      call: c => c.set_morse(index, morse),
      undo: (snapshot) => { if (this.#config) this.#config.morses[index] = snapshot },
    })
  }

  setFork(index: number, fork: Fork): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (index < 0 || index >= this.#config.forks.length) return invalid(`fork ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.forks[index]!
        this.#config!.forks[index] = fork
        return snapshot
      },
      call: c => c.set_fork(index, fork),
      undo: (snapshot) => { if (this.#config) this.#config.forks[index] = snapshot },
    })
  }

  setMacro(offset: number, data: MacroData): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    const bytes = data.data
    if (offset < 0 || offset + bytes.length > this.#config.macros.length)
      return invalid(`macro offset ${offset}+${bytes.length} out of range`)

    return runMutation({
      push: () => {
        const snapshot = bytes.map((_, i) => this.#config!.macros[offset + i]!)
        bytes.forEach((b, i) => {
          this.#config!.macros[offset + i] = b
        })
        return snapshot
      },
      call: c => c.set_macro(offset, data),
      undo: (snapshot) => {
        if (!this.#config) return
        snapshot.forEach((old, i) => {
          this.#config!.macros[offset + i] = old
        })
      },
    })
  }

  setBehavior(behavior: BehaviorConfig): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')

    return runMutation({
      push: () => {
        const snapshot = this.#config!.behavior
        this.#config!.behavior = behavior
        return snapshot
      },
      call: c => c.set_behavior(behavior),
      undo: (snapshot) => { if (this.#config) this.#config.behavior = snapshot },
    })
  }

  setDefaultLayer(layer: number): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (layer < 0 || layer >= this.#config.keymap.length)
      return invalid(`default layer ${layer} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.defaultLayer
        this.#config!.defaultLayer = layer
        return snapshot
      },
      call: c => c.set_default_layer(layer),
      undo: (snapshot) => { if (this.#config) this.#config.defaultLayer = snapshot },
    })
  }
}

export const keyboardStore = new KeyboardStoreClass()
