<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageKeymapStore = usePageKeymapStore()

function labelToDisplay(
  label: string,
  layer: number,
): [string | null, string | null] {
  const [row, col] = label.split(',').map(n => Number.parseInt(n, 10))
  return keyboardStore.indexToDisplay([layer, row!, col!])
}
</script>

<template>
  <template
    v-for="keys in keyboardStore.kleDefinition?.keys"
    :key="keys.labels[0]"
  >
    <KeyMapKey
      :keys="labelToDisplay(keys.labels[0]!, pageKeymapStore.currLayer)"
      :kle-props="keys"
    />
  </template>
</template>

<style></style>
