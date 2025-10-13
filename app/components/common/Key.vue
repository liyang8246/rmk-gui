<script lang="ts" setup>
const { keyInfo, highlight, padding = 0, size = 50 } = defineProps<{
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
  <div
    class="font-mono text-surface-900 dark:text-surface-100"
    :style="{
      width: `${Math.max(keyInfo.geometry.width, keyInfo.geometry.width2) * size}px`,
      height: `${Math.max(keyInfo.geometry.height, keyInfo.geometry.height2) * size}px`,
    }"
  >
    <div class="group relative" @click="emit('click', 'outer')">
      <!-- 边框 -->
      <div
        class="rounded-prime-md absolute bg-surface-400 shadow-sm shadow-surface-400 dark:bg-surface-800 dark:shadow-surface-800"
        :class="{ '!bg-primary-400': highlight === 'outer' }"
        :style="{
          top: `${padding + 2}px`,
          left: `${padding - 1}px`,
          width: `${keyInfo.geometry.width * size - padding * 2 + 2}px`,
          height: `${keyInfo.geometry.height * size - padding * 2}px`,
        }"
      />
      <div
        class="rounded-prime-md absolute bg-surface-400 shadow-sm shadow-surface-400 dark:bg-surface-800 dark:shadow-surface-800"
        :class="{ '!bg-primary-400': highlight === 'outer' }"
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
        :class="{ '!bg-primary-100': highlight === 'outer' }"
        :style="{
          top: `${padding}px`,
          left: `${padding}px`,
          width: `${keyInfo.geometry.width * size - padding * 2}px`,
          height: `${keyInfo.geometry.height * size - padding * 2}px`,
        }"
      />
      <div
        class="rounded-prime-md absolute bg-surface-300 group-active:opacity-0 dark:bg-surface-700"
        :class="{ '!bg-primary-100': highlight === 'outer' }"
        :style="{
          top: `${padding + keyInfo.geometry.y2 * size}px`,
          left: `${padding + keyInfo.geometry.x2 * size}px`,
          width: `${keyInfo.geometry.width2 * size - padding * 2}px`,
          height: `${keyInfo.geometry.height2 * size - padding * 2}px`,
        }"
      />
      <!-- 按键名 -->
      <span
        v-if="keyInfo.info.symbol[0] === null"
        class="absolute" :class="{ 'text-xl': keyInfo.info.symbol[1]!.length === 1 }" style="transform: translate(-50%, -50%)"
        :style="{
          top: `${keyInfo.geometry.height / 2 * size}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
        }"
      >
        {{ keyInfo.info.symbol[1] }}
      </span>
      <span
        v-else
        class="absolute whitespace-nowrap" style="transform: translate(-50%, -50%)"
        :style="{
          top: `${padding + (keyInfo.geometry.height * size - 2 * padding) / 5}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
        }"
      >
        {{ keyInfo.info.symbol[0] }}
      </span>
    </div>
    <!-- 副按键 -->
    <div
      v-if="keyInfo.info.symbol[0] !== null"
      class="group relative"
      @click="emit('click', 'inner')"
    >
      <div
        class="rounded-prime-md absolute bg-surface-400 opacity-0 group-active:opacity-100 dark:bg-surface-800"
        :class="{ '!bg-primary-100': highlight === 'inner', '!opacity-100': highlight === 'inner' }"
        style="transform: translate(-50%, -50%)" :style="{
          top: `${padding + (keyInfo.geometry.height * size - 2 * padding) / 5 * 3.5}px`,
          left: `${keyInfo.geometry.width / 2 * size}px`,
          width: `${keyInfo.geometry.width * size - padding * 2}px`,
          height: `${(keyInfo.geometry.height * size - 2 * padding) / 5 * 3}px`,
        }"
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
    </div>
  </div>
</template>
