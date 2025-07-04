<script lang="ts" setup>
const { keys, select } = defineProps<{
  keys: [string | null, string | null];
  select?: false | 1 | 2;
  kleProps?: typeof KLEKey;
}>();
</script>

<template>
  <div class="rounded-prime-md bg-surface-0">
    <p>{{ keys }}</p>
  </div>
</template>
