# Language: Types, Closures, Control Flow, Pattern Matching, Error Handling

> Cross-referenced from SKILL.md §3 (types), §4 (closures/pipelines), §5
> (control flow), §12 (errors). Read this file for exact type signatures,
> custom-type behavior, chained errors, or pattern-matching edges. Every
> code example was verified against local `nu` 0.114.1.

**Contents**

- [Types](#types) — primitives, compound types, signatures, unions, custom types, `into`, nuon
- [Closures](#closures) — syntax, `$in` vs `$it`, capture, spread, `do`, returns
- [Control Flow](#control-flow) — if/else, for/while/loop, each vs par-each, break/continue
- [Pattern Matching](#pattern-matching) — match, alternation, guards, destructuring, wildcard
- [Error Handling](#error-handling) — try/catch, `error make`, error_struct, propagation, chaining

## Types

Nushell is statically typed at the value level. Every literal, pipeline
output, and variable carries a concrete type. You rarely write types —
the engine infers them — but `def` signatures and `describe` make the
system observable. Most runtime errors are type mismatches surfaced at
pipeline boundaries.

### Primitives

| Type       | Literal example        | Notes |
|------------|------------------------|-------|
| `int`      | `42`, `1_000_000`     | Underscores allowed as digit separators |
| `float`    | `3.14`                 | IEEE 754 double |
| `string`   | `"hello"`, `'hi'`      | UTF-8, single or double quotes equivalent |
| `bool`     | `true`, `false`        | |
| `nothing`  | `null`                 | Literal is `null`; type name is `nothing` (`null \| describe` → `nothing`) |
| `datetime` | `2024-01-15`           | Date literal |
| `duration` | `5sec`                 | Units: `ns us ms sec min hr day wk` |
| `filesize` | `10mb`                 | Units: `b kb mb gb tb pb` |
| `binary`   | `0x[01 02 ff]`         | Hex bytes — distinct from `list<int>` |

Inspect any value's type with `describe`: `42 | describe` → `int`,
`5sec | describe` → `duration`, `null | describe` → `nothing`.

### Compound types

| Type        | Literal                                  | `describe` output |
|-------------|------------------------------------------|-------------------|
| `list<T>`   | `[1 2 3]`                                | `list<int>` |
| `record`    | `{name: "Alice", age: 30}`              | `record<name: string, age: int>` |
| `table`     | `[[name age]; [Alice 30] [Bob 25]]`     | `table<name: string, age: int>` |
| `closure`   | `{\|x\| $x + 1 }`                         | `closure` |
| `range`     | `1..5` or `1..<5`                        | `range` |
| `cell-path` | `$.user.name`                            | `cell-path` |

**Gotcha: a table is a `list<record>`.** Tables are not a separate
top-level type — they are lists of records with consistent columns.
`describe` prints `table<col: type>` for readability, but commands that
accept `list<any>` accept tables too.

### Ranges

```nushell
1..5  | each { $in } | to nuon   # [1, 2, 3, 4, 5]   (inclusive end)
1..<5 | each { $in } | to nuon   # [1, 2, 3, 4]      (exclusive end)
```

`..<` is the only way to make the end exclusive. Both bounds are
optional: `1..` is unbounded above (truncate with `take N`); `..5`
starts at 0. Ranges are lazy — `1..` does not allocate an infinite list.

### Type signatures in command definitions

`def` accepts an optional `: input_type -> output_type` annotation
between the parameter list and the body. This declares what pipeline
input the command consumes and what it produces:

```nushell
def double []: int -> int { $in * 2 }
21 | double                       # 42 — input must be int

def names []: table -> list<string> { $in | get name }
ls | names                        # [a.txt, b.md, ...]
```

**Why the body uses `$in`:** with `[]` params, pipeline input flows into
`$in`. The annotations gate calls at parse time — `"x" | double` errors
with `input_type_mismatch` before any code runs.

**Gotcha: do not use `|` for type unions.** `|` is the pipe operator. In
a signature, `int | string -> int` parses `int` as input type, then `|`
starts a pipeline — the parser rejects it. Use `oneof<int, string>`
exclusively:

```nushell
def flex []: oneof<int, string> -> int { $in | into int }
5 | flex                          # 5
"5" | flex                        # 5
3.14 | flex                       # ERROR — float not in union
```

Parameter types support generics — `list<int>`, `record<name: string>`,
`table<name: string>`:

```nushell
def sum-list [xs: list<int>] { $xs | math sum }                 # sum-list [1 2 3] → 6
def greet [r: record<name: string>] { $"Hello, ($r.name)" }     # greet {name: "Alice"}
def col [t: table<name: string>] { $t | get name }              # col [[name]; [Alice] [Bob]]
```

The special type `any` matches everything; `list<any>` accepts lists of
any element type. Omit the annotation entirely to accept `any -> any`.

### Type inference

You rarely annotate locals. `let x = 5` infers `int`; `let xs = [1 2 3]`
infers `list<int>`. Type mismatches surface as
`nu::parser::input_type_mismatch` at parse time (before any code runs),
which is why pipeline errors are usually clear and early.

### Custom types

Nushell 0.114.1 does not support user-defined nominal types via a `type
custom = int` declaration. `type` is not a recognized top-level keyword —
`type myint = int` parses `type` as a command name and fails with
`assignment_requires_variable`. Inside `module` blocks the parser
accepts only `def`, `const`, `extern`, `alias`, `use`, `module`,
`export`, `export-env` keywords.

**Why this matters:** documentation in some versions references `type`
declarations, but in 0.114.1 they are unavailable. To approximate a
custom type:

- Use a `record` with a fixed shape — `def make-point [x: int, y: int]
  { {x: $x, y: $y} }` — the call signature is the contract.
- Use `def` with input/output annotations to constrain boundaries.
- Use a `module` to namespace a family of constructors.

→ For module-based encapsulation patterns, see
`references/scripts-modules-config.md#modules`.

### `into` conversion commands

`into` is a command namespace; the target type is the subcommand name:

```nushell
"42" | into int              # 42 (string → int)
3.14 | into int              # 3 (truncate toward zero)
5 | into string             # "5"
5 | into float               # 5.0
"true" | into bool           # true (also "false" "1" "0" "yes" "no")
"2024-01-15" | into datetime # datetime
"5sec" | into duration       # 5sec
5 | into binary              # 0x[05]
5 | into filesize            # 5 B
```

Full subcommand list (`help into`): `into binary`, `into bool`,
`into cell-path`, `into datetime`, `into duration`, `into filesize`,
`into float`, `into glob`, `into int`, `into record`, `into semver`,
`into semver-range`, `into sqlite`, `into string`, `into value`.

**Gotcha: `into record`** has the narrowest input set — `datetime`,
`duration`, `list<any>`, `record`. NOT `string`:

```nushell
{a: 1} | into record          # {a: 1} (identity)
2024-01-15 | into record       # {year: 2024, month: 1, day: 15, ...}
5sec | into record             # {second: 5, sign: +}
"hello" | into record          # ERROR — input_type_mismatch
[1 2 3] | into record          # ERROR — list elements must be [key value] pairs
[["key" "value"]] | into record  # {key: value}
```

### NUON — nushell object notation

NUON is nushell's native serialization format — a JSON superset that
supports comments, durations, filesize literals, ranges, and closures:

```nushell
{a: 1, b: [2 3]} | to nuon              # {a: 1, b: [2, 3]}
"{a: 1, b: [2, 3]}" | from nuon         # {a: 1, b: [2, 3]}
{a: 1, b: [2 3]} | to nuon | from nuon | to nuon   # round-trip safe
```

**Why NUON over JSON for nushell-to-nushell data:** JSON loses durations
(`5sec` becomes `"5sec"` string), filesize (`10mb` becomes `10485760`),
and the table/record distinction. NUON preserves all of these. Use
`to json` for external interop; use `to nuon` for caching, fixtures, or
nushell-to-nushell data.

→ For the full format catalog, see
`references/externals-io-formats.md#data-formats`.

## Closures

Closures are nushell's first-class callable values — the worker bees of
`each`, `par-each`, `where`, `filter`, `update`, `insert`, and most
higher-order commands.

### Syntax

```nushell
{|x| $x + 1}              # one param
{|x, y| $x + $y}          # multiple params
{|| $in * 2}              # no params — || disambiguates from record literal
{|x = 5| $x * 2}          # default param value
{ $in * 2 }                # bare block — implicit $in, no params
```

**Why `{||` exists:** a bare `{ ... }` is ambiguous between a closure and
a record literal. `{|| ...}` (with `||`) tells the parser this is a
closure with no parameters. Bare blocks work in pipeline position
(`each { ... }`) where context disambiguates.

Closures return their last expression — there is no `return` keyword:

```nushell
let f = {|x|
  let doubled = $x * 2
  $doubled + 1            # this is the return value
}
do $f 5                   # 11
```

### `$in` vs `$it`

`$in` is the pipeline input value, available in every closure and every
pipeline stage. `$it` is a legacy row variable that works ONLY in `where`
row conditions:

```nushell
[1 2 3] | each { $in * 2 }            # works — $in everywhere
[1 2 3] | each {|x| $x * 2 }         # works — named param equivalent
[1 2 3] | where $it > 1              # works — $it in where row conditions
[1 2 3] | each { $it * 2 }           # ERROR — variable_not_found
```

**Why `$it` is restricted:** `$it` is implicitly injected only by `where`
when the row condition references it without a closure declaration.
Anywhere else, `$it` is an unbound variable. This catches developers
porting from older nushell (pre-0.60) where `$it` was universal.

**Tip:** prefer `$in` or a named parameter. `[1 2 3] | where $in > 1`
works too and is more consistent than `$it`.

### Closure capture

Closures capture `let` bindings from their enclosing scope by reference
at the point of definition:

```nushell
let mult = 3
[1 2 3] | each { $in * $mult }        # [3, 6, 9] — $mult captured
let f = {|x| $x + $mult }
do $f 10                              # 13
```

**Gotcha: muts cannot be captured in closures at all.** Nushell rejects
it at parse time with `expected_keyword: Capture of mutable variable`:

```nushell
mut total = 0
[1 2 3] | each { $total = $total + $in }   # ERROR — capture of mutable variable
```

**Why muts are barred from closures:** closures may run on multiple
threads (`par-each`) or in arbitrary order, so shared mutable state
would race or produce order-dependent results. To accumulate across a
list, use `reduce` (fold) or `math sum`:

```nushell
[1 2 3] | reduce --fold 0 {|it, acc| $acc + $it }   # 6 — fold with initial 0
[1 2 3] | math sum                                  # 6 — specialized sum
```

For stateful iteration with mutation, use `for` (single-threaded, no
closure capture): `mut t = 0; for $i in 1..3 { $t = $t + $i }; $t` → `6`.

### Spread in closure calls

```nushell
let args = [1 2 3]
do {|a b c| $a + $b + $c } ...$args   # 6
```

Spread expands the list into separate positional arguments at the call
site. Without `...`, the list passes as a single argument and the closure
sees `$a = [1 2 3]`, `$b = null`, `$c = null`.

### `do` for custom scope

`do` runs a closure with explicit invocation — call a stored closure,
attach arguments, or control error propagation:

```nushell
let f = {|x| $x * 2 }
do $f 21                              # 42 — calling a stored closure
21 | do { 100 + $in }                 # 121 — pipeline input flows to $in
77 | do {|x=100| $x + $in }           # 177 — 77 to $in, x defaults to 100
do {|x| $x + 1 } 77                   # 78 — 77 is positional, $in is nothing
```

`do` flags (verified via `help do`):

| Flag                  | Purpose |
|-----------------------|---------|
| `-i`, `--ignore-errors` | Ignore shell and external errors as the closure runs |
| `-c`, `--capture-errors` | Catch errors as the closure runs, return them as a value |
| `--env`               | Keep the environment defined inside the command after the call |

**Why `do --env` matters:** env assignments inside a closure are scoped
to the closure by default. `do --env` lifts them back to the caller —
without it, `$env.foo` set inside `do { ... }` is invisible afterward.
The same semantics apply to `def --env`.

### No explicit `return`

Closures return their final expression. There is no `return` keyword —
early exit is handled with `if`/`else` or `try`/`catch`:

```nushell
let classify = {|n|
  if $n > 100 { "big" } else if $n > 10 { "mid" } else { "small" }
}
do $classify 5                       # small
```

For commands that need to abort early, raise an error with `error make`
and catch it upstream — errors are the early-exit mechanism (see
[Error Handling](#error-handling)).

→ For closures in higher-order commands (`each`, `where`, `update`), see
`references/data-commands.md#pipeline-semantics`.

## Control Flow

Nushell is expression-oriented: most "control flow" returns a value
rather than executing for side effect. `if` is an expression; `match` is
an expression; `for` returns `null`. Prefer chains of expressions over
imperative blocks.

### if / else

`if`/`else` returns the value of the taken branch:

```nushell
let label = if $x > 10 { "big" } else { "small" }
let grade = if $score >= 90 { "A" } else if $score >= 80 { "B" } else { "C" }
```

**Why both branches must yield the same type:** nushell infers the type of
the `if` expression from its branches. If branches differ, downstream
pipelines get an inferred union type and may fail at the next stage.
Keep branches consistent — convert with `into` if needed.

### for / while / loop

```nushell
for $i in 1..3 { print $i }                  # 1\n2\n3
for $row in $table { print $row.name }

mut count = 0
while $count < 3 { $count = $count + 1 }
$count                                       # 3

mut i = 0
loop {
  if $i >= 3 { break }
  $i = $i + 1
}
$i                                           # 3
```

**Why `for` returns `null`:** `for` exists for side effects (print,
write files). To accumulate values, use `each { ... }` (returns a list)
or `reduce` (folds). Do not build a list by mutating an outer `mut acc`
inside `for` — `each` is clearer, parallelizable, and shorter.

### each (sequential) vs par-each (parallel)

```nushell
[1 2 3] | each { $in * 2 }                              # [2 4 6]
[1 2 3] | par-each { $in * 2 } | sort                   # [2 4 6] — parallel
[1 2 3] | par-each --keep-order { $in * 2 }             # [2 4 6] — ordered
[1 2 3] | par-each --threads 4 --keep-order { $in * 2 } # explicit thread count
```

`par-each` runs the closure on threads; results arrive in arbitrary
order. `--keep-order` (`-k`) preserves input order in output.
`--threads` (`-t`) caps the thread count. There is no `--keep-going`
flag — verified via `help par-each`, which lists only `-t`, `-k`, `-h`.

**Why `par-each` reorders by default:** parallel execution finishes in
non-deterministic order. Use `--keep-order` (slower — it serializes
output assembly) or follow with `sort-by`. Use `par-each` for CPU-bound
work where order is irrelevant; use `each` for ordered transformations
or where the closure has shared-state side effects.

### break / continue

`break` and `continue` work inside `for`, `while`, and `loop`:

```nushell
mut kept = []
for $i in 1..5 {
  if $i == 3 { continue }      # skip 3
  if $i == 5 { break }        # stop at 5
  $kept = ($kept | append $i)
}
$kept                          # [1, 2, 4]
```

`break`/`continue` are NOT available inside `each` closures — `each` is
a pipeline transformation, not a loop. To short-circuit `each`, use
`take while`/`take until` on the input:

```nushell
[1 2 3 4 5] | take while { $in < 4 }     # [1, 2, 3]
```

### do blocks

`do` blocks run code in a new scope without a custom command — useful to
avoid leaking intermediate locals:

```nushell
let result = do {
  let x = 5
  let y = 10
  $x + $y
}
$result                        # 15 — x, y not visible outside
```

→ For pipeline-level control flow (`take`, `skip`, `drop`, `window`), see
`references/data-commands.md#pipeline-semantics`.

## Pattern Matching

`match` is the primary branching construct for non-trivial dispatch. It
returns the value of the matched arm. Every arm is `pattern =>
expression`. `match` is an expression — assign it, return it, or pipe
it:

```nushell
let label = match $score { 90 => "A", _ => "other" }

match $value {
  1 => "one"
  2 | 3 => "small"                                    # alternation
  $n if $n > 10 => "big"                              # guard
  {name: $name, age: $age} => $"($name) is ($age)"   # record destructure
  [$a, $b] => $"two: ($a), ($b)"                     # list destructure
  _ => "other"                                        # wildcard
}
```

### Patterns

| Pattern                     | Matches                                     | Binds |
|-----------------------------|---------------------------------------------|-------|
| `1`, `"a"`, `true`          | That literal value                          | nothing |
| `1 \| 2 \| 3`               | Any of the listed values (alternation)      | nothing |
| `$x`                        | Anything                                    | `$x` to the value |
| `$n if $n > 10`             | Pattern + boolean guard                     | `$n` if guard passes |
| `{name: $n, age: $a}`       | Record with at least those fields           | `$n`, `$a` |
| `[$a, $b]`                  | List of exactly two elements                | `$a`, `$b` |
| `[$a, .., $z]`              | List with `..` matching any middle elements | `$a`, `$z` |
| `[]`                        | Empty list                                  | nothing |
| `_`                         | Anything (discard)                          | nothing |

```nushell
match $record {
  {name: $name, age: $age} => $"($name), age ($age)"
  {name: $name} => $"name only: ($name)"       # partial — matches subset
  _ => "not a record"
}

match $list {
  [] => "empty"
  [$only] => $"single: ($only)"
  [$a, $b] => $"pair: ($a), ($b)"
  _ => "other"
}

match $point {                                # patterns nest arbitrarily deep
  {x: $x, y: {a: $a}} => $"x=($x), a=($a)"
  _ => "?"
}
```

Field names on the left of a record pattern bind variables on the right.
Record patterns are partial — a record with extra fields still matches a
pattern that specifies a subset. List patterns bind by position.

**Why `|` in patterns is not a pipe:** inside `match` pattern position,
`|` is the alternation operator — the one place `|` is overloaded away
from pipeline meaning. Keep patterns on a single line and the parser
disambiguates.

**Tip:** always include a `_` or `$x` catch-all as the final arm.
Without one, a non-matching value raises `nu::shell::match_pattern_not_found`.
There is no regex pattern in `match` — for regex, use `find`/`parse`
upstream and dispatch on the result.

### Destructuring outside `match`

**Gotcha:** `let [a b c] = [1 2 3]` and `let {x: $px} = $record` do NOT
work in nushell 0.114.1 — destructuring binding is restricted to `match`
patterns only. To bind named locals from a record, use `let` per field:

```nushell
let r = {x: 1, y: 2}
let x = $r.x
let y = $r.y
```

## Error Handling

Nushell errors are values, not exceptions. There is no `throw`/`raise`.
An error raised anywhere in a pipeline propagates down the pipeline
until a `try`/`catch` absorbs it. This makes error handling composable:
wrap any pipeline segment in `try { ... } catch { |err| ... }` to handle
failures locally.

### try / catch

```nushell
try { open maybe-missing.json } catch { |err|
  print $"Could not read: ($err.msg)"
  {}                                 # fallback value returned by try
}
```

`catch` is a closure receiving the error record as `$err`. The last
expression of `catch` becomes the value of the whole `try` block — this
is how you return fallbacks.

The caught error record has these top-level fields (verified via
`$err | columns`):

| Field      | Purpose |
|------------|---------|
| `msg`      | The message (string) — safe to read |
| `debug`    | Rust debug repr (string) — safe to read |
| `raw`      | Raw underlying error Value — RE-RAISES if returned |
| `rendered` | Rendered error display — RE-RAISES if returned |
| `details`  | Full error_struct record (msg, labels, code, url, help, inner) |

**Gotcha: `$err.raw` and `$err.rendered` re-raise the error.** Accessing
them returns the underlying error Value, which nushell re-raises as if
you had produced a fresh error. For inspection, use `$err.msg`
(top-level shortcut) or `$err.details` (the structured record). Never
pipe `$err.raw` out of a catch unless you intend to re-raise.

**Why the split:** the caught record is a `LabeledError` view, and
`raw`/`rendered` hold the underlying error Value. Accessing them
re-enters the error display machinery. Safe fields are `msg`, `debug`,
and `details.{msg, code, labels, help, url, inner}`.

### Inspecting caught errors

```nushell
try { open /nonexistent.json } catch { |err|
  print $"msg: ($err.msg)"
  print $"code: ($err.details.code)"           # null for unspecified
  print $"labels: ($err.details.labels | length)"
}

try { error make {msg: "x", code: "E1"} } catch { |err|
  $err.details.code                             # E1
}

try { error make {msg: "x", labels: [{text: "bad", span: (metadata "abc").span}]} } catch { |err|
  $err.details.labels                            # table: text, span, location columns
}
```

### `error make`

`error make` produces an error value. It accepts either a string (treated
as the `msg`) or an `error_struct` record:

```nushell
error make "oops"                                # string → msg="oops"
error make {msg: "oops"}                         # explicit struct
error make {
  msg: "invalid value"
  code: "E_INVALID"
  labels: [{text: "expected positive", span: (metadata $x).span}]
  help: "pass a number > 0"
  url: "https://example.com/docs#invalid"
}
```

**`error make` flags (verified via `help error make`):** only `-u`,
`--unspanned`, and `-h`/`--help`. There is no `--algorithm` flag and no
`--span` flag. To attach a span, set the `labels` field with `{text,
span}` records where `span` is `{start: int, end: int}` — usually
obtained via `(metadata $value).span`.

### error_struct fields

| Field    | Type                       | Required | Purpose |
|----------|----------------------------|----------|---------|
| `msg`    | string                     | yes      | Error message shown to the user |
| `code`   | string                     | no       | Short error code (e.g. `"E1"`) — appears in the header |
| `labels` | table of `{text, span}`    | no       | Highlighted spans in the source pointing at the problem |
| `help`   | string                     | no       | Extra help text shown below the error |
| `url`    | string                     | no       | URL appended to the header for doc links |
| `inner`  | list of error_struct       | no       | Chained inner errors (the cause chain) |
| `src`    | src_record `{name, text, path}` | no  | External source — labels point into this text instead of nu spans |

When `src` is set, `code` is forced to `nu::shell::outside`. Labels
cannot simultaneously reference nu spans and an external `src` — to
combine, use `inner` to chain an outside error under a nu-spanned outer
error.

### `--unspanned`

```nushell
error make --unspanned {msg: "no source context"}
```

`--unspanned` strips labels from the error, producing a spanless error.
Use it when the error does not correspond to a specific source location —
for example, errors raised from data validation where the offending
value has no metadata.

### Error propagation through pipelines

Errors flow through pipelines like values until a `try` absorbs them:

```nushell
[1 2 3] | each {
  if $in == 2 { error make {msg: "no twos"} } else { $in }
}                                     # ERROR propagates out of each
```

The pipeline fails at the `each` stage; the error surfaces wherever the
pipeline is consumed. Wrap the segment that may fail:

```nushell
try {
  [1 2 3] | each { if $in == 2 { error make {msg: "no twos"} } else { $in } }
} catch { |err|
  $err.msg                            # "Eval block failed with pipeline input"
  $err.details.inner.0.msg            # "no twos" — the original, wrapped
}
```

**Gotcha: errors raised inside `each` are wrapped.** A direct `try { error
make "X" } catch { |err| $err.msg }` yields `"X"`. The same error raised
inside `each` (or any pipeline block) is wrapped in an outer error whose
`msg` is `"Eval block failed with pipeline input"`; the original lives
in `$err.details.inner.0.msg`. To handle pipeline-block errors reliably,
unwrap via `$err.details.inner.0.msg` (or check `$err.details.inner` length).

**Why there is no `throw`/`raise`:** nushell treats errors as a value
kind. A pipeline stage that produces an error short-circuits downstream
stages. This composes naturally — wrap any segment, fall back
gracefully, and never worry about exception unwinding across call
frames.

### Error chaining via `inner`

Chain related errors by passing earlier errors under `inner`:

```nushell
try {
  error make "outer failure"
} catch { |err|
  error make {
    msg: "context: failed during config load"
    inner: [$err]
  }
}
```

The catch receives the original error as `$err`; the new `error make`
wraps it. The user sees both errors stacked — the outer provides context,
the inner shows the cause. Multiple inner errors are allowed
(`inner: [$err1, $err2]`).

**Tip:** chain when the user-facing error is more useful than the raw
system error. For example, an `open` failure says "File not found" —
wrapping it with `inner: [$err]` and a `msg` like "config.json missing
— run init" gives the user an actionable message while preserving the
cause.

### `error make "string"` shorthand

```nushell
error make "oops"                    # equivalent to: error make {msg: "oops"}
```

When the input to `error make` is a string, nushell treats it as the
`msg` field of an `error_struct` with all other fields defaulted. Use
this for quick validation errors with no source span. For richer errors
(code, labels, help, url), pass the full struct.

→ For pipeline-level error patterns and `do --capture-errors`, see
`references/data-commands.md#pipeline-semantics`. For `try`/`catch` in
custom commands, see `references/scripts-modules-config.md#custom-commands`.

---

All code in this reference was verified against local `nu` 0.114.1. When in
doubt about a flag or field, run `help <command>` in a nushell
REPL — the local `nu` binary is the source of truth.
