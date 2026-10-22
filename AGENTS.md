# AGENTS.md

## Checks

After completing any task, run the checks for the code you touched and fix all issues before considering the task done:

```bash
CI=true pnpm lint:ts   # frontend
pnpm lint:rs           # rust backend
```

All must pass with zero errors and zero warnings.

## Frontend UI

- As few Tailwind classes and containers as possible per page.
- No arbitrary values (`w-[13px]`), no obscure Tailwind classes — standard scale utilities only.
- Style reka-ui components instead of hand-writing logic/compat code.
- Colors: only the tokens in `app/assets/css/main.css`. If a hardcoded color seems needed, stop and ask the user.

## Error Handling: neverthrow

Fallible code returns `Result` / `ResultAsync` (details in `.agents/skills/neverthrow`).

- `E` is a discriminated union with a literal `type` tag; wrap throwing boundaries with `ResultAsync.fromThrowable(fn, toXError)`, not `fromPromise`.
- `map` for transforms, `andThen` for fallible steps, and always terminate (`.match` / `.unwrapOr` / `.isErr()`). Throw only for programmer bugs.

## Comment Policy

No verbose/long comments, no ornate dividers (`──`, box-drawing, ASCII art), no restating what code already shows. One-line comments only, and only for a non-obvious *why* (invariant, platform quirk, wire layout, cross-file sync, real TODO). When in doubt, delete it.

<!-- clonedeps head -->
## Cloned Dependency Source

Read-only dependency source repositories are available under `.agents/clonedeps/repos/` for inspection. Do not edit these clones. Keep this list in sync with `.agents/clonedeps/lock.json`: when a dependency is added, removed or upgraded, update the lock file and run `sync`.

| Dependency | Version | Path |
| --- | --- | --- |
| `btleplug` | `0.12.0` | `.agents/clonedeps/repos/btleplug__ee38` |
| `rmk` | `main@e3480de` | `.agents/clonedeps/repos/rmk__e348` |

<!-- clonedeps tail -->
