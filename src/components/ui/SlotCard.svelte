<script lang='ts'>
  import type { Snippet } from 'svelte'
  import Card from './Card.svelte'
  import IconBtn from './IconBtn.svelte'

  interface Props {
    /// Slot identity, e.g. 'Combo 2' — the name delete toasts refer to.
    label: string
    /// Short usage note shown beside the label.
    hint?: string
    /// A drafted card nothing has been written to yet: ringed and scrolled
    /// into view so "New" visibly lands somewhere.
    fresh?: boolean
    deleteTitle: string
    deleteDisabled?: boolean
    ondelete: () => void
    /// Extra settings behind the card's gear toggle.
    advanced?: Snippet
    advancedTitle?: string
    children: Snippet
  }

  const {
    label,
    hint,
    fresh = false,
    deleteTitle,
    deleteDisabled = false,
    ondelete,
    advanced,
    advancedTitle = 'More settings',
    children,
  }: Props = $props()

  let open = $state(false)
  let el = $state<HTMLDivElement | null>(null)

  $effect(() => {
    if (fresh) el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
</script>

<!-- One card shell for every slot-backed item (combo, morse key, override,
     macro): identity on the left, gear and trash on the right, extra settings
     folded under a rule. -->
<div bind:this={el}>
  <Card class={fresh
    ? 'flex flex-col gap-3 ring-2 ring-brand/40'
    : `flex flex-col gap-3`}>
    <div class='flex items-center gap-2.5'>
      <span class='text-xs font-extrabold text-brand-darker'>{label}</span>
      {#if hint}
        <span class='text-[13px] text-muted-foreground'>{hint}</span>
      {/if}
      <div class='ml-auto flex items-center gap-1'>
        {#if advanced}
          <IconBtn
            icon='lucide:settings-2'
            title={advancedTitle}
            size={32}
            active={open}
            onclick={() => (open = !open)}
          />
        {/if}
        <IconBtn
          icon='lucide:trash-2'
          title={deleteTitle}
          size={32}
          disabled={deleteDisabled}
          onclick={ondelete}
        />
      </div>
    </div>

    {@render children()}

    {#if open && advanced}
      <div class='flex flex-col gap-2.5 border-t border-border pt-3'>
        {@render advanced?.()}
      </div>
    {/if}
  </Card>
</div>
