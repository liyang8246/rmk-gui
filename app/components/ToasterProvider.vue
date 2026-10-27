<script setup lang="ts">
import type { ToastVariant } from '~/composables/useToast'
import { ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'

const { toasts, dismiss } = useToast()

const NEUTRAL = {
  accent: 'text-content-muted',
  icon: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
}

const VARIANTS: Record<ToastVariant, typeof NEUTRAL> = {
  error: {
    accent: 'bg-error/10 text-error',
    icon: 'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  success: {
    accent: 'bg-success/10 text-success',
    icon: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
}

function variantStyle(variant?: ToastVariant) {
  return variant ? VARIANTS[variant] : NEUTRAL
}
</script>

<template>
  <!-- reka's Presence cannot track ToastRoot's fragment root: toasts stay mounted and useToast's
       timer drops them once the fade-out transition has finished. -->
  <ToastProvider disable-swipe>
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :duration="toast.duration"
      :type="toast.variant === 'error' ? 'foreground' : 'background'"
      force-mount
      class="
        pointer-events-auto flex w-full items-start gap-3 rounded-lg bg-base-100 p-4 shadow-lg
        ring-1 ring-border transition-opacity duration-150
        data-[state=closed]:opacity-0
        starting:opacity-0
      "
      @update:open="(value: boolean) => { if (!value) dismiss(toast.id) }"
    >
      <span
        :class="variantStyle(toast.variant).accent" class="
          flex size-6 shrink-0 items-center justify-center rounded-full
        " aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4">
          <path stroke-linecap="round" stroke-linejoin="round" :d="variantStyle(toast.variant).icon" />
        </svg>
      </span>

      <div class="min-w-0 flex-1">
        <ToastTitle class="text-sm font-medium text-content">
          {{ toast.title }}
        </ToastTitle>
        <ToastDescription
          v-if="toast.description" class="mt-1 text-sm wrap-break-word text-content-muted"
        >
          {{ toast.description }}
        </ToastDescription>
      </div>

      <ToastClose
        aria-label="Dismiss"
        class="
          -m-1 shrink-0 rounded-sm p-1 text-content-muted
          hover:text-content-muted
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content
        "
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </ToastClose>
    </ToastRoot>

    <ToastViewport
      class="
        pointer-events-none fixed right-4 bottom-4 flex w-[min(24rem,calc(100vw-2rem))] flex-col
        gap-2 p-0 outline-none
      "
    />
  </ToastProvider>
</template>
