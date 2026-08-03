import { fileURLToPath, URL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { usedIcons } from '../../scripts/icon-scan'
import icons from './icons.json'

const SRC = fileURLToPath(new URL('..', import.meta.url))

describe('icons.json', () => {
  /// The bundled subset is generated, so it can fall behind the source. Icons it
  /// misses are silently fetched from api.iconify.design at runtime, which fails
  /// offline and under Tauri's CSP — so a stale subset has to fail here instead.
  it('covers every lucide icon the app references', () => {
    const missing = usedIcons(SRC).filter(name => !(name in icons.icons))
    expect(missing, 'run `pnpm build:icons`').toEqual([])
  })

  it('carries no icon the app stopped using', () => {
    const used = new Set(usedIcons(SRC))
    expect(Object.keys(icons.icons).filter(name => !used.has(name))).toEqual([])
  })
})
