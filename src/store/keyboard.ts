import type {
  BatteryStatus,
  BehaviorConfig,
  BleStatus,
  Combo,
  ConnectionStatus,
  DeviceCapabilities,
  EncoderAction,
  Fork,
  KeyAction,
  LayoutInfo,
  LedIndicator,
  LockStatus,
  MatrixState,
  Morse,
  ProtocolVersion,
  RynkClient,
} from '../rynk/wasm/rynk_wasm.js'
import { createStore, produce, reconcile } from 'solid-js/store'
import { sendChanges } from './sync'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ConnectionMeta {
  transport: 'serial' | 'ble' | 'tcp'
  label: string
  protocolVersion: ProtocolVersion
}

export interface DeviceMeta {
  capabilities: DeviceCapabilities
  layout: LayoutInfo
}

export interface KeyboardConfig {
  keymap: KeyAction[][][]
  encoders: EncoderAction[][]
  combos: Combo[]
  macros: number[]
  morse: Morse[]
  forks: Fork[]
  behavior: BehaviorConfig | null
  defaultLayer: number
}

export interface KeyboardStatus {
  currentLayer: number
  connection: ConnectionStatus | null
  battery: BatteryStatus | null
  bleStatus: BleStatus | null
  matrixState: MatrixState | null
  ledIndicator: LedIndicator | null
  sleepState: boolean
  wpm: number
  lockStatus: LockStatus | null
}

export interface KeyboardState {
  connection: ConnectionMeta | null
  device: DeviceMeta | null
  config: KeyboardConfig
  status: KeyboardStatus
  sync: { syncing: boolean }
}

export type ConfigSlice = keyof KeyboardConfig

export interface PathChange {
  slice: ConfigSlice
  path: (string | number)[]
  newValue: unknown
}

// ── Store + shared state ────────────────────────────────────────────────────

function emptyConfig(): KeyboardConfig {
  return { keymap: [], encoders: [], combos: [], macros: [], morse: [], forks: [], behavior: null, defaultLayer: 0 }
}

function emptyStatus(): KeyboardStatus {
  return { currentLayer: 0, connection: null, battery: null, bleStatus: null, matrixState: null, ledIndicator: null, sleepState: false, wpm: 0, lockStatus: null }
}

function initialState(): KeyboardState {
  return { connection: null, device: null, config: emptyConfig(), status: emptyStatus(), sync: { syncing: false } }
}

export const [store, setStore] = createStore<KeyboardState>(initialState())

export const clientHolder: { client: RynkClient | null } = { client: null }

export const shadow: { config: KeyboardConfig } = { config: emptyConfig() }

export function syncShadow(c: KeyboardConfig) {
  shadow.config = structuredClone(c)
}

let syncChain: Promise<void> = Promise.resolve()

export function resetState() {
  syncChain = Promise.resolve()
  clientHolder.client = null
  setStore(reconcile(initialState()))
}

// ── editConfig: action → store → diff shadow → send → commit/rollback ──────

export function editConfig(mutator: (draft: KeyboardConfig) => void) {
  setStore('config', produce(mutator))

  syncChain = syncChain.then(async () => {
    const c = clientHolder.client
    if (!c || !store.connection || !store.device) return

    const changes = diffConfigs(shadow.config, store.config)
    if (changes.length === 0) return

    const caps = store.device.capabilities
    setStore('sync', 'syncing', true)
    try {
      await sendChanges(c, changes, caps)
      syncShadow(store.config)
    } catch {
      setStore('config', reconcile(structuredClone(shadow.config)))
    } finally {
      setStore('sync', 'syncing', false)
    }
  })

  return syncChain
}

// ── Diff ────────────────────────────────────────────────────────────────────

function diffConfigs(shadow: KeyboardConfig, current: KeyboardConfig): PathChange[] {
  const changes: PathChange[] = []
  for (const slice of Object.keys(current) as ConfigSlice[]) {
    if (shadow[slice] !== current[slice]) {
      diffValue(slice, [], shadow[slice], current[slice], changes)
    }
  }
  return changes
}

function diffValue(slice: ConfigSlice, path: (string | number)[], oldVal: unknown, newVal: unknown, changes: PathChange[]) {
  if (deepEqual(oldVal, newVal)) return
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const maxLen = Math.max(oldVal.length, newVal.length)
    for (let i = 0; i < maxLen; i++) {
      diffValue(slice, [...path, i], oldVal[i], newVal[i], changes)
    }
  } else {
    changes.push({ slice, path, newValue: structuredClone(newVal) })
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  const ak = Object.keys(a as Record<string, unknown>)
  const bk = Object.keys(b as Record<string, unknown>)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false
  }
  return true
}
