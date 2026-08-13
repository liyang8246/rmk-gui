#!/usr/bin/env python3
import os, shutil, subprocess, sys, tempfile
from pathlib import Path

# Keep REV in step with the rmk pins in qemu/Cargo.toml and src-tauri/Cargo.toml —
# firmware and wasm client must come from one protocol commit.
URL, REV = "https://github.com/rmk-rs/rmk.git", "0fd8785d669d2139d0a0b75f2441a4d4b463b01a"
ROOT = Path(__file__).resolve().parent.parent
WASM_OUT = ROOT / "src" / "rynk" / "wasm"

def has_rynk(repo):
    return (repo / "rynk" / "rynk-wasm" / "Cargo.toml").is_file()

# Prefer a local checkout so edits to rynk land here without a push; CI has neither and clones.
def resolve_repo():
    env = os.environ.get("RMK_REPO")
    if env:
        repo = Path(env).expanduser().resolve()
        if not has_rynk(repo):
            sys.exit(f"RMK_REPO={repo} has no rynk/rynk-wasm/Cargo.toml")
        return repo, False
    sibling = ROOT.parent / "rmk"
    if has_rynk(sibling):
        return sibling, False
    work = Path(tempfile.mkdtemp(prefix="rmk-wasm-"))
    # fetch, not clone: `clone --branch` takes a ref, never a sha.
    subprocess.run(["git", "init", "-q", str(work)], check=True)
    subprocess.run(["git", "-C", str(work), "fetch", "-q", "--depth", "1", URL, REV], check=True)
    subprocess.run(["git", "-C", str(work), "checkout", "-q", "FETCH_HEAD"], check=True)
    return work, True

repo, temporary = resolve_repo()
print(f"building rynk-wasm from {repo}")
# `vial` compiles the Vial host client in next to the rynk one, so the GUI can
# also drive keyboards on the legacy protocol.
subprocess.run(
    ["wasm-pack", "build", "--target", "web", "--release", str(repo / "rynk" / "rynk-wasm"), "--features", "vial"],
    check=True,
)
shutil.rmtree(WASM_OUT, ignore_errors=True)
shutil.copytree(repo / "rynk" / "rynk-wasm" / "pkg", WASM_OUT)
if temporary:
    shutil.rmtree(repo, ignore_errors=True)
