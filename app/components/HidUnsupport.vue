<script lang="ts" setup>
const visible = !hidSupport()
</script>

<template>
  <Dialog
    :visible="visible" modal :closable="false" :maximized="true" header="Unsupported Browser"
  >
    <p> Your current browser does not support WebHID. </p>
    <p> Please use <a href="https://www.google.com/chrome" target="_blank" class="underline">Chrome</a> or <a href="https://www.microsoft.com/edge" target="_blank" class="underline">Edge</a>. </p>
    <p> Or use client version download from <a href="https://github.com/liyang8246/rmk-gui/releases" target="_blank" class="underline">Github Release</a>. </p>
  </Dialog>
</template>
