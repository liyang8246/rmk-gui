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
} from '../../rynk'

export interface KeyboardDevice {
  capabilities: DeviceCapabilities
  info: DeviceInfo
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
  bleStatus: BleStatus | null
  connectionStatus: ConnectionStatus
  connectionType: ConnectionType
  currentLayer: number
  ledIndicator: LedIndicator
  lockStatus: LockStatus
  matrixState: MatrixState | null
  peripheralStatus: PeripheralStatus[]
  sleepState: boolean
  wpm: number
}
