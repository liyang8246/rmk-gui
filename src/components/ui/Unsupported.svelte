<script lang='ts'>
  import type { Snippet } from 'svelte'
  import Icon from '@iconify/svelte'

  interface Props {
    children: Snippet
  }

  const { children }: Props = $props()
</script>

<!-- Marks a control the design calls for that this firmware cannot honour, so a
     dimmed input never reads as a bug. -->
<span class='flex items-start gap-1.5 text-[11.5px] text-muted-foreground'>
  <Icon class='mt-px flex-none' icon='lucide:info' width={13} height={13} />
  <!-- One flex item, so emphasis inside the note stays inline text rather than
       becoming a sibling box. -->
  <span>{@render children()}</span>
</span>
