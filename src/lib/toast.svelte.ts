const DISMISS_MS = 2200

class ToastState {
  #message = $state<string | null>(null)
  #timer: ReturnType<typeof setTimeout> | undefined

  get message() { return this.#message }

  show(message: string) {
    this.#message = message
    clearTimeout(this.#timer)
    this.#timer = setTimeout(() => {
      this.#message = null
    }, DISMISS_MS)
  }
}

export const toast = new ToastState()
