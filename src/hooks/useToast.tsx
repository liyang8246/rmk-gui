import type { Component, JSX } from 'solid-js'
import { createToaster, Toast, Toaster } from '@ark-ui/solid/toast'
import { Portal } from 'solid-js/web'

export type ToastContent = (props: { close: () => void }) => JSX.Element

export interface ToastOptions {
  title?: JSX.Element
  description?: JSX.Element
  type?: 'info' | 'success' | 'warning' | 'error' | 'loading'
  duration?: number
}

const toaster = createToaster({ placement: 'bottom-end' })

export const ToastProvider: Component = () => {
  return (
    <Portal>
      <Toaster toaster={toaster}>
        {toast => (
          <Toast.Root class="rounded-lg bg-base-100 p-4 shadow-lg">
            {toast().meta?.render?.({
              close: () => toaster.dismiss(toast().id),
            })}
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  )
}

export function useToast(content: ToastContent, options: ToastOptions = {}): () => void {
  return () => {
    toaster.create({
      title: options.title,
      description: options.description,
      type: options.type,
      duration: options.duration,
      meta: { render: content },
    })
  }
}
