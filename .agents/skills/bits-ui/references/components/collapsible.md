# Collapsible

The Bits UI `Collapsible` component conceals or reveals content sections. It provides an expandable/collapsible interface for managing space and organizing information, with full accessibility, transition support, and flexible state management.

## Overview

The Collapsible component enables you to create expandable and collapsible content sections. It provides an efficient way to manage space and organize information in user interfaces, enabling users to show or hide content as needed.

### Key Features

- **Accessibility**: ARIA attributes for screen reader compatibility and keyboard navigation.
- **Transition Support**: CSS variables and data attributes for smooth transitions between states.
- **Flexible State Management**: Supports controlled and uncontrolled state; take control if needed.
- **Compound Component Structure**: A set of sub-components that work together to create a fully-featured collapsible.
- **Hidden Until Found**: Support for the `hidden="until-found"` attribute for browser search integration.

## Component Structure

The Collapsible is composed of three sub-components, each with a specific role:

- **`Collapsible.Root`** — The parent container that manages the state and context for the collapsible functionality.
- **`Collapsible.Trigger`** — The interactive element (button) that toggles the expanded/collapsed state of the content.
- **`Collapsible.Content`** — The container for the content that will be shown or hidden based on the collapsible state.

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";
</script>

<Collapsible.Root>
  <Collapsible.Trigger />
  <Collapsible.Content />
</Collapsible.Root>
```

## API Reference

### Collapsible.Root

The root collapsible container which manages the state of the collapsible.

| Property               | Type                                                       | Default     | Description                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `open`                 | `boolean`                                                  | `false`     | The open state of the collapsible. The content will be visible when this is `true`, and hidden when it's `false`. **Bindable** via `bind:open`.              |
| `onOpenChange`         | `function` — `(open: boolean) => void`                     | `undefined` | A callback function called when the open state changes.                                                                                                      |
| `onOpenChangeComplete` | `function` — `(open: boolean) => void`                     | `undefined` | A callback function called after the open state changes and all animations have completed.                                                                   |
| `disabled`             | `boolean`                                                  | `false`     | Whether or not the collapsible is disabled. This prevents the user from interacting with it.                                                                 |
| `ref`                  | `HTMLDivElement`                                           | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`.                                      |
| `children`             | `Snippet`                                                  | `undefined` | The children content to render.                                                                                                                              |
| `child`                | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                      |

### Collapsible.Trigger

The button responsible for toggling the collapsible's open state.

| Property   | Type                                                       | Default     | Description                                                                                                                             |
| ---------- | ---------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLButtonElement`                                        | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`.                 |
| `children` | `Snippet`                                                  | `undefined` | The children content to render.                                                                                                         |
| `child`    | `Snippet` — `type SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### Collapsible.Content

The content displayed when the collapsible is open.

| Property           | Type                                                                                                              | Default     | Description                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forceMount`       | `boolean`                                                                                                         | `false`     | Whether or not to forcefully mount the content. Useful when you want to use Svelte transitions or another animation library for the content.                                           |
| `hiddenUntilFound` | `boolean`                                                                                                         | `false`     | When `true`, the content will be marked with `hidden="until-found"` when collapsed, allowing browsers to find and automatically expand the content during page searches.              |
| `ref`              | `HTMLDivElement`                                                                                                  | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element. **Bindable** via `bind:ref`.                                                                |
| `children`         | `Snippet`                                                                                                         | `undefined` | The children content to render.                                                                                                                                                        |
| `child`            | `Snippet` — `type SnippetProps = { open: boolean; props: Record<string, unknown> }`                              | `undefined` | Use render delegation to render your own element. The `open` argument exposes the current open state. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more info. |

## Data Attributes

### Collapsible.Root

| Data Attribute          | Value                       | Description                               |
| ----------------------- | --------------------------- | ----------------------------------------- |
| `data-state`            | `'open' \| 'closed'`        | The collapsible's open state.             |
| `data-disabled`         | `''`                        | Present when the collapsible is disabled. |
| `data-collapsible-root` | `''`                        | Present on the root element.              |

### Collapsible.Trigger

| Data Attribute             | Value                       | Description                                               |
| -------------------------- | --------------------------- | --------------------------------------------------------- |
| `data-state`               | `'open' \| 'closed'`        | The collapsible's open state.                             |
| `data-disabled`            | `''`                        | Present when the collapsible or this trigger is disabled. |
| `data-collapsible-trigger` | `''`                        | Present on the trigger element.                           |

### Collapsible.Content

| Data Attribute             | Value                       | Description                                                                                        |
| -------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| `data-state`               | `'open' \| 'closed'`        | The collapsible's open state.                                                                      |
| `data-disabled`            | `''`                        | Present when the collapsible is disabled.                                                          |
| `data-starting-style`      | `''`                        | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style`        | `''`                        | Present while closing before unmount. Use this to define the ending styles for CSS transitions.    |
| `data-collapsible-content` | `''`                        | Present on the content element.                                                                    |

## CSS Variables

These CSS variables are exposed by `Collapsible.Content` and can be used to drive CSS-based animations and transitions.

| CSS Variable                        | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `--bits-collapsible-content-height` | The height of the collapsible content element. |
| `--bits-collapsible-content-width`  | The width of the collapsible content element.  |

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";
</script>

<Collapsible.Root class="w-[327px] space-y-3">
  <div class="flex items-center justify-between space-x-10">
    <h4 class="text-[15px] font-medium">@huntabyte starred 3 repositories</h4>
    <Collapsible.Trigger
      class="inline-flex h-10 w-10 items-center justify-center rounded-9px border border-border-input bg-background-alt text-foreground shadow-btn transition-all hover:bg-muted active:scale-[0.98]"
      aria-label="Show starred repositories"
    >
      Toggle
    </Collapsible.Trigger>
  </div>
  <Collapsible.Content
    class="space-y-2 overflow-hidden font-mono text-[15px] tracking-[0.01em] data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
  >
    <div class="inline-flex h-12 w-full items-center rounded-9px bg-muted px-[18px] py-3">
      @huntabyte/bits-ui
    </div>
    <div class="inline-flex h-12 w-full items-center rounded-9px bg-muted px-[18px] py-3">
      @huntabyte/shadcn-svelte
    </div>
    <div class="inline-flex h-12 w-full items-center rounded-9px bg-muted px-[18px] py-3">
      @svecosystem/runed
    </div>
  </Collapsible.Content>
</Collapsible.Root>
```

### Controlled (Two-Way Binding)

Use `bind:open` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";

  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Collapsible</button>

<Collapsible.Root bind:open={isOpen}>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>
    <p>This content's visibility is driven by the external `isOpen` state.</p>
  </Collapsible.Content>
</Collapsible.Root>
```

### Fully Controlled (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes:

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";

  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }

  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<Collapsible.Root bind:open={getOpen, setOpen}>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>
    <p>State reads and writes are fully intercepted.</p>
  </Collapsible.Content>
</Collapsible.Root>
```

### With Child Snippet (Render Delegation)

The `child` snippet enables render delegation — you render your own element while the component forwards its props and (for `Content`) the open state.

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";
</script>

<Collapsible.Root>
  <Collapsible.Trigger>
    {#snippet child({ props })}
      <button {...props} class="my-trigger">Toggle</button>
    {/snippet}
  </Collapsible.Trigger>

  <Collapsible.Content>
    {#snippet child({ props, open })}
      <div {...props} class="my-content">
        Content is {open ? "open" : "closed"}
      </div>
    {/snippet}
  </Collapsible.Content>
</Collapsible.Root>
```

### With Svelte Transitions

To apply Svelte transitions, combine `forceMount` with the `child` snippet. `forceMount` keeps the content in the DOM, the `child` snippet exposes the `open` state, and an `{#if open}` block gates visibility so the transition fires.

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";
  import { fade } from "svelte/transition";
</script>

<Collapsible.Root>
  <Collapsible.Trigger>Open</Collapsible.Trigger>
  <Collapsible.Content forceMount>
    {#snippet child({ props, open })}
      {#if open}
        <div {...props} transition:fade>
          <p>Fading content in and out.</p>
        </div>
      {/if}
    {/snippet}
  </Collapsible.Content>
</Collapsible.Root>
```

### Reusable Transition Component

Encapsulate the transition logic in a reusable component for cleaner code and maintainability:

**MyCollapsibleContent.svelte**

```svelte
<script lang="ts">
  import { Collapsible, type WithoutChildrenOrChild } from "bits-ui";
  import { fade } from "svelte/transition";
  import type { Snippet } from "svelte";

  let {
    ref = $bindable(null),
    duration = 200,
    children,
    ...restProps
  }: WithoutChildrenOrChild<Collapsible.ContentProps> & {
    duration?: number;
    children?: Snippet;
  } = $props();
</script>

<Collapsible.Content forceMount bind:ref {...restProps}>
  {#snippet child({ props, open })}
    {#if open}
      <div {...props} transition:fade={{ duration }}>
        {@render children?.()}
      </div>
    {/if}
  {/snippet}
</Collapsible.Content>
```

Usage:

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";
  import { MyCollapsibleContent } from "$lib/components";
</script>

<Collapsible.Root>
  <Collapsible.Trigger>Open</Collapsible.Trigger>
  <MyCollapsibleContent duration={300}>
    <p>Content with a configurable fade duration.</p>
  </MyCollapsibleContent>
</Collapsible.Root>
```

### Reusable Collapsible Wrapper

Create a custom collapsible component to use throughout your application:

**MyCollapsible.svelte**

```svelte
<script lang="ts">
  import { Collapsible, type WithoutChild } from "bits-ui";

  type Props = WithoutChild<Collapsible.RootProps> & {
    buttonText: string;
  };

  let {
    open = $bindable(false),
    ref = $bindable(null),
    buttonText,
    children,
    ...restProps
  }: Props = $props();
</script>

<Collapsible.Root bind:open bind:ref {...restProps}>
  <Collapsible.Trigger>{buttonText}</Collapsible.Trigger>
  <Collapsible.Content>
    {@render children?.()}
  </Collapsible.Content>
</Collapsible.Root>
```

Usage:

```svelte
<script lang="ts">
  import MyCollapsible from "$lib/components/MyCollapsible.svelte";
</script>

<MyCollapsible buttonText="Open Collapsible">
  Here is my collapsible content.
</MyCollapsible>
```

### Hidden Until Found

The `hiddenUntilFound` prop enables integration with the browser's find-in-page functionality. When enabled, the collapsible content is marked with `hidden="until-found"`, which allows browsers to automatically expand collapsed content when users search for text within it.

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";
</script>

<Collapsible.Root>
  <Collapsible.Trigger>Show More Details</Collapsible.Trigger>
  <Collapsible.Content hiddenUntilFound={true}>
    <p>
      This content will be automatically revealed when users search for text
      within it using Ctrl+F (Cmd+F on Mac).
    </p>
    <p>
      For example, try searching for "automatically revealed" on this page.
    </p>
  </Collapsible.Content>
</Collapsible.Root>
```

## Tips

- **Prefer reusable wrappers.** Instead of using the primitives directly everywhere, build a `MyCollapsible` component (see examples) that encapsulates your styling and behavior. This keeps usage sites clean and makes global changes a one-line edit.
- **Use `bind:open` for external triggers.** If you need buttons outside the `Collapsible.Trigger` to affect state (e.g., an "Open all" button), bind `open` to a local `$state` variable and mutate it from anywhere.
- **Use function bindings for full control.** When you need to validate, transform, or side-effect on every read/write of the open state (e.g., logging, persistence, derived state), pass `bind:open={getOpen, setOpen}` instead of a plain binding.
- **Animate with CSS variables.** `--bits-collapsible-content-height` and `--bits-collapsible-content-width` expose the measured content dimensions. Use them in keyframes or transitions for smooth height/width animations without JavaScript measurement.
- **Use `data-starting-style` / `data-ending-style` for CSS transitions.** These attributes are present only during the first frame of opening and the closing frame before unmount. Target them with `@starting-style`-like rules or CSS transitions to animate the enter/exit states.
- **Combine `forceMount` with `child` for Svelte transitions.** Bits UI's mount/unmount behavior conflicts with Svelte's `transition:` directive. Setting `forceMount` keeps the node in the DOM, and the `child` snippet's `open` argument lets you gate visibility with `{#if open}` so the transition can run.
- **Enable `hiddenUntilFound` for searchable content.** If the collapsed content contains text users might search for via Ctrl+F, `hiddenUntilFound` lets the browser auto-expand it on match — improving discoverability without sacrificing the collapsed UI.
- **Disable interaction with `disabled`.** Set `disabled` on `Collapsible.Root` to prevent toggling. This adds `data-disabled` to the root and trigger, which you can target for styling (e.g., reduced opacity, no-pointer cursor).
- **Forward extra props.** `Collapsible.Root`, `Trigger`, and `Content` pass through additional HTML attributes to their underlying elements, so you can use `class`, `style`, `aria-*`, `id`, etc. directly.
