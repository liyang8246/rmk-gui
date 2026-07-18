import type { Result } from 'neverthrow'
import type {
  BehaviorConfig,
  Combo,
  EncoderAction,
  Fork,
  KeyAction,
  MacroData,
  Morse,
  RynkClient,
} from '../../rynk/core'
import type { KeyboardError } from './errors'
import type { KeyboardConfig } from './types'
import { err, ResultAsync } from 'neverthrow'
import { produce } from 'solid-js/store'
import { toKeyboardError } from './errors'
import { clientState, setStore, store } from './store'

let syncChain: Promise<void> = Promise.resolve()
let shadow: KeyboardConfig | null = null

export function initShadow(config: KeyboardConfig): void {
  shadow = structuredClone(config)
}

export function resetShadow(): void {
  shadow = null
  syncChain = Promise.resolve()
}

// ── Enqueue: chain continues regardless of individual failure (swallow) ──
//
// Each call returns its own `ResultAsync` whose outcome reflects only this
// call. The internal `syncChain` swallows individual failures so one Err does
// not short-circuit subsequent calls — interactive editing stays responsive
// even when a single write fails.

function enqueue<T>(fn: () => ResultAsync<T, KeyboardError>): ResultAsync<T, KeyboardError> {
  const result: Promise<Result<T, KeyboardError>> = syncChain
    .then(() => fn())
    .then(
      (r: Result<T, KeyboardError>) => r,
      (e: unknown) => err<T, KeyboardError>(toKeyboardError(e)),
    )
  syncChain = result.then(
    () => {},
    () => {},
  )
  return new ResultAsync(result)
}

// ── Guard ──
//
// Precondition: throws `'not connected'` synchronously when client/shadow are
// not ready. This is a programmer error (calling a setter before init), so it
// stays a real throw per neverthrow's "expected vs unexpected" dividing line
// rather than being encoded as a `KeyboardError`.

function getClient(): RynkClient {
  const c = clientState.value
  if (!c || !shadow) throw new Error('not connected')
  return c
}

// ── Mutation skeleton ──
//
// Optimistic-update flow shared by every setter:
//   1. push — flip the store to the new value (UI reflects immediately)
//   2. call — invoke the client method on the device (serialized via enqueue)
//   3. sync — on Ok, mirror the change into the shadow (device-true state)
//   4. undo — on Err, restore the store to its pre-mutation snapshot
//
// `push` and `getClient` run synchronously at the call site, so a
// 'not connected' precondition throw escapes to the caller as a real throw.

interface Mutation {
  push: () => void
  call: (client: RynkClient) => Promise<void>
  sync: () => void
  undo: () => void
}

function runMutation(m: Mutation): ResultAsync<void, KeyboardError> {
  m.push()
  const client = getClient()
  const wrapped = ResultAsync.fromThrowable(() => m.call(client), toKeyboardError)
  return enqueue(() => wrapped().andTee(m.sync).orTee(m.undo))
}

export function setKey(
  layer: number,
  row: number,
  col: number,
  action: KeyAction,
): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.keymap[layer][row][col]
  return runMutation({
    push: () => setStore('config', 'keymap', layer, row, col, action),
    call: client => client.set_key(layer, row, col, action),
    sync: () => { shadow!.keymap[layer][row][col] = action },
    undo: () => { if (store.config) setStore('config', 'keymap', layer, row, col, snapshot) },
  })
}

export function setEncoder(
  encoderId: number,
  layer: number,
  action: EncoderAction,
): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.encoders[encoderId][layer]
  return runMutation({
    push: () => setStore('config', 'encoders', encoderId, layer, action),
    call: client => client.set_encoder(encoderId, layer, action),
    sync: () => { shadow!.encoders[encoderId][layer] = action },
    undo: () => { if (store.config) setStore('config', 'encoders', encoderId, layer, snapshot) },
  })
}

export function setCombo(index: number, config: Combo): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.combos[index]
  return runMutation({
    push: () => setStore('config', 'combos', index, config),
    call: client => client.set_combo(index, config),
    sync: () => { shadow!.combos[index] = config },
    undo: () => { if (store.config) setStore('config', 'combos', index, snapshot) },
  })
}

export function setMorse(index: number, config: Morse): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.morses[index]
  return runMutation({
    push: () => setStore('config', 'morses', index, config),
    call: client => client.set_morse(index, config),
    sync: () => { shadow!.morses[index] = config },
    undo: () => { if (store.config) setStore('config', 'morses', index, snapshot) },
  })
}

export function setFork(index: number, config: Fork): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.forks[index]
  return runMutation({
    push: () => setStore('config', 'forks', index, config),
    call: client => client.set_fork(index, config),
    sync: () => { shadow!.forks[index] = config },
    undo: () => { if (store.config) setStore('config', 'forks', index, snapshot) },
  })
}

export function setMacro(offset: number, data: MacroData): ResultAsync<void, KeyboardError> {
  const bytes = data.data
  const snapshot = bytes.map((_, i) => store.config!.macros[offset + i])
  return runMutation({
    push: () => setStore('config', 'macros', produce((draft) => {
      bytes.forEach((b, i) => {
        draft[offset + i] = b
      })
    })),
    call: client => client.set_macro(offset, data),
    sync: () => bytes.forEach((b, i) => { shadow!.macros[offset + i] = b }),
    undo: () => {
      if (!store.config) return
      setStore('config', 'macros', produce((draft) => {
        snapshot.forEach((old, i) => {
          draft[offset + i] = old
        })
      }))
    },
  })
}

export function setBehavior(config: BehaviorConfig): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.behavior
  return runMutation({
    push: () => setStore('config', 'behavior', config),
    call: client => client.set_behavior(config),
    sync: () => { shadow!.behavior = config },
    undo: () => { if (store.config) setStore('config', 'behavior', snapshot) },
  })
}

export function setDefaultLayer(layer: number): ResultAsync<void, KeyboardError> {
  const snapshot = store.config!.defaultLayer
  return runMutation({
    push: () => setStore('config', 'defaultLayer', layer),
    call: client => client.set_default_layer(layer),
    sync: () => { shadow!.defaultLayer = layer },
    undo: () => { if (store.config) setStore('config', 'defaultLayer', snapshot) },
  })
}
