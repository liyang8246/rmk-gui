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

  const keymap = ref<IndexMap | null>(null)
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

  const layoutKeymap = ref<IndexMap | null>(null)
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
    layoutKeymap.value = vialDevice.value.layoutKeymap(kleDefinition.value, keymap.value as IndexMap, layerCount.value)
  }

  function fetchKeyList(layer: number): Key[] {
    if (!layerCount.value) {
      throw new Error('Layer count not available')
    }
    if (!kleDefinition.value) {
      throw new Error('KLE definition not available')
    }
    if (!layoutKeymap.value) {
      throw new Error('Layout keymap not available')
    }
    if (layer >= layerCount.value) {
      throw new Error('Invalid layer')
    }

    const pikeGeo = (k: any) => pick(k, ['x', 'y', 'width', 'height', 'x2', 'y2', 'width2', 'height2', 'rotation_x', 'rotation_y', 'rotation_angle'])
    return kleDefinition.value.keys.map((k) => {
      const [row, col] = k.labels[0]!.split(',').map(Number)
      const keycode = layoutKeymap.value!.get([layer, row!, col!])!
      return {
        geometry: pikeGeo(k),
        position: { row, col },
        info: {
          code: keycode,
          symbol: [...keyToLable(keycode)],
        },
      } as Key
    })
  }

  const keyMacros = ref<Array<Array<MacroAction>> | null>(null)
  async function fetchMacros() {
    if (!vialDevice.value) {
      throw new Error('Vial device not available')
    }
    if (!macroCount.value) {
      throw new Error('Macro Count not available')
    }
    keyMacros.value = await vialDevice.value.macros(macroCount.value)
  };

  async function setKeycode(lyrRowCol: [number, number, number], keycode: number) {
    if (!vialDevice.value) {
      throw new Error('Vial device not available')
    }
    await vialDevice.value.setKeycode(lyrRowCol, keycode)
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
    keyMacros.value = null
  }

  function initializeApi() {
    if (api.value)
      return
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
      vialDevice.value = null
      cleanAll()
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
    fetchKeymap,
    layoutKeymap,
    fetchLayoutKeymap,
    fetchKeyList,
    keyMacros,
    fetchAll,
    cleanAll,
    list,
    connect,
    disconnect,
    isConnected,
    setKeycode,
  }
})
