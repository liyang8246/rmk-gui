#!/usr/bin/env python3
import io, os, shutil, subprocess, sys, tarfile, tempfile, urllib.request
from pathlib import Path

# Keep VERSION in step with the rynk versions in qemu/Cargo.toml and
# src-tauri/Cargo.toml — firmware and wasm client must come from one protocol
# release (all rynk crates of a release train share a version).
VERSION = "0.3.0"
ROOT = Path(__file__).resolve().parent.parent
WASM_OUT = ROOT / "src" / "rynk" / "wasm"

def has_rynk(repo):
    return (repo / "rynk" / "rynk-wasm" / "Cargo.toml").is_file()

# Prefer a local checkout so edits to rynk land here without a push; CI has
# none and builds the published crates.io source.
def resolve_src():
    env = os.environ.get("RMK_REPO")
    if env:
        repo = Path(env).expanduser().resolve()
        if not has_rynk(repo):
            sys.exit(f"RMK_REPO={repo} has no rynk/rynk-wasm/Cargo.toml")
        return repo / "rynk" / "rynk-wasm", None
    sibling = ROOT.parent / "rmk"
    if has_rynk(sibling):
        return sibling / "rynk" / "rynk-wasm", None
    work = Path(tempfile.mkdtemp(prefix="rynk-wasm-"))
    url = f"https://static.crates.io/crates/rynk-wasm/rynk-wasm-{VERSION}.crate"
    with urllib.request.urlopen(url) as resp:
        tarfile.open(fileobj=io.BytesIO(resp.read()), mode="r:gz").extractall(work, filter="data")
    return work / f"rynk-wasm-{VERSION}", work

src, work = resolve_src()
print(f"building rynk-wasm from {src}")
subprocess.run(["wasm-pack", "build", "--target", "web", "--release", str(src)], check=True)
shutil.rmtree(WASM_OUT, ignore_errors=True)
shutil.copytree(src / "pkg", WASM_OUT)
if work:
    shutil.rmtree(work, ignore_errors=True)
