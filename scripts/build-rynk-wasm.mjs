// Build rynk-wasm from source and copy artifacts into src/rynk/wasm/.
//
// Usage:
//   node scripts/build-rynk-wasm.mjs           — build + copy
//   node scripts/build-rynk-wasm.mjs --fetch    — git-pull rmk first
//
// Prerequisites:
//   rustup target add wasm32-unknown-unknown
//   cargo install wasm-pack

import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const clonedepsRoot = join(root, '.slim', 'clonedeps', 'repos', 'HaoboGu__rmk')
const rynkWasmDir = join(clonedepsRoot, 'rynk', 'rynk-wasm')
const pkgDir = join(rynkWasmDir, 'pkg')
const outDir = join(root, 'src', 'rynk', 'wasm')

const RYNK_REMOTE_URL = 'https://github.com/HaoboGu/rmk.git'
const RYNK_BRANCH = 'feat/rynk_protocol'

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', ...opts })
}

function pullRmk() {
  if (!existsSync(clonedepsRoot)) {
    console.log('[1/3] Cloning rmk repo…')
    run(`git clone --depth 1 --branch ${RYNK_BRANCH} ${RYNK_REMOTE_URL} "${clonedepsRoot}"`)
    return
  }
  console.log('[1/3] Updating rmk repo…')
  run(`git -C "${clonedepsRoot}" fetch origin ${RYNK_BRANCH}`)
  run(`git -C "${clonedepsRoot}" checkout ${RYNK_BRANCH}`)
  run(`git -C "${clonedepsRoot}" reset --hard origin/${RYNK_BRANCH}`)
}

function getCommit() {
  return execSync(`git -C "${clonedepsRoot}" rev-parse --short HEAD`).toString().trim()
}

function buildWasm() {
  console.log('[2/3] Building rynk-wasm…')
  // Clean pkg dir so stale artifacts don't survive.
  if (existsSync(pkgDir)) rmSync(pkgDir, { recursive: true, force: true })
  run('wasm-pack build --target web --release', { cwd: rynkWasmDir })
}

function copyArtifacts() {
  console.log('[3/3] Copying artifacts…')
  mkdirSync(outDir, { recursive: true })

  // Remove old artifacts (but keep the directory).
  for (const f of ['rynk_wasm.js', 'rynk_wasm.d.ts', 'rynk_wasm_bg.wasm'])
    rmSync(join(outDir, f), { force: true })

  // Copy the three files Vite needs.
  cpSync(join(pkgDir, 'rynk_wasm.js'), join(outDir, 'rynk_wasm.js'))
  cpSync(join(pkgDir, 'rynk_wasm.d.ts'), join(outDir, 'rynk_wasm.d.ts'))
  cpSync(join(pkgDir, 'rynk_wasm_bg.wasm'), join(outDir, 'rynk_wasm_bg.wasm'))

  // Write a version manifest so the build is traceable.
  const manifest = {
    commit: getCommit(),
    branch: RYNK_BRANCH,
    builtAt: new Date().toISOString(),
  }
  import('node:fs').then(({ writeFileSync }) =>
    writeFileSync(join(outDir, '.build-meta.json'), `${JSON.stringify(manifest, null, 2)}\n`),
  )

  console.log(`\nDone. Artifacts in src/rynk/wasm/ (from commit ${manifest.commit}).`)
}

function main() {
  const shouldFetch = process.argv.includes('--fetch')

  if (shouldFetch) {
    pullRmk()
  }
  else if (!existsSync(clonedepsRoot)) {
    console.error('rmk repo not found. Run with --fetch to clone it first.')
    process.exit(1)
  }

  buildWasm()
  copyArtifacts()
}

main()
