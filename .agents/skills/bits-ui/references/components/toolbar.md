# Toolbar

A toolbar component that displays frequently used actions or tools in a compact, easily accessible bar. It provides a set of grouped toggle items, buttons, and links with built-in keyboard navigation, roving focus, and accessibility support.

## Overview

The `Toolbar` component is a headless primitive for rendering a horizontal or vertical bar of controls — buttons, links, and toggle groups. It manages focus roving between items, supports arrow-key navigation with optional looping, and groups related toggleable items (such as text alignment or formatting toggles) via `Toolbar.Group`.

It is part of Bits UI, a headless Svelte component library, meaning it provides the behavior and accessibility wiring without imposing any styles — you bring your own classes.

Key capabilities:

- **Roving focus** — Only one item in the toolbar is tabbable at a time; arrow keys move focus between items.
- **Orientation** — Supports both `horizontal` (default) and `vertical` layouts, which also determines arrow-key behavior (Left/Right vs. Up/Down).
- **Toggle groups** — `Toolbar.Group` acts as a single-select or multi-select group of toggle items, with a bindable `value`.
- **Looping** — Optional `loop` prop lets focus wrap from the last item back to the first and vice versa.
- **Buttons & Links** — `Toolbar.Button` and `Toolbar.Link` provide toolbar-aware action and navigation primitives.

## Component Structure

The Toolbar is composed of the following parts:

- **`Toolbar.Root`** — The root container that wraps all toolbar content. Manages orientation, looping, and roving focus for its descendants.
- **`Toolbar.Button`** — A button in the toolbar. Renders a `<button>` element and participates in roving focus.
- **`Toolbar.Link`** — A link in the toolbar. Renders an `<a>` element and participates in roving focus.
- **`Toolbar.Group`** — A group of toggle items within the toolbar. Behaves like a toggle group (`type="single"` or `type="multiple"`) and manages its own `value`.
- **`Toolbar.GroupItem`** — A single toggle item inside a `Toolbar.Group`. Renders a `<button>` with toggle semantics (`aria-pressed`) and a `data-state` of `on` or `off`.

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";
</script>

<Toolbar.Root>
  <Toolbar.Group type="multiple">
    <Toolbar.GroupItem value="bold">B</Toolbar.GroupItem>
    <Toolbar.GroupItem value="italic">I</Toolbar.GroupItem>
  </Toolbar.Group>
  <Toolbar.Link href="/docs">Docs</Toolbar.Link>
  <Toolbar.Button>Action</Toolbar.Button>
</Toolbar.Root>
```

> **Note:** The official Bits UI documentation for the Toolbar does not expose a `Toolbar.GroupHeading` or `Toolbar.Separator` part within the `Toolbar` namespace. To visually separate groups, use the standalone `Separator` component from `bits-ui` (as shown in the Examples section).

## API Reference

### `Toolbar.Root`

The root component which contains the toolbar. Manages orientation, looping, and roving focus for all descendant toolbar items.

| Prop          | Type                                            | Default        | Description                                                                                                                                                  |
| ------------- | ----------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loop`        | `boolean`                                       | `true`         | Whether or not the toolbar should loop when navigating. When `true`, focus wraps from the last item back to the first (and vice versa) during arrow-key nav. |
| `orientation` | `'horizontal' \| 'vertical'`                    | `'horizontal'` | The orientation of the toolbar. Also determines arrow-key behavior: Left/Right when horizontal, Up/Down when vertical.                                       |
| `ref`         | `HTMLDivElement`                                | `null`         | The underlying DOM element being rendered. `$bindable` — bind to this to get a reference to the element.                                                     |
| `children`    | `Snippet`                                       | `undefined`    | The children content to render.                                                                                                                              |
| `child`       | `Snippet` (`SnippetProps = { props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                     |

> **`ref` is `$bindable`**: Use `bind:ref={myEl}` to obtain a direct reference to the rendered `<div>` element.

### `Toolbar.Button`

A button in the toolbar. Renders a `<button>` element and participates in the toolbar's roving focus.

| Prop       | Type                                             | Default     | Description                                                                                                                                                  |
| ---------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `disabled` | `boolean`                                        | `false`     | Whether or not the button is disabled. When disabled, the button cannot be interacted with and is skipped during roving focus.                              |
| `ref`      | `HTMLButtonElement`                              | `null`      | The underlying DOM element being rendered. `$bindable` — bind to this to get a reference to the element.                                                     |
| `children` | `Snippet`                                        | `undefined` | The children content to render.                                                                                                                              |
| `child`    | `Snippet` (`SnippetProps = { props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                     |

> **Standard attributes**: Any native `<button>` attributes (e.g., `type`, `onclick`, `aria-*`, `form`) can be passed through and applied to the underlying element.

### `Toolbar.Link`

A link in the toolbar. Renders an `<a>` element and participates in the toolbar's roving focus.

| Prop       | Type                                             | Default     | Description                                                                                                                                                  |
| ---------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ref`      | `HTMLAnchorElement`                              | `null`      | The underlying DOM element being rendered. `$bindable` — bind to this to get a reference to the element.                                                     |
| `children` | `Snippet`                                        | `undefined` | The children content to render.                                                                                                                              |
| `child`    | `Snippet` (`SnippetProps = { props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                     |

> **Standard attributes**: Any native `<a>` attributes (e.g., `href`, `target`, `rel`, `aria-*`) can be passed through and applied to the underlying element.

### `Toolbar.Group`

A group of toggle items in the toolbar. Behaves like a toggle group — when `type="single"`, only one item can be active at a time; when `type="multiple"`, multiple items can be toggled on simultaneously.

| Prop            | Type                                             | Default     | Description                                                                                                                                                  |
| --------------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`          | `'single' \| 'multiple'`                         | `undefined` | **Required.** The type of the group, used to determine the type of the value. When `'multiple'`, the value will be an array of strings; otherwise a string. |
| `value`         | `string \| string[]`                             | `undefined` | The value of the toggle group. If `type` is `'multiple'`, this is an array of strings; otherwise a single string. `$bindable` — use `bind:value`.           |
| `onValueChange` | `(value: string) => void \| (value: string[]) => void` | `undefined` | A callback function called when the value changes. The argument type matches `type` (single string vs. array).                                         |
| `disabled`      | `boolean`                                        | `false`     | Whether or not the group is disabled. When `true`, all items in the group are disabled and skipped during roving focus.                                     |
| `ref`           | `HTMLDivElement`                                 | `null`      | The underlying DOM element being rendered. `$bindable` — bind to this to get a reference to the element.                                                     |
| `children`      | `Snippet`                                        | `undefined` | The children content to render.                                                                                                                              |
| `child`         | `Snippet` (`SnippetProps = { props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                     |

### `Toolbar.GroupItem`

A toggle item in the toolbar toggle group. Renders a `<button>` with toggle semantics (`aria-pressed`) and reflects its on/off state via the `data-state` attribute.

| Prop       | Type                                             | Default     | Description                                                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`    | `string`                                         | `undefined` | **Required.** The value of the toggle group item. When the item is selected, the group's value will be set to this value (single mode) or this value will be pushed to the group's array value (multiple mode).                                                                  |
| `disabled` | `boolean`                                        | `false`     | Whether or not the item is disabled. When disabled, the item cannot be toggled and is skipped during roving focus.                                                                                                                                                               |
| `ref`      | `HTMLButtonElement`                              | `null`      | The underlying DOM element being rendered. `$bindable` — bind to this to get a reference to the element.                                                                                                                                                                          |
| `children` | `Snippet`                                        | `undefined` | The children content to render.                                                                                                                                                                                                                                                   |
| `child`    | `Snippet` (`SnippetProps = { props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                                                                                                          |

## Data Attributes

Data attributes are present on the rendered elements and can be targeted via CSS or queried via JavaScript.

### `Toolbar.Root`

| Data Attribute      | Value                              | Description                       |
| ------------------- | ---------------------------------- | --------------------------------- |
| `data-orientation`  | `'vertical' \| 'horizontal'`       | The orientation of the component. |
| `data-toolbar-root` | `''`                               | Present on the root element.      |

### `Toolbar.Button`

| Data Attribute        | Value | Description                    |
| --------------------- | ----- | ------------------------------ |
| `data-toolbar-button` | `''`  | Present on the button element. |

### `Toolbar.Link`

| Data Attribute      | Value | Description                  |
| ------------------- | ----- | ---------------------------- |
| `data-toolbar-link` | `''`  | Present on the link element. |

### `Toolbar.Group`

| Data Attribute       | Value | Description                   |
| -------------------- | ----- | ----------------------------- |
| `data-toolbar-group` | `''`  | Present on the group element. |

### `Toolbar.GroupItem`

| Data Attribute      | Value             | Description                                                |
| ------------------- | ----------------- | ---------------------------------------------------------- |
| `data-state`        | `'on' \| 'off'`   | Whether the toolbar toggle item is in the on or off state. |
| `data-value`        | `''`              | The value of the toolbar toggle item.                      |
| `data-disabled`     | `''`              | Present when the toolbar toggle item is disabled.          |
| `data-toolbar-item` | `''`              | Present on the toolbar toggle item.                        |

### Styling with data attributes

Use the data attributes as styling hooks to target components without coupling to a specific class name:

```css
[data-toolbar-root] {
  /* shared toolbar styles */
}

[data-toolbar-item][data-state="on"] {
  /* active/toggled-on item styles */
}

[data-toolbar-item][data-state="off"] {
  /* inactive/toggled-off item styles */
}

[data-toolbar-item][data-disabled] {
  /* disabled item styles */
}
```

## CSS Variables

The Toolbar component does not expose any `--bits-*` CSS variables. Styling is done entirely via class names or the `data-*` attributes listed above.

## Examples

### Basic Structure

A minimal toolbar with a toggle group, a link, and a button:

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";
</script>

<Toolbar.Root>
  <Toolbar.Group type="multiple">
    <Toolbar.GroupItem value="bold">B</Toolbar.GroupItem>
    <Toolbar.GroupItem value="italic">I</Toolbar.GroupItem>
  </Toolbar.Group>
  <Toolbar.Link href="/docs">Docs</Toolbar.Link>
  <Toolbar.Button>Action</Toolbar.Button>
</Toolbar.Root>
```

### Formatting Toolbar (Multiple Selection)

A rich text formatting toolbar with multiple toggle groups, separators, and an action button. The first group allows multiple toggles (bold, italic, strikethrough); the second group is single-select (text alignment):

```svelte
<script lang="ts">
  import { Separator, Toolbar } from "bits-ui";
  import Sparkle from "phosphor-svelte/lib/Sparkle";
  import TextAlignCenter from "phosphor-svelte/lib/TextAlignCenter";
  import TextAlignLeft from "phosphor-svelte/lib/TextAlignLeft";
  import TextAlignRight from "phosphor-svelte/lib/TextAlignRight";
  import TextB from "phosphor-svelte/lib/TextB";
  import TextItalic from "phosphor-svelte/lib/TextItalic";
  import TextStrikethrough from "phosphor-svelte/lib/TextStrikethrough";

  let text = $state(["bold"]);
  let align = $state("");
</script>

<Toolbar.Root
  class="flex h-12 min-w-max items-center justify-center rounded-10px border border-border bg-background-alt px-[4px] py-1 shadow-mini"
>
  <Toolbar.Group
    bind:value={text}
    type="multiple"
    class="flex items-center gap-x-0.5"
  >
    <Toolbar.GroupItem
      aria-label="toggle bold"
      value="bold"
      class="inline-flex size-10 items-center justify-center rounded-9px bg-background-alt text-foreground/60 transition-all hover:bg-muted active:bg-dark-10 active:scale-[0.98] data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10"
    >
      <TextB class="size-6" />
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="toggle italic"
      value="italic"
      class="inline-flex size-10 items-center justify-center rounded-9px bg-background-alt text-foreground/60 transition-all hover:bg-muted active:bg-dark-10 active:scale-[0.98] data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10"
    >
      <TextItalic class="size-6" />
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="toggle strikethrough"
      value="strikethrough"
      class="inline-flex size-10 items-center justify-center rounded-9px bg-background-alt text-foreground/60 transition-all hover:bg-muted active:bg-dark-10 active:scale-[0.98] data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10"
    >
      <TextStrikethrough class="size-6" />
    </Toolbar.GroupItem>
  </Toolbar.Group>

  <Separator.Root class="-my-1 mx-1 w-[1px] self-stretch bg-dark-10" />

  <Toolbar.Group
    bind:value={align}
    type="single"
    class="flex items-center gap-x-0.5"
  >
    <Toolbar.GroupItem
      aria-label="align left"
      value="left"
      class="inline-flex size-10 items-center justify-center rounded-9px bg-background-alt text-foreground/60 transition-all hover:bg-muted active:bg-dark-10 active:scale-[0.98] data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10"
    >
      <TextAlignLeft class="size-6" />
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="align center"
      value="center"
      class="inline-flex size-10 items-center justify-center rounded-9px bg-background-alt text-foreground/60 transition-all hover:bg-muted active:bg-dark-10 active:scale-[0.98] data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10"
    >
      <TextAlignCenter class="size-6" />
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="align right"
      value="right"
      class="inline-flex size-10 items-center justify-center rounded-9px bg-background-alt text-foreground/60 transition-all hover:bg-muted active:bg-dark-10 active:scale-[0.98] data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10"
    >
      <TextAlignRight class="size-6" />
    </Toolbar.GroupItem>
  </Toolbar.Group>

  <Separator.Root class="-my-1 mx-1 w-[1px] self-stretch bg-dark-10" />

  <div class="flex items-center">
    <Toolbar.Button
      class="inline-flex items-center justify-center rounded-9px px-3 py-2 text-sm font-medium text-foreground/80 transition-all hover:bg-muted active:bg-dark-10 active:scale-[0.98]"
    >
      <Sparkle class="mr-2 size-6" />
      <span>Ask AI</span>
    </Toolbar.Button>
  </div>
</Toolbar.Root>
```

### Managing Value State

#### Two-Way Binding

Use `bind:value` for simple, automatic state synchronization between the toggle group and your own state:

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";

  let myValue = $state("");
</script>

<button onclick={() => (myValue = "item-1")}>Press item 1</button>

<Toolbar.Root>
  <Toolbar.Group type="single" bind:value={myValue}>
    <Toolbar.GroupItem value="item-1">Item 1</Toolbar.GroupItem>
    <Toolbar.GroupItem value="item-2">Item 2</Toolbar.GroupItem>
  </Toolbar.Group>
</Toolbar.Root>
```

#### Fully Controlled

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes:

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";

  let myValue = $state("");

  function getValue() {
    return myValue;
  }

  function setValue(newValue: string) {
    myValue = newValue;
  }
</script>

<Toolbar.Root>
  <Toolbar.Group type="single" bind:value={getValue, setValue}>
    <Toolbar.GroupItem value="item-1">Item 1</Toolbar.GroupItem>
    <Toolbar.GroupItem value="item-2">Item 2</Toolbar.GroupItem>
  </Toolbar.Group>
</Toolbar.Root>
```

### Vertical Orientation

Set `orientation="vertical"` for a vertically stacked toolbar. Arrow-key navigation switches from Left/Right to Up/Down:

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";
</script>

<Toolbar.Root orientation="vertical" class="flex flex-col gap-1">
  <Toolbar.Button>Item 1</Toolbar.Button>
  <Toolbar.Button>Item 2</Toolbar.Button>
  <Toolbar.Button>Item 3</Toolbar.Button>
</Toolbar.Root>
```

### Disabling Loop

Set `loop={false}` to prevent focus from wrapping around at the ends of the toolbar:

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";
</script>

<Toolbar.Root loop={false}>
  <Toolbar.Button>First</Toolbar.Button>
  <Toolbar.Button>Last</Toolbar.Button>
</Toolbar.Root>
```

### Disabled Items

Pass `disabled` to individual items, or to an entire group:

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";
</script>

<Toolbar.Root>
  <Toolbar.Group type="single" disabled>
    <Toolbar.GroupItem value="a">A</Toolbar.GroupItem>
    <Toolbar.GroupItem value="b">B</Toolbar.GroupItem>
  </Toolbar.Group>
  <Toolbar.Button disabled>Disabled Action</Toolbar.Button>
</Toolbar.Root>
```

### Binding to the DOM Element

Use `bind:ref` to obtain a reference to the underlying element of any part:

```svelte
<script lang="ts">
  import { Toolbar } from "bits-ui";

  let rootEl = $state<HTMLDivElement | null>(null);
  let buttonEl = $state<HTMLButtonElement | null>(null);

  function focusButton() {
    buttonEl?.focus();
  }
</script>

<Toolbar.Root bind:ref={rootEl}>
  <Toolbar.Button bind:ref={buttonEl} onclick={focusButton}>
    Focus me
  </Toolbar.Button>
</Toolbar.Root>
```

## Accessibility

The Toolbar component implements the [WAI-ARIA Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) with roving focus.

### Keyboard Navigation

The toolbar uses a **roving tabindex** strategy: only one item in the toolbar is tabbable (`tabindex="0"`) at any given time; all other items have `tabindex="-1"`. This lets the user Tab into the toolbar once, then move between items with arrow keys.

| Key                                    | Behavior                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Tab`                                  | Moves focus into the toolbar (to the most recently focused item) and out of it to the next focusable element on the page. |
| `Arrow Right` / `Arrow Down`           | Moves focus to the next item. If `loop` is `true`, wraps from the last item back to the first.                            |
| `Arrow Left` / `Arrow Up`              | Moves focus to the previous item. If `loop` is `true`, wraps from the first item back to the last.                        |
| `Home`                                 | Moves focus to the first item in the toolbar.                                                                             |
| `End`                                  | Moves focus to the last item in the toolbar.                                                                              |
| `Enter` / `Space` (on `GroupItem`)     | Toggles the item's on/off state.                                                                                          |
| `Enter` (on `Button` / `Link`)         | Activates the button / follows the link.                                                                                  |

> **Orientation-aware arrows**: When `orientation="horizontal"`, Left/Right arrows move focus. When `orientation="vertical"`, Up/Down arrows move focus. The horizontal arrows are disabled in vertical mode and vice versa, matching the ARIA Authoring Practices Guide.

### ARIA

- The root container has the appropriate `role` for a toolbar and exposes `aria-orientation` reflecting the `orientation` prop.
- `Toolbar.GroupItem` exposes its pressed state via `aria-pressed` (`true` when on, `false` when off), and `data-state` mirrors this (`on` / `off`).
- Disabled items are skipped during roving focus and expose disabled state via `aria-disabled` / the `data-disabled` attribute.
- Always provide an `aria-label` (or visible text) for icon-only `Toolbar.GroupItem`, `Toolbar.Button`, and `Toolbar.Link` elements so assistive technology can announce their purpose.

### Roving Focus

Roving focus means the toolbar remembers which item was last focused. When the user Tabs away and back, focus returns to that item rather than the first item. This is essential for toolbars with many items, as it avoids forcing the user to Tab through every item to reach content after the toolbar.

## Tips

- **Separate groups visually with `Separator`**: The `Toolbar` namespace does not include its own separator — import `Separator` from `bits-ui` and place it between `Toolbar.Group`s to divide sections (see the formatting toolbar example). This keeps semantic grouping clear while providing a visual break.
- **Single vs. multiple groups**: Use `type="single"` when exactly one item should be active at a time (e.g., text alignment: left/center/right). Use `type="multiple"` when items are independent toggles (e.g., bold/italic/underline).
- **Styling toggled state**: Target `data-[state=on]` and `data-[state=off]` on `Toolbar.GroupItem` to style active vs. inactive toggles. With Tailwind, this is `data-[state=on]:bg-muted` etc.
- **Icon-only items need labels**: Always pass `aria-label` to icon-only `Toolbar.GroupItem`, `Toolbar.Button`, and `Toolbar.Link` so screen readers announce their purpose.
- **Looping**: Keep `loop` at its default (`true`) for most toolbars so users can cycle through items with arrow keys. Disable it (`loop={false}`) only when you want focus to stop at the ends.
- **Controlled vs. uncontrolled value**: For `Toolbar.Group`, `bind:value` is the simplest approach. Use a function binding (`bind:value={get, set}`) when you need to intercept or transform writes — for example, to persist the selection to a store or sync with external state.
- **Disabled groups**: Setting `disabled` on `Toolbar.Group` disables all its `GroupItem`s at once. Set `disabled` on individual items when only some should be inactive.
- **Render delegation**: Use the `child` snippet prop when you need to render a custom element instead of the default `<div>`/`<button>`/`<a>`. This is useful for integrating with another component library's primitives while keeping Bits UI's behavior. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.
- **Orientation drives arrows**: Match `orientation` to your visual layout. A horizontal toolbar with `orientation="vertical"` (or the reverse) will produce confusing arrow-key behavior because the enabled arrow direction won't match the visual arrangement.
