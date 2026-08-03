import type {
  BatteryStatus,
  BehaviorConfig,
  BleStatus,
  Combo,
  ConnectionStatus,
  ConnectionType,
  DeviceCapabilities,
  DeviceInfo,
  EncoderAction,
  Fork,
  KeyAction,
  LayoutInfo,
  LedIndicator,
  LockStatus,
  MatrixState,
  Morse,
  PeripheralStatus,
  ProtocolVersion,
} from '../../rynk'
import type { KeyboardError } from './errors'

export type ConnectionPhase = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ConnectionState {
  phase: ConnectionPhase
  label: string
  /// Set only on `error`; why the session ended.
  cause?: KeyboardError
}

export interface KeyboardDevice {
  capabilities: DeviceCapabilities
  info: DeviceInfo
  version: ProtocolVersion
  layout: LayoutInfo
}

export interface KeyboardConfig {
  behavior: BehaviorConfig
  combos: Combo[]
  defaultLayer: number
  encoders: EncoderAction[][]
  forks: Fork[]
  keymap: KeyAction[][][]
  macros: number[]
  morses: Morse[]
}

export interface KeyboardStatus {
  batteryStatus: BatteryStatus
  /// null unless the device reports `ble_enabled`.
  bleStatus: BleStatus | null
  connectionStatus: ConnectionStatus
  connectionType: ConnectionType
  currentLayer: number
  ledIndicator: LedIndicator
  lockStatus: LockStatus
  /// null while locked — GetMatrixState is an unlock-gated command.
  matrixState: MatrixState | null
  peripheralStatus: PeripheralStatus[]
  sleepState: boolean
  wpm: number
}

export interface KeyboardStore {
  config: KeyboardConfig | null
  connection: ConnectionState | null
  device: KeyboardDevice | null
  status: KeyboardStatus | null
}
