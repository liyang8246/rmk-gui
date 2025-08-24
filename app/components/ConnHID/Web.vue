<script lang="ts" setup>
const keyboardStore = useKeyboardStore()

const { isLoading: isConnecting, execute: toggleConnection } = useAsyncState(
  async () => {
    if (keyboardStore.isConnected) {
      navigateTo('/')
      await keyboardStore.disconnect()
    }
    else {
      const device = (await keyboardStore.list()) as HIDDevice[]
      if (!device[0])
        return
      await keyboardStore.connect(device[0])
      await keyboardStore.fetchAll()
    }
  },
  undefined,
  { immediate: false },
)

const displayName = computed(() => keyboardStore.productName ?? keyboardStore.vialJson?.name ?? 'Unknown Device')
</script>

<template>
  <InputGroup>
    <InputText
      :placeholder="keyboardStore.isConnected ? displayName : '等待设备连接'"
      class="cursor-default"
      readonly
    />
    <InputGroupAddon>
      <Button
        :severity="keyboardStore.isConnected ? 'secondary' : 'primary'"
        class="size-full !p-0"
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
