# Ark UI + Tailwind CSS: Styling Deep Dive

A deep dive into styling Ark UI components with Tailwind CSS. Ark ships zero styles — every visual is yours. This reference covers the data-attribute state model, per-part class distribution, `cva` variants, `tailwind-merge` conflict resolution, animation recipes, z-index layering, and three complete styled examples (Accordion, Dialog, Menu). It assumes working Tailwind knowledge and zero Ark UI knowledge.

→ For the body overview, see §5 The Styling API and §6 Tailwind CSS Integration in SKILL.md.
→ For the machine model that produces the data attributes styled here, see `references/core-concepts.md`.
→ For Solid reactivity rules around `class` and props, see `references/solid-integration.md`.
→ For more component recipes beyond the three styled here, see `references/component-cookbook.md`.

---

## Table of Contents

1. [The Styling Contract Recap](#the-styling-contract-recap)
2. [Data-Attribute State Styling](#data-attribute-state-styling)
3. [Class Distribution](#class-distribution)
4. [Variants with cva](#variants-with-cva)
5. [Merging with tailwind-merge](#merging-with-tailwind-merge)
6. [Animation Recipes](#animation-recipes)
7. [Z-Index and Layering](#z-index-and-layering)
8. [Styled Example: Accordion](#styled-example-accordion)
9. [Styled Example: Dialog](#styled-example-dialog)
10. [Styled Example: Menu](#styled-example-menu)
11. [Pre-Styled Ecosystem](#pre-styled-ecosystem)

---

## The Styling Contract Recap

Ark styling rests on three pillars. The body covers them in §5; this reference goes deeper on the mechanics.

1. **Classes attach per part.** Every anatomy part (`Root`, `Trigger`, `Content`, `Item`, `Indicator`, ...) accepts `class` (Solid/Vue/Svelte) or `className` (React). There is no single "component class" that fans out to all parts — you style each part where it is rendered.
2. **State reaches the DOM as data attributes, not toggled classes.** Ark writes `data-scope`, `data-part`, and `data-state` on each element, plus boolean data attributes for transient interaction states. You never see `is-open` or `active` — writing `.is-open { ... }` matches nothing.
3. **You scope state with attribute selectors.** In plain CSS that is `[data-state='open']`; in Tailwind it is the arbitrary-value variant `data-[state=open]:`.

A rendered Accordion item in the DOM:

```html
<div data-scope="accordion" data-part="item" data-state="open">
  <h3>
    <button data-scope="accordion" data-part="item-trigger" data-state="open" data-focus-visible>
      Section 1
      <span data-scope="accordion" data-part="item-indicator" data-state="open">▾</span>
    </button>
  </h3>
  <div data-scope="accordion" data-part="item-content" data-state="open">…</div>
</div>
```

- `data-scope` — which component (`accordion`, `dialog`, `select`). Rarely targeted in Tailwind; useful for global resets like `[data-scope='dialog'] { ... }`.
- `data-part` — which anatomy piece (`item`, `trigger`, `content`). Mostly you style per-part by attaching `class` directly, so you rarely select on it. It helps when one stylesheet rule should apply to a part regardless of component.
- `data-state` — enumerated machine state. See the table below.

**Why data attributes over class hooks:** they are semantic — they describe *state*, not styling. `[data-state=open]` reads as "when this is open" regardless of which utility follows. One element can carry several independent states at once (`data-state=open data-focus data-focus-visible`) without class-name combinatorics, and without Ark having to know your class names.

→ For the contract statement in the body, see §5 The Styling API in SKILL.md.

---

## Data-Attribute State Styling

This is the core technique. Ark emits two *kinds* of data attribute, and conflating them is the most common styling mistake — get the distinction first.

### Enumerated vs boolean

- **Enumerated: `data-state` takes a string value** — `open`, `closed`, `checked`, `unchecked`. Target it *with* the value: `data-[state=open]:`. These are stable machine states that persist (a dialog stays `open` until closed).
- **Boolean: the attribute is present or absent, no value** — `data-focus`, `data-focus-visible`, `data-highlighted`, `data-selected`, `data-disabled`, `data-invalid`. Target it *without* a value: `data-[highlighted]:`. Do **not** write `data-[highlighted=true]:` — the attribute carries no value, so that selector never matches.

**Not:** `data-[state=open]` for a focus state, or `data-[focus=true]` for focus. The first targets the wrong attribute; the second targets a value that does not exist. The two kinds look similar in Tailwind but match different DOM shapes.

### The attribute map

**Note:** part attribution is representative — confirm which part emits each attribute on the component's data-attributes section of ark-ui.com.

| Attribute | Kind | Emitted by (representative parts) | Tailwind selector | Typical use |
|-----------|------|-----------------------------------|-------------------|-------------|
| `data-state="open"` | enumerated | Dialog/Popover/Tooltip/Menu/Select/Combobox `Content`; Accordion/Collapsible `Item` and child parts | `data-[state=open]:` | show content, rotate indicator, enter animation |
| `data-state="closed"` | enumerated | same parts as above | `data-[state=closed]:` | hide content, exit animation |
| `data-state="checked"` | enumerated | Checkbox/Switch/RadioGroup `Control` and `Indicator` | `data-[state=checked]:` | show check mark, tint control |
| `data-state="unchecked"` | enumerated | Checkbox/Switch `Control` | `data-[state=unchecked]:` | hide check mark, neutral tint |
| `data-focus` | boolean | any focusable part (`Trigger`, `Item`, `Input`) | `data-[focus]:` | focus ring (mouse or keyboard) |
| `data-focus-visible` | boolean | focusable parts, keyboard focus only | `data-[focus-visible]:` | keyboard-only ring — the accessible choice |
| `data-highlighted` | boolean | `Menu.Item`, `Select.Item`, `Combobox.Item` | `data-[highlighted]:` | hover/keyboard-row highlight in lists |
| `data-selected` | boolean | `Tabs.Trigger`, `Select.Item`, `RadioGroup.Item` | `data-[selected]:` | active tab, chosen option |
| `data-disabled` | boolean | disabled parts (`Item`, `Trigger`) | `data-[disabled]:` | dim and disable pointer events |
| `data-invalid` | boolean | `Field` parts when the field is invalid | `data-[invalid]:` | red border, error styling on input |
| `data-dragging` | boolean | `Slider` `Thumb` (during drag) | `data-[dragging]:` | scale/enlarge thumb, accent the active handle |
| `data-has-value` | boolean | `Select`/`Combobox` `Trigger` (when a value is set) | `data-[has-value]:` | show clear button, style placeholder vs. value |

**Tip:** component-specific attributes exist beyond this map — check each component's docs.

**Why prefer `data-[focus-visible]` over `data-[focus]`:** `data-focus` fires for both mouse clicks and keyboard nav, so a ring on it flashes on every click and annoys mouse users. `data-focus-visible` fires only for keyboard focus, matching the browser's native `:focus-visible` heuristic. Use it for the visible ring; reserve `data-[focus]` for cases where you genuinely want mouse-focus feedback.

**Gotcha:** `data-highlighted` and `data-selected` differ. In a `Menu`, arrow-key navigation moves `data-highlighted` across items as you sweep; `data-selected` is not typically emitted by Menu items (menus are transient). In a `Select`/`Tabs` list, `data-selected` marks the chosen item and persists after the cursor leaves. Style `data-highlighted` for the transient row highlight; `data-selected` for the persistent "current value" treatment.

### Stacking variants

One class string can layer several attribute variants. Each is independent — `data-[state=open]` and `data-[focus-visible]` can both be active, and Tailwind generates a separate rule for each so neither cancels the other:

```tsx
<Accordion.ItemTrigger
  class="flex w-full items-center justify-between py-4 px-3
         data-[state=open]:bg-gray-50
         data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500
         data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
>
  …
</Accordion.ItemTrigger>
```

→ For where to attach these classes, see Class Distribution below.
→ For resolving conflicts when variants and cva combine, see Merging with tailwind-merge below.

---

## Class Distribution

Ark gives you no "component className" that propagates to all parts. Each part is its own element with its own `class`. This is deliberate: the parts have wildly different roles (a container vs. an overlay vs. a list row), so a shared class would be useless and a shared prop ambiguous. You distribute styling part by part.

### The recurring part roles

The same part names carry the same styling responsibilities across components. Learn the role once and it applies everywhere:

| Part | Role | Styling focus |
|------|------|---------------|
| `Root` | Container / state holder | layout shell, spacing, dividers — structural, rarely stateful |
| `Trigger` | Interactive toggle (button) | focus ring, hover, `data-[state=open]` affordance, disabled state |
| `Content` | Overlay body or panel body | background, padding, radius, shadow, enter/exit animation |
| `Item` | List row (Menu/Select/Accordion) | `data-[highlighted]`/`data-[selected]`/`data-[disabled]` row treatment |
| `Indicator` | Chevron, check mark, dot | `data-[state=open]` rotate / `data-[state=checked]` show |
| `Backdrop` | Click-to-close scrim (Dialog/Drawer) | `data-[state=open]` fade-in, fixed full-screen |
| `Positioner` | Placement + z-index container for overlays | positioning context, `--layer-index` z-index (see Z-Index and Layering) |
| `Label`/`Title`/`Description` | Text with ARIA wiring | typography only — do not skip these; they carry `aria-labelledby`/`aria-describedby` |

**Why style per part, not per component:** the `Trigger` of an Accordion and the `Trigger` of a Dialog share the *role* but live in different trees with different state. A shared `.trigger` class would force identical styling onto parts that need to differ. Per-part `class` lets each part carry exactly the styling its role demands, and lets you reuse the *pattern* (focus ring + hover + open-state) across components by copy, not by a brittle global class.

**Tip:** when the same class string repeats across components (every list item wants the same highlight treatment), extract it into a `cva` variant or shared constant — see Variants with cva below. Reach for a global CSS class only when repetition becomes a maintenance cost.

### The propagation exception: `Field`

`Field.Root` is the one place Ark *does* propagate: `invalid`, `disabled`, `required`, `readOnly` set on `Field.Root` flow down to nested inputs and set their `data-*` attributes. Style the input with `data-[invalid]:border-red-500` and it lights up when the field is invalid — set the flag once at the field level, not on every input. See §11 Forms in the body.

→ For the full anatomy of each component's parts, see `references/component-cookbook.md`.

---

## Variants with cva

When a part's class string grows past a few utilities, or when a part needs size/tone/variant axes, hand-rolled string concatenation breaks down. Use `class-variance-authority` (`cva`) to define a part's styles as a typed variant function.

### Why cva beats string concatenation

- **Composability** — variants compose orthogonally (size × tone) instead of one combinatorial `if/else` chain per combination.
- **Type safety** — `cva` generates a union type for the variant props, so `tone="dange"` is a compile error, not a silent no-op.
- **Default variants** — one place declares the fallback, so callers omit what they don't care about.
- **Mergeability** — the output is a plain class string, so it drops straight into a `twMerge` helper (see next section).

### A cva definition for Dialog.Content

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

export const dialogContent = cva(
  'rounded-xl shadow-xl p-6 w-full outline-none',   // base — part identity
  {
    variants: {
      size: {
        sm: 'max-w-sm p-4 text-sm',
        md: 'max-w-lg p-6',
        lg: 'max-w-2xl p-8 text-lg',
      },
      tone: {
        default: 'bg-white text-gray-900',
        danger: 'bg-red-50 text-red-900 border border-red-200',
      },
    },
    defaultVariants: { size: 'md', tone: 'default' },
  },
)

export type DialogContentProps = VariantProps<typeof dialogContent>
```

Consumed in the part:

```tsx
import { Dialog } from '@ark-ui/solid'

function StyledDialogContent(props: Dialog.ContentProps & DialogContentProps) {
  return (
    <Dialog.Content class={dialogContent({ size: props.size, tone: props.tone })}>
      {props.children}
    </Dialog.Content>
  )
}
```

**Why the base holds the structural utilities:** `rounded-xl shadow-xl p-6` are the part's identity — they belong in the base so every variant starts from the same skeleton. Size and tone are the axes that vary; putting `max-w-lg` in the base *and* `max-w-sm` in the `sm` variant is a conflict (`tailwind-merge` resolves it, but it's cleaner to let the variant own the property it varies — so `max-w-*` lives only in size variants).

### Putting data-state inside cva

You can embed `data-[state=…]` utilities directly in a cva variant — useful when a part's open-state treatment should be part of its typed API, not a caller concern:

```tsx
const accordionItem = cva('border-b border-gray-200 last:border-b-0', {
  variants: {
    emphasis: {
      subtle: 'data-[state=open]:bg-gray-50',
      strong: 'data-[state=open]:bg-blue-50 data-[state=open]:border-blue-200',
    },
  },
  defaultVariants: { emphasis: 'subtle' },
})
```

**Tip:** put `data-[state=…]` rules *inside* cva variants, not as caller overrides. That keeps the part's state contract in one typed place, and callers compose cleanly because the variant already knows how the part reacts to open/closed.

→ For merging these cva outputs with caller classes, see Merging with tailwind-merge below.
→ For the body's pointer to cva, see §6 Tailwind CSS Integration in SKILL.md.

---

## Merging with tailwind-merge

When Ark's runtime data attributes, your cva variants, and caller-supplied classes meet on one element, conflicts arise: two utilities setting `background`, or `padding`, or `max-width`. `tailwind-merge` (`twMerge`) resolves them by keeping the last meaningful one and dropping the rest — and it understands Tailwind's variant syntax, so it does not wrongly cancel a `data-[state=open]:bg-gray-50` against a plain `bg-white`.

### Why merge ordering matters

`twMerge` keeps the *last* class for any given property (respecting variant gates). So the order you feed classes determines the winner:

- **base** (part identity) first, then **variant** (cva output), then **caller override** last — so a caller's `max-w-3xl` beats the variant's `max-w-lg`.

Flip base and caller and the base wins, silently ignoring the override — the single most common "my override isn't applying" bug.

`twMerge` is variant-aware: a non-gated `bg-white` and a gated `data-[state=open]:bg-gray-50` are *not* conflicting (one applies always, the other conditionally) — both survive. But two gated utilities on the *same* state and property (`data-[state=open]:bg-gray-50 data-[state=open]:bg-blue-50`) do conflict, and the last wins. That is exactly the behavior you want.

### The cn() helper

Combine `clsx` (conditional joining) with `twMerge` (conflict resolution) into one helper. Put it in `lib/cn.ts` and use it everywhere:

```tsx
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### cva + cn together

Wire cva's `cn` option so every variant output passes through `twMerge`. Caller classes then compose safely:

```tsx
import { cva } from 'class-variance-authority'
import { cn } from '~/lib/cn'

export const dialogContent = cva(
  'rounded-xl shadow-xl p-6 w-full outline-none',
  { variants: { size: { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } },
    defaultVariants: { size: 'md' } },
  cn, // every variant string is merged with twMerge
)
```

A caller overrides cleanly — its `max-w-3xl` is appended last and wins:

```tsx
<Dialog.Content class={cn(dialogContent({ size: 'md' }), 'max-w-3xl')}>…</Dialog.Content>
```

**Gotcha:** without `twMerge`, `max-w-lg max-w-3xl` both land in the DOM and the winner is whichever CSS rule has higher specificity or comes later in the stylesheet — unpredictable across builds. `twMerge` makes "last argument wins" the rule, so overrides are deterministic.

**Not:** do not spread caller classes *before* the variant output (`cn('max-w-3xl', dialogContent())`). That puts the override first and the variant wins, silently ignoring the caller. Caller classes go last.

→ For the body's pointer to tailwind-merge, see §6 Tailwind CSS Integration in SKILL.md.

---

## Animation Recipes

Ark does not animate for you — it toggles `data-state` between `open` and `closed` (and `checked`/`unchecked`), and you animate on those states. There is no Ark animation preset; you define the keyframes and register the utilities yourself.

### The open/closed pair pattern

Pair an enter animation on `data-[state=open]` with an exit on `data-[state=closed]`. Both must be present, or the close transition snaps:

```tsx
<Dialog.Content class="… data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
```

For this to render, `animate-scale-in` / `animate-scale-out` must be real Tailwind utilities. Register them in your config.

### Registering animations

In Tailwind v4, config lives in CSS via `@theme`. Define keyframes in plain CSS and bind animation tokens with `--animate-*`:

```css
@import "tailwindcss";

@theme {
  --animate-fade-in:    fade-in 0.2s ease-out;
  --animate-fade-out:   fade-out 0.15s ease-in;
  --animate-scale-in:   scale-in 0.15s ease-out;
  --animate-scale-out:  scale-out 0.15s ease-in;
  --animate-slide-down: slide-down 0.2s ease-out;
  --animate-slide-up:   slide-up 0.15s ease-in;
}

@keyframes fade-in    { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-out   { from { opacity: 1; } to { opacity: 0; } }
@keyframes scale-in   { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes scale-out  { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
@keyframes slide-down { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slide-up   { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-4px); } }
```

In Tailwind v3, register the same keyframes and animations under `theme.extend.keyframes` and `theme.extend.animation` in `tailwind.config.js` — same names, same keyframe definitions, JS-object form.

### Recipe cheat sheet

| Effect | Class pair | Where |
|--------|-----------|-------|
| Backdrop fade | `data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out` | `Dialog.Backdrop`, `Drawer.Backdrop` |
| Content scale | `data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out` | `Dialog.Content`, `Popover.Content` |
| Accordion panel slide | `data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up` | `Accordion.ItemContent` |
| Indicator rotate | `data-[state=open]:rotate-180` | `Accordion.ItemIndicator`, `Select.Indicator` |
| Check mark pop | `data-[state=checked]:scale-100 data-[state=unchecked]:scale-0` | `Checkbox.Indicator` (with `transition-transform`) |

**Why rotate needs `transition-transform`:** `data-[state=open]:rotate-180` sets the end state, but without `transition-transform duration-200` on the same element the rotation snaps. The data-attribute variant sets the target; the transition utility makes the change smooth. Put the transition on the *base* (always-on), not gated on state, so it applies to both directions.

**Gotcha:** exit animations require the element to stay mounted while `data-state=closed` runs. Ark's `Presence` part handles this for overlays — keep `Content` inside the presence/portal lifecycle so the close animation plays before unmount. If the close snaps, you are unmounting too eagerly (check `unmountOnExit` placement — see `references/core-concepts.md` for the presence lifecycle).

→ For the body's animation pointer, see §6 Tailwind CSS Integration in SKILL.md.
→ For Presence lifecycle, see `references/core-concepts.md`.

---

## Z-Index and Layering

Nested overlays — a Dialog opened from inside a Menu opened from inside another Dialog — must stack correctly. Ark sets a `--layer-index` CSS variable on each overlay's `Positioner` that increments with nesting depth. Use it; do not hardcode `z-index`.

### The two approaches

**Approach 1 — consume the variable inline:**

```tsx
<Dialog.Positioner class="fixed inset-0 flex items-center justify-center z-[calc(1000+var(--layer-index,0))]">
```

The base `1000` lifts overlays above page content; `var(--layer-index,0)` adds the nesting offset so deeper stacks sit higher. The `0` fallback covers any element that did not receive a layer index.

**Approach 2 — a stylesheet rule:**

```css
[data-scope='dialog'][data-part='positioner'],
[data-scope='menu'][data-part='positioner'],
[data-scope='popover'][data-part='positioner'] {
  z-index: calc(1000 + var(--layer-index, 0));
}
```

This centralizes the rule so individual parts don't repeat the long arbitrary value.

### Why hardcoding breaks nested overlays

If you write `z-index: 9999` on every `Positioner`, the outer Dialog and the inner Dialog (opened from a Menu inside the outer) both get `9999`. The inner overlay is later in the DOM (portals append in open order), so it stacks above the outer by DOM order — until a third overlay renders earlier, or a tooltip inside the inner dialog needs to sit above the inner dialog's sibling. Hardcoding collapses stacking to a single plane and you lose to "whoever has the bigger magic number" contests.

`--layer-index` encodes nesting depth, so each level gets a strictly increasing z-index automatically: outer dialog `1000 + 0`, the menu it opens `1000 + 1`, the dialog that menu opens `1000 + 2`. No conflicts, no guesswork.

**Tip:** pick a base (`1000` here) comfortably above your app's highest non-overlay stacking context (sticky headers, sidebars). Too low and a sticky header peeks over your dialog; the base is the one number you choose deliberately.

**Gotcha:** `--layer-index` is set by Ark on the overlay's *positioning* element, not on `Content`. Apply the z-index utility to `Positioner` — `Content` is its child and inherits the stacking context. Applying it to `Content` instead leaves the `Backdrop` (a sibling of `Positioner` inside `Portal`) potentially stacking wrong.

→ For the body's z-index note, see §6 Tailwind CSS Integration in SKILL.md.
→ For portal/positioner anatomy, see §8 Portal, Presence, and Env in SKILL.md and `references/core-concepts.md`.

---

## Styled Example: Accordion

A complete, copy-paste Accordion in Solid + Tailwind. Covers `Root`, `Item`, `ItemTrigger`, `ItemIndicator`, `ItemContent` with open/closed animation and a rotating chevron.

```tsx
import { Accordion } from '@ark-ui/solid'

export function StyledAccordion() {
  const items = [
    { value: 'item-1', title: 'What is Ark UI?', body: 'A headless, accessible component library built on Zag.js state machines.' },
    { value: 'item-2', title: 'Is it styled?', body: 'No. Ark ships behavior and accessibility; you provide all styling via class per part.' },
    { value: 'item-3', title: 'Which frameworks?', body: 'React, Solid, Vue, and Svelte share identical APIs.' },
  ]

  return (
    <Accordion.Root defaultValue={['item-1']} collapsible
      class="w-full max-w-xl rounded-xl border border-gray-200 bg-white">
      <For each={items}>
        {(item) => (
          <Accordion.Item value={item.value}
            class="border-b border-gray-200 last:border-b-0 data-[state=open]:bg-gray-50">
            <Accordion.ItemTrigger
              class="group flex w-full items-center justify-between py-4 px-4 text-left font-medium text-gray-900
                     hover:bg-gray-100
                     data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500
                     data-[disabled]:opacity-50 data-[disabled]:pointer-events-none">
              <span>{item.title}</span>
              <Accordion.ItemIndicator class="transition-transform duration-200 text-gray-500 data-[state=open]:rotate-180">
                ▾
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent
              class="overflow-hidden data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
              <div class="pb-4 px-4 pt-1 text-sm text-gray-600">{item.body}</div>
            </Accordion.ItemContent>
          </Accordion.Item>
        )}
      </For>
    </Accordion.Root>
  )
}
```

**Why `collapsible`:** without it, one item must always stay open (the last open item can't close). `collapsible` lets the user collapse everything — usually the expected behavior for an FAQ-style accordion. Add `multiple` if more than one panel may be open at once.

**Why the inner `<div>` in `ItemContent`:** the `animate-slide-*` keyframes animate opacity/transform on `ItemContent`. Keeping padding on an inner wrapper prevents the animation from fighting layout-driven height changes during the transition. Keep `overflow-hidden` on `ItemContent` so the sliding content doesn't bleed out mid-animation.

→ For animation keyframe definitions, see Animation Recipes above.
→ For the Accordion anatomy and machine props, see `references/component-cookbook.md`.

---

## Styled Example: Dialog

A complete Dialog with backdrop blur, scale-in content, and z-index handling via `--layer-index`. Covers `Root`, `Trigger`, `Portal`, `Backdrop`, `Positioner`, `Content`, `Title`, `Description`, `CloseTrigger`.

```tsx
import { Dialog } from '@ark-ui/solid'

export function StyledDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm
               hover:bg-blue-700
               data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500 data-[focus-visible]:ring-offset-2">
        Open Dialog
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Positioner
          class="fixed inset-0 flex items-center justify-center p-4 z-[calc(1000+var(--layer-index,0))]">
          <Dialog.Content
            class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl outline-none
                   data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
            <Dialog.Title class="text-lg font-semibold text-gray-900">Confirm action</Dialog.Title>
            <Dialog.Description class="mt-2 text-sm text-gray-600">
              This will permanently delete the selected item. This action cannot be undone.
            </Dialog.Description>
            <div class="mt-6 flex justify-end gap-3">
              <Dialog.CloseTrigger
                class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700
                       hover:bg-gray-50 data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">
                Cancel
              </Dialog.CloseTrigger>
              <Dialog.CloseTrigger
                class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-red-700 data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-red-500 data-[focus-visible]:ring-offset-2">
                Delete
              </Dialog.CloseTrigger>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

**Why `Title` and `Description` are not optional:** the machine wires `aria-labelledby` onto `Content` pointing at `Title`, and `aria-describedby` pointing at `Description`. Omit them and screen readers announce an unnamed dialog (Ark also warns in the console). They are part of the accessibility contract, not decoration — see §9 Accessibility Model in the body.

**Why z-index is on `Positioner`, not `Content`:** `--layer-index` is set on the positioning element. `Content` is its child and inherits the stacking context. Putting z-index on `Content` leaves the `Backdrop` (a sibling of `Positioner` inside `Portal`) potentially stacking wrong. See Z-Index and Layering above.

**Why both buttons are `CloseTrigger`:** either closes the dialog — `CloseTrigger` is a behavior part, not a single-instance element. Style each differently for visual hierarchy; the behavior is identical.

**Gotcha:** `Backdrop` must be a sibling of `Positioner` inside `Portal`, not a parent of `Content`. Flattening this breaks the click-outside scrim and the z-index stacking.

→ For the Dialog anatomy and props (`modal`, `closeOnEscape`, `closeOnInteractOutside`, `initialFocusEl`, `finalFocusEl`, `trapFocus`), see `references/component-cookbook.md`.
→ For Presence (exit animations on close), see `references/core-concepts.md`.

---

## Styled Example: Menu

A complete Menu with hover/highlight states, an indicator, a separator, and a labeled group. Covers `Root`, `Trigger`, `Portal`, `Positioner`, `Content`, `Item`, `ItemIndicator`, `Separator`, `Group`, `GroupLabel`.

```tsx
import { Menu } from '@ark-ui/solid'

// Shared row treatment — see Variants with cva for the typed version.
const row =
  'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 ' +
  'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 ' +
  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none'

export function StyledMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm
               hover:bg-gray-50 data-[state=open]:bg-gray-100
               data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">
        Actions
        <span class="text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180">▾</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner class="z-[calc(1000+var(--layer-index,0))]">
          <Menu.Content
            class="min-w-[12rem] rounded-lg border border-gray-200 bg-white p-1 shadow-lg
                   data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
            <Menu.Item id="edit" class={row}>
              <Menu.ItemText>Edit</Menu.ItemText>
            </Menu.Item>
            <Menu.Item id="pin" class={row}>
              <Menu.ItemText>Pin to top</Menu.ItemText>
              <Menu.ItemIndicator class="text-blue-600">📌</Menu.ItemIndicator>
            </Menu.Item>
            <Menu.Separator class="my-1 h-px bg-gray-200" />
            <Menu.Group>
              <Menu.GroupLabel class="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Share
              </Menu.GroupLabel>
              <Menu.Item id="share-link" class={row}><Menu.ItemText>Copy link</Menu.ItemText></Menu.Item>
              <Menu.Item id="share-email" class={row}><Menu.ItemText>Send via email</Menu.ItemText></Menu.Item>
            </Menu.Group>
            <Menu.Separator class="my-1 h-px bg-gray-200" />
            <Menu.Item id="delete"
              class="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-red-600
                     data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700">
              <Menu.ItemText>Delete</Menu.ItemText>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
```

**Why `data-[highlighted]` and not `:hover`:** `data-highlighted` fires for both mouse hover *and* keyboard arrow-key navigation, so the highlight follows the cursor as the user sweeps with arrows. `:hover` only covers the mouse, leaving keyboard users with no visible focus row. Always use `data-[highlighted]` for menu/list item rows.

**Why the row class is extracted into a constant:** there is no shared "item class" propagated by the Menu. The `row` constant demonstrates the per-part contract made maintainable — in real code, promote it to a `cva` variant (see Variants with cva) for type safety.

**Why the danger item overrides the highlight tint:** `data-[highlighted]:bg-red-50` on the Delete item replaces the default `bg-gray-100` for that row only. Because each item carries its own classes (per-part distribution), one item can opt into a different highlight treatment without affecting siblings.

**Tip:** `Menu.ItemIndicator` typically renders only when the item is in its active/checked state (confirm on ark-ui.com's Menu page). For a plain action menu it stays unmounted — that's expected, not a bug.

→ For the Menu anatomy (including `TriggerItem`, `SubTrigger`, `SubContent`, `SubPositioner` for submenus), see `references/component-cookbook.md`.

---

## Pre-Styled Ecosystem

Styling every part by hand is the full-control path, but it is repetitive. The Ark ecosystem ships two pre-styled starting points. Use them to ship faster, or read them as a styling reference even if you stay on plain Tailwind.

### Tark UI

**Tark UI** is Ark UI pre-styled with Tailwind CSS. It wraps each Ark component in a styled version with sensible defaults, `cva` variants, and `tailwind-merge` already wired — the exact workflow this reference teaches, done for you.

Reach for it when you want production-ready styling without authoring every part's class string yourself, when you want a curated variant API (sizes, tones) per component without designing it, or when you are already on Tailwind and want styles that drop into your existing utility setup.

**Tip:** even if you don't adopt Tark UI as a dependency, read its source for each component. It is the canonical reference for how to distribute classes across Ark parts and structure `cva` variants — a worked example of everything in this file.

### Park UI

**Park UI** is Ark UI paired with Panda CSS instead of Tailwind. Same headless core, different styling engine. The component anatomy, data attributes, and state model are identical to plain Ark — only the styling layer (Panda's static CSS-in-JS with recipes) differs.

It is relevant to a Tailwind user mainly as a cross-reference: the *logic* of which part gets which state treatment translates directly, even though the syntax (Panda recipes vs. Tailwind utilities) differs. If your project already uses Panda CSS, Park UI is the Tark UI equivalent for that stack.

### When to style yourself vs. use a pre-styled set

- **Style yourself** when you need full design control, a custom design system, or non-Tailwind styling. The per-part `class` + data-attribute contract is lightweight and you lose nothing by hand-rolling.
- **Use Tark UI** when you want to ship fast on Tailwind and its defaults match your direction. You can still override individual parts with your own `class` (merged via `tailwind-merge`).
- **Use Park UI** only if you are on Panda CSS — for a Tailwind project it is the wrong styling engine.

**Not:** there is no official Ark UI Tailwind preset/plugin to install. Tark UI and Park UI are separate ecosystem projects, not part of the `@ark-ui/*` packages. Plain Ark + your own Tailwind classes is the documented baseline; the pre-styled sets are optional layers on top.

→ For the body's ecosystem pointer, see §6 Tailwind CSS Integration in SKILL.md.
