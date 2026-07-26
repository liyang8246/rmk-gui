import type { Component, JSX } from 'solid-js'
import { createToaster, Toast, Toaster, useToastContext } from '@ark-ui/solid/toast'
import { Show } from 'solid-js'

export type ToastContent = () => JSX.Element

export interface ToastOptions {
  title?: JSX.Element
  description?: JSX.Element
  type?: 'info' | 'success' | 'warning' | 'error' | 'loading'
  duration?: number
}

const defaults: Record<NonNullable<ToastOptions['type']>, number> = {
  info: 5000,
  success: 2000,
  warning: 5000,
  error: 5000,
  loading: Infinity,
}

const progressColor: Record<string, string> = {
  info: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}

const toaster = createToaster({ placement: 'bottom-end' })

// Top-level sibling of #root; no transform/overflow ancestors
export const ToastProvider: Component = () => {
  return (
    <Toaster toaster={toaster}>
      {(toast) => {
        // paused lives on the connected api, not the render-prop value
        const api = useToastContext()
        const duration = toast().meta?.duration
        return (
          <Toast.Root class="
            relative w-64 overflow-hidden rounded-lg bg-base-100 p-4 shadow-lg
          "
          >
            {toast().meta?.render?.()}
            <Show when={duration !== Infinity}>
              <div
                class={`
                  absolute bottom-0 left-0 h-0.5 w-full origin-left
                  ${progressColor[toast().type ?? 'info'] ?? `bg-primary`}
                `}
                style={{
                  'animation-name': 'toast-progress-shrink',
                  'animation-duration': `${duration}ms`,
                  'animation-timing-function': 'linear',
                  'animation-fill-mode': 'forwards',
                  'animation-play-state': api().paused ? 'paused' : 'running',
                }}
              />
            </Show>
          </Toast.Root>
        )
      }}
    </Toaster>
  )
}

export function useToast(content: ToastContent, options: ToastOptions = {}): () => void {
  return () => {
    const duration = options.duration ?? defaults[options.type ?? 'info']
    toaster.create({
      title: options.title,
      description: options.description,
      type: options.type,
      duration,
      meta: { render: content, duration },
    })
  }
}
