<script lang='ts'>
  import type { Snippet } from 'svelte'
  import IconBtn from './IconBtn.svelte'

  interface Props {
    title: string
    subtitle?: string
    onclose: () => void
    children: Snippet
  }

  const { title, subtitle, onclose, children }: Props = $props()
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') onclose() }} />

<div
  class={`
    fixed inset-0 z-90 flex animate-fade items-center justify-center
    bg-[rgb(15_12_8/0.42)] backdrop-blur-[3px]
  `}
  role='presentation'
  onclick={onclose}
>
  <div
    class={`
      flex h-[min(560px,86%)] w-[min(900px,92%)] flex-col overflow-hidden
      rounded-lg border border-border bg-background shadow-lg
    `}
    role='dialog'
    aria-modal='true'
    aria-label={title}
    tabindex='-1'
    onclick={e => e.stopPropagation()}
    onkeydown={e => e.stopPropagation()}
  >
    <div class='
      flex items-center gap-3 border-b border-border px-[18px] py-3.5
    '>
      <div>
        <h2 class='text-base font-extrabold tracking-tight text-foreground'>
          {title}
        </h2>
        {#if subtitle}
          <p class='mt-0.5 text-xs text-muted-foreground'>{subtitle}</p>
        {/if}
      </div>
      <IconBtn
        class='ml-auto'
        icon='lucide:x'
        title='Close'
        size={34}
        onclick={onclose}
      />
    </div>
    <div class='flex min-h-0 flex-1 px-4 pt-3.5 pb-4'>
      {@render children()}
    </div>
  </div>
</div>
