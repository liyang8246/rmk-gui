# Button

A component that can switch between a button and an anchor tag based on the `href` prop. When `href` is provided, the component renders an `<a>` element; otherwise, it renders a `<button>` element.

## Overview

The `Button` component is a polymorphic primitive that renders as either a `<button>` or an `<a>` depending on whether an `href` prop is supplied. This allows you to use a single component for both interactive actions (buttons) and navigational links (anchors) while keeping a consistent API and styling surface.

It is part of Bits UI, a headless Svelte component library, meaning it provides the behavior and accessibility wiring without imposing any styles — you bring your own classes.

## Component Structure

The Button component is composed of a single part:

- **`Button.Root`** — The root (and only) part. Renders as a `<button>` by default, or an `<a>` when the `href` prop is set.

```svelte
<script lang="ts">
  import { Button } from "bits-ui";
</script>

<Button.Root />
```

## API Reference

### `Button.Root`

A component that can switch between a button and an anchor tag based on the `href`/`type` props.

| Prop         | Type                  | Default     | Description                                                                                              |
| ------------ | --------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `href`       | `string`              | `undefined` | An optional prop that, when passed, converts the button into an anchor (`<a>`) tag.                      |
| `disabled`   | `boolean`             | `false`     | Whether or not the button is disabled. When disabled, the button cannot be interacted with.              |
| `ref`        | `HTMLButtonElement`   | `null`      | The underlying DOM element being rendered. Bindable (`$bindable`) — bind to this to get a reference to the element. |
| `children`   | `Snippet`             | `undefined` | The children content to render.                                                                          |

> **Note on `ref`**: The `ref` prop is `$bindable`, meaning you can use `bind:ref` to obtain a direct reference to the rendered DOM element. The declared type is `HTMLButtonElement`, but when `href` is set the rendered element is an `HTMLAnchorElement`.

> **Standard attributes**: Because the component renders either a `<button>` or an `<a>`, any native HTML attributes valid for those elements (e.g., `type`, `onclick`, `target`, `rel`, `aria-*`) can be passed through and will be applied to the underlying element. The `type` attribute defaults to `"button"` on the `<button>` variant unless overridden.

## Data Attributes

Data attributes are present on the rendered element and can be targeted via CSS or queried via JavaScript.

| Data Attribute     | Value | Description                     |
| ------------------ | ----- | ------------------------------- |
| `data-button-root` | `''`  | Present on the button element.  |

### Styling with the data attribute

Use the `data-button-root` attribute as a styling hook to target the component without coupling to a specific class name:

```css
[data-button-root] {
  /* shared button styles */
}

[data-button-root]:disabled {
  /* disabled styles */
}
```

## CSS Variables

The Button component does not expose any `--bits-*` CSS variables. Styling is done entirely via class names or the `data-button-root` attribute.

## Examples

### Basic Usage

A simple button with text content and Tailwind utility classes:

```svelte
<script lang="ts">
  import { Button } from "bits-ui";
</script>

<Button.Root
  class="inline-flex h-12 items-center justify-center rounded-input bg-dark px-[21px] text-[15px] font-semibold text-background shadow-mini hover:bg-dark/95 active:scale-[0.98] active:transition-all"
>
  Unlimited
</Button.Root>
```

### Disabled Button

Pass the `disabled` prop to prevent interaction:

```svelte
<script lang="ts">
  import { Button } from "bits-ui";
</script>

<Button.Root disabled>
  Disabled Button
</Button.Root>
```

### With Child Snippet

Use the `children` snippet prop explicitly instead of placing content between the tags. This is useful when composing with conditional logic or forwarding snippets from a parent component:

```svelte
<script lang="ts">
  import { Button } from "bits-ui";

  let { children } = $props();
</script>

<Button.Root {children} />
```

### As a Link

Pass an `href` prop to render the component as an anchor (`<a>`) tag. This is useful for navigation that should look like a button:

```svelte
<script lang="ts">
  import { Button } from "bits-ui";
</script>

<Button.Root
  href="/docs"
  class="inline-flex h-12 items-center justify-center rounded-input bg-dark px-[21px] text-[15px] font-semibold text-background shadow-mini hover:bg-dark/95"
>
  Read the Docs
</Button.Root>
```

### Binding to the DOM Element

Use `bind:ref` to obtain a reference to the underlying element:

```svelte
<script lang="ts">
  import { Button } from "bits-ui";

  let buttonEl = $state<HTMLButtonElement | null>(null);

  function focusButton() {
    buttonEl?.focus();
  }
</script>

<Button.Root bind:ref={buttonEl} onclick={focusButton}>
  Focus me
</Button.Root>
```

### As a Form Submit Button

When rendered as a `<button>`, you can pass standard button attributes like `type` and `form`:

```svelte
<script lang="ts">
  import { Button } from "bits-ui";
</script>

<Button.Root type="submit" form="my-form">
  Submit
</Button.Root>
```

## Tips

- **Polymorphism via `href`**: The simplest way to decide between a button and a link is the `href` prop — no need to swap components. Use a real `<a>` (via `href`) for navigation and a `<button>` for actions to preserve correct semantics and accessibility.
- **Styling hook**: Target `[data-button-root]` in your CSS when you want styles that apply regardless of which class names are passed. This keeps your styles decoupled from consumer-supplied classes.
- **Forwarding snippets**: When building wrapper components around `Button.Root`, destructure `children` (and any other props) and forward them with `{...rest}` plus an explicit `{children}` to preserve the snippet.
- **Accessibility**: When using the anchor variant (`href` set) for in-app routing, prefer real URL paths over `#` anchors so the link remains meaningful with assistive technology and supports middle-click / open-in-new-tab.
- **Disabled vs. inert**: The `disabled` prop disables interaction on the `<button>` variant. For the anchor variant, `disabled` has no native effect on `<a>` elements; style or handle it in your click handler if needed.
- **Type safety**: The `ref` type is declared as `HTMLButtonElement`, but if you render with `href`, the actual element is an `HTMLAnchorElement`. Account for this when typing the bound variable if you use `href` and `bind:ref` together.
