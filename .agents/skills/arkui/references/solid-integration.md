# Solid Integration Reference — `@ark-ui/solid`

This reference goes deep on the Solid-specific behavior the body only sketches in §7. Ark UI's Solid binding mirrors the React API, but Solid's fine-grained reactivity has rules that bite when you wrap Ark parts in your own components, read machine state, or render lists of items. Get these right and the binding is effortless; get them wrong and the component silently stops updating.

This file assumes basic SolidJS knowledge (signals, memos, `createSignal`). For the general reactive model — why Solid tracks dependencies by call site, how the observer graph works — load the `solidjs` skill.

→ For the body overview, see §7 Solid Integration in SKILL.md.
→ For the framework-agnostic machine model, `getItemState`, and `lazyMount`/`unmountOnExit` *behavior*, see `references/core-concepts.md`.
→ For Tailwind styling patterns, see `references/tailwind-styling.md`.
→ For per-component recipes, see `references/component-cookbook.md`.

---

## Table of Contents

1. [Installation and Imports](#installation-and-imports)
2. [Solid Reactivity Rules](#solid-reactivity-rules)
3. [The API Accessor Pattern](#the-api-accessor-pattern)
4. [Refs and Children Forwarding](#refs-and-children-forwarding)
5. [Control Flow](#control-flow)
6. [SolidStart SSR](#solidstart-ssr)
7. [Solid Gotchas](#solid-gotchas)
8. [Worked Examples in Solid](#worked-examples-in-solid)

---

## Installation and Imports

Install the Solid package. Ark UI ships a separate package per framework binding so each pulls only its own runtime:

```bash
npm install @ark-ui/solid
```

**No peer on Chakra.** Ark does not require Chakra UI. Chakra UI v3 is built *on top of* Ark, but you can use `@ark-ui/solid` directly with any styling approach. Don't let a Chakra dependency sneak in.

### Two import shapes

Ark gives you two ways to import a component, and the choice affects bundle size in SolidStart:

**Namespace import** — pulls the whole component tree under one name. Convenient for prototyping and for components you use across many parts of a page:

```tsx
import { Dialog } from '@ark-ui/solid'
// use Dialog.Root, Dialog.Trigger, Dialog.Backdrop, Dialog.Content, ...
```

**Deep import** — pulls one component from its subpath. The namespace is still the same, but the bundler can drop everything you don't reference:

```tsx
import { Dialog } from '@ark-ui/solid/dialog'
```

**Why deep imports matter in Solid:** SolidStart code-splits and tree-shakes well per route. If a route only renders a Dialog, a deep import means the client bundle for that route carries the Dialog machine and nothing else. The namespace import from `'@ark-ui/solid'` works too, but when you ship many routes the deep form keeps each route's client payload lean. Reach for deep imports once a SolidStart app grows past a handful of components.

**Not:** the deep import path is lowercased and matches the component name — `'@ark-ui/solid/dialog'`, not `'@ark-ui/solid/Dialog'`. SolidStart is case-sensitive on disk.

→ For the body's install overview, see §2 Installation in SKILL.md.

---

## Solid Reactivity Rules

These four rules are the ones that bite when using Ark in Solid. They all stem from one fact: **Solid tracks dependencies at the call site of the getter.** Read that sentence again — every rule below is a consequence of it.

### Rule 1 — Call signals as functions for props

A Solid signal is a getter function. To read its current value (and subscribe to it), you *call* it. Passing the function reference itself to a prop subscribes to nothing:

```tsx
const [value, setValue] = createSignal([30])

// Correct — value() reads the signal inside this reactive scope and subscribes
<Slider.Root value={value()} onValueChange={(e) => setValue(e.value)}>

// Wrong — passes the function reference; the prop never updates
<Slider.Root value={value} onValueChange={(e) => setValue(e.value)}>
```

**Why:** Solid records dependencies when a getter is *invoked* inside a tracking scope (a render effect, a memo, a `createEffect`). `value` (no parens) is just the function object — holding a reference to it creates no dependency edge, so when the signal updates, the prop binding is never re-evaluated and the UI is stale. `value()` invokes the getter, which registers the current computation as an observer of that signal.

Ark's change callbacks fire with a details object — `e.value`, `e.open`, etc. — not a bare value. Read the documented field for the component you're using (`e.value` for Slider/Accordion/Tabs, `e.open` for Dialog/Popover). This is deliberate: the object leaves room for extra fields without breaking the callback signature.

### Rule 2 — The function-children exception

This is the rule that looks like it contradicts Rule 1, and it trips up everyone who learned Rule 1 first. **Passing the signal function (no parens) as JSX children is idiomatic and stays reactive.** This Ark example is correct:

```tsx
const [value, setValue] = createSignal([30])
<Slider.Root value={value()} onValueChange={(e) => setValue(e.value)}>
  {/* value (the function) as children — correct, stays live */}
  <Slider.ValueText>{value}</Slider.ValueText>
</Slider.Root>
```

Note the split: `value={value()}` for the *prop* (Rule 1, parens required), but `{value}` (no parens) for the *children*. Both are correct in the same component.

**Why:** Solid treats a function passed as JSX children as a reactive thunk. The renderer calls the function inside a tracking scope, so `{value}` (the getter) becomes a live, fine-grained binding that re-runs only when `value` changes. This is exactly how `Slider.ValueText` renders the live numeric value — it expects a function child it can call to read the current value. If you wrote `{value()}` for children you'd capture the value once at render time and lose reactivity; if you wrote `value={value}` for a prop you'd pass a function reference the prop can't track.

**Tip:** when a part's job is to display live machine state (ValueText, Output, indicator text), pass the signal function as children. When a part's job is to receive config (Root's `value`/`defaultValue`/`open` props), call the signal.

### Rule 3 — Don't destructure props

Ark's Solid adapter receives props as a reactive proxy and reads fields lazily. When you wrap an Ark part in your own component, forward `props` whole or pick fields with accessors — never destructure:

```tsx
// Wrong — captures value once at render, breaks reactivity downstream
function MyTrigger({ value }) {
  return <Accordion.ItemTrigger data-value={value} />
}

// Correct — spread whole; Ark reads each field lazily as it tracks
function MyTrigger(props) {
  return <Accordion.ItemTrigger {...props} />
}

// Correct — pick a field with an accessor so reads stay tracked
function MyTrigger(props) {
  return <Accordion.ItemTrigger data-value={() => props.value} />
}
```

**Why:** destructuring `{ value } = props` evaluates `props.value` *once*, at the top of the function body, outside any tracking scope that the consumer cares about. The local `value` is now a plain captured value — it never updates. Forwarding `{...props}` keeps the proxy intact, so wherever Ark (or your accessors) read a field, that read happens in the right tracking scope and subscribes correctly.

This is the same reason Rule 1 exists — Solid tracks at the call site, and destructuring moves the call site to a place with no tracking.

### Rule 4 — Use `class`, not `className`

Solid uses the `class` attribute (matching the DOM). Ark's Solid parts accept `class`:

```tsx
<Accordion.Item class="border-b border-gray-200">…</Accordion.Item>
```

Using `className` silently does nothing — the attribute lands on the element as a literal `className` DOM attribute, which the browser ignores. This is the single most common "my styles don't apply" report from people copying examples out of React docs.

**Why:** Solid deliberately aligns with the DOM property name (`class`) rather than React's `className` (a React-internal alias). Ark's Solid adapter forwards whatever you pass, so if you pass `className`, you get a useless DOM attribute and no styling. React examples on ark-ui.com use `className` — when porting to Solid, rename to `class`.

→ For the body summary of these rules, see §7 Solid Integration in SKILL.md.
→ For general Solid reactivity internals (observer graph, tracking scopes), load the `solidjs` skill.

---

## The API Accessor Pattern

When you need the machine's `api` *before* rendering `Root` — to open a Dialog from a distant button, share one machine across two views, or call imperative methods — use the component's `use<Component>` hook with `RootProvider`. This is the seam §4 describes; here is the Solid-specific shape.

### In Solid, the hook returns an accessor

In React, `useAccordion({...})` returns a plain object: `const api = useAccordion({...})`, then `api.value`, `api.setValue(...)`. **In Solid the hook returns an accessor (a function).** You read state by calling it, and call methods on the result:

```tsx
import { Accordion, useAccordion } from '@ark-ui/solid/accordion'

const accordion = useAccordion({ multiple: true, defaultValue: ['item-1'] })

// Read state — call the accessor
accordion().value            // → current open items, live

// Call methods — call the accessor, then the method
accordion().setValue(['item-2'])   // imperative open
```

Then pass the accessor (the function itself, not called) to `RootProvider`:

```tsx
<Accordion.RootProvider value={accordion}>
  {/* …parts… */}
</Accordion.RootProvider>
```

**Why `value={accordion}` (no parens) here:** `RootProvider` expects the accessor itself. Ark's Solid adapter calls it internally in its own tracking scope, exactly like function children in Rule 2. If you call it yourself (`value={accordion()}`) you'd hand RootProvider a snapshot, not a live source, and the machine state would freeze at that render.

### Accessor vs object — the React↔Solid trap

This is the rule most likely to bite someone porting from the React docs. The ark-ui.com React tab shows `api.value` (object access); the Solid tab shows `accordion().value` (call then access). Same component, same machine, different shape:

| Surface | React | Solid |
|---------|-------|-------|
| Hook return | plain object `api` | accessor `() => api` |
| Read state | `api.value` | `accordion().value` |
| Call method | `api.setValue(x)` | `accordion().setValue(x)` |
| Pass to provider | `value={api}` | `value={accordion}` |

**Gotcha:** every `accordion().xxx` call creates a fresh dependency edge on the current value. Inside a hot render this is fine — that's the point. But don't store `const a = accordion()` at module or handler scope and reuse `a.value` later; `a` is a snapshot. Call `accordion()` each time you need a live read, or wrap the read in a memo that tracks it for you.

**Not:** you don't need both `Root` and `RootProvider`. `Root` internally calls the same `use<Component>` hook; `RootProvider` is the escape hatch that exposes the seam. Use one or the other — `Root` for the 90% case, `RootProvider` when something outside the tree must drive the machine.

→ For the body's RootProvider overview and controlled/uncontrolled patterns, see §4 Machine Context, Props, and State in SKILL.md.
→ For the machine lifecycle and what fields the `api` exposes per component, see `references/core-concepts.md`.

---

## Refs and Children Forwarding

Wrapping Ark parts in your own components is where Solid's prop rules meet Ark's anatomy. Two sub-problems: forwarding a `ref`, and forwarding `children`.

### Refs — the `let` binding

Solid uses a callback-free `ref` prop with a `let` binding. To grab the DOM node an Ark part renders, declare a variable and assign it via `ref`:

```tsx
import { Dialog } from '@ark-ui/solid'

function MyDialog(props) {
  let contentEl
  return (
    <Dialog.Root>
      <Dialog.Portal>
        <Dialog.Positioner>
          <Dialog.Content ref={contentEl}>
            {/* contentEl is the DOM node after mount */}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

After mount, `contentEl` is the rendered element. Ark's parts accept `ref` and forward it to the underlying DOM node — including parts rendered through `asChild`, where the ref lands on your custom child element.

**Why `let`, not `useRef`:** Solid has no `useRef`. The `let` variable is assigned by the compiler when the element mounts, inside the component's reactive scope. Reading it before mount yields `undefined`; after mount it's live. If you need the node inside an effect, guard for `undefined` or read it inside `onMount`.

### Merging refs and props when wrapping

If your wrapper adds its own `ref` *and* forwards props (including a caller-supplied `ref`), you must merge — Solid won't combine them for you. Use a merge utility from `@solid-primitives/props`:

```tsx
import { combineProps } from '@solid-primitives/props'
import { Accordion } from '@ark-ui/solid'

function MyItemTrigger(props) {
  let myRef
  const merged = combineProps(props, { ref: myRef })
  return <Accordion.ItemTrigger {...merged} />
}
```

**Why:** Solid's `ref` is a compile-time directive; passing two `ref`s (one from the caller's `props`, one you add) means only the last in source order wins. `combineProps` (or a manual merge function) folds caller props with your additions so neither is dropped. This matters when you build a design-system wrapper that callers pass `ref` into.

### Children — it's a function in Solid

In Solid, `props.children` is *not* a pre-rendered VNode — it's a function (a reactive thunk) that the renderer calls inside a tracking scope. When you pass `children` straight through to an Ark part, just forward it:

```tsx
function MyButton(props) {
  return <button class="..." {...props}>{props.children}</button>
}
```

If you need to *transform* children (map them, inject a wrapper, read their content), use the `children()` helper from `solid-js`, which resolves the thunk into a memo of resolved nodes:

```tsx
import { children } from 'solid-js'
import { Accordion } from '@ark-ui/solid'

function MyItemTrigger(props) {
  const resolved = children(() => props.children)
  return (
    <Accordion.ItemTrigger {...props}>
      {resolved()}
    </Accordion.ItemTrigger>
  )
}
```

**Why destructuring breaks children:** `const { children } = props` captures the thunk reference, but if you then place `{children}` in multiple spots or read it outside the tracking context, the fine-grained binding can be lost or double-resolved. Forwarding `props` whole (or using `children()` which memoizes the resolution) keeps the reactive edge intact. This is the same reason as Rule 3 — destructuring moves the read out of the tracked scope.

→ For the body's `asChild` behavior (forwarding onto a custom child element), see §3 Anatomy and Parts in SKILL.md.
→ For Solid's ref/children internals, load the `solidjs` skill.

---

## Control Flow

Ark renders the anatomy; rendering *lists* of items, *conditional* presence, and *portals* is your job. Solid gives you `For`, `Index`, `Show`, and `Portal` for exactly this.

### Lists — `For` vs `Index`

Solid's two list components differ in how they key items, and the choice matters for Ark lists:

- **`<For>`** keys items by *reference*. Each item is matched to its DOM node by identity. When the array is filtered or reordered, items whose references survive keep their DOM nodes; items whose references vanish unmount. You pass the item value directly: `{(item) => <li>{item}</li>}`.
- **`<Index>`** keys items by *position*. Each slot gets its own signal wrapping the value at that index, so the DOM node at position N persists even when the value at N changes. You pass an accessor: `{(item) => <li>{item()}</li>}`.

For Ark **Select** and **Combobox** lists, `Index` is usually the right call. Here's the reasoning:

```tsx
import { Select } from '@ark-ui/solid/select'
import { createListCollection } from '@ark-ui/solid'
import { Index as ForIndex } from 'solid-js'

const collection = createListCollection({
  items: [
    { label: 'Next.js', value: 'next' },
    { label: 'SolidStart', value: 'solid' },
    { label: 'Remix', value: 'remix' },
  ],
})

<Select.Root collection={collection}>
  <Select.Trigger>…</Select.Trigger>
  <Select.Portal>
    <Select.Positioner>
      <Select.Content>
        <ForIndex each={collection.items}>
          {(item) => (
            <Select.Item item={item()}>
              <Select.ItemText>{item().label}</Select.ItemText>
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          )}
        </ForIndex>
      </Select.Content>
    </Select.Positioner>
  </Select.Portal>
</Select.Root>
```

**Why `Index` for Select/Combobox:** the machine tracks item identity by the `value` field on `Select.Item` (the `item`/`value` prop), **not** by DOM identity. So the DOM-level keying choice is about performance and stability, not correctness. Combobox lists get *filtered* on every keystroke, which rebuilds the array — with `For` (reference-keyed), every surviving item keeps its node but the churn can thrash focus/highlight transitions; with `Index` (positional), the DOM nodes at each slot persist and only their content updates, which keeps transitions smooth. Since the machine's selection/highlight follows the `value` prop regardless of DOM identity, you lose nothing by letting the DOM be positionally stable.

**When `For` is right instead:** use `For` when items have stable reference identity *and* the list is mostly appended/reordered rather than filtered (a nav menu, a static accordion). Reference-keying preserves per-item DOM state (animations, internal component state) across reorders better than positional keying.

### Conditional presence — `Show`

Use Solid's `<Show>` for conditional rendering of Ark parts. The machine toggles `data-state`; whether the part *mounts* at all is a Solid concern:

```tsx
<Show when={formInvalid()}>
  <Field.ErrorText>Fix the errors above.</Field.ErrorText>
</Show>
```

For overlays that should animate out, prefer Ark's `Presence` (next) over a bare `Show` — `Show` unmounts immediately and kills exit animations.

### Portals — Ark's vs Solid's

Ark overlay components (Dialog, Popover, Tooltip, Select, Menu, Combobox, Drawer) render through **Ark's own `Portal` part** inside their anatomy:

```tsx
<Dialog.Portal>
  <Dialog.Backdrop />
  <Dialog.Positioner>
    <Dialog.Content>…</Dialog.Content>
  </Dialog.Positioner>
</Dialog.Portal>
```

This is *not* Solid's `Portal` from `solid-js/web`. Ark's `Portal` knows about the machine's mount/unmount lifecycle, the `--layer-index` z-index var, and presence animations. Let Ark's anatomy own overlay plumbing — don't wrap Ark overlay parts in Solid's `<Portal>` too, or you double-portal and break stacking.

**Why the distinction:** Solid's `Portal` just relocates a node in the DOM. Ark's `Portal` part additionally coordinates with the machine (lazy mount, presence, env). Two portals fighting over the same nodes produce invisible dialogs, broken focus traps, and wrong z-index.

→ For the body's control-flow overview, see §7 Solid Integration in SKILL.md.
→ For portal targets, presence lifecycle, and env, see `references/core-concepts.md`.

---

## SolidStart SSR

SolidStart server-side rendering is supported with `@ark-ui/solid` (a StackBlitz example exists in the Ark docs). This section owns the SolidStart-specific setup; the framework-agnostic machine *behavior* of `lazyMount`/`unmountOnExit` lives elsewhere — don't duplicate it here.

### What you control in SolidStart

SolidStart renders your app on the server and hydrates on the client. Ark's Solid adapter is SSR-aware — it reads the environment (document/window) lazily so the server doesn't touch the DOM prematurely. Your job is to configure the server entry and hydration so Ark parts render to markup that hydrates cleanly.

**Verified:** SolidStart SSR is supported; the Ark docs ship a StackBlitz SolidStart example. **Not documented:** the research flagged that SSR hydration internals are not detailed across frameworks. Don't claim framework-specific hydration quirks the research couldn't confirm — if you hit a hydration mismatch, treat it as a SolidStart/Zag interaction and consult ark-ui.com rather than assuming a documented pattern.

### `lazyMount` and `unmountOnExit` in SSR

These two props control whether closed overlays ship markup at all — see `references/core-concepts.md` for the full machine behavior (state transitions, exit-animation timing). The SolidStart-facing consequence: without `lazyMount`, a Dialog that starts closed still serializes its Content subtree to the server HTML, shipping markup the user never sees until they open the dialog. With `lazyMount`, that markup is omitted — smaller HTML, faster hydration, no wasted nodes. Pair with `unmountOnExit` to also tear the overlay down on close (the common SSR-lean recipe for dialogs and popovers).

```tsx
<Dialog.Root lazyMount unmountOnExit>
  <Dialog.Portal>
    <Dialog.Positioner>
      <Dialog.Content>…</Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Portal>
</Dialog.Root>
```

→ For the framework-agnostic machine *behavior* of `lazyMount`/`unmountOnExit` (state transitions, presence interaction, exit-animation timing), see `references/core-concepts.md`. This file only covers the SolidStart-facing consequences.
→ For the body's SSR note, see §7 Solid Integration and §8 Portal, Presence, and Env in SKILL.md.

---

## Solid Gotchas

The edge cases that don't appear in React, consolidated. Use this as a diagnostic when a Solid + Ark component misbehaves.

**Controlled component is stuck / never updates.** You passed `value` (the function) instead of `value()` to a prop. Solid tracks at the call site; an uncalled getter creates no dependency edge. Call the signal for props. → See [Solid Reactivity Rules](#solid-reactivity-rules) above.

**Display part shows a stale value.** You called the signal inside children (`{value()}`) instead of passing the function (`{value}`). Function children are reactive thunks — pass the getter and let Solid call it. → See Rule 2 in [Solid Reactivity Rules](#solid-reactivity-rules).

**Styles silently don't apply.** You used `className` (React) instead of `class` (Solid). The attribute lands on the DOM as a useless literal and the browser ignores it. Rename to `class`. → See Rule 4 in [Solid Reactivity Rules](#solid-reactivity-rules).

**`api.value` is undefined / not a function.** You're treating the Solid accessor like a React object. In Solid, `useAccordion()` returns a function — call it: `accordion().value`. → See [The API Accessor Pattern](#the-api-accessor-pattern).

**Wrapped part loses reactivity.** You destructured `{ value }` out of `props` in your wrapper, capturing a snapshot. Forward `props` whole (`{...props}`) or read fields with accessors (`() => props.value`). → See Rule 3 in [Solid Reactivity Rules](#solid-reactivity-rules) and [Refs and Children Forwarding](#refs-and-children-forwarding).

**Select/Combobox list thrashes on filter.** You used `For` (reference-keyed) on a list that's rebuilt every keystroke, so every item's DOM node is recreated. Switch to `Index` (positional) — the machine tracks selection by `value` prop, so DOM-level positional stability costs you nothing. → See [Control Flow](#control-flow).

**Dialog is invisible / focus escapes / wrong z-index.** You wrapped Ark's `Dialog.Portal` inside Solid's `<Portal>`, or you hardcoded `z-index` and overrode `--layer-index`. Use Ark's own `Portal`/`Positioner` parts, and let the CSS var drive stacking (`z-[calc(1000+var(--layer-index,0))]`). → See [Control Flow](#control-flow); for `--layer-index` see `references/tailwind-styling.md`.

**SSR ships closed-dialog markup.** Add `lazyMount` (and usually `unmountOnExit`) to the overlay Root so closed overlays don't serialize their Content. → See [SolidStart SSR](#solidstart-ssr).

**Ref is `undefined` in your effect.** Solid's `let` ref is assigned on mount, not on first render. Read it in `onMount` or guard for `undefined`; don't assume it's populated during the initial synchronous pass. → See [Refs and Children Forwarding](#refs-and-children-forwarding).

→ For the body's gotchas (covering React-shared issues too), see §13 Common Pitfalls and Gotchas in SKILL.md.

---

## Worked Examples in Solid

Four complete examples exercising the rules above. All use `class` (never `className`) and Tailwind data-attribute variants. For the full anatomy and props of each component, see `references/component-cookbook.md`; for the styling patterns, see `references/tailwind-styling.md`.

### Example 1 — Slider (controlled, signals)

Demonstrates Rule 1 (`value()` for the prop) and Rule 2 (`{value}` as function children) in the same component.

```tsx
import { Slider } from '@ark-ui/solid/slider'
import { createSignal } from 'solid-js'

export function ControlledSlider() {
  const [value, setValue] = createSignal([30])

  return (
    <Slider.Root
      value={value()}                          // Rule 1 — call for prop
      onValueChange={(e) => setValue(e.value)} // detail object has .value
      class="relative flex flex-col gap-4 w-80"
    >
      <Slider.Label class="text-sm font-medium text-gray-700">
        Volume
      </Slider.Label>
      <Slider.ValueText class="text-sm text-gray-500">
        {value}                                {/* Rule 2 — function children */}
      </Slider.ValueText>
      <Slider.Control class="relative h-5 flex items-center">
        <Slider.Track class="h-1 w-full bg-gray-200 rounded-full">
          <Slider.Range class="h-1 bg-blue-500 rounded-full data-[orientation=horizontal]:h-full" />
        </Slider.Track>
        <Slider.Thumb
          class="absolute w-4 h-4 bg-white border border-gray-300 rounded-full shadow data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500"
          index={0}
        >
          <Slider.HiddenInput />
        </Slider.Thumb>
      </Slider.Control>
    </Slider.Root>
  )
}
```

**Why this works:** `value()` on `Root` subscribes the prop binding to the signal, so dragging updates the machine and `onValueChange` writes back. `Slider.ValueText` expects a function child it calls to read the live value — passing `{value}` (the getter) keeps the displayed number live without re-rendering the whole subtree. `Slider.HiddenInput` carries the value into native form submission.

### Example 2 — Select (collection + `Index`)

Demonstrates `createListCollection`, the `Index` positional renderer, and per-item state styling.

```tsx
import { Select } from '@ark-ui/solid/select'
import { createListCollection } from '@ark-ui/solid'
import { Index } from 'solid-js'

const frameworks = createListCollection({
  items: [
    { label: 'Next.js', value: 'next' },
    { label: 'SolidStart', value: 'solid' },
    { label: 'Remix', value: 'remix' },
    { label: 'Astro', value: 'astro' },
  ],
})

export function FrameworkSelect() {
  return (
    <Select.Root collection={frameworks} class="w-72">
      <Select.Label class="block text-sm font-medium text-gray-700 mb-1">
        Framework
      </Select.Label>
      <Select.Control class="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">
        <Select.ValueText placeholder="Select a framework" class="text-sm text-gray-400 data-[has-value]:text-gray-900" />
        <Select.Indicator class="text-gray-400">▾</Select.Indicator>
      </Select.Control>
      <Select.ClearTrigger class="text-xs text-gray-500 hover:text-gray-700" />
      <Select.Portal>
        <Select.Positioner class="data-[placement]:animate-fade">
          <Select.Content class="mt-1 max-h-60 w-72 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <Select.ItemGroup id="frameworks">
              <Select.ItemGroupLabel class="px-3 py-1 text-xs font-medium text-gray-500">
                Frameworks
              </Select.ItemGroupLabel>
              <Index each={frameworks.items}>
                {(item) => (
                  <Select.Item
                    item={item()}
                    class="relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none data-[highlighted]:bg-gray-50 data-[selected]:font-medium data-[disabled]:opacity-50"
                  >
                    <Select.ItemText>{item().label}</Select.ItemText>
                    <Select.ItemIndicator class="ml-auto text-blue-500">✓</Select.ItemIndicator>
                  </Select.Item>
                )}
              </Index>
            </Select.ItemGroup>
          </Select.Content>
        </Select.Positioner>
      </Select.Portal>
      <Select.HiddenSelect />
    </Select.Root>
  )
}
```

**Why `Index` here:** the collection is static, but if you later make it filterable (search), `Index` keeps DOM nodes stable across filters. `item()` is an accessor — call it to read the current item at that slot. `data-[highlighted]` targets keyboard hover, `data-[selected]` targets the chosen item; `Select.HiddenSelect` carries the value into native form submission.

### Example 3 — Dialog (controlled open state)

Demonstrates controlled `open`/`onOpenChange`, the Portal anatomy, and exit-friendly mount props.

```tsx
import { Dialog } from '@ark-ui/solid/dialog'
import { createSignal } from 'solid-js'

export function ConfirmDialog(props: { onConfirm: () => void }) {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <button
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500"
        onClick={() => setOpen(true)}
      >
        Delete account
      </button>

      <Dialog.Root
        open={open()}
        onOpenChange={(e) => setOpen(e.open)}
        lazyMount
        unmountOnExit
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Portal>
          <Dialog.Backdrop class="fixed inset-0 bg-black/40 data-[state=open]:animate-fade data-[state=closed]:animate-fade-out" />
          <Dialog.Positioner class="fixed inset-0 flex items-center justify-center z-[calc(1000+var(--layer-index,0))]">
            <Dialog.Content class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
              <Dialog.Title class="text-lg font-semibold text-gray-900">
                Delete this account?
              </Dialog.Title>
              <Dialog.Description class="mt-2 text-sm text-gray-600">
                This action is permanent and cannot be undone.
              </Dialog.Description>
              <div class="mt-6 flex justify-end gap-3">
                <Dialog.CloseTrigger
                  class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500"
                >
                  Cancel
                </Dialog.CloseTrigger>
                <button
                  class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white data-[focus-visible]:ring-2 data-[focus-visible]:ring-red-500"
                  onClick={() => { props.onConfirm(); setOpen(false) }}
                >
                  Delete
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
```

**Why the anatomy matters:** `Title` and `Description` are accessibility-required — the machine wires `aria-labelledby`/`aria-describedby` through them. Omit them and you get an unnamed dialog plus a console warning. `Backdrop` → `Positioner` → `Content` nesting is the overlay contract; flattening it breaks the scrim, z-index, and focus trap. `lazyMount` + `unmountOnExit` keeps the closed dialog out of SSR markup and tears it down on close. The `--layer-index` var on `Positioner` lets nested dialogs (a dialog opened from inside this one) stack correctly — don't hardcode `z-index` on `Content`.

### Example 4 — Tabs (uncontrolled)

Demonstrates the uncontrolled pattern — local state lives in the machine, no signal needed — and the `data-selected` state attribute.

```tsx
import { Tabs } from '@ark-ui/solid/tabs'

export function SettingsTabs() {
  return (
    <Tabs.Root defaultValue="account" class="w-80">
      <Tabs.List class="flex border-b border-gray-200">
        <Tabs.Trigger
          value="account"
          class="px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[selected]:text-gray-900 data-[selected]:border-blue-500 data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500"
        >
          Account
        </Tabs.Trigger>
        <Tabs.Trigger
          value="billing"
          class="px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[selected]:text-gray-900 data-[selected]:border-blue-500 data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500"
        >
          Billing
        </Tabs.Trigger>
        <Tabs.Trigger
          value="notifications"
          class="px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[selected]:text-gray-900 data-[selected]:border-blue-500 data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500"
        >
          Notifications
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="account"
        class="pt-4 text-sm text-gray-600 data-[selected]:block hidden"
      >
        Account settings go here.
      </Tabs.Content>
      <Tabs.Content
        value="billing"
        class="pt-4 text-sm text-gray-600 data-[selected]:block hidden"
      >
        Billing settings go here.
      </Tabs.Content>
      <Tabs.Content
        value="notifications"
        class="pt-4 text-sm text-gray-600 data-[selected]:block hidden"
      >
        Notification preferences go here.
      </Tabs.Content>
    </Tabs.Root>
  )
}
```

**Note:** Tabs marks the active panel with `data-selected`; confirm the exact attribute on ark-ui.com's Tabs page if styling doesn't match.

**Why uncontrolled here:** the tab state is purely local to this UI — no parent, no URL, no cross-component sync. Promoting to controlled (a signal + `value`/`onValueChange`) would mean owning synchronization for no benefit. `defaultValue` seeds the machine; `data-[selected]` on both the trigger and the content is the styling hook the machine writes. → For when controlled is the right call, see §10 Controlled vs Uncontrolled Patterns in SKILL.md.

---

For component recipes beyond these four (Accordion, Menu, Popover, Combobox, plus Field/Fieldset form patterns), see `references/component-cookbook.md`. For the Tailwind variant patterns (`cva`, `tailwind-merge`, animations, `--layer-index`) used throughout these examples, see `references/tailwind-styling.md`. For the machine model these parts are built on, see `references/core-concepts.md`. When a prop or part isn't covered here, the authoritative reference is the framework tab on each component page at https://ark-ui.com.
