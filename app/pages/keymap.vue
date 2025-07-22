<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
const keyboardStore = useKeyboardStore()
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <div class="flex flex-col items-center justify-center w-full h-full">
      <div class="flex w-full items-center justify-start pb-4">
        <Switcher text="Layer" :count="keyboardStore.layerCount!" :layer="pageKeymapStore.currLayer" @change="pageKeymapStore.currLayer = $event" />
      </div>
      <KeyMapKeyboardCanvas />
    </div>
    <KeyMapMapperPanel />
  </div>
</template>
