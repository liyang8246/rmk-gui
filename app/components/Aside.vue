<script lang="ts" setup>
const route = useRoute();

const pages = [
  { name: "Home", icon: "tabler:home-filled", to: "/" },
  { name: "Keymap", icon: "tabler:keyboard-filled", to: "/keymap" },
  { name: "Marcos", icon: "tabler:circle-letter-a-filled", to: "/marco" },
  { name: "Settings", icon: "tabler:settings-filled", to: "/settings" },
];

const isActive = (path: string) => {
  return route.path === path;
};
</script>

<template>
  <div class="flex h-screen w-48 flex-col border-r-2 bg-surface-50 p-3 dark:border-surface-800 dark:bg-surface-950">
    <img src="~/assets/rmk_logo.png" class="mx-auto mb-3 h-[54px]" />
    <div class="rounded-prime-xl bg-surface-100 p-3 shadow-inner dark:bg-surface-900">
      <div class="flex flex-col gap-3">
        <NuxtLink v-for="page in pages" :key="page.to" :to="page.to" class="no-underline">
          <AsideCard :name="page.name" :icon="page.icon" :selected="isActive(page.to)" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
