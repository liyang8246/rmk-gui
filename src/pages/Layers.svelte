<script lang='ts'>
  import { nav } from '../lib/nav.svelte'
  import { toaster } from '../lib/toast.svelte'
  import Combos from './Combos.svelte'
  import Macros from './Macros.svelte'
  import Wireless from './Wireless.svelte'
</script>

<div class='space-y-4'>
  <h3 class='text-xl font-bold'>Layers</h3>
  <p class='text-base-content/70'>Layer configuration will go here.</p>
  <div class='flex gap-2'>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Combos', component: Combos })}>Combos</button>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Macros', component: Macros })}>Macros</button>
    <button class='
      cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-content
      hover:bg-primary/80
    ' onclick={() => nav.push({ title: 'Wireless', component: Wireless })}>Wireless</button>
    <button class='
      cursor-pointer rounded-lg bg-base-300 px-4 py-2 text-base-content
      hover:bg-base-300/80
    ' onclick={() => toaster.loading({ title: 'Toast works!' })}>Test Toast</button>
  </div>
</div>
