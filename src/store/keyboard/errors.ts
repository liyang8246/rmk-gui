import type { RynkError } from '../../rynk'

export type KeyboardError
  = | { type: 'rynk', code: RynkError }
    | { type: 'transport', cause: unknown }
    | { type: 'unknown', cause: unknown }

const RYNK_ERROR_CODES = [
  'Malformed',
  'NotReady',
  'StorageFault',
  'Internal',
  'Unimplemented',
  'Invalid',
  'UnknownCmd',
  'Locked',
] as const satisfies readonly RynkError[]

const REJECTED_RE = /^device rejected (\w+)$/
const TRANSPORT_NAMES: readonly string[] = ['Disconnected', 'TransportError']

function isRynkError(s: string): s is RynkError {
  return (RYNK_ERROR_CODES as readonly string[]).includes(s)
}

export function toKeyboardError(e: unknown): KeyboardError {
  if (!(e instanceof Error)) return { type: 'unknown', cause: e }
  if (e.message === 'link closed' || TRANSPORT_NAMES.includes(e.name)) {
    return { type: 'transport', cause: e }
  }
  const reject = e.name === 'Rejected' ? REJECTED_RE.exec(e.message) : null
  if (reject && isRynkError(reject[1])) {
    return { type: 'rynk', code: reject[1] }
  }
  if (isRynkError(e.message)) {
    return { type: 'rynk', code: e.message }
  }
  return { type: 'unknown', cause: e }
}
