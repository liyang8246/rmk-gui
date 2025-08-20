<script setup lang="ts">
useThemeStore()
</script>

<template>
  <div class="flex h-screen select-none bg-surface-200 dark:bg-surface-900">
    <Aside />
    <div class="flex flex-1 flex-col overflow-hidden">
      <Header />
      <div class="size-full overflow-hidden">
        <ScrollPanel class="size-full overflow-hidden">
          <NuxtPage />
        </ScrollPanel>
      </div>
    </div>
  </div>
</template>
