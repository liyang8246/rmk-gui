<script lang="ts" setup>
const { keys, kleProps } = defineProps<{
  keys: [string | null, string | null]
  select?: false | 1 | 2
  kleProps: InstanceType<typeof KleKey>
}>()

function fixSize(size: number): string {
  return `calc(56px * ${size} - 8px)`
}
function maxSize(size1: number, size2: number): number {
  return size1 > size2 ? size1 : size2
}

const translate = computed(() => {
  return (
    `calc((-${kleProps.x} + ${kleProps.rotation_x}) * 56px)` + `calc((-${kleProps.y} + ${kleProps.rotation_y}) * 56px)`
  )
})

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
</script>

<template>
  <div
    class="rounded-prime-md absolute h-14 w-14 cursor-pointer text-center text-xs font-bold text-surface-700 dark:text-surface-300"
    :style="{
      top: `${kleProps.y * 56}px`,
      left: `${kleProps.x * 56}px`,
      transform: `rotate(${kleProps.rotation_angle}deg)`,
      transformOrigin: translate,
      width: fixSize(maxSize(kleProps.width, kleProps.width2)),
      height: fixSize(maxSize(kleProps.height, kleProps.height2)),
    }"
  >
    <label>
      <div
        class="rounded-prime-md absolute bg-surface-300 dark:bg-surface-600"
        :style="{
          width: fixSize(kleProps.width2),
          height: fixSize(kleProps.height2),
        }"
      />
      <!-- kc -->
      <div v-if="keys[0]" class="relative">
        <div
          class="rounded-prime-md absolute flex justify-center bg-surface-300 pt-[2px] dark:bg-surface-600"
          :style="{
            width: fixSize(kleProps.width),
            height: fixSize(kleProps.height),
          }"
        >
          <span>{{ keyBreaks(keys[0]) }}</span>
        </div>

        <div
          class="rounded-prime-md absolute flex items-center justify-center border-t-2 border-surface-800 bg-surface-300 dark:border-surface-200 dark:bg-surface-600"
          :style="{
            top: '17px',
            left: '4px',
            width: `${kleProps.width * 56 - 8 * 2}px`,
            height: `${kleProps.height * 56 - 8 - 4 - 17}px`,
          }"
        >
          <span>{{ keyBreaks(keys[1]) }}</span>
        </div>
      </div>
      <!-- key -->
      <div
        v-else
        class="rounded-prime-md absolute flex items-center justify-center bg-surface-300 dark:bg-surface-600"
        :style="{
          width: fixSize(kleProps.width),
          height: fixSize(kleProps.height),
        }"
      >
        <span>{{ keyBreaks(keys![1]) }}</span>
      </div>
    </label>
  </div>
</template>
