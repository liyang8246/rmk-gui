<script lang="ts" setup>
const deviceStore = useDeviceStore();
const connect = async () => {
  const device = (await deviceStore.list()) as HIDDevice[];
  if (!device[0]) return;
  await deviceStore.connect(device[0]);
  await deviceStore.fetchAll();
};
</script>

<template>
  <InputGroup>
    <InputText
      :placeholder="deviceStore.productName ? deviceStore.productName : '等待连接键盘'"
      class="cursor-default"
      readonly
    />
    <InputGroupAddon>
      <Button :severity="deviceStore.productName ? 'secondary' : 'primary'" class="h-full w-full !p-0" @click="connect">
        <Icon name="tabler:plug" class="text-xl" />
      </Button>
    </InputGroupAddon>
  </InputGroup>
</template>
