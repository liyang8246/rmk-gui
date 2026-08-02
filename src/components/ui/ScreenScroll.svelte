<script lang='ts'>
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    desc?: string
    actions?: Snippet
    children: Snippet
  }

  const { title, desc, actions, children }: Props = $props()
</script>

<div class='min-w-0 flex-1 overflow-y-auto'>
  <div class='mx-auto max-w-[880px] px-8 pt-7 pb-12'>
    <div class='mb-[22px] flex items-end gap-4'>
      <div>
        <h1 class='text-2xl font-extrabold tracking-tight text-foreground'>
          {title}
        </h1>
        {#if desc}
          <p class='mt-1 text-[13.5px] text-muted-foreground'>{desc}</p>
        {/if}
      </div>
      {#if actions}
        <div class='ml-auto flex gap-2'>{@render actions()}</div>
      {/if}
    </div>
    {@render children()}
  </div>
</div>
