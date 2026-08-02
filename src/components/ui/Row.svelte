<script lang='ts'>
  import type { Snippet } from 'svelte'

  interface Props {
    class?: string
    children: Snippet
  }

  const { class: klass = '', children }: Props = $props()
</script>

<div class={['flex items-center gap-[14px] px-4 py-[14px]', klass]}>
  {@render children()}
</div>
