# neverthrow Advanced Patterns

Worked examples for the patterns the SKILL.md body introduces but does not fully
develop. Each section is self-contained — read the one you need.

## Table of Contents

- [Combine with heterogeneous tuples](#combine-with-heterogeneous-tuples)
- [combineWithAllErrors — collect every failure](#combinewithallerrors--collect-every-failure)
- [safeTry with async generators](#safetry-with-async-generators)
- [Retry with exponential backoff](#retry-with-exponential-backoff)
- [Multi-tier data loading](#multi-tier-data-loading)
- [Testing patterns](#testing-patterns)
- [Error normalization with mapErr](#error-normalization-with-maperr)

## Combine with heterogeneous tuples

`Result.combine` infers a tuple type when you pass a literal array, and collapses to
a homogeneous array when you pass a typed array. The difference matters.

```ts
import { Result, ok, err } from 'neverthrow'

// ✅ Literal array → tuple Ok type, union Err type
const r1 = Result.combine([
  ok(1),
  ok('a'),
  ok(true),
])
// Result<[number, string, boolean], never>

// ✅ Heterogeneous errors union into one type
const r2 = Result.combine([
  ok<number, 'net'>(1),
  ok<string, 'db'>('a'),
])
// Result<[number, string], 'net' | 'db'>

// ❌ Typed array → collapses to homogeneous
const arr: Result<number, string>[] = [ok(1), ok(2)]
const r3 = Result.combine(arr)
// Result<number[], string>  — not a tuple

// ✅ Keep tuple inference from a typed array via `as const` on the array type
const tup: [Result<number, 'a'>, Result<string, 'b'>] = [ok(1), ok('x')]
const r4 = Result.combine(tup)
// Result<[number, string], 'a' | 'b'>
```

Rule: pass a literal array (or an explicitly tuple-typed variable) when you want
per-element types. Pass a `T[]` when the elements are genuinely homogeneous.

`ResultAsync.combine` works identically on arrays of `ResultAsync`.

## combineWithAllErrors — collect every failure

`combine` short-circuits on the first error. When you want *all* failures (form
validation, batch import, multi-source fetch), use `combineWithAllErrors`.

```ts
import { Result, ok, err } from 'neverthrow'

type FieldError = { field: string; message: string }

const validateEmail = (e: string): Result<string, FieldError> =>
  e.includes('@') ? ok(e) : err({ field: 'email', message: 'invalid' })

const validatePassword = (p: string): Result<string, FieldError> =>
  p.length >= 8 ? ok(p) : err({ field: 'password', message: 'too short' })

const validateName = (n: string): Result<string, FieldError> =>
  n.length > 0 ? ok(n) : err({ field: 'name', message: 'required' })

const results = [
  validateEmail('bad'),
  validatePassword('short'),
  validateName('Alice'),
]

const outcome = Result.combineWithAllErrors(results)
// Err([{ field: 'email', message: 'invalid' },
//      { field: 'password', message: 'too short' }])
// 'name' validation succeeded, so its error is absent — length not guaranteed
```

The error array contains only the errors from failed inputs, so its length varies.
Handle both branches at the terminal:

```ts
outcome.match(
  ([email, password, name]) => createUser(email, password, name),
  (errors) => res.status(400).json({ errors })
)
```

## safeTry with async generators

Long `andThen` ladders get hard to read. `safeTry` lets you write a fallible chain
in imperative style while keeping full `Result` safety.

```ts
import { safeTry, ok, err, ResultAsync } from 'neverthrow'

type FetchError = { type: 'notFound' } | { type: 'network'; cause: unknown }
type User = { id: string; name: string }
type Post = { id: string; title: string }
type UserWithPosts = { user: User; posts: Post[] }

declare function fetchUser(id: string): ResultAsync<User, FetchError>
declare function fetchPosts(userId: string): ResultAsync<Post[], FetchError>
declare function renderProfile(u: UserWithPosts): string

function loadProfile(id: string): ResultAsync<string, FetchError> {
  return safeTry<string, FetchError>(async function* () {
    const user  = yield* fetchUser(id)      // unwraps on Ok, early-returns Err
    const posts = yield* fetchPosts(user.id) // skipped if previous was Err
    return ok(renderProfile({ user, posts }))
  })
}
```

`yield*` a `Result` (sync) or `ResultAsync` (async). On `Ok`, the value is bound to
the local. On `Err`, the generator short-circuits and `safeTry` returns the `Err`.
The final `return ok(...)` produces the success value.

This is the modern replacement for the deprecated `safeUnwrap()`. Requires a TS
target of `ES2015+` (generators), or a regenerator runtime for older targets.

## Retry with exponential backoff

`orElse` is the recovery combinator. Combine it with a recursive call to implement
retry with backoff.

```ts
import { ResultAsync, errAsync, okAsync } from 'neverthrow'

type Transient = { type: 'transient'; attempt: number }

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

function withRetry<T, E>(
  operation: () => ResultAsync<T, E>,
  maxRetries = 3,
  baseDelayMs = 200
): ResultAsync<T, E | Transient> {
  let attempt = 0

  const attemptOnce = (): ResultAsync<T, E | Transient> =>
    operation().orElse((error) => {
      attempt += 1
      if (attempt >= maxRetries) {
        return errAsync({ type: 'transient', attempt })
      }
      const backoff = baseDelayMs * Math.pow(2, attempt - 1)
      return ResultAsync.fromSafePromise(delay(backoff)).andThen(attemptOnce)
    })

  return attemptOnce()
}
```

Each `orElse` runs only on `Err`, returns a `ResultAsync`, and keeps the chain
typed. The error union grows by the retry-exhausted variant; callers handle it in
`.match` like any other error.

A pure variant (without mutation): thread the attempt count through a helper and
recurse. The shape is the same — `orElse` is the recovery hook.

## Multi-tier data loading

Tiered fallback reads cleanly as a chain of `orElse` calls. Each tier returns a
`ResultAsync` so typing is preserved across the whole chain.

```ts
import { ResultAsync, okAsync, errAsync } from 'neverthrow'

type DataError = { type: 'cacheMiss' } | { type: 'dbError'; cause: unknown } | { type: 'apiError'; cause: unknown }
type User = { id: string; name: string }

declare function fromCache(id: string): ResultAsync<User, DataError>
declare function fromDatabase(id: string): ResultAsync<User, DataError>
declare function fromApi(id: string): ResultAsync<User, DataError>

const guestUser = (id: string): User => ({ id, name: 'Guest' })

function loadUser(id: string): ResultAsync<User, never> {
  return fromCache(id)
    .orElse(() => fromDatabase(id))
    .orElse(() => fromApi(id))
    .orElse(() => okAsync(guestUser(id)))   // always succeeds → never in error type
}

loadUser('123').match(
  (user) => render(user),
  () => { /* unreachable: error type is `never` */ }
)
```

Because the final `orElse` returns `okAsync`, the resulting error type narrows to
`never` and the Err branch in `match` becomes unreachable — the type system proves
the recovery is total.

Add observability with `andTee`/`orTee` without changing the error type:

```ts
return fromCache(id)
  .andTee(() => metrics.increment('cache.hit'))
  .orElse(() => fromDatabase(id).andTee(() => metrics.increment('cache.miss')))
  .orElse(() => fromApi(id).orTee(() => metrics.increment('api.error')))
  .orElse(() => okAsync(guestUser(id)))
```

`andTee`/`orTee` swallow side-effect errors, so the chain's error type stays clean.

## Testing patterns

### Assert on Ok / Err directly

In tests you control the inputs, so `_unsafeUnwrap` / `_unsafeUnwrapErr` are
acceptable — they throw if the variant is wrong, which is exactly what a test
assertion wants.

```ts
import { ok, err } from 'neverthrow'

describe('parseIntSafe', () => {
  it('returns Ok for valid input', () => {
    const result = parseIntSafe('42')
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBe(42)
  })

  it('returns Err for invalid input', () => {
    const result = parseIntSafe('nope')
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBe('not an integer')
  })
})
```

### Test the error path with `match`

When the test cares about both branches, `match` is exhaustive and reads cleanly:

```ts
const outcome = registerUser(input).match(
  (user) => ({ status: 'ok' as const, user }),
  (error) => ({ status: 'err' as const, error })
)

expect(outcome.status).toBe('err')
if (outcome.status === 'err') {
  expect(outcome.error).toEqual({ field: 'email', message: 'invalid' })
}
```

### Don't test internal combinator behaviour

neverthrow's own combinators are tested upstream. Test your domain logic — your
function's contract — not that `map` returns a `Result`. A test like
`expect(result.map(...).isOk()).toBe(true)` duplicates the library and adds no
confidence.

## Error normalization with mapErr

Long `andThen` chains accumulate error types: `E1 | E2 | E3 | …`. At a module
boundary, normalize back to one domain error type so callers don't have to know
every internal failure mode.

```ts
// internal: parse → validate → persist, each with its own error type
type ParseError = { type: 'parse'; message: string }
type ValidationError = { type: 'validation'; field: string }
type DbError = { type: 'db'; code: number }

// public domain error
type UserError =
  | { type: 'badInput'; detail: string }
  | { type: 'unavailable' }

const toUserError = (e: ParseError | ValidationError | DbError): UserError =>
  e.type === 'parse' || e.type === 'validation'
    ? { type: 'badInput', detail: JSON.stringify(e) }
    : { type: 'unavailable' }

export function createUser(raw: string): ResultAsync<User, UserError> {
  return parseInput(raw)                          // Result<Input, ParseError>
    .andThen(validate)                            // Result<Input, ParseError | ValidationError>
    .asyncAndThen(persist)                       // ResultAsync<User, ... | DbError>
    .mapErr(toUserError)                          // ResultAsync<User, UserError>
}
```

Callers handle one `UserError` type instead of a union of three internals. Insert
`mapErr` whenever a chain's error union crosses a module or service boundary;
inside a module, let the union grow — the precision is useful for internal
debugging.
