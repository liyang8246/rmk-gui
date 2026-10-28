<template>
  <div class="isolate flex h-screen bg-base-300 p-2.5 text-content select-none">
    <Sidebar />

    <main
      class="
        ml-2.5 flex flex-1 items-center justify-center rounded-xl bg-base-100 ring-1 ring-border
      "
    >
      <NuxtPage />
    </main>

    <div id="modal-provider" />
    <ToasterProvider />
  </div>
</template>
