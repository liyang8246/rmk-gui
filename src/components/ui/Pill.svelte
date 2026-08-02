<script lang='ts'>
  import type { Snippet } from 'svelte'
  import Icon from '@iconify/svelte'

  interface Props {
    tone?: 'ok' | 'blue' | 'muted'
    icon?: string
    /// Renders the small filled dot the status pills lead with.
    dot?: boolean
    children: Snippet
  }

  const { tone = 'muted', icon, dot = false, children }: Props = $props()

  const TONES = {
    ok: 'border-ok-bright/30 bg-ok-bright/10 text-ok',
    blue: 'border-info/30 bg-info/10 text-info',
    muted: 'border-border bg-muted text-muted-foreground',
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
  {#if icon}
    <Icon {icon} width={14} height={14} />
  {/if}
  {@render children()}
</span>
