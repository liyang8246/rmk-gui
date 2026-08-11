# Date Range Picker

Enables users to select a range of dates using an input field and calendar interface. The `DateRangePicker` component combines a **Date Range Field** (two segment-based inputs for start/end dates) with a **Range Calendar** displayed inside a **Popover**, giving users two complementary ways to choose a range: typing individual date segments or picking from a visual calendar grid.

---

## Overview

The `DateRangePicker` is a composite component built from three other Bits UI components:

- **[Date Range Field](./date-range-field.md)** — the segment-based input field (start + end), including `Label`, `Input`, and `Segment` parts.
- **[Range Calendar](./range-calendar.md)** — the calendar grid with navigation, month grids, and day cells, including range-selection state (`data-range-start`, `data-range-end`, `data-range-middle`, `data-highlighted`).
- **[Popover](https://bits-ui.com/docs/components/popover)** — the floating container that displays the calendar, anchored to a trigger button.

The component exposes a unified API: props for the field (granularity, validation, locale, etc.) and props for the calendar (navigation, disabled days, number of months, etc.) are all set on `DateRangePicker.Root`. The `value` is a `DateRange` object — `{ start: DateValue; end: DateValue }` — and all date values use the `@internationalized/date` library's `DateValue` type:

```ts
import type {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
} from "@internationalized/date";

type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime;
```

- **`CalendarDate`** — a date with no time component (e.g. `2024-08-03`). The field defaults to `'day'` granularity.
- **`CalendarDateTime`** — a date with a time but no timezone (e.g. `2024-08-03T12:30:00`).
- **`ZonedDateTime`** — a date with a time and an explicit timezone (e.g. `2024-08-03T12:30:00-04:00[America/New_York]`).

The `DateRange` type is exported from `bits-ui`:

```ts
import { type DateRange } from "bits-ui";
// { start: DateValue; end: DateValue }
```

Read the [Dates](https://bits-ui.com/docs/dates) documentation for background on how dates/times work in Bits UI.

---

## Component Structure

The `DateRangePicker` is composed of the following parts:

| Part                         | Element              | Source component   | Purpose                                                                                       |
| ---------------------------- | -------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `DateRangePicker.Root`       | `<div>` (implicit)   | —                  | Root context provider. Holds state, validation, and configuration for all sub-components.    |
| `DateRangePicker.Label`      | `<span>`             | Date Range Field   | Accessible label for the field.                                                              |
| `DateRangePicker.Input`      | `<div>`              | Date Range Field   | Field input container for either the start or end date. Renders segments via a snippet.      |
| `DateRangePicker.Segment`    | `<span>`             | Date Range Field   | A single editable segment (day, month, year, hour, etc.) or a literal separator.             |
| `DateRangePicker.Trigger`    | `<button>`           | Popover            | Button that toggles the popover open/closed.                                                 |
| `DateRangePicker.Content`    | `<div>`              | Popover            | The floating popover content. Uses Floating UI for positioning. Wraps the calendar.          |
| `DateRangePicker.Portal`     | —                    | Popover            | Optional. Renders the content into the body or a custom target when open.                    |
| `DateRangePicker.Calendar`   | `<div>`              | Range Calendar     | The calendar container. Exposes `months` and `weekdays` via a snippet.                       |
| `DateRangePicker.Header`     | `<div>`              | Range Calendar     | Header containing the prev/next buttons and heading.                                          |
| `DateRangePicker.PrevButton` | `<button>`           | Range Calendar     | Navigates to the previous month(s).                                                           |
| `DateRangePicker.NextButton` | `<button>`           | Range Calendar     | Navigates to the next month(s).                                                               |
| `DateRangePicker.Heading`    | `<div>`              | Range Calendar     | Displays the current month/year heading.                                                      |
| `DateRangePicker.Grid`       | `<table>`            | Range Calendar     | A grid of dates, typically representing one month.                                            |
| `DateRangePicker.GridHead`   | `<thead>`            | Range Calendar     | The head of the grid (contains weekday labels).                                              |
| `DateRangePicker.GridBody`   | `<tbody>`            | Range Calendar     | The body of the grid (contains the date rows).                                                |
| `DateRangePicker.GridRow`    | `<tr>`               | Range Calendar     | A row in the grid (a week of dates, or the weekday header row).                              |
| `DateRangePicker.HeadCell`   | `<th>`               | Range Calendar     | A weekday header cell.                                                                        |
| `DateRangePicker.Cell`       | `<td>`               | Range Calendar     | A cell wrapping a single day. Receives `date` and `month`.                                    |
| `DateRangePicker.Day`        | `<div>`              | Range Calendar     | The clickable day element inside a cell.                                                      |
| `DateRangePicker.MonthSelect`| `<select>`           | Range Calendar     | Optional select to navigate to a specific month.                                              |
| `DateRangePicker.YearSelect` | `<select>`           | Range Calendar     | Optional select to navigate to a specific year.                                               |

Minimal structure:

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";
</script>

<DateRangePicker.Root>
  <DateRangePicker.Label />
  {#each ["start", "end"] as const as type}
    <DateRangePicker.Input {type}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <DateRangePicker.Segment {part}>
            {value}
          </DateRangePicker.Segment>
        {/each}
      {/snippet}
    </DateRangePicker.Input>
  {/each}
  <DateRangePicker.Trigger />
  <DateRangePicker.Content>
    <DateRangePicker.Calendar>
      {#snippet children({ months, weekdays })}
        <DateRangePicker.Header>
          <DateRangePicker.PrevButton />
          <DateRangePicker.Heading />
          <DateRangePicker.NextButton />
        </DateRangePicker.Header>
        {#each months as month}
          <DateRangePicker.Grid>
            <DateRangePicker.GridHead>
              <DateRangePicker.GridRow>
                {#each weekdays as day}
                  <DateRangePicker.HeadCell>
                    {day}
                  </DateRangePicker.HeadCell>
                {/each}
              </DateRangePicker.GridRow>
            </DateRangePicker.GridHead>
            <DateRangePicker.GridBody>
              {#each month.weeks as weekDates}
                <DateRangePicker.GridRow>
                  {#each weekDates as date}
                    <DateRangePicker.Cell {date} month={month.value}>
                      <DateRangePicker.Day>
                        {date.day}
                      </DateRangePicker.Day>
                    </DateRangePicker.Cell>
                  {/each}
                </DateRangePicker.GridRow>
              {/each}
            </DateRangePicker.GridBody>
          </DateRangePicker.Grid>
        {/each}
      {/snippet}
    </DateRangePicker.Calendar>
  </DateRangePicker.Content>
</DateRangePicker.Root>
```

The `DateRangePicker.Calendar` exposes a `children` snippet whose props include `months` and `weekdays`. Each `month` in `months` has a `value` (the `DateValue` for the first day of that month) and `weeks` (an array of arrays of `DateValue`). The `DateRangePicker.Input` exposes a `segments` array (each entry has `part` and `value`), and you must render one `Input` for `"start"` and one for `"end"`.

---

## API Reference

### DateRangePicker.Root

The root date range picker component. Provides context to all child parts and manages `value`, `placeholder`, open state, validation, and all field/calendar configuration.

| Property                  | Type                                                                                                                                                                           | Default     | Description                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                   | `DateRange` — `{ start: DateValue; end: DateValue }` — **bindable**                                                                                                            | undefined   | The selected date range.                                                                                                                                                                                                                                                |
| `onValueChange`           | `(value: DateRange) => void`                                                                                                                                                   | undefined   | A function called when the selected date range changes.                                                                                                                                                                                                                 |
| `placeholder`             | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` ) — **bindable**                                                                                         | undefined   | The placeholder date, used to determine what date to start the segments from when no value exists. Also sets the granularity/type of `DateValue` used.                                                                                                                  |
| `onPlaceholderChange`     | `(date: DateValue) => void`                                                                                                                                                    | undefined   | A function called when the placeholder date changes.                                                                                                                                                                                                                    |
| `readonlySegments`        | `EditableSegmentPart[]` ( `"day" \| "month" \| "year" \| "hour" \| "minute" \| "second" \| "dayPeriod"` )                                                                      | undefined   | An array of segments that should be readonly, preventing user input on them.                                                                                                                                                                                            |
| `isDateUnavailable`       | `(date: DateValue) => boolean`                                                                                                                                                 | undefined   | A function that returns whether or not a date is unavailable.                                                                                                                                                                                                           |
| `minValue`                | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined   | The minimum valid date that can be entered. Values below this mark the field invalid.                                                                                                                                                                                   |
| `maxValue`                | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined   | The maximum valid date that can be entered. Values beyond this mark the field invalid.                                                                                                                                                                                  |
| `validate`                | `(date: DateValue) => string[] \| string \| void`                                                                                                                              | undefined   | A function that returns whether a date is valid. Return a string or array of strings as validation errors, or `undefined`/nothing if valid.                                                                                                                             |
| `onInvalid`               | `(reason: 'min' \| 'max' \| 'custom', msg?: string \| string[]) => void`                                                                                                       | undefined   | Callback fired when the value is invalid. `reason` indicates whether the invalidation came from the `minValue`, `maxValue`, or custom `validate` function. `msg` carries the error message(s) for custom validation.                                                    |
| `granularity`             | `'day' \| 'hour' \| 'minute' \| 'second'`                                                                                                                                      | undefined   | The granularity to use for formatting the field. Defaults to `'day'` if a `CalendarDate` is provided, otherwise defaults to `'minute'`. The field renders segments for each part of the date up to and including the specified granularity.                             |
| `hideTimeZone`            | `boolean`                                                                                                                                                                      | `false`     | Whether to hide the time zone segment of the field.                                                                                                                                                                                                                     |
| `errorMessageId`          | `string`                                                                                                                                                                       | undefined   | The `id` of the element containing error messages for the field when the date is invalid. Used to wire up `aria-describedby`.                                                                                                                                           |
| `hourCycle`               | `'12' \| '24'`                                                                                                                                                                 | undefined   | The hour cycle to use for formatting times. Defaults to the locale preference.                                                                                                                                                                                          |
| `locale`                  | `string`                                                                                                                                                                       | `en-US`     | The locale to use for formatting dates. Affects segment order, separators, and display.                                                                                                                                                                                |
| `disabled`                | `boolean`                                                                                                                                                                      | `false`     | Whether the field is disabled.                                                                                                                                                                                                                                          |
| `readonly`                | `boolean`                                                                                                                                                                      | `false`     | Whether the field is readonly.                                                                                                                                                                                                                                          |
| `required`                | `boolean`                                                                                                                                                                      | `false`     | Whether the date field is required.                                                                                                                                                                                                                                     |
| `closeOnRangeSelect`      | `boolean`                                                                                                                                                                      | `true`      | Whether to close the popover when a date range is selected.                                                                                                                                                                                                             |
| `disableDaysOutsideMonth` | `boolean`                                                                                                                                                                      | `false`     | Whether to disable days outside the current month.                                                                                                                                                                                                                      |
| `pagedNavigation`         | `boolean`                                                                                                                                                                      | `false`     | Whether to use paged navigation for the calendar. Paged navigation causes the previous and next buttons to navigate by the number of months displayed at once, rather than by one month.                                                                                |
| `preventDeselect`         | `boolean`                                                                                                                                                                      | `false`     | Whether to prevent the user from deselecting a date without selecting another date first.                                                                                                                                                                               |
| `weekdayFormat`           | `'narrow' \| 'short' \| 'long'`                                                                                                                                                | `'narrow'`  | The format to use for the weekday strings provided via the `weekdays` slot prop.                                                                                                                                                                                        |
| `weekStartsOn`            | `number`                                                                                                                                                                       | undefined   | An absolute day of the week to start the calendar on, regardless of locale. `0` is Sunday, `1` is Monday, etc. If not provided, the calendar defaults to the locale's first day of the week.                                                                           |
| `calendarLabel`           | `string`                                                                                                                                                                       | undefined   | The accessible label for the calendar.                                                                                                                                                                                                                                  |
| `fixedWeeks`              | `boolean`                                                                                                                                                                      | `false`     | Whether to always display 6 weeks in the calendar.                                                                                                                                                                                                                      |
| `isDateDisabled`          | `(date: DateValue) => boolean`                                                                                                                                                 | undefined   | A function that returns whether or not a date is disabled.                                                                                                                                                                                                              |
| `numberOfMonths`          | `number`                                                                                                                                                                       | `1`         | The number of months to display at once.                                                                                                                                                                                                                                |
| `open`                    | `boolean` — **bindable**                                                                                                                                                       | `false`     | The open state of the popover content.                                                                                                                                                                                                                                 |
| `onOpenChange`            | `(open: boolean) => void`                                                                                                                                                      | undefined   | A callback function called when the open state changes.                                                                                                                                                                                                                 |
| `onOpenChangeComplete`    | `(open: boolean) => void`                                                                                                                                                      | undefined   | A callback function called after the open state changes and all animations have completed.                                                                                                                                                                             |
| `onEndValueChange`        | `(value: DateValue) => void`                                                                                                                                                   | undefined   | A function called when the end date changes.                                                                                                                                                                                                                            |
| `onStartValueChange`      | `(value: DateValue) => void`                                                                                                                                                   | undefined   | A function called when the start date changes.                                                                                                                                                                                                                          |
| `minDays`                 | `number`                                                                                                                                                                       | undefined   | The minimum number of days that can be selected in a range.                                                                                                                                                                                                             |
| `maxDays`                 | `number`                                                                                                                                                                       | undefined   | The maximum number of days that can be selected in a range.                                                                                                                                                                                                             |
| `excludeDisabled`         | `boolean`                                                                                                                                                                      | `false`     | Whether to automatically reset the range if any date within the selected range becomes disabled.                                                                                                                                                                       |
| `monthFormat`             | `'short' \| 'long' \| 'narrow' \| 'numeric' \| '2-digit' \| ((month: number) => string)`                                                                                       | `'long'`    | The format to use for the month strings provided via the `months` slot prop.                                                                                                                                                                                            |
| `yearFormat`              | `'numeric' \| '2-digit' \| ((year: number) => string)`                                                                                                                         | `'numeric'` | The format to use for the year strings provided via the `years` slot prop.                                                                                                                                                                                              |
| `ref`                     | `HTMLDivElement` — **bindable**                                                                                                                                                | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                                                                             |
| `children`                | `Snippet`                                                                                                                                                                      | undefined   | The children content to render.                                                                                                                                                                                                                                         |
| `child`                   | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                      | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                                                                                                |

> **Bindable props:** `value`, `placeholder`, and `open` support `bind:value` / `bind:placeholder` / `bind:open`. For fully controlled state, use Svelte [Function Bindings](https://svelte.dev/docs/svelte/bind#Function-bindings) (e.g. `bind:value={getValue, setValue}`).

### DateRangePicker.Label

The accessible label for the date field.

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLSpanElement` — **bindable**                                      | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.Input

The field input component which contains the segments of the date field. You must render two — one with `type="start"` and one with `type="end"`.

| Property   | Type                                                                  | Default     | Description                                                                                                                                                |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | `string`                                                              | undefined   | The name of the input field used for form submission. If provided, a hidden input will be rendered alongside the field.                                    |
| `type`     | `'start' \| 'end'` — **required**                                     | undefined   | The type of field to render (start or end).                                                                                                                |
| `ref`      | `HTMLDivElement` — **bindable**                                       | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                 |
| `children` | `Snippet` with props `{ segments: Array<{ part: SegmentPart; value: string }> }` | undefined   | The children content to render. Receives the array of segments to render.                                                                                  |
| `child`    | `Snippet` with props `{ props: Record<string, unknown>; segments: Array<...> }` | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |

### DateRangePicker.Segment

A single segment of the date field. Renders one editable part of the date (or a literal separator).

| Property   | Type                                                                                                                                                                       | Default     | Description                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `part`     | `SegmentPart` ( `"month" \| "day" \| "year" \| "hour" \| "minute" \| "second" \| "dayPeriod" \| "timeZoneName" \| "literal"` ) — **required**                             | undefined   | The part of the date to render.                                                                                                               |
| `ref`      | `HTMLSpanElement` — **bindable**                                                                                                                                           | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                   |
| `children` | `Snippet`                                                                                                                                                                  | undefined   | The children content to render. Typically the `value` string from the parent segment loop.                                                   |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                 | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DateRangePicker.Trigger

A button which toggles the opening and closing of the popover on press.

| Property    | Type                                                                  | Default     | Description                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openOnHover` | `boolean`                                                           | `false`     | Whether the popover should open when the trigger is hovered.                                                                                                |
| `openDelay` | `number`                                                              | `700`       | The delay in milliseconds before the popover opens after hovering the trigger. Only applies when `openOnHover` is `true`.                                  |
| `closeDelay`| `number`                                                              | `300`       | The delay in milliseconds before the popover closes after the mouse leaves the trigger or content. Only applies when `openOnHover` is `true`.              |
| `ref`       | `HTMLButtonElement` — **bindable**                                    | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                  |
| `children`  | `Snippet`                                                             | undefined   | The children content to render.                                                                                                                              |
| `child`     | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |

### DateRangePicker.Content

The contents of the popover which are displayed when the popover is open. Uses [Floating UI](https://floating-ui.com/) to position the content relative to the trigger.

| Property                       | Type                                                                                          | Default       | Description                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `side`                         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                      | `'bottom'`    | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur.                                                                                                                                                                                                                                           |
| `sideOffset`                   | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                      |
| `align`                        | `'start' \| 'center' \| 'end'`                                                                | `'start'`     | The preferred alignment of the anchor to render the floating element against when open. This may change when collisions occur.                                                                                                                                                                                                                                       |
| `alignOffset`                  | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                      |
| `arrowPadding`                 | `number`                                                                                      | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                |
| `avoidCollisions`              | `boolean`                                                                                     | `true`        | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges.                                                                                                                                                                                                                                                                |
| `collisionBoundary`            | `Element` \| `null`                                                                           | undefined     | A boundary element or array of elements to check for collisions against.                                                                                                                                                                                                                                                                                             |
| `collisionPadding`             | `number` \| `Partial<Record<Side, number>>`                                                   | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                |
| `sticky`                       | `'partial' \| 'always'`                                                                       | `'partial'`   | The sticky behavior on the align axis. `'partial'` will keep the content in the boundary as long as the trigger is at least partially in the boundary whilst `'always'` will keep the content in the boundary regardless.                                                                                                                                            |
| `hideWhenDetached`             | `boolean`                                                                                     | `true`        | When `true`, hides the content when it is detached from the DOM. This is useful for when you want to hide the content when the user scrolls away.                                                                                                                                                                                                                    |
| `updatePositionStrategy`       | `'optimized' \| 'always'`                                                                     | `'optimized'` | The strategy to use when updating the position of the content. When `'optimized'` the content will only be repositioned when the trigger is in the viewport. When `'always'` the content will be repositioned whenever the position changes.                                                                                                                         |
| `strategy`                     | `'fixed' \| 'absolute'`                                                                       | `'fixed'`     | The positioning strategy to use for the floating element. When `'fixed'` the element will be positioned relative to the viewport. When `'absolute'` the element will be positioned relative to the nearest positioned ancestor.                                                                                                                                      |
| `preventScroll`                | `boolean`                                                                                     | `false`       | When `true`, prevents the body from scrolling when the content is open. This is useful when you want to use the content as a modal.                                                                                                                                                                                                                                  |
| `customAnchor`                 | `string` \| `HTMLElement` \| `Measurable` \| `null`                                           | `null`        | Use an element other than the trigger to anchor the content to. If provided, the content will be anchored to the provided element instead of the trigger.                                                                                                                                                                                                            |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | undefined     | Callback fired when an outside interaction event occurs, which is a `pointerdown` event. You can call `event.preventDefault()` to prevent the default behavior of handling the outside interaction.                                                                                                                                                                  |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | undefined     | Callback fired when focus leaves the dismissible layer. You can call `event.preventDefault()` to prevent the default behavior on focus leaving the layer.                                                                                                                                                                                                            |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`     | The behavior to use when an interaction occurs outside of the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction.                          |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | undefined     | Callback fired when an escape keydown event occurs in the floating content. You can call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event.                                                                                                                                                                              |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`     | The behavior to use when an escape keydown event occurs in the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction.                          |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | undefined     | Event handler called when auto-focusing the content as it is opened. Can be prevented.                                                                                                                                                                                                                                                                               |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | undefined     | Event handler called when auto-focusing the content as it is closed. Can be prevented.                                                                                                                                                                                                                                                                               |
| `trapFocus`                    | `boolean`                                                                                     | `true`        | Whether or not to trap the focus within the content when open.                                                                                                                                                                                                                                                                                                       |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`        | When `true`, prevents the text selection from overflowing the bounds of the element.                                                                                                                                                                                                                                                                                |
| `forceMount`                   | `boolean`                                                                                     | `false`       | Whether or not to forcefully mount the content. This is useful if you want to use Svelte transitions or another animation library for the content.                                                                                                                                                                                                                   |
| `dir`                          | `'ltr' \| 'rtl'`                                                                              | `'ltr'`       | The reading direction of the app.                                                                                                                                                                                                                                                                                                                                    |
| `ref`                          | `HTMLDivElement` — **bindable**                                                               | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                                                                                                                                                                          |
| `children`                     | `Snippet`                                                                                     | undefined     | The children content to render.                                                                                                                                                                                                                                                                                                                                      |
| `child`                        | `Snippet` with props `{ wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean }` | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs. `wrapperProps` are for the positioning wrapper (do not style this element — styling should be applied to the content element via `props`). `open` is the content visibility state, useful for conditional rendering with Svelte transitions. |

### DateRangePicker.Portal

When used, renders the popover content into the body or a custom `to` element when open.

| Property   | Type                        | Default        | Description                                                                                                                      |
| ---------- | --------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `to`       | `Element` \| `string`       | `document.body`| Where to render the content when it is open. Defaults to the body.                                                               |
| `disabled` | `boolean`                   | `false`        | Whether the portal is disabled or not. When disabled, the content will be rendered in its original DOM location.                 |
| `children` | `Snippet`                   | undefined      | The children content to render.                                                                                                   |

### DateRangePicker.Calendar

The calendar component containing the grids of dates. Exposes `months` and `weekdays` via its `children` snippet.

> **Floating content wrapper rule:** When using `DateRangePicker.Content`, the `Calendar` must be a direct child of `Content`. If you wrap the calendar in extra elements, the positioning and focus management may break. The `Content` component renders a positioning wrapper internally — do not style that wrapper element; apply your styles to the `Calendar` or your own content element instead.

### DateRangePicker.Header

The header of the calendar, typically containing the prev/next buttons and heading.

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLElement` — **bindable**                                          | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.PrevButton

The previous button of the calendar. Navigates to the previous month(s).

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLButtonElement` — **bindable**                                    | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.Heading

The heading of the calendar, displaying the current month and year.

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLDivElement` — **bindable**                                       | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.NextButton

The next button of the calendar. Navigates to the next month(s).

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLButtonElement` — **bindable**                                    | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.Grid

The grid of dates in the calendar, typically representing a single month.

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableElement` — **bindable**                                     | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.GridHead

The head of the grid of dates in the calendar (contains the weekday header row).

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableSectionElement` — **bindable**                              | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.GridBody

The body of the grid of dates in the calendar (contains the week rows).

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableSectionElement` — **bindable**                              | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.GridRow

A row in the grid of dates in the calendar (a week of dates, or the weekday header row).

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableRowElement` — **bindable**                                  | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.HeadCell

A cell in the head of the grid of dates in the calendar (a weekday label).

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableCellElement` — **bindable**                                 | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.Cell

A cell in the calendar grid. Wraps a single `Day`. Receives the `date` to display and the `month` it belongs to (used to determine if the date is outside the current month).

| Property   | Type                                                                                                                                                                           | Default     | Description                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `date`     | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined   | The date for the cell.                                                                                                                        |
| `month`    | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined   | The current month the date is being displayed in. Used to determine `data-outside-month`.                                                    |
| `ref`      | `HTMLTableCellElement` — **bindable**                                                                                                                                          | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                   |
| `children` | `Snippet`                                                                                                                                                                      | undefined   | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                      | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DateRangePicker.Day

A day in the calendar grid. The clickable element inside a `Cell`.

| Property   | Type                                                                  | Default     | Description                                                                                                                              |
| ---------- | --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLDivElement` — **bindable**                                       | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                               |
| `children` | `Snippet`                                                             | undefined   | The children content to render.                                                                                                          |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`             | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### DateRangePicker.MonthSelect

An optional select you can use to navigate to a specific month in the calendar view.

| Property      | Type                                                                                                                                                                             | Default     | Description                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `months`      | `number[]`                                                                                                                                                                       | `[1-12]`    | The month values to render in the select.                                                                                                                                                                       |
| `monthFormat` | `'narrow' \| 'short' \| 'long' \| 'numeric' \| '2-digit' \| ((month: number) => string)`                                                                                          | `'narrow'`  | The format to use for the month strings provided via the `months` slot prop. If a function is provided, it will be called with the month number as an argument and should return a string.                      |
| `ref`         | `HTMLSelectElement` — **bindable**                                                                                                                                               | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                     |
| `children`    | `Snippet` with props `{ monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`                                              | undefined   | The children content to render.                                                                                                                                                                                 |
| `child`       | `Snippet` with props `{ props: Record<string, unknown>; monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`              | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                                        |

### DateRangePicker.YearSelect

An optional select you can use to navigate to a specific year in the calendar view.

| Property     | Type                                                                                                                                                                           | Default                                                                                                                                                                                                                                       | Description                                                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `years`      | `number[]`                                                                                                                                                                     | The current year or placeholder year (whichever is higher) + 10 and minus 100 years. When a `minValue`/`maxValue` is provided to `DateRangePicker.Root`, those will be used to constrain the range.                                             | The year values to render in the select.                                                                                                                                                                                                          |
| `yearFormat` | `'numeric' \| '2-digit' \| ((year: number) => string)`                                                                                                                          | `'numeric'`                                                                                                                                                                                                                                   | The format to use for the year strings provided via the `years` slot prop. If a function is provided, it will be called with the year as an argument and should return a string.                                                                  |
| `ref`        | `HTMLSelectElement` — **bindable**                                                                                                                                             | `null`                                                                                                                                                                                                                                        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                                                       |
| `children`   | `Snippet` with props `{ yearItems: Array<{ value: number; label: string }>; selectedYearItem: { value: number; label: string } }`                                               | undefined                                                                                                                                                                                                                                     | The children content to render.                                                                                                                                                                                                                   |
| `child`      | `Snippet` with props `{ props: Record<string, unknown>; yearItems: Array<{ value: number; label: string }>; selectedYearItem: { value: number; label: string } }`               | undefined                                                                                                                                                                                                                                     | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                                                                          |

---

## Data Attributes

### DateRangePicker.Root

| Data Attribute       | Value | Description                                                |
| -------------------- | ----- | ---------------------------------------------------------- |
| `data-invalid`       | `''`  | Present on the root element when the calendar is invalid.  |
| `data-disabled`      | `''`  | Present on the root element when the calendar is disabled. |
| `data-readonly`      | `''`  | Present on the root element when the calendar is readonly. |
| `data-calendar-root` | `''`  | Present on the root element.                               |

### DateRangePicker.Label

| Data Attribute          | Value | Description                                         |
| ----------------------- | ----- | --------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.   |
| `data-date-field-label` | `''`  | Present on the element.                             |

### DateRangePicker.Input

| Data Attribute          | Value | Description                                          |
| ----------------------- | ----- | ---------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.    |
| `data-disabled`         | `''`  | Present on the element when the field is disabled.   |
| `data-date-field-input` | `''`  | Present on the element.                              |

### DateRangePicker.Segment

| Data Attribute            | Value                                                                                                               | Description                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `data-invalid`            | `''`                                                                                                                | Present on the element when the field is invalid. |
| `data-disabled`           | `''`                                                                                                                | Present on the element when the field is disabled.|
| `data-segment`            | `'month' \| 'day' \| 'year' \| 'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'`       | The type of segment the element represents.       |
| `data-date-field-segment` | `''`                                                                                                                | Present on the element.                           |

### DateRangePicker.Trigger

| Data Attribute         | Value                       | Description                            |
| ---------------------- | --------------------------- | -------------------------------------- |
| `data-state`           | `'open' \| 'closed'`        | Whether the popover is open or closed. |
| `data-popover-trigger` | `''`                        | Present on the trigger element.        |

### DateRangePicker.Content

| Data Attribute         | Value                       | Description                                                                                        |
| ---------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| `data-state`           | `'open' \| 'closed'`        | Whether the popover is open or closed.                                                             |
| `data-starting-style`  | `''`                        | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style`    | `''`                        | Present while closing before unmount. Use this to define the ending styles for CSS transitions.    |
| `data-popover-content` | `''`                        | Present on the content element.                                                                    |

### DateRangePicker.Calendar

| Data Attribute       | Value | Description                                                |
| -------------------- | ----- | ---------------------------------------------------------- |
| `data-invalid`       | `''`  | Present on the root element when the calendar is invalid.  |
| `data-disabled`      | `''`  | Present on the root element when the calendar is disabled. |
| `data-readonly`      | `''`  | Present on the root element when the calendar is readonly. |
| `data-calendar-root` | `''`  | Present on the root element.                               |

### DateRangePicker.Header

| Data Attribute               | Value | Description                                                  |
| ---------------------------- | ----- | ------------------------------------------------------------ |
| `data-disabled`              | `''`  | Present on the header element when the calendar is disabled. |
| `data-readonly`              | `''`  | Present on the header element when the calendar is readonly. |
| `data-range-calendar-header` | `''`  | Present on the header element.                               |

### DateRangePicker.PrevButton

| Data Attribute                    | Value | Description                                                                      |
| --------------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`                   | `''`  | Present on the prev button element when the calendar or this button is disabled. |
| `data-range-calendar-prev-button` | `''`  | Present on the prev button element.                                              |

### DateRangePicker.Heading

| Data Attribute                | Value | Description                                                   |
| ----------------------------- | ----- | ------------------------------------------------------------- |
| `data-disabled`               | `''`  | Present on the heading element when the calendar is disabled. |
| `data-readonly`               | `''`  | Present on the heading element when the calendar is readonly. |
| `data-range-calendar-heading` | `''`  | Present on the heading element.                               |

### DateRangePicker.NextButton

| Data Attribute                    | Value | Description                                                                      |
| --------------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`                   | `''`  | Present on the next button element when the calendar or this button is disabled. |
| `data-range-calendar-next-button` | `''`  | Present on the next button element.                                              |

### DateRangePicker.Grid

| Data Attribute             | Value | Description                                                |
| -------------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`            | `''`  | Present on the grid element when the calendar is disabled. |
| `data-readonly`            | `''`  | Present on the grid element when the calendar is readonly. |
| `data-range-calendar-grid` | `''`  | Present on the grid element.                               |

### DateRangePicker.GridHead

| Data Attribute                  | Value | Description                                                     |
| ------------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`                 | `''`  | Present on the grid head element when the calendar is disabled. |
| `data-readonly`                 | `''`  | Present on the grid head element when the calendar is readonly. |
| `data-range-calendar-grid-head` | `''`  | Present on the grid head element.                               |

### DateRangePicker.GridBody

| Data Attribute                   | Value | Description                                                |
| -------------------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`                  | `''`  | Present on the grid element when the calendar is disabled. |
| `data-readonly`                  | `''`  | Present on the grid element when the calendar is readonly. |
| `data-range-calendar-grid-body`  | `''`  | Present on the grid body element.                          |

### DateRangePicker.GridRow

| Data Attribute                  | Value | Description                                                    |
| ------------------------------- | ----- | -------------------------------------------------------------- |
| `data-disabled`                 | `''`  | Present on the grid row element when the calendar is disabled. |
| `data-readonly`                 | `''`  | Present on the grid row element when the calendar is readonly. |
| `data-range-calendar-grid-row`  | `''`  | Present on the grid row element.                               |

### DateRangePicker.HeadCell

| Data Attribute                   | Value | Description                                                     |
| -------------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`                  | `''`  | Present on the head cell element when the calendar is disabled. |
| `data-readonly`                  | `''`  | Present on the head cell element when the calendar is readonly. |
| `data-range-calendar-head-cell`  | `''`  | Present on the head cell element.                               |

### DateRangePicker.Cell

| Data Attribute                | Value | Description                                                                                             |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                                                                       |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                                                                    |
| `data-today`                  | `''`  | Present when the day is today.                                                                          |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.                                                      |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months.                                                     |
| `data-focused`                | `''`  | Present when the day is focused.                                                                        |
| `data-selected`               | `''`  | Present when the day is selected.                                                                       |
| `data-value`                  | `''`  | The date in the format `YYYY-MM-DD`.                                                                    |
| `data-range-calendar-cell`    | `''`  | Present on the cell element.                                                                            |
| `data-range-start`            | `''`  | Present when the cell is the start of a selection range.                                                |
| `data-range-end`              | `''`  | Present when the cell is the end of a selection range.                                                  |
| `data-range-middle`           | `''`  | Present when the cell is in the middle of a selection range, but not the start or end of the selection. |
| `data-highlighted`            | `''`  | Present when the cell is highlighted within a selection range.                                          |

### DateRangePicker.Day

| Data Attribute                | Value | Description                                                                                             |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                                                                       |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                                                                    |
| `data-today`                  | `''`  | Present when the day is today.                                                                          |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.                                                      |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months.                                                     |
| `data-focused`                | `''`  | Present when the day is focused.                                                                        |
| `data-selected`               | `''`  | Present when the day is selected.                                                                       |
| `data-value`                  | `''`  | The date in the format `YYYY-MM-DD`.                                                                    |
| `data-range-calendar-day`     | `''`  | Present on the day element.                                                                             |
| `data-range-start`            | `''`  | Present when the cell is the start of a selection range.                                                |
| `data-range-end`              | `''`  | Present when the cell is the end of a selection range.                                                  |
| `data-range-middle`           | `''`  | Present when the cell is in the middle of a selection range, but not the start or end of the selection. |
| `data-highlighted`            | `''`  | Present when the cell is highlighted within a selection range.                                          |

### DateRangePicker.MonthSelect

| Data Attribute                     | Value | Description                                                        |
| ---------------------------------- | ----- | ------------------------------------------------------------------ |
| `data-disabled`                    | `''`  | Present on the month select element when the calendar is disabled. |
| `data-range-calendar-month-select` | `''`  | Present on the month select element.                               |

### DateRangePicker.YearSelect

| Data Attribute                    | Value | Description                                                       |
| --------------------------------- | ----- | ----------------------------------------------------------------- |
| `data-disabled`                   | `''`  | Present on the year select element when the calendar is disabled. |
| `data-range-calendar-year-select` | `''`  | Present on the year select element.                               |

---

## CSS Variables

### DateRangePicker.Content

The `Content` component (sourced from the Popover) exposes the following CSS variables for advanced positioning scenarios:

| CSS Variable                              | Description                                  |
| ----------------------------------------- | -------------------------------------------- |
| `--bits-popover-content-transform-origin` | The transform origin of the content element. |
| `--bits-popover-content-available-width`  | The available width of the content element.  |
| `--bits-popover-content-available-height` | The available height of the content element. |
| `--bits-popover-anchor-width`             | The width of the anchor element.             |
| `--bits-popover-anchor-height`            | The height of the anchor element.            |

> The other parts of the `DateRangePicker` (Root, Label, Input, Segment, Calendar, Header, PrevButton, NextButton, Heading, Grid, GridHead, GridBody, GridRow, HeadCell, Cell, Day, MonthSelect, YearSelect) do not define component-specific `--bits-*` CSS variables. Styling for those parts is driven entirely through props, data attributes, and the standard `class` attribute on each part.

---

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";
</script>

<DateRangePicker.Root>
  <DateRangePicker.Label>Stay duration</DateRangePicker.Label>
  {#each ["start", "end"] as const as type}
    <DateRangePicker.Input {type}>
      {#snippet children({ segments })}
        {#each segments as { part, value }}
          <DateRangePicker.Segment {part}>
            {value}
          </DateRangePicker.Segment>
        {/each}
      {/snippet}
    </DateRangePicker.Input>
  {/each}
  <DateRangePicker.Trigger>Open</DateRangePicker.Trigger>
  <DateRangePicker.Content>
    <DateRangePicker.Calendar>
      {#snippet children({ months, weekdays })}
        <DateRangePicker.Header>
          <DateRangePicker.PrevButton>Prev</DateRangePicker.PrevButton>
          <DateRangePicker.Heading />
          <DateRangePicker.NextButton>Next</DateRangePicker.NextButton>
        </DateRangePicker.Header>
        {#each months as month}
          <DateRangePicker.Grid>
            <DateRangePicker.GridHead>
              <DateRangePicker.GridRow>
                {#each weekdays as day}
                  <DateRangePicker.HeadCell>{day}</DateRangePicker.HeadCell>
                {/each}
              </DateRangePicker.GridRow>
            </DateRangePicker.GridHead>
            <DateRangePicker.GridBody>
              {#each month.weeks as weekDates}
                <DateRangePicker.GridRow>
                  {#each weekDates as date}
                    <DateRangePicker.Cell {date} month={month.value}>
                      <DateRangePicker.Day>{date.day}</DateRangePicker.Day>
                    </DateRangePicker.Cell>
                  {/each}
                </DateRangePicker.GridRow>
              {/each}
            </DateRangePicker.GridBody>
          </DateRangePicker.Grid>
        {/each}
      {/snippet}
    </DateRangePicker.Calendar>
  </DateRangePicker.Content>
</DateRangePicker.Root>
```

### Controlled Value (Two-Way Binding)

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myValue = $state({
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

<DateRangePicker.Root bind:value={myValue}>
  <!-- ... -->
</DateRangePicker.Root>
```

### Fully Controlled Value (Function Binding)

```svelte
<script lang="ts">
  import { DateRangePicker, type DateRange } from "bits-ui";

  let myValue = $state<DateRange>();

  function getValue() {
    return myValue;
  }
  function setValue(newValue: DateRange) {
    myValue = newValue;
  }
</script>

<DateRangePicker.Root bind:value={getValue, setValue}>
  <!-- ... -->
</DateRangePicker.Root>
```

### Controlled Placeholder (Two-Way Binding)

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myPlaceholder = $state(new CalendarDateTime(2024, 8, 3, 12, 30));
</script>

<DateRangePicker.Root bind:placeholder={myPlaceholder}>
  <!-- ... -->
</DateRangePicker.Root>
```

### Fully Controlled Placeholder (Function Binding)

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";
  import type { DateValue } from "@internationalized/date";

  let myPlaceholder = $state<DateValue>();

  function getPlaceholder() {
    return myPlaceholder;
  }
  function setPlaceholder(newPlaceholder: DateValue) {
    myPlaceholder = newPlaceholder;
  }
</script>

<DateRangePicker.Root bind:placeholder={getPlaceholder, setPlaceholder}>
  <!-- ... -->
</DateRangePicker.Root>
```

### Controlled Open State (Two-Way Binding)

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";

  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open DateRangePicker</button>

<DateRangePicker.Root bind:open={isOpen}>
  <!-- ... -->
</DateRangePicker.Root>
```

### Fully Controlled Open State (Function Binding)

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";

  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<DateRangePicker.Root bind:open={getOpen, setOpen}>
  <!-- ... -->
</DateRangePicker.Root>
```

### With Portal

```svelte
<DateRangePicker.Root>
  <!-- ... -->
  <DateRangePicker.Portal>
    <DateRangePicker.Content>
      <DateRangePicker.Calendar>
        <!-- ... -->
      </DateRangePicker.Calendar>
    </DateRangePicker.Content>
  </DateRangePicker.Portal>
</DateRangePicker.Root>
```

### Multiple Months

```svelte
<DateRangePicker.Root numberOfMonths={2} pagedNavigation>
  <!-- ... -->
</DateRangePicker.Root>
```

### Disabled Dates and Unavailable Dates

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";
  import { today, getLocalTimeZone, type DateValue } from "@internationalized/date";

  const todayDate = today(getLocalTimeZone());

  function isDateDisabled(date: DateValue) {
    return date.day === 0; // disable Sundays
  }

  function isDateUnavailable(date: DateValue) {
    // e.g. booked dates
    return false;
  }
</script>

<DateRangePicker.Root
  minValue={todayDate}
  {isDateDisabled}
  {isDateUnavailable}
>
  <!-- ... -->
</DateRangePicker.Root>
```

### Range Length Constraints

```svelte
<DateRangePicker.Root minDays={3} maxDays={14}>
  <!-- ... -->
</DateRangePicker.Root>
```

### Full Styling Example

```svelte
<script lang="ts">
  import { DateRangePicker } from "bits-ui";
  import CalendarBlank from "phosphor-svelte/lib/CalendarBlank";
  import CaretLeft from "phosphor-svelte/lib/CaretLeft";
  import CaretRight from "phosphor-svelte/lib/CaretRight";
</script>

<DateRangePicker.Root weekdayFormat="short" fixedWeeks={true}>
  <DateRangePicker.Label>Rental Days</DateRangePicker.Label>
  <div class="flex w-full items-center border px-2 py-3 text-sm">
    {#each ["start", "end"] as const as type (type)}
      <DateRangePicker.Input {type}>
        {#snippet children({ segments })}
          {#each segments as { part, value }, i (part + i)}
            <div class="inline-block select-none">
              {#if part === "literal"}
                <DateRangePicker.Segment {part} class="p-1 text-muted-foreground">
                  {value}
                </DateRangePicker.Segment>
              {:else}
                <DateRangePicker.Segment
                  {part}
                  class="px-1 py-1 hover:bg-muted focus:bg-muted aria-[valuetext=Empty]:text-muted-foreground"
                >
                  {value}
                </DateRangePicker.Segment>
              {/if}
            </div>
          {/each}
        {/snippet}
      </DateRangePicker.Input>
      {#if type === "start"}
        <div aria-hidden="true" class="px-1 text-muted-foreground">–</div>
      {/if}
    {/each}
    <DateRangePicker.Trigger class="ml-auto inline-flex size-8 items-center justify-center">
      <CalendarBlank class="size-6" />
    </DateRangePicker.Trigger>
  </div>
  <DateRangePicker.Content sideOffset={6} class="z-50">
    <DateRangePicker.Calendar class="mt-6 border p-[22px]">
      {#snippet children({ months, weekdays })}
        <DateRangePicker.Header class="flex items-center justify-between">
          <DateRangePicker.PrevButton>
            <CaretLeft class="size-6" />
          </DateRangePicker.PrevButton>
          <DateRangePicker.Heading class="text-[15px] font-medium" />
          <DateRangePicker.NextButton>
            <CaretRight class="size-6" />
          </DateRangePicker.NextButton>
        </DateRangePicker.Header>
        <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4">
          {#each months as month (month.value)}
            <DateRangePicker.Grid class="w-full border-collapse select-none space-y-1">
              <DateRangePicker.GridHead>
                <DateRangePicker.GridRow class="mb-1 flex w-full justify-between">
                  {#each weekdays as day (day)}
                    <DateRangePicker.HeadCell class="w-10 rounded-md text-xs">
                      {day.slice(0, 2)}
                    </DateRangePicker.HeadCell>
                  {/each}
                </DateRangePicker.GridRow>
              </DateRangePicker.GridHead>
              <DateRangePicker.GridBody>
                {#each month.weeks as weekDates (weekDates)}
                  <DateRangePicker.GridRow class="flex w-full">
                    {#each weekDates as date (date)}
                      <DateRangePicker.Cell {date} month={month.value} class="relative size-10">
                        <DateRangePicker.Day
                          class="relative inline-flex size-10 items-center justify-center border border-transparent text-sm transition-all data-[highlighted]:rounded-none data-[highlighted]:bg-muted data-[selected]:bg-muted data-[range-start]:rounded-lg data-[range-start]:bg-foreground data-[range-start]:text-background data-[range-end]:rounded-lg data-[range-end]:bg-foreground data-[range-end]:text-background data-[disabled]:pointer-events-none data-[disabled]:text-foreground/30 data-[unavailable]:line-through data-[outside-month]:pointer-events-none"
                        >
                          {date.day}
                        </DateRangePicker.Day>
                      </DateRangePicker.Cell>
                    {/each}
                  </DateRangePicker.GridRow>
                {/each}
              </DateRangePicker.GridBody>
            </DateRangePicker.Grid>
          {/each}
        </div>
      {/snippet}
    </DateRangePicker.Calendar>
  </DateRangePicker.Content>
</DateRangePicker.Root>
```

---

## Accessibility

The `DateRangePicker` combines the accessibility behaviors of the Date Range Field, Range Calendar, and Popover. It is designed for full keyboard interaction across both the field segments and the calendar grid.

### Field Segments (Date Range Field)

Each segment in the `Input` is a focusable element. Users navigate between and within segments using the following keys:

| Key                      | Action                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `Tab`                    | Moves focus to the next segment (or out of the field).                                       |
| `Shift` + `Tab`          | Moves focus to the previous segment (or out of the field).                                   |
| `Arrow Left`             | Moves focus to the previous segment.                                                         |
| `Arrow Right`            | Moves focus to the next segment.                                                             |
| `Arrow Up`               | Increments the value of the focused segment.                                                 |
| `Arrow Down`             | Decrements the value of the focused segment.                                                 |
| `0`–`9` (numeric keys)   | Type digits directly into the focused segment to set its value.                              |
| `Backspace`              | Deletes the last typed digit within the focused segment.                                     |
| `A` / `P`                | When focused on a `dayPeriod` (AM/PM) segment, toggles between AM and PM.                    |
| `Home`                   | Sets the focused segment to its minimum value.                                               |
| `End`                    | Sets the focused segment to its maximum value.                                               |
| `Page Up`                | Increments the segment by a larger step (e.g. +1 year for year segment).                     |
| `Page Down`              | Decrements the segment by a larger step (e.g. -1 year for year segment).                     |

### Calendar Grid (Range Calendar)

When the popover is open and focus is in the calendar:

| Key                      | Action                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `Tab`                    | Moves focus between the prev button, heading, next button, and the calendar grid.            |
| `Arrow Up`               | Moves focus to the same day of the previous week.                                            |
| `Arrow Down`             | Moves focus to the same day of the next week.                                                |
| `Arrow Left`             | Moves focus to the previous day.                                                             |
| `Arrow Right`            | Moves focus to the next day.                                                                 |
| `Home`                   | Moves focus to the first day of the week.                                                    |
| `End`                    | Moves focus to the last day of the week.                                                     |
| `Page Up`                | Moves focus to the same day of the previous month.                                           |
| `Shift` + `Page Up`      | Moves focus to the same day of the previous year.                                            |
| `Page Down`              | Moves focus to the same day of the next month.                                               |
| `Shift` + `Page Down`    | Moves focus to the same day of the next year.                                                |
| `Enter` / `Space`        | Selects the focused date. First click sets the start of the range; second click sets the end.|
| `Escape`                 | Closes the popover (default `escapeKeydownBehavior` is `'close'`).                           |

### Popover

| Key                      | Action                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `Escape`                 | Closes the popover when open.                                                                |
| `Tab`                    | Focus is trapped within the content when `trapFocus` is `true` (default).                    |
| Click outside            | Closes the popover (default `interactOutsideBehavior` is `'close'`).                         |

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

### `DateRange` Type

The `value` is a `DateRange` object — `{ start: DateValue; end: DateValue }`. Import it from `bits-ui`:

```ts
import { type DateRange } from "bits-ui";
```

Both `start` and `end` must be the same `DateValue` subtype (e.g. both `CalendarDate`, or both `CalendarDateTime`).

### Immutability of `@internationalized/date` Objects

All `DateValue` objects from `@internationalized/date` are **immutable**. Mutating methods return new instances rather than modifying the original. Always reassign the result:

```ts
// Correct — reassign the new instance
myValue = {
  start: myValue.start.add({ days: 1 }),
  end: myValue.end.add({ days: 1 }),
};

// Incorrect — the original is unchanged, this does nothing useful
myValue.start.add({ days: 1 });
```

Common operations: `.add({ ... })`, `.subtract({ ... })`, `.set({ ... })`, `.with({ ... })`.

### Parsing ISO 8601 Strings

When loading values from a database or API (typically ISO 8601 strings), parse them into the appropriate `DateValue` before passing to the component:

| Function             | Input example                                  | Output type         |
| -------------------- | ---------------------------------------------- | ------------------- |
| `parseDate`          | `"2024-08-03"`                                 | `CalendarDate`      |
| `parseDateTime`      | `"2024-08-03T12:30:00"`                        | `CalendarDateTime`  |
| `parseZonedDateTime` | `"2024-08-03T12:30:00-04:00[America/New_York]"` | `ZonedDateTime`     |

### Floating Content Wrapper Rules

The `DateRangePicker.Content` component renders an internal positioning wrapper element (from Floating UI). When using the `child` snippet for render delegation, the `ChildSnippetProps` expose:

- `wrapperProps` — props for the positioning wrapper. **Do not style this element.** Styling applied here can break positioning.
- `props` — props for your content element. **Apply your custom styles here.**
- `open` — the content visibility state, useful for conditional rendering with Svelte transitions.

When not using render delegation, place `DateRangePicker.Calendar` as a direct child of `DateRangePicker.Content`. Extra wrapper elements between `Content` and `Calendar` can interfere with focus management and positioning.

### Range Selection Behavior

When the user clicks a date in the calendar:

1. If no start date is set (or both start and end are set), the clicked date becomes the **start** of the range.
2. If a start date is set but no end date, the clicked date becomes the **end** of the range. If the clicked date is before the start, it becomes the new start and the previous start becomes the end.
3. When `closeOnRangeSelect` is `true` (default), the popover closes once both start and end are selected.

Use `data-range-start`, `data-range-end`, `data-range-middle`, and `data-highlighted` attributes on cells/days to style the range visually (e.g. a connected bar between start and end).

### `excludeDisabled` for Dynamic Disabled Dates

When `excludeDisabled` is `true`, the component automatically resets the range if any date within the selected range becomes disabled. This is useful when `isDateDisabled` or `isDateUnavailable` can change dynamically (e.g. dates getting booked in real time).

### Customization via Sub-Components

The `DateRangePicker` is composed of three other Bits UI components. For deeper customization options, refer to the documentation for each:

- **[Date Range Field](./date-range-field.md)** — field/segment customization.
- **[Range Calendar](./range-calendar.md)** — calendar grid customization.
- **[Popover](https://bits-ui.com/docs/components/popover)** — floating content customization.
