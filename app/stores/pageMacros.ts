export const usePageMacrosStore = defineStore('PageMacros', () => {
  const currMacro = ref(0)
  const operationData = ref<MacroAction[]>(Object.keys(MacroCode).filter(key => !Number.isNaN(Number(key))).filter(key => key !== '1').map(key => fromMacroCode(fromU8(Number(key)))))
  return { currMacro, operationData }
})
