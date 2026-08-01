<script lang='ts'>
  import { match } from 'ts-pattern'
  import { describeKeyboardError, keyboardStore } from '../stores'

  const text = $derived.by(() => {
    const c = keyboardStore.connection
    if (!c) return 'No keyboard'
    // Exhaustive: a new ConnectionPhase fails this build instead of silently
    // rendering the wrong message.
    return match(c.phase)
      .with('connected', () => c.label)
      .with('connecting', () => `Connecting to ${c.label}…`)
      .with('disconnected', () => `${c.label} — disconnected`)
      .with('error', () => `${c.label} — ${c.cause ? describeKeyboardError(c.cause) : 'link lost'}`)
      .exhaustive()
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
