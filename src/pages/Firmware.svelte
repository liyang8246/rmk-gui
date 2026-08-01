<script lang='ts'>
  import { nav } from '../lib/nav.svelte'
  import Combos from './Combos.svelte'
  import Layers from './Layers.svelte'
  import Macros from './Macros.svelte'
</script>

<div class='space-y-4'>
  <h3 class='text-xl font-bold'>Firmware</h3>
  <p class='text-base-content/70'>Firmware configuration will go here.</p>
  <div class='flex gap-2'>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Layers', component: Layers })}>Layers</button>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Macros', component: Macros })}>Macros</button>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Combos', component: Combos })}>Combos</button>
  </div>
</div>
