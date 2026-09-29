#!/usr/bin/env python3
import shutil, subprocess, tempfile
from pathlib import Path

URL, BRANCH = "https://github.com/rmk-rs/rmk.git", "main"
ROOT = Path(__file__).resolve().parent.parent
WASM_OUT = ROOT / "app" / "rynk" / "wasm"

work = Path(tempfile.mkdtemp(prefix="rmk-wasm-"))
try:
    subprocess.run(["git", "clone", "--depth", "1", "--branch", BRANCH, URL, str(work)], check=True)
    subprocess.run(["wasm-pack", "build", "--target", "web", "--release", str(work / "rynk" / "rynk-wasm")], check=True)
    shutil.rmtree(WASM_OUT, ignore_errors=True)
    shutil.copytree(work / "rynk" / "rynk-wasm" / "pkg", WASM_OUT)
    keep = {"package.json", "README.md", ".gitignore"}
    for f in WASM_OUT.iterdir():
        if f.name not in keep and not f.name.startswith("rynk_wasm"):
            f.unlink()
finally:
    for f in work.rglob("*"):
        f.chmod(0o777)
    shutil.rmtree(work, ignore_errors=True)
