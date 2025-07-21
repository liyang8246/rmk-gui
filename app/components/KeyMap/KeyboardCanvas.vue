<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageKeymapStore = usePageKeymapStore()

function labelToDisplay(
  keys: InstanceType<typeof KleKey>,
  layer: number,
): [string | null, string | null] {
  const [row, col] = keys.labels[0]!.split(',').map(n => Number.parseInt(n, 10))
  pageKeymapStore.getMaxSize(keys.x!, keys.y!, keys.rotation_x!, keys.rotation_y!)
  return keyboardStore.indexToDisplay([layer, row!, col!])
}
</script>

<template>
  <template
    v-for="keys in keyboardStore.kleDefinition?.keys"
    :key="keys"
  >
    <KeyMapKey
      :keys="labelToDisplay(keys, pageKeymapStore.currLayer)"
      :kle-props="keys"
    />
  </template>
</template>
