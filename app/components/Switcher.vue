<script setup lang="ts">
const { text, count, layer } = defineProps<{
  text: string
  count: number
  layer: number
}>()
const emit = defineEmits<{
  (e: 'change', index: number): void
}>()
const indices = computed(() => {
  return [...Array.from({ length: count }).keys()]
})
function compare(index: number) {
  return layer === index
    ? 'bg-primary-200 dark:bg-primary-600 font-bold text-surface-700 dark:text-surface-300 shadow-sm shadow-primary-500 dark:shadow-primary-800'
    : 'bg-surface-300 dark:bg-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-500 dark:text-surface-400'
}
</script>

<template>
  <div class="text-md rounded-prime-md flex select-none items-center gap-1 bg-surface-300 px-3 py-1 shadow-sm shadow-surface-400 dark:bg-surface-600 dark:shadow-surface-950">
    <span class="text-surface-700 dark:text-surface-300">{{ text }} </span>
    <ul v-for="index in indices" :key="index">
      <label>
        <li
          class="rounded-prime-md flex h-6 w-7 cursor-pointer items-center justify-center border-0 transition-all duration-300"
          :class="compare(index)"
        >
          <button class="font-medium" @click="emit('change', index)">{{ index }}</button>
        </li></label>
    </ul>
  </div>
</template>
