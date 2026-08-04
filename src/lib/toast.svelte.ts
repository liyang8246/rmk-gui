export type ToastType = 'success' | 'warning' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  title: string
  /// A second, smaller line — connection errors carry a next step to try.
  detail?: string
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
    // A retried failure repeats its toast; replace the stale copy rather than
    // stack persistent duplicates the user has to close one by one.
    if (type === 'error') {
      for (const t of [...this.items]) {
        if (t.type === 'error' && t.title === title && t.detail === detail) this.dismiss(t.id)
      }
    }
    const id = ++this.#seq
    this.items.push({ id, type, title, detail })
    this.#arm(id)
  }

  /// Errors stay until dismissed: an expired one leaves a user who looked away
  /// facing a blank connect screen with no explanation. The rest self-expire.
  #arm(id: number) {
    if (this.items.find(t => t.id === id)?.type === 'error') return
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
