<script lang='ts'>
  import { nav } from '../lib/nav.svelte'
  import Combos from './Combos.svelte'
  import Firmware from './Firmware.svelte'
  import Settings from './Settings.svelte'
</script>

<div class='space-y-4'>
  <h3 class='text-xl font-bold'>Macros</h3>
  <p class='text-base-content/70'>Macro configuration will go here.</p>
  <div class='flex gap-2'>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Combos', component: Combos })}>Combos</button>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Firmware', component: Firmware })}>Firmware</button>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Settings', component: Settings })}>Settings</button>
  </div>
</div>
