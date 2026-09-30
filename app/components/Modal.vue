<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

const { title, description } = defineProps<{
  title: string
  description?: string
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot :open="open" @update:open="open = $event">
    <DialogPortal>
      <DialogOverlay data-slot="overlay" class="fixed inset-0 z-50 bg-black/40" />
      <DialogContent
        data-slot="content"
        class="
          fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md
          -translate-1/2 flex-col rounded-lg bg-white shadow-xl ring-1 ring-black/10
          focus:outline-none
        "
      >
        <header class="flex shrink-0 items-start justify-between gap-4 px-6 pt-5">
          <div class="min-w-0">
            <DialogTitle class="text-base font-semibold text-neutral-900">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-sm text-neutral-500">
              {{ description }}
            </DialogDescription>
            <DialogDescription v-else class="sr-only" />
          </div>
          <DialogClose
            aria-label="Close"
            class="
              -m-1 shrink-0 rounded-sm p-1 text-neutral-400
              hover:text-neutral-700
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-neutral-900
            "
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="
                size-4
              " aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </DialogClose>
        </header>

        <div v-if="$slots.default" class="min-h-0 overflow-y-auto px-6 py-4">
          <slot />
        </div>

        <footer
          v-if="$slots.footer" class="
            flex shrink-0 justify-end gap-2 border-t border-neutral-100 px-6 py-4
          "
        >
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
/* reka's Presence only detects CSS animations, so both leave transitions are keyframes here. */
[data-slot='overlay'] {
  animation: overlay-in 150ms ease-out;
}
[data-slot='overlay'][data-state='closed'] {
  animation: overlay-out 150ms ease-in;
}
[data-slot='content'] {
  animation: modal-in 150ms ease-out;
}
[data-slot='content'][data-state='closed'] {
  animation: modal-out 150ms ease-in;
}

@keyframes overlay-in {
  from {
    opacity: 0;
  }
}
@keyframes overlay-out {
  to {
    opacity: 0;
  }
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(0.5rem);
  }
}
@keyframes modal-out {
  to {
    opacity: 0;
    transform: scale(0.96) translateY(0.5rem);
  }
}
</style>
