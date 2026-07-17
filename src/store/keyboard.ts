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
  sync: { syncing: boolean, queueDepth: number, errors: { slice: string, error: string, timestamp: number }[] }
}

export type ConfigSlice = keyof KeyboardConfig

export interface PathChange {
  slice: ConfigSlice
  path: (string | number)[]
  newValue: unknown
}

export interface SyncEvent {
  changes: PathChange[]
}

// ── Store + shared state ────────────────────────────────────────────────────

function emptyConfig(): KeyboardConfig {
  return { keymap: [], encoders: [], combos: [], macros: [], morse: [], forks: [], behavior: null, defaultLayer: 0 }
}

function emptyStatus(): KeyboardStatus {
  return { currentLayer: 0, connection: null, battery: null, bleStatus: null, matrixState: null, ledIndicator: null, sleepState: false, wpm: 0, lockStatus: null }
}

function initialState(): KeyboardState {
  return { connection: null, device: null, config: emptyConfig(), status: emptyStatus(), sync: { syncing: false, queueDepth: 0, errors: [] } }
}

export const [store, setStore] = createStore<KeyboardState>(initialState())

export const clientHolder: { client: RynkClient | null } = { client: null }

export const shadow: { config: KeyboardConfig } = { config: emptyConfig() }

export function syncShadow(c: KeyboardConfig) {
  shadow.config = structuredClone(c)
}

export function resetState() {
  clientHolder.client = null
  setStore(reconcile(initialState()))
}

// ── Event queue ─────────────────────────────────────────────────────────────

// Driver wake callback — set by driver.ts on startup.
const driverWake: { fn: (() => void) | null } = { fn: null }

export function setWakeDriver(fn: () => void) {
  driverWake.fn = fn
}

const MAX_QUEUE = 50
export const eventQueue: SyncEvent[] = []

export function editConfig(mutator: (draft: KeyboardConfig) => void) {
  // Check queue capacity before mutating — if full, reject cleanly so the
  // caller can wait for sync to drain and retry without leaving the store
  // in a diverged state (store updated but keyboard never receives it).
  if (eventQueue.length >= MAX_QUEUE)
    throw new Error('sync queue full — wait for pending changes to flush')

  // Shallow copy of slice references before mutation.
  // produce() preserves references for untouched top-level keys (immer guarantee),
  // so we can skip deep-diff for any slice whose reference didn't change.
  const beforeRefs = { ...store.config }
  setStore('config', produce(mutator))

  const changes: PathChange[] = []
  for (const slice of Object.keys(store.config) as ConfigSlice[]) {
    if (beforeRefs[slice] !== store.config[slice]) {
      diffValue(slice, [], beforeRefs[slice], store.config[slice], changes)
    }
  }
  if (changes.length === 0) return

  eventQueue.push({ changes })
  setStore('sync', 'queueDepth', eventQueue.length)
  driverWake.fn?.()
}

// ── Diff ────────────────────────────────────────────────────────────────────

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

export function setPath(obj: unknown, path: (string | number)[], value: unknown) {
  if (path.length === 0) return
  let cur: unknown = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (cur == null) return
    cur = (cur as Record<string | number, unknown>)[path[i]]
  }
  const target = cur as Record<string | number, unknown>
  target[path[path.length - 1]] = value
}
