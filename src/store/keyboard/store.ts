import type { RynkClient } from '../../rynk'
import type { KeyboardStore } from './types'
import { createStore } from 'solid-js/store'

export const [store, setStore] = createStore<KeyboardStore>({
  connection: null,
  device: null,
  config: null,
  status: null,
})

// Internal mutable state — not exposed to UI.
export const session = {
  client: null as RynkClient | null,
  // Serializes all client calls (wasm `RynkClient` is single-borrow).
  chain: Promise.resolve() as Promise<void>,
}
