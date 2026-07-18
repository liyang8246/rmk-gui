import type { RynkClient } from '../../rynk/core'
import type { KeyboardStore } from './types'
import { createStore } from 'solid-js/store'

export const clientState = { value: null as RynkClient | null, label: null as string | null }

export const [store, setStore] = createStore<KeyboardStore>({
  connection: null,
  device: null,
  config: null,
  status: null,
})
