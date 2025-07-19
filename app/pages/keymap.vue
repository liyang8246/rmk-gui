<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
</script>

<template>
  <div class="flex flex-col">
    <div
      class="justify-cente flex flex-col items-center"
      @click="pageKeymapStore.clearSelectedProps"
    >
      <KeyMap />
    </div>
    <div class="flex flex-wrap items-start justify-center gap-2 ">
      <KeyMapMapperPanel />
    </div>
  </div>
</template>
