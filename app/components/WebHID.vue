<script lang="ts" setup>
const deviceStore = useKeyboardStore();
const connect = async () => {
  const device = (await deviceStore.list()) as HIDDevice[];
  if (!device[0]) return;
  await deviceStore.connect(device[0]);
  await deviceStore.fetchAll();
};
const displayName = computed(() => deviceStore.productName ?? deviceStore.vialJson?.name ?? "Unknown Device");
</script>

<template>
  <InputGroup>
    <InputText :placeholder="deviceStore.isConnected ? displayName : '等待设备连接'" class="cursor-default" readonly />
    <InputGroupAddon>
      <Button :severity="deviceStore.isConnected ? 'secondary' : 'primary'" class="h-full w-full !p-0" @click="connect">
        <Icon name="tabler:plug" class="text-xl" />
      </Button>
    </InputGroupAddon>
  </InputGroup>
</template>
