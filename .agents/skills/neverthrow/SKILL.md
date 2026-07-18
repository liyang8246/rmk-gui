---
name: neverthrow
description: Master neverthrow for TypeScript — Result/ResultAsync types, railway-oriented error handling, ok/err/okAsync/errAsync constructors, map/andThen/match/orElse/combine combinators, safeTry, and best practices for separating expected recoverable errors from unexpected bugs. Use this skill whenever the user mentions neverthrow, Result or ResultAsync types, functional or railway-oriented error handling in TypeScript, "instead of try/catch", "Rust-style errors in TS", ok()/err(), map vs andThen, combine, or wants typed error handling that doesn't throw. Trigger even if the user doesn't name neverthrow but asks for typed Result-style error handling in a TS/JS codebase. Do not use for Effect, fp-ts Either, or triple.js.
---

# neverthrow Mastery Guide

## 1. Purpose

This skill makes you a top-tier neverthrow practitioner. neverthrow is a TypeScript
library that encodes failure into program values instead of exceptions. It provides
`Result<T, E>` for synchronous code and `ResultAsync<T, E>` for asynchronous code,
both modelled on Rust's `Result` type.

Read this body end-to-end before writing any neverthrow code — the sections build on
each other and the central decision (section 4) trips up most newcomers. For exhaustive
method signatures, read `references/api-reference.md`. For advanced worked examples
(combine typing, safeTry generators, retry/backoff, multi-tier recovery, testing),
read `references/advanced-patterns.md`.

## 2. Mental Model & When to Use

### Errors as values, not exceptions

In the throw-based model a function either returns a value or throws, and the type
system cannot see the throw. In the Result model a function always returns a value
that is *either* `Ok<T>` *or* `Err<E>`, and the type system forces callers to deal
with both. This is railway-oriented programming: the happy path runs straight down
the Ok track, and any step can switch to the Err track, after which later steps are
skipped automatically.

```ts
import { ok, err, Result } from 'neverthrow'

type ParseError = { type: 'parse'; message: string }

const parse = (input: string): Result<number, ParseError> =>
  /^\d+$/.test(input)
    ? ok(Number(input))
    : err({ type: 'parse', message: 'not an integer' })
```

`ok(value)` constructs an `Ok`, `err(error)` constructs an `Err`. Both carry a value
and both are instances of `Result`. The error is a first-class value with a type,
not an escaped control-flow event.

### Expected vs Unexpected errors — the dividing line

Result is for **expected, recoverable errors**: a missing cache entry, a failed
validation, a network timeout, a not-found record. These are part of the domain and
callers should branch on them.

Result is **not** for unexpected, irrecoverable errors: invariant violations, null
dereferences where the type says non-null, configuration mistakes, programmer bugs.
Those should still throw — wrapping them in `Err` hides bugs and adds noise. If the
right reaction is "crash and fix the code", throw. If the right reaction is "try a
fallback", use `Result`.

Rule of thumb: if a caller could reasonably recover or retry, model it as `Err`. If
recovery is impossible or would just mask a bug, throw.

### When to reach for neverthrow

Use neverthrow when error handling is a central concern of the module: service layers,
parsers, validation pipelines, data fetching, anything with a multi-step fallible
flow where you want the type system to track every failure mode. The benefit is
proportional to how many fallible steps you chain — a single try/catch is fine without
the library; ten chained fallible operations is where Result shines.

## 3. Constructing Results

### The four constructors

```ts
import { ok, err, okAsync, errAsync } from 'neverthrow'

const r1 = ok(42)            // Ok<number, never>
const r2 = err('nope')       // Err<never, string>
const r3 = okAsync(42)       // ResultAsync<number, never>  (resolves to Ok)
const r4 = errAsync('nope')  // ResultAsync<never, string>   (resolves to Err)
```

`ok`/`err` build synchronous `Result` values. `okAsync`/`errAsync` build
`ResultAsync` values that will resolve to an `Ok`/`Err` when awaited. Prefer these
over hand-writing `Promise.resolve(ok(...))`.

### Annotating function return types

New users consistently ask how to annotate a fallible function. The pattern:

```ts
import { Result, ResultAsync, ok, err } from 'neverthrow'

// Synchronous fallible function
function parseIntSafe(s: string): Result<number, string> {
  return /^\d+$/.test(s) ? ok(Number(s)) : err('not an integer')
}

// Asynchronous fallible function — prefer ResultAsync over Promise<Result>
function fetchUser(id: string): ResultAsync<Response, HttpError> {
  return ResultAsync.fromPromise(fetch(`/api/users/${id}`), toHttpError)
}

// Both call sites chain identically thanks to the shared combinator API
```

Prefer `ResultAsync<T, E>` over `Promise<Result<T, E>>` as a return type.
`ResultAsync` is thenable (it behaves like `Promise<Result>` at the boundary) but
exposes `map`, `andThen`, `match` directly so callers can chain without awaiting
first. Returning a raw `Promise<Result>` forces every caller to `await` before they
can use any combinator.

As of v7.1.0, `err('NotFound')` infers the literal type `'NotFound'` rather than
`string`, which makes tagged error unions ergonomic without `as const`.

## 4. The One Decision: `map` vs `andThen`

This is the single most common source of neverthrow bugs. Get it right and the rest
of the library falls into place.

| Use | When the callback returns | Signature |
|-----|--------------------------|-----------|
| `map` | a plain value (cannot fail) | `(f: T => U) => Result<U, E>` |
| `andThen` | a new `Result` (can fail) | `(f: T => Result<U, F>) => Result<U, E \| F>` |

`map` transforms the Ok value and stays on the Ok track. `andThen` runs a step that
might itself fail, so it must return a `Result`; neverthrow flattens the nested
result automatically.

```ts
import { ok, err, Result } from 'neverthrow'

const square = (n: number) => ok(n * n)
const failIfNegative = (n: number): Result<number, string> =>
  n < 0 ? err('negative') : ok(n)

ok(3)
  .map(n => n + 1)      // Ok(4) — pure transform, use map
  .andThen(square)      // Ok(16) — returns a Result, use andThen
  .andThen(failIfNegative)

ok(-5)
  .andThen(failIfNegative)  // Err('negative') — chain short-circuits here
  .map(n => n + 1)          // skipped
```

✅ Correct: `andThen` when the callback can produce an `Err`.
❌ Wrong: using `map` with a function that returns a `Result` — you get
`Result<Result<...>, E>`, a nested value nobody wants.
❌ Wrong: using `andThen` for a pure transform — it works but signals "this can fail"
to the next reader when it cannot.

As of v4.1.0, `andThen` allows distinct error types per step and unions them
automatically (`E | F`), so a chain of differently-typed fallible steps produces one
clean union without manual widening.

→ For the precise signature of every combinator including the `R extends Result`
constraint on `orElse`, see `references/api-reference.md`.

## 5. Sync → Async

A synchronous `Result` becomes asynchronous the moment a step returns a `Promise`
or `ResultAsync`. Use the async-aware combinators at that boundary.

| Method | On | Callback returns | Returns |
|--------|-----|------------------|---------|
| `asyncMap` | `Result` | `Promise<U>` | `ResultAsync<U, E>` |
| `asyncAndThen` | `Result` | `ResultAsync<U, F>` | `ResultAsync<U, E \| F>` |
| `andThen` | `ResultAsync` | `Result` or `ResultAsync` | `ResultAsync<U, E \| F>` |

```ts
import { ok } from 'neverthrow'

// parse (sync) → fetch from DB (async) → send email (async)
const flow = ok(rawInput)
  .map(parseInput)                      // Result<Parsed, ParseError>
  .asyncAndThen(fetchUserFromDb)        // ResultAsync<User, ParseError | DbError>
  .andThen(sendWelcomeEmail)            // ResultAsync<void, ... | MailError>
```

Once you cross into `ResultAsync`, stay there — every subsequent `.map`/`.andThen`
on a `ResultAsync` returns another `ResultAsync`. Do not `await` mid-chain just to
get back to a `Result`; that breaks composition and forces you to re-wrap.

⚠️ **GOTCHA**: `await asyncResult` yields a `Result`, not the Ok value.
`await okAsync(5)` gives `Ok(5)`, not `5`. Awaiting only unwraps the `ResultAsync`
into its inner `Result`; you still need `.match` or `.unwrapOr` to get the value out.

## 6. Boundary Interop

JavaScript libraries throw. Keep that throwing at the *edges* of your codebase and
let `Result` flow pure inside your domain.

### `Result.fromThrowable` — wrap a sync throwing function

```ts
import { Result } from 'neverthrow'

const safeJsonParse = Result.fromThrowable(
  JSON.parse,
  (e: unknown) => ({ type: 'parse' as const, message: String(e) })
)

const parsed = safeJsonParse('{"a":1}')  // Result<unknown, { type: 'parse'; message: string }>
```

The second argument maps the unknown thrown value into a typed error. Without it the
error type is `unknown`, which defeats the purpose — always pass an `errorFn`.

### `ResultAsync.fromPromise` — wrap a single Promise

```ts
import { ResultAsync } from 'neverthrow'

const fetched = ResultAsync.fromPromise(
  fetch('/api/users/1'),
  (e: unknown) => ({ type: 'http' as const, cause: e })
) // ResultAsync<Response, HttpError>
```

### `ResultAsync.fromSafePromise` — when you know it cannot reject

Skips the error handler. Use sparingly and only when the promise genuinely cannot
reject (e.g. a `setTimeout`-based delay). A rejected "safe" promise will reject the
`ResultAsync` itself rather than resolving to an `Err`.

### `ResultAsync.fromThrowable` — the safer alternative to `fromPromise`

⚠️ **GOTCHA**: `fromPromise` takes an *already-constructed* Promise. If the producer
function throws synchronously before returning the promise (common for non-async
functions with argument validation), that throw escapes `fromPromise` entirely.

```ts
// UNSAFE — sync throw escapes
const r = ResultAsync.fromPromise(insertUser(badUser), toDbError)

// SAFE — wraps the call itself
const insertUserSafe = ResultAsync.fromThrowable(insertUser, toDbError)
const r = insertUserSafe(badUser)
```

Use `ResultAsync.fromThrowable` when wrapping a function that returns a `Promise`
but might also throw before reaching the first `await`.

## 7. Error Typing

The error type `E` is the entire point of the library. A loose `E` throws away the
safety you came for.

### Prefer discriminated unions

```ts
type AppError =
  | { type: 'notFound'; resource: string }
  | { type: 'validation'; field: string }
  | { type: 'network'; status: number }

function loadUser(id: string): ResultAsync<User, AppError> { /* ... */ }

loadUser(id).match(
  user => user,
  err => {
    switch (err.type) {       // TypeScript forces exhaustiveness here
      case 'notFound':   return `missing ${err.resource}`
      case 'validation': return `bad ${err.field}`
      case 'network':    return `HTTP ${err.status}`
    }
  }
)
```

Discriminated unions let the error handler be exhaustive at the `switch` level, which
is where you actually want enforcement. Tag every variant with a literal `type`.

✅ Good: discriminated union with a `type` discriminator.
✅ Good: union of string literals for simple cases (`'notFound' | 'unauthorized'`).
❌ Bad: `Error` or `unknown` as `E` — callers learn nothing and must re-narrow.
❌ Bad: `any` as `E` — silently disables checking.

### Let TypeScript infer when possible

```ts
// Good — types inferred
const r = ok(5).map(x => x * 2).andThen(x => ok(x.toString()))

// Unnecessary — explicit args clutter without adding safety
const r2 = ok<number, never>(5).map<number>(x => x * 2)
```

Annotate return types on exported functions (so callers see the contract) but let
inference handle the chain internals.

### Normalize error unions with `mapErr`

Long `andThen` chains accumulate error types (`E1 | E2 | E3 | …`). When a union grows
unwieldy, insert a `mapErr` to normalize back to one domain error type:

```ts
fetchUser(id)                   // ResultAsync<User, HttpError>
  .andThen(validate)            // ResultAsync<User, HttpError | ValidationError>
  .mapErr(toDomainError)        // ResultAsync<User, DomainError>
  .andThen(persist)             // ResultAsync<User, DomainError>
```

→ For a full worked example collapsing three internal error types into one domain
error, see `references/advanced-patterns.md#error-normalization-with-maperr`.

## 8. Terminal Handling

A `Result` that is never consumed is a silent bug. End every chain by either
branching on the outcome or providing a default.

### `match` — branch on both variants

```ts
const message = result.match(
  user => `welcome ${user.name}`,
  err  => `failed: ${err.message}`
) // message: string — the Result is fully consumed
```

`match` takes an Ok callback and an Err callback. Both must return the same type.
It unwraps the `Result` into a plain value, which is why it is the canonical
terminal — you cannot forget the Err branch because you must pass two callbacks.

On `ResultAsync`, `match` returns `Promise<A | B>`.

### `unwrapOr` — provide a default

```ts
const timeout = config.get('timeout').unwrapOr(5000) // number
```

Use when you have a sensible default and the error is not actionable at this site.
On `ResultAsync`, `unwrapOr` returns `Promise<T>`.

### `_unsafeUnwrap` / `_unsafeUnwrapErr` — testing only

These throw if the result is the wrong variant. Reserve them for test assertions
where you have already arranged the outcome. Using them in production code defeats
the library — it turns a typed error back into an untyped throw.

### Result is not must-use — use `eslint-plugin-neverthrow`

⚠️ **GOTCHA**: TypeScript does not flag an unconsumed `Result`. The following
silently drops the error:

```ts
fetchUser(id)                    // ResultAsync<User, HttpError>
// no .match / .unwrapOr — Err is lost at GC time
```

Install [`eslint-plugin-neverthrow`](https://github.com/mdbetancourt/eslint-plugin-neverthrow)
to enforce that every `Result` is consumed via `.match`, `.unwrapOr`, or
`_unsafeUnwrap`. This is the TypeScript analogue of Rust's `#[must_use]` and is the
single highest-leverage tool for catching forgotten error handling.

## 9. Advanced Combinators

These earn their keep in real codebases. Each is summarised here; for worked
examples see `references/advanced-patterns.md`.

### Side effects: `andTee` / `orTee` / `andThrough`

| Method | Runs on | Affects result? | Use for |
|--------|---------|------------------|---------|
| `andTee` | Ok | No — passes through, swallows side-effect errors | logging, metrics on success |
| `orTee` | Err | No — passes through, swallows side-effect errors | error logging, alerting |
| `andThrough` | Ok | Yes — propagates side-effect Err, keeps original Ok value | validation that must not transform the value |

```ts
parseInput(raw)
  .andTee(logParsed)          // log on success; the return value is ignored
  .andThrough(validateUser)   // validate; on Err the chain short-circuits
  .asyncAndThen(saveUser)
```

Use `andTee`/`orTee` for observability that must never break the flow. Use
`andThrough` when a check can fail but should not change the value on success. Do
not put side effects in `map` — `map` is for pure transforms and a logging `map`
breaks composability and misleads readers.

### Recovery: `orElse`

```ts
fetchFromCache(id)
  .orElse(() => fetchFromDatabase(id))   // cache miss → try db
  .orElse(() => fetchFromApi(id))        // db fail → try api
  .orElse(() => ok(defaultUser))         // all fail → fallback
```

`orElse` runs only on `Err` and returns a new `Result`, so it is the recovery
combinator. Chain multiple `orElse` calls for multi-tier fallback. Because each
`orElse` returns a `Result`/`ResultAsync`, you keep full typing on the recovered
value.

### Combining parallel results: `combine` vs `combineWithAllErrors`

```ts
import { Result, ok, err } from 'neverthrow'

// Short-circuits on the first Err — like Promise.all for Results
const r1 = Result.combine([ok(1), ok('a'), ok(true)])
// Result<[number, string, boolean], never>

// Collects every Err — use when you want all failures, not just the first
const r2 = Result.combineWithAllErrors([ok(1), err('e1'), ok(3), err('e2')])
// Result<number[], string[]>  →  Err(['e1', 'e2'])
```

`combine` supports heterogeneous tuples: pass a literal array and the Ok type is a
tuple `[T1, T2, …]` with the error type as a union `E1 | E2 | …`.

⚠️ **GOTCHA**: tuple inference needs a literal array. `combine(arr)` where
`arr: Result<T, E>[]` collapses to `Result<T[], E>` — pass the array inline or use
a `const`-typed tuple to keep per-element types.

→ For combine semantics with `ResultAsync`, safeTry generator unwrapping,
retry/backoff, and testing patterns, see `references/advanced-patterns.md`.

## 10. Best Practices & Pitfalls

### Typing

✅ Model `E` as a discriminated union with a `type` tag, or a union of string
literals for simple cases.
✅ Annotate return types on exported functions: `Result<T, E>` or `ResultAsync<T, E>`.
✅ Normalize unwieldy error unions with `mapErr` when they cross module boundaries.
❌ Don't use `any`, `unknown`, or `Error` as `E` — you lose the safety you came for.
❌ Don't leave side effects in `map`; use `andTee`/`orTee`.

### Boundaries

✅ Wrap third-party throwing code with `fromThrowable` at the edge so `Result`
stays pure inside your domain.
✅ Prefer `ResultAsync.fromThrowable` over `fromPromise` when the producer might
throw synchronously before returning a promise.
❌ Don't let throws leak into your domain logic — catch once at the boundary.

### Combinators

✅ `map` for pure transforms, `andThen` for fallible steps. When unsure, ask
"can this callback produce an `Err`?" — if yes, `andThen`.
✅ Order cheap, likely-to-fail validations early so the chain short-circuits
before expensive work.
✅ Use `andThrough` for validation that preserves the value; `andThen` only when
the value transforms.
❌ Don't return a raw `Promise` from an `andThen` callback — return `Result` or
`ResultAsync`. (`ResultAsync.andThen` accepts either, but `Result.andThen` does
not accept `Promise`.)
❌ Don't `await` mid-chain to "get back to `Result`" — stay in `ResultAsync` and
terminate with `.match`.

### Terminals

✅ End every chain with `.match` or `.unwrapOr`. An unconsumed `Result` is a bug.
✅ Install `eslint-plugin-neverthrow` to enforce consumption — TypeScript alone
will not catch a dropped `Result`.
❌ Don't use `_unsafeUnwrap` in production; reserve it for tests where you have
arranged the outcome.

### Common pitfalls

- **`await asyncResult` yields `Result`, not the Ok value.** `await okAsync(5)` is
  `Ok(5)`, not `5`. You still need `.match`/`.unwrapOr`.
- **React `useEffect` silently drops `Err`.** A `Result`-returning call inside an
  effect with no `.match` compiles fine and swallows the error. Always terminate
  the chain inside the effect.
- **`combine` tuple inference needs a literal array.** `combine(arr)` where
  `arr: Result<T, E>[]` gives `Result<T[], E>`, not a tuple. Pass the array inline.
- **`fromPromise` misses sync throws.** A non-async producer that validates args
  and throws before returning its promise bypasses `fromPromise`. Use
  `ResultAsync.fromThrowable`.
- **Error union explosion.** Long `andThen` chains produce `E1 | E2 | … | En`.
  Insert `mapErr(toDomainError)` to collapse back to one type when crossing a
  module boundary.
- **`safeUnwrap()` is deprecated.** Use `safeTry` with async generators for
  sequential unwrapping when a chain is too deep to read as `.andThen` ladders —
  see `references/advanced-patterns.md`.
- **`_unsafeUnwrap` in production.** It throws on `Err`, re-introducing the
  untyped throw you adopted neverthrow to avoid. Tests only.

### Ecosystem notes

neverthrow is ~1.5KB gzipped and tree-shakes cleanly with named imports. It has no
runtime dependencies. It pairs well with Zod (use Zod at the parse boundary, map
its `SafeParseError` into your `Result` error type) and with any async framework —
`ResultAsync` is thenable so it interoperates with `await` everywhere.
