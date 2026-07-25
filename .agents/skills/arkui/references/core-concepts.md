# Ark UI Core Concepts

This reference goes deep on the framework-agnostic foundation that the SKILL.md body only sketches — the anatomy/machine mental model, machine context and props, state lifecycle, per-item state, context plumbing, portal, presence, environment, the accessibility contract, and SSR. Read it when you need the *why* behind a part, prop, or state value, not just the *what*. Solid is the primary example framework; concepts transfer to React/Vue/Svelte with only the prop-attribute and accessor conventions changing.

→ For the body overview of each topic below, cross back to the pinned sections in SKILL.md. For Solid-specific behavior, see `references/solid-integration.md`. For Tailwind styling, see `references/tailwind-styling.md`. For worked component recipes, see `references/component-cookbook.md`.

---

## Table of Contents

- [Anatomy and Parts](#anatomy-and-parts)
- [Machine Context](#machine-context)
- [Machine Props](#machine-props)
- [Machine State and Lifecycle](#machine-state-and-lifecycle)
- [Item State with getItemState](#item-state-with-getitemstate)
- [Context Plumbing](#context-plumbing)
- [Portal](#portal)
- [Presence](#presence)
- [Environment and Direction](#environment-and-direction)
- [Accessibility Contract](#accessibility-contract)
- [SSR Overview](#ssr-overview)

---

## Anatomy and Parts

Every Ark component declares a fixed **anatomy** — the set of DOM parts it renders. You compose those parts as `Component.Part` sub-components. The machine (see Machine Context below) addresses each part *by role*, not by selector: it knows "the trigger," "the content," "the item." The anatomy is the machine's coordinate system.

Example anatomies:

```
Accordion: Root > Item > ItemTrigger, ItemIndicator, ItemContent
Dialog:    Root > Trigger, Portal > Backdrop, Positioner > Content > Title, Description, CloseTrigger
Select:    Root > Label, Control, Trigger, ClearTrigger, Indicator,
                 Portal > Positioner > Content > ItemGroup > ItemGroupLabel, Item, ItemText, ItemIndicator
```

Three rules govern the anatomy:

1. **Nest parts as the contract dictates.** `Backdrop` and `Positioner` belong inside `Portal`; `Content` belongs inside `Positioner`; `Item` belongs inside `ItemGroup`/`Content`. The machine walks a known tree shape to find its targets. Skip a part or flatten the tree and the machine loses its bearings — portal rendering, focus management, and positioning all break.

2. **Some parts are required for accessibility.** `Dialog.Title` and `Dialog.Description` are not decoration — the machine wires `aria-labelledby` and `aria-describedby` through them. `Field.Label`/`Field.HelperText`/`Field.ErrorText` wire the same associations for inputs. Omit them and you get an unnamed region (screen readers can't announce it) plus a console warning.

3. **Compose custom elements with `asChild`.** When a part must render as your own element (a `<Link>` as a `Menu.Trigger`, a styled button as `Dialog.CloseTrigger`), pass `asChild` and supply the child. Ark forwards event handlers, ARIA attributes, and refs onto your element instead of wrapping it.

```tsx
<Popover.Trigger asChild>
  <button class="rounded-lg bg-blue-600 px-3 py-1.5 text-white">Open</button>
</Popover.Trigger>
```

**Why the anatomy is fixed:** the machine addresses parts by role. When the Dialog machine traps focus, it queries the element with `data-part="content"` — which exists because you rendered `Dialog.Content` in the right place. If you restructure the anatomy, the machine can't find its parts, and behavior silently degrades. Treat the anatomy like an HTML element's box model: you don't argue with it, you work within it.

**What happens when you flatten or skip parts:**

- Skip `Positioner`, put `Content` directly under `Portal` → placement (popper/fixed) is lost; the overlay renders in document flow, un-anchored.
- Skip `Portal` → an ancestor's `overflow: hidden` or `transform` clips or traps the overlay (see Portal below).
- Skip `Title`/`Description` → ARIA labels are missing; accessibility warnings in the console.
- Render `Content` outside `Root` → the machine's context is gone; state changes never reach the part.

**Tip:** if a part feels redundant, check the component's anatomy page on ark-ui.com before removing it — most "redundant" parts exist because the machine, the portal contract, or the a11y contract needs them.

**Note on `class` vs `className`:** Solid/Vue/Svelte parts accept `class`; React parts accept `className`. In Solid, `className` silently does nothing — use `class`.

→ For the body overview, see §3 Anatomy and Parts in SKILL.md.
→ For per-component anatomy diagrams, see `references/component-cookbook.md`.

---

## Machine Context

The **machine context** is the live `api` object — the component's current state plus the methods to read and change it. Every `Root` (or `RootProvider`) creates one and provides it to its parts.

**What the `api` contains:**

- **State fields** — `value` (Accordion/Tabs/Select), `open` (Dialog/Popover/Drawer), `inputValue` (Combobox), and so on.
- **Setters / actions** — `setValue`, `setOpen`, `open()`, `close()`, `focus()`, `highlightNext()`, callable imperatively.
- **Per-item queries** — `getItemState({ item })` for list components (Select, Combobox, Menu, Tabs). See Item State with getItemState below.

**How Solid reads it:** in Solid the `api` is an **accessor** — a function you call to get the live object, then read the field off the result.

```tsx
import { Accordion, useAccordion } from '@ark-ui/solid/accordion'

const accordion = useAccordion({ defaultValue: ['item-1'], multiple: true })

// Read state — call the accessor first, then the field:
const currentValue = accordion().value

// Call a method:
accordion().setValue(['item-2'])
```

**Tip:** method names follow each component's documented API — confirm exact names on ark-ui.com's Context tab.

**Why it's an accessor in Solid:** Solid tracks dependencies by getter *call sites*. Returning a plain object would snapshot state at creation and never update — the surrounding reactive scope would never re-run. The accessor pattern means each read re-evaluates and subscribes the caller. In React, `api` is a plain object (`api.value`), because React re-renders the whole component subtree on state change. Same mental model, different reactivity contract.

**The `use<Component>` hook:** each component ships a creation hook — `useAccordion`, `useDialog`, `useSelect`, `useCombobox`, and so on. Calling it builds the machine and returns the accessor. Pass it the same config you'd give `Root`.

**`RootProvider` vs `Root`:**

- **`Root`** — creates the machine internally from the props you pass. The common case: the machine's lifetime is the component's lifetime.
- **`RootProvider value={api}`** — accepts an externally-created `api` (from the `use<Component>` hook) and provides it to the parts. Use this when you need the `api` *before* rendering — to open a Dialog from a sibling component, share one machine across two views, or call imperative methods from outside the tree.

```tsx
// Root — the common case
<Dialog.Root open={open()} onOpenChange={(e) => setOpen(e.open)}>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>…</Dialog.Portal>
</Dialog.Root>

// RootProvider — you own the machine
import { Dialog, useDialog } from '@ark-ui/solid/dialog'

const dialog = useDialog({ onOpenChange: (e) => setOpen(e.open) })

// Call the machine from anywhere — a sibling button, an effect, a route change:
<button onClick={() => dialog().setOpen(true)}>Open from outside</button>

<Dialog.RootProvider value={dialog}>
  <Dialog.Portal>…</Dialog.Portal>
</Dialog.RootProvider>
```

**Not:** you don't need both `Root` and `RootProvider` for the same machine. `Root` internally calls the same `use<Component>` hook; `RootProvider` is the seam that lets you supply the result yourself. Pick one per machine — supplying your own `api` via `RootProvider` while also rendering `Root` would create two machines.

**Worked: sharing one machine across two views.** A sidebar list and a header button both drive the same Dialog. Create the machine once at the parent, pass it to `RootProvider`, and call methods from either view:

```tsx
import { Dialog, useDialog } from '@ark-ui/solid/dialog'

function App() {
  // One machine, owned at the parent. Both the header and the sidebar use it.
  const dialog = useDialog({ onOpenChange: (e) => log(e.open) })
  return (
    <>
      {/* Sibling — calls the machine before any Dialog part renders */}
      <button onClick={() => dialog().setOpen(true)}>Open from header</button>
      <Dialog.RootProvider value={dialog}>
        <Dialog.Portal>… full portal/positioner/content tree …</Dialog.Portal>
      </Dialog.RootProvider>
    </>
  )
}
```

**Why this beats `Root`:** with `Root`, the machine is created *inside* the tree — the header button, which is a sibling of the `Dialog.Root`, has no reference to it. `useDialog` + `RootProvider` lifts creation to the parent so any descendant or sibling can drive the same machine. This is the structural reason the escape hatch exists.

→ For the body overview, see §4 Machine Context, Props, and State in SKILL.md.
→ For Solid accessor and props-as-getters behavior, see `references/solid-integration.md`.

---

## Machine Props

Machine props are the configuration surface on `Root` (or, equivalently, the `use<Component>` hook). They group into four families.

**State**

| Prop | Components | What it does |
|------|------------|---------------|
| `defaultValue` | Accordion, Tabs, Select, … | Uncontrolled initial value (array for multi-value, string for single). |
| `value` | Same | Controlled current value. Pair with the matching change callback. |
| `collapsible` | Accordion | Allow closing every panel (otherwise one stays open). |
| `multiple` | Accordion, Select | Allow more than one selected value. |

**Behavior**

| Prop | Components | What it does |
|------|------------|---------------|
| `orientation` | Accordion, Tabs, Menu, … | `horizontal` / `vertical`; sets arrow-key axis. |
| `closeOnEscape` | Dialog, Popover, Menu, … | Close on `Escape`. |
| `closeOnInteractOutside` | Overlays | Close on outside pointer / touch. |
| `closeOnSelect` | Select, Menu | Close after picking an item. |
| `positioning` | Overlays | Placement config (placement, gutter, flip, offset) — a Zag.js placement object. |
| `autocomplete`, `allowCustomValue` | Combobox | Filtering mode / allow free-text entries. |

**Accessibility & focus**

| Prop | Components | What it does |
|------|------------|---------------|
| `initialFocusEl` | Dialog, Popover, … | Ref to focus when the overlay opens. |
| `finalFocusEl` | Dialog, Popover, … | Ref to restore focus to on close. |
| `trapFocus` | Dialog | Trap Tab/Shift+Tab inside the content. |
| `preventScroll` | Overlays | Lock body scroll while open. |
| `dir` | All | `ltr` / `rtl`; flips orientation logic, placement, and arrow-key axis. |

**Rendering & SSR**

| Prop | Components | What it does |
|------|------------|---------------|
| `lazyMount` | Overlays | Don't render the part's markup until first opened. |
| `unmountOnExit` | Overlays | Remove markup after the machine logically closes (after exit animation, if any). |
| `modal` | Dialog | Whether the dialog blocks interaction with the rest of the page. |

**Controlled vs uncontrolled:**

- **Uncontrolled** — pass `defaultValue` only. The machine owns state; you don't sync. Simplest, and correct when the state is purely local to the component's UI.
- **Controlled** — pass `value` plus `onValueChange` / `onOpenChange`. You own the source of truth (a URL, a server cache, a parent signal). You must feed every change back in or the UI desyncs.

**The detail-object callback shape:** change callbacks fire with a details object, not a bare value:

```tsx
<Accordion.Root onValueChange={(e) => setValue(e.value)} />   // e.value: string[]
<Dialog.Root   onOpenChange={(e) => setOpen(e.open)} />        // e.open: boolean
```

**Why the detail object:** Ark leaves room for additional fields (the source of the change, selection metadata) without breaking the callback signature. Read the documented field for each component — don't assume positional args. In Solid, read it *inside* the callback (`e.value`), not via a deferred getter — the event object is only valid for the turn in which it fired.

**Controlled vs uncontrolled — the decision:** two questions decide which. First, does a parent or sibling need to *read* this state (an effect, a URL, another component)? Second, is the source of truth somewhere other than the component (routing, a server cache, a form library)? If either is yes → **controlled** (`value` + `onValueChange`/`onOpenChange`), and you must feed every change back in or the UI desyncs. If both are no → **uncontrolled** (`defaultValue` only); the machine owns state and you avoid owning synchronization for no benefit.

The key depth: uncontrolled is not a "lazy default" — it is the *correct* choice when the state is genuinely local. Promoting to controlled "just in case" means every change now round-trips through your signal and back into the machine, and you inherit the synchronization bugs that come with it. Reach for controlled only when an external source of truth genuinely needs to read or write the state.

→ For the basic Tabs controlled/uncontrolled code, see §10 Controlled vs Uncontrolled Patterns in SKILL.md; for the `api`-out (RootProvider) imperative pattern, see §4 and Machine Context above.

---

## Machine State and Lifecycle

Every Ark component is a Zag.js finite state machine. The machine owns transitions — `closed → open`, `open → closed`, `idle → highlighted`, `none → selected` — and writes `data-state` to the part's DOM node when it transitions. You don't toggle `data-state` yourself.

**`data-state` values per component family:**

- **Disclosure / overlays** (Accordion, Collapsible, Tabs, Popover, Dialog, Drawer, Tooltip): `open` / `closed`.
- **Toggle selection** (Checkbox, Switch): `checked` / `unchecked`.
- **List items** (Select, Combobox, Menu, Tabs items): per-item state is exposed as boolean attributes — `data-selected`, `data-highlighted`, `data-disabled` — not as an enumerated `data-state`. (See §5 of SKILL.md for the distinction between enumerated `data-state` and boolean attributes.)

**Why the machine and not your code:** a state machine makes illegal transitions impossible. An Accordion with `multiple={false}` cannot have two panels open — the machine rejects the second `open` transition. If you hand-rolled booleans, you would have to re-encode every rule (`collapsible`, `multiple`, `orientation`, focus coordination) yourself, and you would get them wrong. Delegating to the machine means the rules are correct by construction.

**Lifecycle of an overlay:**

1. `closed` → user activates the trigger → machine transitions to `open`.
2. The portal/positioner/content mount (timing depends on `lazyMount` / `unmountOnExit` — see below).
3. Focus moves to `initialFocusEl` (or the first focusable in `Content`). Body scroll may lock (`preventScroll`).
4. User dismisses (Escape, outside click, `CloseTrigger`) → machine transitions to `closed`.
5. If an exit animation is in flight via `Presence`, the content stays mounted until the animation completes, then unmounts (subject to `unmountOnExit`).

**`lazyMount` / `unmountOnExit` — framework-agnostic behavior:**

- **`lazyMount`** — the overlay's `Content`/`Positioner` markup is not rendered until the first time the machine opens. Without it, the markup exists in the DOM from initial render, just hidden via `data-state="closed"`.
- **`unmountOnExit`** — when the machine logically closes, the markup is removed from the DOM (after exit animation, if any). Without it, the markup stays in the DOM in `data-state="closed"` between opens.

Combined `lazyMount unmountOnExit`: the overlay ships zero markup when closed and mounts fresh on each open. This is the SSR-friendly default for overlays — see SSR Overview below.

**Why both flags instead of one:** they are independent. You might want `lazyMount` (skip initial render cost) but keep the DOM between opens (avoid re-mounting a heavy list on every interaction). Or `unmountOnExit` alone (mount eagerly, but clean up on close). The pair lets you tune mount cost against open latency.

**Not:** `lazyMount` / `unmountOnExit` are machine-behavior flags — they describe what the flags do to the DOM in *any* framework. SolidStart server-entry setup and hydration config live in `references/solid-integration.md`. This reference owns the "what the flags do to the DOM" behavior; that reference owns the "how SolidStart serves it" behavior.

→ For the body overview, see §8 Portal, Presence, and Env in SKILL.md.
→ For SolidStart SSR setup and hydration, see `references/solid-integration.md`.

---

## Item State with getItemState

List components — Select, Combobox, Menu, Tabs — render items from a **collection** (built with `createListCollection`). Items are data, not components: the machine tracks per-item state internally, but it has no DOM node of its own to write attributes to. Two paths expose that state:

1. **Styling path (automatic).** When you render an item as `Select.Item` (or `Menu.Item`, `Combobox.Item`), the part writes boolean attributes to its own DOM node — `data-selected`, `data-highlighted`, `data-disabled`. Target those with Tailwind variants (`data-[selected]:bg-blue-50`). You don't call anything; the part does it.

2. **Programmatic path (`getItemState`).** When you need the state's *value* in JS — to conditionally render a badge, drive a sibling, or gate logic — call `api.getItemState({ item })`. It returns the live state object for that item.

```tsx
const state = select().getItemState({ item })
// state: { highlighted: boolean; selected: boolean; disabled: boolean }
```

**Reading it in a `For` / `Index` loop:**

```tsx
import { Select, createListCollection } from '@ark-ui/solid'
import { For } from 'solid-js'

const collection = createListCollection({
  items: [
    { label: 'Apple',  value: 'apple'  },
    { label: 'Banana', value: 'banana' },
  ],
})

<Select.Root collection={collection}>
  <Select.Trigger>…</Select.Trigger>
  <Select.Portal>
    <Select.Positioner>
      <Select.Content>
        <For each={collection.items}>
          {(item) => (
            <Select.Item item={item}>
              <Select.ItemText>{item.label}</Select.ItemText>
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          )}
        </For>
      </Select.Content>
    </Select.Positioner>
  </Select.Portal>
</Select.Root>
```

**Why items are data and not components:** the machine must answer "which item is highlighted next?" during keyboard navigation *before* any DOM node for that item necessarily exists — the next item to highlight is computed from the collection, not from DOM traversal. So the machine operates on collection items as values, keyed by item identity. The `Select.Item` part is just the *rendering* of one item; the state lives in the machine.

**Gotcha:** pass the *collection item* to `getItemState`, not a raw string value. `{ item }` is the object from `collection.items` (the same `item` you pass to `Select.Item`'s `item` prop). Passing the raw value string won't match the machine's key.

**Tip:** the exact return shape can vary by component (some add fields beyond the three above). Confirm the documented fields on the component's "Context" tab on ark-ui.com before relying on extras.

**Worked: a conditional badge driven by item state.** The styling path writes `data-selected` to the item's own node — but if the badge is a *sibling* of the item (or you need the boolean in JS), use `getItemState`:

```tsx
<For each={collection.items}>
  {(item) => {
    const state = () => select().getItemState({ item })  // accessor — stays live
    return (
      <div class="flex items-center gap-2">
        <Select.Item item={item}>
          <Select.ItemText>{item.label}</Select.ItemText>
        </Select.Item>
        {state().selected && <span class="badge">Default</span>}
      </div>
    )
  }}
</For>
```

**Why the wrapping accessor:** `getItemState` reads live state, so wrap the call in a `() =>` so Solid re-evaluates it when the machine transitions. Calling it once at the top of the loop would snapshot state and never update.

→ For the body overview, see §4 Machine Context, Props, and State in SKILL.md.
→ For per-component collection setup, see `references/component-cookbook.md`.

---

## Context Plumbing

Three ways to reach machine context from children, from quickest to most powerful. Each component page on ark-ui.com documents its context API under a "Context" tab — confirm the exact hook/part name there, since naming is per-component.

| Pattern | What it is | When to reach for it |
|---------|------------|----------------------|
| `Component.Context` (render-prop part) | A part that takes a function child receiving the `api`/context | Quick inline read — a badge, a dynamic label, one conditional inside a part's tree |
| `use*Context` hook | A hook returning the context, callable inside any descendant of `Root` | Building a reusable custom part that sits below `Root` in the tree |
| `use<Component>` + `RootProvider` | You create the machine and feed the accessor in | Controlling the machine from outside the tree — imperative open/close, shared machine across views |

**`Component.Context` — render-prop (quick inline):**

```tsx
<Dialog.Root>
  <Dialog.Context>
    {(api) => <span>Open: {String(api().open)}</span>}
  </Dialog.Context>
  <Dialog.Portal>…</Dialog.Portal>
</Dialog.Root>
```

**Why:** when you only need the `api` for a one-off inside the tree, a render-prop avoids spinning up a separate component. The function child receives the context; in Solid it's an accessor (call it `api().open`), in React it's a plain object (`api.open`) — same convention as the `use<Component>` hook.

**`use*Context` hook (reusable custom part):**

```tsx
import { Dialog, useDialogContext } from '@ark-ui/solid/dialog'

function MyCloseButton(props: Dialog.CloseTriggerProps) {
  const api = useDialogContext()
  return <button onClick={() => api().close()}>Close</button>
}
```

**Why:** when you build a custom part you'll reuse (a themed close button, a status pill), a hook lets the component read context without prop-drilling. It must render inside the matching `Root`/`RootProvider` — outside that tree, the hook has nothing to read.

**`use<Component>` + `RootProvider` (control from outside):**

```tsx
import { Dialog, useDialog } from '@ark-ui/solid/dialog'

const dialog = useDialog({ onOpenChange: (e) => setOpen(e.open) })

<button onClick={() => dialog().setOpen(true)}>Open from a sibling</button>

<Dialog.RootProvider value={dialog}>
  <Dialog.Portal>…</Dialog.Portal>
</Dialog.RootProvider>
```

**Why:** the two patterns above read context *inside* the tree. This one creates the tree — you own the machine's lifetime and can call its methods from anywhere (a menu item, a route-change effect, a different component entirely).

**Not:** don't mix `Root` and `RootProvider` for the same machine. `Root` calls the `use<Component>` hook internally; supplying your own via `RootProvider` is the alternative, not an addition.

**Tip:** the `Component.Context` render-prop and `use*Context` hooks are documented per component on ark-ui.com (the "Context" tab). Exact names follow the component (`useDialogContext`, `useAccordionContext`, …); confirm before importing.

→ For the body overview, see §4 Machine Context, Props, and State in SKILL.md.

---

## Portal

Overlay components (Dialog, Drawer, Popover, Tooltip, Select, Menu, Combobox) render through a **Portal** that lifts their markup out of the normal DOM tree, appending it to a target (default `document.body`).

**Why portal out:**

- **`overflow: hidden` / `overflow: auto`** on an ancestor would clip the overlay — a dialog opened inside a scrollable card gets cut off at the card's edges.
- **`transform` / `filter` / `perspective`** on an ancestor creates a new containing block, which breaks `position: fixed` — the overlay would scroll with the ancestor instead of staying pinned to the viewport.
- **`z-index` stacking contexts** — an ancestor with its own stacking context would force the overlay behind sibling content regardless of the overlay's own `z-index`.

Portaling to `document.body` escapes all three.

**The overlay anatomy is consistent:**

```tsx
<Dialog.Portal>
  <Dialog.Backdrop />        {/* click-to-close scrim */}
  <Dialog.Positioner>       {/* placement + z-index container (sets --layer-index) */}
    <Dialog.Content>        {/* the visible body; focus trap and ARIA labels attach here */}
      <Dialog.Title>…</Dialog.Title>
      <Dialog.Description>…</Dialog.Description>
      <Dialog.CloseTrigger>×</Dialog.CloseTrigger>
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog.Portal>
```

- `Portal` — moves children to the portal target.
- `Backdrop` — the scrim behind the content; pointer-down here triggers `closeOnInteractOutside`.
- `Positioner` — the popper/fixed wrapper handling placement and `z-index`; it sets the `--layer-index` CSS variable so nested overlays stack correctly.
- `Content` — the visible body; focus containment and ARIA labelling attach here.

**Portal targets:**

- **Default** — `document.body`. Works for almost every case.
- **Custom target** — pass a node or CSS selector to render into a specific element. Use this when the overlay must live in a different document (an iframe) or a specific stacking root. Pair with `EnvironmentProvider` so Ark queries the right document for outside-click and focus logic (see Environment and Direction below).

```tsx
// Custom portal target — render into a dedicated stacking root element
<Dialog.Portal to="#dialog-root">
  <Dialog.Backdrop />
  <Dialog.Positioner>
    <Dialog.Content>…</Dialog.Content>
  </Dialog.Positioner>
</Dialog.Portal>
```

**Tip:** confirm the exact prop name and target API on ark-ui.com's Portal docs.

**Why a custom target:** the default (`document.body`) is right for almost every case. The two reasons to deviate are an app shell with its own stacking root (so app CSS never bleeds into overlays) or an overlay that must render in a different document (an iframe-based editor). The constraint in both: the portal target and Ark's environment must agree — if the portal renders into document B but Ark queries document A for outside-click, the close-on-outside-click behavior silently breaks (see Environment and Direction below).

**`lazyMount` / `unmountOnExit` interaction with Portal:** these flags control whether closed overlays ship markup — see [Machine State and Lifecycle](#machine-state-and-lifecycle) for the full behavior. The Portal-specific point: with `lazyMount`, the Portal's children (Backdrop / Positioner / Content) don't enter the portal target until the first open, so nothing inside that target exists while closed.

**Gotcha:** if you render the overlay content *outside* the `Portal`, you lose the overflow/transform escape. The markup looks fine in isolation and breaks the moment it's placed inside a scrolling or transformed ancestor — the most common "why is my dialog clipped?" bug.

→ For the body overview, see §8 Portal, Presence, and Env in SKILL.md.
→ For the `--layer-index` z-index recipe, see `references/tailwind-styling.md`.

---

## Presence

`Presence` controls the mount/unmount animation lifecycle for a part whose visibility is driven by the machine.

**The problem it solves:** when a Dialog closes, the machine transitions `open → closed` immediately. But you usually want an exit animation — a fade, a scale-down. If the part unmounts the instant the machine closes, there is nothing to animate; the part just vanishes. `Presence` keeps the part mounted until the exit animation completes, even after the machine has logically closed.

**When you need it:**

- You are animating exit (close) transitions with CSS or the Web Animations API, and the machine doesn't manage them.
- You want `data-state="closed"` to persist long enough to play a close animation before unmount.

**How it differs from `lazyMount` / `unmountOnExit`:**

| Flag | What it controls | Question it answers |
|------|------------------|---------------------|
| `lazyMount` | Initial mount timing | "Does markup exist before first open?" |
| `unmountOnExit` | Post-close unmount | "Is markup removed after close (after animation)?" |
| `Presence` (utility/part) | Animation-driven mount hold | "Does the part stay mounted long enough to play an exit animation?" |

`unmountOnExit` and `Presence` cooperate: `Presence` holds the mount for the animation, then `unmountOnExit` removes it. Without `Presence`, `unmountOnExit` unmounts immediately on close (no animation window). Without `unmountOnExit`, `Presence` still holds the mount through the animation, but the part stays in the DOM (hidden) between opens rather than being removed.

**Tip:** if you only need open/close animations on an overlay part, styling against `data-[state=open]` / `data-[state=closed]` is usually enough — reach for `Presence` explicitly when you are animating a part whose lifecycle the machine doesn't already manage.

→ For the body overview, see §8 Portal, Presence, and Env in SKILL.md.
→ For animation styling recipes, see `references/tailwind-styling.md`.

---

## Environment and Direction

Ark reads environment facts — which `document`, which `window`, what text direction — from a root context. You rarely touch it directly; the seam is `EnvironmentProvider`.

**What `env` provides:**

- **`document`** — the document Ark renders into, used for portal targets, focus containment, and DOM queries (outside-click, querySelector).
- **`window`** — the window for scroll/resize/pointer listeners. In SSR, Ark picks the right one so server code doesn't touch `window` directly and crash.
- **direction** — the default text direction (`ltr` / `rtl`).

**`EnvironmentProvider` — when you need it:**

- **Iframes / embedded apps.** If your app runs inside an iframe, `document.body` of the host document isn't Ark's `document.body`. Portals, focus traps, and outside-click detection all query the wrong document. Wrap the app in `EnvironmentProvider` so Ark reads the iframe's `document`/`window`.
- **Custom portal targets in a different document.** Same problem — Ark's outside-click and focus logic must agree with where the portal actually rendered. If the portal is in document B but Ark queries document A, outside-click won't fire.
- **Direction override.** Set `dir` on `Root` for a single component, or via `EnvironmentProvider` to set a default for the whole tree.

**`dir` and RTL:**

- `dir="rtl"` on `Root` flips all orientation logic — arrow-key axis, placement, icon direction.
- Ark's components are RTL-aware by default once `dir` is set; you don't reimplement mirroring.

```tsx
// Tree-wide default direction
<EnvironmentProvider value={{ dir: 'rtl' }}>
  <App />
</EnvironmentProvider>

// Single-component direction
<Accordion.Root dir="rtl" defaultValue={['item-1']}>…</Accordion.Root>
```

**Not:** `dir` on `Root` and `EnvironmentProvider`'s direction are two seams for the same concern. `Root`'s `dir` is per-component; `EnvironmentProvider` is the tree-wide default. Pick the scope that matches your need — don't set both to conflicting values.

**Tip:** the exact value shape of `EnvironmentProvider` (which fields it accepts beyond `dir`, `document`, `window`) is documented on ark-ui.com under the Environment utility. Confirm before relying on extras.

→ For the body overview, see §8 Portal, Presence, and Env and §9 Accessibility Model in SKILL.md.

---

## Accessibility Contract

Accessibility is emitted by the machine through the anatomy, not layered on by you. Three pillars:

**ARIA is wired through anatomy parts:**

- `Dialog.Title` → `aria-labelledby` on `Content`.
- `Dialog.Description` → `aria-describedby` on `Content`.
- `Field.Label` → `aria-labelledby` on the field's input.
- `Field.HelperText` / `Field.ErrorText` → `aria-describedby` on the input.
- `Select.Item` → `role="option"`, `aria-selected`.
- `Menu.Item` → `role="menuitem"`, `aria-disabled`.

Omit a labelled-by / described-by part and the machine can't wire the attribute — you get an unnamed region and (usually) a console warning. The a11y contract is a core reason the anatomy is fixed (see Anatomy and Parts above).

**Focus management:**

- **Trap** — `trapFocus` (Dialog) confines Tab/Shift+Tab to the `Content`. The machine cycles focus; you don't write a trap.
- **Restore** — on close, focus returns to the trigger (or to `finalFocusEl` if set).
- **Initial focus** — `initialFocusEl` (a ref) moves focus to a specific element on open; without it, the first focusable in `Content` gets focus.
- **Prevent scroll** — `preventScroll` locks body scroll while the overlay is open.

**Keyboard model (built in):**

- **Arrows** move selection / highlight in Menu, Select, Combobox, RadioGroup, Tabs. `orientation` sets the horizontal vs vertical arrow axis.
- **Escape** closes overlays (`closeOnEscape`).
- **Tab** is trapped inside modal Dialogs; outside a modal, it moves normally.
- **Enter / Space** activates triggers and selects items.

**RTL** — `dir="rtl"` flips arrow-key axis and placement. The keyboard model and positioning both honor it.

**Why you should not fight the keyboard model:** the machine's handlers coordinate state transitions with ARIA updates — highlighting a Menu item sets `data-highlighted` and updates the relevant ARIA state so screen readers announce the highlighted item, in the same tick. If you add your own `keydown` listener that simulates a click on the trigger, you double-fire (yours + the machine's) and you skip the ARIA/focus coordination. Call the `api` instead:

```tsx
// Don't: simulate user interaction
<input onKeyDown={(e) => e.key === 'Escape' && triggerRef.click()} />

// Do: call the machine
<input onKeyDown={(e) => { if (e.key === 'Escape') dialog().setOpen(false) }} />
```

**Tip:** if you need a key the machine doesn't handle, listen at the right level (usually `Content`) and call an `api` method (`close()`, `setValue()`, `highlightNext()`). Never compete with keys the machine already owns — you'll get double-fires and desynced ARIA.

**Worked: a custom shortcut that delegates to the machine.** You want `Cmd+K` to open a Command Menu (a Combobox rendered as a palette). The machine doesn't own `Cmd+K`, so you listen for it and call the `api` — the machine then handles focus trap, ARIA, and arrow navigation correctly:

```tsx
import { Combobox, useCombobox } from '@ark-ui/solid/combobox'
import { onMount } from 'solid-js'

const palette = useCombobox({ collection })

onMount(() => {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      palette().setOpen(true)   // machine handles the rest
    }
  })
})

<Combobox.RootProvider value={palette}>…</Combobox.RootProvider>
```

**Why this is the right shape:** the machine didn't invent the `Cmd+K` shortcut, so you own *only* that one listener. The moment you hand control to `setOpen`, the machine takes over — focus moves to the input, the list becomes keyboard-navigable, and `Escape` closes it. You never reimplement any of that.

→ For the body overview, see §9 Accessibility Model in SKILL.md.

---

## SSR Overview

Framework-agnostic SSR for Ark overlays. The goal: closed overlays ship zero markup to the client; open overlays ship their state correctly.

**`lazyMount` + `unmountOnExit` — the SSR-friendly default for overlays:**

```tsx
<Dialog.Root lazyMount unmountOnExit>
  <Dialog.Portal>
    <Dialog.Positioner>
      <Dialog.Content>…</Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Portal>
</Dialog.Root>
```

**What ships vs what mounts:**

| State | Without flags | With `lazyMount unmountOnExit` |
|-------|---------------|--------------------------------|
| Closed at SSR | Full markup (Backdrop / Positioner / Content) ships, hidden via `data-state="closed"` | No overlay markup ships |
| Closed → open (client) | Already in DOM; flip `data-state` | Mount the overlay, then flip `data-state` |
| Open → closed (client) | Stays in DOM, `data-state="closed"` | After exit animation, unmount |

**Why this matters for SSR:** the flag semantics live in [Machine State and Lifecycle](#machine-state-and-lifecycle) — the SSR-specific consequence is concrete: closed overlays ship zero markup, so a page with three possible dialogs sends three fewer hidden DOM trees in the initial HTML, shrinking the document and speeding hydration.

**`unmountOnExit` and animations:** if you have exit animations, `Presence` holds the mount until they finish; `unmountOnExit` then removes the markup. Without `Presence`, `unmountOnExit` removes immediately on close. See Presence above.

**Environment in SSR:** Ark's `env` picks the right `window` / `document` so server code doesn't touch browser globals. You usually don't configure this — it's why `lazyMount` / `unmountOnExit` work server-side without throwing.

**Not:** this section covers the *machine behavior* — what the flags do to the DOM in any framework. SolidStart-specific setup (server entry, hydration config, `isServer` guards, SSR-aware component boundaries) lives in the sibling reference.

→ For the body overview, see §7 Solid Integration and §8 Portal, Presence, and Env in SKILL.md.
→ For SolidStart SSR setup and hydration config, see `references/solid-integration.md`.
