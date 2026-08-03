export type ToastType = 'success' | 'warning' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  title: string
}

/// Long enough to read a `describeKeyboardError`; hovering holds the clock.
const DURATION_MS = 4000

class ToastStore {
  /// Oldest first, and the list grows rather than keeping a single slot, so a
  /// burst of device errors — three profile commands each reporting back,
  /// say — no longer overwrites itself.
  items = $state<Toast[]>([])

  #seq = 0
  #timers = new Map<number, ReturnType<typeof setTimeout>>()

  #push(type: ToastType, title: string) {
    const id = ++this.#seq
    this.items.push({ id, type, title })
    this.#timers.set(id, setTimeout(() => this.dismiss(id), DURATION_MS))
  }

  success(title: string) { this.#push('success', title) }
  warning(title: string) { this.#push('warning', title) }
  error(title: string) { this.#push('error', title) }
  info(title: string) { this.#push('info', title) }

  dismiss(id: number) {
    clearTimeout(this.#timers.get(id))
    this.#timers.delete(id)
    this.items = this.items.filter(t => t.id !== id)
  }

  hold(id: number) {
    clearTimeout(this.#timers.get(id))
  }

  /// The full duration again, not the remainder: a held toast was being read,
  /// and the arithmetic is not worth the bookkeeping.
  release(id: number) {
    this.#timers.set(id, setTimeout(() => this.dismiss(id), DURATION_MS))
  }
}

export const toast = new ToastStore()
