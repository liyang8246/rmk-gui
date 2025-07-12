<script lang="ts" setup>
const keyboardStore = useKeyboardStore();
</script>

<template>
  <div class="flex flex-col">
    <div class="flex-center my-8">
      <div class="rounded-prime-md relative h-96 w-11/12 overflow-hidden border border-black bg-surface-300">
        <template v-for="keys in keyboardStore.kleDefinition?.keys">
          <Key :kleProps="keys" />
        </template>
      </div>
    </div>
    <div class="mx-8">
      <div class="flex-start flex flex-wrap gap-1">
        <template v-for="[coords, keycode] in keyboardStore.keymap">
          <KeyBoard :keys="keyToDisplay(keycode)" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
