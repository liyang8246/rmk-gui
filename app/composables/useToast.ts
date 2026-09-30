export type ToastVariant = 'error' | 'info' | 'success'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  /** Auto-dismiss delay in ms; 0 keeps the toast until dismissed. */
  duration?: number
}

export interface Toast {
  id: number
  title: string
  description?: string
  variant: ToastVariant
  duration: number
}

const DEFAULT_DURATION = 5_000
const ERROR_DURATION = 8_000
/** Long enough for the 150ms fade-out to finish. */
const REMOVE_DELAY = 200

const toasts = ref<Toast[]>([])
let nextId = 0

function remove(id: number): void {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

function add(options: ToastOptions): number {
  const id = nextId++
  toasts.value.push({
    id,
    title: options.title,
    description: options.description,
    variant: options.variant ?? 'info',
    duration: options.duration ?? (options.variant === 'error' ? ERROR_DURATION : DEFAULT_DURATION),
  })
  return id
}

/** Called once reka closed a toast; keep it mounted until the fade-out is over. */
function dismiss(id: number): void {
  if (!toasts.value.some(t => t.id === id)) return
  setTimeout(remove, REMOVE_DELAY, id)
}

export function useToast() {
  return {
    toasts,
    add,
    dismiss,
    error: (title: string, description?: string) => add({ title, description, variant: 'error' }),
    info: (title: string, description?: string) => add({ title, description, variant: 'info' }),
    success: (title: string, description?: string) => add({ title, description, variant: 'success' }),
  }
}
