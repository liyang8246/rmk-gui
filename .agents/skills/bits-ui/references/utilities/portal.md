# Portal

A component that renders its children in a portal, preventing layout issues in complex UI structures.

## Overview

The `Portal` component renders its children outside the current DOM tree, appending them to a target element (default: `document.body`). This is used internally by Bits UI components that have a `Portal` sub-component (Dialog, Popover, Tooltip, etc.).

## Usage

### Default Behavior

By default, content is portalled to the `body` element:

```svelte
<script lang="ts">
  import { Portal } from "bits-ui";
</script>

<Portal>
  <div>This content will be portalled to the body</div>
</Portal>
```

### Custom Target

Use the `to` prop to specify a custom target element or selector:

```svelte
<div id="custom-target"></div>

<Portal to="#custom-target">
  <div>This content will be portalled to #custom-target</div>
</Portal>
```

### Disable Portal

Use the `disabled` prop to render content in place (no portalling):

```svelte
<Portal disabled>
  <div>This content will not be portalled</div>
</Portal>
```

### Overriding the Default Target via BitsConfig

The default target can be modified using `BitsConfig`:

```svelte
<script lang="ts">
  import { Portal, BitsConfig } from "bits-ui";
  let target: HTMLElement | undefined = $state();
</script>

<BitsConfig defaultPortalTo={target}>
  <div bind:this={target} class="bg-background flex rounded-md border p-2">
    <section class="flex size-12 items-center justify-center bg-blue-200">
      <div class="size-8 bg-blue-400"></div>
      <Portal>
        <!-- Lifted out of the section, made a child of {target} -->
        <div class="size-12 bg-blue-600"></div>
      </Portal>
    </section>
  </div>
</BitsConfig>
```

## API Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `to` | `Element \| string` | `document.body` | Where to render the content |
| `disabled` | `boolean` | `false` | When disabled, content renders in its original DOM location |
| `children` | `Snippet` | `undefined` | The children content to render |

## When to Use

- Preventing `overflow: hidden` or `z-index` stacking issues from clipping floating content
- Rendering modals/dialogs outside the page's DOM hierarchy
- Escaping CSS transform or filter contexts that break positioning
