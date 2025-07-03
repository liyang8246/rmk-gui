<script lang="ts" setup>
const deviceStore = useDeviceStore();
</script>

<template>
  <div class="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
    <template v-for="key in deviceStore.keymap">
      <Key :k1="key[0]" :k2="key[1]" />
    </template>
  </div>
</template>

<style></style>
