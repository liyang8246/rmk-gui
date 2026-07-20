import type { ConnectedDevice, RynkClient } from '../../rynk'
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
  // Held from initStore until resetStore; store owns the full session lifetime
  // (client.free + link.close) so callers don't need to manage either.
  connected: null as ConnectedDevice | null,
  // Serialize client calls: protocol allows one request in flight at a time.
  chain: Promise.resolve() as Promise<void>,
  // False until store is populated; topic loop drains without applying during init.
  topicsReady: false,
}
