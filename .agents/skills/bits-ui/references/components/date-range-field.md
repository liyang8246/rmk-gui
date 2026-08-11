# Date Range Field

Enables users to input a range of dates within a designated field. The `DateRangeField` component combines two Date Field components to create a date range field, allowing users to enter a start and end date through editable, navigable segments.

## Overview

The `DateRangeField` component is a headless, segment-based input for selecting a date range (a start date and an end date). Rather than presenting a single text input, it renders discrete, editable segments — month, day, year, hour, minute, second, day period, and time zone — that users can navigate and modify individually with the keyboard or by typing digits directly.

It is built on top of the [Date Field](./date-field.md) component, combining two Date Fields (one for the start, one for the end) into a single, cohesive range input. Because of this lineage, the `Input`, `Segment`, and `Label` parts share their data attributes and behavior with Date Field.

**Date type requirements.** The component relies on the `@internationalized/date` library for its date values. All date values passed to `value`, `placeholder`, `minValue`, and `maxValue` must be instances of one of the three `DateValue` types:

- `CalendarDate` — a date without a time component (e.g., `2024-08-03`). When used, the field defaults its `granularity` to `'day'` and renders only date segments.
- `CalendarDateTime` — a date with a time component but no time zone (e.g., `2024-08-03T12:30:00`). When used, the field defaults its `granularity` to `'minute'` and renders both date and time segments.
- `ZonedDateTime` — a date with a time component and an explicit time zone (e.g., `2024-08-03T12:30:00-04:00[America/New_York]`). When used, the field renders date, time, and time zone segments.

The `value` prop is a `DateRange` object:

```ts
type DateRange = {
  start: DateValue;
  end: DateValue;
};
```

Both `start` and `end` must be the same `DateValue` subtype — do not mix a `CalendarDate` start with a `CalendarDateTime` end.

**Before diving in**, read the [Dates](https://bits-ui.com/docs/dates) documentation to understand how dates and times work throughout Bits UI.

## Component Structure

The `DateRangeField` component follows a compound component pattern with four parts:

| Part | Element | Role |
|------|---------|------|
| `DateRangeField.Root` | `<div>` | The root container that manages the shared state (value, placeholder, validation, locale) for both the start and end fields. |
| `DateRangeField.Input` | `<div>` | The container for the segments of a single field. Rendered twice — once with `type="start"` and once with `type="end"`. |
| `DateRangeField.Segment` | `<span>` | A single editable segment of a date field (e.g., month, day, year, hour). |
| `DateRangeField.Label` | `<span>` | The accessible label for the date range field. |

```svelte
<script lang="ts">
  import { DateRangeField } from "bits-ui";
</script>

<DateRangeField.Root>
  <DateRangeField.Label>Check-in date</DateRangeField.Label>
  {#each ["start", "end"] as const as type}
    <DateRangeField.Input {type}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <DateRangeField.Segment {part}>
            {value}
          </DateRangeField.Segment>
        {/each}
      {/snippet}
    </DateRangeField.Input>
  {/each}
</DateRangeField.Root>
```

The `Input` part exposes a `segments` array through its `children` snippet, where each entry has a `part` (the segment type) and a `value` (the formatted string to display). You map over this array to render a `Segment` for each part, passing the `part` through and displaying the `value` as the segment's content.

## API Reference

### `DateRangeField.Root`

The root date range field component. It owns the shared state for both the start and end fields and provides the context that the other parts consume.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `DateRange` — `{ start: DateValue; end: DateValue }` | `undefined` | The selected date range. Both `start` and `end` must be the same `DateValue` subtype. Bindable (`bind:value`). |
| `onValueChange` | `(value: DateRange) => void` | `undefined` | A function called when the selected date range changes. |
| `placeholder` | `DateValue` | `undefined` | The placeholder date, used to determine which date to start the segments from when no value exists. Bindable (`bind:placeholder`). |
| `onPlaceholderChange` | `(date: DateValue) => void` | `undefined` | A function called when the placeholder date changes. |
| `errorMessageId` | `string` | `undefined` | The `id` of the element that contains the error messages for the date field when the date is invalid. Used to wire up `aria-describedby` for screen-reader announcements. |
| `validate` | `(date: DateValue) => string[] \| string \| void` | `undefined` | A function that returns whether a date is valid. Return a string (or array of strings) to mark the date invalid with a message, or `void`/`undefined` to mark it valid. |
| `onInvalid` | `(reason: 'min' \| 'max' \| 'custom', msg?: string \| string[]) => void` | `undefined` | A callback fired when the value is invalid. `reason` indicates whether the value violated `minValue` (`'min'`), `maxValue` (`'max'`), or a custom `validate` rule (`'custom'`). `msg` carries the validation message(s), if any. |
| `minValue` | `DateValue` | `undefined` | The minimum valid date that can be entered. Dates earlier than this are rejected. |
| `maxValue` | `DateValue` | `undefined` | The maximum valid date that can be entered. Dates later than this are rejected. |
| `granularity` | `'day' \| 'hour' \| 'minute' \| 'second'` | `undefined` | The granularity to use for formatting the field. Defaults to `'day'` if a `CalendarDate` is provided, otherwise defaults to `'minute'`. The field renders segments for each part of the date up to and including the specified granularity. |
| `hideTimeZone` | `boolean` | `false` | Whether to hide the time zone segment of the field. |
| `hourCycle` | `'12' \| '24'` | `undefined` | The hour cycle to use for formatting times. Defaults to the locale preference. |
| `locale` | `string` | `'en-US'` | The locale to use for formatting dates. Affects segment ordering, month names, day period labels, and more. |
| `disabled` | `boolean` | `false` | Whether the field is disabled. When disabled, all segments are non-interactive. |
| `readonly` | `boolean` | `false` | Whether the field is readonly. When readonly, segments are visible but not editable. |
| `readonlySegments` | `EditableSegmentPart[]` — `'day' \| 'month' \| 'year' \| 'hour' \| 'minute' \| 'second' \| 'dayPeriod'` | `undefined` | An array of segments that should be readonly, which prevents user input on them while leaving others editable. |
| `required` | `boolean` | `false` | Whether the date field is required. |
| `onStartValueChange` | `(value: DateValue) => void` | `undefined` | A function called when the start date changes. |
| `onEndValueChange` | `(value: DateValue) => void` | `undefined` | A function called when the end date changes. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

> **Bindable props.** `value`, `placeholder`, and `ref` are `$bindable`. Use `bind:value`, `bind:placeholder`, and `bind:ref` for two-way binding, or use [function bindings](https://svelte.dev/docs/svelte/bind#Function-bindings) for fully controlled state.

> **`granularity` and date types interact.** If you pass a `CalendarDate` value/placeholder, `granularity` defaults to `'day'` and only date segments render. If you pass a `CalendarDateTime` or `ZonedDateTime`, `granularity` defaults to `'minute'` and time segments also render. You can override this explicitly with the `granularity` prop, but you cannot request a finer granularity than the date type supports (e.g., you cannot use `'hour'` granularity with a `CalendarDate`).

> **Validation.** The `validate` function is for custom validation logic. Built-in `minValue`/`maxValue` constraints are checked automatically and reported via `onInvalid` with `reason` set to `'min'` or `'max'`; custom validation failures come through with `reason` set to `'custom'`.

### `DateRangeField.Input`

The container for the segments of a single date field. Render this part twice inside `Root` — once with `type="start"` and once with `type="end"`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'start' \| 'end'` | `undefined` | **Required.** The type of field to render — either the start or the end of the range. |
| `name` | `string` | `undefined` | The name of the date field used for form submission. If provided, a hidden input element is rendered alongside the date field to participate in native form submission. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` — `ChildrenSnippetProps = { segments: Array<{ part: SegmentPart; value: string }> }` | `undefined` | The children content to render. The snippet receives a `segments` array, where each entry has a `part` (`SegmentPart`) and a `value` (the formatted string to display). Iterate over this to render a `Segment` for each part. |
| `child` | `Snippet` — `ChildSnippetProps = { props: Record<string, unknown>; segments: Array<{ part: SegmentPart; value: string }> }` | `undefined` | Use render delegation to render your own element. The snippet receives both the spreadable `props` and the `segments` array. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

> **Rendering segments.** The `children` snippet is how you turn the internal segment data into DOM. You receive `segments` (an array of `{ part, value }`) and render a `DateRangeField.Segment` for each, passing `part` as a prop and `value` as the content. See the [Examples](#examples) section for the standard pattern, including how to handle `literal` segments differently from editable ones.

> **`SegmentPart` type.** `SegmentPart` is `'month' \| 'day' \| 'year' \| 'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'`. The `literal` part covers separators like `/`, `:`, `,`, or spaces and is not editable.

### `DateRangeField.Segment`

A single segment of the date field. Each segment corresponds to one part of the date/time (month, day, year, etc.) or a literal separator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `part` | `SegmentPart` — `'month' \| 'day' \| 'year' \| 'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'` | `undefined` | **Required.** The part of the date the segment represents. Must match the `part` value provided by the parent `Input`'s `segments` array. |
| `ref` | `HTMLSpanElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. Typically the `value` string from the `segments` array. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

> **Editable vs. literal.** Segments with `part === 'literal'` are separators (e.g., `/`, `:`, `–`) and are not interactive. All other segment parts are editable: they can be focused, incremented/decremented with arrow keys, and typed into directly. You often want to style literal segments differently (e.g., muted text, no hover/focus styles).

### `DateRangeField.Label`

The accessible label for the date range field.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `HTMLSpanElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

> **Label association.** The `Label` is automatically associated with the field via `aria-labelledby`, so screen readers announce the label when focus enters the segments. Place it as a child of `Root`.

## Data Attributes

State and identity are exposed via `data-*` attributes on each part. Use these for CSS targeting and state-based styling.

### `DateRangeField.Root`

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-date-range-field-root` | `''` | Present on the root element. |

### `DateRangeField.Input`

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-invalid` | `''` | Present on the element when the field is invalid. |
| `data-disabled` | `''` | Present on the element when the field is disabled. |
| `data-date-field-input` | `''` | Present on the element. |

### `DateRangeField.Segment`

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-invalid` | `''` | Present on the element when the field is invalid. |
| `data-disabled` | `''` | Present on the element when the field is disabled. |
| `data-segment` | `'month' \| 'day' \| 'year' \| 'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'` | The type of segment the element represents. |
| `data-date-field-segment` | `''` | Present on the element. |

### `DateRangeField.Label`

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-invalid` | `''` | Present on the element when the field is invalid. |
| `data-date-field-label` | `''` | Present on the element. |

> **Invalid state.** When the field's value fails validation (due to `minValue`, `maxValue`, or a custom `validate` function), `data-invalid` is added to the `Input`, `Segment`, and `Label` elements. Use this as a styling hook (e.g., red borders, error text color) without needing to track validity yourself.

> **Shared attributes with Date Field.** Note that `Input`, `Segment`, and `Label` use `data-date-field-*` attributes (not `data-date-range-field-*`), because these parts are shared with the standalone Date Field component. This means CSS targeting them with `[data-date-field-input]`, `[data-date-field-segment]`, etc., will style both components.

## CSS Variables

The `DateRangeField` component does not expose any `--bits-*` CSS variables. Styling is done entirely via class names and the `data-*` attributes listed above.

## Examples

### Basic Usage

A minimal date range field with a label and both start and end inputs. This is the canonical structure to copy and build on.

```svelte
<script lang="ts">
  import { DateRangeField } from "bits-ui";
</script>

<DateRangeField.Root>
  <DateRangeField.Label>Check-in date</DateRangeField.Label>
  {#each ["start", "end"] as const as type}
    <DateRangeField.Input {type}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <DateRangeField.Segment {part}>
            {value}
          </DateRangeField.Segment>
        {/each}
      {/snippet}
    </DateRangeField.Input>
  {/each}
</DateRangeField.Root>
```

### Styled with Tailwind

A fully styled example with a separator between the start and end inputs. Note how `literal` segments are styled differently (muted) from editable segments (hover/focus backgrounds), and how `aria-[valuetext=Empty]` is used to dim empty segments.

```svelte
<script lang="ts">
  import { DateRangeField } from "bits-ui";
</script>

<DateRangeField.Root class="group flex w-full max-w-[320px] flex-col gap-1.5">
  <DateRangeField.Label class="block select-none text-sm font-medium">
    Hotel dates
  </DateRangeField.Label>
  <div
    class="h-input rounded-input border-border-input bg-background text-foreground focus-within:border-border-input-hover focus-within:shadow-date-field-focus hover:border-border-input-hover group-data-invalid:border-destructive flex w-full select-none items-center border px-2 py-3 text-sm tracking-[0.01em]"
  >
    {#each ["start", "end"] as const as type (type)}
      <DateRangeField.Input {type}>
        {#snippet children({ segments })}
          {#each segments as { part, value }, i (part + i)}
            <div class="inline-block select-none">
              {#if part === "literal"}
                <DateRangeField.Segment
                  {part}
                  class="text-muted-foreground p-1"
                >
                  {value}
                </DateRangeField.Segment>
              {:else}
                <DateRangeField.Segment
                  {part}
                  class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
                >
                  {value}
                </DateRangeField.Segment>
              {/if}
            </div>
          {/each}
        {/snippet}
      </DateRangeField.Input>
      {#if type === "start"}
        <div aria-hidden="true" class="text-muted-foreground px-1">–</div>
      {/if}
    {/each}
  </div>
</DateRangeField.Root>
```

### Managing Value State (Two-Way Binding)

Use `bind:value` for simple, automatic synchronization of the selected date range. The bound value is a `DateRange` object whose `start` and `end` are `DateValue` instances.

```svelte
<script lang="ts">
  import { DateRangeField, type DateRange } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myValue = $state<DateRange>({
    start: new CalendarDateTime(2024, 8, 3, 12, 30),
    end: new CalendarDateTime(2024, 8, 4, 12, 30),
  });
</script>

<button
  onclick={() => {
    myValue = {
      start: myValue.start.add({ days: 1 }),
      end: myValue.end.add({ days: 1 }),
    };
  }}
>
  Add 1 day
</button>

<DateRangeField.Root bind:value={myValue}>
  <!-- ... -->
</DateRangeField.Root>
```

### Managing Value State (Fully Controlled)

Use a [function binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over reads and writes to the value. This is useful when the source of truth lives in a store, a parent component, or an external system.

```svelte
<script lang="ts">
  import { DateRangeField, type DateRange } from "bits-ui";

  let myValue = $state<DateRange>({
    start: undefined,
    end: undefined,
  });

  function getValue() {
    return myValue;
  }

  function setValue(newValue: DateRange) {
    myValue = newValue;
  }
</script>

<DateRangeField.Root bind:value={getValue, setValue}>
  <!-- ... -->
</DateRangeField.Root>
```

### Managing Placeholder State (Two-Way Binding)

The `placeholder` determines what date the segments display when no `value` is set. Use `bind:placeholder` to track or control it externally.

```svelte
<script lang="ts">
  import { DateRangeField } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myPlaceholder = $state(new CalendarDateTime(2024, 8, 3, 12, 30));
</script>

<DateRangeField.Root bind:placeholder={myPlaceholder}>
  <!-- ... -->
</DateRangeField.Root>
```

### Managing Placeholder State (Fully Controlled)

Use a [function binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the placeholder state.

```svelte
<script lang="ts">
  import { DateRangeField } from "bits-ui";
  import { CalendarDateTime, type DateValue } from "@internationalized/date";

  let myPlaceholder = $state<DateValue>(new CalendarDateTime(2024, 8, 3, 12, 30));

  function getPlaceholder() {
    return myPlaceholder;
  }

  function setPlaceholder(newPlaceholder: DateValue) {
    myPlaceholder = newPlaceholder;
  }
</script>

<DateRangeField.Root bind:placeholder={getPlaceholder, setPlaceholder}>
  <!-- ... -->
</DateRangeField.Root>
```

### With Min/Max Constraints and Validation

Use `minValue` and `maxValue` to constrain the selectable range, and `validate` for custom rules. The `onInvalid` callback reports both built-in and custom failures.

```svelte
<script lang="ts">
  import { DateRangeField, type DateValue } from "bits-ui";
  import { CalendarDate } from "@internationalized/date";

  const today = new CalendarDate(2024, 8, 3);
  const max = new CalendarDate(2024, 12, 31);

  function handleInvalid(reason: "min" | "max" | "custom", msg?: string | string[]) {
    console.log("Invalid:", reason, msg);
  }
</script>

<DateRangeField.Root
  minValue={today}
  maxValue={max}
  onInvalid={handleInvalid}
>
  <!-- ... -->
</DateRangeField.Root>
```

### With a Date-Only Value

When you pass `CalendarDate` values, the field renders only date segments (month, day, year) and defaults `granularity` to `'day'`.

```svelte
<script lang="ts">
  import { DateRangeField, type DateRange } from "bits-ui";
  import { CalendarDate } from "@internationalized/date";

  let myValue = $state<DateRange>({
    start: new CalendarDate(2024, 8, 3),
    end: new CalendarDate(2024, 8, 10),
  });
</script>

<DateRangeField.Root bind:value={myValue}>
  <!-- ... -->
</DateRangeField.Root>
```

### With Readonly Segments

Use `readonlySegments` to make specific segment types non-editable while keeping the rest interactive — for example, locking the year while allowing the user to change month and day.

```svelte
<script lang="ts">
  import { DateRangeField } from "bits-ui";
</script>

<DateRangeField.Root readonlySegments={["year"]}>
  <!-- ... -->
</DateRangeField.Root>
```

### With a Hidden Form Input

Pass `name` to each `Input` to render a hidden input that participates in native form submission. The submitted value is the ISO string of the corresponding date.

```svelte
<script lang="ts">
  import { DateRangeField } from "bits-ui";
</script>

<DateRangeField.Root>
  {#each ["start", "end"] as const as type}
    <DateRangeField.Input {type} name={type === "start" ? "range-start" : "range-end"}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <DateRangeField.Segment {part}>{value}</DateRangeField.Segment>
        {/each}
      {/snippet}
    </DateRangeField.Input>
  {/each}
</DateRangeField.Root>
```

## Accessibility

The `DateRangeField` is built to be fully accessible, with keyboard navigation between and within segments, proper ARIA wiring, and screen-reader-friendly announcements.

### Keyboard Navigation

The field exposes a spinbutton-style interaction model. Each editable segment is a focusable spinbutton that can be adjusted with the keyboard:

| Key | Action |
|-----|--------|
| `Tab` | Move focus to the next segment (or to the next field — start to end — or out of the component). |
| `Shift + Tab` | Move focus to the previous segment (or out of the component). |
| `Arrow Up` | Increment the focused segment's value by one step (e.g., next month, next day, +1 hour). |
| `Arrow Down` | Decrement the focused segment's value by one step. |
| `Arrow Left` | Move focus to the previous segment. |
| `Arrow Right` | Move focus to the next segment. |
| `Home` | Move focus to the first segment of the current field. |
| `End` | Move focus to the last segment of the current field. |
| `Backspace` | Delete the last typed digit in the focused segment, or clear it. |
| `Delete` | Clear the focused segment's value. |
| `0`–`9` | Type digits directly into the focused segment. The component auto-advances to the next segment once the current one is filled (e.g., after typing two digits for a month). |
| `A`/`P` | When focused on a `dayPeriod` segment in a 12-hour cycle, set AM or PM. |

> **Literal segments** are skipped during keyboard navigation — they are separators and not focusable.

### ARIA

- Each editable segment is a `spinbutton` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` describing its current value. When a segment is empty, `aria-valuetext` is `"Empty"`.
- The `Label` is associated with the field via `aria-labelledby`.
- Use `errorMessageId` to wire an external error message element to the field via `aria-describedby`, so screen readers announce validation errors.
- The `data-invalid` attribute (on `Input`, `Segment`, and `Label`) provides a CSS hook for visual error styling; pair it with an accessible error message for non-visual users.

## Tips

- **Always use `@internationalized/date` types.** The `value`, `placeholder`, `minValue`, and `maxValue` props require `CalendarDate`, `CalendarDateTime`, or `ZonedDateTime` instances — not native `Date` objects. Convert with the library's helpers if you have a native `Date`. The `DateValue` type is the union of these three: `type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime`.

- **Understand `DateRange`.** The `value` is a `DateRange` object: `{ start: DateValue; end: DateValue }`. Both endpoints must be the same `DateValue` subtype. Import the type from Bits UI: `import { type DateRange } from "bits-ui"`. You can mutate a bound range immutably with the library's `.add()`, `.set()`, and similar methods — never mutate in place.

- **Let the date type drive granularity.** If you only need dates (no time), use `CalendarDate` and the field will render just month/day/year segments with `granularity` defaulting to `'day'`. If you need time, use `CalendarDateTime` (or `ZonedDateTime` when time zone matters) and `granularity` defaults to `'minute'`. Override with the `granularity` prop only when you need something other than the default for your date type.

- **Use `placeholder` to guide empty input.** When `value` is unset, segments display based on `placeholder`. Set a sensible default (e.g., today) so the field shows meaningful starting segments rather than blanks. Bind `placeholder` if you want to track where the user is "parked" before committing a value.

- **Style `literal` segments differently.** The `segments` array includes `literal` parts for separators (`/`, `:`, `,`, spaces). Render these with muted styling and no hover/focus affordances, since they aren't interactive. Check `part === "literal"` inside the `children` snippet.

- **Use `data-invalid` for error styling.** When validation fails, `data-invalid` appears on the `Input`, `Segment`, and `Label`. Target `group-data-invalid:*` on the `Root` (which is a `group`) to style the whole field — for example, switching the border to a destructive color.

- **Wire `errorMessageId` for accessible errors.** Validation is only useful if users know about it. Pass the `id` of an error message element to `errorMessageId` so it's announced via `aria-describedby` when the field is invalid.

- **`readonly` vs. `readonlySegments` vs. `disabled`.** `disabled` removes the field from interaction entirely (and from the tab order). `readonly` makes all segments visible but non-editable. `readonlySegments` lets you lock specific parts (e.g., `["year"]`) while leaving others editable — useful for constrained inputs.

- **Remember the shared `data-date-field-*` attributes.** The `Input`, `Segment`, and `Label` parts use `data-date-field-input`, `data-date-field-segment`, and `data-date-field-label` (not `data-date-range-field-*`), because they are shared with the standalone Date Field. If you write global CSS targeting these, it will apply to both components — scope your selectors accordingly.

- **Form submission via `name`.** Pass `name` to each `Input` to render a hidden input for native form submission. The hidden input's value is the ISO string of that endpoint's date, so a start field named `"range-start"` submits as `range-start=2024-08-03...`.

- **See Date Field for more.** Because `DateRangeField` is built from two Date Fields, the Date Field documentation covers additional customization details (segment formatting, locale behavior, hour cycles) that apply here as well.
