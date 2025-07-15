<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
</script>

<template>
  <div>
    <span> LayerCount: </span>
    <span> {{ keyboardStore.layerCount }} </span>
  </div>
  <div>
    <span> MacroCount: </span>
    <span> {{ keyboardStore.macroCount }} </span>
  </div>
  <div>
    <span> VialJson: </span>
    <span> {{ keyboardStore.vialJson }} </span>
  </div>
  <div>
    <span> Keymap: </span>
    <span> {{ keyboardStore.keymap }} </span>
  </div>
  <div>
    <span> KleDefinition: </span>
    <span> {{ keyboardStore.kleDefinition }} </span>
  </div>
</template>
