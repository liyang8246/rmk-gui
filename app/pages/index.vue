<script lang="ts" setup>
const deviceStore = useDeviceStore();
</script>

<template>
  <div>
    <span> LayerCount: </span>
    <span> {{ deviceStore.layerCount }} </span>
  </div>
  <div>
    <span> MacroCount: </span>
    <span> {{ deviceStore.macroCount }} </span>
  </div>
  <div>
    <span> VialJson: </span>
    <span> {{ deviceStore.vialJson }} </span>
  </div>
  <div>
    <span> KleDefinition: </span>
    <span> {{ deviceStore.kleDefinition }} </span>
  </div>
  <div>
    <span> Keymap: </span>
    <span> {{ deviceStore.keymap }} </span>
  </div>
</template>
