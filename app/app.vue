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
    <div @click="launchApp()" class="w-screen h-screen cursor-pointer">
      <p class="absolute inset-x-0 bottom-24 text-4xl w-screen text-center font-bold">CLICK TO START...</p>
    </div>
  </main>
  <main v-else="appStarted" class="flex h-screen bg-base-200">
    <Sidebar />
    <div class="flex-grow flex flex-col">
      <Header />
      <NuxtPage class="flex-grow" />
    </div>
  </main>
</template>
