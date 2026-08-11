---
name: bits-ui
description: Build accessible, headless Svelte 5 UI components with Bits UI. Use when working with bits-ui package, building Svelte component libraries, needing headless/unstyled accessible components (accordion, dialog, dropdown menu, select, combobox, popover, tooltip, calendar, date picker, etc.), using data-attribute styling, child snippet render delegation, or migrating to Bits UI. Also triggers for any Svelte 5 project needing WAI-ARIA compliant primitives, compound component patterns, or references to Bits UI component APIs, props, data attributes, CSS variables, or types. Covers all 41 components, 5 utilities, and 4 type helpers.
---

# Bits UI Mastery Guide

## What Is Bits UI?

Bits UI is a **headless component library for Svelte 5** — it ships behavior, accessibility, and state management with zero styling. You get WAI-ARIA compliant, keyboard-navigable, fully accessible primitives and bring your own styles via `class` props, `data-*` attributes, or any CSS framework.

This is not a styled component library like Material UI or Chakra. It's closer to Radix UI but for Svelte, built on the shoulders of Melt UI (internal architecture) and React Spectrum (date/time components). If you approach it expecting pre-built themes, you'll fight the design. If you approach it as a set of behavioral primitives you style yourself, it stays out of your way.

## Mental Model

Every Bits UI component is three layers:

| Layer | What it provides | How you engage |
|-------|-----------------|----------------|
| **Behavior** | State management, keyboard nav, focus trapping, ARIA | Configure via props on `Root` |
| **Structure** | Fixed DOM parts (`Root`, `Trigger`, `Content`, `Item`, ...) | Compose as `Component.Part` children |
| **Styling** | Your CSS/Tailwind/UnoCSS, reacting to `data-*` attributes | Pass `class`/`style` to each part |

The structure and behavior are not yours to redesign. You compose the documented parts, configure via props, and apply styles. Treat the component anatomy as a fixed API surface.

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
</script>

<Accordion.Root type="single" class="w-full max-w-md">
  <Accordion.Item value="item-1" class="border rounded-md">
    <Accordion.Header>
      <Accordion.Trigger class="w-full p-4 text-left">Section 1</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content class="p-4">Content here</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

`Accordion.Root` holds the behavior. `Item`, `Header`, `Trigger`, `Content` are the anatomy. `class` props apply your styles. No CSS ships from the library.

## Installation

```bash
npm install bits-ui
```

For date/time components, also install the date library Bits UI depends on:

```bash
npm install @internationalized/date
```

Components are imported as namespaces and used as compound components:

```svelte
<script lang="ts">
  import { Dialog, Select, Popover } from "bits-ui";
</script>
```

## Core Concepts

These concepts apply across every component. Read the relevant reference when you encounter them in practice.

### Child Snippet — Render Delegation

The `child` snippet gives complete control over which HTML element renders. Use it when you need Svelte transitions, scoped styles, actions, or custom components as the rendered element.

```svelte
<Accordion.Trigger>
  {#snippet child({ props })}
    <button {...props} class="scoped-style">Toggle</button>
  {/snippet}
</Accordion.Trigger>
```

The `props` parameter contains all internal attributes, event handlers, and ARIA props. Always spread `{...props}` onto your custom element. For floating components (Popover, Tooltip, Dialog, etc.), a two-level wrapper structure is required.

→ Read `references/concepts/child-snippet.md` for full details, floating component rules, and pitfalls.

### Ref — Direct DOM Access

Every component rendering an HTML element exposes a `bind:ref` prop:

```svelte
<script lang="ts">
  let triggerRef = $state<HTMLButtonElement | null>(null);
</script>
<Accordion.Trigger bind:ref={triggerRef}>Trigger</Accordion.Trigger>
```

The ref may be `null` until mount. When using `child` snippet, pass custom `id` to the parent component, not the child element.

→ Read `references/concepts/ref.md` for child snippet integration and custom component patterns.

### Styling

Three approaches, all valid:
1. **CSS frameworks** — pass classes directly: `class="bg-blue-500 hover:bg-blue-600"`
2. **Data attributes** — target `[data-accordion-trigger]` in global CSS
3. **Scoped styles** — use `child` snippet to bring elements into component scope

Components expose state via `data-state`, `data-disabled`, `data-orientation` attributes and CSS variables like `--bits-accordion-content-height`.

→ Read `references/concepts/styling.md` for CSS variables, state styling, and animation techniques.

### Transitions

Bits UI handles mount/unmount lifecycle for animations. Use `forceMount` + `child` snippet to apply Svelte transitions:

```svelte
<Dialog.Content forceMount>
  {#snippet child({ props, open })}
    {#if open}
      <div {...props} transition:fly>Content</div>
    {/if}
  {/snippet}
</Dialog.Content>
```

→ Read `references/concepts/transitions.md` for the full pattern and reusable wrapper approach.

### State Management

Two approaches:
1. **Two-way binding** — `bind:value={myValue}` (simplest)
2. **Function binding** — `bind:value={getValue, setValue}` (full control, conditional updates)

→ Read `references/concepts/state-management.md` for patterns.

### Dates and Times

Date components use `@internationalized/date` with three immutable types:
- `CalendarDate` — date without time (`2024-07-10`)
- `CalendarDateTime` — date with time (`2024-07-10T12:30:00`)
- `ZonedDateTime` — date with time and timezone

These are immutable — use `.set()`, `.add()`, `.subtract()` to create new instances.

→ Read `references/concepts/dates.md` for type details, parsing, formatting, and placeholder usage.

## Component Catalog

All 41 components, organized by category. Each has a dedicated reference doc with full API, props, data attributes, CSS variables, and examples.

### Disclosure & Layout
| Component | Reference | Description |
|-----------|-----------|-------------|
| Accordion | `references/components/accordion.md` | Collapsible content sections |
| Collapsible | `references/components/collapsible.md` | Show/hide content |
| Aspect Ratio | `references/components/aspect-ratio.md` | Maintain width/height ratio |
| Separator | `references/components/separator.md` | Visual divider |
| Scroll Area | `references/components/scroll-area.md` | Custom scrollable region |
| Tabs | `references/components/tabs.md` | Tabbed content panels |
| Toolbar | `references/components/toolbar.md` | Grouping toolbar controls |

### Overlays & Popups
| Component | Reference | Description |
|-----------|-----------|-------------|
| Dialog | `references/components/dialog.md` | Modal dialog window |
| Alert Dialog | `references/components/alert-dialog.md` | Confirmation modal |
| Popover | `references/components/popover.md` | Floating content panel |
| Tooltip | `references/components/tooltip.md` | Hover information |
| Link Preview | `references/components/link-preview.md` | Preview on link hover |

### Menus
| Component | Reference | Description |
|-----------|-----------|-------------|
| Dropdown Menu | `references/components/dropdown-menu.md` | Dropdown action menu |
| Context Menu | `references/components/context-menu.md` | Right-click menu |
| Menubar | `references/components/menubar.md` | Horizontal menu bar |
| Navigation Menu | `references/components/navigation-menu.md` | Site navigation |
| Command | `references/components/command.md` | Command palette |
| Pagination | `references/components/pagination.md` | Page navigation |

### Forms & Inputs
| Component | Reference | Description |
|-----------|-----------|-------------|
| Button | `references/components/button.md` | Button primitive |
| Checkbox | `references/components/checkbox.md` | Checkbox input |
| Switch | `references/components/switch.md` | Toggle switch |
| Radio Group | `references/components/radio-group.md` | Radio button group |
| Slider | `references/components/slider.md` | Range slider input |
| Label | `references/components/label.md` | Form label |
| PIN Input | `references/components/pin-input.md` | OTP/PIN code input |
| Rating Group | `references/components/rating-group.md` | Star rating input |
| Select | `references/components/select.md` | Dropdown select |
| Combobox | `references/components/combobox.md` | Searchable select |
| Toggle | `references/components/toggle.md` | Toggle button |
| Toggle Group | `references/components/toggle-group.md` | Group of toggles |
| Meter | `references/components/meter.md` | Gauge/meter display |
| Progress | `references/components/progress.md` | Progress indicator |

### Date & Time
| Component | Reference | Description |
|-----------|-----------|-------------|
| Calendar | `references/components/calendar.md` | Date calendar |
| Range Calendar | `references/components/range-calendar.md` | Date range calendar |
| Date Field | `references/components/date-field.md` | Date input field |
| Date Range Field | `references/components/date-range-field.md` | Date range input |
| Date Picker | `references/components/date-picker.md` | Calendar + field combo |
| Date Range Picker | `references/components/date-range-picker.md` | Range calendar + fields |
| Time Field | `references/components/time-field.md` | Time input field |
| Time Range Field | `references/components/time-range-field.md` | Time range input |

### Other
| Component | Reference | Description |
|-----------|-----------|-------------|
| Avatar | `references/components/avatar.md` | User avatar with fallback |

## Utilities

| Utility | Reference | Description |
|---------|-----------|-------------|
| BitsConfig | `references/utilities/bits-config.md` | Global configuration |
| IsUsingKeyboard | `references/utilities/is-using-keyboard.md` | Keyboard vs mouse detection |
| mergeProps | `references/utilities/merge-props.md` | Merge multiple prop objects |
| Portal | `references/utilities/portal.md` | Render outside DOM tree |
| useId | `references/utilities/use-id.md` | Unique ID generation |

## Type Helpers

| Helper | Reference | Description |
|--------|-----------|-------------|
| WithElementRef | `references/type-helpers/with-element-ref.md` | Add `ref` to prop types |
| WithoutChild | `references/type-helpers/without-child.md` | Remove `child` snippet prop |
| WithoutChildren | `references/type-helpers/without-children.md` | Remove `children` snippet prop |
| WithoutChildrenOrChild | `references/type-helpers/without-children-or-child.md` | Remove both children and child |

## How to Use This Skill

1. **Building a specific component?** Read its reference doc in `references/components/` for the full API — props, data attributes, CSS variables, and code examples.
2. **Need to customize rendering?** Read `references/concepts/child-snippet.md` — the `child` snippet pattern is central to Bits UI.
3. **Styling questions?** Read `references/concepts/styling.md` for data attributes, CSS variables, and state-based styling.
4. **Working with dates?** Read `references/concepts/dates.md` before touching any date/time component.
5. **State not updating as expected?** Read `references/concepts/state-management.md` for binding patterns.
6. **Need transitions?** Read `references/concepts/transitions.md` for the `forceMount` + `child` snippet pattern.
7. **Building reusable wrappers?** Read the type helper docs to properly type your components.

## Key Design Decisions

- **Svelte 5 only** — Uses runes (`$state`, `$derived`, `$props`, `$bindable`), snippets (not slots), and native event handlers (`onclick` not `on:click`).
- **Namespace imports** — `import { Accordion } from "bits-ui"` then use `Accordion.Root`, `Accordion.Trigger`, etc.
- **No CSS shipped** — Every visual is yours. The library only adds `data-*` attributes for state.
- **Compound components** — Parts compose as children, not configuration objects. This gives you full DOM control.
- **Accessibility baked in** — WAI-ARIA compliance, keyboard navigation, focus management, and screen reader support are not optional add-ons.
