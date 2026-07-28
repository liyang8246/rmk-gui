<script setup lang="ts">
import { onMounted } from 'vue'
import Keyboard from '~/components/Keyboard.vue'
import StateBar from '~/components/StateBar.vue'
import ToolsBar from '~/components/ToolsBar.vue'
import { discover } from '~/rynk'
import { useKeyboardStore } from '~/stores'

const kbdStore = useKeyboardStore()

onMounted(async () => {
  const devices = await discover()
  if (!devices.length) return
  const connected = await devices[0]!.connect()
  await kbdStore.initStore(connected)
  console.warn('init', kbdStore)
})
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center gap-4 grid-canvas p-8"
  >
    <ToolsBar />
    <div class="w-full flex-1 overflow-auto">
      <Keyboard />
    </div>
    <StateBar />
  </div>
</template>
