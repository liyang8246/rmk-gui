import type { RynkError } from '../../rynk'

export type KeyboardError
  = | { type: 'rynk', code: RynkError }
    | { type: 'transport', cause: unknown }
    | { type: 'invalid', cause: string }
    | { type: 'unknown', cause: unknown }

// A Record (not an array) so a new RynkError variant upstream fails this build.
const RYNK_ERROR_CODES: Record<RynkError, true> = {
  Busy: true,
  Internal: true,
  Invalid: true,
  Locked: true,
  Malformed: true,
  NotReady: true,
  StorageFault: true,
  Unimplemented: true,
  UnknownCmd: true,
}

const REJECTED_RE = /^device rejected (\w+)$/
const TRANSPORT_NAMES: readonly string[] = ['Disconnected', 'TransportError']

const RYNK_ERROR_NAMES = new Set<string>(Object.keys(RYNK_ERROR_CODES))

function isRynkError(s: string): s is RynkError {
  return RYNK_ERROR_NAMES.has(s)
}

export function toKeyboardError(e: unknown): KeyboardError {
  if (!(e instanceof Error)) return { type: 'unknown', cause: e }
  if (e.message === 'link closed' || TRANSPORT_NAMES.includes(e.name)) {
    return { type: 'transport', cause: e }
  }
  const reject = e.name === 'Rejected' ? REJECTED_RE.exec(e.message) : null
  if (reject && isRynkError(reject[1]!)) {
    return { type: 'rynk', code: reject[1] }
  }
  if (isRynkError(e.message)) {
    return { type: 'rynk', code: e.message }
  }
  return { type: 'unknown', cause: e }
}
