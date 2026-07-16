import { discover } from "./rynk"

function App() {
  const devices = await discover()
  return (
    <div class="
      flex h-screen w-screen flex-col items-center gap-4 grid-canvas bg-base-100
      p-8
    "
    />
  )
}

export default App
