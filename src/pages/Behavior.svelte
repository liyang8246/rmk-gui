<script lang='ts'>
  import type { BehaviorConfig } from '../rynk'
  import Icon from '@iconify/svelte'
  import Card from '../components/ui/Card.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import Slider from '../components/ui/Slider.svelte'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  interface Setting {
    field: keyof BehaviorConfig
    title: string
    desc: string
    min: number
    max: number
    step: number
  }

  /// Every global timing the protocol exposes, in the order they take effect:
  /// how a tap is emitted, then how long the keyboard waits for a second input.
  const SETTINGS: Setting[] = [
    {
      field: 'tap_interval_ms',
      title: 'Tap interval',
      desc: 'How long a synthesised tap holds the key down before releasing it.',
      min: 0,
      max: 200,
      step: 5,
    },
    {
      field: 'tap_capslock_interval_ms',
      title: 'Caps Lock tap interval',
      desc: 'Caps Lock needs a longer press than other keys on some hosts.',
      min: 0,
      max: 500,
      step: 10,
    },
    {
      field: 'combo_timeout_ms',
      title: 'Combo term',
      desc: 'Keys pressed within this window count as a combo.',
      min: 10,
      max: 120,
      step: 5,
    },
    {
      field: 'oneshot_timeout_ms',
      title: 'One-shot timeout',
      desc: 'Cancel a pending one-shot modifier or layer if no key follows in time.',
      min: 0,
      max: 5000,
      step: 100,
    },
  ]

  /// Settings a configurator would normally offer that this protocol has no
  /// global home for. Listed rather than drawn as dead sliders.
  const ELSEWHERE = [
    {
      title: 'Tapping term, permissive hold, quick tap, hold-on-other-key-press',
      where: 'Set per key on its morse profile, not keyboard-wide.',
    },
    {
      title: 'Tap dance term',
      where: 'Part of each morse key\'s own profile.',
    },
    {
      title: 'One-shot retap to hold',
      where: 'Not implemented by the firmware.',
    },
    {
      title: 'Mouse cursor speed',
      where: 'A firmware build option, fixed at compile time.',
    },
  ]

  let showElsewhere = $state(false)

  const behavior = $derived(keyboardStore.config?.behavior)

  function update(field: keyof BehaviorConfig, value: number) {
    if (!behavior) return
    void keyboardStore
      .setBehavior({ ...behavior, [field]: value })
      .mapErr(e => toast.error(describeKeyboardError(e)))
  }
</script>

<ScreenScroll
  title='Behavior'
  desc='Keyboard-side timing. Changes are written to the keyboard as you make them.'
>
  <Card flush>
    {#each SETTINGS as setting, i (setting.field)}
      <div
        class={[
          'flex items-center gap-[14px] px-4 py-[18px]',
          i < SETTINGS.length - 1 && 'border-b border-border',
        ]}
      >
        <div class='max-w-105'>
          <div class='text-[13.5px] font-semibold text-foreground'>{setting.title}</div>
          <div class='text-xs text-muted-foreground'>{setting.desc}</div>
        </div>
        <div class='ml-auto flex items-center gap-3'>
          <Slider
            label={setting.title}
            value={behavior?.[setting.field] ?? 0}
            min={setting.min}
            max={setting.max}
            step={setting.step}
            disabled={!behavior}
            onchange={v => update(setting.field, v)}
          />
        </div>
      </div>
    {/each}
  </Card>

  <div class='mt-4'>
    <button
      class={`
        flex w-full cursor-pointer items-center gap-2 rounded-lg border
        border-border px-4 py-3 text-left text-[12.5px] font-semibold
        text-muted-foreground transition-colors
        hover:bg-base-200
      `}
      type='button'
      aria-expanded={showElsewhere}
      onclick={() => (showElsewhere = !showElsewhere)}
    >
      <Icon
        class='transition-transform'
        style={showElsewhere ? 'transform: rotate(90deg)' : ''}
        icon='lucide:chevron-right'
        width={15}
        height={15}
      />
      {ELSEWHERE.length} settings this firmware doesn't expose here
    </button>

    {#if showElsewhere}
      <Card class='mt-2' flush>
        {#each ELSEWHERE as item, i (item.title)}
          <div
            class={[
              'px-4 py-3',
              i < ELSEWHERE.length - 1 && 'border-b border-border',
            ]}
          >
            <div class='text-[13px] font-semibold text-foreground'>{item.title}</div>
            <div class='text-xs text-muted-foreground'>{item.where}</div>
          </div>
        {/each}
      </Card>
    {/if}
  </div>
</ScreenScroll>
