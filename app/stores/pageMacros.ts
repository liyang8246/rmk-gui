export const usePageMacrosStore = defineStore('PageMacros', () => {
  const selectedMacro = ref(0)
  return { selectedMacro }
})
