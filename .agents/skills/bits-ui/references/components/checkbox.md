# Checkbox

Enables users to select or deselect options with support for indeterminate states. The Checkbox component is a headless, accessible primitive for Svelte 5 that provides tri-state behavior (checked, unchecked, indeterminate), form submission support, and grouping capabilities.

## Overview

The Checkbox component provides a flexible and accessible way to create checkbox inputs in Svelte applications. It supports three states — checked, unchecked, and indeterminate — allowing for complex form interactions and data representations.

### Key Features

- **Tri-State Support** — Handles checked, unchecked, and indeterminate states, providing versatility in form design.
- **Accessibility** — Built with WAI-ARIA guidelines in mind, ensuring keyboard navigation and screen reader support.
- **Flexible State Management** — Supports both controlled and uncontrolled state via two-way bindings and function bindings, allowing for full control over the checkbox's checked state.
- **HTML Form Integration** — Renders hidden `<input>` elements for form submission when a `name` prop is provided.
- **Checkbox Groups** — Synchronize the value state of descendant checkboxes via `Checkbox.Group`.

## Component Structure

The Checkbox component is composed of three parts:

| Part | Element | Description |
|------|---------|-------------|
| `Checkbox.Root` | `<button>` | The main component that manages the state and behavior of the checkbox. Renders as a button element with `role="checkbox"`. |
| `Checkbox.Group` | `<div>` | A group that synchronizes its value state with its descendant checkboxes. Wraps multiple `Checkbox.Root` components. |
| `Checkbox.GroupLabel` | `<label>` | An accessible label for the checkbox group. |

### Basic Structure

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";
</script>

<Checkbox.Root>
  {#snippet children({ checked, indeterminate })}
    {#if indeterminate}
      -
    {:else if checked}
      ✅
    {:else}
      ❌
    {/if}
  {/snippet}
</Checkbox.Root>
```

### Group Structure

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";
</script>

<Checkbox.Group name="notifications">
  <Checkbox.GroupLabel>Notifications</Checkbox.GroupLabel>
  <Checkbox.Root value="marketing" />
  <Checkbox.Root value="promotions" />
  <Checkbox.Root value="news" />
</Checkbox.Group>
```

## API Reference

### Checkbox.Root

The button component used to toggle the state of the checkbox. Renders as a `<button>` element with `role="checkbox"`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | `boolean` | `false` | The checkbox button's checked state. Bindable with `bind:checked`. |
| `onCheckedChange` | `function` — `(checked: boolean) => void` | `undefined` | A callback fired when the checkbox button's checked state changes. |
| `indeterminate` | `boolean` | `false` | Whether the checkbox is in an indeterminate state. Bindable with `bind:indeterminate`. |
| `onIndeterminateChange` | `function` — `(indeterminate: boolean) => void` | `undefined` | A callback fired when the indeterminate state changes. |
| `disabled` | `boolean` | `false` | Whether the checkbox button is disabled. Prevents user interaction. |
| `required` | `boolean` | `false` | Whether the checkbox is required. Applies `required` to the hidden input for form validation. |
| `name` | `string` | `undefined` | The name of the checkbox. If provided, a hidden input is rendered for form submission. |
| `value` | `string` | `undefined` | The value of the checkbox. This is what is submitted with the form when the checkbox is checked. |
| `readonly` | `boolean` | `false` | Whether the checkbox is read only. If `true`, the checkbox is focusable but cannot be checked/unchecked. |
| `ref` | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bindable with `bind:ref`. |
| `children` | `Snippet` — `{ checked: boolean; indeterminate: boolean; }` | `undefined` | The children content to render. Receives `checked` and `indeterminate` state. |
| `child` | `Snippet` — `{ props: Record<string, unknown>; checked: boolean; indeterminate: boolean; }` | `undefined` | Use render delegation to render your own element. See Child Snippet docs for more information. |

**Bindable props:** `checked`, `indeterminate`, `ref`.

#### Children Snippet Props

The `children` snippet receives an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `checked` | `boolean` | The current checked state of the checkbox. |
| `indeterminate` | `boolean` | The current indeterminate state of the checkbox. |

#### Child Snippet Props

The `child` snippet receives an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `props` | `Record<string, unknown>` | All internal attributes, event handlers, and ARIA props to spread onto your custom element. |
| `checked` | `boolean` | The current checked state of the checkbox. |
| `indeterminate` | `boolean` | The current indeterminate state of the checkbox. |

### Checkbox.Group

A group that synchronizes its value state with its descendant checkboxes. Renders as a `<div>` element.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string[]` | `[]` | The value of the group — an array of the values of the checked checkboxes within the group. Bindable with `bind:value`. |
| `onValueChange` | `function` — `(value: string[]) => void` | `undefined` | A callback fired when the checkbox group's value state changes. |
| `disabled` | `boolean` | `false` | Whether the checkbox group is disabled. If `true`, all checkboxes within the group are disabled. To disable a specific checkbox, pass `disabled` to that checkbox. |
| `required` | `boolean` | `false` | Whether the checkbox group is required for form submission. |
| `name` | `string` | `undefined` | The name of the checkbox group. If provided, a hidden input is rendered for form submission. All descendant checkboxes render hidden inputs with this name. |
| `readonly` | `boolean` | `false` | Whether the checkbox group is read only. If `true`, the group is focusable but checkboxes cannot be checked/unchecked. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable with `bind:ref`. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `{ props: Record<string, unknown>; }` | `undefined` | Use render delegation to render your own element. See Child Snippet docs for more information. |

**Bindable props:** `value`, `ref`.

**Group inheritance:** When a `Checkbox.Group` is used, its descendant `Checkbox.Root` components inherit certain properties from the group: `name`, `required`, and `disabled`.

### Checkbox.GroupLabel

An accessible label for the checkbox group. Renders as a `<label>` element.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ref` | `HTMLLabelElement` | `null` | The underlying DOM element being rendered. Bindable with `bind:ref`. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `{ props: Record<string, unknown>; }` | `undefined` | Use render delegation to render your own element. See Child Snippet docs for more information. |

**Bindable props:** `ref`.

## Data Attributes

### Checkbox.Root

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-state` | `'checked' \| 'unchecked' \| 'indeterminate'` | The checkbox's state of checked, unchecked, or indeterminate. |
| `data-disabled` | `''` | Present when the checkbox is disabled. |
| `data-readonly` | `''` | Present when the checkbox is read only. |
| `data-checkbox-root` | `''` | Present on the root element. |

### Checkbox.Group

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-disabled` | `''` | Present when the checkbox group is disabled. |
| `data-readonly` | `''` | Present when the checkbox group is read only. |
| `data-checkbox-group` | `''` | Present on the group element. |

### Checkbox.GroupLabel

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-disabled` | `''` | Present when the checkbox group is disabled. |
| `data-checkbox-group-label` | `''` | Present on the label element. |

## CSS Variables

The Checkbox component does not expose any `--bits-*` CSS variables.

## Examples

### Basic Checkbox

A simple checkbox with two-way binding on the `checked` state.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";

  let checked = $state(false);
</script>

<Checkbox.Root bind:checked>
  {#snippet children({ checked, indeterminate })}
    {#if checked}
      ✅
    {:else}
      ❌
    {/if}
  {/snippet}
</Checkbox.Root>
```

### Indeterminate Checkbox

Use the `indeterminate` prop to set the checkbox to an indeterminate state. This is useful for "select all" checkboxes where some, but not all, items in a group are selected.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";
  import Check from "phosphor-svelte/lib/Check";
  import Minus from "phosphor-svelte/lib/Minus";

  let indeterminate = $state(true);
</script>

<Checkbox.Root indeterminate>
  {#snippet children({ checked, indeterminate })}
    <div class="inline-flex items-center justify-center">
      {#if indeterminate}
        <Minus class="size-[15px]" weight="bold" />
      {:else if checked}
        <Check class="size-[15px]" weight="bold" />
      {/if}
    </div>
  {/snippet}
</Checkbox.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet for full control over the rendered element. This is useful when you need Svelte transitions, scoped styles, actions, or custom components. Always spread `{...props}` onto your custom element.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";
</script>

<Checkbox.Root>
  {#snippet child({ props, checked, indeterminate })}
    <button {...props} class="my-scoped-checkbox-style">
      {#if indeterminate}
        -
      {:else if checked}
        ✅
      {/if}
    </button>
  {/snippet}
</Checkbox.Root>
```

### Fully Controlled State

Use a function binding for complete control over state reads and writes. This allows conditional updates, side effects, or derived state.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";

  let myChecked = $state(false);

  function getChecked() {
    return myChecked;
  }

  function setChecked(newChecked: boolean) {
    // Add validation, logging, or conditional logic here
    myChecked = newChecked;
  }
</script>

<Checkbox.Root bind:checked={getChecked, setChecked}>
  {#snippet children({ checked })}
    {checked ? "✅" : "❌"}
  {/snippet}
</Checkbox.Root>
```

### Disabled Checkbox

Disable the checkbox by setting the `disabled` prop to `true`.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";
</script>

<Checkbox.Root disabled>
  {#snippet children({ checked })}
    {checked ? "✅" : "❌"}
  {/snippet}
</Checkbox.Root>
```

### HTML Form Submission

Set the `name` prop to render a hidden checkbox input for form submission. By default, the checkbox submits with the value `'on'` when checked. Use the `value` prop to submit a custom value.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";
</script>

<!-- Submits as "notifications=on" when checked -->
<Checkbox.Root name="notifications">
  {#snippet children({ checked })}
    {checked ? "✅" : "❌"}
  {/snippet}
</Checkbox.Root>

<!-- Submits as "notifications=hello" when checked -->
<Checkbox.Root name="notifications" value="hello">
  {#snippet children({ checked })}
    {checked ? "✅" : "❌"}
  {/snippet}
</Checkbox.Root>
```

### Required Checkbox

Use the `required` prop to make the checkbox required for form validation. This applies the `required` attribute to the hidden input element.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";
</script>

<Checkbox.Root required name="terms">
  {#snippet children({ checked })}
    {checked ? "✅" : "❌"}
  {/snippet}
</Checkbox.Root>
```

### Checkbox Group

Use `Checkbox.Group` to manage multiple checkboxes as a single value array. Each `Checkbox.Root` within the group provides a `value` prop. The group's `value` state is an array of the checked checkbox values.

```svelte
<script lang="ts">
  import { Checkbox, Label, useId } from "bits-ui";
  import Check from "phosphor-svelte/lib/Check";
  import Minus from "phosphor-svelte/lib/Minus";

  let myValue = $state<string[]>(["marketing", "news"]);

  const items = [
    { value: "marketing", label: "Marketing" },
    { value: "promotions", label: "Promotions" },
    { value: "news", label: "News" },
    { value: "updates", label: "Updates" },
  ];
</script>

<Checkbox.Group
  bind:value={myValue}
  name="notifications"
  onValueChange={console.log}
>
  <Checkbox.GroupLabel>Notifications</Checkbox.GroupLabel>

  {#each items as item (item.value)}
    {@const id = useId()}
    <div class="flex items-center gap-3">
      <Checkbox.Root {id} value={item.value} aria-labelledby="{id}-label">
        {#snippet children({ checked, indeterminate })}
          {#if indeterminate}
            <Minus class="size-[15px]" weight="bold" />
          {:else if checked}
            <Check class="size-[15px]" weight="bold" />
          {/if}
        {/snippet}
      </Checkbox.Root>
      <Label.Root id="{id}-label" for={id}>
        {item.label}
      </Label.Root>
    </div>
  {/each}
</Checkbox.Group>
```

### Checkbox Group — Fully Controlled

Use a function binding for complete control over the group's value state.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";

  let myValue = $state<string[]>([]);

  function getValue() {
    return myValue;
  }

  function setValue(newValue: string[]) {
    myValue = newValue;
  }
</script>

<Checkbox.Group bind:value={getValue, setValue} name="myItems">
  <Checkbox.GroupLabel>Items</Checkbox.GroupLabel>
  <Checkbox.Root value="item-1" />
  <Checkbox.Root value="item-2" />
  <Checkbox.Root value="item-3" />
</Checkbox.Group>
```

### Reusable Checkbox Component

Wrap `Checkbox.Root` and `Label.Root` into a reusable component for consistent usage across your application.

**MyCheckbox.svelte**

```svelte
<script lang="ts">
  import {
    Checkbox,
    Label,
    useId,
    type WithoutChildrenOrChild,
  } from "bits-ui";

  let {
    id = useId(),
    checked = $bindable(false),
    ref = $bindable(null),
    labelRef = $bindable(null),
    labelText,
    ...restProps
  }: WithoutChildrenOrChild<Checkbox.RootProps> & {
    labelText: string;
    labelRef?: HTMLLabelElement | null;
  } = $props();
</script>

<Checkbox.Root {id} bind:checked bind:ref {...restProps}>
  {#snippet children({ checked, indeterminate })}
    {#if indeterminate}
      -
    {:else if checked}
      ✅
    {:else}
      ❌
    {/if}
  {/snippet}
</Checkbox.Root>

<Label.Root for={id} bind:ref={labelRef}>
  {labelText}
</Label.Root>
```

**Usage**

```svelte
<script lang="ts">
  import MyCheckbox from "$lib/components/MyCheckbox.svelte";
</script>

<MyCheckbox labelText="Enable notifications" />
```

## Accessibility

### Keyboard Interaction

| Key | Action |
|-----|--------|
| `Space` | Toggles the checkbox checked state. |
| `Tab` | Moves focus to the checkbox. |

### ARIA

The `Checkbox.Root` component renders as a `<button>` element with the following ARIA attributes managed automatically:

| Attribute | Value | Description |
|-----------|-------|-------------|
| `role` | `checkbox` | Identifies the element as a checkbox. |
| `aria-checked` | `true \| false \| "mixed"` | Reflects the checkbox state. `"mixed"` corresponds to the indeterminate state. |
| `aria-disabled` | `true` | Set when the `disabled` prop is `true`. |
| `aria-readonly` | `true` | Set when the `readonly` prop is `true`. |
| `aria-required` | `true` | Set when the `required` prop is `true`. |
| `aria-labelledby` | — | Set when a label is associated via `aria-labelledby` (manual). |

For `Checkbox.Group`, the group element and its label are associated using `aria-labelledby` pointing to the `Checkbox.GroupLabel`. Descendant checkboxes inherit `disabled`, `required`, and `name` from the group.

### Labeling

Always associate a label with the checkbox for screen reader users. Use one of these approaches:

1. **`aria-labelledby`** — point to the ID of a visible label element.
2. **`aria-label`** — provide a string label when no visible label exists.
3. **`Label.Root` with `for`** — use the Bits UI `Label` component with the `for` attribute matching the checkbox's `id`.

```svelte
<script lang="ts">
  import { Checkbox, Label } from "bits-ui";
</script>

<!-- Using Label.Root with for -->
<Checkbox.Root id="terms" />
<Label.Root for="terms">Accept terms and conditions</Label.Root>

<!-- Using aria-labelledby -->
<Checkbox.Root id="terms" aria-labelledby="terms-label" />
<span id="terms-label">Accept terms and conditions</span>
```

## Tips

### State Synchronization with Indeterminate

When using indeterminate state in a "select all" pattern, derive the parent checkbox's state from the children. If all children are checked, the parent is checked. If some children are checked, the parent is indeterminate. If none are checked, the parent is unchecked.

```svelte
<script lang="ts">
  import { Checkbox } from "bits-ui";

  let items = $state([
    { id: "1", checked: false },
    { id: "2", checked: false },
    { id: "3", checked: false },
  ]);

  const allChecked = $derived(items.every((i) => i.checked));
  const someChecked = $derived(items.some((i) => i.checked));
  const parentChecked = $derived(allChecked);
  const parentIndeterminate = $derived(someChecked && !allChecked);

  function toggleParent() {
    const newChecked = !allChecked;
    items = items.map((i) => ({ ...i, checked: newChecked }));
  }
</script>

<Checkbox.Root
  checked={parentChecked}
  indeterminate={parentIndeterminate}
  onCheckedChange={toggleParent}
>
  {#snippet children({ checked, indeterminate })}
    {#if indeterminate}
      -
    {:else if checked}
      ✅
    {/if}
  {/snippet}
</Checkbox.Root>
```

### Group Property Inheritance

When a `Checkbox.Root` is nested inside a `Checkbox.Group`, it automatically inherits `name`, `required`, and `disabled` from the group. You do not need to pass these props to each individual checkbox. To disable a specific checkbox in a group without disabling the whole group, pass `disabled` directly to that checkbox.

### Hidden Inputs for Form Submission

When a `name` is provided to `Checkbox.Root` (either directly or inherited from `Checkbox.Group`), a hidden `<input type="checkbox">` element is rendered. This input carries the form submission value. The default submitted value is `'on'`; use the `value` prop to customize it. In a group, each checked checkbox submits its own value under the shared group name.

### Readonly vs Disabled

- `disabled` — The checkbox cannot be focused or interacted with. It is excluded from form submission.
- `readonly` — The checkbox can be focused but cannot be toggled. The user can still read its state.

Use `readonly` when you want to display the checkbox state without allowing changes, and `disabled` when the checkbox should be entirely non-interactive.

### Styling with Data Attributes

Target the `data-state` attribute to style the checkbox based on its state. This is the recommended approach for headless component styling.

```css
[data-checkbox-root] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1px solid #ccc;
}

[data-checkbox-root][data-state="checked"] {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

[data-checkbox-root][data-state="indeterminate"] {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

[data-checkbox-root][data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

With Tailwind CSS, use data attribute variants:

```svelte
<Checkbox.Root
  class="inline-flex size-5 items-center justify-center rounded-md border transition-colors data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:text-white data-[disabled]:opacity-50"
>
  {#snippet children({ checked })}
    {#if checked}✅{/if}
  {/snippet}
</Checkbox.Root>
```
