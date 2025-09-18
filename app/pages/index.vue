<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const keys = ref<Key[]>([])
function loadKeys() {
  keys.value = keyboardStore.fetchKeyList(0)
}
</script>

<template>
  <button @click="loadKeys()">
    btn
  </button>
  <div>
    {{ keys }}
  </div>
</template>
