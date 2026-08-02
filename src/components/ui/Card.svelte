<script lang='ts'>
  import type { Snippet } from 'svelte'

  interface Props {
    /// Rows draw their own padding, so list-style cards opt out of the card's.
    flush?: boolean
    class?: string
    children: Snippet
  }

  const { flush = false, class: klass = '', children }: Props = $props()
</script>

<div
  class={[
    'rounded-lg border border-border bg-card shadow-xs',
    flush ? '' : 'p-[18px]',
    klass,
  ]}
>
  {@render children()}
</div>
