export {
  toKeyboardError,
} from './errors'

export type {
  KeyboardError,
} from './errors'

export {
  initStore as initKbdStore,
  resetStore as resetKbdStore,
  setBehavior,
  setCombo,
  setDefaultLayer,
  setEncoder,
  setFork,
  setKey,
  setMacro,
  setMorse,
} from './session'

export {
  store as kbdStore,
} from './store'

export type {
  ConnectionPhase,
  ConnectionState,
  KeyboardConfig,
  KeyboardDevice,
  KeyboardStatus,
  KeyboardStore,
} from './types'
