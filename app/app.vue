<script setup lang="ts">
const themeStore = useThemeStore()
themeStore.persistTheme()
</script>

<template>
  <div class="flex h-screen bg-surface-200 dark:bg-surface-900 select-none">
    <Aside />
    <div class="flex flex-1 flex-col overflow-hidden">
      <Header />
      <div class="h-full w-full overflow-hidden">
        <ScrollPanel class="overflow-hidden h-full w-full">
          <NuxtPage />
        </ScrollPanel>
      </div>
    </div>
  </div>
</template>
