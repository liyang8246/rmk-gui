# Time Field

An accessible alternative to the native `<input type="time">` element. The `TimeField` component renders a composed text field whose individual time segments (hour, minute, second, day period, etc.) can be navigated and edited independently with the keyboard. It is built on top of the `@internationalized/date` library and uses that package's `TimeValue` types for all time values.

---

## Overview

The `TimeField` component provides a flexible, customizable way to enter times within a designated field. Rather than a single opaque input, the field is broken into discrete, editable segments that users can step through and modify individually.

All time values passed to and received from the component are instances of `@internationalized/date` types. The `value` and `placeholder` props accept a `TimeValue`, which is the union:

```ts
import type {
  Time,
  CalendarDateTime,
  ZonedDateTime,
} from "@internationalized/date";

type TimeValue = Time | CalendarDateTime | ZonedDateTime;
```

- **`Time`** — a time with no date component (e.g. `12:30:00`). Used when only a time is needed. The default granularity is `'minute'`.
- **`CalendarDateTime`** — a date with a time but no timezone (e.g. `2024-08-03T12:30:00`). Used when a date + time is needed; the field renders only the time segments.
- **`ZonedDateTime`** — a date with a time and an explicit timezone (e.g. `2024-08-03T12:30:00-04:00[America/New_York]`). Used when timezone awareness is required, and the field can render a `timeZoneName` segment.

The type of `TimeValue` used (driven by the `placeholder` or `value`) determines which segments the field renders. See the [Tips](#tips) section for notes on immutability and parsing helpers.

---

## Component Structure

The `TimeField` is composed of four parts:

| Part                  | Element            | Purpose                                                                 |
| --------------------- | ------------------ | ----------------------------------------------------------------------- |
| `TimeField.Root`      | `<div>` (implicit) | Root context provider. Holds state, validation, and configuration.      |
| `TimeField.Label`     | `<span>`           | Accessible label for the field.                                         |
| `TimeField.Input`     | `<div>`            | Container that renders the editable segments. Provides `segments`.      |
| `TimeField.Segment`   | `<div>`            | A single editable segment (hour, minute, second, etc.) or a literal.   |

Minimal structure:

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
</script>

<TimeField.Root>
  <TimeField.Label>Check-in time</TimeField.Label>
  <TimeField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <TimeField.Segment {part}>
          {value}
        </TimeField.Segment>
      {/each}
    {/snippet}
  </TimeField.Input>
</TimeField.Root>
```

The `TimeField.Input` exposes a `children` snippet whose props include a `segments` array. Each entry has `part` (a `TimeSegmentPart`) and `value` (a pre-formatted `string`). You iterate over this array and render a `TimeField.Segment` for each, forwarding the `part` and displaying `value`.

---

## API Reference

### TimeField.Root

The root time field component. Provides context to all child parts and manages `value`, `placeholder`, validation, and formatting.

| Property              | Type                                                                                                                                                                           | Default   | Description                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`               | `TimeValue` ( `Time` \| `CalendarDateTime` \| `ZonedDateTime` ) — **bindable**                                                                                                 | undefined | The selected time.                                                                                                                                                                                                                                           |
| `onValueChange`       | `(value: TimeValue) => void`                                                                                                                                                   | undefined | A function called when the selected time changes. The type of `value` is inferred from the `value` prop if provided.                                                                                                                                         |
| `placeholder`         | `TimeValue` ( `Time` \| `CalendarDateTime` \| `ZonedDateTime` ) — **bindable**                                                                                                 | undefined | The placeholder time, used to determine what time to start the segments from when no value exists. By default the placeholder is `12:00 AM` or `00:00` depending on the hour cycle.                                                                          |
| `onPlaceholderChange` | `(value: TimeValue) => void`                                                                                                                                                   | undefined | A function called when the placeholder time changes.                                                                                                                                                                                                         |
| `required`            | `boolean`                                                                                                                                                                      | `false`   | Whether the time field is required.                                                                                                                                                                                                                          |
| `validate`            | `(time: TimeValue) => string[] \| string \| void`                                                                                                                              | undefined | A function that returns whether a time is valid. Return a string or array of strings as validation errors, or `undefined`/nothing if valid.                                                                                                                  |
| `onInvalid`           | `(reason: 'min' \| 'max' \| 'custom', msg?: string \| string[]) => void`                                                                                                       | undefined | Callback fired when the value is invalid. `reason` indicates whether the invalidation came from the `minValue`, `maxValue`, or custom `validate` function. `msg` carries the error message(s) for custom validation.                                         |
| `errorMessageId`      | `string`                                                                                                                                                                       | undefined | The `id` of the element containing error messages for the field when the time is invalid. Used to wire up `aria-describedby`.                                                                                                                                |
| `hourCycle`           | `'12' \| '24'`                                                                                                                                                                 | undefined | The hour cycle to use for formatting times. Defaults to the locale preference.                                                                                                                                                                               |
| `granularity`         | `'hour' \| 'minute' \| 'second'`                                                                                                                                               | `'minute'`| The granularity to use for formatting the field. The field renders segments for each part of the time up to and including the specified granularity.                                                                                                         |
| `hideTimeZone`        | `boolean`                                                                                                                                                                      | `false`   | Whether to hide the time zone segment of the field. This only applies when using a `ZonedDateTime` as the `value` prop.                                                                                                                                      |
| `maxValue`            | `TimeValue` ( `Time` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                                | undefined | The maximum valid time that can be entered. Values beyond this mark the field invalid.                                                                                                                                                                       |
| `minValue`            | `TimeValue` ( `Time` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                                | undefined | The minimum valid time that can be entered. Values below this mark the field invalid.                                                                                                                                                                        |
| `locale`              | `string`                                                                                                                                                                       | `en-US`   | The locale to use for formatting times. Affects segment order, separators, hour cycle, and display.                                                                                                                                                          |
| `disabled`            | `boolean`                                                                                                                                                                      | `false`   | Whether the field is disabled.                                                                                                                                                                                                                               |
| `readonly`            | `boolean`                                                                                                                                                                      | `false`   | Whether the field is readonly.                                                                                                                                                                                                                               |
| `readonlySegments`    | `EditableTimeSegmentPart[]` ( `"hour" \| "minute" \| "second" \| "dayPeriod"` )                                                                                               | undefined | An array of segments that should be readonly, preventing user input on them.                                                                                                                                                                                 |
| `children`            | `Snippet`                                                                                                                                                                      | undefined | The children content to render.                                                                                                                                                                                                                              |

> **Bindable props:** `value` and `placeholder` support `bind:value` / `bind:placeholder`. For fully controlled state, use Svelte [Function Bindings](https://svelte.dev/docs/svelte/bind#Function-bindings) (e.g. `bind:value={getValue, setValue}`).

### TimeField.Input

The container for the segments of the time field. It iterates over the resolved segments and exposes them via its `children` snippet.

| Property   | Type                                                                                                                                                                      | Default   | Description                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | `string`                                                                                                                                                                  | undefined | The name of the time field used for form submission. If provided, a hidden input element is rendered alongside the time field.                              |
| `ref`      | `HTMLDivElement` — **bindable**                                                                                                                                           | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                  |
| `children` | `Snippet` with props `{ segments: Array<{ part: TimeSegmentPart; value: string }> }`                                                                                      | undefined | The children content to render. Receives the array of segments to render.                                                                                   |
| `child`    | `Snippet` with props `{ props: Record<string, unknown>; segments: Array<{ part: TimeSegmentPart; value: string }> }`                                                      | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |

### TimeField.Segment

A single segment of the time field. Renders one editable part of the time (or a literal separator).

| Property   | Type                                                                                                                                                                       | Default   | Description                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `part`     | `TimeSegmentPart` ( `"hour" \| "minute" \| "second" \| "dayPeriod" \| "timeZoneName" \| "literal"` ) — **required**                                                       | undefined | The part of the time to render.                                                                                                               |
| `ref`      | `HTMLDivElement` — **bindable**                                                                                                                                            | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                                                                                                                                  | undefined | The children content to render. Typically the `value` string from the parent segment loop.                                                   |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                 | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### TimeField.Label

The accessible label for the time field.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLSpanElement` — **bindable**                                      | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

---

## Data Attributes

### TimeField.Input

| Data Attribute          | Value | Description                                        |
| ----------------------- | ----- | -------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.  |
| `data-disabled`         | `''`  | Present on the element when the field is disabled. |
| `data-time-field-input` | `''`  | Present on the element.                            |

### TimeField.Segment

| Data Attribute            | Value                                                                                                                | Description                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `data-invalid`            | `''`                                                                                                                 | Present on the element when the field is invalid.             |
| `data-disabled`           | `''`                                                                                                                 | Present on the element when the field is disabled.            |
| `data-readonly`           | `''`                                                                                                                 | Present on the element when the field or segment is readonly. |
| `data-segment`            | `'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'`                                       | The part of the time being rendered.                          |
| `data-time-field-segment` | `''`                                                                                                                 | Present on the element.                                       |

### TimeField.Label

| Data Attribute          | Value | Description                                        |
| ----------------------- | ----- | -------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.  |
| `data-disabled`         | `''`  | Present on the element when the field is disabled. |
| `data-time-field-label` | `''`  | Present on the element.                            |

---

## CSS Variables

The official Bits UI documentation for the Time Field component does not define any component-specific `--bits-*` CSS variables. Styling is driven entirely through props, data attributes (e.g. `data-invalid`, `data-disabled`, `data-readonly`, `data-segment`), and the standard `class` attribute on each part.

Use the data attributes above as selectors for state-based styling, and use `aria-[valuetext=Empty]` to target segments with no value set.

---

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
</script>

<TimeField.Root>
  <TimeField.Label>Check-in time</TimeField.Label>
  <TimeField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <TimeField.Segment {part}>
          {value}
        </TimeField.Segment>
      {/each}
    {/snippet}
  </TimeField.Input>
</TimeField.Root>
```

### Controlled Value (Two-Way Binding)

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
  import { Time } from "@internationalized/date";

  let myValue = $state(new Time(12, 30));
</script>

<button onclick={() => (myValue = myValue.add({ hours: 1 }))}>
  Add 1 hour
</button>

<TimeField.Root bind:value={myValue}>
  <TimeField.Label>Appointment</TimeField.Label>
  <TimeField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <TimeField.Segment {part}>{value}</TimeField.Segment>
      {/each}
    {/snippet}
  </TimeField.Input>
</TimeField.Root>
```

### Fully Controlled Value (Function Binding)

```svelte
<script lang="ts">
  import { TimeField, type TimeValue } from "bits-ui";

  let myValue = $state<TimeValue>();

  function getValue() {
    return myValue;
  }
  function setValue(newValue: TimeValue | undefined) {
    myValue = newValue;
  }
</script>

<TimeField.Root bind:value={getValue, setValue}>
  <!-- ... -->
</TimeField.Root>
```

### Controlled Placeholder (Two-Way Binding)

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
  import { Time } from "@internationalized/date";

  let myPlaceholder = $state(new Time(12, 30));
</script>

<button onclick={() => (myPlaceholder = new Time(12, 30))}>
  Set placeholder to 12:30 PM
</button>

<TimeField.Root bind:placeholder={myPlaceholder}>
  <!-- ... -->
</TimeField.Root>
```

### Fully Controlled Placeholder (Function Binding)

```svelte
<script lang="ts">
  import { TimeField, type TimeValue } from "bits-ui";

  let myPlaceholder = $state<TimeValue>();

  function getPlaceholder() {
    return myPlaceholder;
  }
  function setPlaceholder(newPlaceholder: TimeValue) {
    myPlaceholder = newPlaceholder;
  }
</script>

<TimeField.Root bind:placeholder={getPlaceholder, setPlaceholder}>
  <!-- ... -->
</TimeField.Root>
```

### With Placeholder (Setting Type via Value)

Use a `Time` placeholder to display a plain time, or a `ZonedDateTime` placeholder to also include a timezone segment.

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
  import { Time, now } from "@internationalized/date";
</script>

<!-- Plain time -->
<TimeField.Root placeholder={new Time(12, 30)}>
  <TimeField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <TimeField.Segment {part}>{value}</TimeField.Segment>
      {/each}
    {/snippet}
  </TimeField.Input>
</TimeField.Root>

<!-- Time + timezone -->
<TimeField.Root placeholder={now("America/New_York")}>
  <TimeField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <TimeField.Segment {part}>{value}</TimeField.Segment>
      {/each}
    {/snippet}
  </TimeField.Input>
</TimeField.Root>
```

### Default Value from ISO String

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
  import { parseDateTime } from "@internationalized/date";

  // this came from a database/API call
  const date = "2024-08-03T15:15";
  let value = $state(parseDateTime(date));
</script>

<TimeField.Root {value}>
  <!-- ... -->
</TimeField.Root>
```

For `ZonedDateTime` values use `parseZonedDateTime` instead.

### Validation (Min / Max / Custom)

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
  import type { TimeValue } from "bits-ui";
  import { Time } from "@internationalized/date";

  const value = new Time(12, 30);

  function validate(time: TimeValue) {
    return time.hour === 12 ? "Time cannot be 12:00 PM" : undefined;
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

<!-- Minimum value -->
<TimeField.Root minValue={new Time(9, 0)} value={new Time(8, 0)}>
  <!-- ... -->
</TimeField.Root>

<!-- Maximum value -->
<TimeField.Root maxValue={new Time(17, 0)} value={new Time(18, 0)}>
  <!-- ... -->
</TimeField.Root>

<!-- Custom validation -->
<TimeField.Root {validate} {value} {onInvalid}>
  <!-- ... -->
</TimeField.Root>
```

### Granularity

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
  import { Time } from "@internationalized/date";

  const value = new Time(12, 30);
</script>

<TimeField.Root granularity="second" {value}>
  <!-- ... -->
</TimeField.Root>
```

### Localization

```svelte
<script lang="ts">
  import { TimeField } from "bits-ui";
  import { Time } from "@internationalized/date";
</script>

<TimeField.Root locale="de" value={new Time(13, 30, 0)}>
  <!-- ... -->
</TimeField.Root>
```

### Reusable Component (Recommended)

Build a wrapper component to reuse across your app.

```svelte
<!-- MyTimeField.svelte -->
<script lang="ts" module>
  import type { TimeValue } from "bits-ui";
  import type { Time } from "@internationalized/date";
  type T = unknown;
</script>

<script lang="ts" generics="T extends TimeValue = Time">
  import { TimeField, type WithoutChildrenOrChild } from "bits-ui";

  let {
    value = $bindable(),
    placeholder = $bindable(),
    labelText = "Select a time",
    ...restProps
  }: WithoutChildrenOrChild<TimeField.RootProps<T>> & {
    name?: string;
    labelText?: string;
  } = $props();
</script>

<TimeField.Root bind:value bind:placeholder {...restProps}>
  <TimeField.Label {name}>{labelText}</TimeField.Label>
  <TimeField.Input {name}>
    {#snippet children({ segments })}
      {#each segments as { part, value }, i (part + i)}
        <div class="inline-block select-none">
          {#if part === "literal"}
            <TimeField.Segment {part} class="text-muted-foreground p-1">
              {value}
            </TimeField.Segment>
          {:else}
            <TimeField.Segment
              {part}
              class="px-1 py-1 hover:bg-muted focus:bg-muted data-invalid:text-destructive"
            >
              {value}
            </TimeField.Segment>
          {/if}
        </div>
      {/each}
    {/snippet}
  </TimeField.Input>
</TimeField.Root>
```

---

## Accessibility

The `TimeField` is designed for full keyboard interaction. Each segment is a focusable element and users navigate between and within segments using the following keys.

### Keyboard Navigation

| Key                                  | Action                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `Tab`                                | Moves focus to the next segment (or out of the field).                    |
| `Shift` + `Tab`                      | Moves focus to the previous segment (or out of the field).                |
| `Arrow Left`                         | Moves focus to the previous segment.                                      |
| `Arrow Right`                        | Moves focus to the next segment.                                          |
| `Arrow Up`                           | Increments the value of the focused segment.                              |
| `Arrow Down`                         | Decrements the value of the focused segment.                              |
| `0`–`9` (numeric keys)               | Type digits directly into the focused segment to set its value.           |
| `Backspace`                          | Deletes the last typed digit within the focused segment.                  |
| `A` / `P`                            | When focused on a `dayPeriod` (AM/PM) segment, toggles between AM and PM. |
| `Home`                               | Sets the focused segment to its minimum value.                            |
| `End`                                | Sets the focused segment to its maximum value.                            |
| `Page Up`                            | Increments the segment by a larger step.                                  |
| `Page Down`                          | Decrements the segment by a larger step.                                  |

### Segments

A segment is an individual editable part of the time, such as the hour, minute, second, or day period (AM/PM). Segments are rendered based on the `granularity` and the type of `TimeValue` in use.

In addition to editable segments, `"literal"` segments represent separators (e.g. `:`, space, etc.) that appear between parts of the time. Literal segments vary by `locale` and are not editable. Style them differently (as shown in the examples) so they don't appear interactive.

The `data-segment` attribute on each `TimeField.Segment` exposes which part is being rendered, enabling targeted styling per segment type:

```css
[data-segment="hour"]      { /* ... */ }
[data-segment="minute"]    { /* ... */ }
[data-segment="second"]    { /* ... */ }
[data-segment="dayPeriod"] { /* ... */ }
```

---

## Tips

### Use the Right `TimeValue` Type

The type of object you pass as `value` or `placeholder` controls which segments the field renders:

- **`Time`** — time only (`HH:MM:SS`). Use when only a time is needed. Construct with `new Time(hour, minute, second?)`.
- **`CalendarDateTime`** — date + time, no timezone. The field renders only the time segments. Use `parseDateTime` to parse from an ISO string (e.g. `"2024-08-03T15:15"`).
- **`ZonedDateTime`** — date + time + timezone. Use when timezone awareness matters and you want a `timeZoneName` segment rendered. Use `parseZonedDateTime` to parse, or `now(timeZone)` for the current moment.

The `placeholder` sets the starting point when there is no `value`. To display a timezone segment, set the placeholder (or value) to a `ZonedDateTime`.

### `placeholder` Is Not Placeholder Text

The `placeholder` prop is the time the field starts from when the user begins cycling segments — it is **not** greyed-out hint text. By default it is `12:00 AM` or `00:00` depending on the hour cycle.

### Immutability of `@internationalized/date` Objects

All `TimeValue` objects from `@internationalized/date` are **immutable**. Mutating methods return new instances rather than modifying the original. Always reassign the result:

```ts
// Correct — reassign the new instance
myValue = myValue.add({ hours: 1 });
myValue = myValue.set({ minute: 45 });

// Incorrect — the original is unchanged, this does nothing useful
myValue.add({ hours: 1 });
```

Common operations: `.add({ ... })`, `.subtract({ ... })`, `.set({ ... })`, `.with({ ... })`.

### Parsing ISO 8601 Strings

When loading values from a database or API (typically ISO 8601 strings), parse them into the appropriate `TimeValue` before passing to the component:

| Function              | Input example                                   | Output type         |
| --------------------- | ----------------------------------------------- | ------------------- |
| `parseDateTime`       | `"2024-08-03T12:30:00"`                         | `CalendarDateTime`  |
| `parseZonedDateTime`  | `"2024-08-03T12:30:00-04:00[America/New_York]"` | `ZonedDateTime`     |
| `parseTime`           | `"12:30:00"`                                    | `Time`              |

### Granularity Controls Visible Segments

The `granularity` prop (`'hour'`, `'minute'`, or `'second'`, default `'minute'`) determines which time segments are rendered. The field renders segments for each part up to and including the specified granularity. Use `'second'` when you need second-level precision.

### Hour Cycle

The `hourCycle` prop (`'12'` or `'24'`) overrides the locale's default hour cycle. When unset, the field uses the locale preference (e.g. `en-US` defaults to 12-hour, `de` defaults to 24-hour). When using a 12-hour cycle, a `dayPeriod` (AM/PM) segment is rendered.

### Hiding the Time Zone

When using a `ZonedDateTime` as the value, the field renders a `timeZoneName` segment by default. Set `hideTimeZone` to `true` on `TimeField.Root` to suppress it.

### Readonly Segments

Use the `readonlySegments` prop on `TimeField.Root` to make specific segments non-editable while keeping others interactive. The accepted parts are `"hour"`, `"minute"`, `"second"`, and `"dayPeriod"`. This is useful when part of the time should be fixed while the rest remains user-editable.
