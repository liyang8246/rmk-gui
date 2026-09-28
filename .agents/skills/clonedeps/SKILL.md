---
name: clonedeps
description: Pin third-party dependency source code into .agents/clonedeps/repos/ so it can be read as plain files instead of digging through node_modules/, .venv/, .cargo/registry/, vendor/ or bundled output. Use whenever the user wants to read, trace or debug a dependency's source ("看一下这个库的源码", "读源码"), asks where a dependency's code lives or which version is installed, needs a monorepo package pinned to an exact commit, or mentions clonedeps / .agents/clonedeps/lock.json. Also use when AGENTS.md already has a "Cloned Dependency Source" section.
---

# clonedeps

## Usage

```bash
uv run <this-skill>/scripts/clonedeps.py state   # report the current state
uv run <this-skill>/scripts/clonedeps.py sync    # materialise clones and refresh AGENTS.md
```

`<this-skill>` is the directory holding the `SKILL.md` you are reading; `scripts/clonedeps.py`
sits next to it. Run from the project root, or pass `--root <project dir>`. `--dry-run` prints
the plan, `sync --force` re-clones every entry, `sync --verbose` adds git's own output from
fallback fetches. Each run prints the full state at the end.

## lock.json

Write `.agents/clonedeps/lock.json`, an array:

```json
[
  {
    "name": "@opencode-ai/plugin",
    "resolvedVersion": "1.3.17",
    "repoUrl": "https://github.com/opencode-ai/opencode.git",
    "ref": "aa1bb2cc",
    "packagePath": "packages/plugin"
  }
]
```

| Field | Value |
|---|---|
| `name` | package name |
| `resolvedVersion` | the version declared in the dependency's own manifest |
| `repoUrl` | repository URL: https, ssh, a local path or a `file://` mirror |
| `ref` | commit hash, 4–40 hex characters, full 40 preferred |
| `packagePath` | the package's directory inside a monorepo — the snapshot then holds just that directory; omit it for single-package repos |
| `allowVersionDrift` | `true` accepts a version difference between `resolvedVersion` and the manifest |

Add `.agents/clonedeps/repos/*` to the project's `.gitignore` (create that file when the
project has none).

## Steps

1. Read the dependency's own manifest (`package.json`, `Cargo.toml`, `pyproject.toml`) and put
   its declared version in `resolvedVersion`; when the project has no manifest for that
   dependency, use the version the user names.
2. Get the repository URL: ask the user, or read it from the dependency's metadata —
   `repository` in `node_modules/<pkg>/package.json`, `cargo metadata`,
   `importlib.metadata.metadata('<name>')['Project-URL']`, or `.Origin.Hash` from
   `go list -m -json <module>@<version>`.
3. Resolve the version to a commit: `git ls-remote --tags <repoUrl> | grep <version>` and take
   the commit on the `^{}` line (an annotated tag prints two lines; drop the `git+` from
   `git+https://…` URLs), expand a branch or short hash with
   `gh api repos/<owner>/<repo>/commits/<ref> --jq .sha`. In a monorepo, take `packagePath`
   from `workspaces` in the root `package.json`, `members` in the root `Cargo.toml`, or a
   `src/<name>/` layout.
4. Write lock.json, run `sync`, apply every `note:` line in its output, and run it again.
5. Read source code from the `read:` path that `sync`/`state` prints, or from the Path column
   of the AGENTS.md table.

## AGENTS.md

`sync` maintains the "Cloned Dependency Source" section at the end of `AGENTS.md`: a
dependency / version / path table plus one sentence asking for lock.json and `sync` to be
updated whenever a dependency is added, removed or upgraded.
