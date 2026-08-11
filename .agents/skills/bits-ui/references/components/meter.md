# Meter

Displays a static measurement within a known range. The Meter component renders a gauge that represents the current value relative to a minimum and maximum, suitable for displaying real-time metrics such as CPU usage, battery level, or token consumption.

## Overview

The Meter component displays a **static measurement** within a known range (e.g., 0–100). Unlike a progress bar, which tracks task completion, a meter represents a current state that can fluctuate up or down based on real-time measurements.

**When to use it:**

- Displaying a current measurement relative to a known capacity (CPU usage, battery level, sound volume, disk space, token usage).
- Showing real-time or periodically updated values that can increase or decrease.
- Visualizing a value within a bounded range where the value does not represent task completion.

**When NOT to use it (use [Progress](./progress.md) instead):**

- Showing completion status of a task (file upload, installation, form completion).
- Tracking advancement toward a goal where the value only increases.

**Meter vs. Progress:**

| Aspect | Meter | Progress |
|--------|-------|----------|
| Purpose | Static measurement within a range | Task completion status |
| Value behavior | Can fluctuate up/down | Only increases |
| Examples | CPU usage, battery, volume | File upload, install status |
| ARIA role | `meter` | `progressbar` |

**Features:**

- **Bounded Range** — Define `min` and `max` to establish the measurement range.
- **Accessible by Default** — Renders with the ARIA `meter` role and exposes `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext`.
- **Customizable Fill** — The root renders a container; you provide the visual fill via children, enabling full control over appearance and transitions.
- **Render Delegation** — Use the `child` snippet to render your own element while preserving behavior and accessibility attributes.

## Component Structure

The Meter component consists of a single part:

| Part | Element | Role |
|------|---------|------|
| `Meter.Root` | `<div>` | The meter container. Renders with the ARIA `meter` role and exposes the current value, min, and max to assistive technologies. |

```svelte
<script lang="ts">
  import { Meter } from "bits-ui";
</script>

<Meter.Root value={50} min={0} max={100} />
```

The root renders a container element. You add a child element (such as a `<div>`) styled and sized to represent the fill, since the component itself does not render a fill bar.

## API Reference

### Meter.Root

The meter component. Renders a `<div>` with the ARIA `meter` role and exposes the value, min, and max to assistive technologies.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | The current value of the meter. Clamped to the `[min, max]` range for ARIA purposes. |
| `min` | `number` | `0` | The minimum value of the meter. Sets `aria-valuemin`. |
| `max` | `number` | `100` | The maximum value of the meter. Sets `aria-valuemax`. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. Typically a styled fill element. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

The following ARIA attributes are accepted as standard HTML attributes on `Meter.Root`:

| Attribute | Purpose |
|-----------|---------|
| `aria-label` | Provides an accessible name when no visual label is present. |
| `aria-labelledby` | References the ID of a visible label element that names the meter. |
| `aria-valuetext` | Provides a human-readable description of the current value (e.g., `"50% (6 hours) remaining"`). Use when the numeric value alone is not user-friendly. |

## Data Attributes

State and identity are exposed via `data-*` attributes on the root element. Use these for CSS targeting and state-based styling.

### Meter.Root

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-value` | `''` | The current value of the meter. |
| `data-min` | `''` | The minimum value of the meter. |
| `data-max` | `''` | The maximum value of the meter. |
| `data-meter-root` | `''` | Present on the root element. |

## CSS Variables

The Meter component does not expose any `--bits-*` CSS variables. Use the `data-*` attributes for state-based styling, and style the fill via your own child element.

## Examples

### Basic Usage

A simple meter with a fill element whose width is driven by the value.

```svelte
<script lang="ts">
  import { Meter } from "bits-ui";

  let value = $state(60);
  const min = 0;
  const max = 100;
</script>

<Meter.Root
  {value}
  {min}
  {max}
  aria-label="Storage used"
  class="relative h-2 w-full overflow-hidden rounded-full bg-muted"
>
  <div
    class="h-full rounded-full bg-primary transition-all"
    style="width: {(value / max) * 100}%"
  ></div>
</Meter.Root>
```

### With Label and Value Display

Use `aria-labelledby` to associate a visible label, and `aria-valuetext` to provide a friendly description.

```svelte
<script lang="ts">
  import { Meter, useId } from "bits-ui";

  let value = $state(2000);
  const labelId = useId();
  const max = 4000;
  const min = 0;
  const usedPercentage = $derived((value / max) * 100);
  const percentageRemaining = $derived(100 - usedPercentage);
  const color = $derived.by(() => {
    if (percentageRemaining < 15) return "bg-red-500 dark:bg-red-400";
    if (percentageRemaining < 35) return "bg-orange-500 dark:bg-orange-400";
    if (percentageRemaining < 50) return "bg-yellow-500 dark:bg-yellow-400";
    return "bg-green-500 dark:bg-green-400";
  });
</script>

<div class="flex w-[60%] flex-col gap-2">
  <div class="flex items-center justify-between text-sm font-medium">
    <span id={labelId}>Tokens used</span>
    <span>{value} / {max}</span>
  </div>
  <Meter.Root
    aria-labelledby={labelId}
    aria-valuetext="{value} out of {max}"
    {value}
    {min}
    {max}
    class="shadow-mini-inset relative h-[15px] overflow-hidden rounded-full bg-dark-10"
  >
    <div
      class="shadow-mini-inset h-full w-full flex-1 rounded-full transition-all duration-1000 ease-in-out {color}"
      style="transform: translateX(-{100 - (100 * (value ?? 0)) / max}%)"
    ></div>
  </Meter.Root>
</div>
```

### Reusable Meter Component

Wrap `Meter.Root` in a custom component to standardize labeling and styling across your application.

**MyMeter.svelte**

```svelte
<script lang="ts">
  import { Meter, useId } from "bits-ui";
  import type { ComponentProps } from "svelte";

  let {
    max = 100,
    value = 0,
    min = 0,
    label,
    valueLabel,
  }: ComponentProps<typeof Meter.Root> & {
    label: string;
    valueLabel: string;
  } = $props();

  const labelId = useId();
</script>

<div>
  <span id={labelId}>{label}</span>
  <span>{valueLabel}</span>
</div>

<Meter.Root
  aria-labelledby={labelId}
  aria-valuetext={valueLabel}
  {value}
  {min}
  {max}
/>
```

**Usage:**

```svelte
<script lang="ts">
  import MyMeter from "$lib/components/MyMeter.svelte";

  let value = $state(3000);
  const max = 4000;
</script>

<MyMeter
  label="Tokens used"
  valueLabel="{value} / {max}"
  {value}
  {max}
/>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet to render your own element while preserving all internal props (ARIA attributes, data attributes).

```svelte
<script lang="ts">
  import { Meter } from "bits-ui";
</script>

<Meter.Root value={75} min={0} max={100} aria-label="Battery level">
  {#snippet child({ props })}
    <div
      {...props}
      class="relative h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        class="h-full rounded-full bg-green-500"
        style="width: 75%"
      ></div>
    </div>
  {/snippet}
</Meter.Root>
```

### Color-Coded Thresholds

Derive a fill color from the current value to provide visual feedback at different thresholds.

```svelte
<script lang="ts">
  import { Meter } from "bits-ui";

  let value = $state(82);
  const max = 100;
  const min = 0;

  const color = $derived.by(() => {
    const pct = (value / max) * 100;
    if (pct > 90) return "bg-red-500";
    if (pct > 70) return "bg-orange-500";
    if (pct > 40) return "bg-yellow-500";
    return "bg-green-500";
  });
</script>

<Meter.Root
  {value}
  {min}
  {max}
  aria-label="CPU usage"
  class="relative h-2 w-full overflow-hidden rounded-full bg-muted"
>
  <div
    class="h-full rounded-full transition-colors {color}"
    style="width: {(value / max) * 100}%"
  ></div>
</Meter.Root>
```

## Accessibility

The Meter component renders with the ARIA `meter` role and automatically exposes `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` based on the `value`, `min`, and `max` props.

**Labeling:**

- If a visual label is used, pass the ID of the label element via `aria-labelledby` to `Meter.Root`.
- If no visual label is used, provide a text description via `aria-label`.

**Value text:**

Assistive technologies often present `aria-valuenow` as a percentage. If conveying the value only in terms of a percentage would not be user-friendly, set `aria-valuetext` to a string that makes the meter value understandable. For example, a battery meter might be conveyed as `aria-valuetext="50% (6 hours) remaining"`. [Source: WAI-ARIA Meter Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/).

```svelte
<Meter.Root
  value={50}
  min={0}
  max={100}
  aria-label="Battery"
  aria-valuetext="50% (6 hours) remaining"
/>
```

## Tips

- **Provide the fill yourself.** `Meter.Root` renders only the container. Add a child element (e.g., a `<div>`) and drive its width or transform based on `(value / max) * 100` to visualize the fill.
- **Always label the meter.** Use `aria-labelledby` when a visible label exists, or `aria-label` when it does not. Without a label, assistive technologies cannot announce the meter's purpose.
- **Use `aria-valuetext` for non-percentage contexts.** When the raw number is more meaningful than a percentage (e.g., "6 hours remaining", "2 GB of 8 GB"), provide `aria-valuetext` so screen readers announce a friendly description.
- **Clamp is handled for ARIA.** The component clamps the value to the `[min, max]` range for `aria-valuenow`, but your visual fill should also account for out-of-range values to avoid overflow.
- **Style with `data-*` attributes.** Target `[data-meter-root]`, `[data-value]`, `[data-min]`, and `[data-max]` in CSS for state-based or value-based styling without additional JavaScript.
- **Animate the fill for real-time updates.** Apply a CSS `transition` on the fill element's `width` or `transform` to produce smooth movement when the value updates over time.
- **Use `child` snippet for custom elements.** When you need a non-`<div>` element, scoped styles, or Svelte actions on the root, use the `child` snippet and spread `{...props}` onto your element to preserve ARIA and data attributes.
- **Build a reusable wrapper.** For consistent meters across an app, wrap `Meter.Root` in a custom component that accepts `label` and `valueLabel` props, generates a label ID with `useId()`, and wires up `aria-labelledby` and `aria-valuetext` automatically.
- **Distinguish from Progress.** Use Meter for fluctuating measurements (CPU, battery, volume) and Progress for monotonically increasing task completion. Mixing them confuses assistive technology users.
