<script setup lang="ts"></script>

<template>
  <div class="flex h-screen bg-surface-200 dark:bg-surface-900">
    <Aside />
    <div class="flex flex-1 flex-col overflow-hidden">
      <Header />
      <ScrollPanel class="flex-1 overflow-hidden">
        <div class="p-3 h-full w-full">
          <NuxtPage />
        </div>
      </ScrollPanel>
    </div>
  </div>
</template>
