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
  <div>
    <div class="group relative text-surface-900 dark:text-surface-100" @click="console.log('click', 'outer')">
      <!-- 边框 -->
      <div
        class="rounded-prime-md absolute bg-surface-400 shadow-sm dark:bg-surface-800"
        :style="{
          top: `${padding + 2}px`,
          left: `${padding - 1}px`,
          width: `${keyInfo.geometry.width * size - padding * 2 + 2}px`,
          height: `${keyInfo.geometry.height * size - padding * 2}px`,
        }"
      />
      <div
        class="rounded-prime-md absolute bg-surface-400 shadow-sm dark:bg-surface-800"
        :style="{
          top: `${padding + keyInfo.geometry.y2 * size + 2}px`,
          left: `${padding + keyInfo.geometry.x2 * size - 1}px`,
          width: `${keyInfo.geometry.width2 * size - padding * 2 + 2}px`,
          height: `${keyInfo.geometry.height2 * size - padding * 2}px`,
        }"
      />
      <!-- 主按键 -->
      <div
        class="rounded-prime-md absolute bg-surface-300 group-active:opacity-0 dark:bg-surface-700"
        :style="{
          top: `${padding}px`,
          left: `${padding}px`,
          width: `${keyInfo.geometry.width * size - padding * 2}px`,
          height: `${keyInfo.geometry.height * size - padding * 2}px`,
        }"
      />
      <div
        class="rounded-prime-md absolute bg-surface-300 group-active:opacity-0 dark:bg-surface-700"
        :style="{
          top: `${padding + keyInfo.geometry.y2 * size}px`,
          left: `${padding + keyInfo.geometry.x2 * size}px`,
          width: `${keyInfo.geometry.width2 * size - padding * 2}px`,
          height: `${keyInfo.geometry.height2 * size - padding * 2}px`,
        }"
      />

      <span
        v-if="keyInfo.info.symbol[0] === null"
        class="absolute" style="transform: translate(-50%, -50%)"
        :style="{
          top: `${keyInfo.geometry.height / 2 * size}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
        }"
      >
        {{ keyInfo.info.symbol[1] }}
      </span>

      <span
        v-else
        class="absolute whitespace-nowrap text-sm" style="transform: translate(-50%, -50%)"
        :style="{
          top: `${padding + (keyInfo.geometry.height * size - 2 * padding) / 5}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
        }"
      >
        {{ keyInfo.info.symbol[0] }}
      </span>
    </div>
    <template
      v-if="keyInfo.info.symbol[0] !== null"
    >
      <div
        class="rounded-prime-md absolute bg-surface-400 opacity-0 active:opacity-100 dark:bg-surface-800"
        style="transform: translate(-50%, -50%)" :style="{
          top: `${padding + (keyInfo.geometry.height * size - 2 * padding) / 5 * 3.5}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
          width: `${keyInfo.geometry.width * size - padding * 2}px`,
          height: `${(keyInfo.geometry.height * size - 2 * padding) / 5 * 3}px`,
        }"
        @click.stop="console.log('click', 'inner')"
      />
      <span
        class="absolute h-[2px] rounded-full bg-surface-500 dark:bg-surface-400" style="transform: translate(-50%, -50%)"
        :style="{
          top: `${padding + (keyInfo.geometry.height * size - 2 * padding) / 5 * 2}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
          width: `${keyInfo.geometry.width / 2 * size}px`,
        }"
      />

      <span
        class="absolute whitespace-nowrap" style="transform: translate(-50%, -50%)"
        :style="{
          top: `${padding + (keyInfo.geometry.height * size - 2 * padding) / 5 * 3.5}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
        }"
      >
        {{ keyInfo.info.symbol[1] }}
      </span>
    </template>
  </div>
</template>
