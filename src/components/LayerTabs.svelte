<script lang='ts'>
  import Icon from '@iconify/svelte'
  import { RadioGroup } from 'bits-ui'
  import { layerColor } from '../lib/layer-colors'

  interface Props {
    count: number
    layer: number
    onselect: (layer: number) => void
  }

  const { count, layer, onselect }: Props = $props()
</script>

<div class='flex items-center gap-[5px]'>
  <span class='
    mr-px text-[10px] font-bold tracking-[0.06em] text-muted-foreground
    uppercase
  '>
    Layer
  </span>
  <RadioGroup.Root
    class='noscroll flex gap-0.5 overflow-x-auto'
    orientation='horizontal'
    bind:value={() => String(layer), v => onselect(Number(v))}
  >
    {#each { length: count } as _, i (i)}
      {@const on = i === layer}
      <RadioGroup.Item
        class={[
          `
            inline-flex h-6.5 flex-none cursor-pointer items-center gap-[5px]
            rounded-full border px-[9px] font-sans text-xs font-bold
            transition-colors
          `,
          on
            ? 'border-brand bg-brand-tint text-brand-darker'
            : `
              border-border text-muted-foreground
              hover:bg-base-200
            `,
        ]}
        value={String(i)}
      >
        <span class='size-2 rounded-full' style:background={layerColor(i)}></span>
        {i}
      </RadioGroup.Item>
    {/each}
  </RadioGroup.Root>
  <!-- The layer count is fixed at build time by the firmware's keyboard.toml. -->
  <button
    class={`
      inline-flex size-6.5 flex-none cursor-not-allowed items-center
      justify-center rounded-full border border-dashed border-border
      text-muted-foreground opacity-45
    `}
    type='button'
    disabled
    aria-label='Add layer'
    title='The layer count is fixed by the firmware build'
  >
    <Icon icon='lucide:plus' width={13} height={13} />
  </button>
</div>
