# Switch

A toggle control that allows users to switch between "on" and "off" states. The Switch component is commonly used for enabling or disabling features, toggling settings, or representing boolean values in forms. It offers a more visual and interactive alternative to traditional checkboxes for binary choices.

## Overview

The Switch component provides an intuitive and accessible toggle control, allowing users to switch between two states — typically "on" and "off". It is commonly used for enabling or disabling features, toggling settings, or representing boolean values in forms.

Key features:

- **Accessibility**: Built with WAI-ARIA guidelines in mind, ensuring keyboard navigation and screen reader support.
- **State Management**: Internally manages the on/off state, with options for controlled and uncontrolled usage.
- **Style-able**: Data attributes allow for smooth transitions between states and custom styles.
- **HTML Forms**: Can render a hidden input element for form submissions.

## Component Structure

The Switch component is composed of two parts:

- **Root**: The main container component that manages the state and behavior of the switch.
- **Thumb**: The "movable" part of the switch that indicates the current state.

```svelte
<script lang="ts">
  import { Switch } from "bits-ui";
</script>

<Switch.Root>
  <Switch.Thumb />
</Switch.Root>
```

## API Reference

### Switch.Root

The root switch component used to set and manage the state of the switch.

| Property            | Type                                                                                          | Default     | Description                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `checked`           | `boolean` (bindable)                                                                          | `false`     | The checked state of the checkbox. Bindable via `bind:checked`.                                                          |
| `onCheckedChange`   | `function` — `(checked: boolean) => void`                                                     | `undefined` | A callback that is fired when the checked state changes.                                                                 |
| `disabled`          | `boolean`                                                                                     | `false`     | Whether or not the switch is disabled.                                                                                   |
| `name`              | `string`                                                                                      | `undefined` | The name of the hidden input element, used to identify the input in form submissions.                                    |
| `required`          | `boolean`                                                                                     | `false`     | Whether or not the switch is required to be checked. Applies the `required` attribute to the hidden input element.       |
| `value`             | `string`                                                                                      | `undefined` | The value of the hidden input element to be used in form submissions when the switch is checked. Defaults to `'on'`.    |
| `ref`               | `HTMLButtonElement` (bindable)                                                                | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                               |
| `children`          | `Snippet` — `SnippetProps = { checked: boolean }`                                             | `undefined` | The children content to render. Receives the current `checked` state.                                                    |
| `child`             | `Snippet` — `SnippetProps = { checked: boolean, props: Record<string, unknown> }`            | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information.                       |

#### Switch.Root Data Attributes

| Data Attribute     | Value                             | Description                          |
| ------------------ | --------------------------------- | ------------------------------------ |
| `data-state`       | `'checked' \| 'unchecked'`        | The switch's checked state.          |
| `data-checked`     | `''`                              | Present when the switch is checked.  |
| `data-disabled`    | `''`                              | Present when the switch is disabled. |
| `data-switch-root` | `''`                              | Present on the root element.         |

### Switch.Thumb

The thumb on the switch used to indicate the switch's state.

| Property        | Type                                                                                          | Default     | Description                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ref`           | `HTMLSpanElement` (bindable)                                                                  | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                               |
| `children`      | `Snippet` — `SnippetProps = { checked: boolean }`                                             | `undefined` | The children content to render. Receives the current `checked` state.                                                    |
| `child`         | `Snippet` — `SnippetProps = { checked: boolean, props: Record<string, unknown> }`            | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information.                       |

#### Switch.Thumb Data Attributes

| Data Attribute      | Value                             | Description                         |
| ------------------- | --------------------------------- | ----------------------------------- |
| `data-state`        | `'checked' \| 'unchecked'`        | The switch's checked state.         |
| `data-checked`      | `''`                              | Present when the switch is checked. |
| `data-switch-thumb` | `''`                              | Present on the thumb element.       |

## Data Attributes

A consolidated view of all `data-*` attributes exposed across Switch parts.

| Data Attribute      | Value                             | Part  | Description                          |
| ------------------- | --------------------------------- | ----- | ------------------------------------ |
| `data-state`        | `'checked' \| 'unchecked'`        | Root  | The switch's checked state.          |
| `data-checked`      | `''`                              | Root  | Present when the switch is checked.  |
| `data-disabled`     | `''`                              | Root  | Present when the switch is disabled. |
| `data-switch-root`  | `''`                              | Root  | Present on the root element.         |
| `data-state`        | `'checked' \| 'unchecked'`        | Thumb | The switch's checked state.          |
| `data-checked`      | `''`                              | Thumb | Present when the switch is checked.  |
| `data-switch-thumb` | `''`                              | Thumb | Present on the thumb element.        |

## CSS Variables

The Switch component does not expose any `--bits-*` CSS variables. Styling is done via standard classes and the `data-*` attributes listed above.

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { Switch } from "bits-ui";
</script>

<Switch.Root>
  <Switch.Thumb />
</Switch.Root>
```

### Styled with Tailwind CSS

```svelte
<script lang="ts">
  import { Label, Switch } from "bits-ui";
</script>

<div class="flex items-center space-x-3">
  <Switch.Root
    id="dnd"
    name="hello"
    class="focus-visible:ring-foreground focus-visible:ring-offset-background data-[state=checked]:bg-foreground data-[state=unchecked]:bg-dark-10 data-[state=unchecked]:shadow-mini-inset dark:data-[state=checked]:bg-foreground focus-visible:outline-hidden peer inline-flex h-[36px] min-h-[36px] w-[60px] shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Switch.Thumb
      class="bg-background data-[state=unchecked]:shadow-mini dark:border-background/30 dark:bg-foreground dark:shadow-popover pointer-events-none block size-[30px] shrink-0 rounded-full transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0 dark:border dark:data-[state=unchecked]:border"
    />
  </Switch.Root>
  <Label.Root for="dnd" class="text-sm font-medium">Do not disturb</Label.Root>
</div>
```

### Controlled State (Two-Way Binding)

Use `bind:checked` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { Switch } from "bits-ui";
  let myChecked = $state(true);
</script>

<button onclick={() => (myChecked = false)}>uncheck</button>

<Switch.Root bind:checked={myChecked}>
  <Switch.Thumb />
</Switch.Root>
```

### Fully Controlled (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes:

```svelte
<script lang="ts">
  import { Switch } from "bits-ui";
  let myChecked = $state(false);

  function getChecked() {
    return myChecked;
  }

  function setChecked(newChecked: boolean) {
    myChecked = newChecked;
  }
</script>

<Switch.Root bind:checked={getChecked, setChecked}>
  <Switch.Thumb />
</Switch.Root>
```

### Disabled State

```svelte
<Switch.Root disabled>
  <Switch.Thumb />
</Switch.Root>
```

### Using the `child` Snippet (Render Delegation)

The `child` snippet enables render delegation — you render your own element while the component continues to manage behavior and state. The snippet receives the current `checked` state and a `props` object to spread onto your element.

```svelte
<script lang="ts">
  import { Switch } from "bits-ui";
</script>

<Switch.Root>
  {#snippet child({ checked, props })}
    <button {...props} class="my-switch-root">
      {checked ? "On" : "Off"}
    </button>
  {/snippet}
  <Switch.Thumb />
</Switch.Root>
```

### Using the `children` Snippet

The `children` snippet receives the current `checked` state, useful for conditionally rendering content inside the root.

```svelte
<script lang="ts">
  import { Switch } from "bits-ui";
</script>

<Switch.Root>
  {#snippet children({ checked })}
    <span>{checked ? "Enabled" : "Disabled"}</span>
  {/snippet}
</Switch.Root>
```

### Reusable Wrapper Component

It is recommended to use the `Switch` primitives to build a custom switch component for reuse across your application. The example below pairs `Switch` with the `Label` component and exposes `bind:checked` and `bind:ref`.

**MySwitch.svelte**

```svelte
<script lang="ts">
  import { Switch, Label, useId, type WithoutChildrenOrChild } from "bits-ui";

  let {
    id = useId(),
    checked = $bindable(false),
    ref = $bindable(null),
    labelText,
    ...restProps
  }: WithoutChildrenOrChild<Switch.RootProps> & {
    labelText: string;
  } = $props();
</script>

<Switch.Root bind:checked bind:ref {id} {...restProps}>
  <Switch.Thumb />
</Switch.Root>

<Label.Root for={id}>{labelText}</Label.Root>
```

**Usage**

```svelte
<script lang="ts">
  import MySwitch from "$lib/components/MySwitch.svelte";
  let notifications = $state(true);
</script>

<MySwitch bind:checked={notifications} labelText="Enable notifications" />
```

## HTML Forms

If you pass the `name` prop to `Switch.Root`, a hidden input element is rendered to submit the switch's value with the form. By default, the input submits the value `'on'` when the switch is checked.

### Default Value

```svelte
<Switch.Root name="dnd">
  <Switch.Thumb />
</Switch.Root>
```

### Custom Input Value

Use the `value` prop to submit a different value:

```svelte
<Switch.Root name="dnd" value="hello">
  <Switch.Thumb />
</Switch.Root>
```

### Required

Use the `required` prop to make the switch required. This applies the `required` attribute to the hidden input element, enforcing proper form submission.

```svelte
<Switch.Root required>
  <Switch.Thumb />
</Switch.Root>
```

## Accessibility

The Switch component is built with WAI-ARIA guidelines in mind, ensuring keyboard navigation and screen reader support.

### Keyboard Interaction

| Key     | Action                              |
| ------- | ----------------------------------- |
| `Space` | Toggles the checked state.          |
| `Enter` | Toggles the checked state.          |

When the switch is disabled (`disabled={true}`), it is removed from the tab order and cannot be activated via the keyboard.

### ARIA

The Root renders as a `<button>` element with the `role="switch"` attribute, reflecting the current state via `aria-checked`. The `disabled` prop maps to the `aria-disabled` attribute and the underlying button's `disabled` property. When a `name` is provided, a visually hidden `<input type="checkbox">` is rendered for form submission, keeping the interactive control accessible and semantically correct.

## Tips

- **Prefer `bind:checked` for local state.** For most use cases, two-way binding with `bind:checked` is the simplest and most ergonomic approach. Reach for function bindings only when you need to intercept or transform reads/writes.
- **Use `onCheckedChange` for side effects.** When you only need to react to changes (e.g., persisting to a store, triggering an API call) without controlling the value, `onCheckedChange` avoids the ceremony of a function binding.
- **Build a reusable wrapper.** Instead of repeating styling and structure, wrap `Switch.Root` + `Switch.Thumb` in a custom component (see the Reusable Wrapper Component example). Forward `bind:checked`, `bind:ref`, and rest props so the wrapper stays fully compatible with the primitive's API.
- **Pair with `Label`.** Use the `Label` component with a matching `for`/`id` pair so the switch has an accessible name. This is important for screen reader users and click-target sizing.
- **Style with `data-*` attributes.** Target `data-[state=checked]` and `data-[state=unchecked]` (or `data-checked`) in your CSS to drive transitions and visual states without additional JavaScript.
- **Form integration requires `name`.** The hidden input is only rendered when `name` is set. Use the `value` prop to customize what gets submitted (defaults to `'on'`), and `required` to enforce submission.
- **Use `child` for render delegation.** When you need the Root or Thumb to render as a different element or integrate with another component (e.g., a styled library button), use the `child` snippet and spread the provided `props` onto your element so behavior and accessibility are preserved.
