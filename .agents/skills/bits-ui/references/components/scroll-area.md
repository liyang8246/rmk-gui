# Scroll Area

Provides a consistent, customizable scroll area across platforms. The Scroll Area component replaces native browser scrollbars with stylable, cross-platform scrollbars that offer precise control over visibility, behavior, and appearance.

## Overview

The Scroll Area component wraps scrollable content and renders custom scrollbars in place of the native browser ones. It gives you full styling control over the scrollbar track and thumb while preserving native scrolling behavior (mouse wheel, touch, trackpad, keyboard). It supports four visibility modes — `hover`, `scroll`, `auto`, and `always` — and both vertical and horizontal orientations.

Use this component when you need scrollbars that match your application's design system, when you need consistent scrollbar behavior across operating systems, or when you need to programmatically control scrollbar visibility.

## Component Structure

The Scroll Area is composed of five parts that work together:

| Part | Description |
| --- | --- |
| `ScrollArea.Root` | The outer container. Overflow is hidden on this element to prevent native scrollbars from appearing alongside custom ones. |
| `ScrollArea.Viewport` | Wraps the scrollable content and is responsible for computing the scroll area size. This is the element that actually scrolls. |
| `ScrollArea.Scrollbar` | A scrollbar (vertical or horizontal). Contains a `Thumb` child. Requires an `orientation` prop. |
| `ScrollArea.Thumb` | The draggable thumb inside a `Scrollbar`. Represents the current scroll position and size relative to the content. |
| `ScrollArea.Corner` | The corner element rendered between the horizontal and vertical scrollbars when both are visible. |

Minimal structure:

```svelte
<script lang="ts">
  import { ScrollArea } from "bits-ui";
</script>

<ScrollArea.Root>
  <ScrollArea.Viewport>
    <!-- Scrollable content here -->
  </ScrollArea.Viewport>
  <ScrollArea.Scrollbar orientation="vertical">
    <ScrollArea.Thumb />
  </ScrollArea.Scrollbar>
  <ScrollArea.Scrollbar orientation="horizontal">
    <ScrollArea.Thumb />
  </ScrollArea.Scrollbar>
  <ScrollArea.Corner />
</ScrollArea.Root>
```

## API Reference

### ScrollArea.Root

The container of all scroll area components. Overflow is hidden on this element to prevent double scrollbars.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `enum` — `'hover' \| 'scroll' \| 'auto' \| 'always'` | `'hover'` | The type of scroll area, controlling when scrollbars are shown. |
| `scrollHideDelay` | `number` | `600` | The delay in milliseconds before the scroll area hides itself when using `'hover'` or `'scroll'` type. |
| `dir` | `enum` — `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `ref` | `HTMLDivElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

#### Scroll Area Types

The `type` prop on `Root` controls scrollbar visibility behavior:

| Type | Behavior |
| --- | --- |
| `'hover'` | Default. Scrollbars appear only when the user hovers over the scroll area and the content is larger than the viewport. |
| `'scroll'` | Scrollbars appear when the user scrolls the content. Similar to macOS behavior. |
| `'auto'` | Behaves like typical browser scrollbars. When content is larger than the viewport, scrollbars appear and remain visible. |
| `'always'` | Behaves like `overflow: scroll`. Scrollbars are always visible, even when content is smaller than the viewport. |

### ScrollArea.Viewport

The component that wraps the content and is responsible for computing the scroll area size.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` | `HTMLDivElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### ScrollArea.Scrollbar

A scrollbar of the scroll area. Requires an `orientation` prop and typically contains a `ScrollArea.Thumb` child.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `enum` — `'horizontal' \| 'vertical'` | `undefined` (required) | The orientation of the scrollbar. |
| `forceMount` | `boolean` | `false` | Whether to forcefully mount the content. Useful when using Svelte transitions or another animation library for the content. |
| `ref` | `HTMLDivElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### ScrollArea.Thumb

A thumb of a scrollbar in the scroll area. Must be a child of a `ScrollArea.Scrollbar`.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `forceMount` | `boolean` | `false` | Whether to forcefully mount the content. Useful when using Svelte transitions or another animation library for the content. |
| `ref` | `HTMLDivElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### ScrollArea.Corner

The corner element rendered between the X and Y scrollbars when both are visible. Typically empty, but useful for styling the intersection of the two scrollbars.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` | `HTMLDivElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

## Data Attributes

Data attributes are applied to the rendered DOM elements and can be used for CSS targeting and state-based styling.

| Element | Data Attribute | Value | Description |
| --- | --- | --- | --- |
| `Root` | `data-scroll-area-root` | `''` | Present on the root element. |
| `Viewport` | `data-scroll-area-viewport` | `''` | Present on the viewport element. |
| `Scrollbar` | `data-state` | `'visible' \| 'hidden'` | The visibility state of the scrollbar. |
| `Scrollbar` | `data-scroll-area-scrollbar-x` | `''` | Present on the `'horizontal'` scrollbar element. |
| `Scrollbar` | `data-scroll-area-scrollbar-y` | `''` | Present on the `'vertical'` scrollbar element. |
| `Thumb` | `data-state` | `'visible' \| 'hidden'` | The visibility state of the scrollbar. |
| `Thumb` | `data-scroll-area-thumb-x` | `''` | Present on the `'horizontal'` thumb element. |
| `Thumb` | `data-scroll-area-thumb-y` | `''` | Present on the `'vertical'` thumb element. |
| `Corner` | `data-scroll-area-corner` | `''` | Present on the corner element. |

### Styling with Data Attributes

Use the `data-state` attribute to apply transition or animation styles based on scrollbar visibility:

```css
/* Fade in/out based on visibility */
[data-state='visible'] {
  animation: fade-in 0.2s ease;
}
[data-state='hidden'] {
  animation: fade-out 0.2s ease;
}
```

In Tailwind CSS, use the `data-[state=visible]:` and `data-[state=hidden]:` variants:

```svelte
<ScrollArea.Scrollbar
  orientation="vertical"
  class="data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:fade-in-0"
>
  <ScrollArea.Thumb />
</ScrollArea.Scrollbar>
```

## CSS Variables

The Bits UI Scroll Area component does not expose any `--bits-*` CSS custom properties. Styling is done entirely through standard CSS classes and the data attributes listed above.

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { ScrollArea } from "bits-ui";
</script>

<ScrollArea.Root class="relative overflow-hidden rounded-[10px] border px-4 py-4">
  <ScrollArea.Viewport class="h-full max-h-[200px] w-full max-w-[200px]">
    <h4 class="mb-4 mt-2 text-xl font-semibold leading-none tracking-[-0.01em]">
      Scroll Area
    </h4>
    <p class="text-sm leading-5">
      Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dignissimos
      impedit rem, repellat deserunt ducimus quasi nisi voluptatem cumque
      aliquid esse ea deleniti eveniet incidunt! Deserunt minus laborum
      accusamus iusto dolorum. Lorem ipsum dolor sit, amet consectetur
      adipisicing elit. Blanditiis officiis error minima eos fugit voluptate
      excepturi eveniet dolore et, ratione impedit consequuntur dolorem hic
      quae corrupti autem? Dolorem, sit voluptatum.
    </p>
  </ScrollArea.Viewport>
  <ScrollArea.Scrollbar
    orientation="vertical"
    class="flex w-2.5 touch-none select-none rounded-full border-l border-l-transparent p-px transition-all duration-200 hover:w-3"
  >
    <ScrollArea.Thumb class="flex-1 rounded-full bg-muted-foreground" />
  </ScrollArea.Scrollbar>
  <ScrollArea.Scrollbar
    orientation="horizontal"
    class="flex h-2.5 touch-none select-none rounded-full border-t border-t-transparent p-px transition-all duration-200 hover:h-3"
  >
    <ScrollArea.Thumb class="rounded-full bg-muted-foreground" />
  </ScrollArea.Scrollbar>
  <ScrollArea.Corner />
</ScrollArea.Root>
```

### Reusable Component

Create a reusable Scroll Area component to reduce boilerplate across your application. This example accepts custom props for orientation and viewport classes, and uses a snippet to render scrollbars conditionally.

`MyScrollArea.svelte`

```svelte
<script lang="ts">
  import { ScrollArea, type WithoutChild } from "bits-ui";

  type Props = WithoutChild<ScrollArea.RootProps> & {
    orientation: "vertical" | "horizontal" | "both";
    viewportClasses?: string;
  };

  let {
    ref = $bindable(null),
    orientation = "vertical",
    viewportClasses,
    children,
    ...restProps
  }: Props = $props();
</script>

{#snippet Scrollbar({ orientation }: { orientation: "vertical" | "horizontal" })}
  <ScrollArea.Scrollbar {orientation}>
    <ScrollArea.Thumb />
  </ScrollArea.Scrollbar>
{/snippet}

<ScrollArea.Root bind:ref {...restProps}>
  <ScrollArea.Viewport class={viewportClasses}>
    {@render children?.()}
  </ScrollArea.Viewport>
  {#if orientation === "vertical" || orientation === "both"}
    {@render Scrollbar({ orientation: "vertical" })}
  {/if}
  {#if orientation === "horizontal" || orientation === "both"}
    {@render Scrollbar({ orientation: "horizontal" })}
  {/if}
  <ScrollArea.Corner />
</ScrollArea.Root>
```

### Scroll Area Types

#### Hover (default)

Scrollbars appear only on hover when content overflows.

```svelte
<MyScrollArea type="hover">
  <!-- ... -->
</MyScrollArea>
```

#### Scroll

Scrollbars appear when the user scrolls. Similar to macOS behavior.

```svelte
<MyScrollArea type="scroll">
  <!-- ... -->
</MyScrollArea>
```

#### Auto

Scrollbars appear and remain visible whenever content overflows, like typical browser scrollbars.

```svelte
<MyScrollArea type="auto">
  <!-- ... -->
</MyScrollArea>
```

#### Always

Scrollbars are always visible, even when content fits within the viewport. Combine with `orientation="both"` to show both scrollbars.

```svelte
<MyScrollArea type="always" orientation="both">
  <!-- ... -->
</MyScrollArea>
```

### Customizing the Hide Delay

Adjust how long scrollbars remain visible before hiding (applies to `'hover'` and `'scroll'` types). Value is in milliseconds.

```svelte
<MyScrollArea scrollHideDelay={10}>
  <!-- ... -->
</MyScrollArea>
```

## Accessibility

The Scroll Area component preserves native scrolling semantics, so keyboard and assistive technology behavior works out of the box:

- The `Viewport` element is focusable and responds to standard keyboard scrolling.
- When the viewport has focus, the following keys scroll the content:
  - `ArrowDown` / `ArrowUp` — scroll vertically by one line.
  - `ArrowRight` / `ArrowLeft` — scroll horizontally by one line (when horizontal scroll is available).
  - `PageDown` / `PageUp` — scroll vertically by one viewport height.
  - `Home` — scroll to the top.
  - `End` — scroll to the bottom.
  - `Space` — scroll down by one viewport height (`Shift+Space` scrolls up).
- Mouse wheel, trackpad, and touch gestures scroll natively.
- The custom scrollbars are decorative and do not interfere with native scroll behavior or screen reader announcements.
- Ensure the viewport has a visible focus outline if users are expected to keyboard-scroll within it. If you remove the default outline, provide an alternative focus indicator.

## Tips

### Prevent Layout Shift

Always set an explicit height (or max-height) on the `Viewport` or an ancestor. Without a constrained height, the viewport will grow to fit all content and scrolling will never engage. Use `max-h-*` utilities to cap height while allowing shorter content to shrink.

### Conditionally Render Scrollbars

If you only need vertical scrolling, omit the horizontal `Scrollbar` (and vice versa). The component handles a single scrollbar gracefully. Only include both when content may overflow in both directions.

### Use `forceMount` for Transitions

By default, scrollbars unmount when hidden. If you want to use Svelte transitions (e.g., `transition:fade`) or an animation library on scrollbars, set `forceMount` to `true` on the `Scrollbar` or `Thumb` so the element stays in the DOM and animates via `data-state` instead.

```svelte
<ScrollArea.Scrollbar orientation="vertical" forceMount>
  <ScrollArea.Thumb />
</ScrollArea.Scrollbar>
```

### Style the Corner

The `Corner` element fills the square where the two scrollbars intersect. Give it a background color or border to match your scrollbars for a polished look when both are visible.

### Touch Devices

Add `touch-none` and `select-none` classes to the `Scrollbar` to prevent accidental text selection or touch interference on mobile devices:

```svelte
<ScrollArea.Scrollbar
  orientation="vertical"
  class="touch-none select-none"
>
  <ScrollArea.Thumb />
</ScrollArea.Scrollbar>
```

### Right-to-Left Support

Set `dir="rtl"` on the `Root` when your app uses a right-to-left layout. The scroll area adjusts scrollbar positioning accordingly.

### Bind to the Viewport Ref

If you need programmatic control over scrolling (e.g., `scrollTo`, `scrollIntoView`), bind to the `Viewport` ref:

```svelte
<script lang="ts">
  import { ScrollArea } from "bits-ui";
  let viewportEl = $state<HTMLDivElement | null>(null);

  function scrollToTop() {
    viewportEl?.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

<ScrollArea.Root>
  <ScrollArea.Viewport bind:ref={viewportEl}>
    <!-- content -->
  </ScrollArea.Viewport>
  <ScrollArea.Scrollbar orientation="vertical">
    <ScrollArea.Thumb />
  </ScrollArea.Scrollbar>
</ScrollArea.Root>
```

### Render Delegation

Use the `child` snippet prop on any part when you need full control over the rendered element (e.g., to render a custom tag or merge props onto an existing element). The snippet receives a `props` object that must be spread onto your element. See the Bits UI Child Snippet documentation for details.
