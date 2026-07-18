import type {
  BehaviorConfig,
  Combo,
  ConnectedDevice,
  DeviceCapabilities,
  DeviceDescriptor,
  DeviceInfo,
  EncoderAction,
  FirmwareVersion,
  Fork,
  KeyAction,
  MacroData,
  Morse,
  RynkClient,
} from '../../rynk'
import type { KeyboardError } from './errors'
import type { KeyboardConfig, KeyboardDevice } from './types'
import { ResultAsync } from 'neverthrow'
import { produce } from 'solid-js/store'
import { connectClient } from '../../rynk'
import { toKeyboardError } from './errors'
import { session, setStore, store } from './store'
import { runMutation } from './utils'

export function initStore(connected: ConnectedDevice): ResultAsync<void, KeyboardError> {
  return ResultAsync.fromThrowable(() => doInit(connected), toKeyboardError)()
}

export function resetStore(): void {
  setStore({
    connection: null,
    device: null,
    config: null,
    status: null,
  })
  session.client = null
  session.shadow = null
  session.chain = Promise.resolve()
}

async function doInit(connected: ConnectedDevice): Promise<void> {
  try {
    setStore('connection', { phase: 'connecting', label: connected.label })

    const { client } = await connectClient(connected.link, connected.label)
    session.client = client

    // Device metadata (serial)
    const version = await client.get_version()
    const capabilities = await client.get_capabilities()
    const layout = await client.get_layout()

    // Config (serial)
    const behavior = await client.get_behavior()
    const defaultLayer = await client.get_default_layer()
    const keymap = await fetchKeymap(client, capabilities)
    const encoders = await fetchEncoders(client, capabilities)
    const combos = (await client.get_combo_bulk(0)).configs
    const morses = (await client.get_morse_bulk(0)).configs
    const forks = await fetchForks(client, capabilities)
    const macros = await fetchMacros(client, capabilities)

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
      info: descriptorToDeviceInfo(connected.descriptor),
      version,
      layout,
    }
    setStore({
      connection: { phase: 'connected', label: connected.label },
      device,
      config,
      status: null,
    })
    session.shadow = structuredClone(config)
    session.chain = Promise.resolve()
  } catch (e) {
    resetStore()
    throw e
  }
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
  if (caps.macro_space_size === 0) return []
  // TODO: verify get_macro(offset) chunking — may return less than macro_space_size per call.
  const { data } = await client.get_macro(0)
  return data
}

function descriptorToDeviceInfo(d: DeviceDescriptor): DeviceInfo {
  // TODO: rmk_version has no source — rynk protocol lacks a firmware version getter.
  const rmk_version: FirmwareVersion = { major: 0, minor: 0, patch: 0 }
  return { ...d, rmk_version }
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
    call: client => client.set_key(layer, row, col, action),
    sync: () => { session.shadow!.keymap[layer][row][col] = action },
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
    call: client => client.set_encoder(encoderId, layer, action),
    sync: () => { session.shadow!.encoders[encoderId][layer] = action },
    undo: () => { if (store.config) setStore('config', 'encoders', encoderId, layer, snapshot) },
  })
}

export function setCombo(index: number, config: Combo): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.combos[index]
  return runMutation({
    push: () => setStore('config', 'combos', index, config),
    call: client => client.set_combo(index, config),
    sync: () => { session.shadow!.combos[index] = config },
    undo: () => { if (store.config) setStore('config', 'combos', index, snapshot) },
  })
}

export function setMorse(index: number, config: Morse): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.morses[index]
  return runMutation({
    push: () => setStore('config', 'morses', index, config),
    call: client => client.set_morse(index, config),
    sync: () => { session.shadow!.morses[index] = config },
    undo: () => { if (store.config) setStore('config', 'morses', index, snapshot) },
  })
}

export function setFork(index: number, config: Fork): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.forks[index]
  return runMutation({
    push: () => setStore('config', 'forks', index, config),
    call: client => client.set_fork(index, config),
    sync: () => { session.shadow!.forks[index] = config },
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
    call: client => client.set_macro(offset, data),
    sync: () => bytes.forEach((b, i) => { session.shadow!.macros[offset + i] = b }),
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
    call: client => client.set_behavior(config),
    sync: () => { session.shadow!.behavior = config },
    undo: () => { if (store.config) setStore('config', 'behavior', snapshot) },
  })
}

export function setDefaultLayer(layer: number): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.defaultLayer
  return runMutation({
    push: () => setStore('config', 'defaultLayer', layer),
    call: client => client.set_default_layer(layer),
    sync: () => { session.shadow!.defaultLayer = layer },
    undo: () => { if (store.config) setStore('config', 'defaultLayer', snapshot) },
  })
}
