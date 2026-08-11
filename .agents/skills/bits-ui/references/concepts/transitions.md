# Transitions

Svelte Transitions are one of the awesome features of Svelte. Unfortunately, they don't play nicely with components directly, because they rely on directives like `in:`, `out:`, and `transition:`, which aren't supported by components.

In Bits UI for Svelte 5, instead of exposing `transition*` props, the library exposes `forceMount` and the `child` snippet to let you use any animation or transitions library you want.

## The Defaults

By default, Bits UI components handle the mounting and unmounting of specific components for you. They are wrapped in a component that ensures the component waits for transitions to finish before unmounting.

You can use any CSS transitions or animations with this approach. The example components in the official documentation use [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate).

## Force Mounting

On each component that is conditionally rendered, a `forceMount` prop is exposed. When set to `true`, the component is forced to mount in the DOM. Use this with the `child` snippet to conditionally render the component and apply Svelte Transitions or another animation library.

The `child` snippet exposes an `open` prop for conditional rendering:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<Dialog.Root>
  <!-- ... -->
  <Dialog.Content forceMount>
    {#snippet child({ props, open })}
      {#if open}
        <div {...props} transition:fly>
          <!-- ... -->
        </div>
      {/if}
    {/snippet}
  </Dialog.Content>
</Dialog.Root>
```

How this works:
1. `forceMount` tells the component to stay mounted in the DOM
2. The `child` snippet's `open` parameter reflects the open state
3. The `{#if open}` block enables Svelte transitions on enter/exit
4. The component waits for transitions to complete before fully unmounting

## Reusable Transition Wrapper

If you use transitions across your application, create a reusable component that handles this logic:

```svelte
<!-- MyDialogContent.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";
  import { Dialog, type WithoutChildrenOrChild } from "bits-ui";

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: WithoutChildrenOrChild<Dialog.ContentProps> & {
    children?: Snippet;
  } = $props();
</script>

<Dialog.Content bind:ref {...restProps} forceMount={true}>
  {#snippet child({ props, open })}
    {#if open}
      <div {...props} transition:fly>
        {@render children?.()}
      </div>
    {/if}
  {/snippet}
</Dialog.Content>
```

Then use it alongside other `Dialog.*` components:

```svelte
<script lang="ts">
  import MyDialogContent from "./MyDialogContent.svelte";
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <MyDialogContent>
    Content with transitions!
  </MyDialogContent>
</Dialog.Root>
```

## Floating Components with Transitions

For floating components (Popover, Tooltip, etc.), remember the two-level wrapper structure:

```svelte
<Popover.Content forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:fly>
          Popover content
        </div>
      </div>
    {/if}
  {/snippet}
</Popover.Content>
```

The `wrapperProps` go on the unstyled outer element (handles positioning), and `props` + transitions go on the inner element.

## CSS-Only Transitions

If you prefer CSS transitions over Svelte transitions, you don't need `forceMount` or the `child` snippet. Components expose `data-starting-style` and `data-ending-style` attributes on their animated surfaces:

```css
[data-popover-content] {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

[data-popover-content][data-starting-style],
[data-popover-content][data-ending-style] {
  opacity: 0;
  transform: scale(0.96);
}
```

This approach uses CSS transitions for enter/exit animations without JavaScript transition directives.
