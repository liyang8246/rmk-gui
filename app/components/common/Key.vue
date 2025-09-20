<script lang="ts" setup>
const { keyInfo, padding = 0, size = 50 } = defineProps<{
  keyInfo: Key
  highlight?: 'outer' | 'inner'
  padding?: number
  size?: number
}>()

const emit = defineEmits<{
  (e: 'click', zone: 'outer' | 'inner'): void
}>()
</script>

<template>
  <div class="group relative" @click="console.log('click', keyInfo)">
    <div
      class="rounded-prime-md absolute bg-surface-400 shadow-sm dark:hidden"
      :style="{
        top: `${padding + 2}px`,
        left: `${padding - 1}px`,
        width: `${keyInfo.geometry.width * size - padding * 2 + 2}px`,
        height: `${keyInfo.geometry.height * size - padding * 2}px`,
      }"
    />
    <div
      class="rounded-prime-md absolute bg-surface-400 shadow-sm dark:hidden"
      :style="{
        top: `${padding + keyInfo.geometry.y2 * size + 2}px`,
        left: `${padding + keyInfo.geometry.x2 * size - 1}px`,
        width: `${keyInfo.geometry.width2 * size - padding * 2 + 2}px`,
        height: `${keyInfo.geometry.height2 * size - padding * 2}px`,
      }"
    />

    <div
      class="rounded-prime-md absolute bg-surface-300 dark:bg-surface-700"
      :style="{
        top: `${padding}px`,
        left: `${padding}px`,
        width: `${keyInfo.geometry.width * size - padding * 2}px`,
        height: `${keyInfo.geometry.height * size - padding * 2}px`,
      }"
    >
      {{ keyInfo.info.symbol[0] }}
    </div>
    <div
      class="rounded-prime-md absolute bg-surface-300 dark:bg-surface-700"
      :style="{
        top: `${padding + keyInfo.geometry.y2 * size}px`,
        left: `${padding + keyInfo.geometry.x2 * size}px`,
        width: `${keyInfo.geometry.width2 * size - padding * 2}px`,
        height: `${keyInfo.geometry.height2 * size - padding * 2}px`,
      }"
    />
  </div>
</template>
