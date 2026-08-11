# Progress

Shows the completion status of a task. The Progress component renders a progress bar that communicates how far a task has advanced toward completion, such as a file upload, installation status, or form completion.

## Overview

The Progress component displays the completion status of a task. The value only increases as the task progresses toward completion, distinguishing it from a meter (which displays a static measurement within a known range that can fluctuate up and down).

**When to use it:**

- File uploads, downloads, or installations where the value advances toward a goal.
- Multi-step form completion or onboarding progress.
- Any task where the value monotonically increases toward completion.

**When not to use it:**

- Displaying a measurement that fluctuates (CPU usage, battery level, volume). Use the [Meter](./meter.md) component instead.
- Showing step position in a discrete sequence without a continuous range. Consider a Stepper component.

**Features:**

- **Determinate & Indeterminate States** — Set `value` to a number for a determinate bar, or `null` for an indeterminate bar when the completion amount is unknown.
- **Customizable Range** — Configure `min` and `max` to match any scale, not just 0–100.
- **Accessible by Default** — Renders the correct ARIA `progressbar` role with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext` attributes.
- **Render Delegation** — Use the `child` snippet to render your own element while preserving behavior and accessibility.

## Component Structure

The Progress component consists of a single primitive:

| Part | Element | Role |
|------|---------|------|
| `Progress.Root` | `<div>` | The progress bar container. Manages value, min/max range, and exposes state via data attributes. Renders the ARIA `progressbar` role. |

```svelte
<script lang="ts">
  import { Progress } from "bits-ui";
</script>

<Progress.Root value={50} max={100} />
```

The root renders a `<div>` with the `progressbar` role. To visually fill the bar, place a child element inside and size it based on `value` — Bits UI does not render a built-in indicator element, giving you full control over the visual presentation.

## API Reference

### Progress.Root

The progress bar component. Renders a `<div>` with the ARIA `progressbar` role and manages the current value, minimum, and maximum.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number \| null` | `0` | The current value of the progress bar. Set to `null` to render an indeterminate progress bar (used when the completion amount is unknown). |
| `max` | `number` | `100` | The maximum value of the progress bar. |
| `min` | `number` | `0` | The minimum value of the progress bar. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. Typically a child element styled as the filled portion of the bar. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

## Data Attributes

State and identity are exposed via `data-*` attributes on the root element. Use these for CSS targeting and state-based styling.

### Progress.Root

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-value` | `''` | The current value of the progress bar. |
| `data-state` | `'indeterminate' \| 'determinate'` | The current state of the progress bar. `'indeterminate'` when `value` is `null`, otherwise `'determinate'`. |
| `data-min` | `''` | The minimum value of the progress bar. |
| `data-max` | `''` | The maximum value of the progress bar. |
| `data-indeterminate` | `''` | Present when the `value` is `null` (indeterminate state). Absent in determinate state. |
| `data-progress-root` | `''` | Present on the root element. Use this for scoped styling. |

## CSS Variables

The Progress component does not expose any `--bits-*` CSS variables. Use the `data-state` and `data-indeterminate` attributes for state-based styling instead.

## Examples

### Determinate Progress Bar

A determinate progress bar shows the exact completion amount. Set `value` to a number between `min` and `max`.

```svelte
<script lang="ts">
  import { Progress } from "bits-ui";

  let value = $state(33);
</script>

<div class="w-[60%]">
  <div class="mb-2 flex items-center justify-between text-sm font-medium">
    <span>Uploading file...</span>
    <span>{value}%</span>
  </div>
  <Progress.Root
    value={value}
    max={100}
    class="bg-muted relative h-[15px] w-full overflow-hidden rounded-full"
  >
    <div
      class="bg-foreground h-full rounded-full transition-transform duration-300"
      style={`transform: translateX(-${100 - (100 * (value ?? 0)) / (100)}%)`}
    ></div>
  </Progress.Root>
</div>
```

### Indeterminate Progress Bar

An indeterminate progress bar is used when the completion amount is unknown. Set `value` to `null` and style the indicator with an animation using the `data-indeterminate` attribute.

```svelte
<script lang="ts">
  import { Progress } from "bits-ui";
</script>

<Progress.Root
  value={null}
  max={100}
  class="bg-muted relative h-[15px] w-full overflow-hidden rounded-full"
>
  <div
    class="bg-foreground h-full w-1/3 animate-pulse rounded-full"
  ></div>
</Progress.Root>
```

### Animated Progress with Tween

Use Svelte's `Tween` to animate the value smoothly toward a target.

```svelte
<script lang="ts">
  import { Progress } from "bits-ui";
  import { onMount } from "svelte";
  import { cubicInOut } from "svelte/easing";
  import { Tween } from "svelte/motion";

  const tween = new Tween(13, { duration: 1000, easing: cubicInOut });
  const labelId = $props.id();

  onMount(() => {
    const timer = setTimeout(() => tween.set(66), 500);
    return () => {
      clearTimeout(timer);
    };
  });
</script>

<div class="flex w-[60%] flex-col gap-2">
  <div class="flex items-center justify-between text-sm font-medium">
    <span id={labelId}>Uploading file...</span>
    <span>{Math.round(tween.current)}%</span>
  </div>
  <Progress.Root
    aria-labelledby={labelId}
    value={Math.round(tween.current)}
    max={100}
    class="bg-muted relative h-[15px] w-full overflow-hidden rounded-full"
  >
    <div
      class="bg-foreground h-full w-full flex-1 rounded-full"
      style={`transform: translateX(-${100 - (100 * (tween.current ?? 0)) / 100}%)`}
    ></div>
  </Progress.Root>
</div>
```

### Reusable Component Wrapper

Create a reusable progress component to maintain consistent styling, labeling, and accessibility across your application.

**MyProgress.svelte**

```svelte
<script lang="ts">
  import { Progress, useId } from "bits-ui";
  import type { ComponentProps } from "svelte";

  let {
    max = 100,
    value = 0,
    min = 0,
    label,
    valueLabel,
  }: ComponentProps<typeof Progress.Root> & {
    label: string;
    valueLabel: string;
  } = $props();

  const labelId = useId();
</script>

<div>
  <span id={labelId}>{label}</span>
  <span>{valueLabel}</span>
</div>

<Progress.Root
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
  import MyProgress from "$lib/components/MyProgress.svelte";

  let value = $state(50);
</script>

<MyProgress label="Loading images..." valueLabel="{value}%" {value} />
```

### With Child Snippet (Render Delegation)

Use the `child` snippet to render your own element while preserving all internal props (ARIA attributes, data attributes).

```svelte
<script lang="ts">
  import { Progress } from "bits-ui";
</script>

<Progress.Root value={50} max={100}>
  {#snippet child({ props })}
    <div
      {...props}
      class="bg-muted relative h-[15px] w-full overflow-hidden rounded-full"
    >
      <div
        class="bg-foreground h-full rounded-full"
        style="width: 50%"
      ></div>
    </div>
  {/snippet}
</Progress.Root>
```

### Custom Min/Max Range

The `min` and `max` props let you use any numeric scale, not just 0–100.

```svelte
<script lang="ts">
  import { Progress } from "bits-ui";

  // Progress through a 12-step process
  let step = $state(4);
</script>

<Progress.Root
  value={step}
  min={0}
  max={12}
  class="bg-muted relative h-[15px] w-full overflow-hidden rounded-full"
>
  <div
    class="bg-foreground h-full rounded-full"
    style={`width: ${(step / 12) * 100}%`}
  ></div>
</Progress.Root>
```

## Accessibility

The Progress component renders with the ARIA `progressbar` role and automatically manages the following attributes:

| Attribute | Description |
|-----------|-------------|
| `role="progressbar"` | Identifies the element as a progress bar to assistive technology. |
| `aria-valuenow` | Set to the current `value`. Omitted when `value` is `null` (indeterminate). |
| `aria-valuemin` | Set to the `min` value. |
| `aria-valuemax` | Set to the `max` value. |
| `aria-valuetext` | Optional. Provide a human-readable text alternative via the `aria-valuetext` prop (e.g., `"4 of 12 files uploaded"`). |

**Labeling the progress bar:**

- If a visual label is present, pass its element ID to `Progress.Root` via the `aria-labelledby` prop so screen readers announce the label alongside the progress value.
- If no visual label is present, use the `aria-label` prop to provide a text description of what the progress bar represents.

```svelte
<!-- With a visible label -->
<span id="upload-label">Uploading file...</span>
<Progress.Root aria-labelledby="upload-label" value={50} max={100} />

<!-- Without a visible label -->
<Progress.Root aria-label="File upload progress" value={50} max={100} />
```

## Tips

- **Use `null` for unknown progress.** When you cannot determine the completion amount (e.g., a server request with no length info), set `value={null}` to render an indeterminate bar. Style the indicator with an animation and target `data-[indeterminate]` for state-specific CSS.
- **Style with `data-state`.** Target `data-[state=determinate]` and `data-[state=indeterminate]` on the root to apply different visual treatments — for example, a smooth fill transition for determinate and a pulsing animation for indeterminate.
- **You render the indicator.** Bits UI does not render a built-in fill/indicator element. Place a child `<div>` inside `Progress.Root` and size it (via `width` or `transform`) based on the current `value` to create the visual fill.
- **Provide `aria-valuetext` for clarity.** A raw percentage is not always meaningful. Set `aria-valuetext` to a descriptive string like `"4 of 12 images uploaded"` so screen reader users get context beyond the number.
- **Animate with `Tween`.** For smooth value transitions (e.g., simulated uploads), drive `value` from a Svelte `Tween` instead of setting it directly. This produces a polished easing effect.
- **Build a reusable wrapper.** Wrap `Progress.Root` in a custom component that accepts `label` and `valueLabel` props, generates a label ID with `useId()`, and wires up `aria-labelledby` and `aria-valuetext` automatically. This keeps accessibility consistent across every usage.
- **Choose Progress vs. Meter carefully.** Progress is for tasks that advance toward completion (value only increases). Meter is for measurements that fluctuate (value goes up and down). Using the wrong one confuses assistive technology users.
