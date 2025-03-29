<script lang="ts" setup>
const hidDevicesStore = useHidDevicesStore();
const { keyboard } = useKeyboardStore();
const pageKeymap = usePageKeymap();

const selectedDevicePath = ref();
const selectedLayer = ref(0);

watch(selectedDevicePath, async (newValue: string) => {
  await invoke('connect_vial_device', { path: eval('[' + newValue + ']') });
  await invoke('update_keymap');
});

watch(selectedLayer, async (newValue: number) => {
  pageKeymap.selectedLayer = newValue;
  await invoke('update_keymap');
});

if (hidDevicesStore.devices.length > 0) {
  selectedDevicePath.value = hidDevicesStore.devices[0]?.path.toString();
} else {
  selectedDevicePath.value = 'Device not found';
}
</script>

<template>
  <div class="flex justify-start gap-3 items-center bg-base-100 h-16 border-b border-base-300 p-3">
    <Select v-model="selectedDevicePath">
      <SelectTrigger class="w-48 h-full">
        <SelectValue placeholder="Select a Keyboard" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem
            v-for="device in hidDevicesStore.devices"
            :key="device.product_string"
            :value="device.path.toString()"
          >
            {{ device.product_string }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    <Selector
      :items="Array.from({ length: keyboard.layer }, (_, i) => i)"
      :label="'Layer:'"
      :default="0"
      v-model="selectedLayer"
      class="h-full"
    />
  </div>
</template>
