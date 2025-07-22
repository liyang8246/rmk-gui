<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
const keyboardStore = useKeyboardStore()
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col items-center justify-center">
      <div class="flex w-full items-center justify-start pb-4">
        <Switcher text="Layer" :count="keyboardStore.layerCount!" :layer="pageKeymapStore.currLayer" @change="pageKeymapStore.currLayer = $event" />
      </div>
      <KeyMapKeyboardCanvas />
    </div>
    <div class="flex justify-center items-center">
      <div class="flex flex-wrap items-start justify-center gap-2">
        <KeyMapMapperPanel />
      </div>
    </div>
  </div>
</template>
