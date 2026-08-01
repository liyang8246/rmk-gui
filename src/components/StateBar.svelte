<script lang='ts'>
  import { keyboardStore } from '../stores'

  const text = $derived.by(() => {
    const c = keyboardStore.connection
    if (!c) return 'No keyboard'
    if (c.phase === 'connected') return c.label
    if (c.phase === 'connecting') return `Connecting to ${c.label}…`
    if (c.phase === 'disconnected') return `${c.label} — disconnected`
    return `${c.label} — link lost`
  })
</script>

<div
  class='
    flex h-8 w-fit items-center gap-1 rounded-xl bg-base-100 px-2 py-1 text-sm
    shadow-lg ring ring-base-300
  '
>
  {text}
</div>
