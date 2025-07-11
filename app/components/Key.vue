<script lang="ts" setup>
const { keys, select } = defineProps<{
  keys: [string | null, string | null];
  select?: false | 1 | 2;
  kleProps?: typeof KLEKey;
}>();
</script>

<template>
  <div class="cursor-pointer">
    <div v-if="keys[0]" class="relative">
      <div
        class="rounded-prime-md h-14 w-14 border border-surface-300 bg-surface-300 p-2 pb-3 pt-1 hover:border hover:border-black"
      >
        <div class="rounded-prime-md flex h-10 w-10 items-start justify-center bg-gray-100">
          <span>{{ keys[0] }}</span>
        </div>
      </div>
      <div
        class="rounded-prime-md absolute left-[9px] top-7 flex h-5 w-10 items-center justify-center border border-white bg-white hover:border hover:border-black"
      >
        <span>{{ keys[1] }}</span>
      </div>
    </div>

    <div
      v-else
      class="rounded-prime-md h-14 w-14 border border-surface-300 bg-surface-300 p-2 pb-3 pt-1 hover:border hover:border-black"
    >
      <div class="rounded-prime-md flex-center h-10 w-10 bg-gray-100">
        <span>{{ keys[1] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
