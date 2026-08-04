/* eslint-disable antfu/no-top-level-await */
/* eslint-disable node/prefer-global/process */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const elf = join(dir, 'target/riscv32imac-unknown-none-elf/release/rmk-qemu-riscv')
// smoke.test.ts allocates a free port so a stray listener cannot be dialled by
// mistake, and two checkouts can run their fixtures side by side.
const port = process.env.RMK_QEMU_PORT ?? '7965'

const RMK_GIT = 'https://github.com/rmk-rs/rmk.git'

/// Same resolution order as scripts/build-rynk-wasm.py. The firmware and the
/// wasm client speak one protocol, so they must come from one rmk revision —
/// letting cargo resolve `branch = "main"` on its own can drift them apart.
function rmkRepo() {
  const env = process.env.RMK_REPO
  if (env) return resolve(env)
  const sibling = resolve(dir, '../../rmk')
  return existsSync(join(sibling, 'rynk/rynk-wasm/Cargo.toml')) ? sibling : null
}

const repo = rmkRepo()
if (repo) console.log(`patching rmk to ${repo}`)
// JSON.stringify escapes the path into a TOML basic string.
const patch = (repo ? ['rmk', 'rmk-config'] : []).flatMap(crate => [
  '--config',
  `patch.${JSON.stringify(RMK_GIT)}.${crate}.path=${JSON.stringify(join(repo, crate))}`,
])

// Extra args go to cargo, e.g. `pnpm qemu --features locked`.
const cargoArgs = ['build', '--release', ...patch, ...process.argv.slice(2)]

await new Promise((r, f) =>
  spawn('cargo', cargoArgs, { cwd: dir, stdio: 'inherit' })
    .on('exit', c => (c ? f(new Error(`cargo exited ${c}`)) : r()))
    .on('error', f))

const q = spawn('qemu-system-riscv32', [
  '-M',
  'virt',
  '-cpu',
  'rv32',
  '-semihosting',
  '-nographic',
  '-bios',
  'none',
  '-kernel',
  elf,
  '-serial',
  `tcp::${port},server,nowait`,
], { stdio: 'inherit' })
  .on('exit', c => process.exit(c ?? 0))

process.on('SIGINT', () => q.kill('SIGTERM'))
process.on('SIGTERM', () => q.kill('SIGTERM'))
