<script lang='ts'>
  import Icon from '@iconify/svelte'

  interface Props {
    /// Legend drawn on the chip; pass '—' for a key not yet picked.
    label: string
    /// Brand outline for the chip holding the item's result (its output).
    emphasis?: boolean
    title?: string
    disabled?: boolean
    onclick: () => void
    /// When set, a small × appears on hover to remove the chip in place.
    onremove?: () => void
    removeTitle?: string
  }

  const {
    label,
    emphasis = false,
    title,
    disabled = false,
    onclick,
    onremove,
    removeTitle = 'Remove',
  }: Props = $props()
</script>

<!-- The one shape for "a key you can click to change", so a keycap chip reads
     the same on every advanced page. -->
<span class='group relative inline-flex'>
  <button
    class={[
      `
        inline-flex h-[38px] min-w-10 cursor-pointer items-center justify-center
        rounded-[7px] px-2 text-sm font-bold transition-colors
        disabled:cursor-not-allowed disabled:opacity-45
      `,
      emphasis
        ? `
          border-2 border-brand bg-brand-tint text-brand-darker
          hover:enabled:bg-brand-tint-strong
        `
        : `
          border border-base-300 bg-base-100 text-foreground
          hover:enabled:border-brand
        `,
    ]}
    type='button'
    {title}
    {disabled}
    {onclick}
  >
    {label}
  </button>
  {#if onremove && !disabled}
    <button
      class={`
        absolute -top-1.5 -right-1.5 z-10 inline-flex size-4 cursor-pointer
        items-center justify-center rounded-full bg-foreground text-background
        opacity-0 transition-opacity
        group-hover:opacity-100
        focus-visible:opacity-100
      `}
      type='button'
      aria-label={removeTitle}
      title={removeTitle}
      onclick={onremove}
    >
      <Icon icon='lucide:x' width={10} height={10} />
    </button>
  {/if}
</span>
