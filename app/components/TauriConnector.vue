<script setup lang="ts">
import type { TransportInfo } from '~/rynk'
import { describeKeyboardError } from '~/stores/keyboard/errors'

const store = useDeviceStore()
const scanError = ref<string | null>(null)

const status = computed(() => {
  const conn = store.connection
  if (!conn) return 'idle'
  const label = conn.label ? `: ${conn.label}` : ''
  const cause = conn.cause ? ` — ${describeKeyboardError(conn.cause)}` : ''
  return `${conn.phase}${label}${cause}`
})

onMounted(refresh)

async function refresh() {
  const result = await store.scan()
  scanError.value = result.isErr() ? describeKeyboardError(result.error) : null
}

function label(info: TransportInfo): string {
  return `${info.kind} — ${info.label}`
}
</script>

<template>
  <section>
    <p>status: {{ status }}</p>
    <p v-if="scanError">
      scan failed: {{ scanError }}
    </p>
    <div>
      <button :disabled="store.scanning" @click="refresh">
        {{ store.scanning ? 'scanning…' : 'Scan' }}
      </button>
      <button v-if="store.connection?.phase === 'connected'" @click="store.disconnect()">
        Disconnect
      </button>
    </div>
    <ul>
      <li v-for="device in store.devices" :key="device.id">
        {{ label(device) }}
        <button
          :disabled="store.connecting || device.id === store.connectedId"
          @click="store.connect(device)"
        >
          {{ device.id === store.connectedId ? 'connected' : 'Connect' }}
        </button>
      </li>
    </ul>
  </section>
</template>
