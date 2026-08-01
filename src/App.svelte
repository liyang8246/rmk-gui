<script lang='ts'>
  import Keyboard from './components/Keyboard.svelte'
  import StateBar from './components/StateBar.svelte'
  import ToolsBar from './components/ToolsBar.svelte'
  import PageHost from './lib/PageHost.svelte'
  import Toaster from './lib/Toaster.svelte'
  import { canDiscover, connectWebSerial, discover } from './rynk'
  import { describeKeyboardError, keyboardStore } from './stores'

  let picking = $state(false)
  let pickError = $state<string | null>(null)

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
    pickError = null
    try {
      // initStore returns a ResultAsync: a failed handshake is an Err, not a throw.
      const result = await keyboardStore.initStore(await connectWebSerial())
      if (result.isErr()) pickError = describeKeyboardError(result.error)
    }
    catch (e) {
      // NotFoundError is the user dismissing the picker; a port that refuses to
      // open throws NetworkError or InvalidStateError and must be shown.
      if (e instanceof DOMException && e.name === 'NotFoundError') return
      pickError = e instanceof Error ? e.message : String(e)
    }
    finally {
      picking = false
    }
  }
</script>

<div class='flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8'>
  <ToolsBar />
  <div class='w-full flex-1 overflow-auto'>
    {#if !canDiscover() && keyboardStore.connection?.phase !== 'connected'}
      <div class='flex h-full flex-col items-center justify-center gap-2'>
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
        {#if pickError}
          <p class='max-w-sm text-center text-sm text-red-600'>{pickError}</p>
        {/if}
      </div>
    {:else}
      <Keyboard />
    {/if}
  </div>
  <StateBar />
</div>

<PageHost />

<Toaster />
