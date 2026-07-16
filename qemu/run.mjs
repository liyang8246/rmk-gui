#!/usr/bin/env node
// Build the RISC-V firmware, start QEMU with Rynk UART on tcp:7965.
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const dir = dirname(fileURLToPath(import.meta.url))
const elf = join(dir, "target/riscv32imac-unknown-none-elf/debug/rmk-qemu-riscv")

await new Promise((r, f) =>
  spawn("cargo", ["build"], { cwd: dir, stdio: "inherit" })
    .on("exit", (c) => (c ? f(new Error(`cargo exited ${c}`)) : r()))
    .on("error", f))

const q = spawn("qemu-system-riscv32", [
  "-M", "virt", "-cpu", "rv32", "-semihosting", "-nographic", "-bios", "none",
  "-kernel", elf, "-serial", "tcp::7965,server,nowait",
], { stdio: "inherit" })
  .on("exit", (c) => process.exit(c ?? 0))

process.on("SIGINT", () => q.kill("SIGTERM"))
process.on("SIGTERM", () => q.kill("SIGTERM"))
