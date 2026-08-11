# Toggle Group

Groups multiple toggle controls, allowing users to enable one or multiple options. The `ToggleGroup` component acts as a container for a set of `ToggleGroup.Item` components, providing coordinated selection state, keyboard navigation, and accessibility semantics.

## Overview

The `ToggleGroup` is a composite component that manages a set of toggleable items. It supports two selection modes:

- **`'single'`** — Only one item can be selected at a time. The `value` is a `string`.
- **`'multiple'`** — Multiple items can be selected simultaneously. The `value` is a `string[]`.

This makes the component suitable for both radio-like single-choice scenarios (e.g., text alignment) and multi-choice scenarios (e.g., bold/italic/underline text formatting).

The component handles roving focus, keyboard navigation, looping, and ARIA attributes automatically.

## Component Structure

The `ToggleGroup` consists of two parts:

- **`ToggleGroup.Root`** — The container that holds the toggle items, manages shared state, and provides keyboard navigation context.
- **`ToggleGroup.Item`** — An individual toggle button within the group. Each item has a unique `value` and toggles on/off independently (subject to the group's `type`).

```svelte
<script lang="ts">
  import { ToggleGroup } from "bits-ui";
</script>

<ToggleGroup.Root>
  <ToggleGroup.Item value="bold">bold</ToggleGroup.Item>
  <ToggleGroup.Item value="italic">italic</ToggleGroup.Item>
</ToggleGroup.Root>
```

## API Reference

### ToggleGroup.Root

The root component which contains the toggle group items.

| Property          | Type                                                       | Default       | Description                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type` (required) | `enum` — `'single' \| 'multiple'`                          | `undefined`   | The type of the component, used to determine the type of the value. When `'multiple'`, the value will be an array.                                                  |
| `value` ($bindable) | `union` — `string \| string[]`                           | `undefined`   | The value of the toggle group. If the `type` is `'multiple'`, this will be an array of strings; otherwise it will be a string. Bindable via `bind:value`.           |
| `onValueChange`   | `function` — `(value: string) => void \| (value: string[]) => void` | `undefined` | A callback function called when the value of the toggle group changes. The type of the value depends on the `type` of the toggle group.                             |
| `disabled`        | `boolean`                                                  | `false`       | Whether the entire toggle group is disabled.                                                                                                                        |
| `loop`            | `boolean`                                                  | `true`        | Whether the toggle group should loop when navigating with the keyboard (e.g., focus wraps from last item back to first and vice versa).                            |
| `orientation`     | `enum` — `'horizontal' \| 'vertical'`                      | `'horizontal'`| The orientation of the toggle group. Affects keyboard navigation (arrow keys) and the `data-orientation` attribute.                                                 |
| `rovingFocus`     | `boolean`                                                  | `true`        | Whether the toggle group should use roving focus when navigating. When enabled, only the active item receives focus within the group.                              |
| `ref` ($bindable) | `HTMLDivElement`                                           | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                          |
| `children`        | `Snippet`                                                  | `undefined`   | The children content to render.                                                                                                                                     |
| `child`           | `Snippet` — `type SnippetProps = { props: Record<string, unknown>; }` | `undefined` | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                        |

#### ToggleGroup.Root Data Attributes

| Data Attribute           | Value                               | Description                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| `data-orientation`       | `enum` — `'horizontal' \| 'vertical'` | The orientation of the toggle group. |
| `data-toggle-group-root` | `''`                                | Present on the root element.         |

### ToggleGroup.Item

An individual toggle item within the group.

| Property          | Type                                                       | Default       | Description                                                                                                                                   |
| ----------------- | ---------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`           | `string`                                                   | `undefined`   | The value of the item. Used to identify the item within the group's `value` state.                                                            |
| `disabled`        | `boolean`                                                  | `false`       | Whether this individual item is disabled.                                                                                                     |
| `ref` ($bindable) | `HTMLButtonElement`                                        | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children`        | `Snippet`                                                  | `undefined`   | The children content to render.                                                                                                               |
| `child`           | `Snippet` — `type SnippetProps = { props: Record<string, unknown>; }` | `undefined` | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.  |

#### ToggleGroup.Item Data Attributes

| Data Attribute           | Value                               | Description                                        |
| ------------------------ | ----------------------------------- | -------------------------------------------------- |
| `data-state`             | `enum` — `'on' \| 'off'`            | Whether the toggle item is in the on or off state. |
| `data-value`             | `''`                                | The value of the toggle item.                      |
| `data-orientation`       | `enum` — `'horizontal' \| 'vertical'` | The orientation of the toggle group.               |
| `data-disabled`          | `''`                                | Present when the toggle item is disabled.          |
| `data-toggle-group-item` | `''`                                | Present on the toggle group item.                  |

## Data Attributes

All `data-*` attributes exposed by the Toggle Group component parts.

| Attribute                  | Part  | Value                                  | Description                                        |
| -------------------------- | ----- | -------------------------------------- | -------------------------------------------------- |
| `data-orientation`         | Root  | `'horizontal' \| 'vertical'`           | The orientation of the toggle group.               |
| `data-toggle-group-root`   | Root  | `''`                                   | Present on the root element.                       |
| `data-state`               | Item  | `'on' \| 'off'`                        | Whether the toggle item is in the on or off state. |
| `data-value`               | Item  | `''`                                   | The value of the toggle item.                      |
| `data-orientation`         | Item  | `'horizontal' \| 'vertical'`           | The orientation of the toggle group.               |
| `data-disabled`            | Item  | `''`                                   | Present when the toggle item is disabled.          |
| `data-toggle-group-item`   | Item  | `''`                                   | Present on the toggle group item.                  |

## CSS Variables

The Toggle Group component does not expose any `--bits-*` CSS variables. Styling is driven entirely through the `data-*` attributes listed above (e.g., `data-[state=on]:bg-muted`, `data-[state=off]:text-foreground-alt`).

## Examples

### Single Selection

When `type` is `'single'`, only one item can be active at a time. The `value` is a `string`.

```svelte
<script lang="ts">
  import { ToggleGroup } from "bits-ui";
  import IconAlignLeft from "phosphor-svelte/lib/TextAlignLeft";
  import IconAlignCenter from "phosphor-svelte/lib/TextAlignCenter";
  import IconAlignRight from "phosphor-svelte/lib/TextAlignRight";

  let value = $state("left");
</script>

<ToggleGroup.Root type="single" bind:value>
  <ToggleGroup.Item value="left" aria-label="Align left">
    <IconAlignLeft />
  </ToggleGroup.Item>
  <ToggleGroup.Item value="center" aria-label="Align center">
    <IconAlignCenter />
  </ToggleGroup.Item>
  <ToggleGroup.Item value="right" aria-label="Align right">
    <IconAlignRight />
  </ToggleGroup.Item>
</ToggleGroup.Root>
```

### Multiple Selection

When `type` is `'multiple'`, multiple items can be active at the same time. The `value` is a `string[]`.

```svelte
<script lang="ts">
  import { ToggleGroup } from "bits-ui";
  import TextB from "phosphor-svelte/lib/TextB";
  import TextItalic from "phosphor-svelte/lib/TextItalic";
  import TextStrikethrough from "phosphor-svelte/lib/TextStrikethrough";

  let value = $state<string[]>(["bold"]);
</script>

<ToggleGroup.Root type="multiple" bind:value>
  <ToggleGroup.Item value="bold" aria-label="Toggle bold">
    <TextB class="size-6" />
  </ToggleGroup.Item>
  <ToggleGroup.Item value="italic" aria-label="Toggle italic">
    <TextItalic class="size-6" />
  </ToggleGroup.Item>
  <ToggleGroup.Item value="strikethrough" aria-label="Toggle strikethrough">
    <TextStrikethrough class="size-6" />
  </ToggleGroup.Item>
</ToggleGroup.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet for render delegation when you need to render your own element instead of the default. The `props` passed to the snippet include all the necessary attributes and event handlers that must be spread onto your custom element.

```svelte
<script lang="ts">
  import { ToggleGroup } from "bits-ui";
  import type { SnippetProps } from "bits-ui";

  let value = $state<string[]>([]);
</script>

<ToggleGroup.Root type="multiple" bind:value>
  {#snippet child({ props })}
    <div {...props} class="flex items-center gap-1">
      {@render children?.()}
    </div>
  {/snippet}
  <ToggleGroup.Item value="a">A</ToggleGroup.Item>
  <ToggleGroup.Item value="b">B</ToggleGroup.Item>
</ToggleGroup.Root>
```

For an individual item, apply render delegation the same way:

```svelte
<ToggleGroup.Item value="a">
  {#snippet child({ props })}
    <button {...props} class="my-custom-button">
      A
    </button>
  {/snippet}
</ToggleGroup.Item>
```

### Fully Controlled (Function Binding)

Use a Svelte [function binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes.

```svelte
<script lang="ts">
  import { ToggleGroup } from "bits-ui";

  let myValue = $state("");

  function getValue() {
    return myValue;
  }

  function setValue(newValue: string) {
    myValue = newValue;
  }
</script>

<ToggleGroup.Root type="single" bind:value={getValue, setValue}>
  <ToggleGroup.Item value="item-1">Item 1</ToggleGroup.Item>
  <ToggleGroup.Item value="item-2">Item 2</ToggleGroup.Item>
</ToggleGroup.Root>
```

### External Control

Because `value` is bindable, you can drive the toggle group from external UI:

```svelte
<script lang="ts">
  import { ToggleGroup } from "bits-ui";

  let myValue = $state("");
</script>

<button onclick={() => (myValue = "item-1")}>Press item 1</button>

<ToggleGroup.Root type="single" bind:value={myValue}>
  <ToggleGroup.Item value="item-1">Item 1</ToggleGroup.Item>
  <ToggleGroup.Item value="item-2">Item 2</ToggleGroup.Item>
</ToggleGroup.Root>
```

## Accessibility

The Toggle Group component follows the WAI-ARIA pattern for toggle buttons and uses roving tabindex for keyboard navigation.

### Keyboard Navigation

| Key                     | Behavior                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `Tab`                   | Moves focus into the toggle group. With roving focus, only one item is tabbable at a time.        |
| `Arrow Right` / `Arrow Down` | Moves focus to the next item. If `loop` is enabled, wraps from last to first.               |
| `Arrow Left` / `Arrow Up`   | Moves focus to the previous item. If `loop` is enabled, wraps from first to last.            |
| `Home`                  | Moves focus to the first item in the group.                                                       |
| `End`                   | Moves focus to the last item in the group.                                                        |
| `Space` / `Enter`       | Toggles the currently focused item.                                                               |

### ARIA

- The root and items expose `data-orientation` to reflect the orientation, which mirrors the ARIA semantics for directional navigation.
- Each `ToggleGroup.Item` renders as a `<button>` element, which provides native `aria-pressed` semantics implicitly through the `data-state` attribute styling hooks.
- Provide an `aria-label` on each item when it contains only an icon, so screen readers can announce the item's purpose.
- When an item is disabled, the `data-disabled` attribute is present and the button's native `disabled` property is set, preventing interaction and removing it from the tab order.

### Orientation

Set `orientation="vertical"` when items are stacked vertically. This changes the active arrow keys to `Arrow Up` / `Arrow Down` and updates the `data-orientation` attribute so styling can adapt accordingly.

## Tips

### Styling Based on State

Use the `data-state` attribute on items to style on/off states without any JavaScript:

```svelte
<ToggleGroup.Item
  value="bold"
  class="data-[state=on]:bg-muted data-[state=off]:bg-background-alt"
>
  Bold
</ToggleGroup.Item>
```

### Disabling the Entire Group vs. Individual Items

Set `disabled` on `ToggleGroup.Root` to disable all items at once. Set `disabled` on an individual `ToggleGroup.Item` to disable just that item while leaving the rest interactive.

```svelte
<!-- Entire group disabled -->
<ToggleGroup.Root type="multiple" disabled>
  <ToggleGroup.Item value="a">A</ToggleGroup.Item>
  <ToggleGroup.Item value="b">B</ToggleGroup.Item>
</ToggleGroup.Root>

<!-- Only one item disabled -->
<ToggleGroup.Root type="multiple">
  <ToggleGroup.Item value="a">A</ToggleGroup.Item>
  <ToggleGroup.Item value="b" disabled>B</ToggleGroup.Item>
</ToggleGroup.Root>
```

### Reactive Value with `onValueChange`

If you need to react to changes without binding (e.g., to persist to a store or trigger a side effect), use `onValueChange`:

```svelte
<script lang="ts">
  import { ToggleGroup } from "bits-ui";

  let value = $state<string[]>([]);

  function handleChange(newValue: string[]) {
    value = newValue;
    // e.g., save to localStorage, trigger a request, etc.
    console.log("Selected:", newValue);
  }
</script>

<ToggleGroup.Root type="multiple" {value} onValueChange={handleChange}>
  <ToggleGroup.Item value="a">A</ToggleGroup.Item>
  <ToggleGroup.Item value="b">B</ToggleGroup.Item>
</ToggleGroup.Root>
```

### Roving Focus

Roving focus is enabled by default (`rovingFocus={true}`). This means only one item in the group has `tabindex="0"` at any time; the rest have `tabindex="-1"`. This is the expected behavior for composite widgets and keeps keyboard users from having to tab through every item. Disable it only if you have a specific reason — for example, when the group is part of a larger custom focus-management scheme.

### Looping

Looping is enabled by default (`loop={true}`). Arrow-key navigation wraps around at the boundaries. Set `loop={false}` to stop focus at the first and last items instead of wrapping.

### Always Provide `aria-label` for Icon-Only Items

When an item contains only an icon (no visible text), screen readers have nothing to announce. Always provide an `aria-label`:

```svelte
<ToggleGroup.Item value="bold" aria-label="Toggle bold">
  <TextB />
</ToggleGroup.Item>
```
