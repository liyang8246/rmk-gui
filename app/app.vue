<script lang="ts" setup>
import { ref } from 'vue';
const appStarted = ref(false);

async function launchApp() {
  appStarted.value = true;
  const hidDevicesStore = useHidDevicesStore();
  hidDevicesStore.devices = await invoke('get_vial_devices');
}
</script>

<template>
  <!-- Security Policy -->
  <main v-if="!appStarted">
    <button @click="launchApp()">Launch</button>
  </main>
  <main v-if="appStarted" class="flex h-screen bg-base-200">
    <Sidebar />
    <div class="flex-grow flex flex-col">
      <Header />
      <NuxtPage class="flex-grow" />
    </div>
  </main>
</template>
