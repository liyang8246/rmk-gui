export type ToastType = 'success' | 'warning' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  title: string
  /// A second, smaller line — connection errors carry a next step to try.
  detail?: string
  /// Never auto-dismissed; the close button is the only way out.
  sticky?: boolean
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

  #push(type: ToastType, title: string, detail?: string) {
    // A retried failure repeats its toast; sticky errors never expire, so the
    // copy already showing says everything the new one would.
    if (type === 'error' && this.items.some(t => t.title === title && t.detail === detail)) return
    const id = ++this.#seq
    // Errors stay until dismissed: an expired one leaves a user who looked
    // away facing a blank connect screen with no explanation.
    this.items.push({ id, type, title, detail, sticky: type === 'error' })
    this.#arm(id)
  }

  #arm(id: number) {
    const toast = this.items.find(t => t.id === id)
    if (!toast || toast.sticky) return
    this.#timers.set(id, setTimeout(() => this.dismiss(id), DURATION_MS))
  }

  success(title: string) { this.#push('success', title) }
  warning(title: string) { this.#push('warning', title) }
  error(title: string, detail?: string) { this.#push('error', title, detail) }
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
    this.#arm(id)
  }
}

export const toast = new ToastStore()
