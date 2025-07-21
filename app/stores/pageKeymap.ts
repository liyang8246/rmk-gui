export const usePageKeymapStore = defineStore('pageKeymap', () => {
  const currLayer = ref(0)

  const currKey = ref<[number, number, number]>([0, 0, 0])
  const keyZone = ref<'outer' | 'inner' | null>(null)
  function clearSelectedProps() {
    currKey.value = [0, 0, 0]
    keyZone.value = null
  }

  const maxy = ref(0)
  const maxx = ref(0)
  const extpending = ref(0)
  function getMaxSize(x: number | null, y: number | null, ro_x: number | null, ro_y: number | null): void {
    if (y !== null && x !== null && ro_x !== null && ro_y !== null) {
      maxy.value = Math.max(maxy.value, y)
      maxx.value = Math.max(maxx.value, x)
      extpending.value = Math.max(extpending.value, ro_x + ro_y - x - y)
    }
  }

  return {
    currLayer,
    currKey,
    keyZone,
    clearSelectedProps,
    maxy,
    maxx,
    extpending,
    getMaxSize,
  }
})
