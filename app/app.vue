<script setup lang="ts">
const pageMacrosStore = usePageMacrosStore()
const pageKeymapStore = usePageKeymapStore()

function clearSelectedProps() {
  pageMacrosStore.clearSelectedProps()
  pageKeymapStore.clearSelectedProps()
}
</script>

<template>
  <div class="flex h-screen bg-surface-200 dark:bg-surface-900" @click="clearSelectedProps()">
    <Aside />
    <div class="flex flex-1 flex-col overflow-hidden">
      <Header />
      <div class="p-3 h-full w-full overflow-hidden">
        <ScrollPanel class="overflow-hidden h-full w-full">
          <NuxtPage />
        </ScrollPanel>
      </div>
    </div>
  </div>
</template>
