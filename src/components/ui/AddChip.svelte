<script lang='ts'>
  import Icon from '@iconify/svelte'

  interface Props {
    /// Omitted for the icon-only square that stands in a row of key chips.
    label?: string
    title: string
    disabled?: boolean
    onclick: () => void
  }

  const { label, title, disabled = false, onclick }: Props = $props()
</script>

<!-- The one dashed "add another" affordance: labelled when it adds a kind of
     thing, a bare square when it adds a key beside 38px chips. -->
<button
  class={[
    `
      inline-flex cursor-pointer items-center justify-center gap-1.5 border
      border-dashed border-border font-semibold text-muted-foreground
      transition-colors
      hover:enabled:border-brand hover:enabled:text-brand-darker
      disabled:cursor-not-allowed disabled:opacity-45
    `,
    label ? 'h-8 rounded-md px-2.5 text-xs' : 'size-[38px] rounded-[7px]',
  ]}
  type='button'
  {title}
  aria-label={title}
  {disabled}
  {onclick}
>
  <Icon icon='lucide:plus' width={label ? 13 : 15} height={label ? 13 : 15} />
  {#if label}{label}{/if}
</button>
