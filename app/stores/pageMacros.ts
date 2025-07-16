export const usePageMacrosStore = defineStore('PageMacros', () => {
  const currMacro = ref(0)
  return { currMacro }
})
