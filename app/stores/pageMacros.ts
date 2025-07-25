export const usePageMacrosStore = defineStore('PageMacros', () => {
  const currMacro = ref(0)
  const currKey = ref<[number, number, number, 'outer' | 'inner' | null]>([0, 0, 0, null])
  const showMapperPanel = ref(false)
  function clearSelectedProps() {
    currKey.value = [0, 0, 0, null]
    showMapperPanel.value = false
  }

  const operationData = ref<MacroAction[]>(Object.keys(MacroCode).filter(key => !Number.isNaN(Number(key))).filter(key => key !== '1').map(key => fromMacroCode(fromU8(Number(key)))))
  return { currMacro, currKey, clearSelectedProps, operationData, showMapperPanel }
})
