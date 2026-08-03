<script lang='ts'>
  import type { Snippet } from 'svelte'
  import { Dialog } from 'bits-ui'
  import IconBtn from './IconBtn.svelte'

  interface Props {
    title: string
    subtitle?: string
    onclose: () => void
    children: Snippet
  }

  const { title, subtitle, onclose, children }: Props = $props()
</script>

<!-- The parent mounts this only while open, so the dialog is always open and
     every way out — Escape, the backdrop, the close button — funnels through
     `onclose`. Focus trapping and scroll lock come with Dialog. -->
<Dialog.Root open onOpenChange={(open) => { if (!open) onclose() }}>
  <Dialog.Portal>
    <Dialog.Overlay
      class={`
        fixed inset-0 z-90 animate-fade bg-[rgb(15_12_8/0.42)]
        backdrop-blur-[3px]
      `}
    />
    <Dialog.Content
      class={`
        fixed top-1/2 left-1/2 z-90 flex h-[min(560px,86%)] w-[min(900px,92%)]
        -translate-1/2 flex-col overflow-hidden rounded-lg border border-border
        bg-background shadow-lg
      `}
    >
      <div class='
        flex items-center gap-3 border-b border-border px-[18px] py-3.5
      '>
        <div>
          <Dialog.Title class='
            text-base font-extrabold tracking-tight text-foreground
          '>
            {title}
          </Dialog.Title>
          {#if subtitle}
            <Dialog.Description class='mt-0.5 text-xs text-muted-foreground'>
              {subtitle}
            </Dialog.Description>
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
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
