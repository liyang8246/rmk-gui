<script lang="ts" setup>
const keyboard = useKeyboardStore();
const pageKeymap = usePageKeymap();
keyboard.keyboard.keys = await invoke<Key[]>('get_layout_keymap');
let keycode: Key[] = await invoke('get_keycode_list');

const switchNext = () => {
  const index = keyboard.keyboard.keys.findIndex(
    (key) => key.lyr_row_col.toString() === pageKeymap.selectedLyrRowCol.toString()
  );
  if (index === -1) return;
  // 保证layer相同
  let nextIndex = (index + 1) % keyboard.keyboard.keys.length;
  while (keyboard.keyboard.keys[index]?.lyr_row_col[0] !== keyboard.keyboard.keys[nextIndex]?.lyr_row_col[0]) {
    nextIndex = (nextIndex + 1) % keyboard.keyboard.keys.length;
  }
  pageKeymap.selectedLyrRowCol = keyboard.keyboard.keys[nextIndex]?.lyr_row_col as [number, number, number];
};
const handler = async (event: KeyboardEvent) => {
  await invoke('set_keycode_from_name', {
    lyrRowCol: pageKeymap.selectedLyrRowCol,
    name: event.key,
  });
  await invoke('update_keymap');
  keyboard.keyboard.keys = await invoke<Key[]>('get_layout_keymap');
  switchNext();
};

onMounted(() => {
  window.addEventListener('keydown', handler);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handler);
});

const setKeycode = async (key: Key) => {
  await invoke('set_keycode', {
    lyrRowCol: pageKeymap.selectedLyrRowCol,
    keycode: key.keycode,
  });
  await invoke('update_keymap');
  keyboard.keyboard.keys = await invoke<Key[]>('get_layout_keymap');
  switchNext();
};
</script>

<template>
  <div class="flex flex-col h-0">
    <KeyBoard v-model="keyboard.keyboard.keys"></KeyBoard>
    <div
      class="flex-grow max-h-full flex flex-wrap justify-between w-10/12 mx-auto mt-8 overflow-y-auto overflow-x-hidden"
    >
      <Key v-for="key in keycode" :keyProp="key" @click="setKeycode(key)" />
    </div>
  </div>
</template>
