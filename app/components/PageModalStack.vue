<script setup lang="ts">
import PageModalItem from '~/components/PageModalItem.vue'
import { usePageModalStore } from '~/composables/usePageModal'

const store = usePageModalStore()
</script>

<template>
  <PageModalItem
    v-for="entry in store.stack"
    :key="entry.id"
    :entry="entry"
  />
</template>
