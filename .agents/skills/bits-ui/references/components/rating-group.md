# Rating Group

Enables users to provide ratings using customizable items (like stars). The Rating Group component is a headless, accessible primitive for Svelte 5 that implements the WAI-ARIA slider pattern, supporting whole and half ratings, hover preview, readonly/disabled states, RTL layouts, and HTML form submission.

## Overview

The Rating Group component provides a flexible and accessible way to collect ratings from users. It renders a set of items (commonly stars) that users can interact with via mouse, touch, or keyboard. The component follows the ARIA slider pattern rather than a radiogroup pattern, which provides better screen reader support for rating interfaces.

**When to use it:**

- Collecting star ratings for products, articles, or content.
- Any numeric rating input where users select a value from a visual scale (1–5, 1–10, etc.).
- Displaying existing ratings in a readonly view alongside interactive rating collection.
- Forms that require a rating value to be submitted via hidden input.

**Features:**

- **Whole and Half Ratings** — Supports precise half-star ratings (e.g., 3.5) via the `allowHalf` prop.
- **Hover Preview** — Shows a live preview of the potential rating as the user hovers over items.
- **Keyboard Accessible** — Full keyboard support including arrow keys, number input, Home/End, and PageUp/PageDown.
- **RTL Support** — Automatically adapts arrow key navigation to right-to-left layouts.
- **HTML Form Integration** — Renders a hidden input element for form submission when a `name` prop is provided.
- **Flexible State Management** — Supports both controlled and uncontrolled state via two-way bindings and function bindings.
- **Readonly and Disabled Modes** — Display existing ratings without interaction, or disable the entire group.

## Component Structure

The Rating Group component follows a compound component pattern with two parts:

| Part | Element | Role |
|------|---------|------|
| `RatingGroup.Root` | `<div>` | The container that manages the rating state, keyboard interaction, and renders a hidden input when `name` is provided. Renders with `role="slider"`. |
| `RatingGroup.Item` | `<div>` | An individual rating item (e.g., a star). Must be a child of `RatingGroup.Root`. Renders with `role="presentation"`. |

Additionally, when the `name` prop is set on `RatingGroup.Root`, a hidden `<input>` element is rendered internally for HTML form submission. This input is not a user-facing component but carries the rating value to the form.

### Basic Structure

```svelte
<script lang="ts">
  import { RatingGroup } from "bits-ui";
</script>

<RatingGroup.Root max={5}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#if item.state === "active"}
          ⭐
        {:else}
          ☆
        {/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

The `children` snippet receives an `items` array, each with an `index` and a `state` of `"active"`, `"partial"`, or `"inactive"`. You iterate over this array to render the `RatingGroup.Item` components.

## API Reference

### RatingGroup.Root

The root component that manages the rating group's state, keyboard interaction, and form submission. Renders as a `<div>` element with `role="slider"`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | The value of the rating group. Bindable with `bind:value` to control the rating from outside the component. |
| `onValueChange` | `function` — `(value: number) => void` | `undefined` | A callback fired when the rating group's value changes. |
| `disabled` | `boolean` | `false` | Whether the rating group is disabled. Prevents user interaction and removes the component from the tab order. |
| `required` | `boolean` | `false` | Whether the rating group is required. Applies `required` to the hidden input for form validation. |
| `name` | `string` | `undefined` | The name of the rating group used in form submission. If provided, a hidden input element is rendered to submit the value. |
| `min` | `number` | `0` | The minimum value of the rating group. Users cannot select a rating below this value. |
| `max` | `number` | `5` | The maximum value of the rating group. Also determines the number of rating items rendered. |
| `allowHalf` | `boolean` | `false` | Whether the rating group allows half values (e.g., 3.5). When enabled, arrow keys increment/decrement by 0.5. |
| `readonly` | `boolean` | `false` | Whether the rating group is readonly. Displays the current rating without allowing user interaction. |
| `orientation` | `'vertical' \| 'horizontal'` | `'horizontal'` | The orientation of the rating group. Determines how keyboard navigation works within the component. |
| `hoverPreview` | `boolean` | `true` | Whether the rating group shows a preview of the rating when hovering over the items. Set to `false` to only highlight the currently selected rating. |
| `aria-valuetext` | `string \| ((value: number, max: number) => string)` | `` `${value} out of ${max}` `` | The text that describes the rating group's value for screen readers. Provide a function for contextual descriptions based on the current value. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable with `bind:ref` to get a reference to the element. |
| `children` | `Snippet` — `ChildrenSnippetProps` | `undefined` | The children content to render. Receives `items`, `value`, and `max`. |
| `child` | `Snippet` — `ChildSnippetProps` | `undefined` | Use render delegation to render your own element. See Child Snippet docs for more information. |

**Bindable props:** `value`, `ref`.

#### Children Snippet Props

The `children` snippet receives an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `items` | `RatingGroupItemData[]` | An array of rating item data, one per item up to `max`. Iterate over this to render `RatingGroup.Item` components. |
| `value` | `number` | The current rating value. |
| `max` | `number` | The maximum rating value. |

Where `RatingGroupItemData` is:

| Property | Type | Description |
|----------|------|-------------|
| `index` | `number` | The zero-based index of the rating item. |
| `state` | `RatingGroupItemState` | The visual state of the item: `"active"`, `"partial"`, or `"inactive"`. |

```ts
type RatingGroupItemState = "active" | "partial" | "inactive";
type RatingGroupItemData = {
  index: number;
  state: RatingGroupItemState;
};
type ChildrenSnippetProps = {
  items: RatingGroupItemData[];
  value: number;
  max: number;
};
```

#### Child Snippet Props

The `child` snippet receives an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `props` | `Record<string, unknown>` | All internal attributes, event handlers, and ARIA props to spread onto your custom element. |
| `items` | `RatingGroupItemData[]` | An array of rating item data. |
| `value` | `number` | The current rating value. |
| `max` | `number` | The maximum rating value. |

```ts
type ChildSnippetProps = {
  items: RatingGroupItemData[];
  value: number;
  max: number;
  props: Record<string, unknown>;
};
```

### RatingGroup.Item

An individual rating item, which must be a child of the `RatingGroup.Root` component. Renders as a `<div>` element with `role="presentation"`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `index` | `number` | `undefined` | The index of the rating item. **Required.** This must match the `item.index` from the `children` snippet's `items` array. |
| `disabled` | `boolean` | `false` | Whether the rating item is disabled. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable with `bind:ref` to get a reference to the element. |
| `children` | `Snippet` — `{ state: RatingGroupItemState }` | `undefined` | The children content to render. Receives the item's `state`. |
| `child` | `Snippet` — `{ state: RatingGroupItemState; props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See Child Snippet docs for more information. |

**Bindable props:** `ref`.

#### Children Snippet Props

The `children` snippet receives an object with the following property:

| Property | Type | Description |
|----------|------|-------------|
| `state` | `RatingGroupItemState` | The visual state of the item: `"active"`, `"partial"`, or `"inactive"`. |

#### Child Snippet Props

The `child` snippet receives an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `state` | `RatingGroupItemState` | The visual state of the item: `"active"`, `"partial"`, or `"inactive"`. |
| `props` | `Record<string, unknown>` | All internal attributes, event handlers, and ARIA props to spread onto your custom element. |

## Data Attributes

State and identity are exposed via `data-*` attributes on each part. Use these for CSS targeting and state-based styling.

### RatingGroup.Root

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-orientation` | `'vertical' \| 'horizontal'` | The orientation of the rating group. |
| `data-disabled` | `''` | Present when the rating group is disabled. |
| `data-readonly` | `''` | Present when the rating group is readonly. |
| `data-rating-group-root` | `''` | Present on the root element. |

### RatingGroup.Item

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-state` | `'active' \| 'partial' \| 'inactive'` | The rating item's state. `"active"` when fully selected, `"partial"` for half-selected items (when `allowHalf` is enabled), `"inactive"` when not selected. |
| `data-value` | `''` | The value of the rating item. |
| `data-disabled` | `''` | Present when the rating group is disabled. |
| `data-readonly` | `''` | Present when the rating group is readonly. |
| `data-orientation` | `'vertical' \| 'horizontal'` | The orientation of the parent rating group. |
| `data-rating-group-item` | `''` | Present on the rating item element. |

## CSS Variables

The Rating Group component does not expose any `--bits-*` CSS variables. Use the `data-state` and `data-*` attributes for state-based styling instead.

## Examples

### Basic Rating Group

A simple star rating with two-way binding on the `value` state.

```svelte
<script lang="ts">
  import { RatingGroup } from "bits-ui";
  import Star from "phosphor-svelte/lib/Star";

  let value = $state(3);
</script>

<RatingGroup.Root bind:value max={5} class="flex gap-1">
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item
        index={item.index}
        class="text-foreground hover:text-foreground data-[state=inactive]:text-muted-foreground group size-10 cursor-pointer transition-colors md:size-8"
      >
        <Star class="size-full" weight="fill" />
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet on `RatingGroup.Item` for full control over the rendered element. This is useful when you need Svelte transitions, scoped styles, actions, or custom components. Always spread `{...props}` onto your custom element.

```svelte
<script lang="ts">
  import { RatingGroup } from "bits-ui";
</script>

<RatingGroup.Root max={5}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#snippet child({ props, state })}
          <div {...props} class="my-scoped-star-style">
            {#if state === "active"}
              ⭐
            {:else if state === "partial"}
              🌟
            {:else}
              ☆
            {/if}
          </div>
        {/snippet}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### Half Ratings

Enable half ratings with `allowHalf`. The item `state` will be `"partial"` for the half-selected item, allowing you to render a half-filled icon.

```svelte
<script lang="ts">
  import { RatingGroup } from "bits-ui";
  import Star from "phosphor-svelte/lib/Star";
  import StarHalf from "phosphor-svelte/lib/StarHalf";

  let value = $state(3);
</script>

<RatingGroup.Root bind:value max={5} allowHalf class="flex gap-1">
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item
        index={item.index}
        class="text-foreground data-[state=inactive]:text-muted-foreground size-10 cursor-pointer transition-colors data-[readonly]:cursor-default md:size-8"
      >
        {#if item.state === "inactive"}
          <Star class="size-full" />
        {:else if item.state === "active"}
          <Star class="size-full fill-current" weight="fill" />
        {:else if item.state === "partial"}
          <StarHalf class="size-full fill-current" weight="fill" />
        {/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### Fully Controlled State

Use a function binding for complete control over state reads and writes. This allows validation, analytics, or conditional updates.

```svelte
<script lang="ts">
  import { RatingGroup } from "bits-ui";

  let myRating = $state(0);

  function getValue() {
    return myRating;
  }

  function setValue(newValue: number) {
    // Add custom logic here, like validation or analytics
    if (newValue >= 0 && newValue <= 5) {
      myRating = newValue;
    }
  }
</script>

<RatingGroup.Root bind:value={getValue, setValue} max={5}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#if item.state === "active"}⭐{:else}☆{/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### HTML Form Submission

Set the `name` prop to render a hidden input element for form submission. The rating value is submitted under this name.

```svelte
<RatingGroup.Root name="productRating" max={5}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#if item.state === "active"}⭐{:else}☆{/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

To make the hidden input required for form validation, set the `required` prop:

```svelte
<RatingGroup.Root required name="productRating" max={5}>
  <!-- ... -->
</RatingGroup.Root>
```

### Readonly Mode

Display an existing rating without allowing user interaction by setting `readonly` to `true`.

```svelte
<RatingGroup.Root readonly value={4.5} max={5}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#if item.state === "active"}⭐{:else if item.state === "partial"}🌟{:else}☆{/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### Disabled State

Disable the entire rating group by setting `disabled` to `true`. The component becomes non-focusable and non-interactive.

```svelte
<RatingGroup.Root disabled max={5}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#if item.state === "active"}⭐{:else}☆{/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### Hover Preview Disabled

By default, the rating group shows a preview of the potential rating when hovering. Disable this with `hoverPreview={false}` — only the currently selected rating will be highlighted.

```svelte
<script lang="ts">
  import { RatingGroup } from "bits-ui";
  import Star from "phosphor-svelte/lib/Star";

  let value = $state(2);
</script>

<RatingGroup.Root bind:value max={5} hoverPreview={false} class="flex gap-1">
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item
        index={item.index}
        class="text-muted-foreground data-[state=active]:text-foreground group size-8 cursor-pointer transition-colors md:size-6"
      >
        <Star
          class="size-full group-data-[state=active]:fill-current"
          weight="fill"
        />
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### RTL Support

The rating group automatically adapts to right-to-left text direction. Set `dir="rtl"` on a parent element. Arrow key navigation is automatically reversed to match the visual direction.

```svelte
<script lang="ts">
  import { RatingGroup } from "bits-ui";
  import Star from "phosphor-svelte/lib/Star";
  import StarHalf from "phosphor-svelte/lib/StarHalf";

  let value = $state(3);
</script>

<div class="flex flex-col gap-4" dir="rtl">
  <RatingGroup.Root bind:value max={5} class="flex gap-1" allowHalf>
    {#snippet children({ items })}
      {#each items as item (item.index)}
        <RatingGroup.Item
          index={item.index}
          class="text-muted-foreground data-[state=active]:text-foreground data-[state=partial]:text-foreground size-8 cursor-pointer transition-colors md:size-6"
        >
          {#if item.state === "partial"}
            <StarHalf
              class="size-full fill-current rtl:scale-x-[-1]"
              weight="fill"
            />
          {:else if item.state === "active"}
            <Star class="size-full fill-current" weight="fill" />
          {:else}
            <Star class="size-full" />
          {/if}
        </RatingGroup.Item>
      {/each}
    {/snippet}
  </RatingGroup.Root>
</div>
```

### Minimum and Maximum Rating

The `max` prop determines the maximum rating value and the number of items rendered. The `min` prop sets a minimum required rating — users cannot select a rating below this value.

```svelte
<!-- 3-item rating group -->
<RatingGroup.Root max={3}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {item.index + 1}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>

<!-- Minimum rating of 3 -->
<RatingGroup.Root min={3} value={3} max={5}>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#if item.state === "active"}⭐{:else}☆{/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### Custom aria-valuetext

Provide contextual rating descriptions for screen readers using the `aria-valuetext` prop.

```svelte
<RatingGroup.Root
  max={5}
  aria-valuetext={(value, max) => {
    if (value === 0) return "No rating selected";
    return `${value} out of ${max} stars. ${value >= 4 ? "Excellent" : value >= 3 ? "Good" : "Fair"} rating.`;
  }}
>
  {#snippet children({ items })}
    {#each items as item (item.index)}
      <RatingGroup.Item index={item.index}>
        {#if item.state === "active"}⭐{:else}☆{/if}
      </RatingGroup.Item>
    {/each}
  {/snippet}
</RatingGroup.Root>
```

### Reusable Rating Component

Wrap `RatingGroup.Root` and `RatingGroup.Item` into a reusable component for consistent usage across your application.

**MyRatingGroup.svelte**

```svelte
<script lang="ts">
  import { RatingGroup, type WithoutChildrenOrChild } from "bits-ui";
  import Star from "phosphor-svelte/lib/Star";
  import StarHalf from "phosphor-svelte/lib/StarHalf";

  let {
    value = $bindable(0),
    ref = $bindable(null),
    showLabel = true,
    max = 5,
    ...restProps
  }: WithoutChildrenOrChild<RatingGroup.RootProps> & {
    showLabel?: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-2">
  <RatingGroup.Root bind:value bind:ref {max} {...restProps}>
    {#snippet children({ items })}
      {#each items as item (item.index)}
        <RatingGroup.Item index={item.index}>
          {#if item.state === "inactive"}
            <Star />
          {:else if item.state === "active"}
            <Star weight="fill" />
          {:else if item.state === "partial"}
            <StarHalf weight="fill" />
          {/if}
        </RatingGroup.Item>
      {/each}
    {/snippet}
  </RatingGroup.Root>
  {#if showLabel}
    <p class="text-muted-foreground text-sm">
      Rating: {value} out of {max} stars
    </p>
  {/if}
</div>
```

**Usage:**

```svelte
<script lang="ts">
  import MyRatingGroup from "$lib/components/MyRatingGroup.svelte";

  let productRating = $state(4);
</script>

<MyRatingGroup bind:value={productRating} max={5} allowHalf />
```

## Accessibility

The Rating Group component implements comprehensive accessibility features following WAI-ARIA best practices for rating interfaces. It uses the **slider pattern** rather than a radiogroup pattern, which provides better screen reader support.

### ARIA Implementation

| Attribute | Value | Description |
|-----------|-------|-------------|
| `role` | `slider` | Set on the root element. Identifies it as a slider input. |
| `aria-valuenow` | `number` | Reflects the current rating value. |
| `aria-valuemin` | `number` | Reflects the minimum rating value (`min` prop). |
| `aria-valuemax` | `number` | Reflects the maximum rating value (`max` prop). |
| `aria-valuetext` | `string` | Provides a human-readable description of the current value. Customizable via the `aria-valuetext` prop. |
| `aria-disabled` | `true` | Set when the `disabled` prop is `true`. |
| `aria-required` | `true` | Set when the `required` prop is `true`. |
| `aria-orientation` | `'horizontal' \| 'vertical'` | Reflects the `orientation` prop. |
| `role` (items) | `presentation` | Set on rating items to avoid redundant announcements. |

When users navigate with arrow keys, screen readers announce the new rating value immediately, providing real-time feedback.

### Keyboard Interaction

| Key | Action |
|-----|--------|
| `ArrowRight` / `ArrowUp` | Increments the rating by 1 (or 0.5 when `allowHalf` is enabled). In RTL mode, left/right arrows are reversed. |
| `ArrowLeft` / `ArrowDown` | Decrements the rating by 1 (or 0.5 when `allowHalf` is enabled). In RTL mode, left/right arrows are reversed. |
| `Home` | Jumps to the minimum rating (or 1 if no minimum is set). |
| `End` | Jumps to the maximum rating. |
| `PageUp` | Increments the rating by 1 (alternative to arrows). |
| `PageDown` | Decrements the rating by 1 (alternative to arrows). |
| `0`–`9` (number input) | Types the exact rating value. For half ratings, type the decimal (e.g., `2.5`). Type `0` to clear (respects minimum constraints). Invalid numbers are ignored; values are clamped to min/max. |
| `Tab` | Moves focus to the rating group (single tab stop — the entire group acts as one focusable unit). |

#### Navigation Details

- **Standard mode:** Arrow keys increment/decrement by 1.
- **Half rating mode:** Arrow keys increment/decrement by 0.5 for finer control.
- **RTL support:** Left/right arrows automatically reverse in right-to-left layouts.
- **Bounds respect:** Navigation stops at min/max values.
- **Direct number input:** Type `3` for 3 stars, `2.5` for 2.5 stars (when `allowHalf` is enabled), `0` to clear.

### Focus Management

- **Mouse interactions:** Clicking a rating item automatically focuses the root slider.
- **Keyboard focus:** Single tab stop — the entire rating group acts as one focusable unit.
- **Visual feedback:** Focus styling is applied to the root container.
- **Disabled state:** The component becomes non-focusable when disabled.

## Tips

### Styling with Data Attributes

Target the `data-state` attribute on `RatingGroup.Item` to style items based on their state. This is the recommended approach for headless component styling.

```css
[data-rating-group-item] {
  cursor: pointer;
  transition: color 0.15s ease;
}

[data-rating-group-item][data-state="active"] {
  color: #f59e0b;
}

[data-rating-group-item][data-state="partial"] {
  color: #f59e0b;
}

[data-rating-group-item][data-state="inactive"] {
  color: #d1d5db;
}

[data-rating-group-item][data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

[data-rating-group-item][data-readonly] {
  cursor: default;
}
```

With Tailwind CSS, use data attribute variants:

```svelte
<RatingGroup.Item
  index={item.index}
  class="text-muted-foreground data-[state=active]:text-foreground data-[state=partial]:text-foreground size-8 cursor-pointer transition-colors data-[readonly]:cursor-default data-[disabled]:opacity-50"
>
  <Star class="size-full" weight="fill" />
</RatingGroup.Item>
```

### Readonly vs Disabled

- `disabled` — The rating group cannot be focused or interacted with. It is excluded from the tab order and form interaction.
- `readonly` — The rating group can be focused but the value cannot be changed. The user can still read the current rating.

Use `readonly` when you want to display a rating without allowing changes (e.g., showing a product's average rating). Use `disabled` when the rating group should be entirely non-interactive.

### Hidden Inputs for Form Submission

When a `name` is provided to `RatingGroup.Root`, a hidden `<input>` element is rendered internally. This input carries the form submission value under the provided name. Set `required` on the root to make the hidden input required for form validation.

### Half Ratings and Partial State

When `allowHalf` is enabled, the item `state` can be `"partial"` for the item representing the half value. Render a half-filled icon (e.g., `StarHalf`) for this state to visually communicate the half rating. Without `allowHalf`, items are only `"active"` or `"inactive"`.

### RTL Layouts

Set `dir="rtl"` on a parent element to enable right-to-left layout. The rating group automatically reverses arrow key navigation to match the visual direction. For half-star icons that are direction-sensitive, use `rtl:scale-x-[-1]` (Tailwind) to mirror the icon correctly.

### Hover Preview

By default, hovering over items shows a preview of the potential rating. Disable this with `hoverPreview={false}` when you only want to show the committed rating — useful in compact UIs or when the preview causes visual noise.

### Custom Value Text for Screen Readers

Use the `aria-valuetext` prop to provide contextual descriptions beyond the default "`{value} out of {max}`". A function receives `(value, max)` and returns a string. This is especially useful for translating ratings into qualitative descriptions (e.g., "Excellent", "Good", "Fair") for screen reader users.

### Build a Reusable Wrapper

For consistent rating UIs across an app, wrap `RatingGroup.Root` and `RatingGroup.Item` in a custom component. Use the `WithoutChildrenOrChild<RatingGroup.RootProps>` type helper to forward props cleanly while exposing your own customization props (like `showLabel`).

### Two-Way Binding vs Function Binding

Use `bind:value` for simple state synchronization — the parent component owns the state and the rating group updates it directly. Use a function binding (`bind:value={getValue, setValue}`) when you need validation, analytics, side effects, or conditional logic on every value change.
