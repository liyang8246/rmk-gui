<script lang='ts'>
  import type { PageEntry } from '../lib/nav.svelte'
  import Icon from '@iconify/svelte'
  import { nav } from '../lib/nav.svelte'
  import Combos from '../pages/Combos.svelte'
  import Firmware from '../pages/Firmware.svelte'
  import Layers from '../pages/Layers.svelte'
  import Macros from '../pages/Macros.svelte'
  import Settings from '../pages/Settings.svelte'
  import Wireless from '../pages/Wireless.svelte'

  const tools = [
    { name: 'Layers', icon: 'lucide:layers', page: { title: 'Layers', component: Layers } satisfies PageEntry },
    { name: 'Macros', icon: 'lucide:zap', page: { title: 'Macros', component: Macros } satisfies PageEntry },
    { name: 'Combos', icon: 'lucide:combine', page: { title: 'Combos', component: Combos } satisfies PageEntry },
    { name: 'Wireless', icon: 'lucide:bluetooth', page: { title: 'Wireless', component: Wireless } satisfies PageEntry },
    { name: 'Firmware', icon: 'lucide:cpu', page: { title: 'Firmware', component: Firmware } satisfies PageEntry },
    { name: 'Settings', icon: 'lucide:settings', page: { title: 'Settings', component: Settings } satisfies PageEntry },
  ] as const
</script>

<div
  class='
    flex h-12 w-fit items-center gap-1 rounded-xl bg-base-100 px-2 py-1
    shadow-lg ring ring-base-300
  '
>
  {#each tools as tool (tool.name)}
    <button
      class='
        flex cursor-pointer items-center gap-1 rounded-xl p-2 text-base-content
        hover:bg-base-300
      '
      onclick={() => nav.open(tool.page)}
    >
      <Icon icon={tool.icon} />
      <span class='text-sm'>{tool.name}</span>
    </button>
  {/each}
</div>
