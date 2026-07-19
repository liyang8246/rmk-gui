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

// Optimistic update: push → call → undo (Err).
export interface Mutation {
  push: () => void
  call: (c: RynkClient) => Promise<void>
  undo: () => void
}

export function runMutation(m: Mutation): ResultAsync<void, KeyboardError> {
  const client = session.client
  if (!client) throw new Error('not connected')
  m.push()
  const wrapped = ResultAsync.fromThrowable(() => m.call(client), toKeyboardError)
  return enqueue(() => wrapped().orTee(m.undo))
}
