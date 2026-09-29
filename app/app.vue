<script setup lang="ts">
import { isTauri } from '@tauri-apps/api/core'

const isDesktop = isTauri()
</script>

<template>
  <main>
    <TauriConnector v-if="isDesktop" />
    <WebConnector v-else />
  </main>
</template>
