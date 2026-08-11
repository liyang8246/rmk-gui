# Toggle

A toggle control that allows users to switch between two states — pressed (on) and unpressed (off). Built on top of a native `<button>` element, it exposes a bindable `pressed` state and render-delegation support for custom styling.

## Overview

The Toggle component renders a button that switches between an "on" and "off" state each time it is activated. It is the primitive underlying toggle buttons everywhere a binary, non-mutually-exclusive choice is needed (e.g. bold/italic in a toolbar, a visibility lock, a favorite star). Because it renders a real `<button>`, it inherits all native button behavior: focus management, form participation semantics, and keyboard activation.

The component is part of the `Toggle` namespace exported from `bits-ui`. The single part is `Toggle.Root`, which can be used directly or composed with a `child` snippet for render delegation.

## Component Structure

```svelte
<script lang="ts">
  import { Toggle } from "bits-ui";
</script>

<Toggle.Root />
```

| Part           | Description                                                |
| -------------- | --------------------------------------------------------- |
| `Toggle.Root`  | The toggle button. Renders a native `<button>` element.   |

There is no separate `Indicator` part for this component — content is provided via the `children` or `child` snippets on `Toggle.Root`.

## API Reference

### Toggle.Root

The toggle button. Renders a native `<button>` element and manages the pressed/on-off state.

| Property            | Type                                              | Default     | Description                                                                                          |
| ------------------- | ------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `pressed`           | `boolean` (bindable)                              | `false`     | Whether the toggle button is pressed. Two-way bindable with `bind:pressed`.                          |
| `onPressedChange`   | `(pressed: boolean) => void`                      | `undefined` | Callback invoked when the pressed state changes. Receives the new pressed value.                     |
| `disabled`          | `boolean`                                         | `false`     | Whether the toggle is disabled. When `true`, the button is non-interactive and `data-disabled` set. |
| `ref`               | `HTMLButtonElement` (bindable)                    | `null`      | The underlying DOM element being rendered. Bind to obtain a direct reference to the element.         |
| `children`          | `Snippet`                                         | `undefined` | The children content to render inside the button.                                                    |
| `child`             | `Snippet` (`SnippetProps = { props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. Receives props to spread onto a custom element.    |

#### Bindable Props

Both `pressed` and `ref` are bindable, meaning you can use `bind:pressed` and `bind:ref` for two-way synchronization.

- **`pressed`** — Synchronizes the on/off state with a parent variable. Use `bind:pressed={myVar}` for simple binding, or a function binding `bind:pressed={getFn, setFn}` for full control over reads and writes.
- **`ref`** — Synchronizes the underlying `<button>` DOM element with a parent variable. Useful for imperative focus, measurement, or integration with non-Svelte libraries.

## Data Attributes

The following `data-*` attributes are applied to the rendered button element and can be targeted in CSS for state-based styling.

| Data Attribute     | Value               | Description                                          |
| ------------------ | ------------------- | --------------------------------------------------- |
| `data-state`       | `'on'` \| `'off'`   | Whether the toggle is in the on or off state.        |
| `data-disabled`    | `''` (present)      | Present when the toggle is disabled.                 |
| `data-toggle-root` | `''` (present)      | Present on the root element. Identifies the part.    |

### Styling with Data Attributes

Target these attributes to style the toggle based on its state:

```css
[data-toggle-root][data-state="on"] {
  background-color: var(--accent);
  color: var(--accent-foreground);
}

[data-toggle-root][data-state="off"] {
  background-color: transparent;
  color: inherit;
}

[data-toggle-root][data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## CSS Variables

The Toggle component does not define any component-specific `--bits-*` CSS variables. Style it directly via classes, data attributes, or your own CSS variables.

## Examples

### Basic

A simple toggle that manages its own pressed state internally. Bind to a local variable to read or drive the state.

```svelte
<script lang="ts">
  import { Toggle } from "bits-ui";
  let pressed = $state(false);
</script>

<Toggle.Root bind:pressed>
  {pressed ? "On" : "Off"}
</Toggle.Root>
```

### Controlled with `onPressedChange`

Use `onPressedChange` to react to state changes without binding, or combine with `bind:pressed` for both synchronization and side effects.

```svelte
<script lang="ts">
  import { Toggle } from "bits-ui";
  let pressed = $state(true);
</script>

<button onclick={() => (pressed = false)}>Un-press</button>

<Toggle.Root
  bind:pressed={pressed}
  onPressedChange={(p) => console.log("toggled to", p)}
>
  {pressed ? "Pressed" : "Not pressed"}
</Toggle.Root>
```

### Fully Controlled with Function Binding

For complete control over state reads and writes, use a Svelte [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings). This is useful when the state lives in a store, context, or external system.

```svelte
<script lang="ts">
  import { Toggle } from "bits-ui";
  let myPressed = $state(false);

  function getPressed() {
    return myPressed;
  }
  function setPressed(newPressed: boolean) {
    myPressed = newPressed;
  }
</script>

<Toggle.Root bind:pressed={getPressed, setPressed}>
  <!-- ... -->
</Toggle.Root>
```

### With Icon and `aria-label`

When the toggle contains only an icon, provide an `aria-label` so assistive technology can announce the control's purpose. Any standard HTML button attributes (such as `aria-label`, `disabled`, `type`) are passed through to the underlying element.

```svelte
<script lang="ts">
  import { Toggle } from "bits-ui";
  import LockKeyOpen from "phosphor-svelte/lib/LockKeyOpen";
  let unlocked = $state(false);
  const code = $derived(unlocked ? "B1T5" : "••••");
</script>

<div class="flex items-center gap-2">
  <span class="tracking-widest">{code}</span>
  <Toggle.Root
    aria-label="toggle code visibility"
    bind:pressed={unlocked}
    class="inline-flex size-10 items-center justify-center rounded-[9px] transition-all
           data-[state=on]:bg-muted data-[state=off]:bg-transparent"
  >
    <LockKeyOpen class="size-6" />
  </Toggle.Root>
</div>
```

### With `child` Snippet (Render Delegation)

Use the `child` snippet to render your own element instead of the default `<button>`. The snippet receives `props` (a `Record<string, unknown>`) which must be spread onto your element to preserve event handlers, ARIA attributes, data attributes, and the `ref`.

```svelte
<script lang="ts">
  import { Toggle } from "bits-ui";
  let pressed = $state(false);
</script>

<Toggle.Root bind:pressed>
  {#snippet child({ props })}
    <button {...props} class="my-toggle-class">
      {pressed ? "ON" : "OFF"}
    </button>
  {/snippet}
</Toggle.Root>
```

> Always spread `props` onto your custom element. Omitting it discards click handling, `aria-pressed`, `data-state`, and keyboard behavior.

### Disabled

```svelte
<script lang="ts">
  import { Toggle } from "bits-ui";
</script>

<Toggle.Root disabled>
  Disabled toggle
</Toggle.Root>
```

## Accessibility

The Toggle component renders a native `<button>` and relies on the browser's built-in button semantics.

### ARIA

- The rendered button uses `aria-pressed="true"` when pressed and `aria-pressed="false"` when not pressed. This is set automatically based on the `pressed` state — do not set it manually.
- When the toggle contains only an icon or non-text content, provide an `aria-label` (or `aria-labelledby`) so screen readers can announce the control's purpose.
- When `disabled` is `true`, the native `disabled` attribute is applied to the button, removing it from the tab order and preventing activation.

### Keyboard

Because the component renders a native `<button>`, it supports the standard button keyboard interactions:

| Key               | Action                                                    |
| ----------------- | --------------------------------------------------------- |
| `Space`           | Activates the toggle, flipping the pressed state.         |
| `Enter`           | Activates the toggle, flipping the pressed state.         |
| `Tab`             | Moves focus to/from the toggle.                           |

A disabled toggle is removed from the tab order and cannot be activated via keyboard.

### Focus

The toggle participates in normal focus order. When focused, it shows the browser's default focus ring unless overridden via CSS (e.g. `:focus-visible`). Preserve a visible focus indicator for keyboard users.

## Tips

- **Prefer `bind:pressed` for local state.** It is the simplest way to read and drive the toggle. Reach for a function binding only when the state is owned by a store, context, or external system.
- **Use `data-state` for styling, not `aria-pressed`.** Both reflect the same state, but `data-state` is the idiomatic Bits UI hook for CSS. Keep `aria-pressed` for the accessibility layer.
- **Combine `bind:pressed` with `onPressedChange`.** Binding synchronizes the value; the callback handles side effects (logging, persistence, derived updates). They are not mutually exclusive.
- **Always spread `props` in a `child` snippet.** Forgetting ` {...props}` silently breaks click handling, ARIA, data attributes, and keyboard behavior. The toggle will look right but not work.
- **Provide `aria-label` for icon-only toggles.** A button containing only an icon has no accessible name. Without a label, screen readers announce only "button" or "toggle button, pressed/not pressed" with no context.
- **Reset pressed state externally.** Because `pressed` is bindable, a parent can force it to `false` (or `true`) at any time by setting the bound variable — useful for "reset" buttons or synchronized groups.
- **Differentiate from Toggle Group.** Use a single `Toggle.Root` for one independent binary choice. Use `ToggleGroup.Root` with `ToggleGroup.Item` children when multiple toggles share a single value (single or multiple selection). The two are related but not interchangeable.
- **Disabled vs. read-only.** There is no `readOnly` prop. To show state without interaction, use `disabled` and style via `data-disabled`.
