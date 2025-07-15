<script lang="ts" setup>
const keyboardStore = useKeyboardStore();

const value = ref("LayerCount");
</script>

<template>
  <div>
    <select v-model="value" name="1" id="1">
      <option value="LayerCount">LayerCount</option>
      <option value="MacroCount">MacroCount</option>
      <option value="VialJson">VialJson</option>
      <option value="Keymap">Keymap</option>
      <option value="KleDefinition">KleDefinition</option>
    </select>
  </div>
  <div v-if="value == 'LayerCount'">
    <span> LayerCount: </span>
    <pre> {{ keyboardStore.layerCount }} </pre>
  </div>
  <div v-else-if="value == 'MacroCount'">
    <span> MacroCount: </span>
    <pre> {{ keyboardStore.macroCount }} </pre>
  </div>
  <div v-else-if="value == 'VialJson'">
    <span> VialJson: </span>
    <pre> {{ keyboardStore.vialJson }} </pre>
  </div>
  <div v-else-if="value == 'Keymap'">
    <span> Keymap: </span>
    <pre> {{ keyboardStore.keymap }} </pre>
  </div>
  <div v-else-if="value == 'KleDefinition'">
    <span> KleDefinition: </span>
    <pre> {{ keyboardStore.kleDefinition }} </pre>
  </div>
</template>
