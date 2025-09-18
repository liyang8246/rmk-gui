<script lang="ts" setup>

const keyboardStore = useKeyboardStore()
const value = ref('LayerCount')

interface DisplayItem {
  label: string
  value: () => any
}

const displayOptions: Record<string, DisplayItem> = {
  LayerCount: { label: 'LayerCount', value: () => keyboardStore.layerCount },
  MacroCount: { label: 'MacroCount', value: () => keyboardStore.macroCount },
  VialJson: { label: 'VialJson', value: () => keyboardStore.vialJson },
  Keymap: { label: 'Keymap', value: () => keyboardStore.layoutKeymap },
  KleDefinition: { label: 'KleDefinition', value: () => keyboardStore.kleDefinition },
  getMacros: { label: 'getMacros', value: () => keyboardStore.keyMacros },
}

const currentDisplay = computed<DisplayItem>(() => {
  return displayOptions[value.value] || { label: '', value: () => undefined }
})
</script>

<template>
  <div>
    <select id="1" v-model="value" name="1">
      <option
        v-for="(option, key) in displayOptions"
        :key="key"
        :value="option.label"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
  <div>
    <span>{{ currentDisplay.label }}: </span>
    <pre>{{ currentDisplay.value() }}</pre>
  </div>
</template>
