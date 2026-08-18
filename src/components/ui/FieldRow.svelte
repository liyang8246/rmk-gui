<script lang='ts'>
  import type { Snippet } from 'svelte'

  interface Props {
    label: string
    /// Muted explanation after the control.
    hint?: string
    children: Snippet
  }

  const { label, hint, children }: Props = $props()
</script>

<!-- One layout for every advanced-section row: label column, control, note. -->
<div class='flex flex-wrap items-center gap-2.5'>
  <span class='w-30 flex-none text-[12.5px] font-semibold text-foreground'>
    {label}
  </span>
  {@render children()}
  {#if hint}
    <span class='text-xs text-muted-foreground'>{hint}</span>
  {/if}
</div>
