import type { ConnectedDevice } from './rynk'
import { createSignal, Show } from 'solid-js'
import { discover } from './rynk'
import { initKbdStore, kbdStore, resetKbdStore } from './store'

const [connecting, setConnecting] = createSignal(false)

async function testConnect() {
  setConnecting(true)
  try {
    const devices = await discover()
    if (!devices.length) {
      console.warn('no devices')
      return
    }
    console.warn('discovered:', devices.map(d => ({ kind: d.kind, label: d.label })))

    const dev = devices[0]
    console.warn('connecting to:', dev.label)

    const connected: ConnectedDevice = await dev.connect()
    console.warn('connected:', {
      label: connected.label,
      descriptor: connected.descriptor,
    })

    const result = await initKbdStore(connected)
    result.match(
      () => console.warn('init ok, store:', kbdStore),
      e => console.warn('init failed:', e),
    )
  } catch (e) {
    console.warn('connect error:', e)
    await resetKbdStore()
  } finally {
    setConnecting(false)
  }
}

function App() {
  return (
    <div class="flex h-screen w-screen flex-col items-center gap-4 p-8">
      <button onClick={() => testConnect()} disabled={connecting()}>
        <Show when={connecting()} fallback="Connect">Connecting...</Show>
      </button>
      <button onClick={() => console.warn('store:', kbdStore)}>Show Store</button>
      <button onClick={() => resetKbdStore().catch(e => console.warn('disconnect error:', e))}>Disconnect</button>
    </div>
  )
}

export default App
