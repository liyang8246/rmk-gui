# WithElementRef

A type helper to enable the `ref` prop on your custom components.

## Overview

The `WithElementRef` type helper lets you follow the same [`ref`](../concepts/ref.md) prop pattern used by Bits UI components when crafting your own components.

```ts
type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};
```

## Usage

```svelte
<!-- CustomButton.svelte -->
<script lang="ts">
  import type { WithElementRef } from "bits-ui";

  type Props = WithElementRef<
    {
      yourPropA: string;
      yourPropB: number;
    },
    HTMLButtonElement
  >;

  let { yourPropA, yourPropB, ref = $bindable(null) }: Props = $props();
</script>

<button bind:this={ref}>
  <!-- ... -->
</button>
```

## How It Works

- The first type parameter `T` is your component's own props
- The second type parameter `U` is the HTML element type (defaults to `HTMLElement`)
- The helper adds an optional `ref` prop of type `U | null` to your props

This matches the pattern all Bits UI components use, ensuring your custom components integrate seamlessly with the `bind:ref` pattern.
