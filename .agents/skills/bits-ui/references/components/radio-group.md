# Radio Group

The Radio Group component groups multiple radio items under a common name for form submission. It is built on top of the native `<input type="radio">` elements and provides full keyboard navigation, accessibility, and form support.

## Overview

The `RadioGroup` component provides a set of mutually exclusive options, where the user can select a single value from a list. It is composed of a `Root` that wraps one or more `Item` components. Each item represents a single selectable choice with a unique `value`.

Key features:

- Full keyboard navigation (arrow keys) with optional looping.
- Support for `vertical` and `horizontal` orientations.
- Two-way binding of the selected value via `bind:value`.
- Built-in form submission support through a hidden input when the `name` prop is set.
- `disabled`, `readonly`, and `required` states.
- Render delegation via the `child` snippet for custom element rendering.

## Component Structure

The Radio Group consists of the following parts:

- **`RadioGroup.Root`** — The container element that groups the radio items and manages shared state (value, orientation, disabled, etc.). Renders as a `<div>`.
- **`RadioGroup.Item`** — A single radio choice. Must be a descendant of `RadioGroup.Root`. Renders as a `<button>`.

```svelte
<script lang="ts">
  import { RadioGroup } from "bits-ui";
</script>

<RadioGroup.Root>
  <RadioGroup.Item value="a">Option A</RadioGroup.Item>
  <RadioGroup.Item value="b">Option B</RadioGroup.Item>
</RadioGroup.Root>
```

## API Reference

### RadioGroup.Root

The radio group component used to group radio items under a common name for form submission. Renders as a `<div>`.

| Property          | Type                                      | Default      | Description                                                                                                                                            |
| ----------------- | ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`           | `string` (bindable)                       | `undefined`  | The value of the currently selected radio item. Bind to this (`bind:value`) to control the radio group's value from outside the component.            |
| `onValueChange`   | `(value: string) => void`                 | `undefined`  | A callback that is fired when the radio group's value changes.                                                                                         |
| `disabled`        | `boolean`                                 | `false`      | Whether the radio group is disabled. This prevents the user from interacting with it.                                                                  |
| `required`        | `boolean`                                 | `false`      | Whether the radio group is required. When set, the hidden form input will have the `required` attribute.                                              |
| `name`            | `string`                                  | `undefined`  | The name of the radio group used in form submission. If provided, a hidden input element will be rendered to submit the value of the radio group.     |
| `loop`            | `boolean`                                 | `false`      | Whether the radio group should loop through the items when navigating with the arrow keys.                                                             |
| `orientation`     | `'vertical' \| 'horizontal'`              | `'vertical'` | The orientation of the radio group. This determines how keyboard navigation works within the component.                                               |
| `readonly`        | `boolean`                                 | `false`      | Whether the radio group is readonly. When readonly, users can focus and navigate through items but cannot change the value.                           |
| `ref`             | `HTMLDivElement` (bindable)               | `null`       | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                            |
| `children`        | `Snippet`                                 | `undefined`  | The children content to render.                                                                                                                        |
| `child`           | `Snippet` (`{ props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.           |

#### RadioGroup.Root Data Attributes

| Data Attribute          | Value                               | Description                               |
| ----------------------- | ----------------------------------- | ----------------------------------------- |
| `data-orientation`      | `'vertical' \| 'horizontal'`        | The orientation of the radio group.       |
| `data-disabled`         | `''`                                | Present when the radio group is disabled. |
| `data-readonly`         | `''`                                | Present when the radio group is readonly. |
| `data-radio-group-root` | `''`                                | Present on the root element.              |

### RadioGroup.Item

A radio item, which must be a child of the `RadioGroup.Root` component. Renders as a `<button>`.

| Property         | Type                                              | Default      | Description                                                                                                                                   |
| ---------------- | ------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `string` (required)                               | `undefined`  | The value of the radio item. This should be unique for each radio item in the group.                                                          |
| `disabled`       | `boolean`                                         | `false`      | Whether the radio item is disabled.                                                                                                           |
| `ref`            | `HTMLButtonElement` (bindable)                    | `null`       | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children`       | `Snippet`                                         | `undefined`  | The children content to render. The snippet receives a `{ checked }` argument indicating the current checked state of the item.               |
| `child`          | `Snippet` (`{ props: Record<string, unknown> }`)  | `undefined`  | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.   |

#### RadioGroup.Item Data Attributes

| Data Attribute          | Value                         | Description                                |
| ----------------------- | ----------------------------- | ------------------------------------------ |
| `data-disabled`         | `''`                          | Present when the radio item is disabled.   |
| `data-readonly`         | `''`                          | Present when the radio group is readonly.  |
| `data-value`            | `''`                          | The value of the radio item.               |
| `data-state`            | `'checked' \| 'unchecked'`    | The radio item's checked state.            |
| `data-orientation`      | `''`                          | The orientation of the parent radio group. |
| `data-radio-group-item` | `''`                          | Present on the radio item element.         |

## Data Attributes

The following `data-*` attributes are applied to the component parts. Use them for CSS targeting and styling states.

### RadioGroup.Root

| Attribute               | Value                               | Description                               |
| ----------------------- | ----------------------------------- | ----------------------------------------- |
| `data-orientation`      | `'vertical' \| 'horizontal'`        | The orientation of the radio group.       |
| `data-disabled`         | `''`                                | Present when the radio group is disabled. |
| `data-readonly`         | `''`                                | Present when the radio group is readonly. |
| `data-radio-group-root` | `''`                                | Present on the root element.              |

### RadioGroup.Item

| Attribute               | Value                         | Description                                |
| ----------------------- | ----------------------------- | ------------------------------------------ |
| `data-disabled`         | `''`                          | Present when the radio item is disabled.   |
| `data-readonly`         | `''`                          | Present when the radio group is readonly.  |
| `data-value`            | `''`                          | The value of the radio item.               |
| `data-state`            | `'checked' \| 'unchecked'`    | The radio item's checked state.            |
| `data-orientation`      | `''`                          | The orientation of the parent radio group. |
| `data-radio-group-item` | `''`                          | Present on the radio item element.         |

## CSS Variables

The Radio Group component does not expose any `--bits-*` CSS variables.

## Examples

### Basic

```svelte
<script lang="ts">
  import { Label, RadioGroup } from "bits-ui";
</script>

<RadioGroup.Root class="flex flex-col gap-4 text-sm font-medium">
  <div class="flex select-none items-center">
    <RadioGroup.Item
      id="amazing"
      value="amazing"
      class="size-5 shrink-0 rounded-full border"
    />
    <Label.Root for="amazing" class="pl-3">Amazing</Label.Root>
  </div>
  <div class="flex select-none items-center">
    <RadioGroup.Item
      id="average"
      value="average"
      class="size-5 shrink-0 rounded-full border"
    />
    <Label.Root for="average" class="pl-3">Average</Label.Root>
  </div>
  <div class="flex select-none items-center">
    <RadioGroup.Item
      id="terrible"
      value="terrible"
      class="size-5 shrink-0 rounded-full border"
    />
    <Label.Root for="terrible" class="pl-3">Terrible</Label.Root>
  </div>
</RadioGroup.Root>
```

### With Child Snippet

The `children` snippet of `RadioGroup.Item` receives a `{ checked }` argument that you can use to conditionally render an indicator.

```svelte
<script lang="ts">
  import { RadioGroup } from "bits-ui";
</script>

<RadioGroup.Root>
  <RadioGroup.Item value="a">
    {#snippet children({ checked })}
      {#if checked}
        ✅
      {/if}
    {/snippet}
  </RadioGroup.Item>
  <RadioGroup.Item value="b">
    {#snippet children({ checked })}
      {#if checked}
        ✅
      {/if}
    {/snippet}
  </RadioGroup.Item>
</RadioGroup.Root>
```

### Horizontal

Use the `orientation` prop to render a horizontal radio group. Keyboard navigation will switch from `ArrowUp`/`ArrowDown` to `ArrowLeft`/`ArrowRight`.

```svelte
<script lang="ts">
  import { Label, RadioGroup } from "bits-ui";
</script>

<RadioGroup.Root orientation="horizontal" class="flex flex-row gap-4 text-sm font-medium">
  <div class="flex select-none items-center">
    <RadioGroup.Item
      id="h-amazing"
      value="amazing"
      class="size-5 shrink-0 rounded-full border"
    />
    <Label.Root for="h-amazing" class="pl-3">Amazing</Label.Root>
  </div>
  <div class="flex select-none items-center">
    <RadioGroup.Item
      id="h-average"
      value="average"
      class="size-5 shrink-0 rounded-full border"
    />
    <Label.Root for="h-average" class="pl-3">Average</Label.Root>
  </div>
  <div class="flex select-none items-center">
    <RadioGroup.Item
      id="h-terrible"
      value="terrible"
      class="size-5 shrink-0 rounded-full border"
    />
    <Label.Root for="h-terrible" class="pl-3">Terrible</Label.Root>
  </div>
</RadioGroup.Root>
```

### With Two-Way Binding

```svelte
<script lang="ts">
  import { RadioGroup } from "bits-ui";

  let myValue = $state("");
</script>

<button onclick={() => (myValue = "A")}>Select A</button>

<RadioGroup.Root bind:value={myValue}>
  <RadioGroup.Item value="A">A</RadioGroup.Item>
  <RadioGroup.Item value="B">B</RadioGroup.Item>
</RadioGroup.Root>
```

### Fully Controlled (Function Binding)

```svelte
<script lang="ts">
  import { RadioGroup } from "bits-ui";

  let myValue = $state("");

  function getValue() {
    return myValue;
  }
  function setValue(newValue: string) {
    myValue = newValue;
  }
</script>

<RadioGroup.Root bind:value={getValue, setValue}>
  <RadioGroup.Item value="A">A</RadioGroup.Item>
  <RadioGroup.Item value="B">B</RadioGroup.Item>
</RadioGroup.Root>
```

### HTML Form Submission

Set the `name` prop to render a hidden input that submits the selected value with the form.

```svelte
<RadioGroup.Root name="favoriteFruit" required>
  <RadioGroup.Item value="apple">Apple</RadioGroup.Item>
  <RadioGroup.Item value="banana">Banana</RadioGroup.Item>
  <RadioGroup.Item value="coconut">Coconut</RadioGroup.Item>
</RadioGroup.Root>
```

### Disabled

Disable the entire group via the `disabled` prop on `Root`, or disable a single item via the `disabled` prop on `Item`.

```svelte
<!-- Entire group disabled -->
<RadioGroup.Root disabled>
  <RadioGroup.Item value="apple">Apple</RadioGroup.Item>
  <RadioGroup.Item value="banana">Banana</RadioGroup.Item>
</RadioGroup.Root>

<!-- Single item disabled -->
<RadioGroup.Item value="coconut" disabled>Coconut</RadioGroup.Item>
```

### Readonly

When a radio group is readonly, users can focus and navigate through the items but cannot change the selection.

```svelte
<RadioGroup.Root value="average" readonly>
  <RadioGroup.Item value="amazing">Amazing</RadioGroup.Item>
  <RadioGroup.Item value="average">Average</RadioGroup.Item>
  <RadioGroup.Item value="terrible">Terrible</RadioGroup.Item>
</RadioGroup.Root>
```

### Reusable Component

Wrap the primitives in a reusable component to use throughout your application.

`MyRadioGroup.svelte`

```svelte
<script lang="ts">
  import {
    RadioGroup,
    Label,
    type WithoutChildrenOrChild,
    useId,
  } from "bits-ui";

  type Item = {
    value: string;
    label: string;
    disabled?: boolean;
  };

  type Props = WithoutChildrenOrChild<RadioGroup.RootProps> & {
    items: Item[];
  };

  let {
    value = $bindable(""),
    ref = $bindable(null),
    items,
    ...restProps
  }: Props = $props();
</script>

<RadioGroup.Root bind:value bind:ref {...restProps}>
  {#each items as item}
    {@const id = useId()}
    <div>
      <RadioGroup.Item {id} value={item.value} disabled={item.disabled}>
        {#snippet children({ checked })}
          {#if checked}
            ✅
          {/if}
        {/snippet}
      </RadioGroup.Item>
      <Label.Root for={id}>{item.label}</Label.Root>
    </div>
  {/each}
</RadioGroup.Root>
```

Usage:

```svelte
<script lang="ts">
  import MyRadioGroup from "$lib/components/MyRadioGroup.svelte";

  const myItems = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "coconut", label: "Coconut", disabled: true },
  ];
</script>

<MyRadioGroup items={myItems} name="favoriteFruit" />
```

## Accessibility

The Radio Group component follows the [WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radiogroup/).

### Keyboard Navigation

| Key                                 | Behavior                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Tab`                               | Moves focus into the radio group to the checked item (or the first item if none is checked).      |
| `ArrowUp` / `ArrowDown`            | When `orientation="vertical"`, moves focus and selection to the previous/next enabled item.      |
| `ArrowLeft` / `ArrowRight`         | When `orientation="horizontal"`, moves focus and selection to the previous/next enabled item.    |
| `Space`                             | Selects the currently focused item if not already selected.                                       |
| `Home`                              | Moves focus and selection to the first enabled item.                                             |
| `End`                               | Moves focus and selection to the last enabled item.                                              |

When `loop` is `true` (default `false`), keyboard navigation wraps from the last item back to the first and vice versa. When `loop` is `false`, navigation stops at the boundaries.

Disabled items are skipped during keyboard navigation and cannot be focused or selected.

### ARIA

- The `RadioGroup.Root` element has the `radiogroup` role.
- Each `RadioGroup.Item` element has the `radio` role.
- The `aria-checked` attribute on each item reflects its checked state (`true` or `false`).
- The `aria-disabled` attribute is set when an item or the group is disabled.
- The `aria-readonly` attribute is set when the group is readonly.
- The `aria-required` attribute is set when the group is `required`.
- The `aria-orientation` attribute reflects the `orientation` prop (`vertical` or `horizontal`).

## Tips

### Styling Based on State

Use the `data-state` attribute on `RadioGroup.Item` to style the checked and unchecked states:

```css
.radio-item[data-state="checked"] {
  border-color: var(--color-foreground);
}

.radio-item[data-state="unchecked"] {
  border-color: var(--color-border);
}
```

### Disabling Pointer Events When Disabled or Readonly

A common pattern is to disable pointer events on items when they are disabled or readonly, using the `data-disabled` and `data-readonly` attributes:

```svelte
<RadioGroup.Item
  value="amazing"
  class="data-[disabled]:pointer-events-none data-readonly:pointer-events-none"
/>
```

### Rendering a Custom Indicator

Instead of using a separate `RadioGroup.ItemIndicator`-style component, use the `children` snippet's `checked` parameter to render a custom indicator:

```svelte
<RadioGroup.Item value="a">
  {#snippet children({ checked })}
    {#if checked}
      <span class="dot" />
    {/if}
  {/snippet}
</RadioGroup.Item>
```

### Use `Label` for Accessible Labels

Pair each `RadioGroup.Item` with a `Label.Root` using matching `id` and `for` attributes for an accessible, clickable label:

```svelte
<RadioGroup.Item id="amazing" value="amazing" />
<Label.Root for="amazing">Amazing</Label.Root>
```

### Unique `value` per Item

Each `RadioGroup.Item` within a group must have a unique `value`. Duplicate values lead to undefined selection behavior.

### Form Submission

For the radio group's value to be submitted with an HTML form, the `name` prop must be set on `RadioGroup.Root`. Without it, no hidden input is rendered and the value will not be included in the form submission.
