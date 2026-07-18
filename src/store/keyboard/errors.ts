import type { RynkError } from '../../rynk/core'

/// Three-tier error taxonomy for keyboard store mutations.
///
/// - `rynk`: device-protocol error returned by the wasm core (RynkError code).
/// - `transport`: link-layer failure (device gone, link closed, etc.).
/// - `unknown`: anything else — defensive bucket for unexpected throws.
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

/// Normalize any thrown value into a `KeyboardError`.
///
/// The wasm core throws `Error` whose `message` is one of the `RynkError`
/// literals (e.g. `Error('Locked')`); the transport layer throws
/// `Error('link closed')`. Everything else collapses to `unknown`.
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
