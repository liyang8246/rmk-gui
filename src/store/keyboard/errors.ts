import type { RynkError } from '../../rynk'

export type KeyboardError
  = | { type: 'rynk', code: RynkError }
    | { type: 'transport', cause: unknown }
    | { type: 'unknown', cause: unknown }

const RYNK_ERROR_CODES: readonly RynkError[] = [
  'Malformed',
  'NotReady',
  'StorageFault',
  'Internal',
  'Unimplemented',
  'Invalid',
  'UnknownCmd',
  'Locked',
]

const RYNK_ERROR_SET: ReadonlySet<string> = new Set(RYNK_ERROR_CODES)

export function toKeyboardError(e: unknown): KeyboardError {
  if (e instanceof Error) {
    if (RYNK_ERROR_SET.has(e.message)) {
      return { type: 'rynk', code: e.message as RynkError }
    }
    if (e.message === 'link closed') {
      return { type: 'transport', cause: e }
    }
  }
  return { type: 'unknown', cause: e }
}
