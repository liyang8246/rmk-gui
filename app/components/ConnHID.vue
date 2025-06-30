<script lang="ts" setup>
const tauri = isTauri();
</script>

<template>
  <TauriHID v-if="tauri" />
  <WebHID v-else />
</template>
