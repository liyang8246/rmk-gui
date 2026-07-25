---
name: arkui
description: Master Ark UI — the headless, accessible, state-machine-driven component library (Zag.js) with bindings for React, Solid, Vue, and Svelte. Use when building, styling, or debugging Ark UI components, integrating Ark UI with Tailwind CSS, or using @ark-ui/solid in SolidJS/SolidStart apps. Covers anatomy/parts, machine context, data-attribute styling, controlled/uncontrolled patterns, and forms. Use the solidjs skill for general SolidJS reactivity/routing; use this skill whenever Ark UI is the subject, even inside a Solid project.
---

# Ark UI Mastery Guide

## Purpose

This skill installs the correct Ark UI mental model. Ark UI is **headless** — it ships behavior, accessibility, and state, but no styles. That inverts how you reason about components: the DOM structure (the "anatomy") is fixed by the library, the state is exposed as data attributes, and styling is a separate concern layered on top via `class`/`className`. If you approach Ark UI like a styled component library (Material UI, Chakra v2) you will fight the design; if you approach it like raw Radix, you're closer, but Ark's machine-driven core still changes how controlled state and parts compose.

Ark UI is built on **Zag.js** finite state machines and ships identical APIs across `@ark-ui/react`, `@ark-ui/solid`, `@ark-ui/vue`, and `@ark-ui/svelte`. This guide uses **Solid + Tailwind CSS** as the primary stack because that combination surfaces every important concept — Solid's reactivity rules around props, and Tailwind's data-attribute state styling. The patterns transfer directly to React/Vue/Svelte with only the prop attribute name changing.

→ For the deep machine/anatomy model, see `references/core-concepts.md`. For Solid-specific behavior, see `references/solid-integration.md`. For Tailwind styling, see `references/tailwind-styling.md`. For worked component recipes, see `references/component-cookbook.md`.

---

## 1. Mental Model: How Ark UI Is Structured

Every Ark component is three layers stacked together:

| Layer | What it is | Where you engage |
|-------|-----------|------------------|
| **Machine** | A Zag.js state machine owning the component's behavior (open/closed, focused, highlighted, ...) | Configure via **machine props** on `Root` |
| **Anatomy** | A fixed set of DOM parts the machine drives (`Root`, `Trigger`, `Content`, `Item`, ...) | Compose as `Component.Part` children |
| **Styling** | Your CSS/Tailwind, attached per part, reacting to `data-*` attributes | Pass `class`/`className` + write data-variant CSS |

**Why this split matters:** the anatomy and machine are not yours to redesign. You can reorder parts within the DOM contract and you can style them, but you cannot invent new parts or rename the state. Treat the anatomy as a fixed API surface, like an HTML element's box model — you don't argue with it, you work with it.

```tsx
import { Accordion } from '@ark-ui/solid'

<Accordion.Root defaultValue={['item-1']} collapsible>
  <Accordion.Item value="item-1">
    <Accordion.ItemTrigger>
      <span>Section 1</span>
      <Accordion.ItemIndicator>▾</Accordion.ItemIndicator>
    </Accordion.ItemTrigger>
    <Accordion.ItemContent>Body…</Accordion.ItemContent>
  </Accordion.Item>
</Accordion.Root>
```

`Root` holds the machine. `Item`, `ItemTrigger`, `ItemContent`, `ItemIndicator` are the anatomy. `defaultValue`/`collapsible` are machine props. Nothing here is styled by Ark — every visual is yours to add.

---

## 2. Installation

Install the framework package for your stack. For the Solid + Tailwind focus:

```bash
npm install @ark-ui/solid
```

Imports come in two shapes. The **namespace import** pulls a whole component tree:

```tsx
import { Dialog } from '@ark-ui/solid'
// use Dialog.Root, Dialog.Trigger, Dialog.Content, ...
```

The **deep import** pulls one component and keeps bundles small:

```tsx
import { Dialog } from '@ark-ui/solid/dialog'
```

**Tip:** deep imports matter in Solid because SolidStart tree-shakes well per-route; pulling only what a route uses keeps the client bundle lean.

Tailwind has no Ark-specific preset to install — styling is plain `class` plus data-attribute variants, covered in §6. Add Tailwind to the project normally (`@tailwindcss/vite` or PostCSS) and you're ready.

**Not:** Ark UI does not require Chakra UI. Chakra UI v3 is *built on top of* Ark UI, but you can use Ark directly with any styling approach (Tailwind, Panda CSS, vanilla CSS, CSS-in-JS).

---

## 3. Anatomy and Parts

Each component documents an **anatomy**: the fixed set of parts it renders. Parts are addressed as `Component.Part` sub-components — for example `Dialog.Root`, `Dialog.Trigger`, `Dialog.Backdrop`, `Dialog.Positioner`, `Dialog.Content`, `Dialog.Title`, `Dialog.Description`, `Dialog.CloseTrigger`.

Three rules govern the anatomy:

1. **Nest parts as the contract dictates.** `Backdrop` and `Positioner` belong inside `Portal`; `Content` belongs inside `Positioner`. Skipping a part or flattening the tree breaks portal rendering and focus management.
2. **Some parts are required for accessibility.** `Dialog.Title` and `Dialog.Description` are not optional decoration — the machine wires ARIA labelling through them. Omitting them produces inaccessible dialogs (and console warnings).
3. **Compose custom elements with `asChild`.** When a part must render as your own element (a `<Link>` as a trigger), pass `asChild` and supply the child; Ark forwards props and behavior onto it.

```tsx
<Popover.Trigger asChild>
  <button class="...">Open</button>
</Popover.Trigger>
```

**Why `asChild`:** Ark needs to attach event handlers, ARIA attributes, and refs to the trigger. `asChild` forwards those onto the child element you render, so they land on the real DOM node instead of a wrapper div that breaks semantics and styling.

→ For the full anatomy of every key component, see `references/component-cookbook.md`.

---

## 4. Machine Context, Props, and State

The machine is the source of truth. Two surfaces let you touch it:

- **Machine props** — passed to `Root`. These configure behavior and initial state: `defaultValue`, `value`, `collapsible`, `multiple`, `orientation`, `closeOnEscape`, `positioning`, `onValueChange`, `onOpenChange`, etc.
- **Machine context (the `api`)** — the live state object: current value, open state, setters, and per-item queries like `getItemState(props)`.

### Controlled vs Uncontrolled

```tsx
// Uncontrolled — give it a starting value and walk away
<Accordion.Root defaultValue={['item-1']}>…</Accordion.Root>

// Controlled — you own the state and feed it back
const [value, setValue] = createSignal(['item-1'])
<Accordion.Root value={value()} onValueChange={(e) => setValue(e.value)}>
  …
</Accordion.Root>
```

**Why the detail object:** Ark's change callbacks fire with a details object (`e.value`, `e.open`), not a bare value. This is deliberate — it leaves room for additional fields without breaking the callback signature, so read the documented field for each component rather than assuming positional args.

### The RootProvider escape hatch

When you need the `api` *before* rendering `Root` (to trigger a component from outside its tree — opening a Dialog from a Menu item, or sharing one machine across two views), use the component's `use<Component>` hook with `RootProvider`:

```tsx
import { Accordion, useAccordion } from '@ark-ui/solid/accordion'

const accordion = useAccordion({ multiple: true, defaultValue: ['item-1'] })
// accordion is a function in Solid — read state with accordion().value
<Accordion.RootProvider value={accordion}>…</Accordion.RootProvider>
```

`Root` internally calls the same hook; `RootProvider` exposes the seam so you control creation and can call methods (e.g. `accordion().setValue([...])`) from anywhere. Skip `Root` when you use `RootProvider` — you don't need both.

→ For the machine lifecycle, `getItemState`, and context plumbing, see `references/core-concepts.md`.

---

## 5. The Styling API

Ark styling is a contract around three things: where you attach classes, how state reaches the DOM, and how you scope state.

**Attach classes per part.** Every part accepts `class` (Solid/Vue/Svelte) or `className` (React):

```tsx
<Accordion.Item class="border-b border-gray-200">
  <Accordion.ItemTrigger class="flex w-full justify-between py-4">
    …
  </Accordion.ItemTrigger>
</Accordion.Item>
```

**State is exposed as data attributes, not as class toggles.** Ark writes `data-scope`, `data-part`, and `data-state` on each rendered element:

```html
<div data-scope="accordion" data-part="item" data-state="open">
```

- `data-scope` = the component (`accordion`, `dialog`, `select`)
- `data-part` = which anatomy piece (`item`, `trigger`, `content`)
- `data-state` = enumerated machine state (`open` / `closed` / `checked` / `unchecked`). Separately, Ark writes boolean attributes on the relevant parts — `data-focus`, `data-disabled`, `data-highlighted`, `data-selected`, `data-invalid` — target these directly (`data-[highlighted]:bg-gray-50`).

**Why data attributes and not class hooks:** data attributes are semantic (they describe *state*, not styling) and they scope naturally — `[data-state=open]` reads as "when this is open" regardless of which Tailwind utility you put it on. It also means one part can carry several independent states (`data-state=open data-focus`) without class-name combinatorics.

**Style state with attribute selectors.** In CSS:

```css
.accordion-item[data-state='open'] { background: #f5f5f5; }
```

In Tailwind, the same idea is an arbitrary-value variant:

```tsx
<Accordion.Item class="data-[state=open]:bg-gray-100">
```

**Not:** Ark does not toggle a class like `is-open` for you. If you write `.is-open { … }` nothing will match. Reach for `data-[state=open]` instead.

→ For the full Tailwind workflow (variants, `cva`, `tailwind-merge`, z-index), see `references/tailwind-styling.md`.

---

## 6. Tailwind CSS Integration

Tailwind + Ark UI is the documented happy path: pass `class` per part, target states with `data-[state=…]:` variants. There is no Ark Tailwind plugin to install.

```tsx
<Accordion.ItemTrigger class="flex w-full justify-between py-4 font-medium hover:bg-gray-50 data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">
  <span>What is Ark UI?</span>
  <Accordion.ItemIndicator class="transition-transform duration-200 data-[state=open]:rotate-180">
    ▾
  </Accordion.ItemIndicator>
</Accordion.ItemTrigger>
```

Patterns that recur across components:

- **Open/closed transitions** — pair `data-[state=open]` and `data-[state=closed]` with opposing animations:
  `data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up`.
- **Focus-visible ring** — `data-[focus-visible]:ring-2` targets keyboard focus only, not mouse.
- **Selected items** — list/menu items carry `data-highlighted` and `data-selected`; target those for hover and check states.

When a part's class string gets unwieldy or you need variants (size, tone), reach for **`cva`** (class-variance-authority) and **`tailwind-merge`** to merge Ark's runtime data attributes with your variant classes. Don't hand-roll string concatenation — the merge ordering around `data-[state=…]` matters and `tailwind-merge` handles it.

**Gotcha:** nested overlays (a dialog opened from inside a dialog) stack by the `--layer-index` CSS variable Ark sets. If you hardcode `z-index` on overlays you'll break the stacking. Either use the variable — `z-[calc(1000+var(--layer-index,0))]` — or let a CSS layer handle it.

**If you want pre-styled components** rather than styling yourself, the ecosystem ships two starting points: **Tark UI** (Ark components pre-styled with Tailwind) and **Park UI** (Ark + Panda CSS). Use them as a reference for styling patterns even if you stay on plain Tailwind.

→ For styled, copy-paste examples of accordion, dialog, and menu, see `references/tailwind-styling.md`.

---

## 7. Solid Integration

`@ark-ui/solid` mirrors the React API, but Solid's reactivity is different and the rules below are the ones that bite.

**Call signals as functions.** A signal is a getter; pass `value()` to a prop, never `value`:

```tsx
const [value, setValue] = createSignal([30])
<Slider.Root value={value()} onValueChange={(e) => setValue(e.value)}>
  <Slider.ValueText>{value}</Slider.ValueText>
</Slider.Root>
```

**Why:** Solid tracks dependencies by the *call site* of the getter. `value` alone is the function reference — passing it to a prop subscribes to nothing, so the UI never updates. `value()` reads it inside the reactive scope and subscribes.

**Note on children:** passing `{value}` (the function) as *children* is idiomatic in Solid — JSX evaluates function children reactively, so it stays live. The `value()` rule is for *props*; that's why `<Slider.ValueText>{value}</Slider.ValueText>` above is correct.

**Don't destructure props.** Ark's Solid adapter receives props as a reactive proxy and reads fields lazily. If you wrap an Ark part in your own component, forward `props` whole (`{...props}`) or pick fields with accessors (`() => props.value`), never `{ value } = props`. Destructuring captures the value once and breaks reactivity.

**Use `class`, not `className`.** Solid uses the `class` attribute. Ark's Solid parts accept `class`. Using `className` silently does nothing.

**Control flow is yours.** Ark renders the anatomy; rendering lists of items, conditional presence, and portals is your job with `For`, `Show`, and `Portal`. Ark's own `Portal`/`Presence` parts handle the overlay plumbing, but the list of `Select.Item`s from a collection is a `For` you write.

**SSR with SolidStart is supported.** Control lazy mount behavior with `lazyMount` and `unmountOnExit` on overlay roots so closed dialogs don't ship markup to the client.

→ For SolidStart setup (server entry, hydration config) and Solid refs/children forwarding, see `references/solid-integration.md`; for the framework-agnostic `lazyMount`/`unmountOnExit` machine behavior and portal targets, see `references/core-concepts.md`.

---

## 8. Portal, Presence, and Env

Overlay components (Dialog, Popover, Tooltip, Select, Menu, Combobox, Drawer) render through a **Portal** that lifts them out of the normal DOM tree. This prevents ancestor `overflow: hidden` and `transform` from clipping or trapping your popovers.

The anatomy is consistent:

```tsx
<Dialog.Portal>
  <Dialog.Backdrop />           {/* click-to-close scrim */}
  <Dialog.Positioner>           {/* placement + z-index container */}
    <Dialog.Content>           {/* the actual dialog body */}
      <Dialog.Title>…</Dialog.Title>
      <Dialog.Description>…</Dialog.Description>
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog.Portal>
```

**Presence** controls mount/unmount animations: a part you animate out stays in the DOM until the exit animation finishes, even though the machine has logically closed. Use it when you need exit transitions the machine doesn't manage.

**Env** is the root context Ark reads for environment facts (document, the right `window` in SSR, RTL direction). You rarely touch it directly, but if you render into a non-default document (an iframe, a portal target) or need to override direction, `EnvironmentProvider` is the seam.

→ For portal targets, presence lifecycle, and env overrides, see `references/core-concepts.md`.

---

## 9. Accessibility Model

Accessibility is not a layer you bolt on — the machine emits it.

- **ARIA is wired through the anatomy.** `Dialog.Title` becomes `aria-labelledby`; `Dialog.Description` becomes `aria-describedby`. If you skip these parts, screen readers get an unnamed dialog and Ark warns.
- **Keyboard navigation is built in.** Arrow keys move selection in Menu/Select/Combobox/RadioGroup/Tabs; `Escape` closes overlays; `Tab` is trapped inside modal Dialogs.
- **Focus is managed.** Opening a Dialog moves focus to `initialFocusEl` (or the first focusable); closing restores focus to the trigger. `trapFocus` and `preventScroll` are props, not your job to reimplement.
- **RTL is a prop.** `dir="rtl"` on `Root` (or via `EnvironmentProvider`) flips all orientation logic.

**Tip:** don't fight the keyboard model by adding your own key handlers to triggers — you'll double-fire. If you need custom keys, listen at the right level and call the `api` (e.g. `api.close()`) instead of simulating a click.

---

## 10. Controlled vs Uncontrolled Patterns

Two questions decide which you need:

- Do you need to read state from *outside* the component (a parent's effect, a URL, another component)? → **controlled.**
- Is the state purely local to the component's own UI? → **uncontrolled** is simpler and avoids re-render churn.

```tsx
// Uncontrolled — least code, state lives in the machine
<Tabs.Root defaultValue="account">
  <Tabs.List>…</Tabs.List>
  <Tabs.Content value="account">…</Tabs.Content>
</Tabs.Root>

// Controlled — parent owns state, needed for routing or cross-component sync
const [tab, setTab] = createSignal('account')
<Tabs.Root value={tab()} onValueChange={(e) => setTab(e.value)}>…</Tabs.Root>
```

**Why pick deliberately:** uncontrolled is not a "lazy default" — it's the correct choice when the state is genuinely local. Promoting to controlled "just in case" means you now own synchronization (and the bugs that come with it) for no benefit.

For the `api`-out pattern (sharing one machine across views, imperative control), use `RootProvider` as shown in §4.

---

## 11. Forms: Field and Fieldset

Ark ships `Field` and `Fieldset` for form wiring — label/helper/error association, invalid/disabled/required propagation, and native form submission.

```tsx
import { Field } from '@ark-ui/solid'

<Field.Root invalid>
  <Field.Label>Email</Field.Label>
  <Field.Input type="email" placeholder="you@example.com" />
  <Field.HelperText>We'll never share your email.</Field.HelperText>
  <Field.ErrorText>Enter a valid email.</Field.ErrorText>
</Field.Root>
```

`invalid`, `disabled`, `required`, `readOnly` set on `Field.Root` propagate to nested inputs — you set them once at the field level, not on every input. `Field.Label`/`Field.HelperText`/`Field.ErrorText` wire `aria-labelledby`/`aria-describedby` automatically.

For native `<form>` submission and reset to work, include the hidden input/select part:

```tsx
<Checkbox.Root name="terms" defaultChecked>
  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
  <Checkbox.Label>I agree</Checkbox.Label>
  <Checkbox.HiddenInput />   {/* carries the value into form submission */}
</Checkbox.Root>
```

**Why `HiddenInput`:** the styled `Control` is decorative; the machine's real checkbox state has to land in a real `<input type="checkbox">` for form libraries, validation, and `form.reset()` to see it. `HiddenInput` is that input, visually hidden.

**Collections for Select/Combobox:** pass items via `createListCollection` rather than ad-hoc arrays — it gives Ark indexed access, async support, and consistent typing.

→ For form-library integration (React Hook Form, modular-forms) and the Fieldset group pattern, see `references/component-cookbook.md`.

---

## 12. Component Catalog

Ark ships 45+ components. The mental model above applies uniformly — learn the anatomy and the data attributes for one and you've learned the shape of all of them.

| Category | Representative components |
|----------|---------------------------|
| Overlays | Dialog, Drawer, Popover, Tooltip, Hover Card, Floating Panel |
| Menus & lists | Menu, Select, Combobox, Pagination, Tree View |
| Disclosure | Accordion, Collapsible, Tabs, Segment Group |
| Forms | Field, Fieldset, Checkbox, Radio Group, Switch, Slider, Number Input, Pin Input, Tags Input, Rating Group, Editable, Color Picker |
| Date & time | Date Picker, Date Input, Timer |
| Layout & utility | Splitter, Steps, Carousel, Avatar, Progress, QR Code, Portal, Presence, Focus Trap, Clipboard |

The four you will reach for most often — **Accordion, Dialog, Select, Tabs** — plus **Menu, Popover, Combobox, Slider** — are worked end to end (parts, props, states, Solid + Tailwind example) in the cookbook.

→ For per-component anatomy, props, and recipes, see `references/component-cookbook.md`.

---

## 13. Common Pitfalls and Gotchas

**Styling doesn't apply** → you wrote `.is-open` or `className`; use `data-[state=open]:` and `class` in Solid (§5, §6).

**Controlled component is stuck** → you passed `value` not `value()`, or destructured `{ value }` from props (§7).

**Overlay clipped or behind** → you skipped `Portal`/`Positioner`, or hardcoded `z-index` and broke `--layer-index` (§6, §8).

**Focus escapes the dialog** → you rendered `Content` outside `Positioner`, or are fighting `initialFocusEl`/`finalFocusEl`; let the machine own focus (§9).

**Form value missing on submit** → you forgot `HiddenInput`/`HiddenSelect`; the visible part is decorative (§11).

**List items don't reflect state** → you passed a raw array instead of `createListCollection`, or aren't reading item state via `getItemState`/`api` (§4).

**SSR ships closed-dialog markup** → add `lazyMount unmountOnExit` (§7).

→ For Solid reactivity edge cases and React ref forwarding, see `references/solid-integration.md`; for SSR and hydration internals, see `references/core-concepts.md`.

---

## 14. When to Go Deeper

This body covers the 90% case. Reach into the references when you need more:

- `references/core-concepts.md` — machine lifecycle, `getItemState`, context plumbing, portal targets, presence, env, the full accessibility contract.
- `references/solid-integration.md` — `@ark-ui/solid` setup, refs/children forwarding, SolidStart SSR, the reactivity edge cases that don't appear in React.
- `references/tailwind-styling.md` — variant patterns with `cva` + `tailwind-merge`, animation recipes, z-index and `--layer-index`, full styled examples.
- `references/component-cookbook.md` — end-to-end recipes for Accordion, Dialog, Select, Combobox, Menu, Popover, Tabs, Slider, plus Field/Fieldset form patterns.

Ark UI's own docs (https://ark-ui.com) have a framework tab on every component page — when a prop or part isn't covered here, that's the authoritative reference. Version at time of writing: v5.x; check for breaking changes across majors (e.g. v5.32 replaced BottomSheet with Drawer).
