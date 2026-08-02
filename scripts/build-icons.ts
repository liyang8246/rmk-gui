// Regenerates src/lib/icons.json — the icons the app actually references.
//
// The full lucide collection is 1800 icons; the app uses a few dozen, and JSON
// cannot be tree-shaken, so importing the whole thing would ship all of it.
// icons.test.ts fails if this file falls behind the source.
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { usedIcons } from './icon-scan.ts'

const SRC = fileURLToPath(new URL('../src', import.meta.url))
const OUT = fileURLToPath(new URL('../src/lib/icons.json', import.meta.url))
const COLLECTION = fileURLToPath(
  new URL('../node_modules/@iconify-json/lucide/icons.json', import.meta.url),
)

interface Collection {
  prefix: string
  icons: Record<string, unknown>
  width?: number
  height?: number
}

const full = JSON.parse(readFileSync(COLLECTION, 'utf8')) as Collection
const used = usedIcons(SRC)
const missing = used.filter(name => !full.icons[name])
if (missing.length) {
  console.error(`not in @iconify-json/lucide: ${missing.join(', ')}`)
  process.exitCode = 1
}

const subset = {
  prefix: full.prefix,
  icons: Object.fromEntries(used.filter(n => full.icons[n]).map(n => [n, full.icons[n]])),
  width: full.width,
  height: full.height,
}
writeFileSync(OUT, `${JSON.stringify(subset, null, 2)}\n`)
console.log(`wrote ${used.length} icons to src/lib/icons.json`)
