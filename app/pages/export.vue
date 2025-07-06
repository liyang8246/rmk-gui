<script lang="ts" setup>
const keyboardStore = useKeyboardStore();

const matrix = ref("");
const keys = computed(() => {
  let ans = [];
  for (let layer = 0; layer < keyboardStore.layerCount!; layer++) {
    let keys = matrix.value;
    for (const [[row, col], origin] of parseCoordinateString(matrix.value)) {
      const key = keyToConfig(keyboardStore.keymap!.get([layer, row, col].toString())!);
      keys = keys.replace(origin, key);
    }
    ans.push(keys);
  }
  return ans;
});

function parseCoordinateString(input: string): [[number, number], string][] {
  const regex = /\(\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  const results: [[number, number], string][] = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    const rawString = match[0];
    const x = parseInt(match[1]!, 10);
    const y = parseInt(match[2]!, 10);
    results.push([[x, y], rawString]);
  }

  return results;
}
</script>

<template>
  <p>matrix</p>
  <Textarea v-model="matrix" autoResize class="w-full" />
  <p>keymap</p>
  <Textarea :value="k" v-for="k in keys" autoResize class="w-full" />
</template>
