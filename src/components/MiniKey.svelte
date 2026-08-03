<script lang='ts'>
  import type { LabelSize, Tint } from '../lib/legend'
  import type { KeyAction } from '../rynk'
  import { drag } from '../lib/drag.svelte'
  import { labelSize } from '../lib/legend'
  import { span } from '../lib/picker-layout'

  interface Props {
    label: string
    /// Small second line where the label alone would be ambiguous: `num`, `web`.
    sub?: string
    /// Size in key units; height defaults to one.
    w?: number
    h?: number
    tint?: Tint
    title?: string
    /// Set to make the key a drag source for the board.
    action?: KeyAction
    onpick: () => void
  }

  const {
    label,
    sub,
    w = 1,
    h = 1,
    tint = 'base',
    title,
    action,
    onpick,
  }: Props = $props()

  /// The picker is a control surface, not a board: only layer/macro and
  /// transport keys are tinted, so the colour still means something. Modifiers
  /// stay plain — they are ordinary keys to bind.
  const TINTS: Record<Tint, string> = {
    base: 'border-kc-border bg-kc-top text-kc-fg',
    mod: 'border-kc-border bg-kc-top text-kc-fg',
    trns: 'border-kc-border bg-kc-top text-muted-foreground',
    layer: 'border-kc-amber-border bg-kc-amber-top text-kc-amber-fg',
    macro: 'border-kc-amber-border bg-kc-amber-top text-kc-amber-fg',
    wireless: 'border-kc-blue-border bg-kc-blue-top text-kc-blue-fg',
  }

  /// Three steps, shared by every key in the picker so equal-length legends
  /// always render at the same size.
  const SIZES: Record<LabelSize, string> = {
    lg: 'text-[13px]',
    md: 'text-[11px]',
    sm: 'text-[9px]',
  }
</script>

<button
  class={[
    `
      inline-flex shrink-0 cursor-pointer flex-col items-center justify-center
      gap-px overflow-hidden rounded-[7px] border px-0.5 font-semibold
      transition-colors
      hover:border-brand
    `,
    TINTS[tint],
  ]}
  style:width='{span(w)}px'
  style:height='{span(h)}px'
  type='button'
  title={title ?? label}
  draggable={action !== undefined}
  onclick={onpick}
  ondragstart={() => { if (action !== undefined) drag.start(action) }}
  ondragend={() => drag.end()}
>
  <span class={['text-center leading-[1.1] text-balance', SIZES[labelSize(label)]]}>
    {label}
  </span>
  {#if sub}
    <span class='text-[7px] leading-none opacity-55'>{sub}</span>
  {/if}
</button>
