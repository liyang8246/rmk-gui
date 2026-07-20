#!/usr/bin/env python3
import shutil, subprocess, tempfile
from pathlib import Path

URL, BRANCH = "https://github.com/HaoboGu/rmk.git", "feat/rynk"
WASM_OUT = Path(__file__).resolve().parent.parent / "src" / "rynk" / "wasm"

work = Path(tempfile.gettempdir()) / "rmk-wasm-build"
shutil.rmtree(work, ignore_errors=True)
subprocess.run(["git", "clone", "--depth", "1", "--branch", BRANCH, URL, str(work)], check=True)
subprocess.run(["wasm-pack", "build", "--target", "web", "--release", str(work / "rynk" / "rynk-wasm")], check=True)
WASM_OUT.mkdir(parents=True, exist_ok=True)
shutil.copytree(work / "rynk" / "rynk-wasm" / "pkg", WASM_OUT, dirs_exist_ok=True)
shutil.rmtree(work, ignore_errors=True)

