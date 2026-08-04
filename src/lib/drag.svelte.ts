import type { KeyAction } from '../rynk'

/// The palette and the board are siblings, so the chip being dragged is held
/// here rather than threaded through the editor. `dataTransfer` cannot carry a
/// live object, and reading it during `dragover` is blocked anyway.
class DragState {
  action = $state.raw<KeyAction | null>(null)

  start(action: KeyAction) { this.action = action }
  end() { this.action = null }
}

export const drag = new DragState()
