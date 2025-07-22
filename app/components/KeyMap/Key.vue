<script lang="ts" setup>
const {
  keys = [null, null],
  kleProps = {
    width: 1,
    height: 1,
    width2: 1,
    height2: 1,
    labels: ['0, 0'],
  },
  select,
  keyMargin = 6,
} = defineProps<{
  keys?: [string | null, string | null]
  kleProps?: {
    width: number
    height: number
    width2: number
    height2: number
    labels: string[]
  }
  select: [number, number, number, string | null, string | null, 'outer' | 'inner' | null]
  keyMargin?: number
}>()

const emit = defineEmits<{
  (e: 'click', zone: 'outer' | 'inner', key: [
    number,
    number,
    number,
    string | null,
    string | null,
  ]): void
}>()

const pageKeymapStore = usePageKeymapStore()

function fixSize(size: number): string {
  return `calc(56px * ${size} - ${keyMargin}px)`
}
function maxSize(size1: number, size2: number): number {
  return size1 > size2 ? size1 : size2
}

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
  if (key.length < Math.round(7 * maxSize(kleProps.width, kleProps.width2))) {
    return key
  }
  const keys = insertLineBigSize(key).split('\n')
  for (let i = 0; i < keys.length; i++) {
    if (keys[i]!.length > Math.round(7 * maxSize(kleProps.width, kleProps.width2))) {
      keys[i] = insertLineBreaks(keys[i]!, Math.round(6 * maxSize(kleProps.width, kleProps.width2)))
    }
  }
  return keys.join('\n')
}

const KeyProp = computed(() => {
  return [pageKeymapStore.currLayer, ...kleProps.labels[0]?.split(',').map(n => Number.parseInt(n, 10)) as [number, number], ...keys] as [
    number,
    number,
    number,
    string | null,
    string | null,
  ]
})
const keyPropValue = KeyProp.value
function isOuterStyle() {
  return [...keyPropValue, 'outer'].join(',') === select.join(',')
    ? 'bg-primary-100 dark:bg-primary-600 text-surface-900 dark:text-surface-100'
    : 'bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-300'
}
function isOuterShadow() {
  return [...keyPropValue, 'outer'].join(',') === select.join(',')
    ? 'shadow-[0_1px_1px_1px] shadow-primary-600 dark:shadow-primary-900'
    : 'shadow-[0_1px_1px_1px] shadow-surface-400 dark:shadow-surface-900'
}
function isInnerStyle() {
  return [...keyPropValue, 'inner'].join(',') === select.join(',')
    ? 'bg-primary-100 dark:bg-primary-600 text-surface-900 dark:text-surface-100 shadow-[0_1px_1px_1px] shadow-primary-600 dark:shadow-primary-900'
    : 'bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-300 shadow-[0_1px_1px_1px] shadow-surface-400 dark:shadow-surface-900'
}
</script>

<template>
  <div
    class="rounded-prime-md raletive"
    :style="{
      width: fixSize(maxSize(kleProps.width, kleProps.width2)),
      height: fixSize(maxSize(kleProps.height, kleProps.height2)),
    }"
  >
    <label>
      <div
        class="rounded-prime-md absolute z-1 transition-all duration-200"
        :class="isOuterShadow()"
        :style="{
          width: fixSize(kleProps.width2),
          height: fixSize(kleProps.height2),
        }"
      />
      <div
        class="rounded-prime-md absolute z-2 transition-all duration-200"
        :class="isOuterShadow()"
        :style="{
          width: fixSize(kleProps.width),
          height: fixSize(kleProps.height),
        }"
      />
      <div
        class="rounded-prime-md absolute z-3 transition-all duration-200"
        :class="isOuterStyle()"
        :style="{
          width: fixSize(kleProps.width2),
          height: fixSize(kleProps.height2),
        }"
        @click.stop="emit('click', 'outer', KeyProp)"
      />
      <!-- kc -->
      <div v-if="keys[0]" class="relative">
        <div
          class="rounded-prime-md absolute flex justify-center pt-[2px] transition-all duration-200 z-5"
          :class="isOuterStyle()"
          :style="{
            width: fixSize(kleProps.width),
            height: fixSize(kleProps.height),
          }"
          @click.stop="emit('click', 'outer', KeyProp)"
        >
          <span>{{ keyBreaks(keys[0]) }}</span>
        </div>
        <div
          class="rounded-prime-md absolute flex items-center justify-center border-t-2 border-surface-800 dark:border-surface-200 z-6 transition-all duration-200"
          :class="isInnerStyle()"
          :style="{
            top: '18px',
            left: `${keyMargin / 2}px`,
            width: `${kleProps.width * 56 - keyMargin * 2}px`,
            height: `${kleProps.height * 56 - keyMargin * 1.5 - 18}px`,
          }"
          @click.stop="emit('click', 'inner', KeyProp)"
        >
          <span>{{ keyBreaks(keys[1]) }}</span>
        </div>
      </div>
      <!-- key -->
      <div
        v-else
        class="rounded-prime-md absolute flex items-center justify-center transition-all duration-200 z-5"
        :class="isOuterStyle()"
        :style="{
          width: fixSize(kleProps.width),
          height: fixSize(kleProps.height),
        }"
        @click.stop="emit('click', 'outer', KeyProp)"
      >
        <span>{{ keyBreaks(keys[1]) }}</span>
      </div>
    </label>
  </div>
</template>
