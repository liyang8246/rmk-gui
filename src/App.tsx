import { discover } from './rynk'

async function test() {
  const devices = await discover()
  console.warn(devices)
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
