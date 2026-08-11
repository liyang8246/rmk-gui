# Accordion

The Accordion component organizes content into collapsible sections, letting users focus on specific information without visual clutter. It supports single-open or multiple-open modes, full keyboard navigation, and flexible state management.

## Overview

The Accordion is a compound component that manages a set of collapsible panels. Each panel has a clickable trigger that toggles the visibility of its associated content. Use it for FAQs, settings panels, multi-step forms, or any UI where progressive disclosure reduces cognitive load.

Key characteristics:

- **Single or Multiple mode** — allow one open section at a time, or several.
- **Accessible by default** — ARIA attributes and keyboard navigation built in.
- **Flexible state** — uncontrolled defaults or fully controlled via `bind:value`.
- **Animation ready** — CSS variables for height/width transitions, or Svelte transitions via `forceMount` + `child` snippet.

## Component Structure

The Accordion is a compound component made up of five parts:

- `Accordion.Root` — Container that manages the overall open/closed state of all items.
- `Accordion.Item` — An individual collapsible section, identified by a unique `value`.
- `Accordion.Header` — Wraps the visible heading; sets the heading level for accessibility.
- `Accordion.Trigger` — The clickable button element that toggles its parent item's content.
- `Accordion.Content` — The collapsible body content, displayed when the item is open.

## API Reference

### Accordion.Root

The root accordion component used to set and manage the state of the accordion.

| Property          | Type                                                      | Default      | Description |
| ----------------- | --------------------------------------------------------- | ------------ | ----------- |
| `type` (required) | `'single' \| 'multiple'`                                   | `undefined`  | The type of accordion. `'multiple'` allows multiple items open at once; `'single'` allows only one. |
| `value` (bindable) | `string \| string[]`                                      | `undefined`  | The value of the currently active accordion item(s). A `string` when `type` is `'single'`; an array of strings when `type` is `'multiple'`. |
| `onValueChange`   | `(value: string \| string[]) => void`                      | `undefined`  | Callback fired when the active item value changes. Argument is a `string` for `single`, or `string[]` for `multiple`. |
| `disabled`        | `boolean`                                                 | `false`      | Whether the entire accordion is disabled. When disabled, the accordion cannot be interacted with. |
| `loop`            | `boolean`                                                 | `false`      | Whether keyboard navigation loops through items when reaching the end. |
| `orientation`     | `'vertical' \| 'horizontal'`                              | `'vertical'` | The orientation of the accordion. |
| `ref` (bindable)  | `HTMLDivElement`                                          | `null`       | The underlying DOM element. Bind to get a reference. |
| `children`        | `Snippet`                                                 | `undefined`  | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>`             | `undefined`  | Use render delegation to render your own element. See Child Snippet docs. |

### Accordion.Item

An accordion item.

| Property         | Type                                          | Default              | Description |
| ---------------- | --------------------------------------------- | -------------------- | ----------- |
| `value`          | `string`                                      | A random unique ID   | The value identifying the item as open or closed. If not provided, a unique ID is generated. |
| `disabled`       | `boolean`                                     | `false`              | Whether this specific item is disabled. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`               | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined`          | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined`          | Use render delegation to render your own element. See Child Snippet docs. |

### Accordion.Header

The header of the accordion item.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `level`          | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                   | `3`         | The heading level. Set as the `aria-level` attribute. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Accordion.Trigger

The button responsible for toggling the accordion item.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLButtonElement`                           | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Accordion.Content

The accordion item content, displayed when the item is open.

| Property           | Type                                                               | Default     | Description |
| ------------------ | ------------------------------------------------------------------ | ----------- | ----------- |
| `forceMount`       | `boolean`                                                          | `false`     | Forcefully mount the content in the DOM. Useful with Svelte transitions or other animation libraries. |
| `hiddenUntilFound` | `boolean`                                                          | `false`     | Use `hidden='until-found'` when closed, allowing browser search (Ctrl+F) to find and auto-expand matching collapsed content. |
| `ref` (bindable)   | `HTMLDivElement`                                                   | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`         | `Snippet`                                                          | `undefined` | The children content to render. |
| `child`            | `Snippet<{ open: boolean; props: Record<string, unknown> }>`       | `undefined` | Use render delegation to render your own element. The `open` boolean exposes the current open state. See Child Snippet docs. |

## Data Attributes

### Accordion.Root

| Data Attribute     | Value                              | Description |
| ------------------ | ---------------------------------- | ----------- |
| `data-orientation` | `'vertical' \| 'horizontal'`       | The orientation of the component. |
| `data-disabled`    | `''`                               | Present when the component is disabled. |
| `data-accordion-root` | `''`                            | Present on the root element. |

### Accordion.Item

| Data Attribute        | Value                        | Description |
| --------------------- | ---------------------------- | ----------- |
| `data-state`          | `'open' \| 'closed'`         | Whether the accordion item is open or closed. |
| `data-disabled`       | `''`                         | Present when the component is disabled. |
| `data-orientation`    | `'vertical' \| 'horizontal'` | The orientation of the component. |
| `data-accordion-item` | `''`                         | Present on the item element. |

### Accordion.Header

| Data Attribute          | Value                          | Description |
| ----------------------- | ------------------------------ | ----------- |
| `data-orientation`      | `'vertical' \| 'horizontal'`   | The orientation of the component. |
| `data-disabled`         | `''`                           | Present when the component is disabled. |
| `data-heading-level`    | `'1' \| '2' \| '3' \| '4' \| '5' \| '6'` | The heading level of the element. |
| `data-accordion-header` | `''`                           | Present on the header element. |

### Accordion.Trigger

| Data Attribute           | Value                              | Description |
| ------------------------ | ---------------------------------- | ----------- |
| `data-orientation`       | `'vertical' \| 'horizontal'`       | The orientation of the component. |
| `data-disabled`          | `''`                               | Present when the component is disabled. |
| `data-accordion-trigger` | `''`                               | Present on the trigger element. |

### Accordion.Content

| Data Attribute           | Value                              | Description |
| ------------------------ | ---------------------------------- | ----------- |
| `data-orientation`       | `'vertical' \| 'horizontal'`       | The orientation of the component. |
| `data-disabled`          | `''`                               | Present when the component is disabled. |
| `data-starting-style`    | `''`                               | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`      | `''`                               | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-accordion-content` | `''`                               | Present on the content element. |

## CSS Variables

These CSS variables are exposed on `Accordion.Content` and can be used to animate open/close transitions.

| CSS Variable                      | Description |
| --------------------------------- | ----------- |
| `--bits-accordion-content-height` | The height of the accordion content element. |
| `--bits-accordion-content-width`  | The width of the accordion content element. |

## Examples

### Basic Usage

A minimal single-open accordion:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
</script>

<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>Item 1 Title</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>
      This is the collapsible content for this section.
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Header>
      <Accordion.Trigger>Item 2 Title</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>
      This is the collapsible content for this section.
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### Single vs. Multiple

`type="single"` allows only one item open at a time:

```svelte
<Accordion.Root type="single">
  <Accordion.Item value="A">
    <Accordion.Header>
      <Accordion.Trigger>Title A</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Content A</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="B">
    <Accordion.Header>
      <Accordion.Trigger>Title B</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Content B</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

`type="multiple"` allows several items open simultaneously. Pre-open items by setting `value` to an array:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
  let value = $state<string[]>(["A", "C"]);
</script>

<Accordion.Root type="multiple" bind:value>
  <Accordion.Item value="A">
    <Accordion.Header>
      <Accordion.Trigger>Title A</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Content A</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="B">
    <Accordion.Header>
      <Accordion.Trigger>Title B</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Content B</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="C">
    <Accordion.Header>
      <Accordion.Trigger>Title C</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Content C</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### With `child` Snippet (Render Delegation)

Use the `child` snippet for full control over the rendered element. The snippet receives `props` (to spread onto your element) and, for `Accordion.Content`, an `open` boolean:

```svelte
<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>
        {#snippet child({ props })}
          <button {...props} class="my-custom-trigger">
            Item 1 Title
          </button>
        {/snippet}
      </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>
      {#snippet child({ props, open })}
        <div {...props} class="my-custom-content">
          Content is {open ? "open" : "closed"}
        </div>
      {/snippet}
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### With Svelte Transitions

Combine `forceMount` with the `child` snippet to apply Svelte transitions. The `open` state from the snippet drives an `{#if}` block, while `transition:` directives animate the element:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
  import { slide } from "svelte/transition";
</script>

<Accordion.Root type="multiple">
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>Item 1 Title</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content forceMount>
      {#snippet child({ props, open })}
        {#if open}
          <div {...props} transition:slide={{ duration: 300 }}>
            This content transitions in and out.
          </div>
        {/if}
      {/snippet}
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

A reusable wrapper encapsulating the transition logic:

```svelte
<!-- MyAccordionContent.svelte -->
<script lang="ts">
  import { Accordion, type WithoutChildrenOrChild } from "bits-ui";
  import type { Snippet } from "svelte";
  import { fade } from "svelte/transition";

  let {
    ref = $bindable(null),
    duration = 200,
    children,
    ...restProps
  }: WithoutChildrenOrChild<Accordion.ContentProps> & {
    duration?: number;
    children: Snippet;
  } = $props();
</script>

<Accordion.Content forceMount bind:ref {...restProps}>
  {#snippet child({ props, open })}
    {#if open}
      <div {...props} transition:fade={{ duration }}>
        {@render children?.()}
      </div>
    {/if}
  {/snippet}
</Accordion.Content>
```

### Two-Way Binding and Programmatic Control

Bind `value` to reactively read or programmatically set open items:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
  let myValue = $state<string[]>([]);
  const numberOfItemsOpen = $derived(myValue.length);
</script>

<button onclick={() => (myValue = ["item-1", "item-2"])}>
  Open Items 1 and 2
</button>

<Accordion.Root type="multiple" bind:value={myValue}>
  <Accordion.Item value="item-1"><!-- ... --></Accordion.Item>
  <Accordion.Item value="item-2"><!-- ... --></Accordion.Item>
  <Accordion.Item value="item-3"><!-- ... --></Accordion.Item>
</Accordion.Root>
```

### Fully Controlled (Function Binding)

Use a Svelte function binding for complete control over reads and writes:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
  let myValue = $state("");

  function getValue() {
    return myValue;
  }
  function setValue(newValue: string) {
    myValue = newValue;
  }
</script>

<Accordion.Root type="single" bind:value={getValue, setValue}>
  <!-- ... -->
</Accordion.Root>
```

### Disabled Items

Disable individual items with the `disabled` prop, or the entire accordion via `Accordion.Root`:

```svelte
<Accordion.Root type="single">
  <Accordion.Item value="item-1" disabled>
    <Accordion.Header>
      <Accordion.Trigger>Disabled Item</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Cannot be opened.</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### Hidden Until Found

Enable `hiddenUntilFound` so browser search (Ctrl+F) can locate text inside collapsed content and auto-expand the matching item:

```svelte
<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>Search Demo</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content hiddenUntilFound>
      This content can be found by browser search (Ctrl+F / Cmd+F) even when
      the accordion is closed. The accordion will automatically open when the
      browser finds matching text.
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### Reusable Wrapper Components

For larger apps, wrap the primitives into reusable components.

Item wrapper combining `Item`, `Header`, `Trigger`, and `Content`:

```svelte
<!-- MyAccordionItem.svelte -->
<script lang="ts">
  import { Accordion, type WithoutChildrenOrChild } from "bits-ui";

  type Props = WithoutChildrenOrChild<Accordion.ItemProps> & {
    title: string;
    content: string;
  };

  let { title, content, ...restProps }: Props = $props();
</script>

<Accordion.Item {...restProps}>
  <Accordion.Header>
    <Accordion.Trigger>{title}</Accordion.Trigger>
  </Accordion.Header>
  <Accordion.Content>
    {content}
  </Accordion.Content>
</Accordion.Item>
```

Accordion wrapper rendering multiple items:

```svelte
<!-- MyAccordion.svelte -->
<script lang="ts">
  import { Accordion, type WithoutChildrenOrChild } from "bits-ui";
  import MyAccordionItem from "$lib/components/MyAccordionItem.svelte";

  type Item = {
    value?: string;
    title: string;
    content: string;
    disabled?: boolean;
  };

  let {
    value = $bindable(),
    ref = $bindable(null),
    items,
    ...restProps
  }: WithoutChildrenOrChild<Accordion.RootProps> & {
    items: Item[];
  } = $props();
</script>

<!--
  Since we have to destructure `value` to make it `$bindable`, we use `as any`
  here to avoid type errors from the discriminated union of `"single" | "multiple"`.
-->
<Accordion.Root bind:value bind:ref {...restProps as any}>
  {#each items as item, i (item.title + i)}
    <MyAccordionItem {...item} />
  {/each}
</Accordion.Root>
```

Usage:

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import MyAccordion from "$lib/components/MyAccordion.svelte";

  const items = [
    { title: "Item 1", content: "Content 1" },
    { title: "Item 2", content: "Content 2" },
  ];
</script>

<MyAccordion type="single" {items} />
```

### Horizontal Layout

Set `orientation="horizontal"` for a horizontal accordion, useful for card-style layouts:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
  let value = $state("item-1");
  const items = [
    { id: "item-1", title: "Mountain Range", description: "Majestic peaks." },
    { id: "item-2", title: "Ocean Views", description: "Serene seas." },
    { id: "item-3", title: "Forest Retreats", description: "Dense woods." },
  ];
</script>

<Accordion.Root type="single" orientation="horizontal" bind:value>
  {#each items as item (item.id)}
    <Accordion.Item
      value={item.id}
      class="overflow-hidden transition-all duration-500 data-[state=closed]:w-[20%] data-[state=open]:w-[100%]"
      onclick={() => (value = item.id)}
    >
      <Accordion.Header>
        <Accordion.Trigger>{item.title}</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content forceMount>
        {item.description}
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>
```

## Accessibility

The Accordion follows the [WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).

### Keyboard Navigation

| Key | Behavior |
| --- | -------- |
| `Tab` | Moves focus to the next focusable element; when focus enters the accordion, it lands on the first trigger. |
| `Shift` + `Tab` | Moves focus to the previous focusable element. |
| `Enter` | When a trigger is focused, toggles the associated item open/closed. |
| `Space` | When a trigger is focused, toggles the associated item open/closed. |
| `ArrowDown` | Moves focus to the next trigger. If `loop` is enabled, wraps from the last to the first. |
| `ArrowUp` | Moves focus to the previous trigger. If `loop` is enabled, wraps from the first to the last. |
| `Home` | Moves focus to the first trigger. |
| `End` | Moves focus to the last trigger. |

For horizontal orientation, `ArrowRight` and `ArrowLeft` move between triggers in place of `ArrowDown`/`ArrowUp`.

### ARIA Patterns

- `Accordion.Trigger` renders a `<button>` with `aria-expanded` reflecting open/closed state.
- `Accordion.Header` sets `aria-level` (via the `level` prop) and `role="heading"`.
- `Accordion.Trigger` and `Accordion.Content` are linked via `aria-controls` / `id` pairs.
- `disabled` items set `aria-disabled` and remove the element from the tab order.
- `data-state` (`'open'` / `'closed'`) on `Accordion.Item` and `Accordion.Content` mirrors `aria-expanded` for CSS targeting.

## Tips

- **Unique `value` per item.** If you plan to control state programmatically or pre-open items, always set explicit `value` props. Omitting `value` generates a random ID per render, which makes binding unreliable.
- **`type` is required.** The `type` prop on `Accordion.Root` must be set to either `'single'` or `'multiple'`. It determines the shape of `value` (`string` vs `string[]`) and the `onValueChange` callback signature.
- **Disabling the whole accordion vs. one item.** `disabled` on `Accordion.Root` disables all items; `disabled` on `Accordion.Item` disables only that item.
- **Animating with CSS.** Target `data-[state=open]` and `data-[state=closed]` on `Accordion.Content` to drive CSS animations. The `--bits-accordion-content-height` / `--bits-accordion-content-width` variables expose the measured content size for height/width transitions. Use `data-starting-style` and `data-ending-style` for enter/exit keyframes.
- **Animating with Svelte transitions.** Set `forceMount` on `Accordion.Content` and use the `child` snippet. Guard the rendered content with `{#if open}` (using the snippet's `open` argument) and apply `transition:` directives to the inner element. Without `forceMount`, the content is unmounted immediately on close and transitions won't play.
- **`hiddenUntilFound` and transitions.** When `hiddenUntilFound` is enabled, the browser may auto-expand collapsed content during in-page search. This is independent of animation — combine it carefully with `forceMount` if you also use transitions.
- **Reusable wrappers for transitions.** If you use transitions across many accordions, wrap `Accordion.Content` in a reusable component that bundles `forceMount` + the `child` snippet logic. Pass `duration` or other transition params as props.
- **`bind:value` with the discriminated union.** When destructuring `value` to make it `$bindable` in a wrapper, TypeScript may complain about the `'single' | 'multiple'` discriminated union. Casting `restProps as any` on the `Root` is the documented workaround.
- **Horizontal accordions.** Set `orientation="horizontal"` and provide your own width/flex styling. Keyboard navigation switches from vertical to horizontal arrows automatically.
