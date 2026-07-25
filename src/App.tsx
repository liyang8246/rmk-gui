import type { Component } from 'solid-js'
import { onMount } from 'solid-js'
import ToolsBar from './components/ToolsBar'
import { discover } from './rynk'
import { initKbdStore, kbdStore } from './store'

const App: Component = () => {
  onMount(async () => {
    const devices = await discover()
    if (!devices.length) return
    const connected = await devices[0].connect()
    await initKbdStore(connected)
    console.warn('init', kbdStore)
  })

  return <>
    <div class="
      flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8
    "
    >
      <ToolsBar />
    </div>
  </>
}

export default App
