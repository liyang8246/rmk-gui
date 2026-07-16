import { discover } from './rynk'
import { connectKeyboard, disconnectKeyboard, store } from './store'

async function testConnect() {
  const devices = await discover()
  if (!devices.length) {
    console.warn('no devices')
    return
  }

  const dev = devices[0]
  const link = await dev.connect()
  await connectKeyboard(link, dev.kind, dev.label)

  if (store.connection) console.warn('connected:', store.connection.label)
  if (store.device) console.warn('caps:', store.device.capabilities.num_layers)
  console.warn('keymap[0][0][0] =', store.config.keymap?.[0]?.[0]?.[0])
  console.warn('currentLayer =', store.status.currentLayer)
}

function App() {
  return (
    <div class="flex h-screen w-screen flex-col items-center gap-4 p-8">
      <button onClick={() => testConnect()}>Connect</button>
      <button onClick={() => disconnectKeyboard()}>Disconnect</button>
    </div>
  )
}

export default App
