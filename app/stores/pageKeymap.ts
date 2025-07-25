export const usePageKeymapStore = defineStore('pageKeymap', () => {
  const currLayer = ref(0)

  const currKey = ref<[number, number, number, 'outer' | 'inner' | null]>([0, 0, 0, null])
  const replaceKey = ref<[ string | null, string | null]>([null, null])

  const showMapperPanel = ref(false)
  function clearSelectedProps() {
    currKey.value = [0, 0, 0, null]
    showMapperPanel.value = false
  }

  return {
    currLayer,
    currKey,
    replaceKey,
    showMapperPanel,
    clearSelectedProps,
  }
})
