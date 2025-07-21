<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
const keyboardStore = useKeyboardStore()
</script>

<template>
  <div class="flex w-full items-center justify-start pb-4">
    <Switcher text="Layer" :count="keyboardStore.layerCount!" :layer="pageKeymapStore.currLayer" @change="pageKeymapStore.currLayer = $event" />
  </div>
  <div
    class="rounded-prime-md relative h-96 w-full overflow-hidden"
    :style="{
      maxWidth: `${(pageKeymapStore.maxx - 1 + pageKeymapStore.extpending / 2) * 56}px`,
      maxHeight: `${(pageKeymapStore.maxy - 1 + pageKeymapStore.extpending / 2) * 56}px`,

    }"
  >
    <KeyMapKeyboardCanvas />
  </div>
</template>
