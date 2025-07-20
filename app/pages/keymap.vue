<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
</script>

<template>
  <div class="flex flex-col">
    <div
      class="flex flex-col items-center justify-center"
      @click="pageKeymapStore.clearSelectedProps"
    >
      <KeyMap />
    </div>
    <div class="flex justify-center items-center">
      <div class="flex flex-wrap items-start justify-center gap-2">
        <KeyMapMapperPanel />
      </div>
    </div>
  </div>
</template>
