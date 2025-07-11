<script lang="ts" setup>
const keyboardStore = useKeyboardStore();
</script>

<template>
  <div class="w-full h-full p-3 flex flex-wrap gap-1">
    <template v-for="[coords, keycode] in keyboardStore.keymap">
      <Key :keys="keyToDisplay(keycode)" />
    </template>
  </div>
</template>

<style scoped>
</style>
