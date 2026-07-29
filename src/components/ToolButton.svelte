<script lang='ts'>
  import Icon from '@iconify/svelte'

  type Props = {
    name: string
    icon: string
    onClick: () => void
  }

  const { name, icon, onClick }: Props = $props()
</script>

<button
  class='
    flex cursor-pointer items-center gap-1 rounded-xl p-2 text-base-content
    hover:bg-base-300
  '
  onclick={onClick}
>
  <Icon {icon} />
  <span class='text-sm'>{name}</span>
</button>
