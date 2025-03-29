<script lang="ts" setup>
const props = defineProps<{
  items: any[];
  label?: string;
}>();
const selected = defineModel();
</script>

<template>
  <div class="flex w-fit rounded-md overflow-hidden border border-base-200 shadow-sm">
    <label v-if="label" class="cursor-pointer">
      <span class="flex items-center h-full px-3">{{ label }}</span>
    </label>
    <div class="flex rounded-l-lg overflow-hidden bg-base-200">
      <template v-for="(item, index) in items" :key="index">
        <input type="radio" :id="item" :value="item" v-model="selected" class="peer hidden" />
        <label :for="item" class="cursor-pointer">
          <span
            class="flex items-center h-full px-3"
            :class="{ 'bg-primary': selected == item, 'text-base-100': selected == item }"
            >{{ item }}</span
          >
        </label>
      </template>
    </div>
  </div>
</template>
