import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/// Node-only: shared by `scripts/build-icons.ts` and `icons.test.ts` so the
/// generator and the guard cannot disagree about what "used" means.

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

/// Every `lucide:*` name referenced anywhere under `root`, sorted.
export function usedIcons(root: string): string[] {
  const names = new Set<string>()
  for (const file of walk(root)) {
    if (!/\.(?:svelte|ts)$/.test(file)) continue
    for (const [, name] of readFileSync(file, 'utf8').matchAll(/lucide:([a-z0-9-]+)/g)) {
      names.add(name!)
    }
  }
  return [...names].sort()
}
