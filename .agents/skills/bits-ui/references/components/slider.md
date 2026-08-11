# Slider

Enables users to select a value from a continuous range. The Slider component is a headless, accessible primitive for Svelte 5 that supports single-value and multi-thumb (range) sliders, discrete and continuous steps, horizontal and vertical orientations, tick marks, and labels.

## Overview

The Slider component provides an accessible, fully stylable range input that allows users to select one or more numeric values within a bounded range. Unlike a native `<input type="range">`, it offers multi-thumb support (selecting a range with a min and max), discrete non-uniform step values (snapping to an arbitrary array of values), tick marks with labels, and per-thumb labels.

Use this component when you need volume controls, price range selectors, font-size pickers, timeline scrubbers, or any UI where a user drags a handle along a track to choose a numeric value.

### Key Features

- **Single and Multiple Thumbs** — Set `type="single"` for one handle, or `type="multiple"` for an array of values (e.g., a min/max range).
- **Discrete or Continuous Steps** — Pass a single number for uniform stepping, or pass an array of numbers to snap to specific, non-uniform values.
- **Tick Marks and Labels** — Render `Slider.Tick` and `Slider.TickLabel` elements at each step value, with bounded/selected state styling.
- **Thumb Labels** — Render `Slider.ThumbLabel` elements positioned above, below, or beside each thumb.
- **Orientation** — Horizontal (default) or vertical via the `orientation` prop.
- **RTL Support** — Set `dir="rtl"` to reverse the slider's reading direction.
- **Accessible** — Each thumb is focusable, draggable via keyboard, and exposes proper ARIA attributes (`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, etc.).
- **Value Commit Callback** — Distinguish between in-progress dragging (`onValueChange`) and completed dragging (`onValueCommit`).

## Component Structure

The Slider is composed of six parts that work together:

| Part | Element | Description |
|------|---------|-------------|
| `Slider.Root` | `<span>` | The root container that manages state, keyboard interaction, and value computation. All other parts must be descendants. |
| `Slider.Range` | `<span>` | The filled portion of the track between the start and end of the selected value(s). Visually represents the current selection. |
| `Slider.Thumb` | `<span>` | A draggable handle. Each thumb corresponds to one value in the `value` array (or the single value). Requires an `index` prop. |
| `Slider.ThumbLabel` | `<span>` | A label positioned relative to a thumb (top, bottom, left, right). Requires an `index` prop matching the thumb it labels. |
| `Slider.Tick` | `<span>` | A tick mark rendered at each step value. Requires an `index` prop. |
| `Slider.TickLabel` | `<span>` | A label for a tick mark, positioned top, bottom, left, or right. Requires an `index` prop. |

Minimal structure:

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
</script>

<Slider.Root>
  <Slider.Range />
  <Slider.Thumb />
  <Slider.Tick />
</Slider.Root>
```

For multiple thumbs and ticks, use the `children` snippet to iterate over `thumbItems` and `tickItems`:

```svelte
<Slider.Root type="multiple" min={0} max={10} step={1}>
  {#snippet children({ tickItems, thumbItems })}
    <Slider.Range />
    {#each thumbItems as { index } (index)}
      <Slider.Thumb {index} />
    {/each}
    {#each tickItems as { index } (index)}
      <Slider.Tick {index} />
    {/each}
  {/snippet}
</Slider.Root>
```

## API Reference

### Slider.Root

The root slider component which contains the remaining slider components. Manages all state, keyboard interaction, pointer events, and value computation.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `enum` — `'single' \| 'multiple'` | `undefined` (required) | The type of the slider. If set to `'multiple'`, the slider will allow multiple thumbs and the `value` will be an array of numbers. |
| `value` | `number` \| `number[]` (bindable) | `0` | The current value of the slider. If `type` is `'single'`, this is a number. If `type` is `'multiple'`, this should be an array of numbers (defaults to an empty array). Use `bind:value` for two-way binding. |
| `onValueChange` | `function` — `(value: number) => void` \| `(value: number[]) => void` | `undefined` | A callback function called when the value state of the slider changes. Called immediately as the user drags the thumb. |
| `onValueCommit` | `function` — `(value: number) => void` \| `(value: number[]) => void` | `undefined` | A callback function called when the user finishes dragging the thumb and the value changes. Unlike `onValueChange`, this waits until the user stops dragging before firing. Useful for triggering expensive operations (e.g., API requests) only when the user commits a value. |
| `disabled` | `boolean` | `false` | Whether or not the slider is disabled. When disabled, the slider cannot be interacted with and `data-disabled` is set on all parts. |
| `max` | `number` | `100` | The maximum value of the slider. |
| `min` | `number` | `0` | The minimum value of the slider. |
| `orientation` | `enum` — `'horizontal' \| 'vertical'` | `'horizontal'` | The orientation of the slider. |
| `step` | `number` \| `number[]` (bindable) | `undefined` | The step value of the slider. If a single number is provided, the slider steps by that number and generates ticks at each multiple (e.g., `step={1}` generates ticks at `0, 1, 2, 3, ...`). If an array of numbers is provided, the slider snaps to those specific values (e.g., `step={[0, 4, 8, 16, 24]}`) and ticks are generated at those values. |
| `dir` | `enum` — `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the slider. Set to `'rtl'` for right-to-left layouts. |
| `autoSort` | `boolean` | `true` | Whether to automatically sort the values in the array when moving thumbs past one another. Only applicable to `type="multiple"`. When `true`, dragging a thumb past another swaps their positions so values stay sorted. Set to `false` to allow thumbs to cross freely. |
| `thumbPositioning` | `enum` — `'exact' \| 'contain'` | `'contain'` | The positioning of the slider thumb. `'contain'` ensures the thumb is always fully visible within the track (the thumb's center aligns to the edge at min/max). `'exact'` ensures the thumb's leading edge aligns exactly with the value position. For an SSR-friendly alternative to `'contain'`, use the `trackPadding` prop. |
| `trackPadding` | `number` | `undefined` | A percentage of the full track length to pad the start and end of the track. Useful for creating a visual buffer between the thumbs/first ticks and the edges of the track. This is an SSR-friendly alternative to `thumbPositioning="contain"`. |
| `ref` | `HTMLSpanElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. The snippet receives props: `tickItems` (array of `{ value: number, index: number }`), `thumbs` (array of numbers — the currently active thumb indices), and `ticks` (deprecated — use `tickItems` instead). |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

#### Children Snippet Props

The `children` snippet on `Slider.Root` receives the following props:

| Prop | Type | Description |
| --- | --- | --- |
| `tickItems` | `TickItem[]` | The items to iterate over and render as ticks. Each `TickItem` has `{ value: number, index: number }`. |
| `thumbs` | `number[]` | The currently active thumb indices (array of numbers). Use this to render `Slider.Thumb` components for each value. |
| `ticks` | `number[]` | **Deprecated.** Use `tickItems` instead. An array of tick indices. |

> **Note:** The `thumbItems` snippet prop shown in some examples provides `{ index, value }` objects for each thumb. Use `{#each thumbItems as { index } (index)}` to render thumbs dynamically.

### Slider.Range

The filled portion of the track that visually represents the current selection. For single-type sliders, this spans from `min` to the current value. For multiple-type sliders, this spans from the lowest thumb value to the highest.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` | `HTMLSpanElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### Slider.Thumb

A draggable handle on the slider. Each thumb corresponds to one value. For `type="single"`, there is one thumb at `index={0}`. For `type="multiple"`, render one thumb per value in the array, using the `index` prop to associate it with the correct value.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `index` | `number` | `undefined` (required) | The index of the value this thumb represents. For `type="single"`, this is always `0`. For `type="multiple"`, this corresponds to the position in the `value` array. |
| `disabled` | `boolean` | `false` | Whether or not this specific thumb is disabled. When `true`, the thumb cannot be dragged and `data-disabled` is set. |
| `ref` | `HTMLSpanElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### Slider.ThumbLabel

A label positioned relative to a thumb. Use this to display the current value of a thumb, or a descriptive label (e.g., "Min", "Max", "Check in").

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `index` | `number` | `undefined` (required) | The index of the thumb this label represents. Must match the `index` of the corresponding `Slider.Thumb`. |
| `position` | `enum` — `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` for horizontal sliders, `'left'` for vertical sliders | The position of the label relative to the thumb. |
| `ref` | `HTMLSpanElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### Slider.Tick

A tick mark rendered at each step value. Ticks are generated based on the `step` prop — either uniformly (single number step) or at specific values (array step). Use the `tickItems` snippet prop from `Slider.Root`'s `children` to iterate and render ticks.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `index` | `number` | `undefined` (required) | The index of the tick in the array of ticks provided by the `tickItems` children snippet prop. |
| `ref` | `HTMLSpanElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### Slider.TickLabel

A label for a tick mark, positioned relative to the tick. Use this to display the value of each tick (e.g., "0px", "4px", "8px") or a descriptive label.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `index` | `number` | `undefined` (required) | The index of the tick in the array of ticks provided by the `tickItems` children snippet prop. |
| `position` | `enum` — `'top' \| 'bottom' \| 'left' \| 'right'` | `undefined` | The position of the tick label relative to the tick. |
| `ref` | `HTMLSpanElement` (bindable) | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

## Data Attributes

Data attributes are applied to the rendered DOM elements and can be used for CSS targeting and state-based styling.

### Slider.Root

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `'horizontal' \| 'vertical'` | The orientation of the slider. |
| `data-disabled` | `''` | Present when the slider is disabled. |
| `data-slider-root` | `''` | Present on the root element. |

### Slider.Range

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `'horizontal' \| 'vertical'` | The orientation of the slider. |
| `data-disabled` | `''` | Present when the slider is disabled. |
| `data-slider-range` | `''` | Present on the range element. |

### Slider.Thumb

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `'horizontal' \| 'vertical'` | The orientation of the slider. |
| `data-disabled` | `''` | Present when either the thumb or the slider is disabled. |
| `data-active` | `''` | Present when the thumb is active/grabbed (being dragged). |
| `data-slider-thumb` | `''` | Present on the thumb element. |

### Slider.ThumbLabel

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `'horizontal' \| 'vertical'` | The orientation of the slider. |
| `data-disabled` | `''` | Present when either the thumb this label represents or the slider is disabled. |
| `data-position` | `'top' \| 'bottom' \| 'left' \| 'right'` | The position of the label relative to the thumb. |
| `data-active` | `''` | Present when the thumb this label represents is active. |
| `data-value` | `''` | The value of the thumb this label represents. |
| `data-slider-thumb-label` | `''` | Present on the thumb label element. |

### Slider.Tick

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `'horizontal' \| 'vertical'` | The orientation of the slider. |
| `data-disabled` | `''` | Present when the slider is disabled. |
| `data-bounded` | `''` | Present when the tick is bounded (i.e., the tick value is less than or equal to the current value, or within the selected range for multiple sliders). |
| `data-value` | `''` | The value the tick represents. |
| `data-selected` | `''` | Present when the tick value is the same as one of the thumbs' values. |
| `data-slider-tick` | `''` | Present on the tick element. |

### Slider.TickLabel

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `'horizontal' \| 'vertical'` | The orientation of the slider. |
| `data-disabled` | `''` | Present when the slider is disabled. |
| `data-position` | `'top' \| 'bottom' \| 'left' \| 'right'` | The position of the tick label. |
| `data-selected` | `''` | Present when the tick this label represents is the same value as one of the thumbs. |
| `data-value` | `''` | The value of the tick this label represents. |
| `data-bounded` | `''` | Present when the tick this label represents is bounded (i.e., the tick value is less than or equal to the current value, or within the range of a multiple slider). |
| `data-slider-tick-label` | `''` | Present on the tick label element. |

### Styling with Data Attributes

Use data attributes to style ticks and thumbs based on their state. For example, highlight ticks that are within the selected range:

```css
/* Ticks within the selected range */
[data-slider-tick][data-bounded] {
  background-color: var(--color-foreground);
}

/* The tick at the current thumb position */
[data-slider-tick][data-selected] {
  background-color: var(--color-primary);
}
```

In Tailwind CSS, use the `data-[bounded]:` and `data-[selected]:` variants:

```svelte
<Slider.Tick
  index={index}
  class="bg-muted-foreground data-[bounded]:bg-foreground data-[selected]:bg-primary"
/>
```

## CSS Variables

The Bits UI Slider component does not expose any `--bits-*` CSS custom properties. Styling is done entirely through standard CSS classes and the data attributes listed above.

## Examples

### Single Thumb

A basic single-value slider. Set `type="single"` and provide a numeric `value`.

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
  import cn from "clsx";
  let value = $state(50);
</script>

<div class="w-full md:max-w-[280px]">
  <Slider.Root
    type="single"
    bind:value
    class="relative flex w-full touch-none select-none items-center"
  >
    <span
      class="bg-dark-10 relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full"
    >
      <Slider.Range class="bg-foreground absolute h-full" />
    </span>
    <Slider.Thumb
      index={0}
      class={cn(
        "border-border-input bg-background hover:border-dark-40 focus-visible:ring-foreground dark:bg-foreground dark:shadow-card data-active:border-dark-40 focus-visible:outline-hidden data-active:scale-[0.98] block size-[25px] cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      )}
    />
  </Slider.Root>
</div>
```

### Multiple Thumbs

A range slider with two thumbs. Set `type="multiple"` and provide an array of numbers as `value`. The number of values in the array determines the number of thumbs rendered.

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
  import cn from "clsx";
  let value = $state([25, 75]);
</script>

<div class="w-full md:max-w-[280px]">
  <Slider.Root
    type="multiple"
    bind:value
    class="relative flex w-full touch-none select-none items-center"
  >
    {#snippet children({ thumbItems })}
      <span
        class="bg-dark-10 relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full"
      >
        <Slider.Range class="bg-foreground absolute h-full" />
      </span>
      {#each thumbItems as { index } (index)}
        <Slider.Thumb
          {index}
          class={cn(
            "border-border-input bg-background hover:border-dark-40 focus-visible:ring-foreground dark:bg-foreground dark:shadow-card data-active:border-dark-40 focus-visible:outline-hidden data-active:scale-[0.98] block size-[25px] cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          )}
        />
      {/each}
    {/snippet}
  </Slider.Root>
</div>
```

### Multiple Thumbs with Ticks

Combine `thumbItems` and `tickItems` snippet props to render both thumbs and tick marks. The number of ticks is determined by dividing `max` by `step`.

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
  let value = $state([5, 7]);
</script>

<div class="w-full md:max-w-[280px]">
  <Slider.Root
    step={1}
    min={0}
    max={10}
    type="multiple"
    bind:value
    class="relative flex w-full touch-none select-none items-center"
  >
    {#snippet children({ tickItems, thumbs })}
      <span
        class="bg-dark-10 relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full"
      >
        <Slider.Range class="bg-foreground absolute h-full" />
      </span>
      {#each thumbs as thumb (thumb)}
        <Slider.Thumb
          index={thumb}
          class="border-border-input bg-background hover:border-dark-40 focus-visible:ring-foreground dark:bg-foreground dark:shadow-card data-active:border-dark-40 z-5 focus-visible:outline-hidden data-active:scale-[0.98] block size-[25px] cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      {/each}
      {#each tickItems as { index } (index)}
        <Slider.Tick
          {index}
          class="dark:bg-background/20 bg-background z-1 h-2 w-[1px]"
        />
      {/each}
    {/snippet}
  </Slider.Root>
</div>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet prop to render your own element instead of the default `<span>`. This is useful when you need a specific DOM structure or want to merge props onto a custom element.

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
  let value = $state(50);
</script>

<Slider.Root type="single" bind:value>
  <Slider.Range />
  <Slider.Thumb index={0}>
    {#snippet child({ props })}
      <button {...props} class="my-custom-thumb" />
    {/snippet}
  </Slider.Thumb>
</Slider.Root>
```

### Vertical Orientation

Set `orientation="vertical"` to render a vertical slider. Use `trackPadding` to create a visual buffer so the thumb stays within the track bounds.

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
  let value = $state(50);
</script>

<div class="flex h-[320px] w-full justify-center">
  <Slider.Root
    type="single"
    step={1}
    bind:value
    orientation="vertical"
    class="relative flex h-full touch-none select-none flex-col items-center"
    trackPadding={3}
  >
    <span
      class="bg-dark-10 relative h-full w-2 cursor-pointer overflow-hidden rounded-full"
    >
      <Slider.Range class="bg-foreground absolute w-full" />
    </span>
    <Slider.Thumb
      index={0}
      class="border-border-input bg-background hover:border-dark-40 focus-visible:ring-foreground dark:bg-foreground dark:shadow-card data-active:border-dark-40 z-5 focus-visible:outline-hidden data-active:scale-[0.98] block size-[25px] cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  </Slider.Root>
</div>
```

### Discrete Steps (Array)

Pass an array of numbers to `step` to make the slider snap to specific, non-uniform values. Ticks are generated at each value in the array.

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
  let fontSize = $state(16);
  const fontSizes = [0, 4, 8, 16, 24];
</script>

<div class="w-full md:max-w-[320px]">
  <Slider.Root
    type="single"
    step={fontSizes}
    bind:value={fontSize}
    class="relative flex w-full touch-none select-none items-center"
    trackPadding={3}
  >
    {#snippet children({ tickItems })}
      <span
        class="bg-dark-10 relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full"
      >
        <Slider.Range class="bg-foreground absolute h-full" />
      </span>
      <Slider.Thumb
        index={0}
        class="border-border-input bg-background hover:border-dark-40 focus-visible:ring-foreground dark:bg-foreground dark:shadow-card data-active:border-dark-40 z-5 focus-visible:outline-hidden data-active:scale-[0.98] block size-[25px] cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      />
      {#each tickItems as { index, value } (index)}
        <Slider.Tick
          {index}
          class="dark:bg-background bg-background z-1 h-2 w-[1px]"
        />
        <Slider.TickLabel
          {index}
          class="text-muted-foreground data-selected:text-foreground mb-5 text-sm font-medium leading-none"
        >
          {value}px
        </Slider.TickLabel>
      {/each}
    {/snippet}
  </Slider.Root>
</div>
```

### Tick Labels

Use the `tickItems` snippet prop in combination with `Slider.TickLabel` to render labels at each tick. Set the `position` prop to control placement.

```svelte
<Slider.Root type="single" step={[0, 4, 8, 16, 24]}>
  {#snippet children({ tickItems })}
    {#each tickItems as { value, index } (index)}
      <Slider.Tick {index} />
      <Slider.TickLabel {index} position="top">
        {value}
      </Slider.TickLabel>
    {/each}
  {/snippet}
</Slider.Root>
```

### Thumb Labels

Use `Slider.ThumbLabel` to render a label positioned relative to a thumb. Specify the `index` to associate it with the correct thumb.

Manual approach (specify each thumb and label explicitly):

```svelte
<Slider.Root type="multiple" autoSort={false} step={10} value={[10, 50]}>
  <Slider.Range />
  <Slider.Thumb index={0} />
  <Slider.ThumbLabel index={0} position="top">Min</Slider.ThumbLabel>
  <Slider.Thumb index={1} />
  <Slider.ThumbLabel index={1} position="top">Max</Slider.ThumbLabel>
</Slider.Root>
```

Dynamic approach (use `thumbItems` snippet to render a label for each thumb):

```svelte
<Slider.Root type="multiple" autoSort={false} step={10} value={[10, 50]}>
  <Slider.Range />
  {#snippet children({ thumbItems })}
    {#each thumbItems as { index, value } (index)}
      <Slider.Thumb {index} />
      <Slider.ThumbLabel {index} position="top">
        {index === 0 ? "Min" : "Max"}: {value}
      </Slider.ThumbLabel>
    {/each}
  {/snippet}
</Slider.Root>
```

### Reusable Component

Create a reusable slider component that supports both single and multiple types. This example uses `WithoutChildren` to strip the `children` type from `RootProps` and destructures `value` and `ref` as bindable.

`MySlider.svelte`

```svelte
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Slider } from "bits-ui";
  type Props = WithoutChildren<ComponentProps<typeof Slider.Root>>;
  let {
    value = $bindable(),
    ref = $bindable(null),
    ...restProps
  }: Props = $props();
</script>

<!--
  Since we have to destructure the `value` to make it `$bindable`, we need to use `as any` here to avoid
  type errors from the discriminated union of "single" | "multiple".
  (an unfortunate consequence of having to destructure bindable values)
-->
<Slider.Root bind:value bind:ref {...restProps as any}>
  {#snippet children({ thumbs, ticks })}
    <Slider.Range />
    {#each thumbs as index}
      <Slider.Thumb {index} />
    {/each}
    {#each ticks as index}
      <Slider.Tick {index} />
    {/each}
  {/snippet}
</Slider.Root>
```

Usage:

```svelte
<script lang="ts">
  import MySlider from "$lib/components/MySlider.svelte";
  let multiValue = $state([5, 10]);
  let singleValue = $state(50);
</script>

<MySlider bind:value={multiValue} type="multiple" />
<MySlider bind:value={singleValue} type="single" />
```

### HTML Form Integration

The slider does not render a hidden `<input>` element by default, since there are near-infinite possible values. To submit slider values with a form, add hidden `<input>` elements manually:

```svelte
<script lang="ts">
  import MySlider from "$lib/components/MySlider.svelte";
  let expectedIncome = $state([50, 100]);
  let desiredIncome = $state(50);
</script>

<form method="POST">
  <MySlider type="multiple" bind:value={expectedIncome} />
  <input type="hidden" name="expectedIncomeStart" value={expectedIncome[0]} />
  <input type="hidden" name="expectedIncomeEnd" value={expectedIncome[1]} />
  <MySlider type="single" bind:value={desiredIncome} />
  <input type="hidden" name="expectedIncomeEnd" value={desiredIncome} />
  <button type="submit">Submit</button>
</form>
```

### Fully Controlled (Function Binding)

Use a Svelte function binding for complete control over the state's reads and writes. This is useful when you need to transform or validate values before they are set.

```svelte
<script lang="ts">
  import { Slider } from "bits-ui";
  let myValue = $state(0);

  function getValue() {
    return myValue;
  }

  function setValue(newValue: number) {
    myValue = newValue;
  }
</script>

<Slider.Root type="single" bind:value={getValue, setValue}>
  <!-- ... -->
</Slider.Root>
```

## Accessibility

The Slider component follows the WAI-ARIA slider pattern. Each `Slider.Thumb` is rendered with `role="slider"` and exposes the following ARIA attributes:

- `aria-valuenow` — The current value of the thumb.
- `aria-valuemin` — The minimum value of the slider (`min` prop).
- `aria-valuemax` — The maximum value of the slider (`max` prop).
- `aria-orientation` — Set to `'horizontal'` or `'vertical'` based on the `orientation` prop.
- `aria-disabled` — Set to `'true'` when the slider or thumb is disabled.
- `aria-label` / `aria-labelledby` — Provide an accessible name for each thumb. If no visible label is present, supply an `aria-label` to describe the thumb's purpose (e.g., "Minimum price", "Maximum price").

### Keyboard Navigation

When a thumb has focus, the following keys control it:

| Key | Behavior |
| --- | --- |
| `ArrowRight` / `ArrowUp` | Increments the value by one step. In RTL mode, `ArrowRight` decrements. |
| `ArrowLeft` / `ArrowDown` | Decrements the value by one step. In RTL mode, `ArrowLeft` increments. |
| `PageUp` | Increments the value by a larger step (typically 10% of the range). |
| `PageDown` | Decrements the value by a larger step (typically 10% of the range). |
| `Home` | Sets the value to the minimum (`min`). |
| `End` | Sets the value to the maximum (`max`). |

### Accessibility Tips

- Provide an `aria-label` on each `Slider.Thumb` if there is no visible label, especially for multiple-thumb sliders where each thumb has a distinct meaning (e.g., "Minimum", "Maximum").
- Ensure the thumb has a visible focus indicator. The thumb is focusable via keyboard (`tabindex="0"`). Style it with `focus-visible:` variants.
- Do not remove the `role="slider"` or ARIA value attributes — they are essential for screen reader users to understand the current value and range.
- When disabling the slider, use the `disabled` prop rather than CSS `pointer-events: none`, so that `aria-disabled` is properly set.

## Tips

### Use `onValueCommit` for Expensive Operations

Use `onValueChange` for live UI updates (e.g., displaying the current value as the user drags), but use `onValueCommit` for expensive operations like API requests or database writes. `onValueCommit` only fires when the user releases the thumb, avoiding excessive calls during dragging.

```svelte
<Slider.Root
  type="single"
  onValueChange={(v) => (displayValue = v)}
  onValueCommit={(v) => saveToDatabase(v)}
/>
```

### Disable `autoSort` for Unconstrained Thumbs

By default, `autoSort` is `true`, which keeps multiple-thumb values sorted. If you need thumbs to cross freely (e.g., a thumb can have a higher value than the next thumb), set `autoSort={false}`. This is useful for timeline-style sliders where each thumb represents an independent event.

### Use `trackPadding` for SSR-Friendly Containment

The default `thumbPositioning="contain"` uses client-side measurement to keep thumbs within the track. This can cause a flash on SSR/hydration. For an SSR-friendly alternative, set `trackPadding` to a percentage (e.g., `3`), which pads the start and end of the track so thumbs and ticks stay visually contained without client-side measurement.

### Discrete Steps with Non-Uniform Values

Pass an array to `step` when you need the slider to snap to specific, non-uniform values (e.g., font sizes `[0, 4, 8, 16, 24]` or zoom levels `[0.5, 0.75, 1, 1.5, 2, 3, 4]`). The slider will only rest at those values, and ticks will be generated at each one.

### RTL Layouts

Set `dir="rtl"` on the `Root` to reverse the slider's direction. In RTL mode, the minimum value is on the right and the maximum is on the left. Keyboard arrow keys are also reversed: `ArrowRight` decrements and `ArrowLeft` increments.

### Rendering Thumbs and Ticks Dynamically

Always use the `children` snippet with `thumbItems` and `tickItems` to render thumbs and ticks dynamically. This ensures the correct number of elements are rendered based on the `value` array length and `step` configuration. Hardcoding thumbs without the snippet can lead to mismatches when the value array changes.

```svelte
<Slider.Root type="multiple" bind:value>
  {#snippet children({ thumbItems, tickItems })}
    <Slider.Range />
    {#each thumbItems as { index } (index)}
      <Slider.Thumb {index} />
    {/each}
    {#each tickItems as { index } (index)}
      <Slider.Tick {index} />
    {/each}
  {/snippet}
</Slider.Root>
```

### Touch Device Support

Add `touch-none` and `select-none` classes to the `Root` to prevent accidental text selection or scroll interference on mobile devices during drag operations:

```svelte
<Slider.Root class="touch-none select-none">
  <!-- ... -->
</Slider.Root>
```

### Render Delegation

Use the `child` snippet prop on any part when you need full control over the rendered element (e.g., to render a custom tag or merge props onto an existing element). The snippet receives a `props` object that must be spread onto your element. See the Bits UI Child Snippet documentation for details.
