<script setup lang="ts">
import ToolButton from '~/components/ToolButton.vue'

function noop() {}
</script>

<template>
  <div
    class="
      flex h-12 w-fit items-center gap-1 rounded-xl bg-base-100 px-2 py-1
      shadow-lg ring ring-base-300
    "
  >
    <ToolButton name="Layers" icon="lucide:layers" :on-click="noop" />
    <ToolButton name="Macros" icon="lucide:zap" :on-click="noop" />
    <ToolButton name="Combos" icon="lucide:combine" :on-click="noop" />
    <ToolButton name="Wireless" icon="lucide:bluetooth" :on-click="noop" />
    <ToolButton name="Firmware" icon="lucide:cpu" :on-click="noop" />
    <ToolButton name="Setting" icon="lucide:settings" :on-click="noop" />
  </div>
</template>
