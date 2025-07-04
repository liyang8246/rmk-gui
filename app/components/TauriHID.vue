<script lang="ts" setup>
const deviceStore = useKeyboardStore();
const devices = ref<any[]>([]);
const selected = ref<any>(null);

const connectDevice = async () => {
  if (selected.value) {
    await deviceStore.connect(selected.value.path);
  }
  await deviceStore.fetchAll();
};

onMounted(async () => {
  devices.value = (await deviceStore.list()) as any[];
  if (devices.value.length > 0) {
    selected.value = devices.value[0];
    await connectDevice();
  }
});
</script>

<template>
  <InputGroup>
    <Select
      v-model="selected"
      :options="devices"
      :disabled="deviceStore.isConnected"
      optionLabel="product_string"
      placeholder="等待连接键盘"
    />
    <InputGroupAddon>
      <Button
        :severity="deviceStore.isConnected ? 'secondary' : 'primary'"
        class="h-full w-full !p-0"
        @click="connectDevice"
      >
        <Icon name="tabler:plug" class="text-xl" />
      </Button>
    </InputGroupAddon>
  </InputGroup>
</template>
