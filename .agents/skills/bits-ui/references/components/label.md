# Label

A label component that identifies or describes associated UI elements. It renders a native `<label>` element and enhances it with Bits UI's consistent API surface, including render delegation and bindable refs.

## Overview

The `Label` component is an enhanced label element that can be used with any input. It wraps the native HTML `<label>` element, providing the same behavior and accessibility semantics while exposing Bits UI's standard prop pattern (`ref`, `children`, `child`).

It is part of Bits UI, a headless Svelte component library, meaning it provides the behavior and accessibility wiring without imposing any styles — you bring your own classes.

Use `Label.Root` to associate text with a form control. The association is made via the standard `for` attribute (matching the input's `id`), or implicitly by nesting the input inside the label.

## Component Structure

The Label component is composed of a single part:

- **`Label.Root`** — The root (and only) part. Renders a native `<label>` element.

```svelte
<script lang="ts">
  import { Label } from "bits-ui";
</script>

<Label.Root />
```

## API Reference

### `Label.Root`

An enhanced label component that can be used with any input.

| Prop         | Type                                                                | Default     | Description                                                                                                                        |
| ------------ | ------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ref`        | `HTMLLabelElement`                                                  | `null`      | The underlying DOM element being rendered. Bindable (`$bindable`) — bind to this to get a reference to the element.                |
| `children`   | `Snippet`                                                           | `undefined` | The children content to render.                                                                                                    |
| `child`      | `Snippet` — type `SnippetProps = { props: Record<string, unknown>; }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

> **Note on `ref`**: The `ref` prop is `$bindable`, meaning you can use `bind:ref` to obtain a direct reference to the rendered `<label>` DOM element.

> **Standard attributes**: Because the component renders a native `<label>` element, any native HTML attributes valid for `<label>` (e.g., `for`, `id`, `class`, `form`, `aria-*`, `on-*` event handlers) can be passed through and will be applied to the underlying element. The `for` attribute is the primary mechanism for associating a label with a control by `id`.

## Data Attributes

Data attributes are present on the rendered element and can be targeted via CSS or queried via JavaScript.

| Data Attribute    | Value | Description                   |
| ----------------- | ----- | ----------------------------- |
| `data-label-root` | `''`  | Present on the root element.  |

### Styling with the data attribute

Use the `data-label-root` attribute as a styling hook to target the component without coupling to a specific class name:

```css
[data-label-root] {
  /* shared label styles */
}

[data-label-root]:disabled {
  /* disabled styles */
}
```

## CSS Variables

The Label component does not expose any `--bits-*` CSS variables. Styling is done entirely via class names or the `data-label-root` attribute.

## Examples

### Basic Usage

A simple label associated with a text input via the `for`/`id` pairing:

```svelte
<script lang="ts">
  import { Label } from "bits-ui";
</script>

<Label.Root for="name" class="text-sm font-medium leading-none">
  Full name
</Label.Root>
<input id="name" type="text" class="mt-2 block w-full rounded-md border p-2" />
```

### With Child Snippet

Use the `children` snippet prop explicitly instead of placing content between the tags. This is useful when composing with conditional logic or forwarding snippets from a parent component:

```svelte
<script lang="ts">
  import { Label } from "bits-ui";

  let { children } = $props();
</script>

<Label.Root {children} />
```

### With Form Input (Checkbox)

A common pattern is pairing `Label.Root` with a form control such as a checkbox. Use `for` on the label and a matching `id` (plus `aria-labelledby`) on the control. The example below also uses the `peer-disabled` utility so the label visually reflects the checkbox's disabled state:

```svelte
<script lang="ts">
  import { Checkbox, Label } from "bits-ui";
  import Check from "phosphor-svelte/lib/Check";
  import Minus from "phosphor-svelte/lib/Minus";
</script>

<div class="flex items-center space-x-3">
  <Checkbox.Root
    id="terms"
    aria-labelledby="terms-label"
    class="peer inline-flex size-[25px] items-center justify-center rounded-md border transition-all duration-150 ease-in-out active:scale-[0.98]"
    name="hello"
  >
    {#snippet children({ checked, indeterminate })}
      <div class="inline-flex items-center justify-center text-background">
        {#if indeterminate}
          <Minus class="size-[15px]" weight="bold" />
        {:else if checked}
          <Check class="size-[15px]" weight="bold" />
        {/if}
      </div>
    {/snippet}
  </Checkbox.Root>
  <Label.Root
    id="terms-label"
    for="terms"
    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Accept terms and conditions
  </Label.Root>
</div>
```

### Binding to the DOM Element

Use `bind:ref` to obtain a reference to the underlying `<label>` element:

```svelte
<script lang="ts">
  import { Label } from "bits-ui";

  let labelEl = $state<HTMLLabelElement | null>(null);

  function focusAssociated() {
    labelEl?.click();
  }
</script>

<Label.Root bind:ref={labelEl} for="email">
  Email address
</Label.Root>
<input id="email" type="email" />
```

## Tips

- **Association via `for`**: The most reliable way to associate a label with a control is the `for` attribute matching the input's `id`. This works even when the label and control are not nested, and it ensures screen readers announce the label when the control receives focus.
- **Implicit association**: If you nest the control inside `Label.Root`, the label is implicitly associated with it. However, explicit `for`/`id` pairing is generally more robust and easier to reason about in larger forms.
- **Styling hook**: Target `[data-label-root]` in your CSS when you want styles that apply regardless of which class names are passed. This keeps your styles decoupled from consumer-supplied classes.
- **Reflecting disabled state**: When pairing a label with a control that can be disabled, use the control's `peer-disabled` variant (or similar) on the label so the label visually reflects the disabled state, as shown in the checkbox example above.
- **Forwarding snippets**: When building wrapper components around `Label.Root`, destructure `children` (and any other props) and forward them with `{...rest}` plus an explicit `{children}` to preserve the snippet.
- **Render delegation**: Use the `child` snippet prop when you need `Label.Root` to render a custom element instead of the default `<label>`. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) documentation for details.
- **Accessibility**: Always provide a label for interactive form controls. The `Label` component gives you the correct semantics for free; pair it with `aria-labelledby` on the control when a single control needs multiple label references.
