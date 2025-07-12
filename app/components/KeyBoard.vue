<script lang="ts" setup>
const { keys, select } = defineProps<{
  keys: [string | null, string | null];
  select?: false | 1 | 2;
  kleProps?: InstanceType<typeof KleKey>;
}>();

const insertLineBreaks = (str: string, maxLength: number) => {
  return str.replace(new RegExp(`(.{${maxLength}})`, "g"), "$1\n");
};
const keyBreaks = (key: string | null) => {
  if (key === null) {
    return "";
  }
  if (key.length > 5) {
    return insertLineBreaks(key, 5);
  }
  return key;
};
</script>

<template>
  <div class="cursor-pointer text-center text-xs font-bold">
    <!-- kc -->
    <div v-if="keys[0]" class="relative">
      <div class="rounded-prime-md out-frame h-14 w-14">
        <div class="rounded-prime-md flex-top in-frame h-12 w-12">
          <span class="">{{ keyBreaks(keys[0]) }}</span>
        </div>
      </div>
      <!-- key -->
      <div class="rounded-prime-md flex-center kc-frame left-[4px] top-6 h-7 w-12">
        <span>{{ keyBreaks(keys[1]) }}</span>
      </div>
    </div>
    <!-- key -->
    <div v-else class="rounded-prime-md out-frame h-14 w-14">
      <div class="rounded-prime-md flex-center in-frame h-12 w-12">
        <span>{{ keyBreaks(keys[1]) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
