export type ScreenId = 'keymap' | 'macros' | 'combos' | 'device' | 'behavior' | 'settings'

export const SCREENS = [
  { id: 'keymap', icon: 'lucide:keyboard', label: 'Keymap' },
  { id: 'macros', icon: 'lucide:zap', label: 'Macros' },
  { id: 'combos', icon: 'lucide:combine', label: 'Combos' },
  { id: 'device', icon: 'lucide:cpu', label: 'Device' },
  { id: 'behavior', icon: 'lucide:sliders-vertical', label: 'Behavior' },
  { id: 'settings', icon: 'lucide:settings', label: 'Settings' },
] as const satisfies readonly { id: ScreenId, icon: string, label: string }[]

class ScreenState {
  current = $state<ScreenId>('keymap')

  /// The keymap editor is the app's home; every other screen replaces it.
  go(id: ScreenId) { this.current = id }
}

export const screens = new ScreenState()
