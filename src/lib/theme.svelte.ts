export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'rmk-theme'

function stored(): Theme {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

class ThemeState {
  #value = $state<Theme>(stored())

  get value() { return this.#value }

  set(next: Theme) {
    this.#value = next
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }
}

export const theme = new ThemeState()

// The class has to land before first paint, or a dark session flashes light.
theme.set(theme.value)
