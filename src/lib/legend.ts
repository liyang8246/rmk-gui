import type { Action, KeyAction } from '../rynk'
import { match, P } from 'ts-pattern'
import { actionLabel, hidLabel, hidLegend, humanize, modifierLabel } from './keycode'

/// Which of the design's keycap tints a binding wears. `base` is a plain key.
export type Tint = 'base' | 'mod' | 'layer' | 'macro' | 'wireless' | 'trns'

export interface CapLegend {
  main: string
  /// Second, smaller line: the hold target, the layer, or the modifier set.
  tag?: string
  tint: Tint
}

const MODIFIER_KEY = /^[LR](?:Ctrl|Shift|Alt|Gui)$/
/// The codes the design tints blue — they change how the board talks to a host,
/// so they read as transport keys rather than as keys that type something.
const TRANSPORT_KEY = /^System(?:Power|Sleep|Wake)$/
const TRANSPORT_CONTROL = /^(?:Bootloader|Reboot|Output)/

/// Layer ops split across two lines on the cap: the mnemonic, then the target.
function layerLegend(op: string, layer: number): CapLegend {
  return { main: op, tag: `L${layer}`, tint: 'layer' }
}

/// Only the families that carry a second line or a tint are named here; anything
/// else — including a variant the firmware gains later — falls through to
/// `actionLabel` as a plain, single-line cap, which is the right default.
function actionLegend(action: Action): CapLegend {
  return match(action)
    .with({ LayerOn: P.select() }, l => layerLegend('MO', l))
    .with({ LayerOnWithModifier: P.select() }, ([l]) => layerLegend('MO', l))
    .with({ LayerOff: P.select() }, l => layerLegend('LOFF', l))
    .with({ LayerToggle: P.select() }, l => layerLegend('TG', l))
    .with({ LayerToggleOnly: P.select() }, l => layerLegend('TO', l))
    .with({ DefaultLayer: P.select() }, l => layerLegend('DF', l))
    .with({ PersistentDefaultLayer: P.select() }, l => layerLegend('PDF', l))
    .with({ OneShotLayer: P.select() }, l => layerLegend('OSL', l))
    .with('TriLayerLower', () => ({ main: 'TriLower', tint: 'layer' as const }))
    .with('TriLayerUpper', () => ({ main: 'TriUpper', tint: 'layer' as const }))
    .with({ TriggerMacro: P.select() }, m => ({ main: `M${m}`, tint: 'macro' as const }))
    .with({ Modifier: P.select() }, m => ({ main: modifierLabel(m), tint: 'mod' as const }))
    .with({ KeyWithModifier: P.select() }, ([k, m]) => ({
      main: hidLabel(k),
      tag: modifierLabel(m),
      tint: 'mod' as const,
    }))
    .with({ OneShotModifier: P.select() }, m => ({ main: 'OSM', tag: modifierLabel(m), tint: 'mod' as const }))
    .with({ OneShotKey: P.select() }, k => ({ main: 'OSK', tag: hidLabel(k), tint: 'mod' as const }))
    .with({ Key: { Hid: P.select() } }, (code) => {
      const { label, qualifier } = hidLegend(code)
      const modifier = MODIFIER_KEY.test(code)
      return {
        main: label,
        // A modifier's side is obvious from where it sits on the board, so the
        // cap drops that qualifier and keeps the rest.
        tag: modifier ? undefined : qualifier,
        tint: (modifier ? 'mod' : TRANSPORT_KEY.test(code) ? 'wireless' : 'base') as Tint,
      }
    })
    .with({ KeyboardControl: P.select() }, c => ({
      main: humanize(c),
      tint: (TRANSPORT_CONTROL.test(c) ? 'wireless' : 'base') as Tint,
    }))
    .otherwise(a => ({ main: humanize(actionLabel(a)), tint: 'base' as const }))
}

export function capLegend(action: KeyAction): CapLegend {
  return match(action)
    .with('No', () => ({ main: '✕', tint: 'trns' as const }))
    .with('Transparent', () => ({ main: '▽', tint: 'trns' as const }))
    .with({ Single: P.select() }, actionLegend)
    .with({ Tap: P.select() }, a => ({ ...actionLegend(a), tag: 'tap' }))
    // A hold-tap reads as its tap key, with the hold target underneath — the
    // shape the design gives LT(n, key) and MT(mod, key).
    .with({ TapHold: P.select() }, ([tap, hold]) => {
      const held = actionLegend(hold)
      return { main: actionLegend(tap).main, tag: held.tag ? `${held.main}${held.tag}` : held.main, tint: held.tint }
    })
    .with({ Morse: P.select() }, m => ({ main: 'Morse', tag: String(m), tint: 'macro' as const }))
    .exhaustive()
}

/// A multi-word legend wraps, so what has to fit the width is its longest word,
/// not the whole string: `Caps Word Toggle` needs room for `Toggle`, not for all
/// sixteen characters.
function longestWord(text: string): number {
  return Math.max(...text.split(' ').map(w => w.length))
}

/// Cap type scales down as the legend gets longer, so a 6-character binding
/// still fits a 1u key. Sizes are the design's fractions of the key unit.
export function capFontSize(text: string, unit: number): number {
  const n = longestWord(text)
  if (n <= 1) return Math.round(unit * 0.3)
  if (n <= 2) return Math.round(unit * 0.24)
  if (n <= 4) return Math.round(unit * 0.19)
  return Math.round(unit * 0.15)
}

/// Three steps, never a continuous ramp: legends of similar length should look
/// identical, and only a genuinely long one should drop a size.
export type LabelSize = 'lg' | 'md' | 'sm'

export function labelSize(text: string): LabelSize {
  const n = longestWord(text)
  // A wrapped label needs room for its other lines too, so `MO 0` and `Vol +`
  // stay at the middle size rather than jumping to the largest on a short word.
  if (n <= 2 && !text.includes(' ')) return 'lg'
  if (n <= 5) return 'md'
  return 'sm'
}
