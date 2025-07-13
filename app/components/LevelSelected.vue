<script lang="ts" setup>
const { selectedNumber = 0 } = defineProps<{
  selectedNumber?: number;
}>();

const allLevels = [0, 1, 2, 3];

const emit = defineEmits<{
  (e: "level", level: number): void;
}>();
</script>

<template>
  <div class="rounded-prime-xl flex gap-1 bg-surface-300/50 p-2 dark:bg-surface-700/50">
    <ul v-for="index in allLevels" :key="index">
      <label>
        <li
          class="ripple-box cardClasses rounded-prime-xl flex h-10 w-10 cursor-pointer items-center justify-center border-0 text-surface-700 transition-all duration-200 dark:text-surface-300"
          :class="
            selectedNumber === index
              ? 'bg-surface-50 dark:bg-surface-600'
              : 'bg-surface-200 hover:bg-surface-100 dark:bg-surface-800 dark:hover:bg-surface-700'
          "
        >
          <button @click="emit('level', index)" class="font-medium">{{ index }}</button>
        </li></label
      >
    </ul>
  </div>
</template>

<style></style>
