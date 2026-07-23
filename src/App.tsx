import { createSignal } from 'solid-js'
import ToolsBar from './components/ToolsBar'
import { discover } from './rynk'
import { initKbdStore, kbdStore, resetKbdStore } from './store'

function App() {
  const [busy, setBusy] = createSignal(false)

  async function connect() {
    setBusy(true)
    try {
      const devices = await discover()
      if (!devices.length) return
      const connected = await devices[0].connect()
      await initKbdStore(connected)
      console.warn('init', kbdStore)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div class="
      flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8
    "
    >
      <ToolsBar />
      <button onClick={connect} disabled={busy()}>
        {busy() ? 'Connecting...' : 'Connect'}
      </button>
      <button onClick={() => resetKbdStore().catch(() => {})}>Disconnect</button>
    </div>
  )
}

export default App
