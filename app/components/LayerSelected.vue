<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore();
const keyboardStore = useKeyboardStore();

const layerIndices = computed(() => {
  return [...Array.from({ length: keyboardStore.layerCount! }).keys()];
});
</script>

<template>
  <div class="rounded-prime-xl flex gap-1 bg-surface-300/50 p-2 dark:bg-surface-700/50">
    <ul v-for="index in layerIndices">
      <label>
        <li
          class="ripple-box cardClasses rounded-prime-xl flex h-10 w-10 cursor-pointer items-center justify-center border-0 text-surface-700 transition-all duration-200 dark:text-surface-300"
          :class="
            pageKeymapStore.currLayer === index
              ? 'bg-surface-50 dark:bg-surface-600'
              : 'bg-surface-200 hover:bg-surface-100 dark:bg-surface-800 dark:hover:bg-surface-700'
          "
        >
          <button @click="pageKeymapStore.currLayer = index" class="font-medium">{{ index }}</button>
        </li></label
      >
    </ul>
  </div>
</template>

<style></style>
