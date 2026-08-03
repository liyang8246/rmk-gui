<script lang='ts'>
  import Workspace from './components/Workspace.svelte'
  import { catalog } from './lib/catalog.svelte'
  import Toaster from './lib/Toaster.svelte'
  import Connect from './pages/Connect.svelte'
  import { deviceStore, keyboardStore } from './stores'

  const connected = $derived(keyboardStore.connection?.phase === 'connected')
  /// Keys the workspace: swapping keyboards rebuilds it, so the selected layer
  /// and the undo stack cannot outlive the keymap they address.
  const deviceId = $derived(keyboardStore.device?.info.serial_number.trim() ?? '')

  void catalog.load()
  void deviceStore.boot()
</script>

<div class='absolute inset-0 flex flex-col overflow-hidden bg-background'>
  {#if connected}
    {#key deviceId}
      <Workspace />
    {/key}
  {:else}
    <div class='relative flex-1'>
      <Connect />
    </div>
  {/if}

  <Toaster />
</div>
