<script lang="ts" setup>
const { keys } = defineProps<{
  keys: [string | null, string | null]
  select?: false | 1 | 2
  kleProps?: InstanceType<typeof KleKey>
}>()

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
  if (key.length < 8) {
    return key
  }
  const keys = insertLineBigSize(key).split('\n')
  const maxSize = 7
  for (let i = 0; i < keys.length; i++) {
    if (keys[i]!.length > maxSize + 1) {
      keys[i] = insertLineBreaks(keys[i]!, maxSize)
    }
  }
  return keys.join('\n')
}
</script>

<template>
  <div class="cursor-pointer text-center text-xs font-bold text-surface-700 dark:text-surface-300">
    <div v-if="keys[0]" class="relative">
      <div class="rounded-prime-md h-14 w-14">
        <div class="rounded-prime-md flex h-full w-full justify-center bg-surface-300 pt-1 dark:bg-surface-600">
          <span>{{ keyBreaks(keys[0]) }}</span>
        </div>
      </div>
      <div
        class="rounded-prime-md absolute left-[4px] top-5 flex h-8 w-12 items-center justify-center border-t-2 border-surface-800 bg-surface-300 dark:border-surface-200 dark:bg-surface-600"
      >
        <span>{{ keyBreaks(keys[1]) }}</span>
      </div>
    </div>

    <div v-else class="rounded-prime-md h-14 w-14">
      <div class="rounded-prime-md flex h-full w-full items-center justify-center bg-surface-300 dark:bg-surface-600">
        <span>{{ keyBreaks(keys[1]) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
