# /// script
# requires-python = ">=3.11"
# ///
"""Run the riscv fixture firmware in QEMU, serial over TCP."""

import subprocess, sys
from pathlib import Path

DIR = Path(__file__).resolve().parent

# Extra args go to cargo, e.g. `uv run qemu/run.py --features locked`.
rc = subprocess.run(["cargo", "build", "--release", *sys.argv[1:]], cwd=DIR).returncode
if rc:
    sys.exit(rc)

sys.exit(subprocess.run([
    "qemu-system-riscv32", "-M", "virt", "-cpu", "rv32", "-semihosting",
    "-nographic", "-bios", "none",
    "-kernel", str(DIR / "target/riscv32imac-unknown-none-elf/release/rmk-qemu-riscv"),
    "-serial", "tcp::7965,server,nowait",
]).returncode)
