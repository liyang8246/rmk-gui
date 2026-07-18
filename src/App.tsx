import { discover } from './rynk'
import { store } from './store'

async function testConnect() {
  const devices = await discover()
  if (!devices.length) {
    console.warn('no devices')
    return
  }

  const dev = devices[0]
  console.warn('device:', dev.label)
}

function App() {
  return (
    <div class="flex h-screen w-screen flex-col items-center gap-4 p-8">
      <button onClick={() => testConnect()}>Connect</button>
      <button onClick={() => console.warn('store:', store)}>Show Store</button>
    </div>
  )
}

export default App
