import type { IconifyJSON } from '@iconify/svelte'
import { addCollection } from '@iconify/svelte'
import icons from './icons.json'

/// Without this, `@iconify/svelte` resolves every icon over the network from
/// api.iconify.design — so a desktop build renders no icons offline, and Tauri's
/// CSP blocks the request outright. `pnpm build:icons` regenerates the subset.
export function registerIcons() {
  addCollection(icons as IconifyJSON)
}
