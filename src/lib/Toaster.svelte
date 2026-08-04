<script lang='ts'>
  import type { ToastType } from './toast.svelte'
  import Icon from '@iconify/svelte'
  import { toast } from './toast.svelte'

  /// Most of the app's toasts carry a `describeKeyboardError`, so the icon has
  /// to name the type. Lucide's `check-circle`/`alert-triangle`/`x-circle` are
  /// aliases, and `scripts/build-icons.ts` bundles only canonical names.
  const ICONS: Record<ToastType, { icon: string, class: string }> = {
    success: { icon: 'lucide:circle-check', class: 'text-ok' },
    warning: { icon: 'lucide:triangle-alert', class: 'text-brand-darker' },
    error: { icon: 'lucide:circle-x', class: 'text-destructive' },
    info: { icon: 'lucide:info', class: 'text-info' },
  }
</script>

<div
  class='
    pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center
    gap-2
  '
  aria-live='polite'
>
  {#each toast.items as t (t.id)}
    <!-- items-start with the icon nudged down: on a one-line toast that lands
         where items-center did, and a detail line grows below rather than
         pushing the icon into the middle of the block. -->
    <div
      role='status'
      class='
        pointer-events-auto flex max-w-[420px] animate-toast items-start gap-2.5
        rounded-md border border-border bg-card px-[18px] py-[11px]
        text-foreground shadow-card
      '
      onmouseenter={() => toast.hold(t.id)}
      onmouseleave={() => toast.release(t.id)}
    >
      <Icon
        class={`
          ${ICONS[t.type].class}
          mt-0.5 flex-none
        `}
        icon={ICONS[t.type].icon}
        width={16}
        height={16}
      />
      <span class='min-w-0'>
        <span class='block text-[13.5px] font-semibold'>{t.title}</span>
        {#if t.detail}
          <span class='mt-0.5 block text-xs/relaxed text-muted-foreground'>
            {t.detail}
          </span>
        {/if}
      </span>
      <button
        type='button'
        aria-label='Dismiss'
        class='
          ml-auto cursor-pointer p-1 text-muted-foreground
          hover:text-foreground
        '
        onclick={() => toast.dismiss(t.id)}
      >
        <Icon icon='lucide:x' width={14} height={14} />
      </button>
    </div>
  {/each}
</div>
