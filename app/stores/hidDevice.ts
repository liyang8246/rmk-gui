export const useDeviceStore = defineStore("device", () => {
  const hidDevice = ref<HIDInterface | null>(null);
  const vialDevice = ref<VialInterface | null>(null);
  const api = ref<HIDApi | null>(null);

  const isConnected = computed(() => hidDevice.value != null);

  const productName = ref<string | null>(null);
  async function fetchProductName() {
    if (!vialDevice.value) {
      throw new Error("Device not connected");
    }
    productName.value = await vialDevice.value.productName();
  }

  const layerCount = ref<number | null>(null);
  async function fetchLayerCount() {
    if (!vialDevice.value) {
      throw new Error("Device not connected");
    }
    layerCount.value = await vialDevice.value.layerCount();
  }

  const macroCount = ref<number | null>(null);
  async function fetchMacroCount() {
    if (!vialDevice.value) {
      throw new Error("Device not connected");
    }
    macroCount.value = await vialDevice.value.marcoCount();
  }

  const vialJson = ref<VialJson | null>(null);
  async function fetchVialJson() {
    if (!vialDevice.value) {
      throw new Error("Device not connected");
    }
    vialJson.value = await vialDevice.value.vialJson();
  }

  const kleDefinition = ref<InstanceType<typeof Keyboard> | null>(null);
  function fetchKleDefinition() {
    if (!vialDevice.value) {
      throw new Error("Device not connected");
    }
    if (!vialJson.value) {
      throw new Error("Vial JSON not available");
    }
    kleDefinition.value = vialDevice.value.kleDefinition(vialJson.value);
  }

  async function fetchAll() {
    await Promise.all([fetchProductName(), fetchLayerCount(), fetchMacroCount(), fetchVialJson()]);
    fetchKleDefinition();
  }

  function initializeApi() {
    isTauri() ? (api.value = new TauriHIDApi()) : (api.value = new WebHIDApi());
  }

  async function list() {
    if (!api.value) {
      initializeApi();
    }
    if (!api.value) {
      console.error("HID API not available");
      return;
    }

    return await api.value.listDevices();
  }

  async function connect(device: number[] | HIDDevice) {
    if (!api.value) {
      console.error("HID API not available");
      return;
    }

    hidDevice.value = await api.value.connectDevice(device);
    vialDevice.value = new VialDevice(hidDevice.value);
  }

  async function disconnect() {
    if (hidDevice.value) {
      await hidDevice.value.disconnect();
      hidDevice.value = null;
    }
  }

  return {
    device: vialDevice,
    productName,
    fetchProductName,
    layerCount,
    fetchLayerCount,
    macroCount,
    fetchMacroCount,
    vialJson,
    fetchVialJson,
    kleDefinition,
    fetchKleDefinition,
    fetchAll,
    list,
    connect,
    disconnect,
    isConnected,
  };
});
