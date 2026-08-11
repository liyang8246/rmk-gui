# Link Preview

Displays a summarized preview of a linked content's details or information. The Link Preview component lets users preview a link before deciding to follow it, providing non-essential context or additional information about a link without navigating away from the current page.

## Table of Contents

- [Overview](#overview)
- [Component Structure](#component-structure)
- [API Reference](#api-reference)
  - [LinkPreview.Root](#linkpreviewroot)
  - [LinkPreview.Trigger](#linkpreviewtrigger)
  - [LinkPreview.Content](#linkpreviewcontent)
  - [LinkPreview.ContentStatic](#linkpreviewcontentstatic)
  - [LinkPreview.Arrow](#linkpreviewarrow)
  - [LinkPreview.Portal](#linkpreviewportal)
- [Data Attributes](#data-attributes)
- [CSS Variables](#css-variables)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Tips](#tips)

## Overview

The Link Preview component displays a preview of linked content when the user hovers over (or focuses) the trigger element. It is useful for surfacing supplementary details — such as a user profile card, a link summary, or metadata — without requiring the user to click through and navigate away from the current page.

**When to use it:**

- Providing non-essential context or additional information about a link without navigating away.
- Showing a preview of a linked resource (profile card, article summary, metadata) on hover or focus.
- Enhancing links with rich, informational tooltips that appear after a configurable delay.

**Features:**

- **Hover/Focus Trigger** — Opens on hover or keyboard focus after a configurable delay, closes on blur/mouse-leave.
- **Floating UI Positioning** — Content is positioned relative to the trigger using Floating UI, with collision detection, sticky alignment, and side/align offsets.
- **Static Alternative** — Opt out of Floating UI with `LinkPreview.ContentStatic` for fully custom positioning.
- **Custom Anchor** — Anchor the preview content to any element, not just the trigger.
- **State Management** — Two-way bindable `open` state, with open/close delay configuration.
- **Svelte Transitions** — Use `forceMount` with the `child` snippet to integrate Svelte Transitions or other animation libraries.
- **Portal Support** — Render the preview content into the body or a custom element via `LinkPreview.Portal`.

> **A note about mobile devices!**
>
> This component is only intended for use with a mouse or other pointing device. It does not respond to touch events, and the preview content cannot be accessed via the keyboard on touch devices. On touch devices, the link will be followed immediately. Because it is not accessible to all users, the preview should not contain vital information.

## Component Structure

The Link Preview is composed of five parts. The core usage requires `Root`, `Trigger`, and `Content` (or `ContentStatic`); `Arrow` and `Portal` are optional.

| Part | Element | Role |
|------|---------|------|
| `LinkPreview.Root` | — | Container that manages the open/closed state, open/close delays, and disabled state of the link preview. |
| `LinkPreview.Trigger` | `<a>` | An anchor element that triggers the opening and closing of the preview on hover or focus. |
| `LinkPreview.Content` | `<div>` | The preview content, positioned relative to the trigger (or custom anchor) using Floating UI. |
| `LinkPreview.ContentStatic` | `<div>` | The preview content without Floating UI positioning — positioning is entirely up to you. |
| `LinkPreview.Arrow` | `<div>` | An optional arrow element that points to the trigger when the preview is open. Designed for use with Floating UI `Content`. |
| `LinkPreview.Portal` | — | When used, renders the link preview content into the body or a custom `to` element when open. |

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger />
  <LinkPreview.Content />
</LinkPreview.Root>
```

## API Reference

### LinkPreview.Root

The root component used to manage the state of the link preview.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | The open state of the link preview component. **Bindable** via `bind:open`. |
| `onOpenChange` | `function` — `(open: boolean) => void` | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `function` — `(open: boolean) => void` | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `openDelay` | `number` | `700` | The amount of time in milliseconds to delay opening the preview when hovering over the trigger. |
| `closeDelay` | `number` | `300` | The amount of time in milliseconds to delay closing the preview when the mouse leaves the trigger. |
| `disabled` | `boolean` | `false` | Whether or not the link preview is disabled. |
| `ignoreNonKeyboardFocus` | `boolean` | `false` | Whether the link preview should ignore non-keyboard focus. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### LinkPreview.Trigger

A component which triggers the opening and closing of the link preview on hover or focus. Renders an `<a>` element, so it accepts standard anchor attributes (`href`, `target`, `rel`, etc.).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ref` | `HTMLAnchorElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### LinkPreview.Content

The contents of the link preview which are displayed when the preview is open. Uses Floating UI to position the content relative to the trigger (or a custom anchor).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur. |
| `sideOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | The preferred alignment of the anchor to render the floating element against when open. This may change when collisions occur. |
| `alignOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element. |
| `arrowPadding` | `number` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `avoidCollisions` | `boolean` | `true` | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary` | `Element \| null` | `undefined` | A boundary element or array of elements to check for collisions against. |
| `collisionPadding` | `number \| Partial<Record<Side, number>>` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky` | `'partial' \| 'always'` | `'partial'` | The sticky behavior on the align axis. `'partial'` will keep the content in the boundary as long as the trigger is at least partially in the boundary, whilst `'always'` will keep the content in the boundary regardless. |
| `hideWhenDetached` | `boolean` | `true` | When `true`, hides the content when it is detached from the DOM. Useful when you want to hide the content when the user scrolls away. |
| `updatePositionStrategy` | `'optimized' \| 'always'` | `'optimized'` | The strategy to use when updating the position of the content. When `'optimized'`, the content will only be repositioned when the trigger is in the viewport. When `'always'`, the content will be repositioned whenever the position changes. |
| `strategy` | `'fixed' \| 'absolute'` | `'fixed'` | The positioning strategy to use for the floating element. When `'fixed'`, the element will be positioned relative to the viewport. When `'absolute'`, the element will be positioned relative to the nearest positioned ancestor. |
| `preventScroll` | `boolean` | `true` | When `true`, prevents the body from scrolling when the content is open. Useful when you want to use the content as a modal. |
| `customAnchor` | `string \| HTMLElement \| Measurable \| null` | `null` | Use an element other than the trigger to anchor the content to. If provided, the content will be anchored to the provided element instead of the trigger. |
| `onInteractOutside` | `function` — `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event occurs (a `pointerdown` event). Call `event.preventDefault()` to prevent the default behavior of handling the outside interaction. |
| `onFocusOutside` | `function` — `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior on focus leaving the layer. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction. |
| `onEscapeKeydown` | `function` — `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs in the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction. |
| `onOpenAutoFocus` | `function` — `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `function` — `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap the focus within the content when open. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful if you want to use Svelte transitions or another animation library for the content. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### LinkPreview.ContentStatic

The contents of the link preview which are displayed when the preview is open. This variant does **not** use Floating UI — positioning the content is entirely up to you. It shares the layer behavior props of `Content` but omits all the Floating UI positioning props (`side`, `align`, `sideOffset`, `alignOffset`, `avoidCollisions`, etc.).

> **Heads up!**
>
> The `LinkPreview.Arrow` component is designed to be used with Floating UI and `LinkPreview.Content`. You may experience unexpected behavior if you attempt to use it with `LinkPreview.ContentStatic`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onInteractOutside` | `function` — `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event occurs (a `pointerdown` event). Call `event.preventDefault()` to prevent the default behavior of handling the outside interaction. |
| `onFocusOutside` | `function` — `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior on focus leaving the layer. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction. |
| `onEscapeKeydown` | `function` — `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs in the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction. |
| `onOpenAutoFocus` | `function` — `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `function` — `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap the focus within the content when open. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful if you want to use Svelte transitions or another animation library for the content. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### LinkPreview.Arrow

An optional arrow element which points to the trigger when the preview is open. Designed for use with Floating UI and `LinkPreview.Content` — do not use with `LinkPreview.ContentStatic`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | `8` | The width of the arrow in pixels. |
| `height` | `number` | `8` | The height of the arrow in pixels. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### LinkPreview.Portal

When used, renders the link preview content into the body or a custom `to` element when open.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `to` | `Element \| string` | `document.body` | Where to render the content when it is open. Defaults to the body. |
| `disabled` | `boolean` | `false` | Whether the portal is disabled or not. When disabled, the content will be rendered in its original DOM location. |
| `children` | `Snippet` | `undefined` | The children content to render. |

## Data Attributes

State and identity are exposed via `data-*` attributes on each part. Use these for CSS targeting and state-based styling.

### LinkPreview.Trigger

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-state` | `'open' \| 'closed'` | Whether the link preview is open or closed. |
| `data-link-preview-trigger` | `''` | Present on the trigger element. |

### LinkPreview.Content / LinkPreview.ContentStatic

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-state` | `'open' \| 'closed'` | Whether the link preview is open or closed. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-link-preview-content` | `''` | Present on the content element. |

### LinkPreview.Arrow

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-link-preview-arrow` | `''` | Present on the arrow element. |

## CSS Variables

The Floating UI-powered `LinkPreview.Content` exposes `--bits-*` CSS variables that reflect the live position and size of the content and its anchor. Use these to drive CSS-based animations, responsive sizing, or transform origins.

| CSS Variable | Description |
|--------------|-------------|
| `--bits-link-preview-content-transform-origin` | The transform origin of the content element. |
| `--bits-link-preview-content-available-width` | The available width of the content element. |
| `--bits-link-preview-content-available-height` | The available height of the content element. |
| `--bits-link-preview-anchor-width` | The width of the anchor element. |
| `--bits-link-preview-anchor-height` | The height of the anchor element. |

> These variables are only populated when using `LinkPreview.Content` (Floating UI). `LinkPreview.ContentStatic` does not set them.

## Examples

### Basic Usage

A trigger link that reveals a preview card on hover. The `Trigger` renders an `<a>`, so pass `href`, `target`, and `rel` as you would on any anchor.

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger
    href="https://x.com/huntabyte"
    target="_blank"
    rel="noreferrer noopener"
    class="rounded-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
  >
    @huntabyte
  </LinkPreview.Trigger>
  <LinkPreview.Content
    class="bg-background w-72 rounded-lg border p-4 shadow-md"
    sideOffset={8}
  >
    <p class="text-sm">
      <span class="font-medium">@huntabyte</span> — I do things on the
      internet.
    </p>
  </LinkPreview.Content>
</LinkPreview.Root>
```

### With Avatar (Profile Card Preview)

A common pattern is wrapping an `Avatar` in the trigger to preview a user profile card.

```svelte
<script lang="ts">
  import { Avatar, LinkPreview } from "bits-ui";
  import CalendarBlank from "phosphor-svelte/lib/CalendarBlank";
  import MapPin from "phosphor-svelte/lib/MapPin";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger
    href="https://x.com/huntabyte"
    target="_blank"
    rel="noreferrer noopener"
    class="rounded-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
  >
    <Avatar.Root
      class="data-[status=loaded]:border-foreground bg-muted text-muted-foreground h-12 w-12 rounded-full border border-transparent text-[17px] font-medium uppercase"
    >
      <div
        class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
      >
        <Avatar.Image src="/avatar-1.png" alt="@huntabyte" />
        <Avatar.Fallback class="border-muted border">HB</Avatar.Fallback>
      </div>
    </Avatar.Root>
  </LinkPreview.Trigger>
  <LinkPreview.Content
    class="border-muted bg-background shadow-popover w-[331px] rounded-xl border p-[17px]"
    sideOffset={8}
  >
    <div class="flex space-x-4">
      <Avatar.Root
        class="data-[status=loaded]:border-foreground bg-muted text-muted-foreground h-12 w-12 rounded-full border border-transparent text-[17px] font-medium uppercase"
      >
        <div
          class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
        >
          <Avatar.Image src="/avatar-1.png" alt="@huntabyte" />
          <Avatar.Fallback class="border-muted border">HB</Avatar.Fallback>
        </div>
      </Avatar.Root>
      <div class="space-y-1 text-sm">
        <h4 class="font-medium">@huntabyte</h4>
        <p>I do things on the internet.</p>
        <div
          class="text-muted-foreground flex items-center gap-[21px] pt-2 text-xs"
        >
          <div class="flex items-center text-xs">
            <MapPin class="mr-1 size-4" />
            <span>FL, USA</span>
          </div>
          <div class="flex items-center text-xs">
            <CalendarBlank class="mr-1 size-4" />
            <span>Joined May 2020</span>
          </div>
        </div>
      </div>
    </div>
  </LinkPreview.Content>
</LinkPreview.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet on the trigger (or content) to render your own element while preserving all internal props (event handlers, ARIA attributes, data attributes).

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger href="https://bits-ui.com">
    {#snippet child({ props })}
      <a
        {...props}
        class="text-primary font-medium underline underline-offset-4 hover:text-primary/80"
      >
        Visit Bits UI
      </a>
    {/snippet}
  </LinkPreview.Trigger>
  <LinkPreview.Content>
    <p class="text-sm">The headless component library for Svelte.</p>
  </LinkPreview.Content>
</LinkPreview.Root>
```

### With Child Snippet + Svelte Transitions

Use `forceMount` together with the `child` snippet to forcefully mount the `LinkPreview.Content` and integrate Svelte Transitions (or another animation library). The `child` snippet receives `wrapperProps`, `props`, and `open` — spread `wrapperProps` onto an outer wrapper (used by Floating UI for positioning) and `props` onto the inner content element you apply the transition to.

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<LinkPreview.Content forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:fly={{ duration: 300 }}>
          <!-- preview content here -->
        </div>
      </div>
    {/if}
  {/snippet}
</LinkPreview.Content>
```

A full example with the transition applied to a profile card:

```svelte
<script lang="ts">
  import { Avatar, LinkPreview } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger
    href="https://github.com/sveltejs"
    target="_blank"
    rel="noreferrer noopener"
    class="rounded-xs underline-offset-4 hover:underline"
  >
    @sveltejs
  </LinkPreview.Trigger>
  <LinkPreview.Content
    class="border-muted bg-background shadow-popover w-[331px] rounded-xl border p-[17px]"
    sideOffset={8}
    forceMount
  >
    {#snippet child({ open, props, wrapperProps })}
      {#if open}
        <div {...wrapperProps}>
          <div {...props} transition:fly={{ duration: 300 }}>
            <div class="flex space-x-4">
              <Avatar.Root
                class="h-12 w-12 rounded-full border bg-muted text-[17px] font-medium uppercase"
              >
                <div
                  class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
                >
                  <Avatar.Image src="/avatar-1.png" alt="@sveltejs" />
                  <Avatar.Fallback class="border-muted border">SV</Avatar.Fallback>
                </div>
              </Avatar.Root>
              <div class="space-y-1 text-sm">
                <h4 class="font-medium">@sveltejs</h4>
                <p>Cybernetically enhanced web apps.</p>
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/snippet}
  </LinkPreview.Content>
</LinkPreview.Root>
```

> This isn't the prettiest syntax, so it's recommended to create your own reusable content component that handles this logic if you intend to use this approach. For more information on using transitions with Bits UI components, see the [Transitions](https://bits-ui.com/docs/transitions) documentation.

### Managing Open State

#### Two-Way Binding

Use `bind:open` for simple, automatic state synchronization.

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Link Preview</button>

<LinkPreview.Root bind:open={isOpen}>
  <LinkPreview.Trigger href="https://example.com">Hover me</LinkPreview.Trigger>
  <LinkPreview.Content>
    <p class="text-sm">Programmatically opened.</p>
  </LinkPreview.Content>
</LinkPreview.Root>
```

#### Fully Controlled

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes.

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<LinkPreview.Root bind:open={getOpen, setOpen}>
  <LinkPreview.Trigger href="https://example.com">Hover me</LinkPreview.Trigger>
  <LinkPreview.Content>
    <p class="text-sm">Fully controlled.</p>
  </LinkPreview.Content>
</LinkPreview.Root>
```

### Opt-Out of Floating UI (ContentStatic)

Use `LinkPreview.ContentStatic` when you want to handle positioning yourself. This component does not use Floating UI.

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger href="https://example.com">Hover me</LinkPreview.Trigger>
  <LinkPreview.ContentStatic class="absolute left-0 top-full mt-2 w-72 rounded-lg border p-4 shadow-md">
    <p class="text-sm">Statically positioned content.</p>
  </LinkPreview.ContentStatic>
</LinkPreview.Root>
```

### Custom Anchor

By default, `LinkPreview.Content` is anchored to the `LinkPreview.Trigger`. Pass `customAnchor` (a selector string or `HTMLElement`) to anchor the content to a different element.

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
  let customAnchor = $state<HTMLElement>(null!);
</script>

<div bind:this={customAnchor}></div>

<LinkPreview.Root>
  <LinkPreview.Trigger href="https://example.com">Hover me</LinkPreview.Trigger>
  <LinkPreview.Content {customAnchor}>
    <p class="text-sm">Anchored to the custom element.</p>
  </LinkPreview.Content>
</LinkPreview.Root>
```

### With Arrow

Add a `LinkPreview.Arrow` inside the content to render a pointing arrow. Only use the arrow with Floating UI `Content` (not `ContentStatic`).

```svelte
<script lang="ts">
  import { LinkPreview } from "bits-ui";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger href="https://example.com">Hover me</LinkPreview.Trigger>
  <LinkPreview.Content
    class="bg-background w-72 rounded-lg border p-4 shadow-md"
    sideOffset={8}
  >
    <LinkPreview.Arrow class="fill-background" />
    <p class="text-sm">Preview with an arrow.</p>
  </LinkPreview.Content>
</LinkPreview.Root>
```

## Accessibility

The Link Preview component is designed for pointer/mouse interaction and keyboard focus. Keep the following in mind:

- **Mouse interaction** — Hovering over the trigger opens the preview after `openDelay` (default `700`ms). Moving the mouse away closes it after `closeDelay` (default `300`ms).
- **Keyboard focus** — Focusing the trigger (via `Tab`) opens the preview. Moving focus away closes it. The preview content supports focus trapping by default (`trapFocus` is `true`).
- **Escape key** — Pressing `Escape` while the content is open closes the preview. The behavior is configurable via `escapeKeydownBehavior`; the `onEscapeKeydown` callback lets you intercept and `event.preventDefault()`.
- **Outside interaction** — Clicking or interacting outside the content closes it. Configure with `interactOutsideBehavior` and intercept with `onInteractOutside`.
- **Touch devices** — The component does not respond to touch events. On touch devices the link is followed immediately and the preview cannot be accessed. Because of this, the preview must not contain vital information.
- **Not a replacement for content** — Since the preview is inaccessible to some users (touch users, some assistive tech), treat the preview as progressive enhancement. The trigger's `href` must lead to the full content.

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Moves focus to/from the trigger. Focusing the trigger opens the preview (subject to `openDelay`). |
| `Shift` + `Tab` | Moves focus backward away from the trigger, closing the preview. |
| `Escape` | Closes the preview content when it is open. |
| `Enter` | Activates the trigger link (follows `href`) — standard anchor behavior. |

## Tips

- **Wrap floating content in `LinkPreview.Content`, not a custom element.** When using Floating UI positioning, the content element must be the `LinkPreview.Content` component (or `ContentStatic` if you opt out). The `child` snippet lets you render your own inner element while still spreading `wrapperProps` (which carries the Floating UI positioning styles) onto the positioning wrapper and `props` onto the content element. Skipping `wrapperProps` breaks positioning.
- **Use `forceMount` + `child` for Svelte Transitions.** To animate the content with `svelte/transition` or another library, set `forceMount` on `Content` and use the `child` snippet to conditionally render based on the `open` parameter. Spread `wrapperProps` on the outer wrapper and apply the transition to the inner element — never apply the transition to the `wrapperProps` element, as Floating UI controls its transform.
- **Tune the delays.** The defaults (`openDelay: 700`, `closeDelay: 300`) prevent accidental triggers but may feel sluggish or twitchy depending on your UI. Lower `openDelay` for snappier previews; raise `closeDelay` to give users time to move the pointer into the content without it dismissing.
- **Don't put vital info in the preview.** The preview is inaccessible on touch devices and to some keyboard/assistive-tech users. The `href` on the trigger must always lead to the full content.
- **Use `ContentStatic` to opt out of Floating UI.** If you need fixed/absolute positioning you control entirely (e.g., a preview that should not flip on collision), use `LinkPreview.ContentStatic`. Remember the `Arrow` is built for Floating UI and behaves unpredictably with `ContentStatic`.
- **Anchor to a different element with `customAnchor`.** Pass a selector string or `HTMLElement` to `customAnchor` on `Content` when the trigger and the positioning anchor should differ — for example, when the trigger is a small icon but you want the preview positioned relative to a larger container.
- **Prevent scroll with `preventScroll`.** When `preventScroll` is `true` (the default), the body won't scroll while the preview is open. Disable it if the preview is small and you want the page to remain scrollable.
- **Intercept outside/escape behavior.** Use `onInteractOutside`, `onFocusOutside`, and `onEscapeKeydown` to run custom logic or call `event.preventDefault()` to keep the preview open. Pair with `interactOutsideBehavior` / `escapeKeydownBehavior` for declarative control.
- **Style with `data-state`.** Target `data-[state=open]` and `data-[state=closed]` on the trigger and content for state-driven styling. Use `data-starting-style` and `data-ending-style` to define CSS transition start/end states.
- **Use the CSS variables for animations.** The `--bits-link-preview-content-*` and `--bits-link-preview-anchor-*` variables let you build transform-origin and size-aware animations purely in CSS. They're only populated by the Floating UI `Content` variant.
