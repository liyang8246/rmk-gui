# Externals, File I/O, Formats, HTTP, Plugins, Bash Interop

This reference covers the boundary between nushell's structured-data world and
the outside: external commands, file I/O, data formats, HTTP, SQLite, plugins,
and bash porting. All examples were verified against nushell 0.114.1 — where a
command or flag is marked as not existing, that was confirmed by running it.

## Table of Contents

- [External Commands](#external-commands) — `^` prefix, `run-external`, args, escaping, Windows
- [File I/O](#file-io) — `open`, `save`, `ls`, `cp`, `mv`, `rm`, `mkdir`, `touch`, `du`, `watch`
- [Data Formats](#data-formats) — `from`/`to` families, NUON, auto-detection, SQLite, `stor`
- [HTTP](#http) — verbs, flags, auth, response metadata
- [Plugins](#plugins) — `plugin add`/`use`/`list`/`rm`/`stop`, protocol, polars
- [Bash Interop](#bash-interop) — invoking bash, porting table, redirection differences

→ For the 90% case, see `SKILL.md` sections 9–11. → For pipeline semantics,
see `references/data-commands.md`. For closures/errors, see
`references/language-types.md`.

## External Commands

Nushell prefers builtins when a name is ambiguous — `ls`, `cd`, `cp`, `mv`,
`rm`, `mkdir`, `touch`, `du`, `echo`, `date` all exist as builtins that emit
structured data. Prefix with `^` to force the external program on `PATH`:

```nushell
ls                  # builtin — table with name/type/size/modified
^ls                 # external /bin/ls — string
^git status         # external (no builtin clash; ^ is harmless and explicit)
echo "hi"           # builtin echo — string "hi"
```

**Why `^`:** without it, nushell silently dispatches to the builtin on name
clash. A bash script that expected `ls` text output gets a table instead, and
downstream text processing breaks. The `^` makes intent explicit and prevents
silent type changes.

**Not:** `^` is only needed when a builtin shadows an external. For
commands with no builtin equivalent (`git`, `curl`, `docker`), `^` is optional
but legal.

### `run-external` (programmatic form)

`run-external` is the built-in that `^cmd` desugars into. Use it when the
command name is computed at runtime:

```nushell
let cmd = "echo"
run-external $cmd "hello" "world"          # → hello world

let tool = if $verbose { "rg" } else { "grep" }
run-external $tool "--color=always" $pattern $file
```

**Why `run-external`:** `^$cmd` does not work — the parser requires a literal
command name after `^`. For a dynamically-named program, you must use
`run-external $cmd ...args`. It takes `...command` (first item is the program,
rest are arguments) and accepts pipeline input (`any -> any`).

### Argument passing

Variables and interpolations expand before the external sees them:

```nushell
let name = "world"
^echo $"hello, ($name)"          # → hello, world
^git commit -m $"fix: ($issue)"
^curl $"https://example.com/($path)" --output out.bin
^git log --oneline --max-count=10        # --max-count=10 stays joined
```

**Gotcha:** nushell parses `--flag=value` as one string argument; it does not
split on `=`. If a flag value starts with `-`, terminate flag parsing with `--`
or quote it.

### Quoting and escaping

Single-quoted strings are literal — backslashes and `\n` pass through
unchanged. Double-quoted strings interpret escapes (`\n`, `\t`, `\"`, `\\`) and
interpolation `$()`. This matters most on Windows where paths contain
backslashes.

```nushell
print "hello world"              # one value: hello world
print 'literal\nstring'          # one value: literal\nstring (single quotes = literal)
print "interp\nstring"           # two lines: interp / string (double quotes process \n)
print "*.txt"                    # literal *.txt (quoted, no glob expansion)
ls *.txt                         # multiple files (glob expanded)
```

### Windows specifics

Windows paths contain backslashes, which collide with double-quote escape
processing. Use single-quoted strings so backslashes are preserved literally:

```nushell
# CORRECT — single quotes preserve backslashes literally
let app = 'C:\Program Files\MyApp\app.exe'
run-external $app "--flag" "value"

# CORRECT — double quotes require escaped backslashes
let app2 = "C:\\Program Files\\MyApp\\app.exe"

# WRONG — \P is an invalid escape sequence, parse error
# let app3 = "C:\Program Files\MyApp\app.exe"
```

**Gotcha:** `^'C:\Program Files\app.exe'` does NOT work — `^` requires a bare
command name, not a quoted string. For paths with spaces or computed names, use
`run-external 'C:\path\app.exe' args`.

**Tip:** prefer forward slashes in paths when the external accepts them
(`C:/Program Files/app.exe`) — forward slashes don't trigger escape processing
in double-quoted strings.

### Stream redirection

Nushell uses named redirection operators, not bash's `>`, `2>`, `&>`:

```nushell
^cmd out> file.txt              # stdout → file (overwrite)
^cmd out>> file.txt             # stdout → file (append)
^cmd err> file.txt              # stderr → file
^cmd out+err> file.txt          # combined stdout+stderr → file
ls | out> listing.txt           # pipeline output → file (builtins too)
^cmd e>| split chars            # pipe stderr (not stdout) into next command
```

**Why named operators:** bare `>` is not valid redirection — it gets passed as
a literal argument (`^echo hello > file` prints `hello > file`). Attempting
`2>&1` produces an error pointing you to `out+err>`. The named form also works
on builtins, not just externals.

→ For streams and pipeline internals, see
`references/data-commands.md#pipeline-semantics`.

## File I/O

### `open` — read with auto-detection

`open` inspects the file extension and calls the matching `from` parser
automatically. No `jq`, `yq`, or `csvtool` needed:

```nushell
open package.json          # → record (JSON parsed)
open config.toml           # → record (TOML parsed)
open data.csv              # → table (CSV parsed)
open users.yaml            # → record/list (YAML parsed)
open db.sqlite | query db "SELECT * FROM users"   # SQLite query result
open image.png             # → binary (no parser matches; raw bytes)
open file.txt              # → string
open data.nuon             # → structured (preserves nushell types)
```

Use `--raw` (`-r`) to skip parsing and get raw bytes:

```nushell
open data.json --raw                    # → binary (no JSON parsing)
open file.txt --raw | decode utf-8      # explicit decoding
'myfile.txt' | open                     # filename from pipeline
open *.json                             # opens each match, returns a list
```

**Why auto-detection matters:** it eliminates an entire class of bugs where
bash scripts pipe `cat` into `jq` and rely on `jq`'s exit code. `open` either
returns structured data or errors — no silent text fallback for known
extensions.

### `save` — write with auto-serialization

`save` is the inverse of `open`: it inspects the destination extension and
serializes structured input accordingly:

```nushell
"hello" | save note.txt              # text → .txt
{a: 1, b: 2} | save data.json       # record → JSON
[[x y]; [1 2] [3 4]] | save t.csv   # table → CSV
{a: 1} | save config.nuon           # record → NUON
"more" | save --append note.txt     # -a: append instead of overwrite
{x: 1} | save --force out.json      # -f: overwrite existing without prompt
"raw" | save --raw blob.bin         # -r: write as raw binary (no serialization)
```

**Why `--force`:** without it, `save` errors if the destination exists, to
prevent accidental overwrites. Use `-f` when you intend to replace.

**Gotcha:** `save` serializes based on extension. `{a: 1} | save data.txt`
writes the record's string representation, not JSON — `.txt` has no structured
serializer. Match the extension to the format you want.

### `ls` — list directory contents

Returns a table with `name`, `type`, `size`, `modified`. Accepts globs and
several flags:

```nushell
ls                       # current directory (visible files only)
ls *.nu                  # glob filter
ls --all                 # -a: include hidden files
ls --long                # -l: all platform-dependent columns (target, readonly, created, accessed)
ls --short-names         # -s: bare file names, no path prefix
ls --full-paths          # -f: absolute paths
ls --directory src       # -D: list the directory entry itself, not its contents
ls --du                  # -d: apparent directory size (recursive)
ls --mime-type           # -m: MIME type in type column instead of "file"/"dir"
```

Combine freely: `ls --all --long *.nu`.

**Why `ls` returns a table:** every downstream command can filter, sort, and
transform the result without text parsing:
`ls | where size > 10mb | sort-by modified --reverse | get name`. The external
`^ls` returns a string and would need `split row "\n"` first.

### `cp`, `mv`, `rm`

These builtins wrap `uutils/coreutils` (a Rust reimplementation of GNU
coreutils), so behavior matches the familiar Unix tools:

```nushell
cp src.txt dest.txt              # copy a file
cp -r dir_a dir_b                # -r: copy directories recursively
cp -u src dest                   # -u: only if source is newer
cp -n src dest                   # -n: do not overwrite (no-clobber)
cp --preserve [mode timestamps] src dest

mv before.txt after.txt          # rename
mv file.txt subdir/              # move into directory
mv -v before.txt after.txt       # -v: print what was done (returns a table)
mv -n src dest                   # do not overwrite

rm file.txt                      # delete a file
rm -r dir                        # -r: delete directory recursively
rm -f missing                    # -f: suppress "no such file" error
rm --trash file                  # -t: move to OS trash instead of permanent delete
rm -i file                       # -i: prompt before each delete
rm -I dir                        # -I: prompt once before recursive delete
```

**Why `rm --trash` exists:** nushell integrates with the platform trash
(recycle bin on Windows, Trash on freedesktop Linux/macOS). Prefer `--trash`
for interactive use; use permanent `rm` only in scripts where you intend
destruction. The `always_trash` config option flips the default; use
`--permanent` (`-p`) to force permanent deletion when it's on.

### `mkdir`, `touch`, `rmdir`

```nushell
mkdir newdir                     # create one directory
mkdir -v a/b/c                   # create intermediates (default!) and print each
mkdir parent child1 child2       # multiple at once
touch file.txt                   # create empty file (or update timestamps)
touch a b c                      # create multiple
touch -m file.txt                # only update modification time
touch -d "yesterday" file.txt    # set specific time
```

**Why `mkdir` has no `-p` flag:** nushell creates intermediate directories by
default — that is the safe, expected behavior, so the flag is unnecessary.
`mkdir -p a/b/c` is a parse error (`unknown flag -p`); just use `mkdir a/b/c`.

**Not:** there is no `rmdir` command in nushell (neither builtin nor known
external). To remove an empty directory use `rm dir`; for a non-empty directory
use `rm -r dir`. Verified against 0.114.1.

### `du` — disk usage

```nushell
du                               # current directory
du --max-depth 1                 # -d: limit recursion depth
du --min-size 1mb                # -m: exclude files smaller than threshold
du --long                        # -l: include underlying files per entry
du --exclude *.log               # -x: exclude matching files
du --deref                       # -r: follow symlinks
```

### `watch` — filesystem events

Monitors a path and either runs a closure on each change or streams events
(when called without a closure):

```nushell
# Stream events (preferred)
for event in (watch . --glob=**/*.rs) { ^cargo test }

# Filter and process via pipeline
watch ./src
  | where operation == Create
  | first 5
  | each {|e| $"New file: ($e.path)" }
  | save --append changes.log

# Closure form (deprecated) — receives operation, path, new_path
watch . --debounce 5min {|| print "changed" }
```

Flags: `--debounce <duration>` (default 100ms), `--glob <pattern>`,
`--recursive <bool>` (default true), `--quiet`, `--verbose`. Event records have
`operation` (`Create`/`Remove`/`Rename`/`Modify`), `path`, and `new_path`
(rename only).

**Why `--debounce`:** many editors write a file in multiple flushes, producing
several `Modify` events for one logical save. Debounce collapses them.

→ For directory navigation (`cd`, `pwd`), see
`references/scripts-modules-config.md`.

## Data Formats

Nushell ships `from` parsers (string/binary → structured) and `to` serializers
(structured → string). `open` and `save` invoke these automatically based on
file extension; you can also call them directly.

### `from` — parsers

| Command | Input | Output | Key flags |
|---------|-------|--------|-----------|
| `from json` | string | any | `-o/--objects` (NDJSON), `-s/--strict` |
| `from yaml` | string | record/list | |
| `from csv` | string | table | `-s/--separator`, `-n/--noheaders`, `--no-infer`, `-t/--trim`, `--flexible`, `-q/--quote`, `-e/--escape`, `-c/--comment` |
| `from tsv` | string | table | same as CSV minus separator |
| `from toml` | string | record | TOML 1.0 |
| `from nuon` | string | any | nushell native format (see below) |
| `from xml` | string | record | produces `{tag, attrs, content}` records |
| `from ssv` | string | table | space-separated (min 2 spaces) |
| `from ods` | binary | table | OpenDocument Spreadsheet |
| `from xlsx` | binary | table | Excel `.xlsx` |

```nushell
'{"a": 1, "b": [2, 3]}' | from json              # → {a: 1, b: [2, 3]}
"name,age\nAlice,30\nBob,25" | from csv          # → table (\n = newline in double-quoted strings)
"name\tage\nAlice\t30" | from tsv                # tab-separated (\t = tab)
'[1, 2, 3]' | from json                          # → list
'{a: 1, b: 5sec}' | from nuon                    # → record with duration preserved
```

**Tip:** use `from json --objects` for NDJSON / JSONL files (one JSON object
per line) — it returns a stream of records instead of failing on the non-array
format.

**Gotcha:** CSV/TSV parsing infers column types by default (a column of digits
becomes `int`). Pass `--no-infer` to keep everything as strings when leading
zeros or non-numeric IDs matter (zip codes, phone numbers).

### `to` — serializers

| Command | Input | Output | Key flags |
|---------|-------|--------|-----------|
| `to json` | any | string | `-r/--raw` (compact), `-i/--indent N`, `-t/--tabs N`, `-s/--serialize` |
| `to yaml` | any | string | `-s/--serialize` |
| `to csv` | table | string | `-s/--separator`, `-n/--noheaders`, `--columns` |
| `to tsv` | table | string | tab-separated |
| `to toml` | record | string | records only (not lists/tables) |
| `to nuon` | any | string | nushell native format |
| `to md` | table | string | `-p/--pretty`, `-e/--per-element`, `-c/--center` |
| `to html` | table | string | theming/color flags |

```nushell
{a: 1, b: [2 3]} | to json --raw                 # {"a":1,"b":[2,3]}
[[name age]; [Alice 30]] | to csv                # "name,age\nAlice,30\n"
[[name age]; [Alice 30]] | to md                 # Markdown table
{db: {host: "localhost", port: 5432}} | to toml  # TOML (record only)
{a: 1, b: 5sec, c: 10mb} | to nuon               # preserves nushell types
```

**Why `to toml` only takes records:** TOML has no top-level list or table
representation — a TOML document is always a key/value mapping. Convert a list
of records to a record keyed by an identifier first, or use a different format.

### NUON — Nushell Object Notation

NUON is nushell's native serialization format. It is a superset of JSON: every
valid JSON document is valid NUON, but NUON additionally supports nushell's
richer type literals — durations, file sizes, dates, binaries, and comments.

```nushell
# Round-trip preserves nushell types that JSON would lose
{a: 1, b: 5sec, c: 10mb, d: 0x[01 02 ff], e: 2024-01-15} | to nuon | from nuon
# → {a: 1, b: 5sec, c: 10.0 MB, d: 0x[01 02 ff], e: 2024-01-15}
```

NUON features: comments with `#` (full-line and trailing); duration literals
(`5sec`, `2min`, `1hr`); filesize literals (`10mb`, `2gb`); date literals
(`2024-01-15`); binary literals (`0x[de ad be ef]`); ranges (`1..10`,
`1..<10`); records, lists, tables in nushell syntax.

**Why prefer NUON for nushell-to-nushell data:** JSON loses durations (become
strings or numbers), file sizes (become numbers), and binaries (become base64
or arrays). NUON preserves them exactly. Use JSON when interoperating with
other tools; use NUON for config files, caches, and data exchange between
nushell scripts.

**Gotcha:** NUON is not a stable interchange format across nushell versions —
internal representations can change. Do not use it for long-term storage or
communication with non-nushell programs. Use JSON or YAML for those.

### `open` auto-detection by extension

`open` maps file extensions to parsers. The mapping is extensible: any `from
xyz` command in scope teaches `open` to parse `.xyz` files. Verified mappings:

| Extension | Parser | Result |
|-----------|--------|--------|
| `.json` | `from json` | record/list/any |
| `.yaml`, `.yml` | `from yaml` | record/list |
| `.csv` | `from csv` | table |
| `.tsv` | `from tsv` | table |
| `.toml` | `from toml` | record |
| `.nuon` | `from nuon` | any |
| `.xml` | `from xml` | record |
| `.xlsx` | `from xlsx` | table |
| `.ods` | `from ods` | table |
| `.sqlite`, `.db` | SQLite header detection | SQLiteDatabase value |
| `.txt` | (none) | string |
| other | (none) | binary |

Override detection with `open --raw` and parse manually:

```nushell
open data.json --raw | from json --strict              # force strict parsing
open log.txt | from csv --separator "|" --noheaders    # parse .txt as pipe-delimited
```

### SQLite

Nushell reads SQLite database files directly. `open` detects the SQLite header
and returns a `SQLiteDatabase` value that `query db` consumes:

```nushell
open db.sqlite | query db "SELECT * FROM users WHERE age > 18"
open db.sqlite | query db "SELECT COUNT(*) FROM orders" --params [2024]
```

`query db` takes a SQL string and an optional `--params` (`-p`) list for bound
parameters (use `?` placeholders). Only local files and in-memory databases are
supported — no network connections.

**Not:** there is no `from sqlite` parser. SQLite access goes through `open`
(header detection) + `query db`, not the `from` family.

### `stor` — in-memory SQLite

`stor` commands work with an ephemeral in-memory SQLite database that lives for
the duration of the nushell process. Useful for ad-hoc SQL on pipeline data
without writing a file:

```nushell
stor reset                                    # clear all in-memory tables
stor create --table-name users --columns {id: int, name: str, active: bool}
stor insert --table-name users --data-record {id: 1, name: "Alice", active: true}
stor insert --table-name users --data-record {id: 2, name: "Bob", active: false}
stor open | query db "SELECT name FROM users WHERE active"   # → [{name: Alice}]
stor export --file-name snapshot.sqlite       # write in-memory db to a file
stor import --file-name snapshot.sqlite       # load a file into in-memory db
stor update --table-name users --columns {active: false} --where-clause "id = 1"
stor delete --table-name users --where-clause "id = 2"
```

**Why `stor`:** the column types are restricted to SQLite primitives: `int`,
`float`, `str`, `bool`, `datetime`, `json`, `jsonb`. Other type names (like
`text`) are rejected. This is a SQLite constraint, not a nushell one.

Subcommands (verified): `stor create`, `stor delete`, `stor export`, `stor
import`, `stor insert`, `stor open`, `stor reset`, `stor update`. There is no
`stor create-db` — use `stor create --table-name`.

→ For large datasets via the `polars` dataframe plugin, see [Plugins](#plugins).

## HTTP

Nushell's `http` family handles HTTP requests. All verbs accept pipeline input
as the request body (where applicable) and return structured data by default
(JSON responses become records/lists; other content types may return strings).

### Verbs

```nushell
http get $url                          # GET (no body)
http post $url {name: "Alice"} --content-type application/json
http put $url $body                    # PUT with body
http patch $url $changes               # PATCH with body
http delete $url                       # DELETE (no body by default)
http delete $url $body --content-type application/json  # DELETE with body
http head $url                         # HEAD (headers only)
```

**Why body verbs vary:** `http get` and `http head` have no request body (HTTP
semantics), so they have no `--content-type` flag. `http post`, `put`, `patch`,
and `delete` can send a body and therefore accept `--content-type` (`-t`).

### Flags (verified for `http get`)

All HTTP verbs share these flags (verified against 0.114.1):

| Flag | Long form | Purpose |
|------|-----------|---------|
| `-u` | `--user <any>` | username for basic auth |
| `-p` | `--password <any>` | password for basic auth |
| `-m` | `--max-time <duration>` | timeout (a duration like `30sec`) |
| `-H` | `--headers <any>` | custom headers (record or list) |
| `-r` | `--raw` | return response as raw string, no parsing |
| `-k` | `--insecure` | allow invalid TLS certificates |
| `-f` | `--full` | return full response (status, headers, body) |
| `-e` | `--allow-errors` | do not fail on 4xx/5xx responses |
| `--pool` | (no short) | use a global connection pool |
| `-R` | `--redirect-mode <string>` | `follow` (default), `manual`, or `error` |
| `-U` | `--unix-socket <path>` | connect via Unix domain socket |

`http post`/`put`/`patch`/`delete` additionally have `-t`/`--content-type`.
`http head` has no `--raw` (it already returns only headers) but does have
`--full`.

**Not:** there is no `--timeout` flag (use `--max-time`), no `--output` flag
(pipe to `save`), no `--types`, no `--custom-auth`. The `--max-time` value is a
nushell duration (`30sec`, `2min`), not a bare number of seconds.

### Custom headers

`--headers` accepts a record (single value per header) or a list (alternating
key/value pairs, allowing multiple values per header):

```nushell
# Record form — one value per header
http get $url --headers {
    Authorization: "Bearer mytoken"
    X-Request-Id: "abc123"
}

# List form — allows repeated headers
http get $url --headers [Accept "application/json" Accept "text/plain"]
```

### Authentication

```nushell
# Basic auth via dedicated flags (nushell handles base64 encoding)
http get $url --user myuser --password mypass

# Token auth via headers (more flexible)
http get $url --headers {Authorization: $"Bearer ($token)"}
```

**Why prefer `--user`/`--password` for basic auth:** nushell constructs the
`Authorization: Basic ...` header and handles base64 for you. Manually
base64-encoding credentials is error-prone.

### Response metadata

The response carries metadata accessible via `metadata`. The most useful field
is `http_response.status`:

```nushell
# Get the HTTP status code
http get $url --full | metadata | get http_response.status    # e.g. 200

# Check status while streaming (don't fail on errors)
http get --allow-errors $url | metadata access {|m|
    if $m.http_response.status != 200 { error make {msg: "request failed"} } else { }
}

# Full response with status, headers, and body
http get $url --full   # → {headers: ..., body: ..., status: ...}
```

`--full` returns a record with `headers`, `body`, and `status` instead of just
the body. `--allow-errors` (`-e`) prevents nushell from turning 4xx/5xx
responses into errors, so you can inspect them. Combine with `metadata access`
to branch on status.

### Sending JSON

Pass a record as the body — nushell serializes it:

```nushell
http post $url {name: "Alice", age: 30} --content-type application/json

let payload = {user: $id, action: "login"}
http post $url $payload --content-type application/json

# Pipeline form — body comes from the previous command
{a: 1} | http post $url --content-type application/json
```

**Gotcha:** because HTTP verbs accept pipeline input as the body, chaining
`http put $url $body | http delete $url2` would send the PUT response as the
DELETE body — almost never what you want. Use separate statements (semicolons
or new lines), not pipes, for independent requests.

→ For closures used as request transformers and streaming, see
`references/language-types.md#closures`.

## Plugins

Plugins are external executables that register additional commands with
nushell at startup. They let you extend nushell with formats, data sources, or
performance-critical operations written in any language (usually Rust).

### Plugin lifecycle

```nushell
# Register a plugin binary with the plugin registry file
plugin add nu_plugin_polars            # registers all commands the plugin exposes

# Load a registered plugin into the current scope (parser keyword)
plugin use polars                      # now polars commands are available

# List loaded and installed plugins
plugin list                            # → table of name, version, commands, is_running

# Remove a plugin from the registry file
plugin rm polars

# Stop a running plugin process (frees its memory)
plugin stop polars
```

**Why `plugin add` then `plugin use`:** `plugin add` runs the plugin executable
once to discover its command signatures and writes them to a registry file.
`plugin use` loads those signatures into scope so the commands can be called.
This split lets you register plugins in a REPL and persist them, then reference
them from scripts without re-running discovery.

**Not:** there is no `plugin run` command. Plugins expose commands that you
call directly (e.g. `polars into-df`), not via `plugin run`. The plugin
subcommands are exactly: `plugin add`, `plugin list`, `plugin rm`, `plugin
stop`, `plugin use`.

### Plugin protocol

A plugin is an executable that communicates with nushell over stdin/stdout
using a framed protocol. The protocol carries: a `Hello` handshake (protocol
version, features); `Call` messages invoking registered commands; `Stream`
messages carrying pipeline data in chunks; `Response`/`Signal` messages
returning results. The encoding is JSON by default, or MessagePack if the
plugin advertises support (more efficient for binary data). Nushell launches the
plugin process on first use and keeps it alive for subsequent calls (a "plugin
GC" reaps idle processes after a configurable timeout).

### When to use plugins

Write a plugin when:

- **A custom data format** needs first-class `open` integration. A plugin
  providing `from myformat` teaches `open` to parse `.myformat` files
  automatically.
- **Performance-critical operations** on large datasets benefit from a compiled
  implementation. The `polars` plugin provides a DataFrame API backed by Apache
  Arrow + Polars Rust crates — orders of magnitude faster than nushell's
  row-by-row `each` for millions of rows.
- **Binding to a system library** (database drivers, image processing, native
  compression) requires FFI. A plugin keeps the binding isolated from
  nushell's core.

For one-off scripts or small data, prefer built-in commands and custom `def`s —
the plugin overhead is not worth it.

### The `polars` plugin

`polars` is the flagship plugin for DataFrame operations. It exposes a `polars`
namespace with commands like `polars into-df`, `polars select`, `polars
filter`, `polars group-by`, `polars join`, and `polars collect`:

```nushell
plugin use polars

# Load a CSV into a lazy DataFrame and filter
open data.csv | polars into-df | polars filter (polars col age) > 18 | polars collect

# Group-by aggregation
open sales.csv | polars into-df
  | polars group-by region
  | polars agg [(polars col revenue | polars sum)]
  | polars collect
```

**Why polars over built-in `group-by`:** nushell's built-in `group-by` operates
on in-memory lists/tables, materializing every row. Polars uses lazy evaluation
and columnar storage, so a filter+aggregation on 10M rows completes in
milliseconds instead of seconds. For datasets under ~100K rows, the built-in
commands are usually fast enough and simpler.

→ For built-in grouping (`group-by`, `chunks`, `window`, `sort-by`), see
`references/data-commands.md#grouping-and-sorting`.

## Bash Interop

Nushell is not a POSIX shell and cannot `source` bash scripts (different
syntax, different scoping, different everything). You can invoke bash as an
external command and capture its output, but you cannot import bash functions,
aliases, or variables into nushell scope.

### Invoking bash

```nushell
# Run a bash command and capture stdout as a string
let out = ^bash -c "echo hello; echo world"
print $out

# Pass variables as positional arguments (safer than interpolation)
let name = "world"
^bash -c "echo \"hello, $1\"" -- $name
```

**Why arguments beat interpolation:** building a bash command string by
interpolating nushell variables invites shell injection — a value containing
`;` or `$(...)` would be executed by bash. Pass values as positional arguments
and read them inside bash as `$1`, `$2`, etc.:

```nushell
let user_input = "some; rm -rf / value"   # hostile input
# WRONG — interpolation lets bash execute the injected command:
# ^bash -c $"echo ($user_input)"
# RIGHT — pass as argument, bash reads it literally:
^bash -c "echo \"$1\"" -- $user_input
```

### Porting bash patterns

| Bash | Nushell | Notes |
|------|---------|-------|
| `for x in a b c; do ...; done` | `for $x in [a b c] { ... }` | nushell `for` takes a list |
| `$(cmd)` / `` `cmd` `` | `(^cmd)` | command substitution via subexpression |
| `VAR=value` | `let VAR = "value"` | requires `let` and spaced `=` |
| `$VAR` | `$env.VAR` (env) / `$var` (local) | env vars live in `$env` |
| `if [ "$a" = "$b" ]; then ...; fi` | `if $a == $b { ... }` | `==` for comparison |
| `cmd1 && cmd2` | `cmd1; and cmd2` | `;` separates, `and`/`or` chain |
| `cmd1 \|\| cmd2` | `cmd1; or cmd2` | |
| `2>/dev/null` | `^cmd err> (mktemp)` or `try`/`catch` | |

**Why `==` not `=`:** in nushell, `=` is assignment (`let x = 5`), `==` is
equality comparison. `if $a = $b { }` is a parse error (assignment in a
condition). This is the opposite of bash's `test`/`[ ]`, which uses `=` for
string equality.

### Command substitution

Bash `$(cmd)` becomes `(^cmd)` in nushell — a subexpression that runs the
external and returns its stdout as a string:

```nushell
# Bash:   files=$(ls *.txt)
# Nushell:
let files = (^ls *.txt)
let files2 = (ls *.txt | get name | str join "\n")   # using builtin ls (structured)
```

**Why prefer the builtin:** `ls` (builtin) returns a table you can filter and
transform; `^ls` returns a string you must parse. Reach for the builtin first,
fall back to `^cmd` only when the external has no builtin equivalent or you
need its exact text output.

### Redirection differences

| Bash | Nushell | Meaning |
|------|---------|---------|
| `>` | `out>` | stdout to file (overwrite) |
| `>>` | `out>>` | stdout to file (append) |
| `2>` | `err>` | stderr to file |
| `2>>` | `err>>` | stderr to file (append) |
| `&>` | `out+err>` | combined stdout+stderr to file |
| `2>&1` | `out+err>` | combined (nushell error message points here) |
| `\|&` | `e>\|` | pipe stderr to next command |

**Why the names differ:** nushell models three streams (stdout, stderr, and
internal pipeline values) and wants you to be explicit about which you mean.
The named operators also work on builtins (`ls | out> file.txt`), not just
externals.

### Common porting gotchas

- **`source script.sh` fails:** nushell cannot source bash. Port the script to
  nushell, or invoke via `^bash script.sh` and capture output.
- **`export VAR=value` fails:** use `$env.VAR = "value"`. For multiple at once,
  `load-env {VAR1: "a", VAR2: "b"}`.
- **`alias ll='ls -la'` works** but aliases cannot take parameters or contain
  logic. Use `def ll [] { ls --all --long }` for anything non-trivial.
- **`$?` (exit status) doesn't exist:** use `try`/`catch`, or check
  `$env.LAST_EXIT_CODE` after an external (nushell sets it).
- **`set -e` (exit on error):** nushell has no global "exit on error" toggle.
  Errors propagate through pipelines; wrap risky code in `try`/`catch`.
- **Word splitting:** bash splits unquoted `$VAR` on whitespace; nushell never
  does. A list stays a list; use `...$list` to spread it as args.
- **Globs:** bash expands `*.txt` before the command runs; nushell expands
  globs in `ls`, `open`, `rm`, `cp`, etc. and passes matches as typed values.
  Quoting `"*.txt"` suppresses expansion in both.
- **`cd` with no args:** bash goes home; nushell's `cd` requires a path (use
  `cd ~`).

→ For error handling (`try`/`catch`, `error make`), see
`references/language-types.md#error-handling`.
→ For aliases, `def`, and `--wrapped` (forwarding unknown flags to externals),
see `references/scripts-modules-config.md#custom-commands` and
`references/scripts-modules-config.md#aliases`.
