<script lang="ts" setup>
import LevelSelected from '~/components/LevelSelected.vue';

const keyboardStore = useKeyboardStore();

const level = ref(0);
const changeFloor = (f: number) => {
  level.value = f;
};
function labelToDisplay(label: string, level: number): [string | null, string | null] {
  const [row, col] = label.split(",").map(n => parseInt(n, 10));
  return keyboardStore.indexToDisplay([level, row!, col!]);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="m-8 flex flex-col items-center justify-center">
      <div class="flex w-full items-center justify-start">
        <LevelSelected @level="changeFloor" :selected-number="level" />
      </div>
      <div class="rounded-prime-md relative h-96 w-full overflow-hidden">
        <div>
          <template v-for="keys in keyboardStore.kleDefinition?.keys">
            <Key :keys="labelToDisplay(keys.labels[0]!, level)" :kleProps="keys" />
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
