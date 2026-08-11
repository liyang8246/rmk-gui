<script lang='ts'>
  import type { Snippet } from 'svelte'
  import Button from './Button.svelte'
  import Overlay from './Overlay.svelte'

  interface Props {
    title: string
    confirmLabel: string
    onconfirm: () => void
    onclose: () => void
    children: Snippet
  }

  const { title, confirmLabel, onconfirm, onclose, children }: Props = $props()
</script>

<Overlay {title} {onclose} slim>
  <div class='flex flex-1 flex-col gap-4'>
    <div class='text-[13px] leading-relaxed text-muted-foreground'>
      {@render children()}
    </div>
    <div class='mt-auto flex justify-end gap-2'>
      <Button onclick={onclose}>Cancel</Button>
      <Button
        variant='brand'
        onclick={() => {
          onconfirm()
          onclose()
        }}
      >
        {confirmLabel}
      </Button>
    </div>
  </div>
</Overlay>
