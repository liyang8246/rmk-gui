<script lang='ts'>
  import { Dialog } from '@ark-ui/svelte/dialog'
  import Icon from '@iconify/svelte'
  import { nav } from './nav.svelte'
</script>

{#each nav.stack as page, i (page.uid)}
  <Dialog.Root
    open
    closeOnInteractOutside={false}
    onOpenChange={(e) => { if (!e.open) nav.back() }}
  >
    <Dialog.Backdrop class='fixed inset-0 bg-black/40 backdrop-blur-sm' />
    <Dialog.Positioner class='fixed inset-0 flex p-6'>
      <Dialog.Content class='
        flex size-full flex-col overflow-hidden rounded-2xl bg-base-100
        shadow-2xl
      '>
        <header class='
          flex items-center gap-3 border-b border-base-300 px-6 py-4
        '>
          {#if i > 0}
            <button
              class='
                flex cursor-pointer items-center rounded-lg p-2
                text-base-content
                hover:bg-base-300
              '
              onclick={() => nav.back()}
              aria-label='Back'
            >
              <Icon icon='lucide:arrow-left' />
            </button>
          {/if}
          <Dialog.Title class='text-lg font-semibold'>{page.title}</Dialog.Title>
          <div class='flex-1'></div>
          <button
            class='
              flex cursor-pointer items-center rounded-lg p-2 text-base-content
              hover:bg-base-300
            '
            onclick={() => nav.close()}
            aria-label='Close'
          >
            <Icon icon='lucide:x' />
          </button>
        </header>
        <div class='flex-1 overflow-auto p-6'>
          <page.component {...page.props} />
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>
{/each}
