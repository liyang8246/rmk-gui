<script lang="ts" setup>
const deviceStore = useDeviceStore();
</script>

<template>
  <div class="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
    <template v-for="key in deviceStore.keymap">
      <Key :keys="keyToDisplay(key)" />
    </template>
  </div>
</template>

<style></style>
