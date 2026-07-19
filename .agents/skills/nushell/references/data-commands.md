# Data Commands Reference

> Cross-referenced from SKILL.md §4 (pipelines, cell paths), §6 (command
> essentials), §14 (common pitfalls). Read this file when you need exact
> flags, the precise shape of a command's output, or behavior for tables vs
> records vs lists. Every code example below was verified against local `nu`
> 0.114.1.

**Contents**

- [Pipeline Semantics](#pipeline-semantics)
- [Cell Paths](#cell-paths)
- [Filtering](#filtering)
- [Transforming](#transforming)
- [Grouping and Sorting](#grouping-and-sorting)

## Pipeline Semantics

Nushell pipelines pass typed values, not strings. Each command consumes the
previous command's output and emits a value of its declared output type.

### Input/output type contracts

Every built-in declares its input and output types. Inspect them with
`help <command>` — the `Input/output types` block is the contract:

```nushell
help select    # record→record, table→table, list<any>→any (preserves shape)
help get       # any→any (extracts a single value, loses structure)
```

**Why this matters:** the receiving command's declared input type must match
the previous command's output type. A mismatch fails at parse or run time.
`ls | ls` errors because `ls` has input type `nothing` — it does not consume
pipeline input — so the second `ls` rejects the table the first emitted.

**`|` is the pipe operator.** It is not a statement separator. Use `;` or a
newline to separate independent commands. `http put $url $a | http delete
$url` would send the `put` response as the `delete` body, because HTTP
commands accept pipeline input as the request body.

### The `$in` variable

`$in` is the implicit pipeline input inside any closure. Each iteration of
`each`, `where`, `update`, etc. binds the current element to `$in` and to
the first parameter if one is declared:

```nushell
[1 2 3] | each { $in * 2 }      # implicit input
[1 2 3] | each {|x| $x * 2 }   # named parameter — equivalent
```

**`$it` is the legacy row variable and works ONLY inside `where` row
conditions.** `[1 2 3] | each { $it * 2 }` errors with `variable not
found`. Use `$in` or a named parameter everywhere except `where`'s
row-condition shorthand.

→ For closures, parameters, and the `$in`/`$it` distinction in depth, see
`references/language-types.md#closures`.

### Pipeline metadata

Values carry metadata: the source `span` (byte offsets) and, for HTTP
responses, an `http_response` record (status, headers, version). Inspect
with the `metadata` command; `metadata set` attaches metadata to a value
(marking a string as a file path so completion and styling treat it as a
path, or attaching a content type):

```nushell
let x = 42
metadata $x                 # {span: {start, end}}
[1 2 3] | metadata          # span of the pipeline expression
http get $url --full | metadata | get http_response.status   # e.g. 200
[[name color]; [Cargo.lock #ff0000]] | metadata set --path-columns [name]
"text" | metadata set --content-type text/plain
```

**Why metadata exists:** `path expand`, `table` coloring, and HTTP-aware
completions all read attached metadata. Stripping it can lose source
highlighting, though it rarely causes data errors.

### Filling missing values with `default`

`default <value> [column]` replaces `null` (and, with `--empty`/`-e`, empty
strings, records, lists) in a column or a single value, preserving table
shape:

```nushell
[{a: 1} {a: null} {a: 3}] | default 0 a       # a=1, a=0, a=3
[{a: 1} {b: 2}] | default 0 a                  # adds a=0 to row 1 (was missing)
["" "x"] | each { default --empty "EMPTY" }   # → [EMPTY x]
```

**Gotcha:** `default` operates on a column or on `$in` — it does NOT walk a
bare list. `[1 null 3] | default 0` leaves the `null` untouched because
there is no column. To replace nulls in a list, iterate with `each`. Use
`--empty` when you treat "no value" and "empty container" the same way.

→ For `get --optional` + `default` HTTP patterns, see
`references/externals-io-formats.md#http`.

## Cell Paths

A cell path is nushell's syntax for navigating nested data: fields of a
record, indices of a list, and combinations thereof. They work in three
contexts: direct variable access (`$data.users.0.name`), the `get` command,
and the `select` command.

### Cell-path literals

Use `.` to separate field names and integer indices. A cell path is itself
a value you can pass around — write it as a literal with the `$.` prefix:

```nushell
let data = {users: [{name: "Alice"}, {name: "Bob"}]}
$data.users.0.name          # "Alice"
$data | get users.0.name   # "Alice" — same via get
let cp = $.users.0.name
$data | get $cp            # "Alice"   (cell path as a value)
```

**Why cell-path literals exist:** commands like `get`, `select`, `update`,
`sort-by`, and `group-by` take a cell path as an argument. When the path is
computed or stored, the `$.` form spells it as a value rather than as an
immediate access.

### Optional paths

The `?.` operator makes a step optional: if that step fails (missing field
or out-of-bounds index), the whole path returns `null` instead of erroring.
`get` and `select` also accept `--optional`/`-o` to make EVERY step
optional, so you do not have to sprinkle `?.` on each one:

```nushell
{users: [{name: "Alice"}]} | get $.users.5?.name    # null (no error)
{users: [{name: "Alice"}]} | get $.users.5.name     # ERROR: access_beyond_end
{a: 1 b: 2} | get --optional c        # null
[{a: 1} {b: 2}] | select -o a         # keeps a column, missing rows get null
```

**Why prefer `?.` over `--optional`:** `?.` is surgical — only the marked
step is forgiving — while `--optional` makes the entire path tolerant, which
can mask genuine bugs in adjacent steps. Use `--optional` only when the
whole path is genuinely best-effort (e.g. probing for an HTTP header that
may not exist).

### Quoted and case-insensitive fields

Field names with spaces, punctuation, or that collide with keywords are
quoted with double quotes. `select` and `get` accept `--ignore-case` to
match field names case-insensitively — conflicting cases collapse into the
requested name:

```nushell
let r = {"field name": 42}
$r."field name"                                # 42
[{Name: 1} {name: 2}] | select --ignore-case name   # → [{name: 1} {name: 2}]
```

### `get` vs `select`

Mnemonic: **`select` preserves structure, `get` extracts a value.**

| Command | Input | Output | Behavior |
|---------|-------|--------|----------|
| `select a b` | table | table (only `a`, `b`) | Removes non-selected columns/rows |
| `get a` | table | list of `a`'s values | Extracts the value, drops table shape |
| `select 0 2` | list/table | list/table with only those rows | Removes non-selected rows |
| `get users.0` | record | the value at that path | Extracts a single value |

```nushell
[{a: 1 b: 2}] | select a     # → table with one column a
[{a: 1 b: 2}] | get a       # → [1]  (list of values)
[{a: 1 b: 2}] | reject a    # → table with only b  (opposite of select)
```

**Why both exist:** `select` is for shaping (keep the table, drop columns);
`get` is for extracting a scalar or single column as a list to feed into
`math sum`, `sort`, etc.

## Filtering

Filtering commands reduce rows without changing columns. The workhorse is
`where`; `drop`, `skip`, and `take` are structural (by position).

### `where`: row conditions and closures

`where` accepts two forms: a row condition (shorthand using `$it`) or a
closure (using `$in` or a named parameter). Inside a row condition, `$it`
is bound to the current row and bare field names auto-expand to `$it.field`;
inside a closure, `$it` is NOT bound:

```nushell
[1 2 3 4 5] | where $it > 2          # → [3 4 5]  (row condition)
ls | where size > 1mb                # size expands to $it.size
[1 2 3 4 5] | where $in > 2          # $in also works in row conditions
[1 2 3 4 5] | where { $in > 2 }      # → [3 4 5]  (closure form)
[1 2 3 4 5] | where {|x| $x > 2 }   # → [3 4 5]  (named param)
let cond = {|x| $x.a > 1}            # closures can be stored; row conditions cannot
[{a: 1} {a: 2}] | where $cond        # → [{a: 2}]
```

**Why two forms:** row conditions are concise and read like SQL; closures
let you store a predicate in a variable and reuse it. Row conditions cannot
be stored — to pass a predicate dynamically, use a closure.

### `filter`: closure-only (deprecated)

`filter` is a distinct command (NOT an alias of `where`) that accepts ONLY
a closure — no row-condition shorthand. It is deprecated since 0.105.0 in
favor of `where`, which now accepts closures too. Avoid `filter` in new code:

```nushell
[1 2 3] | filter { $in > 1 }     # works but emits a deprecation warning
[1 2 3] | where { $in > 1 }     # preferred — same behavior, no warning
```

**Why the deprecation:** `where` learned to take a closure, so `filter`
offers nothing `where` does not. The command will be removed in a future
release.

### `drop` and `drop nth`

`drop N` removes N rows from the END of a list or table (default 1). `drop
nth N` removes the row at index N (0-based) — there is NO `nth` command:

```nushell
[0 1 2 3] | drop          # → [0 1 2]   (drops 1, the default)
[0 1 2 3] | drop 2        # → [0 1]
[a b c d] | drop nth 1    # → [a c d]   (removes index 1)
[a b c d] | drop nth 0 2  # → [b d]     (multiple indices)
# To SELECT by index instead, use cell paths, `select`, `first`, or `last`:
let l = [a b c d]; $l.1      # → b        (cell path access)
[a b c d] | select 0 2       # → [a c]    (select accepts row indices)
[a b c d] | first 2          # → [a b]
[a b c d] | last 1           # → [d]
```

**Why `drop` defaults to 1:** it mirrors `first` (also defaults to 1) —
"first 1" and "drop 1" are the two ends of a single-row extraction.

→ For the full list of "commands that don't exist," see SKILL.md §14.

### `skip`, `take`, and stateful `while`/`until`

`skip N` discards the first N rows; `take N` keeps the first N. Both work
on lists, tables, binaries, and (for `take`) ranges. The stateful variants
`take while`, `take until`, `skip while`, `skip until` walk the input and
decide per-element whether to keep or skip. `while` continues as long as
the predicate is true; `until` continues until it becomes true. All
require a closure (no row-condition form):

```nushell
[2 4 6 8] | skip 1              # → [4 6 8]
[2 4 6 8] | take 2              # → [2 4]
1..10 | take 3                  # → [1 2 3]
[1 2 3 4 5] | take while { $in < 4 }    # → [1 2 3]
[1 2 3 4 5] | take until { $in > 3 }    # → [1 2 3]
[1 2 3 4 5] | skip while { $in < 3 }    # → [3 4 5]
[1 2 3 4 5] | skip until { $in > 3 }    # → [4 5]
```

**Gotcha:** `take while` and `skip while` stop the FIRST time the predicate
flips — they do not resume. To filter ALL matching rows, use `where`, not
`take while`. `take while` is for "the prefix that satisfies a condition,"
e.g. reading log lines until the first ERROR.

## Transforming

`update`, `insert`, `upsert` modify cells; `merge` combines records/tables;
`prepend`/`append` add to a list; `enumerate`, `wrap`, `flatten`, `rename`,
`move` reshape; `each` applies a closure per row.

### `update`, `insert`, `upsert`, `merge`

- **`update <field> <value|closure>`** — change an EXISTING column or index. Errors if the field does not exist.
- **`insert <field> <value|closure>`** — add a NEW column or insert at an index. Errors if the field already exists.
- **`upsert <field> <value|closure>`** — update if present, insert if absent. The safe choice when you do not know.
- **`merge <record|table>`** — overlay the argument onto the input, overwriting matching keys/rows. For tables, row 0 of the argument overlays row 0 positionally — NOT a relational join.

```nushell
{name: nu stars: 5} | update name "Nushell"          # existing field
{name: nu stars: 5} | insert alias "Nushell"        # new field
{name: nu stars: 5} | upsert alias "Nushell"        # inserts (absent)
{name: nu stars: 5} | upsert name "Nushell"          # updates (present)
{a: 1 b: 2} | merge {b: 3 c: 4}                     # → {a: 1 b: 3 c: 4}

[[name age]; [Alice 30] [Bob 25]] | update age { $in + 1 }    # +1 to each row's age
[[name age]; [Alice 30] [Bob 25]] | insert city "NYC"         # constant value
[[a b]; [1 2]] | merge {b: 9 c: 7}                          # → [[a b c]; [1 9 7]]

[1 2 4] | insert 2 3            # → [1 2 3 4]  (insert at index 2)
[1 2 4] | update 2 3           # → [1 2 3]    (replace at index 2)
```

The closure form passes the current row as the first parameter and the
existing cell value as `$in`. `merge deep` recursively merges nested
records (useful for layered config overrides). For relational joins, use
`join` (see [Grouping and Sorting](#grouping-and-sorting)).

**Why these are separate:** making the operation explicit (insert vs
update) catches bugs — `insert` failing on an existing field signals that
you did not expect that field. `upsert` is for the genuinely "either is
fine" case. `merge` is positional on tables — it is designed for "patch
this table with these row-level overrides," not relational lookups.

### `prepend` and `append`

`prepend <value>` adds to the front of a list; `append <value>` adds to the
end. Both unwrap lists passed to them — to prepend a list AS a single
element, wrap it first:

```nushell
[2 3] | prepend 1          # → [1 2 3]
[1 2] | append 3           # → [1 2 3]
[2 3] | prepend [1]        # → [1 2 3]    (list unwrapped)
[2 3] | prepend [[1]]    # → [[1] 2 3]   (stays as one element)
```

**Gotcha:** `prepend $val` where `$val` is itself a list spreads the list's
elements. Write `prepend [$val]` to keep it as one element.

### `enumerate` and `wrap`

`enumerate` walks a list, table, or stream and emits a TABLE with `index`
(shown as `#`) and `item` columns — the output is always a table, even for a
list input. `wrap <column-name>` wraps a value into a single-column record
(or a single-column table if the input is a list):

```nushell
[a b c] | enumerate                            # → table with `#` and `item` columns
[10 20 30] | enumerate | each {|r| $r.index * $r.item }   # → [0 20 60]
"hello" | wrap text          # → {text: hello}
[a b c] | wrap letter        # → table with one column "letter"
```

**Not:** there is NO `unwrap` command in nushell 0.114.1 (`help unwrap`
returns `not found`). The inverse of `wrap` is `get <column>` (extract the
value as a list) or `select <column>` (keep as a single-column table):
`{text: "hello"} | get text` → `hello`; `[a b c] | wrap letter | get letter`
→ `[a b c]`.

### `each`

`each <closure>` applies a closure to every element and collects the
results into a new list. Each iteration binds the element to `$in` and to
the first parameter if declared. `each --flatten` (`-f`) flattens one level
of nesting per iteration — useful when each closure returns a list:

```nushell
[1 2 3] | each { $in * 2 }              # → [2 4 6]
[1 2 3] | each {|x| $x * 2 }            # → [2 4 6]
[[a]; [1] [2]] | each { $in.a + 1 }     # → [2 3]
[{a: 1 b: 2} {a: 3 b: 4}] | each --flatten { [$in.a $in.b] }   # → [1 2 3 4]
```

**Why `each` over a `for` loop:** nushell is expression-oriented. `each`
returns a value you can pipe into the next command; `for` returns `null`
and is for side effects. Prefer `each` for transformations. → For
`par-each` (parallel) and `reduce` (accumulator), see
`references/language-types.md#closures`.

### `flatten`

`flatten` unwraps one level of nested lists inside a table column, turning
each list element into its own row. Without arguments it flattens the first
column that has a list; `--all`/`-a` flattens all eligible columns;
`flatten <column>` flattens only the named one.

```nushell
[[a b]; [1 [2 3]]] | flatten
# → [[a b]; [1 2] [1 3]]    (one row per inner element)
[[name tags]; [Alice [admin user]]] | flatten tags
# → one row per tag (table-level flatten targets a column)
```

**Gotcha:** flattening more than one column-with-lists at the same time
errors (`can only flatten one inner list at a time`) — pick one column or
use `--all`.

### `reject`, `rename`, `move`

**`reject <columns>`** drops the named columns and keeps everything else —
the opposite of `select`. Use it when you have a wide table and want to drop
a few columns rather than enumerate the ones to keep.

**`rename`** renames columns. Positional form renames left-to-right;
`--column`/`-c` renames specific columns by record; `--block`/`-b` applies
a closure to each name.

**`move <columns> --before <col>`** (or `--after`, `--first`, `--last`)
reorders columns. Flags are mutually exclusive.

```nushell
[{a: 1 b: 2 c: 3}] | reject b              # → [{a: 1 c: 3}]
[{a: 1 b: 2 c: 3}] | reject a c            # → [{b: 2}]
[[a b c]; [1 2 3]] | rename x y z          # rename all positionally
[[a b c]; [1 2 3]] | rename --column { a: alpha }   # rename only a → alpha
{abc: 1 bbc: 2} | rename --block { str replace --all "b" "z" }   # {azc: 1 zzc: 2}
[[a b c]; [1 2 3]] | move c --before a     # → c a b
[[a b c]; [1 2 3]] | move a b --after c    # → c a b
[[a b c]; [1 2 3]] | move a --last         # → b c a
```

**Why `reject` over `select`** when dropping 2 of 20 columns: `reject x y`
is far clearer than `select a b c d ...` (18 names). **Why column order
matters:** nushell tables render columns left-to-right in declaration order.
Moving columns affects readability, not data.

## Grouping and Sorting

Grouping commands partition data: by value (`group-by`, `uniq`), by fixed
size (`chunks`), by sliding window (`window`), or by aggregate (`math`,
`histogram`). `sort-by` orders rows; `join` combines two tables on a key.

**Not:** there is NO `group` command in nushell 0.114.1. Use `chunks N`
for fixed batches, `window N` for sliding windows, and `group-by` for
value-based grouping. They are NOT interchangeable.

### `group-by`

`group-by <column|closure>` partitions a table by a column's distinct
values (or by a closure's return value). Output is a RECORD keyed by group
value, each value being the subtable of matching rows:

```nushell
[[cat v]; [a 1] [a 2] [b 3]] | group-by cat
# → {a: [[cat v]; [a 1] [a 2]], b: [[cat v]; [b 3]]}

[foo.txt bar.csv baz.txt] | group-by { path parse | get extension }
# → {txt: [foo.txt baz.txt], csv: [bar.csv]}

[[cat v]; [a 1] [a 2] [b 3]] | group-by cat --to-table
# → table with `group` and `items` columns
```

`--to-table` returns a flat table with `group` and `items` columns instead
of a record — useful for downstream processing. `--prune` removes the
grouping column from each subtable.

**Why the closure form:** when the natural grouping key is a computed value
(file extension, date bucket, normalized string), the closure form computes
it inline instead of forcing you to `insert` a column first.

### `uniq`

`uniq` removes duplicates from a list. Without flags it returns the unique
values in first-seen order. Flags:

- `-c` — append a `count` column with the occurrence count.
- `-d` — keep ONLY values that appeared more than once (drop singletons).
- `-i` — case-insensitive comparison (treats `"A"` and `"a"` as the same).

```nushell
[1 1 2 3 3 3] | uniq              # → [1 2 3]
[1 1 2 3 3 3] | uniq -c           # → table with value + count
[1 1 2 3 3 3] | uniq -d           # → [1 3]   (duplicates only)
["A" "a" "b"] | uniq -i           # → [A b]   (a folded into A)
```

**Why `-d` is "duplicates only":** it answers "which values appear more
than once" — the standard question for finding collisions (duplicate IDs,
emails). Without `-d`, `uniq` answers "what distinct values exist."

### `sort-by`

`sort-by <columns>` orders a table by the named columns, ascending by
default. Multiple columns are sorted in priority order (first column is
primary). Flags: `--reverse`/`-r` (descending), `--ignore-case`/`-i`
(case-insensitive). For natural sort (`file2` < `file10`), add `--natural`.

```nushell
[[n]; [3] [1] [2]] | sort-by n                  # ascending → [1 2 3]
[[n]; [3] [1] [2]] | sort-by n --reverse        # descending → [3 2 1]
[[a b]; [1 2] [1 1] [2 1]] | sort-by a b        # multi-column (a then b)
[[n]; [B] [a] [C]] | sort-by n --ignore-case    # → [a B C]
[[n]; [B] [a] [C]] | sort-by n -r -i            # → [C B a]   (combine flags)
```

### `chunks N` and `window N` (batching)

`chunks N` divides a list, table, or binary into consecutive,
non-overlapping chunks of size N (the last chunk may be smaller). Errors if
N ≤ 0. `window N` creates overlapping sliding windows of size N that move
by one element each step. `--stride`/`-s` controls how far the window
advances; `--remainder`/`-r` keeps a final short window if the input does
not divide evenly:

```nushell
[1 2 3 4 5] | chunks 2
# → [[1 2] [3 4] [5]]   (last chunk has 1 element)
[1 2 3 4 5] | window 2
# → [[1 2] [2 3] [3 4] [4 5]]   (4 overlapping windows)
[1 2 3 4 5] | window 2 --stride 2
# → [[1 2] [3 4]]               (non-overlapping with stride 2)
[1 2 3 4 5] | window 3 --stride 3 --remainder
# → [[1 2 3] [4 5]]             (remainder kept)
```

**Why `window` over `chunks`:** `chunks` gives disjoint batches; `window`
gives overlapping runs — what you want for moving averages, differences
between consecutive elements, or "find N consecutive matching rows." Use
`chunks` for batched processing (e.g. sending API requests in groups of 50)
where each chunk is independent.

### `math` reductions

`math` aggregates a list of numbers. You MUST use a subcommand — bare `math`
only prints help. The common reductions:

| Subcommand | Returns |
|------------|---------|
| `math sum` / `math product` | Sum / product of the list |
| `math avg` / `math median` / `math mode` | Mean / median / most frequent |
| `math min` / `math max` | Smallest / largest value |
| `math variance` / `math stddev` | Population variance / standard deviation |
| `math ceil` / `math floor` / `math round` | Per-element rounding (returns a list) |
| `math abs`, `math sqrt`, `math ln`, `math log`, `math exp` | Per-element math fns |

```nushell
[1 2 3 4 5] | math sum          # → 15
[1 2 3 4 5] | math avg          # → 3.0
[1 2 3 4 5] | math variance     # → 2.0
[1 2 3 4 5] | math stddev       # → 1.4142135617...
[1.4 2.7 3.1] | math ceil       # → [2 3 4]
```

**Not:** there is no `math var` or `math std` — the correct names are
`math variance` and `math stddev`. For the full list (including trig), run
`help math` in a REPL.

### `histogram`

`histogram [column] [freq-column]` builds a frequency table with `value`,
`count`, `quantile`, `percentage`, and a bar-chart `frequency` column. On a
bare list it counts values; on a table you pass the column name.
`--percentage-type`/`-t` accepts `normalize` (default; percentage of the
max) or `relative` (percentage of the total). Pass an optional second
argument to name the count column:

```nushell
[a a b c c c] | histogram                       # bar chart sorted by count desc
[[t v]; [a 1] [a 2] [b 3] [a 4]] | histogram t  # frequency table by `t` value
```

**Why `histogram` over `group-by | sort-by` combos:** it computes counts,
quantiles, percentages, and a printable bar in one call — the standard
"show me the distribution" command.

### `join`

`join <right-table> <left-on> [right-on]` performs a relational join
between two tables. Default is an inner join. The `right-on` argument
defaults to the same column name as `left-on` if omitted. Flags select the
join type and rename overlapping columns:

| Flag | Join type |
|------|-----------|
| `--inner` (default) | rows present in both tables |
| `--left`/`-l` | all left rows, right filled with null where unmatched |
| `--right`/`-r` | all right rows, left filled with null where unmatched |
| `--outer`/`-o` | union of both; nulls on either side where unmatched |
| `--prefix`/`-p` / `--suffix`/`-s` | prefix or suffix the right table's non-key columns |

```nushell
[[id x]; [1 10]] | join [{id: 1 name: "A"}] id
# → [{id: 1, x: 10, name: A}]
[[id x]; [1 10] [2 99]] | join --left [{id: 1 name: "A"}] id
# → [{id: 1, x: 10, name: A}, {id: 2, x: 99, name: null}]
[[id x]; [1 10]] | join --suffix _r [{id: 1 x: 20}] id
# → [{id: 1, x: 10, x_r: 20}]   (overlapping column suffixed)
```

**Why `join` over `merge`:** `merge` overwrites row-by-row positionally
(row 0 of the argument overlays row 0 of the input) — it does NOT match on
a key. `join` is the only command that does SQL-style relational matching.
Use `join` for "look up these IDs in another table"; use `merge` for "overlay
these row-level patches onto this table."

→ For working with SQL databases via `stor` and `query`, see
`references/externals-io-formats.md#data-formats`. When in doubt about a
flag, run `help <command>` in a REPL — the local `nu` binary is the source
of truth.
