# Tooltip

The Bits UI `Tooltip` component displays supplementary information when users hover over or focus on an element. It provides a non-essential "tip" about a "tool" (typically a button), with full accessibility, delay behavior, floating positioning, and detached-trigger (singleton) support.

## Overview

The Tooltip component shows additional information when a user hovers over or focuses a trigger element. It is designed for non-essential content — assume the tooltip may never be read. Tooltips are not supported on mobile devices because there is no hover interaction; if a user touches a button, the button's action fires before they could ever see the tooltip.

### Key Features

- **Accessibility**: ARIA attributes for screen reader compatibility and keyboard navigation.
- **Delay Behavior**: Configurable open delay, with a shared skip-delay grace period across tooltips in the same provider.
- **Hoverable Content**: The tooltip stays open while the user moves the mouse toward and over the content (disablable).
- **Floating UI Positioning**: Content is positioned relative to the trigger with collision detection and flipping.
- **Detached Triggers / Singleton**: A shared `tether` lets one tooltip content instance serve multiple triggers in different parts of the UI.
- **Custom Anchors**: Anchor the content to an element other than the trigger.
- **Transitions**: `forceMount` plus the `child` snippet enables Svelte transitions.

## Component Structure

The Tooltip is composed of the following parts:

- **`Tooltip.Provider`** — Required ancestor of `Tooltip.Root`. Holds shared state (delay, hoverable content, skip-delay) and ensures only one tooltip in its subtree is open at a time.
- **`Tooltip.Root`** — The root component containing the parts of the tooltip. Must be a descendant of a `Tooltip.Provider`.
- **`Tooltip.Trigger`** — The element that triggers opening/closing on hover or focus.
- **`Tooltip.Portal`** — When used, renders the tooltip content into the body (or a custom `to` element) when open.
- **`Tooltip.Content`** — The floating content, positioned by Floating UI.
- **`Tooltip.ContentStatic`** — A static variant that opts out of Floating UI; positioning is entirely up to you.
- **`Tooltip.Arrow`** — An optional arrow pointing to the trigger (works with `Tooltip.Content`, not `ContentStatic`).

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger />
    <Tooltip.Portal>
      <Tooltip.Content>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

## API Reference

### Tooltip.Provider

A provider component which contains shared state and logic for the tooltips within its subtree. It is recommended to wrap your root layout content with the provider, setting sensible defaults there. It also ensures that only a single tooltip within the same provider can be open at a time.

| Property                     | Type                                | Default     | Description                                                                                                                                                       |
| ---------------------------- | ----------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delayDuration`              | `number`                            | `700`       | The amount of time in milliseconds to delay opening the tooltip when hovering over the trigger.                                                                   |
| `disableHoverableContent`    | `boolean`                           | `false`     | Whether or not to disable the hoverable content. Useful when the content contains interactive elements.                                                           |
| `disabled`                   | `boolean`                           | `false`     | Whether or not the tooltip is disabled.                                                                                                                           |
| `disableCloseOnTriggerClick` | `boolean`                           | `false`     | Whether or not to close the tooltip when pressing the escape key. Useful when the content contains interactive elements.                                          |
| `skipDelayDuration`          | `number`                            | `300`       | The amount of time in milliseconds during which, after a tooltip closes, re-entering any trigger opens instantly instead of waiting through the full delay.       |
| `ignoreNonKeyboardFocus`     | `boolean`                           | `false`     | Whether or not to ignore the tooltip when the focus is not on the trigger. Useful when the content contains interactive elements.                                 |
| `children`                   | `Snippet`                           | `undefined` | The children content to render.                                                                                                                                   |

### Tooltip.Root

The root component containing the parts of the tooltip. Must be a descendant of a `Tooltip.Provider` component. In singleton mode, the root children snippet props include `open`, `triggerId`, and `payload`.

| Property                     | Type                                 | Default     | Description                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `open`                       | `boolean`                            | `false`     | The open state of the component. **Bindable** via `bind:open`.                                                                                               |
| `onOpenChange`               | `function` — `(open: boolean) => void` | `undefined` | A callback function called when the open state changes.                                                                                                      |
| `onOpenChangeComplete`       | `function` — `(open: boolean) => void` | `undefined` | A callback function called after the open state changes and all animations have completed.                                                                   |
| `disabled`                   | `boolean`                            | `false`     | Whether or not the tooltip is disabled.                                                                                                                      |
| `delayDuration`              | `number`                             | `700`       | The amount of time in milliseconds to delay opening the tooltip when hovering over the trigger.                                                              |
| `disableHoverableContent`    | `boolean`                            | `false`     | Whether or not to disable the hoverable content. Useful when the content contains interactive elements.                                                      |
| `disableCloseOnTriggerClick` | `boolean`                            | `false`     | Whether or not to close the tooltip when pressing the escape key. Useful when the content contains interactive elements.                                     |
| `ignoreNonKeyboardFocus`     | `boolean`                            | `false`     | Whether or not to ignore the tooltip when the focus is not on the trigger. Useful when the content contains interactive elements.                            |
| `triggerId`                  | `string \| null`                     | `null`      | The active trigger id for controlled singleton tooltips. Useful with `bind:triggerId` and programmatic open behavior. **Bindable** via `bind:triggerId`.     |
| `tether`                     | `TooltipTether<any>`                 | `undefined` | A shared tether object created by `Tooltip.createTether()` used to connect detached triggers and infer root snippet payload types.                           |
| `children`                   | `Snippet`                            | `undefined` | The children content to render. In singleton mode, snippet props include `open`, `triggerId`, and `payload`.                                                 |

### Tooltip.Trigger

A component which triggers the opening and closing of the tooltip on hover or focus.

| Property    | Type                                                                  | Default     | Description                                                                                                                                                |
| ----------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disabled`  | `boolean`                                                             | `false`     | Whether or not the tooltip trigger is disabled.                                                                                                            |
| `payload`   | `Payload`                                                             | `undefined` | Payload associated with this trigger. The active payload is available from the `Tooltip.Root` children snippet props.                                      |
| `tether`    | `TooltipTether<any>`                                                  | `undefined` | A shared tether object created by `Tooltip.createTether()` used to connect detached triggers and infer root snippet payload types.                         |
| `ref`       | `HTMLButtonElement`                                                   | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`.                                    |
| `children`  | `Snippet`                                                             | `undefined` | The children content to render.                                                                                                                            |
| `child`     | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |

### Tooltip.Content

The contents of the tooltip which are displayed when the tooltip is open. Positioned by Floating UI.

| Property                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Default       | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `side`                    | `'top' \| 'bottom' \| 'left' \| 'right'`                                                                                                                                                                                                                                                                                                                                                                                                                | `'bottom'`    | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur.                                                                                                                                                                                                                                                                                                           |
| `sideOffset`              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                | `0`           | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                                                                                      |
| `align`                   | `'start' \| 'center' \| 'end'`                                                                                                                                                                                                                                                                                                                                                                                                                          | `'start'`     | The preferred alignment of the anchor to render the floating element against when open. This may change when collisions occur.                                                                                                                                                                                                                                                                                                       |
| `alignOffset`             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                | `0`           | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                                                                                      |
| `arrowPadding`            | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                                                                                |
| `avoidCollisions`         | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `true`        | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges.                                                                                                                                                                                                                                                                                                                                |
| `collisionBoundary`       | `Element \| null`                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`   | A boundary element or array of elements to check for collisions against.                                                                                                                                                                                                                                                                                                                                                            |
| `collisionPadding`        | `number \| Partial<Record<Side, number>>`                                                                                                                                                                                                                                                                                                                                                                                                               | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                                                                                |
| `sticky`                  | `'partial' \| 'always'`                                                                                                                                                                                                                                                                                                                                                                                                                                 | `'partial'`   | The sticky behavior on the align axis. `'partial'` keeps the content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps the content in the boundary regardless.                                                                                                                                                                                                                          |
| `hideWhenDetached`        | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `true`        | When `true`, hides the content when it is detached from the DOM. Useful for hiding the content when the user scrolls away.                                                                                                                                                                                                                                                                                                           |
| `updatePositionStrategy`  | `'optimized' \| 'always'`                                                                                                                                                                                                                                                                                                                                                                                                                               | `'optimized'` | The strategy to use when updating the position of the content. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes.                                                                                                                                                                                                                                             |
| `strategy`                | `'fixed' \| 'absolute'`                                                                                                                                                                                                                                                                                                                                                                                                                                 | `'fixed'`     | The positioning strategy to use for the floating element. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor.                                                                                                                                                                                                                                                          |
| `preventScroll`           | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `true`        | When `true`, prevents the body from scrolling when the content is open.                                                                                                                                                                                                                                                                                                                                                              |
| `customAnchor`            | `string \| HTMLElement \| Measurable \| null`                                                                                                                                                                                                                                                                                                                                                                                                           | `null`        | Use an element other than the trigger to anchor the content to. If provided, the content will be anchored to the provided element instead of the trigger.                                                                                                                                                                                                                                                                            |
| `onInteractOutside`       | `function` — `(event: PointerEvent) => void`                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`   | Callback fired when an outside interaction event occurs (a `pointerdown` event). Call `event.preventDefault()` to prevent the default behavior of handling the outside interaction.                                                                                                                                                                                                                                                  |
| `onFocusOutside`          | `function` — `(event: FocusEvent) => void`                                                                                                                                                                                                                                                                                                                                                                                                              | `undefined`   | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior on focus leaving the layer.                                                                                                                                                                                                                                                                                    |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                                                                                                                                                                                                                                                                                                                                                                           | `'close'`     | The behavior to use when an interaction occurs outside of the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores.                                                                                                          |
| `onEscapeKeydown`         | `function` — `(event: KeyboardEvent) => void`                                                                                                                                                                                                                                                                                                                                                                                                           | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event.                                                                                                                                                                                                                                                      |
| `escapeKeydownBehavior`   | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                                                                                                                                                                                                                                                                                                                                                                           | `'close'`     | The behavior to use when an escape keydown event occurs in the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores.                                                                                                         |
| `forceMount`              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `false`       | Whether or not to forcefully mount the content. Useful for Svelte transitions or another animation library that requires more control.                                                                                                                                                                                                                                                                                               |
| `dir`                     | `'ltr' \| 'rtl'`                                                                                                                                                                                                                                                                                                                                                                                                                                       | `'ltr'`       | The reading direction of the app.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ref`                     | `HTMLDivElement`                                                                                                                                                                                                                                                                                                                                                                                                                                        | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`.                                                                                                                                                                                                                                                                                                              |
| `children`                | `Snippet`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `undefined`   | The children content to render.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `child`                   | `Snippet` — `type ChildSnippetProps = { wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean }`                                                                                                                                                                                                                                                                                                                        | `undefined`   | Use render delegation to render your own element. `wrapperProps` are for the positioning wrapper (do not style). `props` are for your content element (apply custom styles here). `open` is the content visibility state — use it for conditional rendering with Svelte transitions. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### Tooltip.ContentStatic

The contents of the tooltip displayed when open, without Floating UI. Positioning is entirely up to you. The `Tooltip.Arrow` component will not be rendered relative to it — it is designed for use with `Tooltip.Content`.

| Property                  | Type                                                                                      | Default       | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onInteractOutside`       | `function` — `(event: PointerEvent) => void`                                              | `undefined`   | Callback fired when an outside interaction event occurs (a `pointerdown` event). Call `event.preventDefault()` to prevent the default behavior of handling the outside interaction.                                                                                                                                                                                                                                                  |
| `onFocusOutside`          | `function` — `(event: FocusEvent) => void`                                                | `undefined`   | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior on focus leaving the layer.                                                                                                                                                                                                                                                                                    |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`              | `'close'`     | The behavior to use when an interaction occurs outside of the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores.                                                                                                          |
| `onEscapeKeydown`         | `function` — `(event: KeyboardEvent) => void`                                             | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event.                                                                                                                                                                                                                                                      |
| `escapeKeydownBehavior`   | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`              | `'close'`     | The behavior to use when an escape keydown event occurs in the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores.                                                                                                         |
| `forceMount`              | `boolean`                                                                                 | `false`       | Whether or not to forcefully mount the content. Useful for Svelte transitions or another animation library.                                                                                                                                                                                                                                                                                                                          |
| `dir`                     | `'ltr' \| 'rtl'`                                                                         | `'ltr'`       | The reading direction of the app.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ref`                     | `HTMLDivElement`                                                                          | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`.                                                                                                                                                                                                                                                                                                              |
| `children`                | `Snippet`                                                                                 | `undefined`   | The children content to render.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `child`                   | `Snippet` — `type ChildSnippetProps = { open: boolean; props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. The `open` argument exposes the current open state. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                                                                                                                                                                                                         |

### Tooltip.Arrow

An optional arrow element which points to the trigger when the tooltip is open.

| Property    | Type                                                                  | Default     | Description                                                                                                                                   |
| ----------- | --------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`     | `number`                                                              | `8`         | The width of the arrow in pixels.                                                                                                             |
| `height`    | `number`                                                              | `8`         | The height of the arrow in pixels.                                                                                                            |
| `ref`       | `HTMLDivElement`                                                      | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`.                       |
| `children`  | `Snippet`                                                             | `undefined` | The children content to render.                                                                                                               |
| `child`     | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.       |

### Tooltip.Portal

When used, renders the tooltip content into the body or a custom `to` element when open.

| Property    | Type                       | Default         | Description                                                                                                                      |
| ----------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `to`        | `Element \| string`        | `document.body` | Where to render the content when it is open. Defaults to the body.                                                               |
| `disabled`  | `boolean`                  | `false`         | Whether the portal is disabled or not. When disabled, the content will be rendered in its original DOM location.                |
| `children`  | `Snippet`                  | `undefined`     | The children content to render.                                                                                                  |

## Data Attributes

### Tooltip.Trigger

| Data Attribute          | Value                                        | Description                                                                                                                                                                                |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data-state`            | `'delayed-open' \| 'instant-open' \| 'closed'` | Whether/how the tooltip is open or closed. When open, if there is a delay, the value will be `'delayed-open'`, otherwise `'instant-open'`. When closed, the value will be `'closed'`.     |
| `data-tooltip-trigger`  | `''`                                         | Present on the tooltip trigger element.                                                                                                                                                    |

### Tooltip.Content

| Data Attribute          | Value                                        | Description                                                                                        |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `data-state`            | `'delayed-open' \| 'instant-open' \| 'closed'` | Whether/how the tooltip is open or closed.                                                         |
| `data-starting-style`   | `''`                                         | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style`     | `''`                                         | Present while closing before unmount. Use this to define the ending styles for CSS transitions.    |
| `data-tooltip-content`  | `''`                                         | Present on the tooltip content element.                                                            |

### Tooltip.ContentStatic

| Data Attribute          | Value                                        | Description                                                                                        |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `data-state`            | `'delayed-open' \| 'instant-open' \| 'closed'` | Whether/how the tooltip is open or closed.                                                         |
| `data-starting-style`   | `''`                                         | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style`     | `''`                                         | Present while closing before unmount. Use this to define the ending styles for CSS transitions.    |
| `data-tooltip-content`  | `''`                                         | Present on the tooltip content element.                                                            |

### Tooltip.Arrow

| Data Attribute         | Value                                       | Description                                   |
| ---------------------- | ------------------------------------------- | --------------------------------------------- |
| `data-arrow`           | `''`                                        | Present on the arrow element.                 |
| `data-tooltip-arrow`   | `''`                                        | Present on the arrow element.                 |
| `data-side`            | `'top' \| 'right' \| 'bottom' \| 'left'`    | The side of the tooltip that the arrow is on. |

## CSS Variables

These CSS variables are exposed by `Tooltip.Content` and can be used to drive CSS-based animations and positioning-aware styling.

| CSS Variable                              | Description                                  |
| ----------------------------------------- | -------------------------------------------- |
| `--bits-tooltip-content-transform-origin` | The transform origin of the content element. |
| `--bits-tooltip-content-available-width`  | The available width of the content element.  |
| `--bits-tooltip-content-available-height` | The available height of the content element. |
| `--bits-tooltip-anchor-width`             | The width of the anchor element.             |
| `--bits-tooltip-anchor-height`            | The height of the anchor element.            |

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import MagicWand from "phosphor-svelte/lib/MagicWand";
</script>

<Tooltip.Provider>
  <Tooltip.Root delayDuration={200}>
    <Tooltip.Trigger
      class="inline-flex size-10 items-center justify-center rounded-full border border-border-input bg-background-alt shadow-btn transition-all hover:bg-muted focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden"
    >
      <MagicWand class="size-5" />
    </Tooltip.Trigger>
    <Tooltip.Content
      sideOffset={8}
      class="origin-(--bits-tooltip-content-transform-origin) animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    >
      <div
        class="z-0 flex items-center justify-center rounded-input border border-dark-10 bg-background p-3 text-sm font-medium shadow-popover outline-hidden"
      >
        Make some magic!
      </div>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Controlled (Two-Way Binding)

Use `bind:open` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";

  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Tooltip</button>

<Tooltip.Provider>
  <Tooltip.Root bind:open={isOpen}>
    <Tooltip.Trigger>Hover or focus me</Tooltip.Trigger>
    <Tooltip.Content>
      This tooltip's open state is driven by the external `isOpen` state.
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Fully Controlled (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes:

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";

  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }

  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<Tooltip.Provider>
  <Tooltip.Root bind:open={getOpen, setOpen}>
    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
    <Tooltip.Content>State reads and writes are fully intercepted.</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### With Child Snippet (Render Delegation)

The `child` snippet enables render delegation — you render your own element while the component forwards its props. For `Tooltip.Content`, the `child` snippet also exposes `wrapperProps` (the positioning wrapper — do not style) and the `open` state.

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <button {...props} class="my-trigger">Hover me</button>
      {/snippet}
    </Tooltip.Trigger>

    <Tooltip.Content>
      {#snippet child({ wrapperProps, props, open })}
        <div {...wrapperProps}>
          <div {...props} class="my-content">
            Content is {open ? "open" : "closed"}
          </div>
        </div>
      {/snippet}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### With Svelte Transitions (forceMount)

Combine `forceMount` with the `child` snippet to use Svelte transitions. `forceMount` keeps the content in the DOM, the `child` snippet exposes the `open` state, and an `{#if open}` block gates visibility so the transition fires.

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
    <Tooltip.Content forceMount>
      {#snippet child({ wrapperProps, props, open })}
        {#if open}
          <div {...wrapperProps}>
            <div {...props} transition:fly={{ duration: 300 }}>
              <p>Flying content in and out.</p>
            </div>
          </div>
        {/if}
      {/snippet}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### forceMount with Singleton (Detached Triggers)

The `forceMount` transition pattern combines with singleton triggers. A shared `tether` connects multiple triggers to one `Tooltip.Root`, and the active trigger's `payload` is available from the root children snippet.

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import { fly } from "svelte/transition";

  type PlanPayload = {
    name: string;
    description: string;
  };

  const planTether = Tooltip.createTether<PlanPayload>();

  const plans = [
    { id: "starter", label: "Starter", payload: { name: "Starter plan", description: "Great for small teams shipping one project." } },
    { id: "growth", label: "Growth", payload: { name: "Growth plan", description: "Adds feature flags and role permissions." } },
  ];
</script>

<Tooltip.Provider delayDuration={200}>
  <Tooltip.Root tether={planTether}>
    {#snippet children({ payload })}
      <div class="flex items-center gap-1">
        {#each plans as plan (plan.id)}
          <Tooltip.Trigger tether={planTether} payload={plan.payload}>
            {plan.label}
          </Tooltip.Trigger>
        {/each}
      </div>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={8} forceMount>
          {#snippet child({ wrapperProps, props, open })}
            {#if open}
              <div {...wrapperProps}>
                <div {...props} transition:fly={{ y: 8, duration: 180 }}>
                  <p>{payload?.name}</p>
                  <p>{payload?.description}</p>
                </div>
              </div>
            {/if}
          {/snippet}
        </Tooltip.Content>
      </Tooltip.Portal>
    {/snippet}
  </Tooltip.Root>
</Tooltip.Provider>
```

### Detached Triggers (Singleton Tooltip with Payload)

Use a shared tether when triggers and the tooltip root are not colocated. A single tooltip can be reused by multiple triggers; the active trigger payload is available from `Tooltip.Root` snippet props.

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";

  const actionsTether = Tooltip.createTether<{
    label: string;
    description: string;
    shortcut: string;
  }>();
</script>

<Tooltip.Provider>
  <!-- Triggers can live anywhere within the Provider -->
  <Tooltip.Trigger
    tether={actionsTether}
    payload={{
      label: "Sync now",
      description: "Refreshes every connected source and recalculates all metrics.",
      shortcut: "S",
    }}
  >
    Sync now
  </Tooltip.Trigger>

  <!-- A single Root serves all tethered triggers -->
  <Tooltip.Root tether={actionsTether}>
    {#snippet children({ payload })}
      <Tooltip.Portal>
        <Tooltip.Content>
          <p>{payload?.label}</p>
          <p>{payload?.description}</p>
          <kbd>{payload?.shortcut}</kbd>
        </Tooltip.Content>
      </Tooltip.Portal>
    {/snippet}
  </Tooltip.Root>
</Tooltip.Provider>
```

### Controlled Active Trigger (Singleton)

In controlled mode, bind both `open` and `triggerId` to open a specific trigger programmatically — useful for guided onboarding flows:

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";

  const setupTether = Tooltip.createTether<{
    title: string;
    description: string;
  }>();

  let open = $state(false);
  let triggerId = $state<string | null>(null);

  function openStep(id: string) {
    triggerId = id;
    open = true;
  }
</script>

<button onclick={() => openStep("setup-members")}>Show members tip</button>

<Tooltip.Provider delayDuration={200}>
  <Tooltip.Trigger
    id="setup-members"
    tether={setupTether}
    payload={{ title: "Invite members", description: "Add collaborators now." }}
  >
    Members
  </Tooltip.Trigger>

  <Tooltip.Root tether={setupTether} bind:open bind:triggerId>
    {#snippet children({ payload })}
      <Tooltip.Portal>
        <Tooltip.Content>
          <p>{payload?.title}</p>
          <p>{payload?.description}</p>
        </Tooltip.Content>
      </Tooltip.Portal>
    {/snippet}
  </Tooltip.Root>
</Tooltip.Provider>
```

### Skip Delay Duration (Toolbar)

When multiple tooltips share a `Tooltip.Provider`, set `skipDelayDuration` so moving quickly between triggers opens subsequent tooltips instantly:

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import TextB from "phosphor-svelte/lib/TextB";
  import TextItalic from "phosphor-svelte/lib/TextItalic";

  const tools = [
    { icon: TextB, label: "Bold", shortcut: "⌘B" },
    { icon: TextItalic, label: "Italic", shortcut: "⌘I" },
  ];
</script>

<Tooltip.Provider delayDuration={600} skipDelayDuration={200}>
  <div class="inline-flex items-center gap-0.5 border p-1">
    {#each tools as tool (tool.label)}
      <Tooltip.Root>
        <Tooltip.Trigger class="inline-flex size-8 items-center justify-center">
          <tool.icon class="size-4" weight="bold" />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={8}>
            <div class="flex items-center gap-2 border px-2.5 py-1.5">
              <span class="text-sm font-medium">{tool.label}</span>
              <kbd class="font-mono text-[11px]">{tool.shortcut}</kbd>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    {/each}
  </div>
</Tooltip.Provider>
```

### Custom Anchor

Anchor the content to an element other than the trigger by passing a selector string or an `HTMLElement` to the `customAnchor` prop:

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";

  let customAnchor = $state<HTMLElement | null>(null);
</script>

<div class="rounded-md border p-3" bind:this={customAnchor}>
  Custom Anchor
</div>

<Tooltip.Provider>
  <Tooltip.Root delayDuration={200}>
    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
    <Tooltip.Content sideOffset={8} {customAnchor}>
      Content is positioned relative to the custom anchor, not the trigger.
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Opt-out of Floating UI (ContentStatic)

Use `Tooltip.ContentStatic` to opt out of Floating UI positioning. Positioning is entirely up to you. The `Tooltip.Arrow` component will not render relative to `ContentStatic`.

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>Hello</Tooltip.Trigger>
    <Tooltip.ContentStatic>
      Positioned however you like.
    </Tooltip.ContentStatic>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Reusable Tooltip Wrapper

Build a custom tooltip component to use throughout your application. Ensure a `Tooltip.Provider` wraps your root layout content.

**MyTooltip.svelte**

```svelte
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import { type Snippet } from "svelte";

  type Props = Tooltip.RootProps & {
    trigger: Snippet;
    triggerProps?: Tooltip.TriggerProps;
  };

  let {
    open = $bindable(false),
    children,
    trigger,
    triggerProps = {},
    ...restProps
  }: Props = $props();
</script>

<!--
  Ensure you have a `Tooltip.Provider` component wrapping
  your root layout content.
-->
<Tooltip.Root bind:open {...restProps}>
  <Tooltip.Trigger {...triggerProps}>
    {@render trigger()}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content>
      <Tooltip.Arrow />
      {@render children?.()}
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
```

Usage:

```svelte
<script lang="ts">
  import MyTooltip from "$lib/components/MyTooltip.svelte";
  import BoldIcon from "some-icon-library";
</script>

<MyTooltip triggerProps={{ onclick: () => alert("changed to bold!") }}>
  {#snippet trigger()}
    <BoldIcon />
  {/snippet}
  Change font to bold
</MyTooltip>
```

## Accessibility

### Keyboard Navigation

- **`Tab`** — Moving focus onto the trigger opens the tooltip (after the delay duration). Moving focus away closes it.
- **`Escape`** — Closes the tooltip when focus is within the content. The `escapeKeydownBehavior` prop controls this (`'close'` by default).
- **`Enter` / click on trigger** — By default, clicking the trigger closes the tooltip. Disable with `disableCloseOnTriggerClick`.

### ARIA

The trigger and content are linked via ARIA attributes so screen readers announce the tooltip content as a description of the trigger. The component manages `aria-describedby` (or equivalent) wiring automatically.

### Delay Behavior

Tooltips open after a `delayDuration` (default `700`ms) on hover, and instantly on keyboard focus. Within a `Tooltip.Provider`, the `skipDelayDuration` (default `300`ms) grace period lets users scan across multiple triggers without re-waiting the full delay each time.

### Focus Considerations

- Set `ignoreNonKeyboardFocus` to `true` to prevent the tooltip from opening when the trigger receives focus from a non-keyboard source (e.g., a mouse click). This is useful when the content contains interactive elements.
- Set `disableHoverableContent` to `true` if you want the tooltip to close as the user moves the mouse toward the content, rather than staying open while hovering the content.

### Mobile Devices

Tooltips are not supported on mobile devices. There is no hover on mobile, so pressing a button fires its action before the user could see the tooltip. If you are using a tooltip on a button without an action, consider using a [Popover](https://bits-ui.com/docs/components/popover) instead. Tooltip content should always be non-essential — assume it may never be read.

## Tips

- **Always wrap your app in `Tooltip.Provider`.** Place it in your root `+layout.svelte` around `{@render children()}`. It sets shared defaults (`delayDuration`, `disableHoverableContent`, `skipDelayDuration`) and ensures only one tooltip is open at a time. Without a provider, `Tooltip.Root` will not function.
- **Set sensible defaults on the provider.** Set `delayDuration` and `skipDelayDuration` once on the provider rather than repeating them on every `Tooltip.Root`. Individual `Tooltip.Root` props override the provider defaults.
- **Use `skipDelayDuration` for groups of tooltips.** For toolbars, nav bars, or any cluster of tooltip triggers, set a `skipDelayDuration` so the first tooltip opens after the delay and subsequent ones open instantly as the user scans across.
- **Wrap floating content in a styled inner element.** `Tooltip.Content` applies positioning, collision, and animation. Place your visual styling (border, background, padding, shadow) on a child `<div>` inside `Content`, not directly on `Content`. This keeps positioning and transform-origin working correctly and is the pattern used in the official examples.
- **Use `origin-(--bits-tooltip-content-transform-origin)` for animation origin.** The `--bits-tooltip-content-transform-origin` CSS variable is set by Floating UI to match the placement side/align. Apply it as the `transform-origin` so zoom/slide animations originate from the correct edge.
- **Combine `forceMount` with `child` for Svelte transitions.** Bits UI's mount/unmount behavior conflicts with Svelte's `transition:` directive. Setting `forceMount` keeps the node in the DOM, and the `child` snippet's `open` argument lets you gate visibility with `{#if open}` so the transition can run. Wrap the transitioned element inside `wrapperProps` (the positioning wrapper) — do not style the wrapper.
- **Use tethers for detached triggers.** When triggers and tooltip content are not colocated (e.g., toolbar actions in different regions), create a tether with `Tooltip.createTether<Payload>()`, pass it to both `Tooltip.Trigger` (with a `payload`) and `Tooltip.Root`. The active payload is available from the root children snippet props. This avoids duplicating tooltip content instances.
- **Control the active trigger programmatically.** In singleton mode, bind both `open` and `triggerId` to open a specific trigger by its `id` — useful for guided onboarding or programmatic tours.
- **Use `customAnchor` to position relative to another element.** Pass a selector string or an `HTMLElement` to anchor the content to something other than the trigger.
- **Opt out of Floating UI with `ContentStatic`.** If you need full manual control over positioning, use `Tooltip.ContentStatic`. Note that `Tooltip.Arrow` will not work with it.
- **Disable close-on-click when content is interactive.** Set `disableCloseOnTriggerClick` on `Tooltip.Root` (or `Provider`) so clicking the trigger does not close the tooltip — useful when the content contains interactive elements.
- **Prefer reusable wrappers.** Build a `MyTooltip` component (see examples) that encapsulates your styling, arrow, and portal. This keeps usage sites clean and makes global changes a one-line edit.
- **Keep content non-essential.** Tooltips are for tips, not critical information. If the content must be seen, use a Popover or Dialog instead.
- **Forward extra props.** All parts pass through additional HTML attributes to their underlying elements, so you can use `class`, `style`, `aria-*`, `id`, etc. directly.
