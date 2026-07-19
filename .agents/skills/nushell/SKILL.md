---
name: nushell
description: Master nushell (`nu`) — the structured-data shell and language — for writing scripts, modules, custom commands, manipulating tables/records/lists through pipelines, configuring the environment, and working with files, HTTP, and external commands. Use whenever the user mentions nushell, nu, .nu files, config.nu, env.nu, or wants to write shell scripts in a structured-data paradigm. Trigger for pipeline data transformations, filtering/grouping tables, def/module/overlay authoring, porting bash to nushell, or working with JSON/CSV/YAML from the command line. Do not use for bash, zsh, POSIX shell, PowerShell, or fish.
license: MIT
compatibility: Requires nushell v0.100+; latest tested v0.114.1. Works on Windows/macOS/Linux.
---

# Nushell

Nushell is a shell where everything is structured data. Instead of piping strings (bash, zsh), nushell pipes typed values — lists, records, tables — through transformation pipelines, making data processing and API interaction far more reliable.

## 1. What Is Nushell

Traditional shells treat command output as raw text and rely on `grep`,
`awk`, `sed`, `jq` to parse it back. Nushell eliminates that round-trip:
commands emit and consume structured data directly.

```nushell
ls | where size > 1mb | select name size | sort-by size --reverse
open Cargo.toml | get package.dependencies
```

**Why this matters:** no quoting bugs, no fragile text parsing. **Not:** nushell cannot source bash scripts — keep bash for legacy compatibility or heavy text processing.

→ For bash→nushell porting, see `references/externals-io-formats.md#bash-interop`.

## 2. Installation and REPL

```nushell
nu --version              # check version
nu                        # start REPL
nu script.nu              # run a script
nu -c 'ls | where size > 1mb | get name'  # one-liner
```

Config files live under `$nu.default-config-dir` (Windows:
`%APPDATA%\nushell`; Linux/macOS: `~/.config/nushell`). Three files:
`env.nu` (env vars, loaded first), `config.nu` (settings + custom
commands, interactive only), `login.nu` (login shells).

**Config not loaded for scripts:** `nu script.nu` does NOT load
`config.nu` or `env.nu`. Source them explicitly if a script needs config.

→ For full config, see `references/scripts-modules-config.md#configuration`.

## 3. Types, Literals, and Variables

```nushell
# Primitives: int, float, string, bool, null, date, duration, filesize, binary
42 | 3.14 | "hello" | true | null | 2024-01-15 | 5sec | 10mb | 0x[01 02 ff]

# Compound types
[1 2 3]                           # list<int>
{name: "Alice", age: 30}           # record
[[name age]; [Alice 30] [Bob 25]]  # table (list of records)
{|x| $x + 1}                      # closure
1..5                              # range inclusive: 1,2,3,4,5
1..<5                             # range exclusive: 1,2,3,4
```

String interpolation uses `$()` for sub-expressions: `let name = "world"; $"Hello, ($name)!"`.

### Variables

```nushell
let x = 42        # immutable — cannot reassign
mut y = 10        # mutable — reassign with $y = 20
const PI = 3.14   # compile-time constant
$env.PATH         # environment variable
$nu.default-config-dir  # built-in nushell state (paths, pid, os-info)
version             # nushell version (command, not $nu.version)
```

**Why `let` vs `mut`:** nushell is expression-oriented — most code chains
transformations without mutation. Use `mut` only for accumulators; prefer
`reduce` or `each` when possible. `let x = 1; $x = 2` is an error.

### Type conversion

```nushell
"42" | into int           # string → int
42 | into string          # int → string
[[v]; [1]] | into record  # one-row table → record
```

→ For the full type system and custom types, see
`references/language-types.md#types`.

## 4. Pipelines and Cell Paths

The pipeline is nushell's core paradigm. Data flows left-to-right; each
command receives the previous output via `$in`.

```nushell
[1 2 3] | each { $in * 2 }      # $in is implicit pipeline input
[1 2 3] | each {|x| $x * 2 }   # named closure parameter (equivalent)
```

**`$in` vs `$it`:** `$in` is the pipeline input and works everywhere. `$it`
is a legacy row variable that works ONLY in `where` row conditions. Prefer
`$in` or a named parameter; avoid `$it` outside `where`.

```nushell
[1 2 3] | where $it > 1              # $it works here
[1 2 3] | each { $it * 2 }           # ERROR — use $in or named param
```

### Cell paths

Cell paths navigate nested data with `.` for field/index access:

```nushell
let data = {users: [{name: "Alice"}, {name: "Bob"}]}
$data.users.0.name              # "Alice"
$data | get $.users.5?.name     # null (optional path, no error)
```

Data carries metadata (source span, HTTP response). Inspect with `metadata`:

```nushell
http get https://example.com | metadata  # http_response.status
```

→ For pipeline semantics and cell-path internals, see
`references/data-commands.md#pipeline-semantics` and
`references/data-commands.md#cell-paths`.

## 5. Control Flow

```nushell
# if/else (expression — returns a value)
let label = if $x > 10 { "big" } else { "small" }

# Loops
for $item in $items { print $item }
while $cond { $count = $count + 1 }
loop { if $done { break } }

# Pipeline iteration
[1 2 3] | each { $in * 2 }                       # sequential
[1 2 3] | par-each { $in * 2 }                   # parallel (reorders!)
[1 2 3] | par-each --keep-order { $in * 2 }      # preserve order
```

**Why `par-each` reorders:** parallel execution finishes in arbitrary order.
Use `--keep-order` or `sort-by` afterward. There is no `--keep-going` flag.

### Pattern matching

```nushell
match $value {
    1 => "one"
    2 | 3 => "small"                                    # alternation
    $n if $n > 10 => "big"                              # guard
    {name: $name, age: $age} => $"($name) is ($age)"   # record destructure
    [$a, $b] => $"two: ($a), ($b)"                     # list destructure
    _ => "other"
}
```

### try/catch

```nushell
try { risky-operation } catch { |err| print $"Failed: ($err.msg)" }
```

→ For closures, match patterns, and error handling, see
`references/language-types.md#closures`,
`references/language-types.md#pattern-matching`,
`references/language-types.md#error-handling`.

## 6. Built-in Command Essentials

Nushell ships ~200 built-ins. These are the workhorses:

```nushell
# Filtering
ls | where size > 1mb              # row condition (implicit $it)
[a b c d] | drop nth 1             # remove index 1 → [a c d]
[1 2 3] | where { $in > 1 }        # closure form (preferred)

# Selecting
ls | select name size              # keep columns (opposite: reject)
ls | get name                      # one column as list
[1 2 9] | take while { $in < 5 }   # take until condition fails

# Transforming
ls | update size { $in / 1mb }     # update column via closure
ls | insert path { $in.name | path expand }  # add column
[a b] | enumerate                  # add index column
"hello" | wrap text                # wrap value in a record
[[a [1 2]]] | flatten              # flatten nested lists
$t1 | merge $t2                    # merge records/tables

# Grouping and sorting
[1 2 2 3] | uniq -c                # unique with counts
$t | sort-by name --reverse        # descending
$t | group-by category             # group by column value
[1 2 3 4 5] | chunks 2             # fixed-size batches
[1 2 3 4 5] | window 2             # sliding window
[1 2 3] | math sum                 # 6

# Inspecting
"hello" | describe                 # type
$table | columns                   # column names
[1 2 3] | length                   # 3
```

**Not:** there is no `nth` command (use cell paths or `first`/`last` to
select; `drop nth` to remove). There is no `group` command (use `chunks`
for batches, `group-by` for value grouping, `window` for sliding windows).
`filter` is deprecated since 0.105.0 — use `where` instead.

→ For the full command catalog with all flags, see `references/data-commands.md`.

## 7. Custom Commands

```nushell
def greet [name: string] { $"Hello, ($name)!" }

# Full signature: required (x), optional (y?), default (z=10), rest (...rest),
# boolean flag (--verbose), typed flag (--count:int), flag with default
def cmd [x: int, y?: int, z: int = 10, ...rest, --verbose, --count: int, --name: string = "default"] { # body }
def double []: int -> int { $in * 2 }  # input/output type annotations
```

### Special def flags

```nushell
# --env: env changes persist after the call
def --env gohome [] { cd ~ }
gohome; $env.PWD    # ~ expanded

# --wrapped: forward unknown flags to an external (requires ...rest)
def --wrapped mygit [...rest] { ^git ...$rest }
mygit --stat          # forwards --stat to git
```

**Why `--wrapped`:** without it, nushell rejects unknown flags like `--stat`
as parse errors. `--wrapped` captures them into `...rest` as strings.

**Not:** there is no `def --main` flag. To make a script entry point, define
`def main [...args] { ... }`.

→ For full signatures and subcommand patterns, see
`references/scripts-modules-config.md#custom-commands`.

## 8. Modules and Scripts

```nushell
# greetings.nu
module greetings {
    export def hello [name: string] { $"Hello, ($name)!" }
    export const VERSION = "1.0"
    export-env { $env.GREETINGS = "loaded" }
}

use greetings
greetings hello "world"
```

### Scripts with main

```nushell
#!/usr/bin/env nu
# script.nu — run with: nu script.nu 42 --flag
def main [count: int, --flag] { print $"count=($count), flag=($flag)" }
```

**Why `main`:** when a script defines `def main`, `nu script.nu args` routes
args to `main` with full parsing.

### Overlays

Overlays are modules activated as a stackable, hideable scope:

```nushell
overlay use greetings.nu     # activate (commands now global)
overlay hide greetings        # deactivate
```

**source vs use vs overlay use:** `source` runs file in current scope (no
exports); `use` imports exports; `overlay use` activates as a stackable,
hideable overlay. Prefer `use` — `source` pollutes scope.

→ For module scoping and overlay lifecycle, see
`references/scripts-modules-config.md#modules` and
`references/scripts-modules-config.md#scripts`.

## 9. External Commands and Interop

Prefix with `^` to force an external (bypassing any builtin with the same name):

```nushell
ls                # nushell builtin (returns a table)
^ls               # external /usr/bin/ls (returns a string)
^git status
```

**Why `^`:** nushell prefers builtins for ambiguous names. `^` forces the
external, preventing silent type changes when a builtin and external share
a name.

### Redirection

```nushell
^cmd out> file.txt               # stdout to file (out>> append)
^cmd err> file.txt               # stderr to file
^cmd out+err> file.txt           # stdout + stderr combined
ls | out> file.txt               # save pipeline output
```

**Why `out>` not `>`:** nushell uses named redirection operators to be
explicit about which stream. Bare `>` is not valid. **Bash interop:**
nushell cannot `source` bash scripts — invoke via `^bash -c "..."`.

→ For escaping, Windows specifics, and bash porting, see
`references/externals-io-formats.md#external-commands` and
`references/externals-io-formats.md#bash-interop`.

## 10. File I/O and Data Formats

```nushell
ls                    # current directory (table)
ls *.nu               # glob filter
ls --all              # include hidden files
open data.json        # auto-detects format → structured data
open config.toml      # → record
"hello" | save file.txt        # write text
{a: 1} | save data.json        # write structured (auto-serializes)
"more" | save --append file.txt
cp src dest; mv src dest; rm file; rm -r dir; mkdir dir; touch f
```

**Why `open` auto-detects:** nushell inspects the extension and calls the
matching `from` parser internally. `open x.json` → record; `open x.csv` →
table. No manual `jq`.

### Format conversion

```nushell
# Parse (string → structured): from json, from csv, from yaml, from xml, from toml, from tsv, from nuon
'{"a": 1}' | from json
"a,b\n1,2" | from csv

# Serialize (structured → string): to json, to csv, to yaml, to toml, to nuon, to md, to html
{a: 1} | to json
[[a b]; [1 2]] | to csv
```

**Nuon** is nushell's native serialization format (JSON superset with
comments, durations, filesize literals). Prefer it for nushell-to-nushell
data exchange.

### SQLite

```nushell
open db.sqlite | get tables                              # list table names
open db.sqlite | query db "SELECT * FROM users WHERE age > 18"
stor open                                                 # in-memory database
```

→ For the full format catalog and SQLite, see
`references/externals-io-formats.md#data-formats`.

## 11. HTTP

```nushell
http get $url
http post $url {name: "Alice"} --content-type application/json
http put $url $body
http delete $url
http patch $url $body
http head $url

# Key flags: --headers, --user/--password, --raw, --full, --allow-errors, --max-time, --insecure
http get $url --headers {Authorization: "Bearer token"}
http get $url --full | metadata | get http_response.status  # e.g. 200
```

**Not:** there is no `--content-type` on `http get` (GET has no body). Use
it on `post`/`put`/`patch`. To send JSON, pass a record — nushell serializes.

→ For all verbs, auth, and streaming, see
`references/externals-io-formats.md#http`.

## 12. Error Handling

```nushell
# try/catch — catch receives the error record
try { open maybe-missing.json } catch { |err| print $"Could not read: ($err.msg)"; {} }

# Errors flow through pipelines (no throw/raise)
[1 2 3] | each { if $in == 2 { error make {msg: "no twos"} } else { $in } }  # fails pipeline
```

### Creating errors

```nushell
error make {msg: "something went wrong"}           # simple
error make "oops"                                   # from string
error make {                                        # with labels + help
    msg: "invalid value"
    labels: [{text: "expected positive", span: (metadata $x).span}]
    help: "pass a number > 0"
}
try { error make "foo" } catch { |err| error make {msg: "bar", inner: [$err]} }  # chaining
```

**error_struct:** `msg` (required), `code`, `labels` (table of `{text, span}`),
`help`, `url`, `inner`, `src`. **Why errors are values:** nushell has no
`throw` — errors propagate through pipelines; `try` catches them as records.

→ For error types, chaining, and spans, see
`references/language-types.md#error-handling`.

## 13. Configuration

Three config files under `$nu.default-config-dir`: `env.nu` (env vars,
loaded first, always), `config.nu` (settings + custom commands, interactive
only), `login.nu` (login shells).

```nushell
config nu        # edit config.nu in $EDITOR
config env      # edit env.nu
config reset     # reset to defaults (backs up old files)

$env.MY_VAR = "value"
$env.PATH = ($env.PATH | prepend "/new/path")
```

**Not:** there is no `config get`/`config set`. Query via
`$env.config | to nuon`; set by editing `config.nu` or assigning
`$env.config.field`.

### Hooks

```nushell
$env.config.hooks = {
    pre_prompt: [{ print "before prompt" }]
    env_change: { PWD: [{|before, after| print $"cd: ($before) → ($after)" }] }
    display_output: { $in | table }
}
```

### Aliases

```nushell
alias ll = ls -l              # simple substitution
def gco [...rest] { ^git checkout ...$rest }  # use def for logic/params
```

**Why `def` over `alias`:** aliases cannot have parameters or conditionals.

→ For hooks, keybindings, and aliases, see
`references/scripts-modules-config.md#configuration` and
`references/scripts-modules-config.md#hooks`.

## 14. Debugging and Common Pitfalls

```nushell
view source greet          # see a command's definition
view ir greet              # compiled IR
timeit { expensive-cmd }   # measure time
explain { cmd | pipeline }  # cost analysis
metadata $value           # span, http_response
describe $value           # type
```

**Not:** there is no `profile` command. Use `timeit` for timing, `explain` for cost.

### Common pitfalls

- **`let` vs `mut`:** `let x = 1; $x = 2` errors. Use `mut` for reassignable vars.
- **String vs int:** `"1"` and `1` are not equal. Convert with `into`.
- **String concat:** `"hello" + 5` errors (type mismatch). Use `$"($a)($b)"` or convert with `into string`. (`"a" + "b"` works but `++` is clearer.)
- **`$it` only in `where`:** `each { $it * 2 }` errors. Use `$in` or a named param.
- **Pipeline vs external:** `ls` is the builtin (table); `^ls` is external (string).
- **Config not in scripts:** `nu script.nu` does not load `config.nu`/`env.nu`.
- **No `nth` command:** select via cell paths, `first`/`last`, or `select`; remove via `drop nth N`.
- **No `group` command:** use `chunks N` (batches), `group-by` (values), `window N` (sliding).

## 15. Going Deeper

This body covers the 90% case. For exhaustive reference:

- `references/language-types.md` — Type system, closures, pattern matching,
  control flow, error handling. Read for signatures, custom types, chained errors.
- `references/data-commands.md` — Command catalog with flags, pipeline
  semantics, cell paths. Read for advanced data manipulation, joins, exact flags.
- `references/scripts-modules-config.md` — Custom commands, modules, overlays,
  scripts, config, hooks, aliases, debugging. Read for module libraries or env config.
- `references/externals-io-formats.md` — External commands, file I/O, formats,
  SQLite, HTTP, plugins, bash interop. Read for externals, files, formats, HTTP.

**Verification:** when in doubt about a command's flags, run `help <command>`
in a nushell REPL. The local `nu` binary is the source of truth.