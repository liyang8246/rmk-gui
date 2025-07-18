export const useKeyboardStore = defineStore('keyboard', () => {
  const hidDevice = ref<HIDInterface | null>(null)
  const vialDevice = ref<VialInterface | null>(null)
  const api = ref<HIDApi | null>(null)

  const isConnected = computed(() => hidDevice.value != null)

  const productName = ref<string | null>(null)
  async function fetchProductName() {
    if (!vialDevice.value) {
      throw new Error('Device not connected')
    }
    productName.value = await vialDevice.value.productName()
  }

  const layerCount = ref<number | null>(null)
  async function fetchLayerCount() {
    if (!vialDevice.value) {
      throw new Error('Device not connected')
    }
    layerCount.value = await vialDevice.value.layerCount()
  }

  const macroCount = ref<number | null>(null)
  async function fetchMacroCount() {
    if (!vialDevice.value) {
      throw new Error('Device not connected')
    }
    macroCount.value = await vialDevice.value.marcoCount()
  }

  const vialJson = ref<VialJson | null>(null)
  async function fetchVialJson() {
    if (!vialDevice.value) {
      throw new Error('Device not connected')
    }
    vialJson.value = await vialDevice.value.vialJson()
  }

  const kleDefinition = ref<InstanceType<typeof KleBoard> | null>(null)
  function fetchKleDefinition() {
    if (!vialDevice.value) {
      throw new Error('Device not connected')
    }
    if (!vialJson.value) {
      throw new Error('Vial JSON not available')
    }
    kleDefinition.value = vialDevice.value.kleDefinition(vialJson.value)
  }

  const keymap = ref<Map<string, number> | null>(null)
  async function fetchKeymap() {
    if (!vialDevice.value) {
      throw new Error('Device not connected')
    }
    if (!layerCount.value) {
      throw new Error('Layer count not available')
    }
    if (!vialJson.value) {
      throw new Error('Vial JSON not available')
    }
    const layer = layerCount.value
    const { rows, cols } = vialJson.value.matrix
    keymap.value = await vialDevice.value.keymap(layer, rows, cols)
  }

  const layoutKeymap = ref<Map<string, number> | null>(null)
  function fetchLayoutKeymap() {
    if (!vialDevice.value) {
      throw new Error('Vial device not available')
    }
    if (!kleDefinition.value) {
      throw new Error('KLE definition not available')
    }
    if (!keymap.value) {
      throw new Error('Keymap not available')
    }
    if (!layerCount.value) {
      throw new Error('Layer count not available')
    }
    layoutKeymap.value = vialDevice.value.layoutKeymap(kleDefinition.value, keymap.value, layerCount.value)
  }
  function indexToDisplay(index: [number, number, number]): [string | null, string | null] {
    if (!layoutKeymap.value) {
      throw new Error('Layout keymap not available')
    }
    const keyValue = layoutKeymap.value.get(index.toString())
    if (keyValue === undefined) {
      throw new Error(`Keymap value for index ${index.toString()} not found`)
    }
    return keyToLable(keyValue)
  }

  const keyMacros = ref<Array<Array<MacroAction>>>([])
  async function fetchMacros() {
    if (!hidDevice.value) {
      throw new Error('Hid Device not available')
    }
    if (!vialDevice.value) {
      throw new Error('Vial device not available')
    }
    if (!macroCount.value) {
      throw new Error('Macro Count not available')
    }
    const sizeData = await hidDevice.value.writeRead([VialConstants.Command.GetMacroBufferSize])
    const macroSize = readU16(sizeData, 1)

    const macroMemory: number[] = []

    for (let i = 0; i < Math.ceil(macroSize / VialConstants.BUFFER_CHUNK_SIZE); i++) {
      const readSize = Math.min(VialConstants.BUFFER_CHUNK_SIZE, macroSize - i * VialConstants.BUFFER_CHUNK_SIZE)

      const msg = new Uint8Array(32)
      msg[0] = VialConstants.Command.GetMacroBuffer
      msg[1] = (i * VialConstants.BUFFER_CHUNK_SIZE) >> 8
      msg[2] = (i * VialConstants.BUFFER_CHUNK_SIZE) & 0xFF
      msg[3] = readSize

      const data = await hidDevice.value.writeRead(Array.from(msg))
      for (let j = 0; j < readSize; j++) {
        macroMemory.push(data[4 + j]!)
      }
      const zeroCount = macroMemory.filter(x => x === 0).length
      if (zeroCount > macroCount.value) {
        break
      }
    }
    let macros = splitArray(macroMemory, x => x === 0)
    macros = macros.slice(0, macroCount.value)
    const deserializedMacros = macroDeserializeV2(macros, macroCount.value)
    keyMacros.value = deserializedMacros
  };

  async function fetchAll() {
    // 并行会报错
    await fetchProductName()
    await fetchLayerCount()
    await fetchMacroCount()
    await fetchVialJson()
    fetchKleDefinition()
    await fetchKeymap()
    fetchLayoutKeymap()
    await fetchMacros()
  }

  function cleanAll() {
    productName.value = null
    layerCount.value = null
    macroCount.value = null
    vialJson.value = null
    kleDefinition.value = null
    keymap.value = null
    layoutKeymap.value = null
  }

  function initializeApi() {
    isTauri() ? (api.value = new TauriHIDApi()) : (api.value = new WebHIDApi())
  }

  async function list() {
    if (!api.value) {
      initializeApi()
    }
    if (!api.value) {
      console.error('HID API not available')
      return
    }

    return await api.value.listDevices()
  }

  async function connect(device: number[] | HIDDevice) {
    if (!api.value) {
      console.error('HID API not available')
      return
    }

    hidDevice.value = await api.value.connectDevice(device)
    vialDevice.value = new VialDevice(hidDevice.value)
  }

  async function disconnect() {
    if (hidDevice.value) {
      await hidDevice.value.disconnect()
      hidDevice.value = null
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
    keymap,
    fetchKeymap,
    layoutKeymap,
    fetchLayoutKeymap,
    indexToDisplay,
    keyMacros,
    fetchAll,
    cleanAll,
    list,
    connect,
    disconnect,
    isConnected,
  }
})
