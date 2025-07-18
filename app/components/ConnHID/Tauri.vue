<script lang="ts" setup>
import { useAsyncState } from '@vueuse/core'

const keyboardStore = useKeyboardStore()
const devices = ref<any[]>([])
const selected = ref<any>(null)

const { isLoading: isConnecting, execute: toggleConnection } = useAsyncState(
  async () => {
    if (keyboardStore.isConnected) {
      await keyboardStore.disconnect()
      keyboardStore.cleanAll()
    }
    else if (selected.value) {
      await keyboardStore.connect(selected.value.path)
      await keyboardStore.fetchAll()
    }
  },
  undefined,
  { immediate: false },
)

onMounted(async () => {
  devices.value = (await keyboardStore.list()) as any[]
  if (devices.value.length > 0) {
    selected.value = devices.value[0]
    await toggleConnection()
  }
})
</script>

<template>
  <InputGroup>
    <Select
      v-model="selected"
      :options="devices"
      :disabled="keyboardStore.isConnected"
      option-label="product_string"
      placeholder="等待连接键盘"
    />
    <InputGroupAddon>
      <Button
        :severity="keyboardStore.isConnected ? 'secondary' : 'primary'"
        class="h-full w-full !p-0"
        :loading="isConnecting"
        @click="toggleConnection()"
      >
        <Icon
          :name="isConnecting ? 'line-md:loading-twotone-loop' : 'tabler:plug'"
          class="text-xl"
        />
      </Button>
    </InputGroupAddon>
  </InputGroup>
</template>
