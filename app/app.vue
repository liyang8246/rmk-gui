<script setup lang="ts">
</script>

<template>
  <div class="flex h-screen bg-surface-200 dark:bg-surface-900">
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
