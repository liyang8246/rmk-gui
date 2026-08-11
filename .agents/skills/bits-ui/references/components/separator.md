# Separator

Visually separates content or UI elements. The Separator component renders a thematic break between sections of content, acting as the visual equivalent of an HTML `<hr>` element but with full orientation and accessibility control.

## Overview

The Separator is a lightweight layout primitive used to divide content into logical groups. It supports both horizontal and vertical orientations and can be marked as decorative so screen readers ignore it. Built on top of the ARIA `separator` role, it provides the correct semantics out of the box while remaining fully headless — you control all styling through the `class` attribute or data attributes.

## Component Structure

The Separator consists of a single part:

- **`Separator.Root`** — The separator element itself. Renders as a `<div>` by default with the ARIA `separator` role.

```svelte
<script lang="ts">
  import { Separator } from "bits-ui";
</script>

<Separator.Root />
```

## API Reference

### `Separator.Root`

An element used to separate content. It renders an accessible separator with the ARIA `separator` role and exposes its orientation to assistive technologies.

| Property         | Type                                              | Default      | Description                                                                                                                              |
| ---------------- | ------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `orientation`    | `enum` — `'horizontal'` \| `'vertical'`           | `'horizontal'` | The orientation of the separator. Determines layout direction and the value of the `aria-orientation` attribute and `data-orientation` attribute. |
| `decorative`     | `boolean`                                         | `false`      | Whether the separator is decorative. When `true`, the separator is omitted from the accessibility tree and not announced by screen readers. |
| `ref` `$bindable`| `HTMLDivElement`                                  | `null`       | The underlying DOM element being rendered. Bind to this to obtain a direct reference to the element.                                    |
| `children`       | `Snippet`                                         | `undefined`  | The children content to render.                                                                                                          |
| `child`          | `Snippet` — `SnippetProps = { props: Record<string, unknown>; }` | `undefined` | Use render delegation to render your own element. See the Child Snippet documentation for more information.                              |

## Data Attributes

Data attributes are applied to the rendered element and can be used for CSS targeting and styling hooks.

| Data Attribute        | Value                               | Description                          |
| --------------------- | ----------------------------------- | ------------------------------------ |
| `data-orientation`    | `enum` — `'horizontal'` \| `'vertical'` | The orientation of the separator. Reflects the `orientation` prop. |
| `data-separator-root` | `''`                                | Present on the root element. Use this to target the separator specifically. |

## CSS Variables

The Separator component does not define any `--bits-*` CSS variables. All styling is handled via the `class` attribute and data-attribute selectors (e.g., `data-[orientation=horizontal]`).

## Examples

### Horizontal Separator

A horizontal separator divides stacked content vertically. This is the default orientation.

```svelte
<script lang="ts">
  import { Separator } from "bits-ui";
</script>

<div>
  <div class="space-y-1">
    <h4 class="font-semibold">Bits UI</h4>
    <p class="text-muted-foreground text-sm">
      Headless UI components for Svelte.
    </p>
  </div>
  <Separator.Root
    class="bg-border my-4 shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-[1px]"
  />
  <div class="flex h-5 items-center space-x-4 text-sm">
    <div>Blog</div>
    <div>Docs</div>
    <div>Source</div>
  </div>
</div>
```

### Vertical Separator

A vertical separator divides inline content horizontally. Pass `orientation="vertical"` and ensure the parent uses a flexbox layout so the separator receives proper height.

```svelte
<script lang="ts">
  import { Separator } from "bits-ui";
</script>

<div class="flex h-5 items-center space-x-4 text-sm">
  <div>Blog</div>
  <Separator.Root
    orientation="vertical"
    class="bg-border my-4 shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-[1px]"
  />
  <div>Docs</div>
  <Separator.Root
    orientation="vertical"
    class="bg-border my-4 shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-[1px]"
  />
  <div>Source</div>
</div>
```

### Decorative Separator

When a separator is purely visual and the surrounding content already conveys structure, mark it as decorative so screen readers skip it.

```svelte
<script lang="ts">
  import { Separator } from "bits-ui";
</script>

<Separator.Root
  decorative
  class="bg-border h-px w-full"
/>
```

### Render Delegation

Use the `child` snippet to render a custom element instead of the default `<div>`. This is useful when you need a different tag (e.g., `<hr>`) or want full control over the rendered markup.

```svelte
<script lang="ts">
  import { Separator } from "bits-ui";
</script>

<Separator.Root>
  {#snippet child({ props })}
    <hr {...props} />
  {/snippet}
</Separator.Root>
```

## Accessibility

The Separator component follows the WAI-ARIA `separator` role specification:

- Renders with `role="separator"` on the underlying element.
- Sets `aria-orientation` to match the `orientation` prop (`horizontal` or `vertical`). Note that for the `separator` role, `aria-orientation` defaults to `horizontal` on most platforms, so it is explicitly set to avoid ambiguity.
- When `decorative` is `true`, the element receives `role="presentation"` (or `aria-hidden="true"` depending on implementation), removing it from the accessibility tree. Use this for separators that exist only for visual styling and carry no semantic meaning.
- When `decorative` is `false` (default), the separator is announced by screen readers as a separator, signaling a thematic break in content.

### Keyboard Interaction

The Separator is a presentational element with no interactive behavior. It is not focusable and does not respond to keyboard input. It is purely structural.

## Tips

- **Orientation-aware styling**: Use Tailwind's data-attribute variants to style both orientations in a single class string: `data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-[1px]`. This lets you reuse the same class string for every separator regardless of orientation.
- **Flexbox for vertical separators**: A vertical separator only stretches to its full height when the parent container is a flex row with `items-stretch` or `items-center`. Without a flex parent, a vertical separator may collapse to zero height.
- **Prefer `decorative` for layout-only separators**: If a separator is used purely for visual spacing within a toolbar or navigation bar, set `decorative={true}` to avoid redundant screen reader announcements.
- **Binding to `ref`**: Use `bind:ref` when you need programmatic access to the DOM node, for example to measure its dimensions or integrate with a third-party layout library.
- **Render delegation for semantic HTML**: When semantic correctness matters, delegate rendering to an `<hr>` element via the `child` snippet. This gives you the native separator semantics while keeping Bits UI's orientation and accessibility behavior.
