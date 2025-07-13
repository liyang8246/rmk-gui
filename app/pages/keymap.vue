<script lang="ts" setup>
const keyboardStore = useKeyboardStore();
const pageKeymapStore = usePageKeymapStore();

function labelToDisplay(label: string, layer: number): [string | null, string | null] {
  const [row, col] = label.split(",").map(n => parseInt(n, 10));
  return keyboardStore.indexToDisplay([layer, row!, col!]);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="m-8 flex flex-col items-center justify-center">
      <div class="flex w-full items-center justify-start">
        <LayerSelected />
      </div>
      <div class="rounded-prime-md relative h-96 w-full overflow-hidden">
        <div>
          <template v-for="keys in keyboardStore.kleDefinition?.keys">
            <Key :keys="labelToDisplay(keys.labels[0]!, pageKeymapStore.currLayer)" :kleProps="keys" />
          </template>
        </div>
      </div>
    </div>
    <div class="mx-8">
      <div class="flex flex-wrap items-start justify-start gap-1">
        <template v-for="[coords, keycode] in keyboardStore.keymap">
          <KeyBoard :keys="keyToDisplay(keycode)" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
