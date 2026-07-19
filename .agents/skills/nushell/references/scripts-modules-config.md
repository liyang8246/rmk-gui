# Scripts, Modules, Configuration, and Debugging

Reference for reusable code in nushell: custom commands, modules, scripts, the
three config files, hooks, aliases, and the debugging toolkit. All examples
verified against nushell 0.114.1 — the local `nu` binary is the source of truth.

**Table of contents**

- [Custom Commands](#custom-commands) — `def`, signatures, `--env`, `--wrapped`, type annotations, subcommands
- [Modules](#modules) — `module`, `export`, `export-env`, `use`, `source`, `overlay use`
- [Scripts](#scripts) — `.nu` files, `def main`, shebang, arg routing, config not loaded
- [Configuration](#configuration) — `env.nu`, `config.nu`, `login.nu`, `$env.config`, keybindings
- [Hooks](#hooks) — `pre_prompt`, `pre_execution`, `env_change`, `display_output`
- [Aliases](#aliases) — `alias`, when to prefer `def`, builtin replacement caveats
- [Debugging](#debugging) — `view source/ir/blocks/files/span`, `timeit`, `explain`, `metadata`, `describe`

→ For types, closures, pattern matching, see `references/language-types.md`.
For the command catalog and pipelines, see `references/data-commands.md`. For
externals, files, and formats, see `references/externals-io-formats.md`.

## Custom Commands

Custom commands are the primary abstraction. Define them with `def`, give them
a typed signature, and they become callable from pipelines or directly. Every
parameter has a type annotation (`: string`, `: int`, `: list<string>`) —
nushell checks types at parse time, so passing the wrong type is a compile
error, not a runtime surprise. Without annotations, parameters are `any` and
errors surface at runtime.

### Full signature

One signature can mix every parameter kind:

```nushell
def cmd [
    x: int                              # required positional
    y?: int                             # optional positional (null if omitted)
    z: int = 10                         # positional with default value
    ...rest                             # rest collects extra positionals as a list
    --verbose                           # boolean flag (true if present)
    --count: int                        # typed flag (requires a value)
    --name: string = "default"          # flag with default value
] {
    $"x=($x) y=($y) z=($z) verbose=($verbose) count=($count) name=($name) rest=($rest)"
}

cmd 5                                  # x=5 y= z=10 verbose=false count= name=default rest=[]
cmd 5 20 30 --verbose --count 3 --name hi a b c
# x=5 y=20 z=30 verbose=true count=3 name=hi rest=[a, b, c]
```

- **Gotcha: optional positionals and `...rest` conflict.** With both `y?: int`
  and `...rest`, the parser fills the optional positional first. Calling
  `cmd 5 --verbose a b c` fails with "expected int" pointing at `a` — the parser
  assigns `a` to `y?: int` before falling back to `...rest`. To skip `y?` and
  still pass rest, provide `y` explicitly (`cmd 5 20 --verbose a b c`) or drop
  `y?` and parse types inside the body. This is a parse-order constraint.
- **Tip: prefer `--flag=value` for typed flags.** Both `--count 3` and
  `--count=3` work, but the `=` form is unambiguous when several typed flags
  share a call.

### `--env` and `--wrapped`

Normal `def` cannot change the caller's environment. `def --env` lifts that
restriction — env modifications inside the body persist after the call returns:

```nushell
def --env gohome [] { cd ~ }
gohome
$env.PWD          # expanded to home directory

def --env set-foo [] { $env.FOO = "bar" }
set-foo
$env.FOO          # "bar" — visible after the call returns
```

Use `--env` sparingly — a command that mutates global state is harder to reason
about than one that returns a value. Reserve it for genuine shell navigation
(`cd` wrappers, PATH manipulation).

`--wrapped` forwards unknown flags to an external command. Without it, unknown
flags trigger parse errors:

```nushell
def --wrapped mygit [...rest] { ^git ...$rest }
mygit --stat            # forwards --stat to git
mygit --stat --oneline  # forwards both
```

`--wrapped` requires `...rest` — the mechanism collects unknown flags and bare
values into the rest parameter as strings, then spreads them into the external
call. Without a rest sink, there is nowhere to put unrecognized tokens.

### Input/output type annotations

Annotate what a command accepts and returns. Multiple signatures (separated by
commas) allow polymorphic dispatch:

```nushell
def double []: int -> int { $in * 2 }
5 | double             # 10

def sq []: int -> int, float -> float { $in * $in }
3 | sq                 # 9
3.5 | sq               # 12.25

def upper []: string -> string { $in | str uppercase }
"hi" | upper           # HI
```

The `[]` empty parameter list is required — type annotations go after it, so
even a command taking no parameters needs `[]` before the `:`. **Not:**
`str upcase` was deprecated in 0.114.0 — use `str uppercase`.

### Subcommand patterns and `main`

Define commands with spaces in the name to fake subcommand dispatch.
Nushell parses `"git status"` as a single command name — this is how it builds
its own subcommand trees (`config nu`, `view source`):

```nushell
def "git status" [] { "running git status" }
def "git commit" [-m: string] { $"committing: ($m)" }

git status             # running git status
git commit -m "test"   # committing: test
```

There is no `def --main` flag. `main` is a command name, not a flag — write
`def main [...] { ... }`. The `--env` and `--wrapped` flags combine with it
normally: `def --env main []`, `def --wrapped main [...rest]`. Writing
`def --main []` is a parse error — nushell treats `--main` as the command name.

→ For how `def main` routes script arguments, see [Scripts](#scripts).

## Modules

Modules group related commands, constants, aliases, and environment setup under
a namespace. They are the unit of reuse.

```nushell
module greetings {
    export def hello [name: string] { $"Hello, ($name)!" }
    export def goodbye [name: string] { $"Bye, ($name)!" }
    export const VERSION = "1.0"
    export alias hi = hello
    export-env { $env.GREETINGS = "loaded" }
}
```

Each `export` marks a symbol as public. Without `export`, a `def` or `const`
is private to the module. `export-env` is special: its body runs at module-load
time and mutates the importer's environment — the idiomatic way for a module to
register env vars it needs.

```nushell
use greetings
greetings hello "world"      # Hello, world!
$greetings.VERSION           # 1.0
greetings hi "aliased"       # Hello, aliased!
$env.GREETINGS               # loaded — export-env ran at use time

use greetings hello          # import only `hello`, call it bare
hello "world"
```

`use greetings` puts every export behind the `greetings` prefix, preventing
collisions with other modules or top-level commands. Import specific symbols
(`use greetings hello`) when you want to call them bare.

### Scope rules

Nushell uses lexical scope. A `def` inside a module body is only visible inside
that module unless `export`ed. A `let` inside a closure is only visible inside
that closure. Closures capture their definition environment, not their call
environment — there is no dynamic scoping. `export-env` runs once, at `use`
time, in the importer's scope; env changes persist after the `use` returns.
Re-running `use` for the same module in the same session is a no-op — to re-run
env setup, restructure it as a callable command and invoke it explicitly.

### `source` vs `use` vs `overlay use`

Assume `lib.nu` contains `def plain-cmd []; export def exported-cmd [];`:

| Mechanism     | Scope effect                                  | When to use                                    |
|---------------|-----------------------------------------------|------------------------------------------------|
| `source`      | Runs file in current scope; defs become local  | Quick one-off scripts; pollutes namespace       |
| `use`         | Imports exports only; namespaced or named     | **Preferred** for libraries and reusable code   |
| `overlay use` | Activates as stackable, hideable overlay      | Plugin-style commands you want to toggle on/off |

```nushell
source lib.nu       # plain-cmd and exported-cmd both available, no namespace
use lib.nu          # only exported-cmd available, namespaced as `lib.nu exported-cmd`
overlay use lib.nu  # exports become global, stackable, hideable
```

Prefer `use` — `source` injects every def into the caller's scope, causing
collisions when multiple files define the same name. `overlay use` is for whole
environments (activating a command set you may want to deactivate later); its
stackable nature is overkill for routine library loading.

```nushell
overlay use greetings        # activate — commands now global
hello "world"                # called without namespace
overlay hide greetings       # deactivate — commands removed from scope
overlay list                 # table of all overlays with active status
overlay new myspace          # create an empty overlay for ad-hoc scoping
```

Overlays stack: activating two modules as overlays makes both sets of commands
available simultaneously; hiding one leaves the other intact.

## Scripts

A nushell script is a `.nu` file containing nushell code. Run it with
`nu script.nu` or mark it executable with a shebang.

```nushell
nu script.nu              # run a script
nu script.nu 42 --flag    # pass arguments
nu -c 'ls | where size > 1mb'   # one-liner inline

#!/usr/bin/env nu
# script.nu — run with: ./script.nu 42 --flag
```

Use `#!/usr/bin/env nu` rather than a hardcoded path — the `env` lookup respects
`PATH`, so the same script works across machines. On Windows, shebangs are not
honored by `cmd`/PowerShell — invoke via `nu script.nu` instead.

### `def main`: the script entry point

When a script defines `def main`, `nu script.nu args` routes `args` to `main`
with full type checking and flag parsing. `main` accepts every signature feature
a normal `def` does — required and optional positionals, defaults, rest, typed
flags, `--env`, `--wrapped`:

```nushell
# script.nu
def main [count: int, --verbose] {
    if $verbose { print "verbose mode" }
    print $"count = ($count)"
}

# $ nu script.nu 5 --verbose
# verbose mode
# count = 5
```

Without `def main`, a script executes its body top-to-bottom. Arguments passed
on the command line are silently ignored — there is no `argc` variable and no
`$env.ARGC`. To access command-line arguments, define `def main` with
parameters. Without an entry point signature, there is no type information to
parse args against; nushell treats the file as a sequence of statements and
ignores the command line.

```nushell
# nomain.nu
print "line 1"
print "line 2"

# $ nu nomain.nu foo bar baz  →  line 1 / line 2 (args silently ignored)
```

### Subcommand patterns in scripts

A script can define `def "main build" []` style subcommands. Calling
`nu script.nu build` routes to `def "main build"` if it exists:

```nushell
# tool.nu
def "main build" [--release] {
    print $"building (if $release { "release" } else { "debug" })"
}
def "main test" [] { print "testing" }
def main [] { print "usage: tool.nu <build|test>" }

# $ nu tool.nu build --release  →  building release
# $ nu tool.nu test             →  testing
# $ nu tool.nu                  →  usage: tool.nu <build|test>
```

### Config is not loaded for scripts

`nu script.nu` does NOT load `env.nu`, `config.nu`, or `login.nu`. The default
`$env.config` record is present (with defaults), but customizations, custom
commands, aliases, or env vars from config files are unavailable. This keeps
scripts deterministic across machines.

```nushell
# checkconfig.nu — run with: nu checkconfig.nu
print $"hooks pre_prompt: ($env.config.hooks.pre_prompt | length)"  # 0
print $"MY_VAR: ($env.MY_VAR?)"   # null even if set in env.nu
```

Config files are machine-specific (PATH entries, editor choices, prompt
customizations). Loading them would make scripts non-portable. To pull
config-dependent behavior into a script, source the relevant file explicitly
with `source ~/.config/nushell/env.nu` (and accept the portability tradeoff).

→ For the three config files, see [Configuration](#configuration).

## Configuration

Nushell reads three config files at startup. Each has a specific role and load
condition. All live under `$nu.default-config-dir` (Windows: `%APPDATA%\nushell`;
Linux/macOS: `~/.config/nushell`).

| File        | Loaded when              | Purpose                                              |
|-------------|--------------------------|------------------------------------------------------|
| `env.nu`    | Always (REPL; scripts must source it) | Env vars (`$env.PATH`, `$env.EDITOR`), loaded first   |
| `config.nu` | Interactive REPL only    | `$env.config` settings, custom commands, aliases     |
| `login.nu`  | Login shells only (`nu --login`) | Login-only setup (ssh, system init)            |

`env.nu` loads first, so `config.nu` can rely on env vars set in `env.nu`.
`config.nu` is NOT loaded for scripts — only interactive sessions. `login.nu`
is for shells started with `nu --login`.

```nushell
$nu.default-config-dir   # path to config directory
$nu.config-path           # full path to config.nu
$nu.env-path              # full path to env.nu
$nu.loginshell-path       # full path to login.nu
```

### `config` subcommands

The complete subcommand list (verified against 0.114.1):

```nushell
config nu           # open config.nu in $EDITOR
config env          # open env.nu in $EDITOR
config reset        # reset to defaults (backs up old files as oldconfig.nu/oldenv.nu)
config flatten      # show $env.config as a flat record of dotted paths → values
config use-colors   # get the current color-output setting (bool)
```

**Not:** there is no `config get`, `config set`, `config path`, `config rm`,
or `config use`. To query a setting, read `$env.config` directly. To set a
setting, assign `$env.config.field = value` (in-session) or edit `config.nu`
(for persistence). Use `to nuon` (not `to json`) for config dumps — nuon is
nushell's native format and preserves types (durations, file sizes, enums) that
JSON would flatten to strings.

```nushell
$env.config.table.mode                # query a single setting
$env.config | to nuon                 # dump the full config as nuon
$env.config.table.mode = "compact"    # modify in-session
$env.config.show_banner = false
```

### Keybindings

Keybindings live in `$env.config.keybindings`, a list of records. The default
is an empty list — nushell relies on built-in defaults unless you add your own:

```nushell
$env.config.keybindings = ($env.config.keybindings | append {
    name: "insert_hello"
    modifier: control        # control, shift, alt, none
    keycode: char_g          # see `keybindings list --keycodes` for all codes
    mode: [emacs]            # emacs, vi_insert, vi_normal (list allowed)
    event: { send: EditCommand, EditCommand: InsertString, value: "hello" }
})

keybindings list --modifiers    # valid modifier values
keybindings list --keycodes     # valid keycode values
keybindings list --modes        # emacs, vi_insert, vi_normal
keybindings list --edits -d     # edit commands (InsertString, Backspace, ...)
keybindings default              # 145 default keybindings (read-only)
```

Keybindings is a list (not a record) because a single key can map to different
events in different modes (`emacs` vs `vi_insert`). A list of records lets each
binding specify its own `mode` field independently.

## Hooks

Hooks are closures nushell runs in response to shell events. Configure them in
`$env.config.hooks`, a record with five keys:

| Hook              | Fires when                                      | Closure input                         |
|-------------------|-------------------------------------------------|---------------------------------------|
| `pre_prompt`      | Before each prompt is drawn                     | none                                  |
| `pre_execution`   | Before each command line runs                   | none                                  |
| `env_change`      | When a watched env var changes value            | `\|before, after\|` — old and new     |
| `display_output`  | Before pipeline output is rendered              | `$in` — the value to display          |
| `command_not_found` | When an unknown command is typed              | `$in` — the command name              |

Each value is a list of closures (except `display_output`, which is a single
closure or string, and `command_not_found`, which may be null). nushell runs
every closure in the list, in order.

```nushell
$env.config.hooks = {
    pre_prompt: [{ print "before prompt" }]
    pre_execution: [{ print "before exec" }]
    env_change: {
        PWD: [{|before, after| print $"cd: ($before) -> ($after)" }]
    }
    display_output: { $in | table }
    command_not_found: {|cmd| print $"not found: ($cmd)" }
}
```

`env_change` is a record keyed by env var name — each value is a list of
closures receiving `before` and `after`. It is keyed by var name because
watching every env var would be expensive; naming specific vars (`PWD`,
`VIRTUAL_ENV`) lets nushell only check the ones you care about. The `PWD` hook
is common for updating the prompt.

```nushell
$env.config.hooks.env_change = {
    MY_VAR: [{|before, after| print $"MY_VAR: ($before) -> ($after)" }]
}

# In the REPL:
$env.MY_VAR = "first"    # prints "MY_VAR: null -> first"
$env.MY_VAR = "second"   # prints "MY_VAR: first -> second"
```

`display_output` runs on the final value of a pipeline before nushell renders
it. The default conditionally uses `table -e` (expanded) when the terminal is
wide enough:

```nushell
$env.config.hooks.display_output
# "if (term size).columns >= 100 { table -e } else { table }"
$env.config.hooks.display_output = { $in | table --abbreviated 5 }
```

- **Why hooks only fire in interactive mode:** `pre_prompt` and
  `pre_execution` are REPL events — scripts have no prompt and no command line
  to pre-run. `env_change` also requires the interactive event loop. Setting
  hooks in a script is harmless (no error), but the closures will not run. Test
  hooks in the REPL, not via `nu -c`.

## Aliases

An alias is a simple textual substitution — nushell replaces the alias name
with its expansion at parse time, then re-parses the result. Substitution
happens before any execution, so an alias can introduce flags or a command
name. The tradeoff is that aliases cannot depend on runtime values or arguments
— they expand to a fixed string.

```nushell
alias ll = ls --long      # call becomes `ls --long`
alias gco = git checkout  # call becomes `git checkout`

ll                       # runs `ls --long`
gco main                 # runs `git checkout main`
```

### When to use `def` instead

Aliases cannot take parameters, run conditionals, or define closures. For
anything beyond substitution, use `def`:

```nushell
# BAD — alias cannot take a parameter:
alias greet = print "Hello, $1"   # $1 is not a thing in nushell

# GOOD — def takes real parameters:
def greet [name: string] { print $"Hello, ($name)!" }

# BAD — alias cannot branch at call time:
alias gco = if $env.BRANCH == "main" { git checkout main } else { git status }

# GOOD — def evaluates at call time:
def gco [] {
    if (git branch --show-current | str trim) == "main" {
        git checkout main
    } else { git status }
}
```

Use `alias` for shortening a fixed command + flags (`ll = ls --long`). Use
`def` for anything with parameters, logic, or closures.

### Replacing builtins: caveats

Defining a `def` with the same name as a builtin shadows the builtin. But
aliasing the original builtin for use inside the new def does NOT work —
aliases expand to whatever the name resolves to *at the call site*, which
(after redefinition) is the custom def:

```nushell
# BROKEN — ls-builtin expands to the custom ls, not the original
alias ls-builtin = ls
def ls [...args] { ls-builtin --long ...$args }   # parse error: --long unknown
```

The parser checks `--long` against the *current* `ls` definition (the custom
one), which does not declare it. Nushell resolves an alias when the calling
code is parsed, not when the alias is defined — by the time the custom `ls`
body is parsed, `ls-builtin` already means the new `ls`. Workarounds:

1. **Define a new command name** (recommended):
   `def la [...args] { ls --all --long ...$args }`
2. **Use `--wrapped`** to forward unknown flags into `...rest`:
   `def --wrapped ls [...rest] { ^ls ...$rest }`
3. **Use `^` to call the external binary** — only works if a real external
   exists (`ls` on Unix), not for nushell builtins with no external counterpart.

Overlays are the only way to scope a redefinition without losing the original.

## Debugging

Nushell ships a toolkit for inspecting definitions, compiled IR, performance,
and value metadata.

### `view source` and `view ir`

```nushell
def greet [name: string] { $"Hello, ($name)!" }
view source greet
# def greet [ name: string ] { $"Hello, ($name)!" }

view ir greet
# # 2 registers, 6 instructions, 8 bytes of data
#    0: load-literal           %0, string("Hello, ")
#    1: load-variable          %1, var 84
#    2: string-append          %0, %1
#    3: load-literal           %1, string("!")
#    4: string-append          %0, %1
#    5: return                 %0
```

`view source` works on any custom command, module, or block — use it to confirm
what a command actually contains after imports and re-definitions. `view ir`
takes a command name (not a string) and shows the compiled IR — register
allocations, instruction sequence, data layout. Use it to understand exactly
what nushell will execute for performance-sensitive code.

`view blocks` lists every block registered in the engine state; `view files`
lists every source file nushell has parsed. `view span $start $end` maps byte
offsets back to source text — combine it with `metadata` to see where a value
came from:

```nushell
let m = (metadata "hello")
view span $m.span.start $m.span.end    # "hello"
```

### `timeit` and `explain`

```nushell
timeit { sleep 10ms }              # 10ms 514µs 600ns
let t = (timeit { [1 2 3] | each { $in * 2 } })
$t | describe                      # duration

explain { [1 2 3] | each { $in * 2 } | length }
# Returns a table: cmd_index, cmd_name, type, cmd_args, span_start, span_end
```

`timeit` returns a `duration` value — capture it with `let` to compare
implementations. `explain` walks a pipeline and reports each stage's command
name, type, arguments, and source span — use it to see how nushell decomposes a
complex pipeline before execution.

### `metadata` and `describe`

```nushell
"hello" | metadata
# {span: {start: 163904, end: 163911}}

http get https://example.com | metadata
# {http_response: {...}, span: {...}}

5 | describe           # int
[1 2 3] | describe     # list<int>
{a: 1} | describe      # record<a: int>
null | describe        # nothing
```

Every value can carry metadata about where it came from. `metadata` returns a
record with `span` (source byte range) and, for HTTP responses, `http_response`
(status, headers). `describe` returns the type name — for records and lists it
includes element types. Use it to confirm what a pipeline actually produces,
especially when a command's signature uses `any`.

### What does NOT exist

- **Not:** there is no `profile` command. Use `timeit` for timing and `explain`
  for cost analysis. The historical `profile` was removed; the modern
  equivalents cover its use cases.
- **Not:** there is no `view config` subcommand. The `view` family is
  `view blocks`, `view files`, `view ir`, `view source`, `view span`. To inspect
  config, use `$env.config | to nuon` or `config flatten`.

→ For error handling (try/catch, `error make`, spans, chaining), see
`references/language-types.md#error-handling`. For inspecting data values and
types beyond `describe`, see `references/data-commands.md`.
