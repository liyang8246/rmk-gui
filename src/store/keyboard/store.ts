import type { KeyboardStore } from './types'
import { createStore } from 'solid-js/store'

export const [store, setStore] = createStore<KeyboardStore>({
  connection: null,
  device: null,
  config: null,
  status: null,
})
