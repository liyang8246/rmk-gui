<script lang="ts" setup>
const keyboardStore = useKeyboardStore();
</script>

<template>
  <div class="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
    <template v-for="[coords, keycode] in keyboardStore.keymap">
      <Key :keys="keyToDisplay(keycode)" />
    </template>
  </div>
</template>

<style></style>
