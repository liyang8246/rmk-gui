import type {
  BehaviorConfig,
  Combo,
  EncoderAction,
  Fork,
  KeyAction,
  MacroData,
  Morse,
  RynkClient,
} from '../../rynk/core'
import type { KeyboardConfig } from './types'
import { produce } from 'solid-js/store'
import { clientState, setStore, store } from './store'

// ── Sync chain: serializes all client calls (single-borrow) ──

let syncChain: Promise<void> = Promise.resolve()

// ── Shadow: keyboard's actual committed state ──

let shadow: KeyboardConfig | null = null

export function initShadow(config: KeyboardConfig): void {
  shadow = structuredClone(config)
}

export function resetShadow(): void {
  shadow = null
  syncChain = Promise.resolve()
}

// ── Enqueue: chain continues regardless of individual failure ──

function enqueue(fn: () => Promise<void>): Promise<void> {
  const result = syncChain.then(fn)
  syncChain = result.catch(() => {})
  return result
}

// ── Guard ──

function getClient(): RynkClient {
  const c = clientState.value
  if (!c || !shadow) throw new Error('not connected')
  return c
}

// ── Keymap ──

export function setKey(layer: number, row: number, col: number, action: KeyAction): Promise<void> {
  const snapshot = store.config!.keymap[layer][row][col]
  setStore('config', 'keymap', layer, row, col, action)
  return enqueue(async () => {
    try {
      await getClient().set_key(layer, row, col, action)
      shadow!.keymap[layer][row][col] = action
    } catch (e) {
      if (store.config) setStore('config', 'keymap', layer, row, col, snapshot)
      throw e
    }
  })
}

export function setKeymapBulk(
  layer: number,
  startRow: number,
  startCol: number,
  actions: KeyAction[],
): Promise<void> {
  const caps = store.device!.capabilities
  const cells = walkKeymapCells(layer, startRow, startCol, actions.length, caps.num_rows, caps.num_cols)
  const snapshot = cells.map(({ l, r, c }) => store.config!.keymap[l][r][c])
  setStore('config', 'keymap', produce((draft) => {
    actions.forEach((a, i) => {
      const { l, r, c } = cells[i]
      draft[l][r][c] = a
    })
  }))
  return enqueue(async () => {
    try {
      await getClient().set_keymap_bulk({ layer, start_row: startRow, start_col: startCol, actions })
      actions.forEach((a, i) => {
        const { l, r, c } = cells[i]
        shadow!.keymap[l][r][c] = a
      })
    } catch (e) {
      if (store.config) {
        setStore('config', 'keymap', produce((draft) => {
          snapshot.forEach((old, i) => {
            const { l, r, c } = cells[i]
            draft[l][r][c] = old
          })
        }))
      }
      throw e
    }
  })
}

// ── Encoders ──

export function setEncoder(
  encoderId: number,
  layer: number,
  action: EncoderAction,
): Promise<void> {
  const snapshot = store.config!.encoders[encoderId][layer]
  setStore('config', 'encoders', encoderId, layer, action)
  return enqueue(async () => {
    try {
      await getClient().set_encoder(encoderId, layer, action)
      shadow!.encoders[encoderId][layer] = action
    } catch (e) {
      if (store.config) setStore('config', 'encoders', encoderId, layer, snapshot)
      throw e
    }
  })
}

// ── Combos ──

export function setCombo(index: number, config: Combo): Promise<void> {
  const snapshot = store.config!.combos[index]
  setStore('config', 'combos', index, config)
  return enqueue(async () => {
    try {
      await getClient().set_combo(index, config)
      shadow!.combos[index] = config
    } catch (e) {
      if (store.config) setStore('config', 'combos', index, snapshot)
      throw e
    }
  })
}

export function setComboBulk(startIndex: number, configs: Combo[]): Promise<void> {
  const snapshot = configs.map((_, i) => store.config!.combos[startIndex + i])
  setStore('config', 'combos', produce((draft) => {
    configs.forEach((c, i) => {
      draft[startIndex + i] = c
    })
  }))
  return enqueue(async () => {
    try {
      await getClient().set_combo_bulk({ start_index: startIndex, configs })
      configs.forEach((c, i) => {
        shadow!.combos[startIndex + i] = c
      })
    } catch (e) {
      if (store.config) {
        setStore('config', 'combos', produce((draft) => {
          snapshot.forEach((old, i) => {
            draft[startIndex + i] = old
          })
        }))
      }
      throw e
    }
  })
}

// ── Morse ──

export function setMorse(index: number, config: Morse): Promise<void> {
  const snapshot = store.config!.morses[index]
  setStore('config', 'morses', index, config)
  return enqueue(async () => {
    try {
      await getClient().set_morse(index, config)
      shadow!.morses[index] = config
    } catch (e) {
      if (store.config) setStore('config', 'morses', index, snapshot)
      throw e
    }
  })
}

export function setMorseBulk(startIndex: number, configs: Morse[]): Promise<void> {
  const snapshot = configs.map((_, i) => store.config!.morses[startIndex + i])
  setStore('config', 'morses', produce((draft) => {
    configs.forEach((c, i) => {
      draft[startIndex + i] = c
    })
  }))
  return enqueue(async () => {
    try {
      await getClient().set_morse_bulk({ start_index: startIndex, configs })
      configs.forEach((c, i) => {
        shadow!.morses[startIndex + i] = c
      })
    } catch (e) {
      if (store.config) {
        setStore('config', 'morses', produce((draft) => {
          snapshot.forEach((old, i) => {
            draft[startIndex + i] = old
          })
        }))
      }
      throw e
    }
  })
}

// ── Forks ──

export function setFork(index: number, config: Fork): Promise<void> {
  const snapshot = store.config!.forks[index]
  setStore('config', 'forks', index, config)
  return enqueue(async () => {
    try {
      await getClient().set_fork(index, config)
      shadow!.forks[index] = config
    } catch (e) {
      if (store.config) setStore('config', 'forks', index, snapshot)
      throw e
    }
  })
}

// ── Macros ──

export function setMacro(offset: number, data: MacroData): Promise<void> {
  const bytes = data.data
  const snapshot = bytes.map((_, i) => store.config!.macros[offset + i])
  setStore('config', 'macros', produce((draft) => {
    bytes.forEach((b, i) => {
      draft[offset + i] = b
    })
  }))
  return enqueue(async () => {
    try {
      await getClient().set_macro(offset, data)
      bytes.forEach((b, i) => {
        shadow!.macros[offset + i] = b
      })
    } catch (e) {
      if (store.config) {
        setStore('config', 'macros', produce((draft) => {
          snapshot.forEach((old, i) => {
            draft[offset + i] = old
          })
        }))
      }
      throw e
    }
  })
}

// ── Behavior ──

export function setBehavior(config: BehaviorConfig): Promise<void> {
  const snapshot = store.config!.behavior
  setStore('config', 'behavior', config)
  return enqueue(async () => {
    try {
      await getClient().set_behavior(config)
      shadow!.behavior = config
    } catch (e) {
      if (store.config) setStore('config', 'behavior', snapshot)
      throw e
    }
  })
}

// ── Default layer ──

export function setDefaultLayer(layer: number): Promise<void> {
  const snapshot = store.config!.defaultLayer
  setStore('config', 'defaultLayer', layer)
  return enqueue(async () => {
    try {
      await getClient().set_default_layer(layer)
      shadow!.defaultLayer = layer
    } catch (e) {
      if (store.config) setStore('config', 'defaultLayer', snapshot)
      throw e
    }
  })
}

// ── Helper ──

function walkKeymapCells(
  startLayer: number,
  startRow: number,
  startCol: number,
  count: number,
  numRows: number,
  numCols: number,
): { l: number, r: number, c: number }[] {
  const cells: { l: number, r: number, c: number }[] = []
  let l = startLayer
  let r = startRow
  let c = startCol
  for (let i = 0; i < count; i++) {
    cells.push({ l, r, c })
    c++
    if (c >= numCols) {
      c = 0
      r++
      if (r >= numRows) {
        r = 0
        l++
      }
    }
  }
  return cells
}
