<script lang="ts" setup>
const { title } = defineProps<{ title: string }>()
</script>

<template>
  <div class="rounded-prime-md w-full bg-surface-50 p-3 shadow dark:bg-surface-700 ">
    <h1 class="mb-3 font-bold text-surface-700 dark:text-surface-300">
      {{ title }}
    </h1>
    <div class="flex flex-col gap-y-3 text-surface-700 dark:text-surface-300">
      <slot />
    </div>
  </div>
</template>
