export const usePageMacrosStore = defineStore('PageMacros', () => {
  const currMacro = ref(0)
  const operation = ref(['', '', ''])
  const operationData = ref<MacroAction[]>(Object.keys(MacroCode).filter(key => !Number.isNaN(Number(key))).map(key => fromMacroCode(fromU8(Number(key)))))
  return { currMacro, operation, operationData }
})
