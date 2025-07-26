<script lang="ts" setup>
const {
  keys = [null, null],
  kleProps = {
    width: 1,
    height: 1,
    width2: 1,
    height2: 1,
  },
  select,
  keyMargin = 6,
  defaultKeySize = 48,
} = defineProps<{
  keys?: [string | null, string | null]
  kleProps?: {
    width: number
    height: number
    width2: number
    height2: number
  }
  select?: 'outer' | 'inner' | null
  keyMargin?: number
  defaultKeySize?: number
}>()

const emit = defineEmits<{
  (e: 'click', zone: 'outer' | 'inner'): void
}>()
function fitKeySize(size: number): string {
  return `${defaultKeySize * size - keyMargin}px`
}
function maxKeySize(size1: number, size2: number): number {
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
  if (key.length < Math.round(7 * maxKeySize(kleProps.width, kleProps.width2))) {
    return key
  }

  const keys = insertLineBigSize(key).split('\n')

  for (let i = 0; i < keys.length; i++) {
    if (keys[i]!.length > Math.round(7 * maxKeySize(kleProps.width, kleProps.width2))) {
      keys[i] = insertLineBreaks(keys[i]!, Math.round(6 * maxKeySize(kleProps.width, kleProps.width2)))
    }
  }
  return keys.join('\n')
}

function isOuterStyle() {
  return select && select === 'outer'
    ? 'bg-primary-100/50 dark:bg-primary-600/50 text-surface-900 dark:text-surface-100'
    : 'bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-300 active:bg-surface-400 active:dark:bg-surface-700'
}
function isOuterShadow() {
  return select && select === 'outer'
    ? 'shadow-[0_1px_1px_1px] shadow-primary-600 dark:shadow-primary-900'
    : 'shadow-[0_1px_1px_1px] shadow-surface-400 dark:shadow-surface-900'
}
function isInnerStyle() {
  return select && select === 'inner'
    ? 'bg-primary-100 dark:bg-primary-600 text-surface-900 dark:text-surface-100 shadow-[0_1px_1px_1px] shadow-primary-600 dark:shadow-primary-900'
    : 'bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-300 shadow-[0_1px_1px_1px] shadow-surface-400 dark:shadow-surface-900 active:bg-surface-400 active:dark:bg-surface-700'
}
</script>

<template>
  <div
    class="raletive cursor-pointer select-none text-center font-bold rounded-prime-md"
    :style="{
      width: fitKeySize(maxKeySize(kleProps.width, kleProps.width2)),
      height: fitKeySize(maxKeySize(kleProps.height, kleProps.height2)),
      fontSize: `${Math.round(defaultKeySize / 5)}px`,
    }"
  >
    <label>
      <div
        class="absolute rounded-prime-md transition-all duration-200"
        :class="isOuterShadow()"
        :style="{
          width: fitKeySize(kleProps.width2),
          height: fitKeySize(kleProps.height2),
        }"
      />
      <div
        class="absolute rounded-prime-md transition-all duration-200"
        :class="isOuterShadow()"
        :style="{
          width: fitKeySize(kleProps.width),
          height: fitKeySize(kleProps.height),
        }"
      />
      <div
        class="absolute rounded-prime-md transition-all duration-200 cursor-pointer"
        :class="isOuterStyle()"
        :style="{
          width: fitKeySize(kleProps.width2),
          height: fitKeySize(kleProps.height2),
        }"
        @click.stop="emit('click', 'outer')"
      />
      <div v-if="keys[0]" class="relative">
        <div
          class="absolute flex justify-center pt-[2px] rounded-prime-md transition-all duration-200 cursor-pointer"
          :class="isOuterStyle()"
          :style="{
            width: fitKeySize(kleProps.width),
            height: fitKeySize(kleProps.height),
          }"
          @click.stop="emit('click', 'outer')"
        >
          <span>{{ keyBreaks(keys[0]) }}</span>
        </div>
        <div
          class="absolute flex items-center justify-center border-t-2 border-surface-800 dark:border-surface-200 rounded-prime-md transition-all duration-200 cursor-pointer"
          :class="isInnerStyle()"
          :style="{
            top: `${defaultKeySize / 3}px`,
            left: `${keyMargin / 2}px`,
            width: `${kleProps.width * defaultKeySize - keyMargin * 2}px`,
            height: `${kleProps.height * defaultKeySize - keyMargin * 1.5 - defaultKeySize / 3}px`,
          }"
          @click.stop="emit('click', 'inner')"
        >
          <span>{{ keyBreaks(keys[1]) }}</span>
        </div>
      </div>
      <div
        v-else
        class="absolute flex items-center justify-center rounded-prime-md transition-all duration-200 cursor-pointer"
        :class="isOuterStyle()"
        :style="{
          width: fitKeySize(kleProps.width),
          height: fitKeySize(kleProps.height),
        }"
        @click.stop="emit('click', 'outer')"
      >
        <span>{{ keyBreaks(keys[1]) }}</span>
      </div>
    </label>
  </div>
</template>
