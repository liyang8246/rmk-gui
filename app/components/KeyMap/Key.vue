<script lang="ts" setup>
const { keys, kleProps, select } = defineProps<{
  keys: [string | null, string | null]
  kleProps: InstanceType<typeof KleKey>
  select: [number, number, number, 'outer' | 'inner' | null]
}>()
const emit = defineEmits<{
  (e: 'click', zone: 'outer' | 'inner', key: [
    number,
    number,
    number,
  ]): void
}>()

const pageKeymapStore = usePageKeymapStore()

function insertLineBreaks(str: string, maxLength: number): string {
  return str.replace(new RegExp(`(.{${maxLength}})`, 'g'), '$1\n')
}
function insertLineBigSize(text: string): string {
  return text.replace(/([A-Z])/g, '\n$1')
}
function keyBreaks(key: string | null) {
  if (key === null) {
    return ''
  }
  if (key.length < Math.round(7 * pageKeymapStore.maxSize(kleProps.width, kleProps.width2))) {
    return key
  }
  const keys = insertLineBigSize(key).split('\n')
  for (let i = 0; i < keys.length; i++) {
    if (keys[i]!.length > Math.round(7 * pageKeymapStore.maxSize(kleProps.width, kleProps.width2))) {
      keys[i] = insertLineBreaks(keys[i]!, Math.round(6 * pageKeymapStore.maxSize(kleProps.width, kleProps.width2)))
    }
  }
  return keys.join('\n')
}

const KeyProp = computed(() => {
  return [pageKeymapStore.currLayer, ...kleProps.labels[0]?.split(',').map(n => Number.parseInt(n, 10)) as number[]] as [
    number,
    number,
    number,
  ]
})

function compareKeys(zone: 'outer' | 'inner' | null) {
  return [...KeyProp.value, zone].join(',') === select.join(',')
    ? 'bg-surface-400 dark:bg-surface-500 shadow-sm shadow-surface-600 dark:shadow-surface-800 text-surface-900 dark:text-surface-100'
    : 'bg-surface-300 dark:bg-surface-600 shadow-sm shadow-surface-400 dark:shadow-surface-900 text-surface-700 dark:text-surface-300'
}
</script>

<template>
  <div class="raletive">
    <label>
      <div
        class="rounded-prime-md absolute bg-surface-300 dark:bg-surface-600"
        :style="{
          width: pageKeymapStore.fixSize(kleProps.width2),
          height: pageKeymapStore.fixSize(kleProps.height2),
        }"
      />
      <!-- kc -->
      <div v-if="keys[0]" class="relative">
        <div
          class="rounded-prime-md absolute flex justify-center pt-[2px] transition-all duration-200"
          :class="compareKeys('outer')"
          :style="{
            width: pageKeymapStore.fixSize(kleProps.width),
            height: pageKeymapStore.fixSize(kleProps.height),
          }"
          @click.stop="emit('click', 'outer', KeyProp)"
        >
          <span>{{ keyBreaks(keys[0]) }}</span>
        </div>
        <div
          class="rounded-prime-md absolute flex items-center justify-center border-t-2 border-surface-800 transition-all duration-200 dark:border-surface-200"
          :class="compareKeys('inner')"
          :style="{
            top: '18px',
            left: `${pageKeymapStore.keyMargin / 2}px`,
            width: `${kleProps.width * 56 - pageKeymapStore.keyMargin * 2}px`,
            height: `${kleProps.height * 56 - pageKeymapStore.keyMargin * 1.5 - 18}px`,
          }"
          @click.stop="emit('click', 'inner', KeyProp)"
        >
          <span>{{ keyBreaks(keys[1]) }}</span>
        </div>
      </div>
      <!-- key -->
      <div
        v-else
        class="rounded-prime-md absolute flex items-center justify-center transition-all duration-200"
        :class="compareKeys('outer')"
        :style="{
          width: pageKeymapStore.fixSize(kleProps.width),
          height: pageKeymapStore.fixSize(kleProps.height),
        }"
        @click.stop="emit('click', 'outer', KeyProp)"
      >
        <span>{{ keyBreaks(keys[1]) }}</span>
      </div>
    </label>
  </div>
</template>
