/* eslint-disable antfu/no-top-level-await */
/* eslint-disable node/prefer-global/process */

import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const dir = dirname(fileURLToPath(import.meta.url))
const elf = join(dir, "target/riscv32imac-unknown-none-elf/release/rmk-qemu-riscv")

await new Promise((r, f) =>
  spawn("cargo", ["build", "--release"], { cwd: dir, stdio: "inherit" })
    .on("exit", (c) => (c ? f(new Error(`cargo exited ${c}`)) : r()))
    .on("error", f))

const q = spawn("qemu-system-riscv32", [
  "-M", "virt", "-cpu", "rv32", "-semihosting", "-nographic", "-bios", "none",
  "-kernel", elf, "-serial", "tcp::7965,server,nowait",
], { stdio: "inherit" })
  .on("exit", (c) => process.exit(c ?? 0))

process.on("SIGINT", () => q.kill("SIGTERM"))
process.on("SIGTERM", () => q.kill("SIGTERM"))
