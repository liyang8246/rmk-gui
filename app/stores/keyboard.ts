export const useKeyboardStore = defineStore('Keyboard', () => {
  const keyboard = ref<Keyboard>({
    name: '',
    layer: 0,
    row: 0,
    col: 0,
    keys: [],
  });
  const keyboardSize = computed(() => {
    let maxWidth = 0;
    let maxHeight = 0;
    keyboard.value.keys.forEach((key) => {
      const rightEdge = key.position_x[0] * 58 + key.width[0] * 58;
      const bottomEdge = key.position_y[0] * 58 + 58;
      maxWidth = Math.max(maxWidth, rightEdge);
      maxHeight = Math.max(maxHeight, bottomEdge);
    });
    return { width: maxWidth, height: maxHeight };
  });
  return { keyboard, keyboardSize };
});
