<script lang="ts" setup>
const keyboardStore = useKeyboardStore()

const matrix = ref('')
const keys = computed(() => {
  const ans = []
  for (let layer = 0; layer < keyboardStore.layerCount!; layer++) {
    let keys = matrix.value
    for (const [[row, col], origin] of parseCoordinateString(matrix.value)) {
      const key = keyToConfig(keyboardStore.keymap!.get([layer, row, col].toString())!)
      keys = keys.replace(origin, key)
    }
    ans.push(keys)
  }
  return ans
})

function parseCoordinateString(input: string): [[number, number], string][] {
  const regex = /\(\s*(\d+)\s*,\s*(\d+)\s*\)/
  const results: [[number, number], string][] = []
  let match = regex.exec(input)

  while (match !== null) {
    const rawString = match[0]
    const x = Number.parseInt(match[1]!, 10)
    const y = Number.parseInt(match[2]!, 10)
    results.push([[x, y], rawString])
    match = regex.exec(input)
  }

  return results
}
</script>

<template>
  <p>matrix</p>
  <Textarea v-model="matrix" auto-resize class="w-full" />
  <p>keymap</p>
  <Textarea v-for="k in keys" :key="k" :value="k" auto-resize class="w-full" />
</template>
