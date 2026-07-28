<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  name: string
  icon: string
  onClick: () => void
}>()
</script>

<template>
  <button
    class="
      flex cursor-pointer items-center gap-1 rounded-xl p-2 text-base-content
      hover:bg-base-300
    "
    @click="onClick"
  >
    <Icon :icon="icon" />
    <span class="text-sm">{{ name }}</span>
  </button>
</template>
