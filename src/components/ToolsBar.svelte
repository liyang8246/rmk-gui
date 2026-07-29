<script lang='ts'>
  import Icon from '@iconify/svelte'

  function noop() {}
</script>

{#snippet toolButton(name: string, icon: string)}
  <button
    class='
      flex cursor-pointer items-center gap-1 rounded-xl p-2 text-base-content
      hover:bg-base-300
    '
    onclick={noop}
  >
    <Icon {icon} />
    <span class='text-sm'>{name}</span>
  </button>
{/snippet}

<div
  class='
    flex h-12 w-fit items-center gap-1 rounded-xl bg-base-100 px-2 py-1
    shadow-lg ring ring-base-300
  '
>
  {@render toolButton('Layers', 'lucide:layers')}
  {@render toolButton('Macros', 'lucide:zap')}
  {@render toolButton('Combos', 'lucide:combine')}
  {@render toolButton('Wireless', 'lucide:bluetooth')}
  {@render toolButton('Firmware', 'lucide:cpu')}
  {@render toolButton('Setting', 'lucide:settings')}
</div>
