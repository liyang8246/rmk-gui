<script setup lang="ts">
import type { TransportInfo } from '~/rynk'
import DeviceDialog from '~/components/DeviceDialog.vue'
import { canUseWebHid, canUseWebSerial, requestHidDevice, requestSerialPort } from '~/rynk'
import { describeKeyboardError } from '~/stores/keyboard/errors'

const store = useDeviceStore()
const toast = useToast()
const showDevice = ref(false)

const status = computed(() => {
  const conn = store.connection
  if (!conn) return 'idle'
  const label = conn.label ? `: ${conn.label}` : ''
  const cause = conn.cause ? ` — ${describeKeyboardError(conn.cause)}` : ''
  return `${conn.phase}${label}${cause}`
})

onMounted(refresh)

watch(() => store.connection, (conn) => {
  if (!conn) return
  if (conn.phase === 'connected') {
    toast.success(`Connected to ${conn.label}`)
  } else if (conn.phase === 'disconnected') {
    toast.info(`Disconnected from ${conn.label}`)
  } else if (conn.phase === 'error') {
    const cause = conn.cause ? describeKeyboardError(conn.cause) : undefined
    toast.error('Connection error', [conn.label, cause].filter(Boolean).join(' — ') || undefined)
  }
})

async function refresh() {
  const result = await store.scan()
  if (result.isErr()) toast.error('Scan failed', describeKeyboardError(result.error))
}

async function add(kind: 'hid' | 'serial') {
  try {
    const picked = kind === 'hid' ? await requestHidDevice() : await requestSerialPort()
    if (picked) await store.connectHandle(picked)
  } catch (e) {
    // Picker cancel surfaces as NotFoundError; anything else is a real failure.
    if (e instanceof DOMException && e.name === 'NotFoundError') return
    toast.error('Could not open the device picker', e instanceof Error ? e.message : String(e))
  }
}

function label(info: TransportInfo): string {
  return `${info.kind} — ${info.label}`
}
</script>

<template>
  <section>
    <p>status: {{ status }}</p>
    <div>
      <button v-if="canUseWebHid()" :disabled="store.connecting" @click="add('hid')">
        Add HID device
      </button>
      <button v-if="canUseWebSerial()" :disabled="store.connecting" @click="add('serial')">
        Add serial port
      </button>
      <button :disabled="store.scanning" @click="refresh">
        {{ store.scanning ? 'scanning…' : 'Refresh' }}
      </button>
      <button v-if="store.connection?.phase === 'connected'" @click="showDevice = true">
        Device
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
    <DeviceDialog v-model:open="showDevice" />
  </section>
</template>
