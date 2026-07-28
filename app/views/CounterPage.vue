<script setup lang="ts">
import { ref } from 'vue'
import { usePageModalContext } from '~/composables/usePageModal'

const count = ref(0)
const { close } = usePageModalContext()
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <h2 class="text-lg font-semibold text-base-content">
      Counter
    </h2>
    <div class="flex items-center gap-4">
      <button
        class="
          size-10 rounded-lg bg-base-300 text-lg font-bold text-base-content
          hover:bg-base-200
        "
        @click="count--"
      >
        -
      </button>
      <span class="min-w-12 text-center text-2xl font-bold text-base-content">{{ count }}</span>
      <button
        class="
          size-10 rounded-lg bg-base-300 text-lg font-bold text-base-content
          hover:bg-base-200
        "
        @click="count++"
      >
        +
      </button>
    </div>
    <button
      class="
        self-end rounded-lg bg-primary px-4 py-2 text-sm text-primary-content
        hover:opacity-90
      "
      @click="close"
    >
      Close
    </button>
  </div>
</template>
