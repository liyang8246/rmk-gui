<script lang='ts'>
import { Toaster } from 'svelte-sonner'
import Keyboard from './components/Keyboard.svelte'
import StateBar from './components/StateBar.svelte'
import ToolsBar from './components/ToolsBar.svelte'
import { renderVariants } from './lib/layout'
import PageHost from './lib/PageHost.svelte'
import { deviceStore, keyboardStore } from './stores'

$effect(() => {
  // Startup auto-connect: failures surface as console errors, not a toast.
  void deviceStore.boot().catch(() => {})
})

const variants = $derived(renderVariants(keyboardStore.device?.layout, keyboardStore.device?.capabilities))
const variant = $derived.by(() => {
  if (!variants.length)
    return undefined
  const idx = Math.min(keyboardStore.device?.layout.default_variant ?? 0, variants.length - 1)
  return variants[idx]!
})
</script>

<div class='flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8'>
  <ToolsBar />
  <div class='flex w-full flex-1 items-center justify-center'>
    <Keyboard {variant} />
  </div>
  <StateBar />
</div>

<PageHost />
<Toaster />
