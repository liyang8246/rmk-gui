export const usePageKeymap = defineStore('PageKeymap', () => {
  const selectedLyrRowCol = ref<[number, number, number]>([0, 0, 0]);
  const selectedLayer = ref(0);
  return { selectedLyrRowCol, selectedLayer };
});
