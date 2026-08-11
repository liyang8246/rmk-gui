# Aspect Ratio

Displays content while maintaining a specified aspect ratio. The Bits UI `AspectRatio` component wraps its children in a container that enforces a configurable width-to-height ratio, which is especially useful for responsive media (images, videos, canvases) or any content that must preserve consistent proportions across viewport sizes.

## Overview

The `AspectRatio` component ensures that its child content renders within a box whose dimensions adhere to a target ratio (e.g. `16 / 9`, `4 / 3`, `1 / 1`). Internally it uses a padding-bottom trick (or equivalent layout strategy) so the ratio is preserved regardless of the container's width, making it ideal for fluid, responsive layouts where you cannot predict the available width ahead of time.

Use `AspectRatio` when:

- Rendering images or videos that should not distort as the viewport changes.
- Building card or media grids where every item must share the same proportions.
- Embedding third-party widgets (maps, players) inside a fixed-ratio frame.
- You need predictable space reservation to avoid layout shift (CLS) while media loads.

You do not need `AspectRatio` when the content already manages its own sizing (e.g. an `<img>` with fixed `width`/`height` attributes and `height: auto`).

## Component Structure

The `AspectRatio` component consists of a single part:

- **Root** — `AspectRatio.Root`
  The root (and only) component. It provides the aspect-ratio logic and renders a `<div>` wrapper that constrains its children to the configured ratio.

A minimal usage looks like this:

```svelte
<script lang="ts">
  import { AspectRatio } from "bits-ui";
</script>

<AspectRatio.Root ratio={16 / 9}>
  <!-- your content here -->
</AspectRatio.Root>
```

## API Reference

### `AspectRatio.Root`

The aspect ratio component. Renders a `<div>` that enforces the configured ratio on its children.

| Property        | Type                                                                                                            | Default     | Description                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ratio`         | `number`                                                                                                        | `1`         | The desired aspect ratio (width / height). For example, `16 / 9` for widescreen, `4 / 3` for standard, `1` for a square.                                     |
| `ref` $bindable | `HTMLDivElement`                                                                                                | `null`      | The underlying DOM element being rendered. Bind to this to obtain a reference to the rendered `<div>` element.                                               |
| `children`      | `Snippet`                                                                                                       | `undefined` | The children content to render inside the aspect-ratio container.                                                                                            |
| `child`         | `Snippet` — where `SnippetProps = { props: Record<string, unknown> }`                                          | `undefined` | Use render delegation to render your own element instead of the default `<div>`. See the [Child Snippet](/docs/child-snippet) docs for more information.      |

#### Notes on props

- **`ratio`** — Expressed as a numeric division (e.g. `16 / 9`), not a string. A value of `1` produces a square. Higher values widen the box; lower values narrow it. Because the prop expects a `number`, you can compute ratios dynamically (e.g. `ratio={width / height}`).
- **`ref`** — Bindable. Use `bind:ref` to gain a direct reference to the underlying element for imperative operations such as measuring, scrolling, or integrating with non-Svelte libraries.
- **`children`** — A standard Svelte 5 `Snippet`. The snippet's content is positioned to fill the ratio box, so child elements typically use `h-full w-full` (or equivalent) to fill the available space.
- **`child`** — Enables render delegation. Instead of rendering the default `<div>`, Bits UI forwards all the props required for aspect-ratio behavior to your snippet via the `props` field. Use this when you need a custom element type (e.g. a `<button>` or a styled component) while preserving the aspect-ratio logic.

## Data Attributes

Bits UI exposes a data attribute on the root element to aid with CSS targeting and testing.

| Data Attribute           | Value | Description                    |
| ------------------------ | ----- | ------------------------------ |
| `data-aspect-ratio-root` | `''`  | Present on the root element.   |

You can target the root element in CSS using an attribute selector:

```css
[data-aspect-ratio-root] {
  /* custom styles for the aspect ratio container */
}
```

## CSS Variables

The `AspectRatio` component does not expose any `--bits-*` CSS custom properties. Styling is controlled entirely through standard CSS classes and the `data-aspect-ratio-root` attribute selector.

## Examples

### Basic Usage

Wrap an image to preserve a `14 / 9` ratio:

```svelte
<script lang="ts">
  import { AspectRatio } from "bits-ui";
</script>

<AspectRatio.Root ratio={14 / 9} class="rounded-15px bg-transparent">
  <img
    src="/abstract.png"
    alt="an abstract painting"
    class="h-full w-full rounded-[15px] object-cover"
  />
</AspectRatio.Root>
```

### Custom Ratio

Use the `ratio` prop to set any custom aspect ratio. Common values:

```svelte
<!-- Widescreen -->
<AspectRatio.Root ratio={16 / 9}>
  <!-- ... -->
</AspectRatio.Root>

<!-- Square -->
<AspectRatio.Root ratio={1}>
  <!-- ... -->
</AspectRatio.Root>

<!-- Portrait -->
<AspectRatio.Root ratio={3 / 4}>
  <!-- ... -->
</AspectRatio.Root>
```

### Reusable Component

If you use `AspectRatio` repeatedly, create a reusable wrapper that combines the root with its inner content. The example below accepts a `src` and `alt` prop and renders an `<img>` inside the ratio box.

**`MyAspectRatio.svelte`**

```svelte
<script lang="ts">
  import { AspectRatio, type WithoutChildrenOrChild } from "bits-ui";

  let {
    src,
    alt,
    ref = $bindable(null),
    imageRef = $bindable(null),
    ...restProps
  }: WithoutChildrenOrChild<AspectRatio.RootProps> & {
    src: string;
    alt: string;
    imageRef?: HTMLImageElement | null;
  } = $props();
</script>

<AspectRatio.Root {...restProps} bind:ref>
  <img {src} {alt} bind:this={imageRef} />
</AspectRatio.Root>
```

**Usage:**

```svelte
<script lang="ts">
  import MyAspectRatio from "$lib/components/MyAspectRatio.svelte";
</script>

<MyAspectRatio
  src="https://example.com/image.jpg"
  alt="an abstract painting"
  ratio={4 / 3}
/>
```

### Render Delegation via `child`

Use the `child` snippet to render a custom element while retaining aspect-ratio behavior:

```svelte
<script lang="ts">
  import { AspectRatio } from "bits-ui";
</script>

<AspectRatio.Root ratio={1}>
  {#child { props }}
    <button {...props} class="h-full w-full">
      Click me
    </button>
  {/child}
</AspectRatio.Root>
```

> The `props` snippet argument contains all attributes that Bits UI needs to apply to the rendered element so the aspect-ratio logic continues to work. Always spread `{...props}` onto your custom element.

### Binding to the Root Element

Use `bind:ref` to obtain a reference to the underlying DOM node:

```svelte
<script lang="ts">
  import { AspectRatio } from "bits-ui";

  let rootEl: HTMLDivElement | null = $state(null);
</script>

<AspectRatio.Root bind:ref={rootEl} ratio={16 / 9}>
  <img src="/photo.jpg" alt="photo" class="h-full w-full object-cover" />
</AspectRatio.Root>

<p>The container is {rootEl?.clientWidth ?? 0}px wide.</p>
```

## Tips

- **Fill the container.** Children should use `h-full w-full` (Tailwind) or `height: 100%; width: 100%` so they fill the ratio box rather than relying on their intrinsic size.
- **Avoid layout shift.** Use `AspectRatio` for media whose dimensions are unknown ahead of time (e.g. user-uploaded images) to reserve space and reduce Cumulative Layout Shift (CLS).
- **Pick ratios deliberately.** `16 / 9` for video, `4 / 3` for classic photos, `1 / 1` for avatars/thumbnails, `3 / 4` for portraits. Match the intrinsic ratio of your content to avoid cropping with `object-cover`.
- **Combine with `object-cover`.** When wrapping `<img>` or `<video>`, pair the ratio with `object-fit: cover` (`object-cover`) to fill the frame without distortion, or `object-contain` to letterbox.
- **Reuse across a grid.** Wrap `AspectRatio.Root` in a reusable component (see Examples) to keep ratio and styling consistent across a card grid or gallery.
- **Render delegation for custom elements.** Use the `child` snippet when you need the ratio box to be a non-`<div>` element (e.g. a `<button>`, `<a>`, or custom component) — always spread `{...props}` so the aspect-ratio logic is preserved.
- **Target with CSS.** Use the `data-aspect-ratio-root` attribute selector when you need to style the container without adding a custom class.
- **No CSS variables.** `AspectRatio` exposes no `--bits-*` custom properties; style it purely through classes and the data attribute.
