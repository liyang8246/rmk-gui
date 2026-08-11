# Date Field

An accessible alternative to the native `<input type="date">` element. The `DateField` component renders a composed text field whose individual date/time segments (month, day, year, hour, minute, etc.) can be navigated and edited independently with the keyboard. It is built on top of the `@internationalized/date` library and uses that package's `DateValue` types for all date values.

---

## Overview

The `DateField` component provides a flexible, customizable way to enter dates (and optionally times) within a designated field. Rather than a single opaque input, the field is broken into discrete, editable segments that users can step through and modify individually.

All date values passed to and received from the component are instances of `@internationalized/date` types. The `value` and `placeholder` props accept a `DateValue`, which is the union:

```ts
import type {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
} from "@internationalized/date";

type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime;
```

- **`CalendarDate`** — a date with no time component (e.g. `2024-08-03`). Used when only a date is needed. The field defaults to `'day'` granularity.
- **`CalendarDateTime`** — a date with a time but no timezone (e.g. `2024-08-03T12:30:00`). Used when a time is also needed.
- **`ZonedDateTime`** — a date with a time and an explicit timezone (e.g. `2024-08-03T12:30:00-04:00[America/New_York]`). Used when timezone awareness is required.

The type of `DateValue` used (driven by the `placeholder` or `value`) determines which segments the field renders. See the [Tips](#tips) section for notes on immutability and parsing helpers.

---

## Component Structure

The `DateField` is composed of four parts:

| Part                  | Element            | Purpose                                                                 |
| --------------------- | ------------------ | ----------------------------------------------------------------------- |
| `DateField.Root`      | `<div>` (implicit) | Root context provider. Holds state, validation, and configuration.      |
| `DateField.Label`     | `<span>`           | Accessible label for the field.                                         |
| `DateField.Input`     | `<div>`            | Container that renders the editable segments. Provides `segments`.      |
| `DateField.Segment`   | `<div>`            | A single editable segment (day, month, year, hour, etc.) or a literal. |

Minimal structure:

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
</script>

<DateField.Root>
  <DateField.Label>Check-in date</DateField.Label>
  <DateField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DateField.Segment {part}>
          {value}
        </DateField.Segment>
      {/each}
    {/snippet}
  </DateField.Input>
</DateField.Root>
```

The `DateField.Input` exposes a `children` snippet whose props include a `segments` array. Each entry has `part` (a `SegmentPart`) and `value` (a pre-formatted `string`). You iterate over this array and render a `DateField.Segment` for each, forwarding the `part` and displaying `value`.

---

## API Reference

### DateField.Root

The root date field component. Provides context to all child parts and manages `value`, `placeholder`, validation, and formatting.

| Property              | Type                                                                                                                                                                           | Default   | Description                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`               | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The selected date.                                                                                                                                                                                                                                                      |
| `onValueChange`       | `(date: DateValue) => void`                                                                                                                                                    | undefined | A function called when the date value changes.                                                                                                                                                                                                                          |
| `placeholder`         | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` ) — **bindable**                                                                                         | undefined | The placeholder date, used to determine what date to start the segments from when no value exists. Also sets the granularity/type of `DateValue` used.                                                                                                                  |
| `onPlaceholderChange` | `(date: DateValue) => void`                                                                                                                                                    | undefined | A function called when the placeholder date changes.                                                                                                                                                                                                                    |
| `required`            | `boolean`                                                                                                                                                                      | `false`   | Whether the date field is required.                                                                                                                                                                                                                                     |
| `validate`            | `(date: DateValue) => string[] \| string \| void`                                                                                                                              | undefined | A function that returns whether a date is valid. Return a string or array of strings as validation errors, or `undefined`/nothing if valid.                                                                                                                             |
| `onInvalid`           | `(reason: 'min' \| 'max' \| 'custom', msg?: string \| string[]) => void`                                                                                                       | undefined | Callback fired when the value is invalid. `reason` indicates whether the invalidation came from the `minValue`, `maxValue`, or custom `validate` function. `msg` carries the error message(s) for custom validation.                                                    |
| `errorMessageId`      | `string`                                                                                                                                                                       | undefined | The `id` of the element containing error messages for the field when the date is invalid. Used to wire up `aria-describedby`.                                                                                                                                           |
| `hourCycle`           | `'12' \| '24'`                                                                                                                                                                 | undefined | The hour cycle to use for formatting times. Defaults to the locale preference.                                                                                                                                                                                          |
| `granularity`         | `'day' \| 'hour' \| 'minute' \| 'second'`                                                                                                                                      | undefined | The granularity to use for formatting the field. Defaults to `'day'` if a `CalendarDate` is provided, otherwise defaults to `'minute'`. The field renders segments for each part of the date up to and including the specified granularity.                             |
| `hideTimeZone`        | `boolean`                                                                                                                                                                      | `false`   | Whether to hide the time zone segment of the field.                                                                                                                                                                                                                     |
| `maxValue`            | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The maximum valid date that can be entered. Values beyond this mark the field invalid.                                                                                                                                                                                  |
| `minValue`            | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The minimum valid date that can be entered. Values below this mark the field invalid.                                                                                                                                                                                   |
| `locale`              | `string`                                                                                                                                                                       | `en-US`   | The locale to use for formatting dates. Affects segment order, separators, and display.                                                                                                                                                                                |
| `disabled`            | `boolean`                                                                                                                                                                      | `false`   | Whether the field is disabled.                                                                                                                                                                                                                                          |
| `readonly`            | `boolean`                                                                                                                                                                      | `false`   | Whether the field is readonly.                                                                                                                                                                                                                                          |
| `readonlySegments`    | `EditableSegmentPart[]` ( `"day" \| "month" \| "year" \| "hour" \| "minute" \| "second" \| "dayPeriod"` )                                                                      | undefined | An array of segments that should be readonly, preventing user input on them.                                                                                                                                                                                            |
| `children`            | `Snippet`                                                                                                                                                                      | undefined | The children content to render.                                                                                                                                                                                                                                         |

> **Bindable props:** `value` and `placeholder` support `bind:value` / `bind:placeholder`. For fully controlled state, use Svelte [Function Bindings](https://svelte.dev/docs/svelte/bind#Function-bindings) (e.g. `bind:value={getValue, setValue}`).

### DateField.Input

The container for the segments of the date field. It iterates over the resolved segments and exposes them via its `children` snippet.

| Property  | Type                                                                                                                                                                      | Default   | Description                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`                                                                                                                                                                  | undefined | The name of the date field used for form submission. If provided, a hidden input element is rendered alongside the date field.                              |
| `ref`     | `HTMLDivElement` — **bindable**                                                                                                                                           | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                  |
| `children`| `Snippet` with props `{ segments: Array<{ part: SegmentPart; value: string }> }`                                                                                          | undefined | The children content to render. Receives the array of segments to render.                                                                                   |
| `child`   | `Snippet` with props `{ props: Record<string, unknown>; segments: Array<{ part: SegmentPart; value: string }> }`                                                          | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |

### DateField.Segment

A single segment of the date field. Renders one editable part of the date (or a literal separator).

| Property   | Type                                                                                                                                                                       | Default   | Description                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `part`     | `SegmentPart` ( `"day" \| "month" \| "year" \| "hour" \| "minute" \| "second" \| "dayPeriod" \| "timeZoneName" \| "literal"` ) — **required**                             | undefined | The part of the date to render.                                                                                                               |
| `ref`      | `HTMLDivElement` — **bindable**                                                                                                                                            | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                                                                                                                                  | undefined | The children content to render. Typically the `value` string from the parent segment loop.                                                   |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                 | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DateField.Label

The accessible label for the date field.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLSpanElement` — **bindable**                                      | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

---

## Data Attributes

### DateField.Input

| Data Attribute          | Value | Description                                         |
| ----------------------- | ----- | --------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.   |
| `data-disabled`         | `''`  | Present on the element when the field is disabled.  |
| `data-date-field-input` | `''`  | Present on the element.                             |

### DateField.Segment

| Data Attribute            | Value                                                                                                               | Description                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `data-invalid`            | `''`                                                                                                                | Present on the element when the field is invalid.             |
| `data-disabled`           | `''`                                                                                                                | Present on the element when the field is disabled.            |
| `data-readonly`           | `''`                                                                                                                | Present on the element when the field or segment is readonly. |
| `data-segment`            | `'day' \| 'month' \| 'year' \| 'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'`       | The part of the date being rendered.                          |
| `data-date-field-segment` | `''`                                                                                                                | Present on the element.                                       |

### DateField.Label

| Data Attribute          | Value | Description                                        |
| ----------------------- | ----- | -------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.  |
| `data-disabled`         | `''`  | Present on the element when the field is disabled. |
| `data-date-field-label` | `''`  | Present on the element.                            |

---

## CSS Variables

The official Bits UI documentation for the Date Field component does not define any component-specific `--bits-*` CSS variables. Styling is driven entirely through props, data attributes (e.g. `data-invalid`, `data-disabled`, `data-readonly`, `data-segment`), and the standard `class` attribute on each part.

Use the data attributes above as selectors for state-based styling, and use `aria-[valuetext=Empty]` to target segments with no value set.

---

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
</script>

<DateField.Root>
  <DateField.Label>Check-in date</DateField.Label>
  <DateField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DateField.Segment {part}>
          {value}
        </DateField.Segment>
      {/each}
    {/snippet}
  </DateField.Input>
</DateField.Root>
```

### Controlled Value (Two-Way Binding)

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myValue = $state(new CalendarDateTime(2024, 8, 3, 12, 30));
</script>

<button onclick={() => (myValue = myValue.add({ days: 1 }))}>
  Add 1 day
</button>

<DateField.Root bind:value={myValue}>
  <DateField.Label>Appointment</DateField.Label>
  <DateField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DateField.Segment {part}>{value}</DateField.Segment>
      {/each}
    {/snippet}
  </DateField.Input>
</DateField.Root>
```

### Fully Controlled Value (Function Binding)

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
  import type { DateValue } from "@internationalized/date";

  let myValue = $state<DateValue>();

  function getValue() {
    return myValue;
  }
  function setValue(newValue: DateValue | undefined) {
    myValue = newValue;
  }
</script>

<DateField.Root bind:value={getValue, setValue}>
  <!-- ... -->
</DateField.Root>
```

### With Placeholder (Setting Granularity via Type)

Use a `CalendarDateTime` placeholder to include time segments, or a `ZonedDateTime` to also include timezone segments.

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
  import { CalendarDateTime, now } from "@internationalized/date";
</script>

<!-- Date + time -->
<DateField.Root placeholder={new CalendarDateTime(2024, 8, 3, 12, 30)}>
  <DateField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DateField.Segment {part}>{value}</DateField.Segment>
      {/each}
    {/snippet}
  </DateField.Input>
</DateField.Root>

<!-- Date + time + timezone -->
<DateField.Root placeholder={now("America/New_York")}>
  <DateField.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DateField.Segment {part}>{value}</DateField.Segment>
      {/each}
    {/snippet}
  </DateField.Input>
</DateField.Root>
```

### Default Value from ISO String

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
  import { parseDate } from "@internationalized/date";

  // this came from a database/API call
  const date = "2024-08-03";
  let value = $state(parseDate(date));
</script>

<DateField.Root {value}>
  <!-- ... -->
</DateField.Root>
```

For `CalendarDateTime` use `parseDateTime`, and for `ZonedDateTime` use `parseZonedDateTime`.

### Validation (Min / Max / Custom)

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
  import {
    CalendarDate,
    today,
    getLocalTimeZone,
    type DateValue,
  } from "@internationalized/date";

  const todayDate = today(getLocalTimeZone());
  const yesterday = todayDate.subtract({ days: 1 });
  const tomorrow = todayDate.add({ days: 1 });
  const value = new CalendarDate(2024, 8, 2);

  function validate(date: DateValue) {
    return date.day === 1
      ? "Date cannot be the first day of the month"
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
        console.log("The date is invalid");
      }
    } else if (reason === "min") {
      console.log("The date is too early.");
    } else if (reason === "max") {
      console.log("The date is too late.");
    }
  }
</script>

<!-- Minimum value -->
<DateField.Root minValue={todayDate} value={yesterday}>
  <!-- ... -->
</DateField.Root>

<!-- Maximum value -->
<DateField.Root maxValue={todayDate} value={tomorrow}>
  <!-- ... -->
</DateField.Root>

<!-- Custom validation -->
<DateField.Root {validate} {value} {onInvalid}>
  <!-- ... -->
</DateField.Root>
```

### Granularity

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  const value = new CalendarDateTime(2024, 8, 2, 12, 30);
</script>

<DateField.Root granularity="second" {value}>
  <!-- ... -->
</DateField.Root>
```

### Localization

```svelte
<script lang="ts">
  import { DateField } from "bits-ui";
</script>

<DateField.Root locale="de">
  <!-- ... -->
</DateField.Root>
```

### Reusable Component (Recommended)

Build a wrapper component to reuse across your app.

```svelte
<!-- MyDateField.svelte -->
<script lang="ts">
  import { DateField, type WithoutChildrenOrChild } from "bits-ui";

  let {
    value = $bindable(),
    placeholder = $bindable(),
    name,
    ...restProps
  }: WithoutChildrenOrChild<DateField.RootProps> & {
    labelText: string;
    name?: string;
  } = $props();
</script>

<DateField.Root bind:value bind:placeholder {...restProps}>
  <DateField.Label {name}>{labelText}</DateField.Label>
  <DateField.Input {name}>
    {#snippet children({ segments })}
      {#each segments as { part, value }, i (part + i)}
        <div class="inline-block select-none">
          {#if part === "literal"}
            <DateField.Segment {part} class="text-muted-foreground p-1">
              {value}
            </DateField.Segment>
          {:else}
            <DateField.Segment
              {part}
              class="px-1 py-1 hover:bg-muted focus:bg-muted data-invalid:text-destructive"
            >
              {value}
            </DateField.Segment>
          {/if}
        </div>
      {/each}
    {/snippet}
  </DateField.Input>
</DateField.Root>
```

---

## Accessibility

The `DateField` is designed for full keyboard interaction. Each segment is a focusable element and users navigate between and within segments using the following keys.

### Keyboard Navigation

| Key                                  | Action                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `Tab`                                | Moves focus to the next segment (or out of the field).                                       |
| `Shift` + `Tab`                      | Moves focus to the previous segment (or out of the field).                                   |
| `Arrow Left`                         | Moves focus to the previous segment.                                                         |
| `Arrow Right`                        | Moves focus to the next segment.                                                             |
| `Arrow Up`                           | Increments the value of the focused segment.                                                 |
| `Arrow Down`                         | Decrements the value of the focused segment.                                                 |
| `0`–`9` (numeric keys)               | Type digits directly into the focused segment to set its value.                              |
| `Backspace`                          | Deletes the last typed digit within the focused segment.                                     |
| `A` / `P`                            | When focused on a `dayPeriod` (AM/PM) segment, toggles between AM and PM.                    |
| `Home`                               | Sets the focused segment to its minimum value.                                               |
| `End`                                | Sets the focused segment to its maximum value.                                               |
| `Page Up`                            | Increments the segment by a larger step (e.g. +1 year for year segment).                     |
| `Page Down`                          | Decrements the segment by a larger step (e.g. -1 year for year segment).                     |

### Segments

A segment is an individual editable part of the date, such as the day, month, year, hour, minute, second, or day period (AM/PM). Segments are rendered based on the `granularity` and the type of `DateValue` in use.

In addition to editable segments, `"literal"` segments represent separators (e.g. `/`, `-`, `:`) that appear between parts of the date. Literal segments vary by `locale` and are not editable. Style them differently (as shown in the examples) so they don't appear interactive.

The `data-segment` attribute on each `DateField.Segment` exposes which part is being rendered, enabling targeted styling per segment type:

```css
[data-segment="month"] { /* ... */ }
[data-segment="day"]   { /* ... */ }
[data-segment="year"]  { /* ... */ }
```

---

## Tips

### Use the Right `DateValue` Type

The type of object you pass as `value` or `placeholder` controls which segments the field renders:

- **`CalendarDate`** — date only (`YYYY-MM-DD`). Field defaults to `'day'` granularity. Use `parseDate` to create one from an ISO string.
- **`CalendarDateTime`** — date + time, no timezone. Use when you need time selection. Use `parseDateTime` to parse from an ISO string.
- **`ZonedDateTime`** — date + time + timezone. Use when timezone awareness matters. Use `parseZonedDateTime` to parse, or `now(timeZone)` / `today(timeZone)` for the current moment/date.

The `placeholder` sets the starting point when there is no `value` and determines the `DateValue` type used by the field. To enable time selection, set the placeholder to a `CalendarDateTime`; to enable timezone selection, set it to a `ZonedDateTime`.

### `placeholder` Is Not Placeholder Text

The `placeholder` prop is the date the field starts from when the user begins cycling segments — it is **not** greyed-out hint text. It also doubles as the mechanism for setting the field's granularity (see above).

### Immutability of `@internationalized/date` Objects

All `DateValue` objects from `@internationalized/date` are **immutable**. Mutating methods return new instances rather than modifying the original. Always reassign the result:

```ts
// Correct — reassign the new instance
myValue = myValue.add({ days: 1 });
myValue = myValue.set({ hour: 14 });

// Incorrect — the original is unchanged, this does nothing useful
myValue.add({ days: 1 });
```

Common operations: `.add({ ... })`, `.subtract({ ... })`, `.set({ ... })`, `.with({ ... })`.

### Leap Years for Birthdays

When building a date field for something like a birthday, set the `placeholder` to a leap year so users born on February 29 can select the correct date.

### Parsing ISO 8601 Strings

When loading values from a database or API (typically ISO 8601 strings), parse them into the appropriate `DateValue` before passing to the component:

| Function            | Input example                         | Output type         |
| ------------------- | ------------------------------------- | ------------------- |
| `parseDate`         | `"2024-08-03"`                        | `CalendarDate`      |
| `parseDateTime`     | `"2024-08-03T12:30:00"`               | `CalendarDateTime`  |
| `parseZonedDateTime`| `"2024-08-03T12:30:00-04:00[America/New_York]"` | `ZonedDateTime`     |

### Readonly Segments

Use the `readonlySegments` prop on `DateField.Root` to make specific segments non-editable while keeping others interactive. This is useful when part of the date should be fixed (e.g. a fixed year) while the rest remains user-editable.
