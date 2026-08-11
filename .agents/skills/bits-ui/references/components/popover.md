# Popover

Displays rich content in a floating panel anchored to a trigger element.

## Overview

The Popover component renders arbitrary content inside a floating panel that is positioned relative to an anchor element (by default, the trigger). It is built on top of Floating UI and handles positioning, collisions, focus management, dismiss behavior, and accessibility automatically.

A Popover is appropriate when the user needs to see or interact with supplementary content without leaving the current context — e.g. an inline form, a quick details card, a resize/transform dialog, or a filter menu. Unlike a Tooltip, a Popover can hold interactive elements; unlike a Dialog/Modal, it does not block interaction with the rest of the page by default.

## Component Structure

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger />
  <Popover.Portal>
    <Popover.Overlay />
    <Popover.Content>
      <Popover.Close />
      <Popover.Arrow />
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

| Part | Description |
|------|-------------|
| `Popover.Root` | The root component that manages the open state of the popover. All other parts must be descendants of it. |
| `Popover.Trigger` | A button that toggles the opening and closing of the popover on press. Acts as the default anchor for positioning. |
| `Popover.Portal` | Renders the popover content into the document body (or a custom target) when open. Optional but recommended. |
| `Popover.Overlay` | An optional semi-transparent overlay rendered behind the content when the popover is open. |
| `Popover.Content` | The floating panel content. Positioned by Floating UI relative to the anchor (trigger by default). |
| `Popover.ContentStatic` | A static variant of `Content` that does not use Floating UI. No positioning/collision logic is applied. |
| `Popover.Close` | A button that closes the popover when pressed. Typically placed inside the content. |
| `Popover.Arrow` | An optional arrow element pointing from the content to the trigger/anchor. |

## API Reference

### Popover.Root

The root component used to manage the state of the popover.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` $bindable | `boolean` | `false` | The open state of the component. Use `bind:open` for two-way binding. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Callback called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void` | `undefined` | Callback called after the open state changes and all animations have completed. |
| `children` | `Snippet` | `undefined` | The children content to render. |

**Open state binding patterns:**

```svelte
<!-- Two-way binding (simple) -->
<script lang="ts">
  import { Popover } from "bits-ui";
  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Popover</button>

<Popover.Root bind:open={isOpen}>
  <!-- ... -->
</Popover.Root>
```

```svelte
<!-- Fully controlled via function binding -->
<script lang="ts">
  import { Popover } from "bits-ui";
  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<Popover.Root bind:open={getOpen, setOpen}>
  <!-- ... -->
</Popover.Root>
```

### Popover.Trigger

A component which toggles the opening and closing of the popover on press. It renders a `<button>` element by default and acts as the default anchor for the floating content.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `openOnHover` | `boolean` | `false` | Whether the popover should open when the trigger is hovered. |
| `openDelay` | `number` | `700` | Delay in milliseconds before the popover opens after hovering the trigger. Only applies when `openOnHover` is `true`. |
| `closeDelay` | `number` | `300` | Delay in milliseconds before the popover closes after the mouse leaves the trigger or content. Only applies when `openOnHover` is `true`. |
| `ref` $bindable | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bind to it to get a reference. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` (`{ props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

**Hover behavior notes:**

- **Click while hovering**: If the user clicks the trigger while the popover is open via hover, it converts to "click-opened" mode and will only close via Escape or clicking outside.
- **Interaction inside content**: Clicking or focusing an interactive element inside the content will keep the popover open until explicitly closed.
- **Keyboard**: `openOnHover` does not open on keyboard focus. Keyboard users can still press Enter or Space to open.
- **Touch devices**: Touch events are ignored for hover functionality to prevent conflicts with tap-to-open behavior.
- A "grace area" polygon allows smooth cursor movement between the trigger and content without closing.

### Popover.Content

The floating contents of the popover, displayed when the popover is open. Positioned by Floating UI relative to the anchor (the trigger by default).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | The preferred side of the anchor to render the floating element against when open. Reversed when collisions occur. |
| `sideOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | The preferred alignment of the anchor to render the floating element against when open. May change when collisions occur. |
| `alignOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element along the alignment axis. |
| `arrowPadding` | `number` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which would cause a collision (used for arrow positioning). |
| `avoidCollisions` | `boolean` | `true` | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary` | `Element \| null` | `undefined` | A boundary element or array of elements to check for collisions against. |
| `collisionPadding` | `number \| Partial<Record<Side, number>>` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky` | `'partial' \| 'always'` | `'partial'` | The sticky behavior on the align axis. `'partial'` keeps the content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps the content in the boundary regardless. |
| `hideWhenDetached` | `boolean` | `true` | When `true`, hides the content when it is detached from the DOM (e.g. when the user scrolls away). |
| `updatePositionStrategy` | `'optimized' \| 'always'` | `'optimized'` | When `'optimized'`, the content is repositioned only when the trigger is in the viewport. When `'always'`, the content is repositioned whenever the position changes. |
| `strategy` | `'fixed' \| 'absolute'` | `'fixed'` | The positioning strategy. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll` | `boolean` | `false` | When `true`, prevents the body from scrolling when the content is open. Useful when using the content as a modal. |
| `customAnchor` | `string \| HTMLElement \| Measurable \| null` | `null` | Use an element other than the trigger to anchor the content to. Accepts a CSS selector, an HTMLElement, or a Measurable object. |
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction (`pointerdown`) occurs. Call `event.preventDefault()` to prevent the default close behavior. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | Behavior when an interaction occurs outside the floating content. `'close'` closes immediately; `'ignore'` prevents closing; `'defer-otherwise-close'` defers to a parent layer if present, otherwise closes; `'defer-otherwise-ignore'` defers to a parent layer if present, otherwise ignores. |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an Escape keydown occurs in the floating content. Call `event.preventDefault()` to prevent the default close behavior. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | Behavior when an Escape keydown occurs in the floating content. Same semantics as `interactOutsideBehavior`. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented via `event.preventDefault()`. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing as the content is closed. Can be prevented via `event.preventDefault()`. |
| `trapFocus` | `boolean` | `true` | Whether to trap focus within the content when open. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `forceMount` | `boolean` | `false` | Whether to forcefully mount the content. Useful with Svelte transitions or other animation libraries that require more control. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `ref` $bindable | `HTMLDivElement` | `null` | The underlying DOM element being rendered. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` (`ChildSnippetProps`) | `undefined` | Use render delegation to render your own element. The snippet receives `wrapperProps` (props for the positioning wrapper — do not style), `props` (props for your content element — apply custom styles here), and `open` (content visibility state, for conditional rendering with Svelte transitions). |

### Popover.ContentStatic

A static variant of `Content` that does not use Floating UI. No positioning, collision detection, or anchor logic is applied. Useful when you want to position the content yourself or when the content is placed adjacent to the trigger in normal flow.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction (`pointerdown`) occurs. Call `event.preventDefault()` to prevent the default close behavior. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | Behavior when an interaction occurs outside the content. |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an Escape keydown occurs in the content. Call `event.preventDefault()` to prevent the default close behavior. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | Behavior when an Escape keydown occurs in the content. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing as the content is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether to trap focus within the content when open. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `preventScroll` | `boolean` | `false` | When `true`, prevents the body from scrolling when the content is open. |
| `forceMount` | `boolean` | `false` | Whether to forcefully mount the content. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `ref` $bindable | `HTMLDivElement` | `null` | The underlying DOM element being rendered. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` (`{ props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. |

### Popover.Overlay

An optional overlay rendered behind the popover content when the popover is open. Place it inside `Popover.Portal` alongside the content.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `forceMount` | `boolean` | `false` | Whether to forcefully mount the content. Useful with Svelte transitions or other animation libraries. |
| `ref` $bindable | `HTMLDivElement` | `null` | The underlying DOM element being rendered. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` (`{ props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. |

### Popover.Close

A button which closes the popover when pressed. Typically placed inside the content.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ref` $bindable | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` (`{ props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. |

### Popover.Arrow

An optional arrow element that points to the trigger when the popover is open. Place it inside `Popover.Content`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | `8` | The width of the arrow in pixels. |
| `height` | `number` | `8` | The height of the arrow in pixels. |
| `ref` $bindable | `HTMLDivElement` | `null` | The underlying DOM element being rendered. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` (`{ props: Record<string, unknown> }`) | `undefined` | Use render delegation to render your own element. |

### Popover.Portal

When used, renders the popover content into the document body (or a custom `to` element) when open. Wraps the `Content`/`Overlay` to escape parent stacking/overflow contexts.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `to` | `Element \| string` | `document.body` | Where to render the content when it is open. |
| `disabled` | `boolean` | `false` | Whether the portal is disabled. When disabled, the content will be rendered in its original DOM location. |
| `children` | `Snippet` | `undefined` | The children content to render. |

## Data Attributes

### Popover.Trigger

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-state` | `'open' \| 'closed'` | Whether the popover is open or closed. |
| `data-popover-trigger` | `''` | Present on the trigger element. |

### Popover.Content & Popover.ContentStatic

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-state` | `'open' \| 'closed'` | Whether the popover is open or closed. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-popover-content` | `''` | Present on the content element. |

### Popover.Overlay

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-popover-overlay` | `''` | Present on the overlay element. |
| `data-state` | `'open' \| 'closed'` | Whether the popover is open or closed. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |

### Popover.Close

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-popover-close` | `''` | Present on the close button. |

### Popover.Arrow

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-arrow` | `''` | Present on the arrow element. |
| `data-popover-arrow` | `''` | Present on the arrow element. |

## CSS Variables

These CSS custom properties are exposed on `Popover.Content` (the Floating UI–positioned variant) and can be used for styling, animations, and responsive sizing.

| Variable | Description |
|----------|-------------|
| `--bits-popover-content-transform-origin` | The transform origin of the content element. Use this to anchor scale/slide animations (e.g. `origin-(--bits-popover-content-transform-origin)` in Tailwind). |
| `--bits-popover-content-available-width` | The available width of the content element (constrained by collisions/boundary). |
| `--bits-popover-content-available-height` | The available height of the content element (constrained by collisions/boundary). |
| `--bits-popover-anchor-width` | The width of the anchor element (the trigger or a custom anchor). |
| `--bits-popover-anchor-height` | The height of the anchor element (the trigger or a custom anchor). |

## Examples

### Basic

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      class="z-30 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"
      sideOffset={8}
    >
      <p>Popover content goes here.</p>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### Controlled

Two-way binding with an external button to open the popover:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Popover</button>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content sideOffset={8}>
      <p>Controlled popover.</p>
      <button onclick={() => (isOpen = false)}>Close</button>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

Fully controlled with a function binding for complete control over reads and writes:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<Popover.Root bind:open={getOpen, setOpen}>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content>
      <p>Fully controlled popover.</p>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### With Child Snippet

Use render delegation via the `child` snippet to render your own element while preserving the component's behavior:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content sideOffset={8}>
      {#snippet child({ props })}
        <div {...props} class="rounded-md border bg-background p-4 shadow-md">
          <p>Custom-rendered popover content.</p>
        </div>
      {/snippet}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### With Transitions

Combine `forceMount` with the `child` snippet to use Svelte transitions. The `child` snippet receives `wrapperProps` (for the positioning wrapper — do not style it), `props` (for your content element — apply styles here), and `open` (for conditional rendering):

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content sideOffset={8} forceMount>
      {#snippet child({ wrapperProps, props, open })}
        {#if open}
          <div {...wrapperProps}>
            <div
              {...props}
              transition:fly={{ duration: 300 }}
              class="rounded-md border bg-background p-4 shadow-md"
            >
              <p>Popover with a fly transition.</p>
            </div>
          </div>
        {/if}
      {/snippet}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

Wrap this pattern in a reusable component to keep call sites clean. See the [Transitions](https://bits-ui.com/docs/transitions) documentation for more.

### With Overlay

Render `Popover.Overlay` inside the portal to create a semi-transparent backdrop:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Overlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
    />
    <Popover.Content
      sideOffset={8}
      class="z-50 rounded-md border bg-background p-4 shadow-md"
    >
      <p>Popover with an overlay.</p>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### With Arrow

Add `Popover.Arrow` inside the content to point at the trigger:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content sideOffset={8} class="rounded-md border bg-background p-4 shadow-md">
      <Popover.Arrow />
      <p>Popover with an arrow.</p>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### With Close Button

Place `Popover.Close` inside the content to close the popover:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content sideOffset={8} class="rounded-md border bg-background p-4 shadow-md">
      <div class="flex items-center justify-between gap-4">
        <p>Popover content</p>
        <Popover.Close aria-label="Close">×</Popover.Close>
      </div>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### Open on Hover

Open the popover when the trigger is hovered. The popover auto-closes when the mouse leaves both the trigger and the content, unless the user has interacted with the content. A grace-area polygon allows smooth cursor movement between them:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger openOnHover openDelay={200} closeDelay={100}>
    Hover me
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content sideOffset={8}>
      <p>Opened on hover.</p>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### Custom Anchor

By default, `Content` is anchored to the `Trigger`. Pass a selector string, an `HTMLElement`, or a `Measurable` to `customAnchor` to anchor the content to a different element:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
  let customAnchor = $state<HTMLElement>(null!);
</script>

<div bind:this={customAnchor} class="h-10 w-full rounded-md border bg-muted"></div>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content {customAnchor} sideOffset={8}>
      <p>Anchored to the custom element above.</p>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### Custom Open/Close Focus

Override where focus goes when the popover opens or closes by calling `preventDefault()` on the auto-focus events:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
  let nameInput = $state<HTMLInputElement>();
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      sideOffset={8}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        nameInput?.focus();
      }}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        nameInput?.focus();
      }}
    >
      <input type="text" bind:this={nameInput} placeholder="Name" />
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### Modal-like (Scroll Lock)

Lock body scroll and block interaction with the rest of the page:

```svelte
<script lang="ts">
  import { Popover } from "bits-ui";
</script>

<Popover.Root>
  <Popover.Trigger>Open</Popover.Trigger>
  <Popover.Portal>
    <Popover.Overlay class="fixed inset-0 z-50 bg-black/80" />
    <Popover.Content
      sideOffset={8}
      preventScroll
      class="z-50 rounded-md border bg-background p-4 shadow-md"
    >
      <p>Body scroll is locked while this is open.</p>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

## Accessibility

The Popover is designed to be accessible by default. The following behaviors are built in and can be customized.

### Keyboard Navigation

| Key | Behavior |
|-----|----------|
| `Enter` / `Space` (on Trigger) | Toggles the popover open/closed. |
| `Escape` (in Content) | Closes the popover. Override with `escapeKeydownBehavior` or `onEscapeKeydown`. |
| `Tab` (in Content) | Cycles focus within the content (focus is trapped by default). Override with `trapFocus={false}`. |
| Click outside | Closes the popover. Override with `interactOutsideBehavior` or `onInteractOutside`. |

### Focus Management

- **On open**: Focus moves to the first focusable element inside `Popover.Content`. Override with `onOpenAutoFocus` (call `event.preventDefault()`, then focus a specific element). It is highly recommended to focus something within the content when overriding.
- **On close**: Focus returns to the `Popover.Trigger`. Override with `onCloseAutoFocus` (call `event.preventDefault()`, then focus a specific element).
- **Focus trap**: Enabled by default (`trapFocus={true}`). Set `trapFocus={false}` to disable.

### ARIA

- `Popover.Trigger` renders a `<button>` with `aria-haspopup="dialog"` and `aria-expanded` reflecting the open state.
- `Popover.Content` uses `role="dialog"` and `aria-labelledby`/`aria-describedby` are wired up when appropriate.
- `Popover.Close` renders a `<button>`.
- `data-state` (`'open'` / `'closed'`) on Trigger, Content, and Overlay enables state-based CSS and animations.
- Set `dir="rtl"` on `Content` for right-to-left layouts; positioning and alignment adjust accordingly.

### Hover-Specific Behavior

- `openOnHover` does not open on keyboard focus — keyboard users still use Enter/Space.
- Touch events are ignored for hover functionality to avoid conflicts with tap-to-open.
- Clicking the trigger while hover-open converts to click-opened mode (closes only via Escape or outside click).

## Tips

### Floating content wrapper rules

- **Always place `Content` (and `Overlay`) inside `Portal`** when you need them to escape parent `overflow: hidden`/`auto` containers or stacking contexts. Without a portal, a clipped ancestor can cut off the popover.
- **Do not style the `wrapperProps` element** when using the `child` snippet. The wrapper handles positioning; apply your classes to the element that receives `props`.
- **Use `forceMount` + `child` snippet** for Svelte transitions. Conditionally render with the `open` flag from the snippet's arguments so the content unmounts after the exit transition.
- **Use the `--bits-popover-content-transform-origin` CSS variable** as the `transform-origin` for scale/slide animations so they emanate from the anchor side (e.g. `origin-(--bits-popover-content-transform-origin)`).

### Common patterns

- **Reusable content component**: The `forceMount` + `child` snippet transition pattern is verbose. Wrap it in your own `PopoverContent` component once and reuse it.
- **Custom anchor**: When the trigger and the element you want to point at differ (e.g. an icon button that should anchor to a wrapping container), bind an `HTMLElement` and pass it to `customAnchor`.
- **Modal-like popover**: Combine `preventScroll`, an `Overlay`, and `trapFocus` to make the popover behave like a non-centered modal.
- **Disable outside/escape close selectively**: Use `interactOutsideBehavior="ignore"` and/or `escapeKeydownBehavior="ignore"` when the popover contains a form that should not be dismissed accidentally, or intercept via `onInteractOutside`/`onEscapeKeydown` and call `preventDefault()` conditionally.
- **Collision tuning**: If content flips to an unwanted side, tune `collisionPadding`, `sticky`, `avoidCollisions`, and `hideWhenDetached`. Increase `sideOffset`/`alignOffset` for spacing.
- **Static content**: Use `Popover.ContentStatic` when you do not need Floating UI positioning (e.g. content placed inline next to the trigger) — it still provides focus, dismiss, and escape behavior.
