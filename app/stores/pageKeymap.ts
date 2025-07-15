export const usePageKeymapStore = defineStore('pageKeymap', () => {
  const currLayer = ref(0)
  const currKey = ref<[number, number, number]>([0, 0, 0])

  return {
    currLayer,
    currKey,
  }
})
