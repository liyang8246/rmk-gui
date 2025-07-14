<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
const keyboardStore = useKeyboardStore()

const layerIndices = computed(() => {
  return [...Array.from({ length: keyboardStore.layerCount! }).keys()]
})
</script>

<template>
  <div class="rounded-prime-xl flex gap-1 bg-surface-300/50 p-2 dark:bg-surface-700/50">
    <ul v-for="index in layerIndices" :key="index">
      <label>
        <li
          class="ripple-box cardClasses rounded-prime-xl flex h-8 w-8 cursor-pointer items-center justify-center border-0 text-surface-700 transition-all duration-200 dark:text-surface-300"
          :class="
            pageKeymapStore.currLayer === index
              ? 'bg-surface-50 shadow shadow-surface-400 dark:bg-surface-600 dark:shadow-inner dark:shadow-surface-500'
              : 'bg-surface-200 shadow-inner shadow-surface-400 hover:bg-surface-100 dark:bg-surface-800 dark:shadow-sm dark:shadow-surface-600 dark:hover:bg-surface-700'
          "
        >
          <button class="font-medium" @click="pageKeymapStore.currLayer = index">{{ index }}</button>
        </li></label>
    </ul>
  </div>
</template>

<style></style>
