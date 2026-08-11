import type { RynkError } from '../../rynk'
import { match } from 'ts-pattern'

export type KeyboardError
  = | { type: 'rynk', code: RynkError }
    | { type: 'transport', cause: unknown }
    | { type: 'invalid', cause: string }
    | { type: 'unknown', cause: unknown }

// A Record (not an array) so a new RynkError variant upstream fails this build.
// Exported so tests iterate this list instead of keeping a stale copy.
export const RYNK_ERROR_CODES: Record<RynkError, true> = {
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
  // Tauri commands reject with the Rust error as a bare string; wrap it so
  // every later match — and the user-facing hint — works on one shape.
  if (typeof e === 'string') e = new Error(e)
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

/// Short, user-facing reason — for the status bar and the connect button.
export function describeKeyboardError(e: KeyboardError): string {
  return match(e)
    .with({ type: 'rynk' }, x => `device rejected ${x.code}`)
    .with({ type: 'transport' }, () => 'link lost')
    .with({ type: 'invalid' }, x => x.cause)
    .with({ type: 'unknown' }, x => (x.cause instanceof Error ? x.cause.message : 'unknown error'))
    .exhaustive()
}

/// A headline plus what to try next — for the connect screen, where the user
/// has room to read and a next step to take.
export interface KeyboardErrorHelp {
  title: string
  hint?: string
}

/// The shapes an occupied or unreachable device fails an open with: WebUSB
/// throws NetworkError/InvalidStateError, WebHID NotAllowedError, and the
/// native USB and BLE stacks report busy/denied in prose — macOS says
/// "exclusive access" (kIOReturnExclusiveAccess) when another app holds the
/// vendor interface claim.
const OPEN_FAILED_NAMES: readonly string[] = ['NetworkError', 'InvalidStateError', 'NotAllowedError']
const OPEN_FAILED_RE = /\bbusy\b|in use|access denied|permission|exclusive access/i

export function explainKeyboardError(e: KeyboardError): KeyboardErrorHelp {
  return match(e)
    .with({ type: 'rynk' }, x => ({
      title: 'The keyboard rejected the request',
      hint: `Error code: ${x.code}.`,
    }))
    .with({ type: 'transport' }, (x): KeyboardErrorHelp => {
      if (x.cause instanceof Error && x.cause.message.includes('timed out')) {
        return {
          title: 'The keyboard didn’t respond',
          hint: 'It may not be running RMK firmware, or another app is holding the connection.',
        }
      }
      return {
        title: 'Connection lost',
        hint: 'The keyboard was unplugged, powered off, or went out of range.',
      }
    })
    .with({ type: 'invalid' }, x => ({ title: x.cause }))
    .with({ type: 'unknown' }, (x): KeyboardErrorHelp => {
      if (!(x.cause instanceof Error)) return { title: 'Connection failed' }
      if (OPEN_FAILED_NAMES.includes(x.cause.name) || OPEN_FAILED_RE.test(x.cause.message)) {
        return {
          title: 'Couldn’t open the device',
          hint: 'Another app may be using it — close other configurator software, then try again.',
        }
      }
      return { title: 'Connection failed', hint: x.cause.message || undefined }
    })
    .exhaustive()
}
