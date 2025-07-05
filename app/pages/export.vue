<script lang="ts" setup>
const keyboardStore = useKeyboardStore();

const matrix = ref("");
const keys = computed(() => {
  let ans = matrix.value;
  const layer = 1;
  for (const [[row, col], origin] of parseCoordinateString(matrix.value)) {
    const key = keyToConfig(keyboardStore.keymap![layer * (row + 1) * (col + 1)]!);
    ans = ans.replace(origin, key);
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
  <Textarea v-model="matrix" autoResize class="w-full" />
  <Textarea :value="keys" autoResize class="w-full" />
</template>
