<script lang='ts'>
  import type { Snippet } from 'svelte'

  interface Props {
    tone?: 'ok' | 'blue' | 'muted' | 'bad'
    /// Renders the small filled dot the status pills lead with.
    dot?: boolean
    children: Snippet
  }

  const { tone = 'muted', dot = false, children }: Props = $props()

  const TONES = {
    ok: 'border-ok-bright/30 bg-ok-bright/10 text-ok',
    blue: 'border-info/30 bg-info/10 text-info',
    muted: 'border-border bg-muted text-muted-foreground',
    bad: 'border-destructive/30 bg-destructive/10 text-destructive',
  }
</script>

<span
  class={[
    `
      inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-sans
      text-xs font-semibold whitespace-nowrap
    `,
    TONES[tone],
  ]}
>
  {#if dot}
    <span class='size-1.5 rounded-full bg-current'></span>
  {/if}
  {@render children()}
</span>
