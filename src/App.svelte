<script lang='ts'>
  import Keyboard from './components/Keyboard.svelte'
  import StateBar from './components/StateBar.svelte'
  import ToolsBar from './components/ToolsBar.svelte'
  import { discover } from './rynk'
  import { keyboardStore } from './stores'

  $effect(() => {
    void (async () => {
      const devices = await discover()
      if (!devices.length) return
      const connected = await devices[0]!.connect()
      await keyboardStore.initStore(connected)
      console.warn('init', keyboardStore)
    })()
  })
</script>

<div class='flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8'>
  <ToolsBar />
  <div class='w-full flex-1 overflow-auto'>
    <Keyboard />
  </div>
  <StateBar />
</div>
