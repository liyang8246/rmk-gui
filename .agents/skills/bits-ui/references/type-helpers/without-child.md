# WithoutChild

A type helper to exclude the `child` snippet prop from a component's props.

## Overview

When building custom component wrappers that populate the `children` prop and don't provide a way to pass a custom `child` snippet, use `WithoutChild` to exclude the `child` prop from the component's type.

## Usage

```svelte
<!-- CustomAccordionHeader.svelte -->
<script lang="ts">
  import { Accordion, type WithoutChild } from "bits-ui";

  let { children, ...restProps }: WithoutChild<Accordion.ItemProps> = $props();
</script>

<Accordion.Header {...restProps}>
  <Accordion.Trigger>
    {@render children?.()}
  </Accordion.Trigger>
</Accordion.Header>
```

In this example, the wrapper component hardcodes the `Accordion.Trigger` inside the header. Since the consumer doesn't need to customize the trigger via `child`, we exclude it from the exposed props using `WithoutChild`.

## When to Use

- Building wrapper components that fix the internal structure
- When your wrapper provides its own `children` rendering and doesn't expose `child` customization

See the [child snippet](../concepts/child-snippet.md) documentation for more on the `child` prop.
