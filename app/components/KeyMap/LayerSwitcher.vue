<script setup lang="ts">
const pageKeymapStore = usePageKeymapStore()
const keyboardStore = useKeyboardStore()

const layerIndices = computed(() => {
  return [...Array.from({ length: keyboardStore.layerCount! }).keys()]
})
</script>

<template>
  <div class="card text-md rounded-prime-md flex items-center gap-1 shadow-sm shadow-surface-400 dark:shadow-surface-900 px-3 py-1 bg-surface-300/70 dark:bg-surface-600/70">
    <span class="text-surface-700 dark:text-surface-300"> Layer: </span>
    <ul v-for="index in layerIndices" :key="index">
      <label>
        <li
          class="ripple-box cardClasses rounded-prime-md flex h-6 w-7 cursor-pointer items-center justify-center border-0  transition-all duration-200"
          :class="
            pageKeymapStore.currLayer === index
              ? 'bg-surface-50 dark:bg-surface-500 text-surface-700 dark:text-surface-300'
              : 'hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-500 dark:text-surface-400'
          "
        >
          <button class="font-medium" @click="pageKeymapStore.currLayer = index">{{ index }}</button>
        </li></label>
    </ul>
  </div>
</template>

<style></style>
