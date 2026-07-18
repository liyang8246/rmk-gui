import type { Result } from 'neverthrow'
import type { RynkClient } from '../../rynk'
import type { KeyboardError } from './errors'
import { err, ResultAsync } from 'neverthrow'
import { toKeyboardError } from './errors'
import { session } from './store'

// Swallows individual failures so one Err does not short-circuit subsequent calls.
export function enqueue<T>(
  fn: () => ResultAsync<T, KeyboardError>,
): ResultAsync<T, KeyboardError> {
  const result: Promise<Result<T, KeyboardError>> = session.chain
    .then(() => fn())
    .then(
      (r: Result<T, KeyboardError>) => r,
      (e: unknown) => err<T, KeyboardError>(toKeyboardError(e)),
    )
  session.chain = result.then(
    () => {},
    () => {},
  )
  return new ResultAsync(result)
}

// Throws `'not connected'` as a precondition (programmer error, not a KeyboardError).
export function getClient(): RynkClient {
  const c = session.client
  if (!c || !session.shadow) throw new Error('not connected')
  return c
}

// Optimistic update: push → call → sync (Ok) / undo (Err).
export interface Mutation {
  push: () => void
  call: (client: RynkClient) => Promise<void>
  sync: () => void
  undo: () => void
}

export function runMutation(m: Mutation): ResultAsync<void, KeyboardError> {
  m.push()
  const client = getClient()
  const wrapped = ResultAsync.fromThrowable(() => m.call(client), toKeyboardError)
  return enqueue(() => wrapped().andTee(m.sync).orTee(m.undo))
}
