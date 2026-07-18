import type {
  BatteryStatus,
  BehaviorConfig,
  Combo,
  ConnectionStatus,
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

export type ConnectionPhase = 'connecting' | 'connected' | 'error'

export interface ConnectionState {
  phase: ConnectionPhase
  label: string
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
  connectionStatus: ConnectionStatus
  currentLayer: number
  ledIndicator: LedIndicator
  lockStatus: LockStatus
  matrixState: MatrixState
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
