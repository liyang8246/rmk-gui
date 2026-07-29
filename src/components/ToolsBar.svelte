<script lang='ts'>
  import ToolButton from './ToolButton.svelte'

  function noop() {}
</script>

<div
  class='
    flex h-12 w-fit items-center gap-1 rounded-xl bg-base-100 px-2 py-1
    shadow-lg ring ring-base-300
  '
>
  <ToolButton name='Layers' icon='lucide:layers' onClick={noop} />
  <ToolButton name='Macros' icon='lucide:zap' onClick={noop} />
  <ToolButton name='Combos' icon='lucide:combine' onClick={noop} />
  <ToolButton name='Wireless' icon='lucide:bluetooth' onClick={noop} />
  <ToolButton name='Firmware' icon='lucide:cpu' onClick={noop} />
  <ToolButton name='Setting' icon='lucide:settings' onClick={noop} />
</div>
