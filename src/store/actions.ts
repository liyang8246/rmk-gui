import type { ByteLink } from '../rynk'
import type {
  Combo,
  DeviceCapabilities,
  EncoderAction,
  Fork,
  KeyAction,
  Morse,
  RynkClient,
} from '../rynk/wasm/rynk_wasm.js'
import type { KeyboardConfig } from './keyboard'
import { reconcile } from 'solid-js/store'
import { connectClient } from '../rynk/core'
import {
  clientHolder,
  resetState,
  setStore,
  syncShadow,
} from './keyboard'

export async function connectKeyboard(link: ByteLink, transport: 'serial' | 'ble' | 'tcp', label: string) {
  // Defensively free any existing (possibly-dead) client before reconnecting
  if (clientHolder.client) {
    try {
      clientHolder.client[Symbol.dispose]()
    } catch { /* already dead */ }
    clientHolder.client = null
  }

  const { client: c, major, minor } = await connectClient(link, label)
  clientHolder.client = c

  setStore('connection', { transport, label, protocolVersion: { major, minor } })

  // RynkClient methods are &mut self — cannot use Promise.all for concurrent calls
  const caps = await c.get_capabilities()
  const layout = await c.get_layout()
  setStore('device', { capabilities: caps, layout })

  const config = await fetchFullConfig(c, caps)
  setStore('config', reconcile(config))
  syncShadow(config)
}

export async function disconnectKeyboard() {
  if (clientHolder.client) {
    try {
      clientHolder.client[Symbol.dispose]()
    } catch { /* ignore */ }
  }
  resetState()
}

// ── Config fetchers ─────────────────────────────────────────────────────────

async function fetchFullConfig(client: RynkClient, caps: DeviceCapabilities): Promise<KeyboardConfig> {
  // RynkClient methods are &mut self — must serialize, not Promise.all
  const keymap = await fetchKeymap(client, caps)
  const encoders = await fetchEncoders(client, caps)
  const combos = await fetchCombos(client, caps)
  const macros = await fetchMacros(client, caps)
  const morse = await fetchMorse(client, caps)
  const forks = await fetchForks(client, caps)
  const behavior = await client.get_behavior()
  const defaultLayer = await client.get_default_layer()
  return { keymap, encoders, combos, macros, morse, forks, behavior, defaultLayer }
}

async function fetchKeymap(client: RynkClient, caps: DeviceCapabilities): Promise<KeyAction[][][]> {
  if (caps.bulk_transfer_supported) {
    const flat: KeyAction[] = []
    const total = caps.num_layers * caps.num_rows * caps.num_cols
    let layer = 0
    let row = 0
    let col = 0
    while (flat.length < total) {
      const resp = await client.get_keymap_bulk(layer, row, col)
      if (resp.actions.length === 0) break
      flat.push(...resp.actions)
      // Advance (layer,row,col) cursor by resp.actions.length, carrying overflow
      col += resp.actions.length
      while (col >= caps.num_cols) {
        col -= caps.num_cols
        row++
      }
      while (row >= caps.num_rows) {
        row -= caps.num_rows
        layer++
      }
    }
    const keymap: KeyAction[][][] = []
    let idx = 0
    for (let l = 0; l < caps.num_layers; l++) {
      keymap[l] = []
      for (let r = 0; r < caps.num_rows; r++) {
        keymap[l][r] = []
        for (let cc = 0; cc < caps.num_cols; cc++) {
          keymap[l][r][cc] = flat[idx++] ?? 'No'
        }
      }
    }
    return keymap
  }
  const keymap: KeyAction[][][] = []
  for (let l = 0; l < caps.num_layers; l++) {
    keymap[l] = []
    for (let r = 0; r < caps.num_rows; r++) {
      keymap[l][r] = []
      for (let cc = 0; cc < caps.num_cols; cc++) {
        keymap[l][r][cc] = await client.get_key(l, r, cc)
      }
    }
  }
  return keymap
}

async function fetchEncoders(client: RynkClient, caps: DeviceCapabilities): Promise<EncoderAction[][]> {
  const encoders: EncoderAction[][] = []
  for (let e = 0; e < caps.num_encoders; e++) {
    encoders[e] = []
    for (let l = 0; l < caps.num_layers; l++) {
      encoders[e][l] = await client.get_encoder(e, l)
    }
  }
  return encoders
}

async function fetchCombos(client: RynkClient, caps: DeviceCapabilities): Promise<Combo[]> {
  if (caps.bulk_transfer_supported && caps.max_combos > 0) {
    const combos: Combo[] = []
    let idx = 0
    while (idx < caps.max_combos) {
      const resp = await client.get_combo_bulk(idx)
      if (resp.configs.length === 0) break
      combos.push(...resp.configs)
      idx += resp.configs.length
    }
    while (combos.length < caps.max_combos) {
      combos.push({ actions: [], output: 'No', layer: undefined })
    }
    return combos
  }
  const combos: Combo[] = []
  for (let i = 0; i < caps.max_combos; i++) {
    combos.push(await client.get_combo(i))
  }
  return combos
}

async function fetchMacros(client: RynkClient, caps: DeviceCapabilities): Promise<number[]> {
  if (caps.macro_space_size === 0) return []
  const macros: number[] = []
  const chunkSize = caps.macro_chunk_size || 64
  for (let offset = 0; offset < caps.macro_space_size; offset += chunkSize) {
    macros.push(...(await client.get_macro(offset)).data)
  }
  return macros
}

async function fetchMorse(client: RynkClient, caps: DeviceCapabilities): Promise<Morse[]> {
  if (caps.bulk_transfer_supported && caps.max_morse > 0) {
    const morse: Morse[] = []
    let idx = 0
    while (idx < caps.max_morse) {
      const resp = await client.get_morse_bulk(idx)
      if (resp.configs.length === 0) break
      morse.push(...resp.configs)
      idx += resp.configs.length
    }
    while (morse.length < caps.max_morse) {
      morse.push({ profile: { unilateral_tap: undefined, enable_flow_tap: undefined, mode: undefined, hold_timeout_ms: undefined, gap_timeout_ms: undefined }, actions: [] } as unknown as Morse)
    }
    return morse
  }
  const morse: Morse[] = []
  for (let i = 0; i < caps.max_morse; i++) {
    morse.push(await client.get_morse(i))
  }
  return morse
}

async function fetchForks(client: RynkClient, caps: DeviceCapabilities): Promise<Fork[]> {
  const forks: Fork[] = []
  for (let i = 0; i < caps.max_forks; i++) {
    try {
      forks.push(await client.get_fork(i))
    } catch {
      break
    }
  }
  return forks
}
