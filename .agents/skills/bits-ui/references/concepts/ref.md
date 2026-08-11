# Ref — Direct DOM Access

The `ref` prop provides direct access to the underlying HTML elements in Bits UI components, enabling DOM manipulation when necessary.

## Basic Usage

Every Bits UI component that renders an HTML element exposes a `ref` prop that you can bind to:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
  let triggerRef = $state<HTMLButtonElement | null>(null);

  function focusTrigger() {
    triggerRef?.focus();
  }
</script>

<button onclick={focusTrigger}>Focus trigger</button>
<Accordion.Trigger bind:ref={triggerRef}>Trigger content</Accordion.Trigger>
```

## With Child Snippet

Bits UI uses element IDs to track references to underlying elements. This approach ensures the `ref` prop works correctly even when using the [child snippet](./child-snippet.md).

### Simple Delegation

The `ref` binding automatically works with delegated child elements/components:

```svelte
<script lang="ts">
  import CustomButton from "./CustomButton.svelte";
  import { Accordion } from "bits-ui";
  let triggerRef = $state<HTMLButtonElement | null>(null);

  function focusTrigger() {
    triggerRef?.focus();
  }
</script>

<Accordion.Trigger bind:ref={triggerRef}>
  {#snippet child({ props })}
    <CustomButton {...props} />
  {/snippet}
</Accordion.Trigger>
```

### Using Custom IDs

When you need a custom `id` on the element, pass it to the parent component so it can be correctly registered with the `ref` binding:

```svelte
<Accordion.Trigger bind:ref={triggerRef} id={myCustomId}>
  {#snippet child({ props })}
    <!-- The custom ID will be included in props -->
    <CustomButton {...props} />
  {/snippet}
</Accordion.Trigger>
```

### Pitfall: Setting ID on the Child

Avoid setting the `id` directly on the child component/element — this breaks the connection between the `ref` binding and the element:

```svelte
<!-- ❌ This won't work correctly -->
<Accordion.Trigger bind:ref={triggerRef}>
  {#snippet child({ props })}
    <CustomButton {...props} id="my-custom-id" />
  {/snippet}
</Accordion.Trigger>
```

The `Accordion.Trigger` component can't track the element because it doesn't know the custom ID.

## Why Possibly `null`?

The `ref` value may be `null` until the component mounts in the DOM. This is consistent with native DOM methods like `getElementById` which can return `null`. Always use optional chaining (`?.`) or null checks.

## Creating Your Own `ref` Props

To implement the same ref pattern in your custom components, use the [WithElementRef](../type-helpers/with-element-ref.md) type helper:

```svelte
<script lang="ts">
  import { WithElementRef } from "bits-ui";
  import type { HTMLButtonAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    children,
    ...rest
  }: WithElementRef<
    HTMLButtonAttributes & {
      yourPropA: string;
      yourPropB: number;
    },
    HTMLButtonElement
  > = $props();
</script>

<button bind:this={ref} {...rest}>
  {@render children?.()}
</button>
```
