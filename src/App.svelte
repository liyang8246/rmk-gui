<script lang='ts'>
import { Toaster } from 'svelte-sonner'
import Keyboard from './components/Keyboard.svelte'
import StateBar from './components/StateBar.svelte'
import ToolsBar from './components/ToolsBar.svelte'
import PageHost from './lib/PageHost.svelte'
import { deviceStore } from './stores'

$effect(() => {
  // Startup auto-connect: failures surface as console errors, not a toast.
  void deviceStore.boot().catch(() => {})
})
</script>

<div class='flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8'>
  <ToolsBar />
  <div class='w-full flex-1 overflow-auto'>
    <Keyboard />
  </div>
  <StateBar />
</div>

<PageHost />
<Toaster />
