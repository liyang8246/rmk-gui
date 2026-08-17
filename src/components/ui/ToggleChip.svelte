<script lang='ts'>
  import type { Snippet } from 'svelte'

  interface Props {
    pressed: boolean
    title?: string
    /// Modifier abbreviations line up better in the mono face.
    mono?: boolean
    onclick: () => void
    children: Snippet
  }

  const { pressed, title, mono = false, onclick, children }: Props = $props()
</script>

<!-- A small on/off chip for boolean conditions (modifiers, Caps, chainable):
     brand-tinted while set, muted while not. -->
<button
  class={[
    `
      inline-flex h-6.5 cursor-pointer items-center gap-1 rounded-md border
      px-1.5 text-[11px] font-bold transition-colors
    `,
    mono && 'font-mono',
    pressed
      ? 'border-brand bg-brand-tint text-brand-darker'
      : `
        border-border text-muted-foreground
        hover:text-foreground
      `,
  ]}
  type='button'
  aria-pressed={pressed}
  {title}
  {onclick}
>
  {@render children()}
</button>
