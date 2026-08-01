<script lang='ts'>
  import Keyboard from './components/Keyboard.svelte'
  import StateBar from './components/StateBar.svelte'
  import ToolsBar from './components/ToolsBar.svelte'
  import PageHost from './lib/PageHost.svelte'
  import Toaster from './lib/Toaster.svelte'
  import { canDiscover, connectWebSerial, discover } from './rynk'
  import { keyboardStore } from './stores'

  let picking = $state(false)

  $effect(() => {
    if (!canDiscover()) return
    void (async () => {
      const devices = await discover()
      if (devices.length) await keyboardStore.initStore(await devices[0]!.connect())
    })()
  })

  // Must run from a click: the browser port picker requires a user gesture.
  async function pickWebSerial() {
    picking = true
    try {
      await keyboardStore.initStore(await connectWebSerial())
    }
    catch { /* user dismissed the picker */ }
    finally {
      picking = false
    }
  }
</script>

<div class='flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8'>
  <ToolsBar />
  <div class='w-full flex-1 overflow-auto'>
    {#if !canDiscover() && keyboardStore.connection?.phase !== 'connected'}
      <div class='flex h-full items-center justify-center'>
        <button
          class='
            cursor-pointer rounded-xl bg-base-100 px-4 py-2 shadow-lg ring
            ring-base-300
            hover:bg-base-300
            disabled:opacity-50
          '
          disabled={picking}
          onclick={pickWebSerial}
        >
          {picking ? 'Connecting…' : 'Connect keyboard'}
        </button>
      </div>
    {:else}
      <Keyboard />
    {/if}
  </div>
  <StateBar />
</div>

<PageHost />

<Toaster />
