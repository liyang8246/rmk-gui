#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pydantic>=2.7"]
# ///
"""clonedeps - pin third-party dependency *sources* so they can be read as plain files.

  state   report what .agents/clonedeps/lock.json pins and what is on disk
  sync    write every locked entry into .agents/clonedeps/repos/, check the manifest version
          against `resolvedVersion`, prune what lock.json no longer lists, rewrite the
          AGENTS.md block

A `sync` fetches the pinned commit shallowly and bloblessly into a throwaway git dir, exports
the requested tree with `git archive`, and unpacks it. An entry with `packagePath` therefore
lands at `.agents/clonedeps/repos/<name>__<hash>` itself, with no extra directory layer.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import tomllib
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath

from pydantic import BaseModel, ConfigDict, Field, RootModel, ValidationError, field_validator, model_validator

CLONEDEPS_DIR = ".agents/clonedeps"
LOCK_NAME = "lock.json"
REPOS_DIR = "repos"

# The AGENTS.md block is always last and always delimited by these comments, so `sync` can
# replace it with a regex instead of parsing markdown. `haed` is the historical spelling -
# still recognised so such a block gets replaced rather than duplicated.
BLOCK_HEAD = "<!-- clonedeps head -->"
BLOCK_TAIL = "<!-- clonedeps tail -->"
BLOCK_INTRO = (
    "Read-only dependency source repositories are available under `.agents/clonedeps/repos/` "
    "for inspection. Do not edit these clones. Keep this list in sync with "
    "`.agents/clonedeps/lock.json`: when a dependency is added, removed or upgraded, update "
    "the lock file and run `sync`."
)

MANIFEST_FILES = ("package.json", "Cargo.toml", "pyproject.toml")
# Root-level manifests are archived alongside a monorepo package and unpacked here, so a
# package that inherits its version (`version.workspace = true`) can still be verified offline.
# Only Cargo has that inheritance; npm and PEP 621 declare the version in the package itself.
ROOT_MANIFESTS = ("Cargo.toml",)
ROOT_DIR = ".clonedeps-root"
HEX_REF_RE = re.compile(r"^[0-9a-fA-F]{4,40}$")
UNSAFE_DIR_CHARS_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
VERSION_RE = re.compile(r"""__version__\s*(?::\s*str\s*)?=\s*["']([^"']+)["']""")
SHORT_REF_LEN = 4  # hex refs become a 4-char prefix in directory names, grown on collision

_ENV = {
    **os.environ,
    # Never let git block on a credential prompt: fail loudly instead of hanging forever
    # inside an agent run.
    "GIT_TERMINAL_PROMPT": "0",
    "GIT_ASKPASS": "echo",
    "GCM_INTERACTIVE": "never",
    "GIT_PAGER": "cat",
}

# --------------------------------------------------------------------------------------
# lock.json
# --------------------------------------------------------------------------------------


class Entry(BaseModel):
    """One pinned dependency. Attributes are snake_case; the aliases are the lock.json keys.

    `allowVersionDrift` is the escape hatch for a manifest that legitimately disagrees with
    the published version (release tagged before a version bump, vendored snapshot). Living
    in lock.json rather than a CLI flag keeps `state` and `sync` agreeing on what is drift.
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    name: str
    resolved_version: str = Field(alias="resolvedVersion")
    repo_url: str = Field(alias="repoUrl")
    ref: str
    package_path: str = Field(default="", alias="packagePath")
    allow_version_drift: bool = Field(default=False, alias="allowVersionDrift")
    index: int = Field(default=0, exclude=True)  # position in lock.json, for messages
    short_ref: str = Field(default="", exclude=True)  # filled in by resolve_dir_names

    @field_validator("name", "resolved_version", "repo_url")
    @classmethod
    def _required_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty")
        return value.strip()

    @field_validator("package_path")
    @classmethod
    def _inside_repo(cls, value: str) -> str:
        path = value.strip().strip("/")
        if ".." in path.split("/"):
            raise ValueError("must stay inside the repository")
        return path

    @field_validator("ref")
    @classmethod
    def _must_be_a_commit(cls, value: str) -> str:
        """Reject tags and branches: a pin has to be a commit.

        A name can point somewhere else tomorrow, and only a hash lets `state` verify a clone
        offline (and gives the directory a short, stable name). Resolving the tag once, when
        the entry is written, is the caller's job.
        """
        value = value.strip()
        if not HEX_REF_RE.match(value):
            raise ValueError(
                "must be a commit hash (4-40 hex chars), not a tag or branch - "
                "resolve it first, e.g. `git ls-remote --tags <url> <tag>` and take the `^{}` line"
            )
        return value.lower()

    def dir_name(self) -> str:
        """`@opencode-ai/plugin` @ `aa1bb2cc` -> `@opencode-ai__plugin__aa1b`.

        Characters a filesystem rejects become `__`; a commit hash is shortened to four
        characters (`resolve_dir_names` grows it only to break a collision), so directory
        names stay readable instead of carrying a 40-char SHA.
        """
        suffix = self.short_ref or self.ref[:SHORT_REF_LEN]
        safe = UNSAFE_DIR_CHARS_RE.sub("__", f"{self.name}__{suffix}").strip()
        # Windows silently drops trailing dots/spaces, which would make the on-disk name
        # differ from the name we report. Strip them ourselves.
        safe = safe.rstrip(" .")
        if not safe:
            raise RuntimeError(f"entry #{self.index + 1}: name/ref produce an empty directory name")
        return safe

    def source_path(self) -> str:
        return f"{CLONEDEPS_DIR}/{REPOS_DIR}/{self.dir_name()}"


class Lock(RootModel[list[Entry]]):
    @model_validator(mode="before")
    @classmethod
    def _unwrap_container(cls, data: object) -> object:
        """lock.json is a bare array; `{"dependencies": [...]}` is tolerated because agents
        paraphrase, and a stray wrapper would otherwise be a confusing error."""
        if isinstance(data, dict):
            for key in ("dependencies", "deps", "packages", "entries"):
                if isinstance(data.get(key), list):
                    return data[key]
            raise ValueError('expected an array of entries, or an object with a "dependencies" array')
        return data


def resolve_dir_names(entries: list[Entry]) -> None:
    """Give every entry a collision-free clone directory name.

    Same-package pins (`vite` at two commits) are the only thing that can collide: their
    hashes are compared as prefixes, and both grow one character at a time until they
    differ. Two entries with an identical name *and* ref can never be separated, so they are
    a real duplicate and get rejected.
    """
    lengths = {e.index: SHORT_REF_LEN for e in entries}
    while True:
        for entry in entries:
            entry.short_ref = entry.ref[: lengths[entry.index]]
        groups: dict[str, list[Entry]] = {}
        for entry in entries:
            groups.setdefault(entry.dir_name(), []).append(entry)
        clashing = [group for group in groups.values() if len(group) > 1]
        if not clashing:
            return
        grew = False
        for group in clashing:
            if len({e.ref for e in group}) == 1:
                raise RuntimeError(
                    f"lock.json pins {group[0].name!r} @ {group[0].ref} {len(group)} times; "
                    "remove the duplicate"
                )
            for entry in group:
                if lengths[entry.index] < len(entry.ref):
                    lengths[entry.index] += 1
                    grew = True
        if not grew:  # distinct refs and no room left to grow: give up loudly
            raise RuntimeError(
                "these lock.json entries map to the same clone directory: "
                + ", ".join(f"{e.name!r} @ {e.ref!r}" for group in clashing for e in group)
            )


def load_lock(root: Path) -> list[Entry]:
    """Read .agents/clonedeps/lock.json. A missing file is an empty lock, not an error: it is
    fine to run `state`/`sync` in a project that has no clones yet."""
    path = root / CLONEDEPS_DIR / LOCK_NAME
    if not path.is_file():
        return []
    try:
        entries = Lock.model_validate_json(path.read_text(encoding="utf-8")).root
    except (ValidationError, UnicodeDecodeError) as exc:
        raise RuntimeError(f"{path}: {describe_lock_problems(exc)}") from None

    for position, entry in enumerate(entries):
        entry.index = position
    resolve_dir_names(entries)
    return entries


def describe_lock_problems(exc: Exception) -> str:
    """Turn pydantic's error list into one actionable line per problem."""
    if not isinstance(exc, ValidationError):
        return f"not valid JSON ({exc})"
    lines = []
    for error in exc.errors():
        loc = [str(part) for part in error["loc"]]
        where = f"entry #{int(loc[0]) + 1} " if loc and loc[0].isdigit() else ""
        field = f"{loc[-1]}: " if len(loc) > 1 else ""
        msg = error["msg"].removeprefix("Value error, ").replace("Field required", "is required")
        lines.append(f"{where}{field}{msg}")
    return "invalid lock.json\n  - " + "\n  - ".join(lines)


# --------------------------------------------------------------------------------------
# git plumbing
# --------------------------------------------------------------------------------------


def run(cmd: list[str]) -> tuple[int, str]:
    """Run a command, merging stdout+stderr. Never raises: callers need git's own message."""
    proc = subprocess.run(cmd, env=_ENV, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return proc.returncode, ((proc.stdout or "") + (proc.stderr or "")).strip()


def git(args: list[str]) -> tuple[int, str]:
    return run(["git", *args])


def force_rmtree(path: Path) -> None:
    """Delete a clone directory, including git's read-only object files.

    On Windows `shutil.rmtree` fails on read-only files and every git object is read-only,
    so a plain rmtree would leave the directory behind for the next `git init` to trip over.
    """

    def on_error(func, target, _exc):  # noqa: ANN001 - shutil's onerror signature
        try:
            os.chmod(target, stat.S_IWRITE)
            func(target)
        except OSError:
            pass

    try:
        shutil.rmtree(path, onerror=on_error)
    except OSError:
        pass


def rev_parse(repo: Path, rev: str) -> str | None:
    """Resolve a rev inside a clone; None when it does not exist."""
    rc, out = git(["-C", str(repo), "rev-parse", "--verify", "--quiet", rev])
    if rc != 0 or not out.strip():
        return None
    return out.strip().splitlines()[-1].strip() or None


def last_lines(text: str, n: int = 3) -> str:
    lines = [ln for ln in text.strip().splitlines() if ln.strip()]
    return " | ".join(lines[-n:])


def normalize_repo_url(url: str) -> str:
    """Bare local paths are legal `repoUrl` values (offline mirrors, tests), but git treats
    them specially (no --depth, no filters); route them through file:// instead."""
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url) or url.startswith("git@"):
        return url
    path = Path(url).expanduser()
    return path.resolve().as_uri() if path.exists() else url


def expand_github_sha(repo_url: str, ref: str) -> str | None:
    """`git fetch` rejects abbreviated SHAs, so expand one through the GitHub API before
    falling back to a commit-graph fetch.

    Goes through the `gh` CLI rather than raw HTTP: it is already authenticated, which lifts
    the anonymous rate limit and makes private repositories work. Returns None when `gh` is
    missing, the repo is not on GitHub, or the API cannot resolve the hash.
    """
    if len(ref) == 40 or not HEX_REF_RE.match(ref) or shutil.which("gh") is None:
        return None
    m = re.search(r"github\.com[:/]+([^/]+)/([^/]+?)(?:\.git)?/?$", repo_url)
    if not m:
        return None
    rc, out = run(["gh", "api", f"repos/{m.group(1)}/{m.group(2)}/commits/{ref}", "--jq", ".sha"])
    return out if rc == 0 and HEX_REF_RE.match(out) else None


def resolve_ref(repo_url: str, ref: str) -> tuple[str, str]:
    """Expand an abbreviated commit hash to its full SHA, plus a note on how.

    `git fetch` cannot fetch a short SHA, and lock.json only ever holds commit hashes, so
    this is the whole lookup: full hashes pass through, short ones go through the `gh` API
    (authenticated, so private repos work too), and a commit-graph fetch is the caller's last
    resort when `gh` is unavailable or the host is not GitHub.
    """
    if len(ref) == 40:
        return ref.lower(), ""
    expanded = expand_github_sha(repo_url, ref)
    return (expanded.lower(), " via the GitHub API") if expanded else ("", "")


def init_git_dir(repo: Path, repo_url: str) -> None:
    rc, out = git(["init", "-q", str(repo)])
    if rc != 0:
        raise RuntimeError(f"git init failed in {repo}: {last_lines(out)}")
    rc, out = git(["-C", str(repo), "remote", "add", "origin", normalize_repo_url(repo_url)])
    if rc != 0:
        raise RuntimeError(f"git remote add failed in {repo}: {last_lines(out)}")


def fetch_commit(repo: Path, e: Entry, verbose: bool) -> tuple[str, str]:
    """Fetch the commit `e.ref` names into a git dir; returns (commit, note)."""
    sha, resolved_via = resolve_ref(e.repo_url, e.ref)
    note = f"shallow fetch{resolved_via}"
    rc = 1
    if sha:
        rc, out = git(
            ["-C", str(repo), "fetch", "--quiet", "--depth", "1", "--no-tags", "--filter=blob:none", "origin", sha]
        )
    if rc != 0:
        # Last resort: pull the commit graph (no blobs) for every branch and tag and resolve
        # the abbreviated hash locally. Needed on non-GitHub hosts and without `gh`.
        if verbose and sha:
            print(f"      git: {last_lines(out)}")
        rc, out = git(
            [
                "-C", str(repo), "fetch", "--quiet", "--no-tags", "--filter=blob:none", "origin",
                "+refs/heads/*:refs/remotes/origin/*", "+refs/tags/*:refs/tags/*",
            ]
        )
        if rc != 0:
            raise RuntimeError(f"git fetch failed for {e.repo_url} @ {e.ref}: {last_lines(out)}")
        sha = rev_parse(repo, e.ref) or ""
        if not sha:
            raise RuntimeError(
                f"commit {e.ref!r} not found in {e.repo_url} (checked every branch and tag tip)"
            )
        note = "commit-graph fetch (abbreviated hash resolved locally)"
    # A 40-char object hash can still be an annotated tag object; only a commit can be archived.
    commit = rev_parse(repo, f"{sha}^{{commit}}")
    if commit and commit != sha:
        raise RuntimeError(
            f"{e.ref} is an annotated tag object, not a commit; pin the commit it points to: {commit}"
        )
    return commit or sha, note


def extract_tree(tar_path: Path, dest: Path, prefix: tuple[str, ...] = (), keep_top: set[str] | None = None) -> None:
    """Unpack an archive into `dest`, dropping the leading `prefix` components.

    `keep_top` limits extraction to those top-level names (used to pull the repository's root
    manifests out of the same archive).
    """
    dest.mkdir(parents=True, exist_ok=True)
    with tarfile.open(tar_path) as tar:
        for member in tar.getmembers():
            parts = PurePosixPath(member.name).parts
            if keep_top is not None and (not parts or parts[0] not in keep_top):
                continue
            if prefix:
                if parts[: len(prefix)] != prefix:
                    continue
                parts = parts[len(prefix) :]
            if not parts or ".." in parts:
                continue
            target = dest.joinpath(*parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            elif member.isfile():
                target.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as src, open(target, "wb") as out:
                    shutil.copyfileobj(src, out)


def materialize(e: Entry, dest: Path, verbose: bool) -> tuple[str, str]:
    """Write the pinned commit's `packagePath` (or the whole tree) into `dest`.

    The source lands at the root of `dest`: a monorepo package is readable as
    `.agents/clonedeps/repos/<name>__<hash>` directly. Returns (commit, note).
    """
    cache = Path(tempfile.mkdtemp(prefix="clonedeps-"))
    archive = cache.parent / f"{cache.name}.tar"
    try:
        init_git_dir(cache, e.repo_url)
        sha, note = fetch_commit(cache, e, verbose)

        root_files: list[str] = []
        if e.package_path:
            rc, out = git(["-C", str(cache), "ls-tree", sha])
            root_files = [
                entry.split("\t", 1)[1]
                for entry in out.splitlines()
                if " blob " in entry and entry.split("\t", 1)[1] in ROOT_MANIFESTS
            ]

        rc, out = git(
            ["-C", str(cache), "archive", "-o", str(archive), sha, *([e.package_path] if e.package_path else []), *root_files]
        )
        if rc != 0:
            raise RuntimeError(
                f"{e.package_path or 'the tree'} is not in {e.repo_url} at {e.ref}: {last_lines(out)}"
            )
        force_rmtree(dest)
        if e.package_path:
            extract_tree(archive, dest, tuple(e.package_path.split("/")))
            extract_tree(archive, dest / ROOT_DIR, keep_top=set(root_files))
        else:
            extract_tree(archive, dest)
        return sha, note
    finally:
        force_rmtree(cache)
        archive.unlink(missing_ok=True)


# --------------------------------------------------------------------------------------
# manifest / version verification
# --------------------------------------------------------------------------------------


def versions_match(declared: str, actual: str) -> bool:
    """major.minor has to agree; a different patch level is the same dependency."""
    left, right = _major_minor(declared), _major_minor(actual)
    if left and right:
        return left == right
    return declared.strip().lower() == actual.strip().lower()


def _major_minor(value: str) -> tuple[str, str] | None:
    numbers = re.findall(r"\d+", value.strip().lstrip("vV"))
    return (numbers[0], numbers[1]) if len(numbers) >= 2 else None


def _read_json_manifest(path: Path) -> tuple[str | None, str | None]:
    data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    version = data.get("version")
    return (version if isinstance(version, str) else None, data.get("name"))


def _read_cargo_manifest(path: Path, repo_root: Path) -> tuple[str | None, str | None]:
    data = tomllib.loads(path.read_text(encoding="utf-8", errors="replace"))
    pkg = data.get("package") or {}
    name = pkg.get("name")
    version = pkg.get("version")
    if isinstance(version, dict) and version.get("workspace") is True:
        # `version.workspace = true` inherits from the repository root, which is either the
        # clone root (whole-repo entry) or the archived root manifests of a monorepo package.
        for candidate in (repo_root / "Cargo.toml", repo_root / ROOT_DIR / "Cargo.toml"):
            if candidate.is_file():
                root_data = tomllib.loads(candidate.read_text(encoding="utf-8", errors="replace"))
                version = ((root_data.get("workspace") or {}).get("package") or {}).get("version")
                break
        else:
            version = None
    return (version if isinstance(version, str) else None, name if isinstance(name, str) else None)


def _scan_python_version(base: Path) -> str | None:
    """Last resort for PEP 621 `dynamic = ["version"]`: look for `__version__` in the few
    files that conventionally carry it."""
    candidates = [base / "__init__.py", base / "src" / "__init__.py"]
    for pattern in ("*/__init__.py", "src/*/__init__.py"):
        candidates.extend(sorted(base.glob(pattern))[:10])
    for cand in candidates:
        try:
            if cand.is_file():
                m = VERSION_RE.search(cand.read_text(encoding="utf-8", errors="replace"))
                if m:
                    return m.group(1)
        except OSError:
            continue
    return None


def _read_pyproject_manifest(path: Path, base: Path) -> tuple[str | None, str | None]:
    data = tomllib.loads(path.read_text(encoding="utf-8", errors="replace"))
    project = data.get("project") or {}
    name = project.get("name")
    version = project.get("version")
    if not isinstance(version, str):
        poetry = (data.get("tool") or {}).get("poetry") or {}
        version = poetry.get("version")
    if not isinstance(version, str):
        version = _scan_python_version(base)
    return (version if isinstance(version, str) else None, name if isinstance(name, str) else None)


@dataclass
class VersionCheck:
    status: str  # ok | mismatch | unverified
    manifest: str = ""
    actual: str = ""
    detail: str = ""
    warnings: list[str] = field(default_factory=list)


def _manifest_facts(name: str, base: Path, repo_root: Path) -> tuple[str | None, str | None]:
    path = base / name
    if name == "package.json":
        return _read_json_manifest(path)
    if name == "Cargo.toml":
        return _read_cargo_manifest(path, repo_root)
    return _read_pyproject_manifest(path, base)


def check_version(e: Entry, clone_dir: Path) -> VersionCheck:
    """Check `resolvedVersion` against the manifest the pinned commit contains."""
    if not clone_dir.is_dir():
        return VersionCheck("unverified", detail=f"nothing materialised at {clone_dir.name!r}")

    found = [
        (fname, *_manifest_facts(fname, clone_dir, clone_dir))
        for fname in MANIFEST_FILES
        if (clone_dir / fname).is_file()
    ]

    if not found:
        return VersionCheck(
            "unverified",
            detail=f"no manifest ({', '.join(MANIFEST_FILES)}) at {clone_dir.name}",
        )

    warnings: list[str] = []
    for fname, version, name in found:
        if name and e.name and _norm_name(name) != _norm_name(e.name):
            warnings.append(f"{fname} declares name {name!r}, lock.json says {e.name!r}")

    for fname, version, _ in found:
        if version and versions_match(e.resolved_version, version):
            return VersionCheck("ok", fname, version, warnings=warnings)

    known = [f for f in found if f[1]]
    if not known:
        return VersionCheck(
            "unverified",
            found[0][0],
            detail=f"{found[0][0]} has no static version field (dynamic/inherited)",
        )
    fname, version, _ = known[0]
    return VersionCheck(
        "mismatch",
        fname,
        version,
        detail=f"{fname} declares {version!r}, lock.json pins {e.resolved_version!r}",
        warnings=warnings,
    )


def _norm_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


# --------------------------------------------------------------------------------------
# AGENTS.md block
# --------------------------------------------------------------------------------------


def rel(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def render_agents_block(entries: list[Entry]) -> str:
    """The managed section, delimited by the markers so `sync` can replace it in place."""
    lines = [BLOCK_HEAD, "## Cloned Dependency Source", "", BLOCK_INTRO, ""]
    if not entries:
        lines.append("No dependency sources are pinned yet.")
    else:
        lines += ["| Dependency | Version | Path |", "| --- | --- | --- |"]
        for e in sorted(entries, key=lambda x: x.name.lower()):
            lines.append(f"| `{e.name}` | `{e.resolved_version}` | `{e.source_path()}` |")
    lines += ["", BLOCK_TAIL]
    return "\n".join(lines) + "\n"


_BLOCK_RE = re.compile(
    r"\n*<!--\s*clonedeps\s+(?:head|haed)\s*-->.*?(?:<!--\s*clonedeps\s+tail\s*-->|\Z)\n*",
    re.DOTALL | re.IGNORECASE,
)


def merge_agents_text(current: str, block: str) -> str:
    """Replace the managed block and force it to the end of the file.

    Everything outside the markers is kept, and content that used to follow the block ends
    up above it - that is what "always last" means.
    """
    match = _BLOCK_RE.search(current)
    if match:
        pieces = (current[: match.start()], current[match.end() :])
    else:
        pieces = (current, "")
    rest = "\n\n".join(piece.strip("\n") for piece in pieces if piece.strip())
    return (rest + "\n\n" + block) if rest else block


def agents_file(root: Path, override: str | None) -> Path:
    if override:
        p = Path(override)
        return p if p.is_absolute() else root / p
    for name in ("AGENTS.md", "CLAUDE.md"):
        if (root / name).is_file():
            return root / name
    return root / "AGENTS.md"


def agents_block_is_current(path: Path, block: str) -> bool | None:
    if not path.is_file():
        return None
    return merge_agents_text(path.read_text(encoding="utf-8"), block) == path.read_text(encoding="utf-8")


def write_agents(root: Path, path: Path, block: str) -> bool:
    current = path.read_text(encoding="utf-8") if path.is_file() else ""
    merged = merge_agents_text(current, block)
    if merged == current:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(merged, encoding="utf-8", newline="\n")
    return True


def clones_are_ignored(root: Path) -> bool:
    """Ask git whether the clone tree is ignored (git handles nested .gitignore files,
    `.git/info/exclude` and global excludes)."""
    rc, _ = git(["-C", str(root), "check-ignore", "-q", f"{CLONEDEPS_DIR}/{REPOS_DIR}/_probe"])
    return rc == 0


# --------------------------------------------------------------------------------------
# state / sync
# --------------------------------------------------------------------------------------


@dataclass
class EntryState:
    entry: Entry
    clone_dir: Path
    status: str  # ok | unverified | missing | mismatch
    check: VersionCheck | None = None
    detail: str = ""
    warnings: list[str] = field(default_factory=list)


def inspect_entry(e: Entry, root: Path) -> EntryState:
    """Read the snapshot on disk. Offline: safe to run any time."""
    clone_dir = root / CLONEDEPS_DIR / REPOS_DIR / e.dir_name()
    st = EntryState(entry=e, clone_dir=clone_dir, status="ok")
    if not clone_dir.is_dir():
        st.status = "missing"
        st.detail = "not materialised yet - run `sync`"
        return st

    check = check_version(e, clone_dir)
    st.check = check
    st.warnings = check.warnings
    if check.status == "mismatch":
        if e.allow_version_drift:
            st.warnings = [*st.warnings, f"version drift allowed: {check.detail}"]
        else:
            st.status = "mismatch"
            st.detail = f'{check.detail} - update resolvedVersion, or add "allowVersionDrift": true'
    elif check.status == "unverified":
        st.status = "unverified"
        st.detail = check.detail
    return st


def print_state(root: Path, states: list[EntryState], agents: Path, agents_current: bool | None) -> None:
    """The report `state` prints, and the one `sync` ends with."""
    for s in states:
        e = s.entry
        print(f"  [{s.status}] {e.name} {e.resolved_version} @ {e.ref}")
        print(f"            read: {rel(root, s.clone_dir)}")
        if s.detail:
            print(f"            note: {s.detail}")
        for warning in s.warnings:
            print(f"            warn: {warning}")
    if not states:
        print("  entries:  none pinned")
    print(f"  agents:   {rel(root, agents)} " + ("in sync" if agents_current else "OUT OF DATE - run `sync`"))
    if not clones_are_ignored(root):
        print(f"  note:     add {CLONEDEPS_DIR}/{REPOS_DIR}/* to .gitignore")


def cmd_state(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    entries = load_lock(root)
    agents = agents_file(root, args.agents)
    states = [inspect_entry(e, root) for e in entries]

    print(f"clonedeps state - root: {root}")
    if not (root / CLONEDEPS_DIR / LOCK_NAME).is_file():
        print(f"  lock:     {CLONEDEPS_DIR}/{LOCK_NAME} does not exist - write it, then run `sync`")
    print_state(root, states, agents, agents_block_is_current(agents, render_agents_block(entries)))


def prune_clones(root: Path, entries: list[Entry], dry_run: bool) -> list[str]:
    """Drop clones that lock.json no longer lists."""
    keep = {e.dir_name() for e in entries}
    repos_dir = root / CLONEDEPS_DIR / REPOS_DIR
    removed: list[str] = []
    if repos_dir.is_dir():
        for child in sorted(repos_dir.iterdir()):
            if child.is_dir() and child.name not in keep:
                if not dry_run:
                    force_rmtree(child)
                removed.append(child.name)
    return removed


def cmd_sync(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    entries = load_lock(root)

    lock_path = root / CLONEDEPS_DIR / LOCK_NAME
    if not lock_path.is_file():
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path.write_text("[]\n", encoding="utf-8", newline="\n")
        print(f"created {rel(root, lock_path)} - add pinned entries, then run `sync` again")
    print(f"clonedeps sync - root: {root}")

    before = {e.index: inspect_entry(e, root) for e in entries}
    if args.dry_run:
        for e in entries:
            state = before[e.index]
            if state.status == "missing" or args.force:
                print(f"  {e.name}: would write into {rel(root, state.clone_dir)}")
            else:
                print(f"  {e.name}: already materialised")
        for name in prune_clones(root, entries, dry_run=True):
            print(f"  {name}: would prune")
        print("  nothing written")
        return

    for i, e in enumerate(entries, 1):
        state = before[e.index]
        print(f"[{i}/{len(entries)}] {e.name} {e.resolved_version} @ {e.ref}")
        if args.force or state.status == "missing":
            sha, note = materialize(e, state.clone_dir, args.verbose)
            print(f"      wrote {e.package_path or 'the repository'} at {sha[:12]} ({note})")
        else:
            print("      already materialised")

    for name in prune_clones(root, entries, dry_run=False):
        print(f"  pruned: {name}")

    agents = agents_file(root, args.agents)
    changed = write_agents(root, agents, render_agents_block(entries))
    print(f"  {rel(root, agents)} " + ("updated" if changed else "already up to date"))

    states = [inspect_entry(e, root) for e in entries]
    print_state(root, states, agents, agents_block_is_current(agents, render_agents_block(entries)))


def resolve_root(explicit: str | None) -> Path:
    if explicit:
        return Path(explicit).expanduser().resolve()
    cwd = Path.cwd().resolve()
    # A .agents/clonedeps directory identifies the owning project even in a monorepo of
    # projects; fall back to the nearest .git so `sync` also works from a subdirectory.
    for d in [cwd, *cwd.parents]:
        if (d / CLONEDEPS_DIR).exists():
            return d
    for d in [cwd, *cwd.parents]:
        if (d / ".git").exists():
            return d
    return cwd


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        prog="clonedeps",
        description="Pin third-party dependency sources into .agents/clonedeps/repos/ and keep AGENTS.md in sync.",
    )
    sub = ap.add_subparsers(dest="command", required=True)

    p_state = sub.add_parser("state", help="report what lock.json pins vs what is on disk")
    p_state.add_argument("--root", help="project root (default: nearest ancestor with .agents/clonedeps/ or .git/)")
    p_state.add_argument("--agents", help="AGENTS.md to manage (default: AGENTS.md, else CLAUDE.md)")
    p_state.set_defaults(func=cmd_state)

    p_sync = sub.add_parser("sync", help="clone/refresh every locked entry and rewrite AGENTS.md")
    p_sync.add_argument("--root", help="project root (default: nearest ancestor with .agents/clonedeps/ or .git/)")
    p_sync.add_argument("--agents", help="AGENTS.md to manage (default: AGENTS.md, else CLAUDE.md)")
    p_sync.add_argument("--force", action="store_true", help="re-clone every entry")
    p_sync.add_argument("--dry-run", action="store_true", help="print the plan and write nothing")
    p_sync.add_argument("--verbose", action="store_true", help="print git's own error output when a fallback fetch fails")
    p_sync.set_defaults(func=cmd_sync)
    return ap


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
