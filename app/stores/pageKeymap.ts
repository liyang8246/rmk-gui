export const usePageKeymapStore = defineStore('pageKeymap', () => {
  const currLayer = ref(0)
  const currKey = ref<[number, number, number]>([0, 0, 0])
  const keyZone = ref<'outer' | 'inner' | null>(null)
  function clearSelectedProps() {
    currKey.value = [0, 0, 0]
    keyZone.value = null
  }
  return {
    currLayer,
    currKey,
    keyZone,
    clearSelectedProps,
  }
})
