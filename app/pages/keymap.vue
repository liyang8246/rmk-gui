<script lang="ts" setup>
const keyboardStore = useKeyboardStore();
</script>

<template>
  <div class="flex h-full w-full flex-wrap gap-1 p-3">
    <template v-for="[coords, keycode] in keyboardStore.keymap">
      <Key :keys="keyToDisplay(keycode)" />
    </template>
  </div>
</template>

<style scoped></style>
