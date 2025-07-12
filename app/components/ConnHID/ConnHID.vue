<script lang="ts" setup>
const tauri = isTauri();
</script>

<template>
  <ConnHIDTauri v-if="tauri" />
  <ConnHIDWeb v-else />
</template>
