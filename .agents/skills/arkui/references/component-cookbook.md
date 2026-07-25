# Ark UI Component Cookbook

End-to-end recipes for the eight components the body names in §12, plus the form patterns from §11. Each recipe gives the anatomy parts, the key machine props, the data attributes Ark writes on the DOM, and a complete **Solid + Tailwind** example you can paste and adapt.

This file assumes you already have the mental model from the body.

- → For the machine/anatomy model, see §3 and §4 in `SKILL.md`; for the deep machine lifecycle (`getItemState`), see `references/core-concepts.md`; for Solid reactivity, see `references/solid-integration.md`; for Tailwind state styling, see `references/tailwind-styling.md`.

Every Solid example uses `class` (never `className`), calls signals as functions (`value()`), and avoids destructuring props. The `data-[state=open]:` variants are the styling contract — see §5 and §6 in the body for why.

## Table of Contents

1. [Accordion](#accordion)
2. [Dialog](#dialog)
3. [Select](#select)
4. [Combobox](#combobox)
5. [Menu](#menu)
6. [Popover](#popover)
7. [Tabs](#tabs)
8. [Slider](#slider)
9. [Field and Fieldset](#field-and-fieldset)
10. [Hidden Inputs and Native Forms](#hidden-inputs-and-native-forms)
11. [Form Library Integration](#form-library-integration)
12. [Controlled vs Uncontrolled Recipes](#controlled-vs-uncontrolled-recipes)
13. [RootProvider Recipes](#rootprovider-recipes)

---

## Accordion

A disclosure component: a stack of items, each with a trigger and a collapsible content panel. Use it for FAQs, settings panels, or any "expand to reveal" list.

**Anatomy:** `Root`, `Item`, `ItemTrigger`, `ItemIndicator`, `ItemContent`. `Root` holds the machine; `Item` takes a `value` so the machine tracks which items are open; `ItemTrigger` toggles its parent item; `ItemIndicator` is the icon you rotate on open; `ItemContent` is the body.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `defaultValue` / `value` | `string[]` | Open items on first render (uncontrolled) / controlled |
| `onValueChange` | `(e) => void` | Fires with `e.value` (array of open item values) |
| `collapsible` | `boolean` | Allow closing the last open item |
| `multiple` | `boolean` | Allow more than one item open at once |
| `orientation` | `'horizontal' \| 'vertical'` | Layout axis |

**States on the DOM:** `data-state="open"` / `data-state="closed"` on items and content; the indicator and content carry `data-part` so your variant targets only the right element.

```tsx
import { Accordion } from '@ark-ui/solid'
import { For } from 'solid-js'

const items = [
  { value: 'acc-1', title: 'What is Ark UI?', body: 'A headless component library built on Zag.js.' },
  { value: 'acc-2', title: 'Is it styled?', body: 'No — you bring the styles. Ark ships behavior.' },
  { value: 'acc-3', title: 'Which frameworks?', body: 'React, Solid, Vue, and Svelte.' },
]

export function AccordionDemo() {
  return (
    <Accordion.Root collapsible defaultValue={['acc-1']} class="w-full divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
      <For each={items}>
        {(item) => (
          <Accordion.Item value={item.value}>
            <Accordion.ItemTrigger class="flex w-full items-center justify-between py-4 px-4 text-left font-medium hover:bg-gray-50 data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">
              <span>{item.title}</span>
              <Accordion.ItemIndicator class="transition-transform duration-200 data-[state=open]:rotate-180">▾</Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent class="overflow-hidden data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
              <p class="px-4 pb-4 text-gray-600">{item.body}</p>
            </Accordion.ItemContent>
          </Accordion.Item>
        )}
      </For>
    </Accordion.Root>
  )
}
```

**Tip:** `collapsible` is easy to forget — without it the last open item cannot be closed. Add it unless you specifically want "one always open."

**Gotcha:** `defaultValue`/`value` is an **array**, not a string. Passing `defaultValue="acc-1"` opens nothing because the machine compares against `['acc-1']`. This array shape is what enables `multiple`.

→ For the controlled/uncontrolled choice, see [Controlled vs Uncontrolled Recipes](#controlled-vs-uncontrolled-recipes) below; for the body overview, see §3 and §12 in `SKILL.md`.

---

## Dialog

A modal overlay: focus is trapped, the page behind is inert, and Escape / backdrop-click close it. Use for confirmations, forms that must block, or focus-stealing flows.

**Anatomy:** `Root`, `Trigger`, `Portal`, `Backdrop`, `Positioner`, `Content`, `Title`, `Description`, `CloseTrigger`. `Portal` lifts the dialog out of the DOM tree so ancestor `overflow: hidden` or `transform` cannot clip or trap it; `Backdrop` is the scrim; `Positioner` handles placement and z-index; `Content` is the body. `Title` and `Description` are **required for accessibility** — the machine wires `aria-labelledby`/`aria-describedby` through them; omit them and you get an unnamed dialog plus console warnings.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Controlled open state |
| `onOpenChange` | `(e) => void` | Fires with `e.open` (boolean) |
| `modal` | `boolean` | Trap focus + inert the background (default true) |
| `closeOnEscape` / `closeOnInteractOutside` | `boolean` | Escape / backdrop-pointer-down closes |
| `initialFocusEl` / `finalFocusEl` | `() => HTMLElement` | Element to focus on open / restore on close |
| `trapFocus` / `preventScroll` | `boolean` | Keep Tab inside / prevent body scroll while open |

**States on the DOM:** `data-state="open"` / `data-state="closed"` on `Backdrop`, `Positioner`, `Content`. Ark also sets the `--layer-index` CSS variable on the positioner so nested dialogs stack correctly.

```tsx
import { Dialog } from '@ark-ui/solid'
import { createSignal } from 'solid-js'

export function DialogDemo() {
  const [open, setOpen] = createSignal(false)
  return (
    <Dialog.Root open={open()} onOpenChange={(e) => setOpen(e.open)} closeOnEscape closeOnInteractOutside>
      <Dialog.Trigger class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">Open Dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop class="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Positioner class="fixed inset-0 flex items-center justify-center">
          <Dialog.Content class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl data-[state=open]:animate-scale-in">
            <Dialog.Title class="text-lg font-semibold text-gray-900">Delete project</Dialog.Title>
            <Dialog.Description class="mt-2 text-sm text-gray-600">This action cannot be undone. The project and all its data will be removed.</Dialog.Description>
            <div class="mt-6 flex justify-end gap-3">
              <Dialog.CloseTrigger class="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</Dialog.CloseTrigger>
              <button class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">Delete</button>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

**Why `Title`/`Description` are not optional:** the machine attaches ARIA roles through them. If you do not want a visible title, render `Dialog.Title` anyway and visually-hide it; do not skip it.

**Gotcha:** hardcoding `z-index` on `Backdrop`/`Content` breaks nested-dialog stacking. Use the variable — `z-[calc(1000+var(--layer-index,0))]` — or let Ark's CSS layering handle it (→ `references/tailwind-styling.md`).

→ For the overlay/portal pattern shared with Popover/Menu/Select, see §8 in `SKILL.md`. To open a Dialog from outside its tree, see [RootProvider Recipes](#rootprovider-recipes) below.

---

## Select

A dropdown picker backed by a **collection**. Use `createListCollection` to pass items — it gives Ark indexed access, consistent typing, and a path to async loading. The visible `Control` is decorative; `HiddenSelect` carries the real value for native forms.

**Anatomy:** `Root`, `Label`, `Control`, `Trigger`, `ClearTrigger`, `Indicator`, `Portal`, `Positioner`, `Content`, `ItemGroup`, `ItemGroupLabel`, `Item`, `ItemText`, `ItemIndicator`, `HiddenSelect`. `Root` takes `collection`; `Control` wraps trigger + indicator + clear button; `ItemGroup`+`ItemGroupLabel` section the list; `Item` takes a collection item; `HiddenSelect` is the native `<select>` for form submission.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `collection` | `ListCollection` | Items + value/label lookup (build with `createListCollection`) |
| `value` | `string[]` | Controlled selected values (array, even single-select) |
| `onValueChange` | `(e) => void` | Fires with `e.value` (array) |
| `multiple` / `closeOnSelect` | `boolean` | Allow many / close list on pick |
| `positioning` | `PlacementOptions` | Floating-UI placement, offset, flip, shift |

**States on the DOM:** `data-state="open"` / `data-state="closed"` on trigger and content. Each `Item` carries `data-highlighted` (keyboard focus) and `data-selected` (chosen).

```tsx
import { Select, createListCollection } from '@ark-ui/solid'
import { Index } from 'solid-js'

const frameworks = createListCollection({
  items: [
    { label: 'SolidJS', value: 'solid' },
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte' },
  ],
})

export function SelectDemo() {
  return (
    <Select.Root collection={frameworks} name="framework">
      <Select.Label class="text-sm font-medium text-gray-700">Framework</Select.Label>
      <Select.Control class="mt-1 inline-flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">
        <Select.Trigger class="flex-1 text-left text-gray-900 data-[placeholder]:text-gray-400">Select framework</Select.Trigger>
        <Select.Indicator class="ml-2 transition-transform duration-200 data-[state=open]:rotate-180">▾</Select.Indicator>
        <Select.ClearTrigger class="ml-2 text-gray-400 hover:text-gray-600">×</Select.ClearTrigger>
      </Select.Control>
      <Select.Portal>
        <Select.Positioner class="z-[calc(1000+var(--layer-index,0))]">
          <Select.Content class="mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg data-[state=open]:animate-fade-in">
            <Index each={frameworks.items}>
              {(item) => (
                <Select.Item item={item()} class="flex cursor-pointer items-center justify-between px-3 py-2 text-gray-900 data-[highlighted]:bg-gray-50 data-[selected]:font-semibold">
                  <Select.ItemText>{item().label}</Select.ItemText>
                  <Select.ItemIndicator class="text-blue-600">✓</Select.ItemIndicator>
                </Select.Item>
              )}
            </Index>
          </Select.Content>
        </Select.Positioner>
      </Select.Portal>
      <Select.HiddenSelect />
    </Select.Root>
  )
}
```

**Why `createListCollection` and not a bare array:** it gives Ark indexed access to items and a stable contract for value→label resolution. Ad-hoc arrays force you to rebuild that lookup every render and break async loading.

**Gotcha:** `onValueChange` fires with `e.value` as an **array**, even in single-select mode. Bridging to a form library that wants a scalar: unwrap with `field.onChange(e.value[0])` (→ [Form Library Integration](#form-library-integration) below).

**Tip:** `Index` (Solid) fits here because collection items are plain objects you may replace by reference as the collection rebuilds; `Index` keys by position, which stays stable across that churn. Use `For` only when items have a stable identity you key on.

→ For why `HiddenSelect` matters for form submission/reset, see [Hidden Inputs and Native Forms](#hidden-inputs-and-native-forms) below; for the body overview, see §11 and §12 in `SKILL.md`.

---

## Combobox

A Select with a text input: the user types to filter and (optionally) commits a value not in the list. Use for searchable pickers, tag entry, and any list too long to scroll.

**Anatomy:** `Root`, `Label`, `Control`, `Input`, `Trigger`, `ClearTrigger`, `Indicator`, `Portal`, `Positioner`, `Content`, `Item`, `ItemText`, `ItemIndicator`, `Empty`. `Input` is the editable field; `Trigger` toggles the list; `Empty` renders when no items match the current input — show it so an empty list reads as a filter result, not a bug.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `collection` | `ListCollection` | All candidate items |
| `inputValue` / `onInputChange` | `string` / `(e) => void` | Controlled text / fires with `e.value` as the user types |
| `value` / `onValueChange` | `string[]` / `(e) => void` | Controlled selected values / fires with `e.value` (array) |
| `autocomplete` | `boolean` | Highlight the first matching item |
| `allowCustomValue` | `boolean` | Let the user commit a value not in the collection |

**States on the DOM:** `data-state="open"` / `data-state="closed"` on input and content; `Item` carries `data-highlighted` and `data-selected`.

```tsx
import { Combobox, createListCollection } from '@ark-ui/solid'
import { createSignal, For, Show } from 'solid-js'

const allFruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange', 'Peach', 'Pear']

export function ComboboxDemo() {
  const [inputValue, setInputValue] = createSignal('')
  const [collection, setCollection] = createSignal(createListCollection({ items: allFruits }))

  function filter(query: string) {
    const items = allFruits.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
    setCollection(createListCollection({ items }))
  }

  return (
    <Combobox.Root collection={collection()} inputValue={inputValue()} onInputChange={(e) => { setInputValue(e.value); filter(e.value) }} allowCustomValue class="w-64">
      <Combobox.Label class="text-sm font-medium text-gray-700">Fruit</Combobox.Label>
      <Combobox.Control class="mt-1 flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 data-[focus-within]:ring-2 data-[focus-within]:ring-blue-500">
        <Combobox.Input class="flex-1 bg-transparent outline-none" placeholder="Search fruit…" />
        <Combobox.Trigger class="ml-2 text-gray-400 data-[state=open]:rotate-180">▾</Combobox.Trigger>
        <Show when={inputValue()}>
          <Combobox.ClearTrigger class="ml-2 text-gray-400 hover:text-gray-600">×</Combobox.ClearTrigger>
        </Show>
      </Combobox.Control>
      <Combobox.Portal>
        <Combobox.Positioner class="z-[calc(1000+var(--layer-index,0))]">
          <Combobox.Content class="mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
            <For each={collection().items}>
              {(fruit) => (
                <Combobox.Item item={fruit} class="flex cursor-pointer items-center justify-between px-3 py-2 data-[highlighted]:bg-gray-50 data-[selected]:font-semibold">
                  <Combobox.ItemText>{fruit}</Combobox.ItemText>
                  <Combobox.ItemIndicator class="text-blue-600">✓</Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </For>
            <Show when={collection().items.length === 0}>
              <Combobox.Empty class="px-3 py-2 text-gray-500">No fruit found.</Combobox.Empty>
            </Show>
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
```

**Note:** this example uses raw `string[]` items + `<For>` instead of the `{ label, value }` + `Index` pattern used elsewhere. That is intentional here: primitives are interned, so `For` keys them by reference correctly, and the Combobox `Input` displays the text directly — no label/value split is needed.

**Why rebuild the collection on input:** Ark does not filter for you — the collection is the source of truth. When the user types, rebuild a collection of matching items and feed it back via the `collection` prop. This keeps filtering logic in your hands (you can debounce, fetch async, or rank).

**Gotcha:** forgetting `Empty` produces a blank dropdown when the search has no matches. Render it so the state is legible.

→ For the controlled-value bridge to form libraries, see [Form Library Integration](#form-library-integration) below.

---

## Menu

A floating action menu: groups, separators, submenus, keyboard navigation, and highlight tracking. Use for "kebab" menus, context menus, and command palettes.

**Anatomy:** `Root`, `Trigger`, `Portal`, `Positioner`, `Content`, `Item`, `ItemText`, `ItemIndicator`, `Separator`, `Group`, `GroupLabel`, `TriggerItem`. `Group`+`GroupLabel` section the menu; `Separator` draws a rule between groups; `TriggerItem` opens another overlay from within the menu. There is **no** `Menu.Sub`/`SubTrigger`/`SubContent`/`SubPositioner` part — submenus compose by rendering a nested `Menu` (its own `Portal`/`Positioner`/`Content`) inside the parent `Content`, opened via `Menu.TriggerItem`. The nested menu shares the parent's coordination through the same machine contract.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `loopFocus` | `boolean` | Wrap arrow-key focus from last to first item |
| `dir` | `'ltr' \| 'rtl'` | Flip orientation logic for right-to-left layouts |

**States on the DOM:** `data-state="open"` / `data-state="closed"` on trigger and content. `Item` carries `data-highlighted` (keyboard focus) and `data-disabled` — target `data-[highlighted]:bg-gray-100`.

```tsx
import { Menu } from '@ark-ui/solid'

const itemClass = 'flex cursor-pointer items-center px-2 py-1.5 text-sm data-[highlighted]:bg-gray-100'

export function MenuDemo() {
  return (
    <Menu.Root>
      <Menu.Trigger class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">Options</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner class="z-[calc(1000+var(--layer-index,0))]">
          <Menu.Content class="w-56 rounded-md border border-gray-200 bg-white p-1 shadow-lg data-[state=open]:animate-fade-in">
            <Menu.Group>
              <Menu.GroupLabel class="px-2 py-1.5 text-xs font-semibold uppercase text-gray-500">Account</Menu.GroupLabel>
              <Menu.Item class={itemClass}><Menu.ItemText>Profile</Menu.ItemText></Menu.Item>
              <Menu.Item class={itemClass}><Menu.ItemText>Billing</Menu.ItemText></Menu.Item>
            </Menu.Group>
            <Menu.Separator class="my-1 h-px bg-gray-200" />
            <Menu.TriggerItem class="flex w-full cursor-pointer items-center justify-between px-2 py-1.5 text-sm data-[highlighted]:bg-gray-100">
              <Menu.ItemText>Share</Menu.ItemText><span class="text-gray-400">▸</span>
            </Menu.TriggerItem>
            <Menu.Portal>
              <Menu.Positioner class="z-[calc(1000+var(--layer-index,0))]">
                <Menu.Content class="ml-2 w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
                  <Menu.Item class={`${itemClass} justify-between`}>
                    <Menu.ItemText>Copy link</Menu.ItemText>
                    <Menu.ItemIndicator class="ml-auto text-blue-600">✓</Menu.ItemIndicator>
                  </Menu.Item>
                  <Menu.Item class={itemClass}><Menu.ItemText>Email</Menu.ItemText></Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Portal>
            <Menu.Separator class="my-1 h-px bg-gray-200" />
            <Menu.Item class="flex cursor-pointer items-center px-2 py-1.5 text-sm text-red-600 data-[highlighted]:bg-red-50"><Menu.ItemText>Delete</Menu.ItemText></Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
```

**Tip:** do not add your own `onClick` key handlers to `Menu.Item` — the machine owns Enter/Space/arrow dispatch. For custom activation, call the machine's API instead of simulating a click, or you will double-fire.

**Gotcha:** `dir="rtl"` on `Root` flips arrow-key direction and submenu placement. Set it (or via `EnvironmentProvider`) for right-to-left layouts; do not mirror with CSS alone or keyboard nav and visual will disagree.

→ For keyboard/focus behavior shared across overlays, see §9 in `SKILL.md`; for opening a Menu item that drives a shared Dialog, see [RootProvider Recipes](#rootprovider-recipes) below.

---

## Popover

A non-modal floating panel: it does **not** trap focus or inert the background. Use for contextual help, inline configuration, and rich tooltips that need interactive content.

**Anatomy:** `Root`, `Trigger`, `Anchor`, `Portal`, `Positioner`, `Content`, `Title`, `Description`, `CloseTrigger`, `Arrow`. `Anchor` positions the popover relative to a different element than the trigger — useful when the trigger is small but the popover should align to a larger region; `Arrow` draws a pointing triangle from the content to the anchor.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `open` / `onOpenChange` | `boolean` / `(e) => void` | Controlled open state / fires with `e.open` |
| `modal` | `boolean` | Treat as modal (trap focus, inert background) — rarely wanted for a popover |
| `positioning` | `PlacementOptions` | Floating-UI placement, offset, flip, shift |

**States on the DOM:** `data-state="open"` / `data-state="closed"` on trigger, positioner, and content.

```tsx
import { Popover } from '@ark-ui/solid'
import { createSignal } from 'solid-js'

export function PopoverDemo() {
  const [open, setOpen] = createSignal(false)
  return (
    <Popover.Root open={open()} onOpenChange={(e) => setOpen(e.open)} positioning={{ placement: 'top', offset: 8 }}>
      <Popover.Trigger class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500">Learn more</Popover.Trigger>
      <Popover.Anchor />
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Content class="w-72 rounded-lg bg-gray-900 p-4 text-white shadow-xl data-[state=open]:animate-fade-in">
            <Popover.Arrow class="fill-gray-900" />
            <Popover.Title class="text-sm font-semibold">About Ark UI</Popover.Title>
            <Popover.Description class="mt-1 text-sm text-gray-300">Headless, accessible, state-machine-driven components you style yourself.</Popover.Description>
            <div class="mt-3 flex justify-end">
              <Popover.CloseTrigger class="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600">Got it</Popover.CloseTrigger>
            </div>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
```

**Why `modal` is off by default here:** a popover that traps focus breaks the expectation of an inline helper. Only set `modal` when you genuinely need to block the rest of the UI — otherwise you usually want a `Dialog`.

**Tip:** `Anchor` without adjustment aligns to the trigger by default. Add an explicit `Anchor` only when you want the popover to point at something other than its trigger.

→ For the portal/positioner pattern shared with Dialog/Menu, see §8 in `SKILL.md`.

---

## Tabs

A segmented control with panels. Use for in-page navigation between views, settings sections, or any "one panel visible at a time" layout.

**Anatomy:** `Root`, `List`, `Trigger`, `Content`, `Indicator`. `List` holds the triggers; `Trigger` takes a `value` and toggles the active panel; `Content` takes a matching `value`; `Indicator` is the animated highlight Ark slides between triggers based on the active one.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `defaultValue` / `value` | `string` | Active tab on first render (uncontrolled) / controlled |
| `onValueChange` | `(e) => void` | Fires with `e.value` (string, not array) |
| `activationMode` | `'manual' \| 'automatic'` | `automatic` moves focus+selection on arrow; `manual` moves focus, activates on Enter/Space |

**States on the DOM:** `data-selected` on the active trigger and its content. Triggers also carry `data-focus` and `data-disabled`.

```tsx
import { Tabs } from '@ark-ui/solid'

const triggerClass =
  'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 data-[selected]:border-blue-600 data-[selected]:text-gray-900 data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500'

export function TabsDemo() {
  return (
    <Tabs.Root defaultValue="account" class="w-full">
      <Tabs.List class="flex border-b border-gray-200" aria-label="Settings">
        <Tabs.Trigger value="account" class={triggerClass}>Account</Tabs.Trigger>
        <Tabs.Trigger value="password" class={triggerClass}>Password</Tabs.Trigger>
        <Tabs.Trigger value="team" class={triggerClass}>Team</Tabs.Trigger>
        <Tabs.Indicator class="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-200" />
      </Tabs.List>
      <Tabs.Content value="account" class="hidden data-[selected]:block pt-4 text-sm text-gray-600">Account settings panel…</Tabs.Content>
      <Tabs.Content value="password" class="hidden data-[selected]:block pt-4 text-sm text-gray-600">Change your password…</Tabs.Content>
      <Tabs.Content value="team" class="hidden data-[selected]:block pt-4 text-sm text-gray-600">Manage team members…</Tabs.Content>
    </Tabs.Root>
  )
}
```

**Note:** Tabs marks the active panel with `data-selected`; style with `data-[selected]:block` and default `hidden` so only the selected panel shows.

**Note:** unlike Accordion/Select, Tabs `value` is a **string**, not an array — exactly one tab is active. Match your signal shape to that: `createSignal('account')`, not `['account']`.

**Tip:** `activationMode="automatic"` is the friendlier default — focus and selection move together. Reach for `manual` only when moving focus without selecting would be surprising (e.g. a tab that triggers an expensive load).

→ For syncing Tabs to a URL (controlled), see [Controlled vs Uncontrolled Recipes](#controlled-vs-uncontrolled-recipes) below and §10 in `SKILL.md`.

---

## Slider

A range input with one or more thumbs. Use for volume, price ranges, and any continuous numeric input where typing is less natural than dragging.

**Anatomy:** `Root`, `Label`, `ValueText`, `Control`, `Track`, `Range`, `Thumb`, `HiddenInput`. `Control` is the interactive region; `Track` is the full bar; `Range` is the filled portion from min to the thumb; `Thumb` takes an `index` (0-based) for multi-thumb sliders; `ValueText` renders the formatted value; `HiddenInput` is the real `<input type="range">` for native form submission.

**Key machine props (on `Root`):**

| Prop | Type | Purpose |
|------|------|---------|
| `min` / `max` / `step` | `number` | Minimum / maximum / granularity |
| `value` | `number[]` | Controlled thumb values (one per thumb) |
| `onValueChange` | `(e) => void` | Fires with `e.value` (array) |
| `minStepsBetweenThumbs` | `number` | Minimum step gap between thumbs (prevents overlap) |

**States on the DOM:** `Thumb` carries `data-disabled`, `data-focus`, and `data-dragging` (while the pointer is held).

```tsx
import { Slider } from '@ark-ui/solid'
import { createSignal } from 'solid-js'

export function SliderDemo() {
  const [value, setValue] = createSignal([30])
  return (
    <Slider.Root min={0} max={100} step={1} value={value()} onValueChange={(e) => setValue(e.value)} class="w-72">
      <div class="flex items-center justify-between">
        <Slider.Label class="text-sm font-medium text-gray-700">Volume</Slider.Label>
        <Slider.ValueText class="text-sm tabular-nums text-gray-900">{value}</Slider.ValueText>
      </div>
      <Slider.Control class="mt-4 flex flex-col gap-2">
        <Slider.Track class="relative h-2 w-full rounded-full bg-gray-200">
          <Slider.Range class="absolute h-full rounded-full bg-blue-600" />
        </Slider.Track>
        <Slider.Thumb index={0} class="absolute -mt-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-blue-600 bg-white shadow data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500 data-[dragging]:scale-110" />
      </Slider.Control>
      <Slider.HiddenInput name="volume" />
    </Slider.Root>
  )
}
```

**Why `<Slider.ValueText>{value}</Slider.ValueText>` passes the signal as a function child:** Solid evaluates function children reactively, so the signal stays live without calling `value()`. This is the exception to the "call signals as functions" rule — that rule applies to **props**, where `value` alone passes a non-reactive function reference (→ `references/solid-integration.md` and §7 in `SKILL.md`).

**Gotcha:** `value` is an **array** of numbers, one entry per thumb. A single-thumb slider still uses `[30]`, not `30`. Forgetting the array is the most common Slider bug.

→ For the native-form role of `HiddenInput`, see [Hidden Inputs and Native Forms](#hidden-inputs-and-native-forms) below.

---

## Field and Fieldset

Ark ships `Field` and `Fieldset` for form wiring: label/helper/error association, state propagation, and grouping. These parts do not replace your inputs — they **wrap** them and wire ARIA correctly.

**Field anatomy:** `Field.Root`, `Field.Label`, `Field.Input`, `Field.Textarea`, `Field.Select`, `Field.HelperText`, `Field.ErrorText`, `Field.RequiredIndicator`, `Field.Item`.
**Fieldset anatomy:** `Fieldset.Root`, `Fieldset.Legend`.

Set `invalid`, `disabled`, `required`, or `readOnly` on `Field.Root` and Ark propagates them to every nested input automatically — you set them once at the field level, not on each input. `Field.Label`/`Field.HelperText`/`Field.ErrorText` wire `aria-labelledby`/`aria-describedby` to the input for free.

```tsx
import { Field, Fieldset, Checkbox } from '@ark-ui/solid'

const checkboxControl =
  'flex h-5 w-5 items-center justify-center rounded border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white'

export function FieldDemo() {
  return (
    <form class="space-y-8">
      <Field.Root invalid>
        <div class="flex items-center gap-1">
          <Field.Label class="text-sm font-medium text-gray-700">Email</Field.Label>
          <Field.RequiredIndicator class="text-red-500">*</Field.RequiredIndicator>
        </div>
        <Field.Input type="email" placeholder="you@example.com" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 data-[invalid]:border-red-500 data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-500" />
        <Field.HelperText class="mt-1 text-xs text-gray-500">We'll never share your email.</Field.HelperText>
        <Field.ErrorText class="mt-1 text-xs text-red-600">Enter a valid email address.</Field.ErrorText>
      </Field.Root>

      <Fieldset.Root>
        <Fieldset.Legend class="text-sm font-medium text-gray-700">Notifications</Fieldset.Legend>
        <div class="mt-2 space-y-2">
          <Field.Item>
            <Checkbox.Root name="email-notify">
              <Checkbox.Control class={checkboxControl}><Checkbox.Indicator>✓</Checkbox.Indicator></Checkbox.Control>
              <Checkbox.Label class="ml-2 text-sm text-gray-700">Email</Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
          </Field.Item>
          <Field.Item>
            <Checkbox.Root name="sms-notify">
              <Checkbox.Control class={checkboxControl}><Checkbox.Indicator>✓</Checkbox.Indicator></Checkbox.Control>
              <Checkbox.Label class="ml-2 text-sm text-gray-700">SMS</Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
          </Field.Item>
        </div>
      </Fieldset.Root>
    </form>
  )
}
```

**Why propagate at the field level:** setting `disabled` on every input individually means you miss one when the field grows. `Field.Root` guarantees the whole field is disabled together and ARIA state stays consistent.

**Tip:** `Field.ErrorText` only renders visibly when the field is `invalid`, so keep it in the tree unconditionally and let `invalid` drive visibility — no conditional logic needed.

→ For the body overview of Field/Fieldset, see §11 in `SKILL.md`.

---

## Hidden Inputs and Native Forms

Every component with a visible "control" also ships a **hidden input** that carries the real value for native form submission. This is not optional ceremony — it is how `<form>` submission, `form.reset()`, and constraint validation see the component's state.

- `Checkbox.HiddenInput` → a real `<input type="checkbox">` with the `name`/`value`.
- `Select.HiddenSelect` → a real `<select>` with the selected option.
- `Slider.HiddenInput` → a real `<input type="range">`.

**Why two representations:** the visible `Control` (the styled checkbox, the select trigger) is **decorative** — it carries `data-state` for styling and handles interaction, but it is not a form element. The machine's real state has to land in a genuine native input for the browser's form machinery to read it. `HiddenInput`/`HiddenSelect` is that input, visually hidden but semantically present.

```tsx
import { Checkbox } from '@ark-ui/solid'
import { createSignal } from 'solid-js'

export function HiddenInputDemo() {
  const [agreed, setAgreed] = createSignal(false)
  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log('terms:', new FormData(e.currentTarget).get('terms')) }}>
      <Checkbox.Root name="terms" checked={agreed()} onCheckedChange={(e) => setAgreed(e.checked)}>
        <Checkbox.Control class="flex h-5 w-5 items-center justify-center rounded border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white">
          <Checkbox.Indicator>✓</Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="ml-2 text-sm text-gray-700">I agree to the terms</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
      <div class="mt-4 flex gap-2">
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">Submit</button>
        <button type="reset" class="rounded-md border border-gray-300 px-4 py-2 text-sm">Reset</button>
      </div>
    </form>
  )
}
```

**Gotcha:** omit `HiddenInput` and `form.reset()` will not reset the checkbox, and `FormData` will not include `terms`. The visible control resets visually (the machine re-renders) but the form value was never there. Always include the hidden part when the component lives inside a `<form>`.

**Tip:** the hidden input inherits `name`, `value`, `required`, and `disabled` from `Root` — set them there, not on `HiddenInput`.

→ For the body explanation, see §11 in `SKILL.md`; for form-library bridges that read these values, see [Form Library Integration](#form-library-integration) below.

---

## Form Library Integration

Ark is unopinionated about form libraries: the controlled-value seam (`value` + `onValueChange`) is the contract. Two paths are verified for this skill.

### React Hook Form + Select (controlled-value bridge)

React Hook Form is React-centric, but the bridge pattern it requires is the **general** pattern for any controlled component: the library holds a scalar, Ark holds an array, and you translate between them in `onValueChange`.

```tsx
import { Controller } from 'react-hook-form'
import { Select, createListCollection } from '@ark-ui/solid'

const collection = createListCollection({
  items: [
    { label: 'SolidJS', value: 'solid' },
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
  ],
})

// Inside an RHF-controlled field (React app, or via a Solid adapter):
<Controller
  control={control}
  name="framework"
  render={({ field }) => (
    <Select.Root
      collection={collection}
      value={field.value ? [field.value] : []}        // scalar → array
      onValueChange={(e) => field.onChange(e.value[0])} // array → scalar
      onOpenChange={() => field.onBlur()}             // mark touched on close
    >
      {/* …anatomy… */}
      <Select.HiddenSelect />
    </Select.Root>
  )}
/>
```

**Why the `e.value[0]` unwrap:** Ark's Select `onValueChange` always fires with an array (even single-select), because the same machine backs `multiple`. RHF expects a single string from `name="framework"`. The bridge is one line: `field.onChange(e.value[0])`.

**Not:** do not pass `value={field.value}` directly — RHF's scalar will not match Ark's array prop, and the selection will not render.

### modular-forms (Solid-native)

`modular-forms` is the verified Solid-native form library. Install the Solid package:

```bash
npm install @modular-forms/solid @ark-ui/solid
```

With modular-forms you define a typed form and bind fields with its `Field` component wrapping Ark's controlled component. The same array/scalar bridge applies when you bind a Select.

```tsx
import { useForm, Form, Field } from '@modular-forms/solid'
import { Select, createListCollection } from '@ark-ui/solid'

const collection = createListCollection({
  items: [
    { label: 'SolidJS', value: 'solid' },
    { label: 'React', value: 'react' },
  ],
})

export function ModularFormDemo() {
  const [, { Form: FormComponent, Field: FieldComponent }] = useForm({
    initialValues: { framework: 'solid' },
  })
  return (
    <FormComponent onSubmit={(values) => console.log(values)}>
      <FieldComponent name="framework">
        {(field, props) => (
          <Select.Root
            collection={collection}
            value={field.value ? [field.value] : []}
            onValueChange={(e) => props.onChange(e.value[0])}
            onOpenChange={() => props.onBlur()}
          >
            {/* …anatomy… */}
            <Select.HiddenSelect />
          </Select.Root>
        )}
      </FieldComponent>
    </FormComponent>
  )
}
```

**Why a Solid-native library matters:** `modular-forms` understands Solid signals and reactivity natively, so field updates are fine-grained — no re-render of the whole form on each keystroke. RHF, by contrast, is built on React's rendering model and needs adapter glue in Solid.

**Not:** "Modrack" is not a real library — it is a hallucination. Use `modular-forms` for Solid. For library-specific adapters and the latest snippets, check ark-ui.com — the Ark docs maintain form-library recipes per release.

→ For the body form overview, see §11 in `SKILL.md`.

---

## Controlled vs Uncontrolled Recipes

Two questions decide controlled vs uncontrolled:

- Do you need to read or write the state from **outside** the component — a parent effect, a URL parameter, another component, a form library, the server? → **controlled.**
- Is the state purely local to this component's own UI and never read elsewhere? → **uncontrolled** is simpler and avoids re-render churn.

**Why pick deliberately:** uncontrolled is not a "lazy default" — it is the correct choice when state is genuinely local. Promoting to controlled "just in case" means you now own synchronization (and the bugs that come with it) for no benefit.

### Quick-reference: which mode for which scenario

| Scenario | Mode | Why |
|----------|------|-----|
| Tabs synced to the URL (`?tab=account`) | Controlled | The router is the source of truth |
| Accordion state shared with a "collapse all" button elsewhere | Controlled | Another component drives it |
| Select value bound to a form library | Controlled | The form owns the value |
| Dialog opened from a Menu item (imperative) | Controlled + `RootProvider` | Open state set from outside the tree |
| Accordion on an FAQ page | Uncontrolled | No one else reads it |
| Tabs within a single settings panel | Uncontrolled | Local UI only |
| Popover/Tooltip on hover | Uncontrolled | Ephemeral, trigger-driven |

### `defaultValue` vs `value` + `onValueChange` per family

| Component | Uncontrolled seed | Controlled pair | Detail shape |
|-----------|-------------------|-----------------|--------------|
| Accordion | `defaultValue={['item-1']}` | `value` + `onValueChange` | `e.value` (array) |
| Dialog | `defaultOpen` | `open` + `onOpenChange` | `e.open` (boolean) |
| Select | `defaultValue={['solid']}` | `value` + `onValueChange` | `e.value` (array) |
| Combobox | `defaultInputValue` / `defaultValue` | `inputValue` + `onInputChange` / `value` + `onValueChange` | `e.value` (string / array) |
| Menu | `defaultOpen` | `open` + `onOpenChange` | `e.open` (boolean) |
| Popover | `defaultOpen` | `open` + `onOpenChange` | `e.open` (boolean) |
| Tabs | `defaultValue="account"` | `value` + `onValueChange` | `e.value` (string) |
| Slider | `defaultValue={[30]}` | `value` + `onValueChange` | `e.value` (array) |

**Gotcha:** the detail-object shape varies by family — Accordion/Select/Slider give an array, Dialog/Menu/Popover give a boolean via `e.open`, Tabs give a single string. Read the documented field for each component rather than assuming positional args (→ §4 in `SKILL.md`).

→ For the imperative/`RootProvider` case, see [RootProvider Recipes](#rootprovider-recipes) below.

---

## RootProvider Recipes

When you need the machine **before** `Root` renders — to open a Dialog from a Menu item, share one machine across two views, or drive a component imperatively — use the component's `use<Component>` hook with `RootProvider`. The verified API (M1) is:

```tsx
import { Accordion, useAccordion } from '@ark-ui/solid/accordion'

const accordion = useAccordion({ multiple: true, defaultValue: ['item-1'] })
// accordion is a function in Solid — read state with accordion().value
<Accordion.RootProvider value={accordion}>
  {/* anatomy, but NO Accordion.Root — RootProvider replaces it */}
</Accordion.RootProvider>
```

**Why `use<Component>()` returns an accessor in Solid:** Solid tracks dependencies by call site, so the hook returns a function you call to read state (`accordion().value`), not a plain object. This keeps reads reactive.

**Why skip `Root`:** `Root` internally calls the same hook and creates its own machine. Passing the external machine to `RootProvider` already supplies it — wrapping in `Root` would create a second, disconnected one. Use `Root` **or** `RootProvider`, not both.

### Example: open a Dialog from a Menu item

The Dialog lives outside the Menu's subtree, but the Menu item must trigger it. Create the Dialog machine up front, drive it from the Menu, and render the Dialog with `RootProvider`:

```tsx
import { Menu } from '@ark-ui/solid'
import { Dialog, useDialog } from '@ark-ui/solid/dialog'

export function MenuOpensDialog() {
  const dialog = useDialog() // create the machine up front — shared with the Menu's onClick

  return (
    <>
      <Menu.Root>
        <Menu.Trigger class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner class="z-[calc(1000+var(--layer-index,0))]">
            <Menu.Content class="w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
              <Menu.Item class="flex w-full cursor-pointer px-2 py-1.5 text-sm data-[highlighted]:bg-gray-100" onClick={() => dialog().setOpen(true)}>
                <Menu.ItemText>Open dialog…</Menu.ItemText>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Dialog.RootProvider value={dialog}>
        <Dialog.Portal>
          <Dialog.Backdrop class="fixed inset-0 bg-black/40" />
          <Dialog.Positioner class="fixed inset-0 flex items-center justify-center">
            <Dialog.Content class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <Dialog.Title class="text-lg font-semibold">Remote dialog</Dialog.Title>
              <Dialog.Description class="mt-2 text-sm text-gray-600">This dialog was opened by a machine created outside its own tree.</Dialog.Description>
              <div class="mt-6 flex justify-end">
                <Dialog.CloseTrigger class="rounded-md bg-gray-100 px-4 py-2 text-sm">Close</Dialog.CloseTrigger>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Portal>
      </Dialog.RootProvider>
    </>
  )
}
```

**Tip:** the setter name follows the component's documented API — open-state machines (Dialog, Popover, Menu) expose `setOpen`; value-state machines (Accordion, Select, Tabs) expose `setValue`. When in doubt, consult the component's context-API page on ark-ui.com.

**Gotcha:** call the hook (`useDialog`) at the top level of the component, not inside a callback or inside the Menu's render scope — otherwise you create a new machine per render and lose the shared reference.

→ For the `RootProvider` rationale and the controlled/`api` model, see §4 in `SKILL.md`; for the machine lifecycle and `getItemState`, see `references/core-concepts.md`.
