<script lang='ts'>
  import type { Tint } from '../lib/legend'
  import type { KeyAction, Rect } from '../rynk'
  import { keyActionText } from '../lib/keycode'
  import { capFontSize, capLegend } from '../lib/legend'

  interface Props {
    action: KeyAction
    /// Key-unit geometry in the layout's own frame; `rect2` draws the second
    /// face of an ISO-style key, which rotates with the first.
    rect: Rect
    rect2?: Rect
    rotation: number
    /// Layout origin, so the cap can place itself against the board's box.
    originX: number
    originY: number
    unit: number
    selected?: boolean
    /// Marks a key that overrides the layer beneath it.
    overridden?: boolean
    dragOver?: boolean
    onclick?: () => void
    ondropaction?: () => void
    ondragstate?: (over: boolean) => void
  }

  const {
    action,
    rect,
    rect2,
    rotation,
    originX,
    originY,
    unit,
    selected = false,
    overridden = false,
    dragOver = false,
    onclick,
    ondropaction,
    ondragstate,
  }: Props = $props()

  const TINTS: Record<Tint, string> = {
    base: 'bg-kc-top border-kc-border text-kc-fg',
    mod: 'bg-kc-mod-top border-kc-border text-kc-fg-soft',
    layer: 'bg-kc-amber-top border-kc-amber-border text-kc-amber-fg',
    macro: 'bg-kc-amber-top border-kc-amber-border text-kc-amber-fg',
    wireless: 'bg-kc-blue-top border-kc-blue-border text-kc-blue-fg',
    trns: 'bg-kc-trns-top border-kc-border text-muted-foreground',
  }

  const legend = $derived(capLegend(action))
  const transparent = $derived(action === 'Transparent' || action === 'No')
  // The design's flat cap: gap scales with the unit, corners at a fifth of it.
  const pad = $derived(Math.max(2.5, unit * 0.05))
  const radius = $derived(Math.max(3, unit * 0.2))
  const faces = $derived([rect, rect2].filter(r => r !== undefined))
</script>

<div
  class='absolute size-0'
  style:left='{(rect.x - originX) * unit}px'
  style:top='{(rect.y - originY) * unit}px'
  style:transform='rotate({rotation}deg)'
  style:z-index={selected ? 3 : rotation ? 2 : 1}
>
  {#each faces as face, i (i)}
    <div
      class='absolute box-border'
      style:left='{(face.x - rect.x - face.w / 2) * unit + pad}px'
      style:top='{(face.y - rect.y - face.h / 2) * unit + pad}px'
      style:width='{face.w * unit - pad * 2}px'
      style:height='{face.h * unit - pad * 2}px'
    >
      <button
        class={[
          `
            flex size-full cursor-pointer flex-col items-center justify-center
            gap-px overflow-hidden border text-center leading-[1.05]
            transition-[box-shadow,background-color,border-color] duration-100
          `,
          dragOver
            ? 'border-kc-amber-border bg-kc-amber-top'
            : TINTS[legend.tint],
          selected && 'border-2 border-brand shadow-[0_0_0_3px_var(--kc-ring)]',
          transparent && !selected && 'opacity-55',
        ]}
        style:border-radius='{radius}px'
        type='button'
        title={keyActionText(action)}
        tabindex={i === 0 ? 0 : -1}
        aria-pressed={selected}
        {onclick}
        ondragover={(e) => {
          if (!ondropaction) return
          e.preventDefault()
          ondragstate?.(true)
        }}
        ondragleave={() => ondragstate?.(false)}
        ondrop={(e) => {
          if (!ondropaction) return
          e.preventDefault()
          ondragstate?.(false)
          ondropaction()
        }}
      >
        {#if i === 0}
          <span
            class='px-px leading-[1.1] font-medium text-balance'
            style:font-size='{capFontSize(legend.main, unit)}px'
            style:letter-spacing={legend.main.length > 3 ? '-0.01em' : '0.01em'}
          >{legend.main}</span>
          {#if legend.tag}
            <span
              class='font-semibold opacity-55'
              style:font-size='{Math.max(7, unit * 0.15)}px'
            >{legend.tag}</span>
          {/if}
          {#if overridden && !selected}
            <span class='
              absolute top-1 right-[5px] size-[4.5px] rounded-full bg-brand
            '></span>
          {/if}
        {/if}
      </button>
    </div>
  {/each}
</div>
