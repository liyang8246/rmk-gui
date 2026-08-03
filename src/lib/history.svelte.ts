import type { KeyAction } from '../rynk'

export interface KeyEdit {
  layer: number
  row: number
  col: number
  before: KeyAction
  after: KeyAction
}

/// Deep enough to cover a remapping session, shallow enough that the snapshots
/// never grow into something worth persisting.
const DEPTH = 60

/// Edits are written straight to the keyboard, so undo is not a rollback of a
/// draft — it is another write, of the value the key held before. This records
/// what to write; the caller performs it.
///
/// Instantiated per editor, so swapping keyboards cannot leave behind positions
/// that address a different keymap.
export class History {
  #past = $state<KeyEdit[]>([])
  #future = $state<KeyEdit[]>([])

  get canUndo() { return this.#past.length > 0 }
  get canRedo() { return this.#future.length > 0 }

  record(edit: KeyEdit) {
    this.#past.push(edit)
    if (this.#past.length > DEPTH) this.#past.shift()
    this.#future = []
  }

  undo(): KeyEdit | null {
    const edit = this.#past.pop()
    if (!edit) return null
    this.#future.push(edit)
    return edit
  }

  redo(): KeyEdit | null {
    const edit = this.#future.pop()
    if (!edit) return null
    this.#past.push(edit)
    return edit
  }
}
