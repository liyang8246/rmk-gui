<script lang="ts" setup>
const { keys, kleProps } = defineProps<{
  keys: [string | null, string | null];
  select?: false | 1 | 2;
  kleProps: InstanceType<typeof KleKey>;
}>();

const keyWidth1 = computed(() => {
  return `calc(56px * ${kleProps.width} - 8px)`;
});
const keyWidth2 = computed(() => {
  return `calc(56px * ${kleProps.width2} - 8px)`;
});
const keyHeight1 = computed(() => {
  return `calc(56px * ${kleProps.height} - 8px)`;
});
const keyHeight2 = computed(() => {
  return `calc(56px * ${kleProps.height2} - 8px)`;
});
const maxWhith = computed(() => {
  return kleProps.width > kleProps.width2 ? kleProps.width : kleProps.width2;
});
const maxHeight = computed(() => {
  return kleProps.height > kleProps.height2 ? kleProps.height : kleProps.height2;
});
const keyMaxWidth = computed(() => {
  return `calc(56px * ${maxWhith.value} - 8px)`;
});
const keyMaxHeight = computed(() => {
  return `calc(56px * ${maxHeight.value} - 8px)`;
});
const translate = computed(() => {
  return (
    `calc((-${kleProps.x} + ${kleProps.rotation_x}) * 56px)` + `calc((-${kleProps.y} + ${kleProps.rotation_y}) * 56px)`
  );
});

const insertLineBreaks = (str: string, maxLength: number) => {
  return str.replace(new RegExp(`(.{${maxLength}})`, "g"), "$1\n");
};
const keyBreaks = (key: string | null) => {
  if (key === null) {
    return "";
  }
  if (key.length >= 7 * maxWhith.value) {
    return insertLineBreaks(key, 6 * maxWhith.value);
  }
  return key;
};
</script>
<template>
  <div
    class="rounded-prime-md absolute h-14 w-14 cursor-pointer text-center text-xs font-bold text-surface-700 dark:text-surface-300"
    :style="{
      top: Number(kleProps.y) * 56 + 'px',
      left: Number(kleProps.x) * 56 + 'px',
      transform: `rotate(${kleProps.rotation_angle}deg)`,
      transformOrigin: translate,
      width: keyMaxWidth,
      height: keyMaxHeight,
    }"
  >
    <label>
      <div
        class="rounded-prime-md absolute bg-surface-300 dark:bg-surface-600"
        :style="{
          width: keyWidth1,
          height: keyHeight1,
        }"
      ></div>
      <div
        class="rounded-prime-md absolute bg-surface-300 dark:bg-surface-600"
        :style="{
          width: keyWidth2,
          height: keyHeight2,
        }"
      ></div>
      <div
        class="rounded-prime-md absolute bg-surface-300 dark:bg-surface-600"
        :style="{
          width: keyWidth2,
          height: keyHeight2,
        }"
      ></div>
      <!-- kc -->
      <div v-if="keys[0]" class="relative">
        <div
          class="rounded-prime-md absolute flex justify-center bg-surface-300 pt-[2px] dark:bg-surface-600"
          :style="{
            width: keyWidth1,
            height: keyHeight1,
          }"
        >
          <span>{{ keyBreaks(keys[0]) }}</span>
        </div>

        <div
          class="rounded-prime-md absolute left-[4px] flex items-center justify-center border-t-2 border-surface-800 bg-surface-300 dark:border-surface-200 dark:bg-surface-600"
          :style="{
            top: '17px',
            width: kleProps.width * 56 - 8 * 2 + 'px',
            height: kleProps.height * 56 - 8 - 4 - 17 + 'px',
          }"
        >
          <span>{{ keyBreaks(keys[1]) }}</span>
        </div>
      </div>
      <!-- key -->
      <div
        v-else
        class="rounded-prime-md absolute flex items-center justify-center bg-surface-300 dark:bg-surface-600"
        :style="{
          width: keyWidth1,
          height: keyHeight1,
        }"
      >
        <span>{{ keyBreaks(keys![1]) }}</span>
      </div>
    </label>
  </div>
</template>
