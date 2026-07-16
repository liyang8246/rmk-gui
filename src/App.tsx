import { connectClient, discover } from './rynk'

async function test() {
  const devices = await discover()
  console.warn('discovered', devices.length, 'devices')

  // Pick the first device and run a get_key → set_key → get_key cycle.
  const dev = devices[0]
  if (!dev) return
  const link = await dev.connect()
  const { client, major, minor } = await connectClient(link, dev.label)
  console.warn(`connected: protocol v${major}.${minor}, ${client.label()}`)

  const caps = await client.get_capabilities()
  console.warn('capabilities', caps.num_layers, caps.num_rows, caps.num_cols)

  const layer = 0
  const row = 0
  const col = 0

  const before = await client.get_key(layer, row, col)
  console.warn('get_key', { layer, row, col }, '=', before)

  // Toggle: if No, set to Transparent; otherwise reset to No.
  const next = before === 'No' ? 'Transparent' : 'No'
  await client.set_key(layer, row, col, next)
  console.warn('set_key', { layer, row, col }, '=', next)

  const after = await client.get_key(layer, row, col)
  console.warn('get_key', { layer, row, col }, '=', after)

  await link.close()
}

function App() {
  test()
  return (
    <div class="
      flex h-screen w-screen flex-col items-center gap-4 grid-canvas bg-base-100
      p-8
    "
    />
  )
}

export default App
