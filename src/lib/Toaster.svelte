<script lang='ts'>
  import { Toast, Toaster } from '@ark-ui/svelte/toast'
  import Icon from '@iconify/svelte'
  import { toaster } from './toast.svelte'

  const icons: Record<string, { icon: string, class: string }> = {
    success: { icon: 'lucide:check-circle', class: 'text-success' },
    warning: { icon: 'lucide:alert-triangle', class: 'text-warning' },
    error: { icon: 'lucide:x-circle', class: 'text-error' },
    info: { icon: 'lucide:info', class: 'text-base-content' },
    loading: { icon: 'lucide:loader-circle', class: 'animate-spin text-base-content' },
  }
</script>

<Toaster {toaster}>
  {#snippet children(toast)}
    {@const t = toast()}
    {@const meta = icons[t.type ?? 'info']}
    <Toast.Root>
      <div class='flex items-center gap-3'>
        <Icon icon={meta.icon} class={meta.class} />
        <div class='flex flex-col gap-1'>
          {#if t.title}
            <Toast.Title class='text-sm font-semibold'>{t.title}</Toast.Title>
          {/if}
          {#if t.description}
            <Toast.Description class='text-xs text-base-content/70'>{t.description}</Toast.Description>
          {/if}
        </div>
        <Toast.CloseTrigger class='
          ml-auto cursor-pointer p-1 text-base-content/50
          hover:text-base-content
        '>
          <Icon icon='lucide:x' />
        </Toast.CloseTrigger>
      </div>
    </Toast.Root>
  {/snippet}
</Toaster>
