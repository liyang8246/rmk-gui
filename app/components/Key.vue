<script lang="ts" setup>
import { Key } from "@kcf-hub/kle-serial/dist/interfaces";
const keyboardStore = useKeyboardStore();

const { keys, kleProps } = defineProps<{
  keys?: [string | null, string | null];
  select?: false | 1 | 2;
  kleProps: Key;
}>();

const keyWidth1 = computed(() => {
  return `calc(58px * ${kleProps.width} - 8px)`;
});
const keyWidth2 = computed(() => {
  return `calc(58px * ${kleProps.width2} - 8px)`;
});
const keyHeight1 = computed(() => {
  return `calc(58px * ${kleProps.height} - 8px)`;
});
const keyHeight2 = computed(() => {
  return `calc(58px * ${kleProps.height2} - 8px)`;
});
const keyMaxWidth = computed(() => {
  return `calc(58px * ${kleProps.width > kleProps.width2 ? kleProps.width : kleProps.width2})`;
});
const keyMaxHeight = computed(() => {
  return `calc(58px * ${kleProps.height > kleProps.height2 ? kleProps.height : kleProps.height2})`;
});
const keyMAxInnerWidth = computed(() => {
  return `calc(58px * ${kleProps.width > kleProps.width2 ? kleProps.width : kleProps.width2} - 16px)`;
});
const keyMaxInnerHeight = computed(() => {
  return `calc(58px * ${kleProps.height > kleProps.height2 ? kleProps.height : kleProps.height2} - 16px)`;
});
const translate = computed(() => {
  return (
    `calc((-${kleProps.x} + ${kleProps.rotation_x}) * 58px)` + `calc((-${kleProps.y} + ${kleProps.rotation_y}) * 58px)`
  );
});

// const insertLineBreaks = (str: string, maxLength: number) => {
//   return str.replace(new RegExp(`(.{${maxLength}})`, "g"), "$1\n");
// };
// const keyBreaks = (key: string | null) => {
//   if (key === null) {
//     return "";
//   }
//   if (key.length > 5) {
//     return insertLineBreaks(key, 5);
//   }
//   return key;
// };
</script>
<template>
  <div
    class="rounded-prime-md absolute h-[58px] w-[58px] cursor-pointer text-center text-xs font-bold"
    :style="{
      top: Number(kleProps.y) * 58 + 'px',
      left: Number(kleProps.x) * 58 + 'px',
      transform: `rotate(${kleProps.rotation_angle}deg)`,
      transformOrigin: translate,
      width: keyMaxWidth,
      height: keyMaxHeight,
    }"
  >
    <label>
      <div
        class="rounded-prime-md out-frame absolute"
        :style="{
          width: keyWidth1,
          height: keyHeight1,
        }"
      ></div>
      <div
        class="rounded-prime-md out-frame absolute"
        :style="{
          width: keyWidth2,
          height: keyHeight2,
        }"
      ></div>
      <div
        class="rounded-prime-md out-frame absolute"
        :style="{
          width: keyWidth2,
          height: keyHeight2,
        }"
      ></div>
      <div
        class="rounded-prime-md out-frame absolute"
        :style="{
          width: keyWidth1,
          height: keyHeight1,
        }"
      >
        <div
          class="rounded-prime-md flex-center in-frame"
          :style="{
            width: keyMAxInnerWidth,
            height: keyMaxInnerHeight,
          }"
        >
          <span>key[1]</span>
        </div>
        <!-- <div class="cursor-pointer text-center text-xs font-bold">
          <div v-if="keys[0]" class="relative">
            <div class="rounded-prime-md out-frame">
              <div class="rounded-prime-md flex-top in-frame">
                <span class="">{{ keyBreaks(keys[0]) }}</span>
              </div>
            </div>

            <div class="rounded-prime-md flex-center kc-frame">
              <span>{{ keyBreaks(keys[1]) }}</span>
            </div>
          </div>

          <div v-else class="rounded-prime-md out-frame">
            <div class="rounded-prime-md flex-center in-frame">
              <span>{{ keyBreaks(keys[1]) }}</span>
            </div>
          </div>
        </div> -->
      </div>
    </label>
  </div>
</template>
