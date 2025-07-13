<script lang="ts" setup>
const keyboardStore = useKeyboardStore();
const connect = async () => {
  const device = (await keyboardStore.list()) as HIDDevice[];
  if (!device[0]) return;
  await keyboardStore.connect(device[0]);
  await keyboardStore.fetchAll();
};
const displayName = computed(() => keyboardStore.productName ?? keyboardStore.vialJson?.name ?? "Unknown Device");
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
        class="h-full w-full !p-0"
        @click="connect"
      >
        <Icon name="tabler:plug" class="text-xl" />
      </Button>
    </InputGroupAddon>
  </InputGroup>
</template>
