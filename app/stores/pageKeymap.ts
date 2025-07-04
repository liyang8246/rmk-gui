export const useKeyboardStore = defineStore("keyboard", () => {
  const currLayer = ref(0);
  const currKey = ref<[number, number, number]>([0, 0, 0]);

  return {
    currLayer,
    currKey,
  };
});
