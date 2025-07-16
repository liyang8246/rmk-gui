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
  <div
    class="justify-cente flex flex-col items-center"
    @click="pageKeymapStore.clearSelectedProps"
  >
    <div class="flex w-full items-center justify-start p-2">
      <KeyMapLayerSelected />
    </div>
    <div class="rounded-prime-md relative h-96 w-full overflow-hidden">
      <template
        v-for="keys in keyboardStore.kleDefinition?.keys"
        :key="keys.labels[0]"
      >
        <KeyMapKey
          :keys="labelToDisplay(keys.labels[0]!, pageKeymapStore.currLayer)"
          :kle-props="keys"
        />
      </template>
    </div>
  </div>
</template>

<style></style>
