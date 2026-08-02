<script lang='ts'>
  import Icon from '@iconify/svelte'
  import { toast } from '../lib/toast.svelte'
</script>

{#if toast.message}
  <div
    class={`
      absolute bottom-[22px] left-1/2 z-50 flex -translate-x-1/2 animate-toast
      items-center gap-2.5 rounded-md bg-foreground px-[18px] py-[11px]
      text-[13.5px] font-semibold text-background shadow-lg
    `}
    role='status'
  >
    <Icon class='text-brand' icon='lucide:check' width={16} height={16} />
    {toast.message}
  </div>
{/if}
