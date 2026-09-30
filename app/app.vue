<script setup lang="ts">
import { isTauri } from '@tauri-apps/api/core'

const isDesktop = isTauri()
</script>

<template>
  <div class="isolate">
    <main>
      <TauriConnector v-if="isDesktop" />
      <WebConnector v-else />
      <DebugPanel />
    </main>
    <Toaster />
  </div>
</template>
