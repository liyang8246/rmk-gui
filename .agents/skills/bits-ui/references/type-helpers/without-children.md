# WithoutChildren

A type helper to exclude the `children` snippet prop from a component's props.

## Overview

When building custom component wrappers that populate the `children` prop internally (not exposing it to the consumer), use `WithoutChildren` to exclude the `children` prop from the component's type.

## Usage

```svelte
<!-- CustomAccordion.svelte -->
<script lang="ts">
  import { Accordion, type WithoutChildren } from "bits-ui";

  let {
    value,
    onValueChange,
    ...restProps
  }: WithoutChildren<Accordion.RootProps> = $props();
</script>

<Accordion.Root {...restProps}>
  <Accordion.Item {value} {onValueChange}>
    <Accordion.Header />
    <Accordion.Trigger />
    <Accordion.Content />
  </Accordion.Item>
</Accordion.Root>
```

In this example, the wrapper component hardcodes the accordion items internally. Since the consumer doesn't pass `children`, we exclude it from the exposed props to ensure type safety and consistency.

## When to Use

- Building wrapper components with a fixed internal structure
- When your wrapper renders its own children and doesn't expose `children` to the consumer
