<script lang="ts" setup>
const keyboardStore = useKeyboardStore();
const devices = ref<any[]>([]);
const selected = ref<any>(null);

const connectDevice = async () => {
  if (selected.value) {
    await keyboardStore.connect(selected.value.path);
  }
  await keyboardStore.fetchAll();
};

onMounted(async () => {
  devices.value = (await keyboardStore.list()) as any[];
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
      :disabled="keyboardStore.isConnected"
      optionLabel="product_string"
      placeholder="等待连接键盘"
    />
    <InputGroupAddon>
      <Button
        :severity="keyboardStore.isConnected ? 'secondary' : 'primary'"
        class="h-full w-full !p-0"
        @click="connectDevice"
      >
        <Icon name="tabler:plug" class="text-xl" />
      </Button>
    </InputGroupAddon>
  </InputGroup>
</template>
