# Time Range Field

An accessible component that enables users to input a range of times (a start time and an end time) within a designated field. The `TimeRangeField` combines two [Time Field](./time-field.md) components into a single range input whose individual time segments (hour, minute, second, day period, time zone) can be navigated and edited independently with the keyboard. It is built on top of the `@internationalized/date` library and uses that package's `TimeValue` types for all time values.

---

## Overview

The `TimeRangeField` component provides a flexible, customizable way to enter a time range within a designated field. Rather than two opaque inputs, each side of the range is broken into discrete, editable segments that users can step through and modify individually.

All time values passed to and received from the component are instances of `@internationalized/date` types. The `value`, `placeholder`, `minValue`, and `maxValue` props accept a `TimeValue`, which is the union:

```ts
import type {
  Time,
  CalendarDateTime,
  ZonedDateTime,
} from "@internationalized/date";

type TimeValue = Time | CalendarDateTime | ZonedDateTime;
```

- **`Time`** — a time with no date component (e.g. `12:30:00`). The typical choice for a pure time range field.
- **`CalendarDateTime`** — a date with a time but no timezone. Usable when a date context is also needed.
- **`ZonedDateTime`** — a date with a time and an explicit timezone. Used when timezone awareness is required.

The `value` prop accepts a `TimeRange` object:

```ts
type TimeRange = {
  start: TimeValue | undefined;
  end: TimeValue | undefined;
};
```

The type of `TimeValue` used (driven by the `placeholder` or `value`) determines which segments each side of the field renders. See the [Tips](#tips) section for notes on immutability and time types.

---

## Component Structure

The `TimeRangeField` is composed of four parts:

| Part                      | Element            | Purpose                                                                                  |
| ------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `TimeRangeField.Root`     | `<div>` (implicit) | Root context provider. Holds state, validation, and configuration for both sides.        |
| `TimeRangeField.Label`    | `<span>`           | Accessible label for the field.                                                          |
| `TimeRangeField.Input`    | `<div>`            | Container that renders the editable segments for one side (`start` or `end`).            |
| `TimeRangeField.Segment`  | `<span>`           | A single editable segment (hour, minute, second, etc.) or a literal separator.           |

Minimal structure:

```svelte
<script lang="ts">
  import { TimeRangeField } from "bits-ui";
</script>

<TimeRangeField.Root>
  <TimeRangeField.Label>Working Hours</TimeRangeField.Label>
  {#each ["start", "end"] as const as type}
    <TimeRangeField.Input {type}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <TimeRangeField.Segment {part}>
            {value}
          </TimeRangeField.Segment>
        {/each}
      {/snippet}
    </TimeRangeField.Input>
  {/each}
</TimeRangeField.Root>
```

Because the field represents a range, you render **two** `TimeRangeField.Input` components — one with `type="start"` and one with `type="end"`. Each `Input` exposes a `children` snippet whose props include a `segments` array. Each entry has `part` (a `TimeSegmentPart`) and `value` (a pre-formatted `string`). You iterate over this array and render a `TimeRangeField.Segment` for each, forwarding the `part` and displaying `value`.

A separator between the two sides (e.g. the word "to") is typically rendered by your own markup between the two `Input` components.

---

## API Reference

### TimeRangeField.Root

The root time range field component. Provides context to all child parts and manages `value`, `placeholder`, validation, and formatting for both the start and end sides.

| Property              | Type                                                                                                                                                                       | Default   | Description                                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`               | `TimeRange` — `{ start: TimeValue \| undefined; end: TimeValue \| undefined }` — **bindable**                                                                              | undefined | The selected time range.                                                                                                                                                                        |
| `onValueChange`       | `(value: TimeRange) => void`                                                                                                                                               | undefined | A function called when the selected time range changes.                                                                                                                                         |
| `placeholder`         | `TimeValue` ( `Time` \| `CalendarDateTime` \| `ZonedDateTime` ) — **bindable**                                                                                             | undefined | The placeholder time, used to determine what time to start the segments from when no value exists. Also sets the type of `TimeValue` used by the field.                                          |
| `onPlaceholderChange` | `(value: TimeValue) => void`                                                                                                                                               | undefined | A function called when the placeholder time changes.                                                                                                                                            |
| `errorMessageId`      | `string`                                                                                                                                                                   | undefined | The `id` of the element which contains the error messages for the field when the time is invalid. Used to wire up `aria-describedby`.                                                           |
| `validate`            | `(time: TimeValue) => string[] \| string \| void`                                                                                                                          | undefined | A function that returns whether a time is valid. Return a string or array of strings as validation errors, or `undefined`/nothing if valid.                                                      |
| `onInvalid`           | `(reason: 'min' \| 'max' \| 'custom', msg?: string \| string[]) => void`                                                                                                   | undefined | Callback fired when the field's value is invalid. `reason` indicates whether the invalidation came from `minValue`, `maxValue`, or the custom `validate` function. `msg` carries the error(s).   |
| `minValue`            | `TimeValue` ( `Time` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                            | undefined | The minimum valid time that can be entered. Values below this mark the field invalid.                                                                                                           |
| `maxValue`            | `TimeValue` ( `Time` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                            | undefined | The maximum valid time that can be entered. Values beyond this mark the field invalid.                                                                                                          |
| `granularity`         | `'hour' \| 'minute' \| 'second'`                                                                                                                                           | `'minute'`| The granularity to use for formatting the field. The field renders segments for each part of the time up to and including the specified granularity.                                            |
| `hideTimeZone`        | `boolean`                                                                                                                                                                  | `false`   | Whether to hide the time zone segment of the field. Only applies when using a `ZonedDateTime` as the `value`/`placeholder`.                                                                     |
| `hourCycle`           | `'12' \| '24'`                                                                                                                                                             | undefined | The hour cycle to use for formatting times. Defaults to the locale preference.                                                                                                                  |
| `locale`              | `string`                                                                                                                                                                   | `en-US`   | The locale to use for formatting times. Affects segment order, separators, and display.                                                                                                         |
| `disabled`            | `boolean`                                                                                                                                                                  | `false`   | Whether the field is disabled.                                                                                                                                                                  |
| `readonly`            | `boolean`                                                                                                                                                                  | `false`   | Whether the field is readonly.                                                                                                                                                                  |
| `readonlySegments`    | `EditableTimeSegmentPart[]` ( `"hour" \| "minute" \| "second" \| "dayPeriod"` )                                                                                            | undefined | An array of segments that should be readonly, preventing user input on them.                                                                                                                    |
| `required`            | `boolean`                                                                                                                                                                  | `false`   | Whether the field is required.                                                                                                                                                                  |
| `onStartValueChange`  | `(value: TimeValue \| undefined) => void`                                                                                                                                  | undefined | A function called when the start time changes.                                                                                                                                                  |
| `onEndValueChange`    | `(value: TimeValue \| undefined) => void`                                                                                                                                  | undefined | A function called when the end time changes.                                                                                                                                                    |
| `ref`                 | `HTMLDivElement` — **bindable**                                                                                                                                            | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                      |
| `children`            | `Snippet`                                                                                                                                                                  | undefined | The children content to render.                                                                                                                                                                 |
| `child`               | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                  | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                         |

> **Bindable props:** `value`, `placeholder`, and `ref` support `bind:`. For fully controlled state, use Svelte [Function Bindings](https://svelte.dev/docs/svelte/bind#Function-bindings) (e.g. `bind:value={getValue, setValue}`).

### TimeRangeField.Input

The container for the segments of one side of the time range field. It iterates over the resolved segments and exposes them via its `children` snippet. You must set `type` to either `"start"` or `"end"`.

| Property   | Type                                                                                                                                                                       | Default   | Description                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`     | `'start' \| 'end'` — **required**                                                                                                                                          | undefined | The type of field to render (start or end).                                                                                                                 |
| `name`     | `string`                                                                                                                                                                   | undefined | The name of the time field used for form submission. If provided, a hidden input element is rendered alongside the time field.                              |
| `ref`      | `HTMLDivElement` — **bindable**                                                                                                                                            | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                  |
| `children` | `Snippet` with props `{ segments: Array<{ part: TimeSegmentPart; value: string }> }`                                                                                       | undefined | The children content to render. Receives the array of segments to render.                                                                                   |
| `child`    | `Snippet` with props `{ props: Record<string, unknown>; segments: Array<{ part: TimeSegmentPart; value: string }> }`                                                       | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |

### TimeRangeField.Segment

A single segment of the time field. Renders one editable part of the time (or a literal separator).

| Property   | Type                                                                                                                                                                       | Default   | Description                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `part`     | `TimeSegmentPart` ( `"hour" \| "minute" \| "second" \| "dayPeriod" \| "timeZoneName" \| "literal"` ) — **required**                                                        | undefined | The part of the time to render.                                                                                                               |
| `ref`      | `HTMLSpanElement` — **bindable**                                                                                                                                           | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                   |
| `children` | `Snippet`                                                                                                                                                                  | undefined | The children content to render. Typically the `value` string from the parent segment loop.                                                   |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                 | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### TimeRangeField.Label

The accessible label for the time range field.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLSpanElement` — **bindable**                                      | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                   |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

---

## Data Attributes

### TimeRangeField.Root

| Data Attribute               | Value | Description                  |
| ---------------------------- | ----- | ---------------------------- |
| `data-time-range-field-root` | `''`  | Present on the root element. |

### TimeRangeField.Input

| Data Attribute          | Value | Description                                         |
| ----------------------- | ----- | --------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.   |
| `data-disabled`         | `''`  | Present on the element when the field is disabled.  |
| `data-time-field-input` | `''`  | Present on the element.                             |

### TimeRangeField.Segment

| Data Attribute            | Value                                                                                 | Description                                       |
| ------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `data-invalid`            | `''`                                                                                  | Present on the element when the field is invalid. |
| `data-disabled`           | `''`                                                                                  | Present on the element when the field is disabled.|
| `data-segment`            | `'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'`        | The type of segment the element represents.       |
| `data-time-field-segment` | `''`                                                                                  | Present on the element.                           |

### TimeRangeField.Label

| Data Attribute          | Value | Description                                         |
| ----------------------- | ----- | --------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.   |
| `data-time-field-label` | `''`  | Present on the element.                             |

---

## CSS Variables

The official Bits UI documentation for the Time Range Field component does not define any component-specific `--bits-*` CSS variables. Styling is driven entirely through props, data attributes (e.g. `data-invalid`, `data-disabled`, `data-segment`), and the standard `class` attribute on each part.

Use the data attributes above as selectors for state-based styling, and use `aria-[valuetext=Empty]` to target segments with no value set.

---

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { TimeRangeField } from "bits-ui";
</script>

<TimeRangeField.Root>
  <TimeRangeField.Label>Working Hours</TimeRangeField.Label>
  {#each ["start", "end"] as const as type}
    <TimeRangeField.Input {type}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <TimeRangeField.Segment {part}>
            {value}
          </TimeRangeField.Segment>
        {/each}
      {/snippet}
    </TimeRangeField.Input>
  {/each}
</TimeRangeField.Root>
```

### Styled with a Separator

This mirrors the official demo, rendering a "to" separator between the two sides and styling literal segments differently from editable ones.

```svelte
<script lang="ts">
  import { TimeRangeField } from "bits-ui";
</script>

<TimeRangeField.Root class="group flex w-full max-w-[320px] flex-col gap-1.5">
  <TimeRangeField.Label class="block select-none text-sm font-medium">
    Hotel dates
  </TimeRangeField.Label>
  <div
    class="h-input rounded-input border-border-input bg-background text-foreground focus-within:border-border-input-hover focus-within:shadow-date-field-focus hover:border-border-input-hover group-data-invalid:border-destructive flex w-full select-none items-center border px-2 py-3 text-sm tracking-[0.01em]"
  >
    {#each ["start", "end"] as const as type (type)}
      <TimeRangeField.Input {type}>
        {#snippet children({ segments })}
          {#each segments as { part, value }, i (part + i)}
            <div class="inline-block select-none">
              {#if part === "literal"}
                <TimeRangeField.Segment
                  {part}
                  class="text-muted-foreground p-1"
                >
                  {value}
                </TimeRangeField.Segment>
              {:else}
                <TimeRangeField.Segment
                  {part}
                  class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
                >
                  {value}
                </TimeRangeField.Segment>
              {/if}
            </div>
          {/each}
        {/snippet}
      </TimeRangeField.Input>
      {#if type === "start"}
        <div aria-hidden="true" class="text-muted-foreground pl-1 pr-2">to</div>
      {/if}
    {/each}
  </div>
</TimeRangeField.Root>
```

### Controlled Value (Two-Way Binding)

Use `bind:value` for simple, automatic state synchronization. The `value` is a `TimeRange` object whose `start` and `end` are `TimeValue` instances.

```svelte
<script lang="ts">
  import { TimeRangeField, type TimeRange } from "bits-ui";
  import { Time } from "@internationalized/date";

  let myValue = $state<TimeRange>({
    start: new Time(12, 30),
    end: new Time(12, 30),
  });
</script>

<button
  onclick={() => {
    myValue = {
      start: myValue.start.add({ hours: 1 }),
      end: myValue.end.add({ hours: 1 }),
    };
  }}
>
  Add 1 hour
</button>

<TimeRangeField.Root bind:value={myValue}>
  <!-- ... -->
</TimeRangeField.Root>
```

### Fully Controlled Value (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes.

```svelte
<script lang="ts">
  import { TimeRangeField, type TimeRange } from "bits-ui";

  let myValue = $state<TimeRange | undefined>({
    start: undefined,
    end: undefined,
  });

  function getValue() {
    return myValue;
  }
  function setValue(newValue: TimeRange | undefined) {
    myValue = newValue;
  }
</script>

<TimeRangeField.Root bind:value={getValue, setValue}>
  <!-- ... -->
</TimeRangeField.Root>
```

### Controlled Placeholder (Two-Way Binding)

Use `bind:placeholder` for simple, automatic state synchronization. The placeholder determines the starting point when no value exists and sets the `TimeValue` type used by the field.

```svelte
<script lang="ts">
  import { TimeRangeField } from "bits-ui";
  import { Time } from "@internationalized/date";

  let myPlaceholder = $state(new Time(12, 30));
</script>

<TimeRangeField.Root bind:placeholder={myPlaceholder}>
  <!-- ... -->
</TimeRangeField.Root>
```

### Fully Controlled Placeholder (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the placeholder state's reads and writes.

```svelte
<script lang="ts">
  import { TimeRangeField, type TimeValue } from "bits-ui";
  import { Time } from "@internationalized/date";

  let myPlaceholder = $state(new Time(12, 30));

  function getPlaceholder() {
    return myPlaceholder;
  }
  function setPlaceholder(newPlaceholder: TimeValue) {
    myPlaceholder = newPlaceholder;
  }
</script>

<TimeRangeField.Root bind:placeholder={getPlaceholder, setPlaceholder}>
  <!-- ... -->
</TimeRangeField.Root>
```

### Validation (Min / Max / Custom)

```svelte
<script lang="ts">
  import { TimeRangeField } from "bits-ui";
  import { Time, type TimeValue } from "@internationalized/date";

  const minValue = new Time(9, 0);
  const maxValue = new Time(17, 0);

  function validate(time: TimeValue) {
    return time.minute === 30
      ? "Times cannot end on the half hour"
      : undefined;
  }

  function onInvalid(
    reason: "min" | "max" | "custom",
    msg?: string | string[]
  ) {
    if (reason === "custom") {
      if (typeof msg === "string") {
        console.log(msg);
      } else if (Array.isArray(msg)) {
        console.log(msg);
      } else {
        console.log("The time is invalid");
      }
    } else if (reason === "min") {
      console.log("The time is too early.");
    } else if (reason === "max") {
      console.log("The time is too late.");
    }
  }
</script>

<TimeRangeField.Root {minValue} {maxValue} {validate} {onInvalid}>
  <!-- ... -->
</TimeRangeField.Root>
```

### Granularity

Control which time segments are rendered by setting `granularity`.

```svelte
<script lang="ts">
  import { TimeRangeField } from "bits-ui";
  import { Time } from "@internationalized/date";

  const placeholder = new Time(12, 30, 0);
</script>

<!-- Renders hour + minute + second segments -->
<TimeRangeField.Root granularity="second" {placeholder}>
  <!-- ... -->
</TimeRangeField.Root>

<!-- Renders only the hour segment -->
<TimeRangeField.Root granularity="hour" {placeholder}>
  <!-- ... -->
</TimeRangeField.Root>
```

### Localization

```svelte
<script lang="ts">
  import { TimeRangeField } from "bits-ui";
</script>

<TimeRangeField.Root locale="de">
  <!-- ... -->
</TimeRangeField.Root>
```

### Hour Cycle

Force a 12-hour or 24-hour clock regardless of locale.

```svelte
<TimeRangeField.Root hourCycle="24">
  <!-- ... -->
</TimeRangeField.Root>
```

### Form Submission

Provide a `name` on each `Input` to render hidden inputs for form submission.

```svelte
<TimeRangeField.Root>
  {#each ["start", "end"] as const as type}
    <TimeRangeField.Input {type} name={`time-${type}`}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <TimeRangeField.Segment {part}>{value}</TimeRangeField.Segment>
        {/each}
      {/snippet}
    </TimeRangeField.Input>
  {/each}
</TimeRangeField.Root>
```

### Reusable Component (Recommended)

Build a wrapper component to reuse across your app.

```svelte
<!-- MyTimeRangeField.svelte -->
<script lang="ts">
  import { TimeRangeField, type WithoutChildrenOrChild } from "bits-ui";

  let {
    value = $bindable(),
    placeholder = $bindable(),
    ...restProps
  }: WithoutChildrenOrChild<TimeRangeField.RootProps> & {
    labelText: string;
    startName?: string;
    endName?: string;
  } = $props();
</script>

<TimeRangeField.Root bind:value bind:placeholder {...restProps}>
  <TimeRangeField.Label>{labelText}</TimeRangeField.Label>
  <div class="flex items-center">
    {#each ["start", "end"] as const as type (type)}
      <TimeRangeField.Input {type} name={type === "start" ? startName : endName}>
        {#snippet children({ segments })}
          {#each segments as { part, value }, i (part + i)}
            <div class="inline-block select-none">
              {#if part === "literal"}
                <TimeRangeField.Segment {part} class="text-muted-foreground p-1">
                  {value}
                </TimeRangeField.Segment>
              {:else}
                <TimeRangeField.Segment
                  {part}
                  class="px-1 py-1 hover:bg-muted focus:bg-muted data-invalid:text-destructive"
                >
                  {value}
                </TimeRangeField.Segment>
              {/if}
            </div>
          {/each}
        {/snippet}
      </TimeRangeField.Input>
      {#if type === "start"}
        <div aria-hidden="true" class="text-muted-foreground px-2">to</div>
      {/if}
    {/each}
  </div>
</TimeRangeField.Root>
```

---

## Accessibility

The `TimeRangeField` is designed for full keyboard interaction. Each segment is a focusable element and users navigate between and within segments using the following keys. Navigation flows through the start field's segments first, then the end field's segments.

### Keyboard Navigation

| Key                            | Action                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| `Tab`                          | Moves focus to the next segment (or out of the field).                    |
| `Shift` + `Tab`                | Moves focus to the previous segment (or out of the field).                |
| `Arrow Left`                   | Moves focus to the previous segment.                                      |
| `Arrow Right`                  | Moves focus to the next segment.                                          |
| `Arrow Up`                     | Increments the value of the focused segment.                              |
| `Arrow Down`                   | Decrements the value of the focused segment.                              |
| `0`–`9` (numeric keys)         | Type digits directly into the focused segment to set its value.           |
| `Backspace`                    | Deletes the last typed digit within the focused segment.                  |
| `A` / `P`                      | When focused on a `dayPeriod` (AM/PM) segment, toggles between AM and PM. |
| `Home`                         | Sets the focused segment to its minimum value.                            |
| `End`                          | Sets the focused segment to its maximum value.                            |
| `Page Up`                      | Increments the segment by a larger step (e.g. +1 hour for hour segment).  |
| `Page Down`                    | Decrements the segment by a larger step (e.g. -1 hour for hour segment).  |

### Segments

A segment is an individual editable part of the time, such as the hour, minute, second, or day period (AM/PM). Segments are rendered based on the `granularity` and the type of `TimeValue` in use. When a `ZonedDateTime` is used, a `timeZoneName` segment is also rendered (unless `hideTimeZone` is set).

In addition to editable segments, `"literal"` segments represent separators (e.g. `:`) that appear between parts of the time. Literal segments vary by `locale` and are not editable. Style them differently (as shown in the examples) so they don't appear interactive.

The `data-segment` attribute on each `TimeRangeField.Segment` exposes which part is being rendered, enabling targeted styling per segment type:

```css
[data-segment="hour"]      { /* ... */ }
[data-segment="minute"]    { /* ... */ }
[data-segment="second"]    { /* ... */ }
[data-segment="dayPeriod"] { /* ... */ }
```

---

## Tips

### Use the Right `TimeValue` Type

The type of object you pass as `value` or `placeholder` controls which segments each side of the field renders:

- **`Time`** — time only (`HH:MM:SS`). The typical choice for a pure time range field. No date or timezone segments are rendered.
- **`CalendarDateTime`** — date + time, no timezone. Usable when a date context is also needed alongside the time.
- **`ZonedDateTime`** — date + time + timezone. Use when timezone awareness matters. Renders a `timeZoneName` segment unless `hideTimeZone` is `true`.

The `placeholder` sets the starting point when there is no `value` and determines the `TimeValue` type used by the field. To enable timezone selection, set the placeholder to a `ZonedDateTime`.

### `placeholder` Is Not Placeholder Text

The `placeholder` prop is the time the field starts from when the user begins cycling segments — it is **not** greyed-out hint text. It also doubles as the mechanism for setting the field's `TimeValue` type and thus which segments are rendered.

### Immutability of `@internationalized/date` Objects

All `TimeValue` objects from `@internationalized/date` are **immutable**. Mutating methods return new instances rather than modifying the original. Always reassign the result:

```ts
// Correct — reassign the new instance
myValue.start = myValue.start.add({ hours: 1 });
myValue.start = myValue.start.set({ minute: 0 });

// Incorrect — the original is unchanged, this does nothing useful
myValue.start.add({ hours: 1 });
```

For a `TimeRange` value, replace the whole object (or its `start`/`end` fields) so that reactivity triggers:

```ts
myValue = {
  start: myValue.start.add({ hours: 1 }),
  end: myValue.end.add({ hours: 1 }),
};
```

Common operations: `.add({ ... })`, `.subtract({ ... })`, `.set({ ... })`, `.with({ ... })`.

### Granularity Defaults

The default `granularity` is `'minute'`, meaning the field renders hour and minute segments. Set `granularity="second"` to also render a second segment, or `granularity="hour"` to render only the hour.

### Readonly Segments

Use the `readonlySegments` prop on `TimeRangeField.Root` to make specific segments non-editable while keeping others interactive. This is useful when part of the time should be fixed (e.g. a fixed minute of `00`) while the rest remains user-editable. `readonlySegments` accepts the editable segment parts: `"hour"`, `"minute"`, `"second"`, and `"dayPeriod"`.

### Start and End Value Change Callbacks

In addition to `onValueChange`, the component exposes `onStartValueChange` and `onEndValueChange` callbacks that fire when only the start or end side changes. Use these when you need to react to changes on a single side of the range independently.
