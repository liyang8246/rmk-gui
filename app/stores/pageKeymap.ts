export const usePageKeymapStore = defineStore("pageKeymap", () => {
  const currLayer = ref(0);
  const currKey = ref<[number, number, number]>([0, 0, 0]);
  const keyZone = ref<"outer" | "inner" | null>(null);

  return {
    currLayer,
    currKey,
    keyZone,
  };
});
