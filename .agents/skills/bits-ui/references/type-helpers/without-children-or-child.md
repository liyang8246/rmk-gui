# WithoutChildrenOrChild

A type helper to exclude both the `child` and `children` snippet props from a component's props.

## Overview

When building custom component wrappers that handle rendering internally and don't expose either `child` or `children` to the consumer, use `WithoutChildrenOrChild` to exclude both props.

## Usage

```svelte
<!-- CustomAccordionTrigger.svelte -->
<script lang="ts">
  import { Accordion, type WithoutChildrenOrChild } from "bits-ui";

  let {
    title,
    ...restProps
  }: WithoutChildrenOrChild<
    Accordion.TriggerProps & {
      title: string;
    }
  > = $props();
</script>

<Accordion.Trigger {...restProps}>
  {title}
</Accordion.Trigger>
```

The `CustomAccordionTrigger` component won't expose `children` or `child` props to the user, but will expose the other component props plus the custom `title` prop.

## When to Use

- Building wrapper components that fully control rendering (neither `children` nor `child` are exposed)
- Combining with custom props (like `title`) while preserving the underlying component's other props

See the [child snippet](../concepts/child-snippet.md) documentation for more on the `child` prop.
