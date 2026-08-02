<script lang='ts'>
  import { screens } from '../lib/screens.svelte'
  import Behavior from '../pages/Behavior.svelte'
  import Combos from '../pages/Combos.svelte'
  import Device from '../pages/Device.svelte'
  import Keymap from '../pages/Keymap.svelte'
  import Macros from '../pages/Macros.svelte'
  import Settings from '../pages/Settings.svelte'
  import TopBar from './TopBar.svelte'

  /// Which layer the keymap editor is showing.
  let layer = $state(0)
</script>

<div class='relative flex min-h-0 flex-1 flex-col overflow-hidden grid-canvas'>
  <div class='relative z-5 flex items-stretch gap-3 px-3.5 pt-3.5'>
    <TopBar />
  </div>

  {#if screens.current === 'keymap'}
    <Keymap {layer} onlayer={next => (layer = next)} />
  {:else if screens.current === 'macros'}
    <Macros />
  {:else if screens.current === 'combos'}
    <Combos />
  {:else if screens.current === 'device'}
    <Device />
  {:else if screens.current === 'behavior'}
    <Behavior />
  {:else if screens.current === 'settings'}
    <Settings />
  {/if}
</div>
