# neverthrow API Reference

Common signatures for every public symbol. The SKILL.md body covers when to use
each method; this file is the lookup table for the types you will hit most often.
Some methods have additional inference overloads in the source — the signatures
here are the ones callers actually write. Read the section you need rather than
end-to-end.

## Table of Contents

- [Constructors](#constructors)
- [Type guards](#type-guards)
- [Result methods (synchronous)](#result-methods-synchronous)
- [ResultAsync methods](#resultasync-methods)
- [Static utilities on Result](#static-utilities-on-result)
- [Static utilities on ResultAsync](#static-utilities-on-resultasync)
- [Standalone utilities](#standalone-utilities)
- [Version notes](#version-notes)

## Constructors

```ts
ok<T, E>(value: T): Ok<T, E>
err<T, E>(error: E): Err<T, E>
okAsync<T, E>(value: T): ResultAsync<T, E>
errAsync<T, E>(error: E): ResultAsync<T, E>
```

`ok`/`err` build synchronous `Result` values. `okAsync`/`errAsync` build a
`ResultAsync` that resolves to an `Ok`/`Err` when awaited. As of v7.1.0, `err()` with
a string argument infers the literal type (`err('NotFound')` is `Err<never, 'NotFound'>`),
which makes tagged-string error unions ergonomic without `as const`.

## Type guards

```ts
result.isOk(): boolean
result.isErr(): boolean
```

Narrow to the Ok/Err variant at runtime. Prefer `match` for branching with a value
return; use the guards only when you need a plain boolean (e.g. inside an `if`).

## Result methods (synchronous)

```ts
class Result<T, E> {
  map<U>(f: (t: T) => U): Result<U, E>
  mapErr<F>(f: (e: E) => F): Result<T, F>
  andThen<U, F>(f: (t: T) => Result<U, F>): Result<U, E | F>
  asyncAndThen<U, F>(f: (t: T) => ResultAsync<U, F>): ResultAsync<U, E | F>
  orElse<U, A>(f: (e: E) => Result<U, A>): Result<U | T, A>
  orElse<R extends Result<unknown, unknown>>(f: (e: E) => R): Result<InferOkTypes<R> | T, InferErrTypes<R>>
  match<A, B = A>(okFn: (t: T) => A, errFn: (e: E) => B): A | B
  asyncMap<U>(f: (t: T) => Promise<U>): ResultAsync<U, E>
  andThrough<F>(f: (t: T) => Result<unknown, F>): Result<T, E | F>
  asyncAndThrough<F>(f: (t: T) => ResultAsync<unknown, F>): ResultAsync<T, E | F>
  andTee(f: (t: T) => unknown): Result<T, E>
  orTee(f: (e: E) => unknown): Result<T, E>
  unwrapOr<T2>(value: T2): T | T2
  isOk(): boolean
  isErr(): boolean
  _unsafeUnwrap(): T          // throws on Err
  _unsafeUnwrapErr(): E        // throws on Ok
  safeUnwrap(): Result<T, E>   // DEPRECATED — use safeTry
}
```

### Method semantics

- **`map`** — pure transform of the Ok value. Use when the callback cannot fail.
- **`mapErr`** — transform the Err value. Use to normalize or enrich error types.
- **`andThen`** — run a fallible step; callback returns a `Result`. Flattens nested
  results. v4.1.0+ allows distinct error types, unioned as `E | F`.
- **`asyncAndThen`** — callback returns a `ResultAsync`; bridges sync `Result` to
  `ResultAsync`.
- **`orElse`** — recovery: runs only on `Err`, returns a new `Result`. Has two
  overloads: the simple `<U, A>` form returns `Result<U | T, A>` (recovered value
  unions with the original `T`, error type becomes `A`); the inference form
  `R extends Result<unknown, unknown>` uses `InferOkTypes<R>` / `InferErrTypes<R>`
  to pull the Ok/Err types out of whatever `Result` the callback returns. In v8.0.0
  the inference tightened — if you were passing explicit type args to `orElse`
  before, you may need to drop or adjust them on migration.
- **`match`** — terminal branching. Both callbacks return the same type. Unwraps
  the `Result` into a plain value.
- **`asyncMap`** — callback returns a `Promise`; lifts `Result` to `ResultAsync`.
- **`andThrough`** — validation that preserves the original Ok value. Callback
  returns `Result<unknown, F>` — only the error matters. Use instead of `andThen`
  when the value should pass through unchanged.
- **`asyncAndThrough`** — async variant of `andThrough`.
- **`andTee`** — side effect on Ok; swallows side-effect errors; type unchanged.
- **`orTee`** — side effect on Err; swallows side-effect errors; type unchanged.
- **`unwrapOr`** — return the Ok value or a default; unwraps the `Result`.
- **`_unsafeUnwrap` / `_unsafeUnwrapErr`** — throw on the wrong variant. Tests only.
- **`safeUnwrap`** — DEPRECATED. Use `safeTry` with async generators instead.

## ResultAsync methods

```ts
class ResultAsync<T, E> {
  map<U>(f: (t: T) => U | Promise<U>): ResultAsync<U, E>
  mapErr<F>(f: (e: E) => F | Promise<F>): ResultAsync<T, F>
  andThen<U, F>(f: (t: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F>
  orElse<U, A>(f: (e: E) => Result<U, A> | ResultAsync<U, A>): ResultAsync<U | T, A>
  orElse<R extends Result<unknown, unknown>>(f: (e: E) => R): ResultAsync<InferOkTypes<R> | T, InferErrTypes<R>>
  orElse<R extends ResultAsync<unknown, unknown>>(f: (e: E) => R): ResultAsync<InferAsyncOkTypes<R> | T, InferAsyncErrTypes<R>>
  match<A, B = A>(okFn: (t: T) => A, errFn: (e: E) => B): Promise<A | B>
  unwrapOr<T2>(value: T2): Promise<T | T2>
  andThrough<F>(f: (t: T) => Result<unknown, F> | ResultAsync<unknown, F>): ResultAsync<T, E | F>
  asyncAndThrough<F>(f: (t: T) => ResultAsync<unknown, F>): ResultAsync<T, E | F>
  andTee(f: (t: T) => unknown | Promise<unknown>): ResultAsync<T, E>
  orTee(f: (e: E) => unknown | Promise<unknown>): ResultAsync<T, E>
  isOk(): Promise<boolean>
  isErr(): Promise<boolean>
  then<A, B>(
    successCallback?: (res: Result<T, E>) => A | PromiseLike<A>,
    failureCallback?: (reason: unknown) => B | PromiseLike<B>
  ): PromiseLike<A | B>
}
```

### ResultAsync vs Promise<Result>

`ResultAsync` is thenable and behaves like `Promise<Result<T, E>>` at the boundary,
but it exposes `map`/`andThen`/`match`/etc. directly so callers can chain without
awaiting first. Prefer `ResultAsync<T, E>` as a return type over `Promise<Result<T, E>>`.

### Callback flexibility

On `ResultAsync`, `map` and `mapErr` callbacks may be synchronous (`(t: T) => U`)
or asynchronous (`(t: T) => Promise<U>`) with no impact on the return type — the
return is always `ResultAsync`. `andThen` callbacks may return either `Result` or
`ResultAsync`. Use this to mix sync and async steps inside one chain without
switching combinators.

## Static utilities on Result

```ts
Result.fromThrowable<A, U, E>(
  fn: (...args: A) => U,
  errorFn?: (e: unknown) => E
): (...args: A) => Result<U, E>

Result.combine<T1, E1, ...>(list): Result<[T1, ...], E1 | ...>
Result.combineWithAllErrors<T1, E1, ...>(list): Result<[T1, ...], (E1 | ...)[]>
```

### `fromThrowable`

Wraps a throwing function so it returns a `Result` instead. Always pass `errorFn`
to map the unknown thrown value into a typed error; without it the error type is
`unknown`. The wrapped function can throw at any point and the throw becomes an
`Err`.

### `combine`

Takes a list (or tuple) of `Result`s and returns a single `Result`. Short-circuits
on the first `Err` (semantics like `Promise.all`). On full success, returns an
`Ok` of the tuple of values.

Supports heterogeneous tuples: pass a literal array like `[ok(1), ok('a')]` and the
Ok type is the tuple `[number, string]` with the error type as a union. Pass a
`Result<T, E>[]` and the Ok type collapses to `T[]` with error `E` — to keep
per-element types, pass a literal array or `as const`-style tuple.

### `combineWithAllErrors`

Like `combine` but does not short-circuit. Collects every error from the input
list into an array. On any failure, returns `Err` of the collected errors (length
not guaranteed — only failed inputs contribute). Use when you want all failures,
not just the first.

## Static utilities on ResultAsync

```ts
ResultAsync.fromThrowable<A, U, E>(
  fn: (...args: A) => Promise<U>,
  errorFn?: (e: unknown) => E
): (...args: A) => ResultAsync<U, E>

ResultAsync.fromPromise<T, E>(
  promise: PromiseLike<T>,
  errorFn: (e: unknown) => E
): ResultAsync<T, E>

ResultAsync.fromSafePromise<T, E>(promise: PromiseLike<T>): ResultAsync<T, E>

ResultAsync.combine<T1, E1, ...>(list): ResultAsync<[T1, ...], E1 | ...>
ResultAsync.combineWithAllErrors<T1, E1, ...>(list): ResultAsync<[T1, ...], (E1 | ...)[]>
```

### `fromPromise` vs `fromThrowable` (async)

`fromPromise` takes an *already-constructed* Promise. If the producer function
throws synchronously before returning its promise (common for non-async functions
with argument validation), that throw escapes `fromPromise` entirely and is not
turned into an `Err`.

`fromThrowable` wraps the call itself, so a sync throw in the producer is caught
and becomes an `Err`. Prefer `ResultAsync.fromThrowable` when wrapping a function
that returns a `Promise` but might also throw before the first `await`.

### `fromSafePromise`

Skips the error handler. Use only when you are certain the promise cannot reject
(e.g. a `setTimeout`-based delay). A rejected "safe" promise will reject the
`ResultAsync` itself rather than resolving to an `Err`.

## Standalone utilities

```ts
import { fromThrowable, fromPromise, fromSafePromise, fromAsyncThrowable, safeTry } from 'neverthrow'

fromThrowable<A, U, E>(fn: (...args: A) => U, errorFn?: (e: unknown) => E): (...args: A) => Result<U, E>
fromAsyncThrowable<A, U, E>(fn: (...args: A) => Promise<U>, errorFn?: (e: unknown) => E): (...args: A) => ResultAsync<U, E>
fromPromise<T, E>(promise: PromiseLike<T>, errorFn: (e: unknown) => E): ResultAsync<T, E>
fromSafePromise<T, E>(promise: PromiseLike<T>): ResultAsync<T, E>

safeTry<T, E>(body: () => Generator<Err<never, E>, Result<T, E>>): Result<T, E>
safeTry<T, E>(body: () => AsyncGenerator<Err<never, E>, Result<T, E>>): ResultAsync<T, E>
```

`fromThrowable`, `fromPromise`, `fromSafePromise` are standalone aliases for the
static methods above — import them directly or call them on `Result`/`ResultAsync`.

`fromAsyncThrowable` is the standalone form of `ResultAsync.fromThrowable`.

### `safeTry` — generator-based sequential unwrapping

`safeTry` takes a (possibly async) generator function. Inside, `yield*` a
`Result` or `ResultAsync` to unwrap it on the Ok track, or short-circuit the whole
function to an `Err` if the yielded result is an `Err`. This replaces the deprecated
`safeUnwrap` and is the clean way to read a deep chain of fallible steps without
nesting `andThen` ladders.

```ts
import { safeTry, ok, err, ResultAsync } from 'neverthrow'

declare function fetchUser(id: string): ResultAsync<User, FetchError>
declare function fetchPosts(userId: string): ResultAsync<Post[], FetchError>

function getUserWithPosts(id: string): ResultAsync<UserWithPosts, FetchError> {
  return safeTry<UserWithPosts, FetchError>(async function* () {
    const user  = yield* fetchUser(id)
    const posts = yield* fetchPosts(user.id)
    return ok({ user, posts })
  })
}
```

`yield*` unwraps on Ok and early-returns on Err. The function body reads top-to-bottom
like imperative code while keeping full `Result` safety.

Requires a TS target of `ES2015+` for generators, or a regenerator runtime for older
targets.

## Version notes

- **v4.1.0** — `andThen` and `ResultAsync.andThen` allow distinct error types per
  step, unioned automatically as `E | F`. Before this, the error type had to match.
- **v7.1.0** — `err()` with a string argument infers the literal type (e.g.
  `err('NotFound')` is `Err<never, 'NotFound'>`), not `string`. PR #563. This release
  also added `andTee` and `andThrough` for side effects and validation.
- **v8.0.0** — `orElse` type signature tightened (PR #484: "Allow orElse method to
  change ok types"). If you were passing explicit type arguments to `orElse` in v7,
  you may need to drop or adjust them after upgrading.
- **v8.1.x** — `safeTry` changed so `safeUnwrap` is no longer required (PR #589), and
  the `@deprecated` tag was added to `safeUnwrap` (PR #600). Use `safeTry` with
  generators; avoid `safeUnwrap` in new code.
