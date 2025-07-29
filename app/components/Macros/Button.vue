<script lang="ts" setup>
const { label } = defineProps<{
  label: string
}>()
</script>

<template>
  <Button label="" severity="contrast" variant="text" class="!h-8 !p-0 !border-none">
    <span class="py-1 px-2 cursor-pointer bg-surface-400 dark:bg-surface-950 hover:shadow-surface-500 transition-all duration-200">{{ label }}</span>
  </Button>
</template>
