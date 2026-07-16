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
  eventsDropped: number
}

export interface KeyboardState {
  connection: ConnectionMeta | null
  device: DeviceMeta | null
  config: KeyboardConfig
  status: KeyboardStatus
  sync: { syncing: boolean, errors: { slice: string, error: string, timestamp: number }[] }
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
  return { currentLayer: 0, connection: null, battery: null, bleStatus: null, matrixState: null, ledIndicator: null, sleepState: false, wpm: 0, lockStatus: null, eventsDropped: 0 }
}

function initialState(): KeyboardState {
  return { connection: null, device: null, config: emptyConfig(), status: emptyStatus(), sync: { syncing: false, errors: [] } }
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
  const before = structuredClone(store.config)
  setStore('config', produce(mutator))
  const after = structuredClone(store.config)

  const changes = diffConfigs(before, after)
  if (changes.length === 0) return

  if (eventQueue.length >= MAX_QUEUE) eventQueue.shift()
  eventQueue.push({ changes })
  driverWake.fn?.()
}

// ── Diff ────────────────────────────────────────────────────────────────────

function diffConfigs(before: KeyboardConfig, after: KeyboardConfig): PathChange[] {
  const changes: PathChange[] = []
  for (const slice of Object.keys(after) as ConfigSlice[]) {
    diffValue(slice, [], before[slice], after[slice], changes)
  }
  return changes
}

function diffValue(slice: ConfigSlice, path: (string | number)[], oldVal: unknown, newVal: unknown, changes: PathChange[]) {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const maxLen = Math.max(oldVal.length, newVal.length)
    for (let i = 0; i < maxLen; i++) {
      diffValue(slice, [...path, i], oldVal[i], newVal[i], changes)
    }
  } else {
    changes.push({ slice, path, newValue: structuredClone(newVal) })
  }
}

export function setPath(obj: unknown, path: (string | number)[], value: unknown) {
  if (path.length === 0) return
  let cur: unknown = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (cur == null) return
    cur = (cur as Record<string | number, unknown>)[path[i]]
  }
  ;(cur as Record<string | number, unknown>)[path[path.length - 1]] = value
}
