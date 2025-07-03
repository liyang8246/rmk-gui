<script lang="ts" setup>
const { k1, k2, select } = defineProps<{
  k1: string | null;
  k2: string | null;
  select?: false | 1 | 2;
}>();
</script>

<template>
  <div class="rounded-prime-md bg-surface-0">
    <p>{{ k1 ? k1 : "-" }}</p>
    <p>{{ k2 ? k2 : "-" }}</p>
  </div>
</template>
