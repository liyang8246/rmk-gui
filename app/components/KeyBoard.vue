<script lang="ts" setup>
const { keyValue } = defineProps<{
  keyValue: string | null
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
    <div class="rounded-prime-md h-14 w-14">
      <div class="rounded-prime-md flex h-full w-full items-center justify-center bg-surface-300 dark:bg-surface-600">
        <span>{{ keyBreaks(keyValue) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
