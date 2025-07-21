export const usePageKeymapStore = defineStore('pageKeymap', () => {
  const currLayer = ref(0)

  const currKey = ref<[number, number, number,string | null, string | null, 'outer' | 'inner' | null]>([0, 0, 0,null,null,null])
  const replaceKey = ref<[number, number, number,string | null, string | null, 'outer' | 'inner' | null]>([0, 0, 0,null,null, null])
  function clearSelectedProps() {
    currKey.value = [0, 0, 0,null,null,null]
    replaceKey.value = [0, 0, 0,null,null,null]
  }

  const keyMargin = 6
  function fixSize(size: number): string {
    return `calc(56px * ${size} - ${keyMargin}px)`
  }
  function maxSize(size1: number, size2: number): number {
    return size1 > size2 ? size1 : size2
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
    replaceKey,
    clearSelectedProps,
    keyMargin,
    fixSize,
    maxSize,
    maxy,
    maxx,
    extpending,
    getMaxSize,
  }
})
