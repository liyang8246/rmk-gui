<script lang='ts'>
  import type { Snippet } from 'svelte'
  import Card from './Card.svelte'

  interface Props {
    children: Snippet
  }

  const { children }: Props = $props()
</script>

<!-- The one empty state: for firmware built without a feature, and for a
     feature with nothing configured yet. -->
<Card>
  <p class='py-3 text-center text-[13px] text-muted-foreground'>
    {@render children()}
  </p>
</Card>
