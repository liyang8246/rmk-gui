<script lang='ts'>
  import type { Snippet } from 'svelte'

  interface Props {
    variant?: 'brand' | 'outline'
    size?: 'sm' | 'default'
    disabled?: boolean
    title?: string
    class?: string
    onclick?: () => void
    children: Snippet
  }

  const {
    variant = 'outline',
    size = 'default',
    disabled = false,
    title,
    class: klass = '',
    onclick,
    children,
  }: Props = $props()
</script>

<button
  class={[
    `
      inline-flex flex-none cursor-pointer items-center justify-center gap-2
      rounded-md font-sans font-semibold whitespace-nowrap transition-colors
      disabled:cursor-not-allowed disabled:opacity-45
    `,
    size === 'sm' ? 'h-8 px-3 text-[12.5px]' : 'h-9 px-4 text-[13px]',
    variant === 'brand'
      ? `
        bg-brand text-[#1a1205]
        hover:brightness-95
      `
      : `
        border border-border bg-card text-foreground
        hover:enabled:bg-base-200
      `,
    klass,
  ]}
  {title}
  {disabled}
  {onclick}
>
  {@render children()}
</button>
