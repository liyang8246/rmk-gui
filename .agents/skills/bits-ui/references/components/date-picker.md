# Date Picker

Enables users to select dates using an input field and calendar interface. The `DatePicker` combines the [Date Field](./date-field.md), [Calendar](https://bits-ui.com/docs/components/calendar), and [Popover](https://bits-ui.com/docs/components/popover) components into a single composite: a segmented, keyboard-editable date field paired with a popover that reveals a navigable month grid.

---

## Overview

The `DatePicker` provides a two-mode date selection experience. Users can either type the date directly into the segmented input field (editing individual parts like month, day, and year independently) or open the calendar popover to pick a date visually from a month grid. The two modes stay synchronized: selecting a date in the calendar updates the field, and editing the field updates the calendar.

All date values passed to and received from the component are instances of `@internationalized/date` types. The `value`, `placeholder`, `minValue`, and `maxValue` props accept a `DateValue`, which is the union:

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

The type of `DateValue` used (driven by the `placeholder` or `value`) determines which segments the field renders. See the [Tips](#tips) section for notes on date types and the floating content wrapper rules.

> **Heads up:** Before using this component, read the [Dates](https://bits-ui.com/docs/dates) documentation to understand how dates and times work in Bits UI.

---

## Component Structure

The `DatePicker` is composed of many parts spanning three underlying components (Date Field, Calendar, and Popover):

| Part                      | Element                | Purpose                                                                                          |
| ------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `DatePicker.Root`         | `<div>` (implicit)     | Root context provider. Holds state, validation, calendar, and popover configuration.            |
| `DatePicker.Label`        | `<span>`               | Accessible label for the date field.                                                            |
| `DatePicker.Input`        | `<div>`                | Container that renders the editable segments. Provides `segments` snippet prop.                 |
| `DatePicker.Segment`      | `<div>`                | A single editable segment (day, month, year, etc.) or a literal separator.                      |
| `DatePicker.Trigger`      | `<button>`             | Button that toggles the popover open/closed. Usually placed inside the `Input` snippet.         |
| `DatePicker.Content`      | `<div>`                | The popover content container. Uses Floating UI for positioning. Renders the calendar inside.   |
| `DatePicker.Portal`       | —                      | Optionally portals the `Content` to the body or a custom target.                                |
| `DatePicker.Calendar`     | `<div>`                | The calendar root containing the month grids. Provides `months` and `weekdays` snippet props.   |
| `DatePicker.Header`       | `<div>`                | Container for the navigation header (prev button, heading, next button).                        |
| `DatePicker.PrevButton`   | `<button>`             | Navigates the calendar to the previous month(s).                                                |
| `DatePicker.Heading`      | `<div>`                | Displays the current month/year heading.                                                        |
| `DatePicker.NextButton`   | `<button>`             | Navigates the calendar to the next month(s).                                                    |
| `DatePicker.Grid`         | `<table>`              | A single month grid.                                                                             |
| `DatePicker.GridHead`     | `<thead>`              | The head of the grid (weekday labels).                                                          |
| `DatePicker.GridBody`     | `<tbody>`              | The body of the grid (date cells).                                                              |
| `DatePicker.GridRow`      | `<tr>`                 | A row in the grid (either weekday headers or a week of dates).                                  |
| `DatePicker.HeadCell`     | `<th>`                 | A weekday header cell.                                                                          |
| `DatePicker.Cell`         | `<td>`                 | A date cell in the grid. Requires `date` and `month` props.                                     |
| `DatePicker.Day`          | `<div>`                | The clickable day element inside a `Cell`.                                                      |
| `DatePicker.MonthSelect`  | `<select>`             | Optional select to jump to a specific month.                                                    |
| `DatePicker.YearSelect`   | `<select>`             | Optional select to jump to a specific year.                                                     |

### Base Structure

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
</script>

<DatePicker.Root>
  <DatePicker.Label />
  <DatePicker.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DatePicker.Segment {part}>
          {value}
        </DatePicker.Segment>
      {/each}
      <DatePicker.Trigger />
    {/snippet}
  </DatePicker.Input>
  <DatePicker.Content>
    <DatePicker.Calendar>
      {#snippet children({ months, weekdays })}
        <DatePicker.Header>
          <DatePicker.PrevButton />
          <DatePicker.Heading />
          <DatePicker.NextButton />
        </DatePicker.Header>
        {#each months as month}
          <DatePicker.Grid>
            <DatePicker.GridHead>
              <DatePicker.GridRow>
                {#each weekdays as day}
                  <DatePicker.HeadCell>
                    {day}
                  </DatePicker.HeadCell>
                {/each}
              </DatePicker.GridRow>
            </DatePicker.GridHead>
            <DatePicker.GridBody>
              {#each month.weeks as weekDates}
                <DatePicker.GridRow>
                  {#each weekDates as date}
                    <DatePicker.Cell {date} month={month.value}>
                      <DatePicker.Day />
                    </DatePicker.Cell>
                  {/each}
                </DatePicker.GridRow>
              {/each}
            </DatePicker.GridBody>
          </DatePicker.Grid>
        {/each}
      {/snippet}
    </DatePicker.Calendar>
  </DatePicker.Content>
</DatePicker.Root>
```

The `DatePicker.Input` exposes a `children` snippet with a `segments` array (each entry has `part` and `value`). The `DatePicker.Calendar` exposes a `children` snippet with `months` (array of month objects, each with `.value` and `.weeks`) and `weekdays` (array of formatted weekday strings). Iterate over these to render the grid.

---

## API Reference

### DatePicker.Root

The root date picker component. Provides context to all child parts and manages `value`, `placeholder`, `open` state, validation, calendar configuration, and field formatting.

| Property                  | Type                                                                                                                                                                           | Default   | Description                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                   | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The selected date.                                                                                                                                                                                                                                                      |
| `onValueChange`           | `(value: DateValue) => void \| (value: DateValue[]) => void`                                                                                                                   | undefined | A function called when the selected date changes.                                                                                                                                                                                                                       |
| `open`                    | `boolean` — **bindable**                                                                                                                                                       | `false`   | The open state of the popover content.                                                                                                                                                                                                                                 |
| `onOpenChange`            | `(open: boolean) => void`                                                                                                                                                      | undefined | A callback function called when the open state changes.                                                                                                                                                                                                                |
| `onOpenChangeComplete`    | `(open: boolean) => void`                                                                                                                                                      | undefined | A callback function called after the open state changes and all animations have completed.                                                                                                                                                                             |
| `placeholder`             | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` ) — **bindable**                                                                                         | undefined | The placeholder date, used to determine what month to display when no date is selected. Updates as the user navigates the calendar; can be used to programmatically control the calendar's view. Also sets the granularity/type of `DateValue` used.                  |
| `onPlaceholderChange`     | `(date: DateValue) => void`                                                                                                                                                    | undefined | A function called when the placeholder date changes.                                                                                                                                                                                                                   |
| `isDateUnavailable`       | `(date: DateValue) => boolean`                                                                                                                                                 | undefined | A function that returns whether a date is unavailable (shown as unavailable but not disabled).                                                                                                                                                                         |
| `isDateDisabled`          | `(date: DateValue) => boolean`                                                                                                                                                 | undefined | A function that returns whether a date is disabled.                                                                                                                                                                                                                    |
| `validate`                | `(date: DateValue) => string[] \| string \| void`                                                                                                                              | undefined | A function that returns whether a date is valid. Return a string or array of strings as validation errors, or `undefined`/nothing if valid.                                                                                                                            |
| `onInvalid`               | `(reason: 'min' \| 'max' \| 'custom', msg?: string \| string[]) => void`                                                                                                       | undefined | Callback fired when the value is invalid. `reason` indicates whether the invalidation came from `minValue`, `maxValue`, or custom `validate`. `msg` carries the error message(s) for custom validation.                                                                |
| `required`                | `boolean`                                                                                                                                                                      | `false`   | Whether the date field is required.                                                                                                                                                                                                                                    |
| `errorMessageId`          | `string`                                                                                                                                                                       | undefined | The `id` of the element containing error messages for the field when the date is invalid. Used to wire up `aria-describedby`.                                                                                                                                          |
| `readonlySegments`        | `EditableSegmentPart[]` ( `"day" \| "month" \| "year" \| "hour" \| "minute" \| "second" \| "dayPeriod"` )                                                                      | undefined | An array of segments that should be readonly, preventing user input on them.                                                                                                                                                                                           |
| `disableDaysOutsideMonth` | `boolean`                                                                                                                                                                      | `false`   | Whether to disable days outside the current month.                                                                                                                                                                                                                     |
| `closeOnDateSelect`       | `boolean`                                                                                                                                                                      | `true`    | Whether to close the popover when a date is selected.                                                                                                                                                                                                                  |
| `pagedNavigation`         | `boolean`                                                                                                                                                                      | `false`   | Whether to use paged navigation. When `true`, the prev/next buttons navigate by the number of months displayed at once rather than by one month.                                                                                                                       |
| `preventDeselect`         | `boolean`                                                                                                                                                                      | `false`   | Whether to prevent the user from deselecting a date without selecting another date first.                                                                                                                                                                             |
| `weekStartsOn`            | `number`                                                                                                                                                                       | undefined | An absolute day of the week to start the calendar on, regardless of locale. `0` is Sunday, `1` is Monday, etc. If not provided, defaults to the locale's first day of the week.                                                                                       |
| `weekdayFormat`           | `'narrow' \| 'short' \| 'long'`                                                                                                                                                | `'narrow'`| The format to use for the weekday strings provided via the `weekdays` slot prop.                                                                                                                                                                                      |
| `calendarLabel`           | `string`                                                                                                                                                                       | undefined | The accessible label for the calendar.                                                                                                                                                                                                                                 |
| `fixedWeeks`              | `boolean`                                                                                                                                                                      | `false`   | Whether to always display 6 weeks in the calendar.                                                                                                                                                                                                                     |
| `maxValue`                | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The maximum date that can be selected. Dates beyond this are disabled/invalid.                                                                                                                                                                                         |
| `minValue`                | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The minimum date that can be selected. Dates before this are disabled/invalid.                                                                                                                                                                                         |
| `locale`                  | `string`                                                                                                                                                                       | `'en'`    | The locale to use for formatting dates. Affects segment order, separators, weekday names, and calendar layout.                                                                                                                                                         |
| `numberOfMonths`          | `number`                                                                                                                                                                       | `1`       | The number of months to display at once in the calendar.                                                                                                                                                                                                               |
| `disabled`                | `boolean`                                                                                                                                                                      | `false`   | Whether the Date Picker is disabled.                                                                                                                                                                                                                                   |
| `readonly`                | `boolean`                                                                                                                                                                      | `false`   | Whether the Date Picker is readonly.                                                                                                                                                                                                                                   |
| `hourCycle`               | `'12' \| '24'`                                                                                                                                                                 | undefined | The hour cycle to use for formatting times. Defaults to the locale preference.                                                                                                                                                                                         |
| `granularity`             | `'day' \| 'hour' \| 'minute' \| 'second'`                                                                                                                                      | undefined | The granularity to use for formatting the field. Defaults to `'day'` if a `CalendarDate` is provided, otherwise defaults to `'minute'`. The field renders segments for each part of the date up to and including the specified granularity.                            |
| `hideTimeZone`            | `boolean`                                                                                                                                                                      | `false`   | Whether to hide the time zone segment of the field.                                                                                                                                                                                                                    |
| `initialFocus`            | `boolean`                                                                                                                                                                      | `false`   | If `true`, the calendar focuses the selected day, today, or the first day of the month (in that order) depending on what is visible when the calendar mounts.                                                                                                          |
| `monthFormat`             | `'short' \| 'long' \| 'narrow' \| 'numeric' \| '2-digit' \| ((month: number) => string)`                                                                                       | `'long'`  | The format to use for the month strings provided via the `months` slot prop.                                                                                                                                                                                           |
| `yearFormat`              | `'numeric' \| '2-digit' \| ((year: number) => string)`                                                                                                                         | `'numeric'`| The format to use for the year strings provided via the `years` slot prop.                                                                                                                                                                                            |
| `children`                | `Snippet`                                                                                                                                                                      | undefined | The children content to render.                                                                                                                                                                                                                                        |

> **Bindable props:** `value`, `placeholder`, and `open` support `bind:value` / `bind:placeholder` / `bind:open`. For fully controlled state, use Svelte [Function Bindings](https://svelte.dev/docs/svelte/bind#Function-bindings) (e.g. `bind:value={getValue, setValue}`).

### DatePicker.Label

The accessible label for the date field.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLSpanElement` — **bindable**                                      | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.Input

The field input component which contains the segments of the date field. It iterates over the resolved segments and exposes them via its `children` snippet.

| Property   | Type                                                                  | Default   | Description                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLDivElement` — **bindable**                                       | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                  |
| `children` | `Snippet` with props `{ segments: Array<{ part: SegmentPart; value: string }> }` | undefined | The children content to render. Receives the array of segments to render. Typically includes a `DatePicker.Trigger` as well.                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |
| `name`     | `string`                                                              | undefined | The name of the date field used for form submission. If provided, a hidden input element is rendered alongside the date field.                              |

### DatePicker.Segment

A single segment of the date field. Renders one editable part of the date (or a literal separator).

| Property   | Type                                                                                                                                                                       | Default   | Description                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `part`     | `SegmentPart` ( `"day" \| "month" \| "year" \| "hour" \| "minute" \| "second" \| "dayPeriod" \| "timeZoneName" \| "literal"` ) — **required**                             | undefined | The part of the date to render.                                                                                                               |
| `ref`      | `HTMLDivElement` — **bindable**                                                                                                                                            | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                                                                                                                                  | undefined | The children content to render. Typically the `value` string from the parent segment loop.                                                   |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                 | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.Trigger

A component which toggles the opening and closing of the popover on press. Usually rendered inside the `DatePicker.Input` children snippet, next to the segments.

| Property     | Type                                                                  | Default   | Description                                                                                                                                                 |
| ------------ | --------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openOnHover`| `boolean`                                                             | `false`   | Whether the popover should open when the trigger is hovered.                                                                                                |
| `openDelay`  | `number`                                                              | `700`     | The delay in milliseconds before the popover opens after hovering the trigger. Only applies when `openOnHover` is `true`.                                   |
| `closeDelay` | `number`                                                              | `300`     | The delay in milliseconds before the popover closes after the mouse leaves the trigger or content. Only applies when `openOnHover` is `true`.               |
| `ref`        | `HTMLButtonElement` — **bindable**                                    | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                  |
| `children`   | `Snippet`                                                             | undefined | The children content to render.                                                                                                                             |
| `child`      | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                    |

### DatePicker.Content

The contents of the popover which are displayed when the popover is open. Uses [Floating UI](https://floating-ui.com/) to position the content relative to the trigger. The `DatePicker.Calendar` is rendered inside this.

| Property                       | Type                                                                                                                                                                           | Default     | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `side`                         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                                                                                                       | `'bottom'`  | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur.                                                                                                                                                                                                                                                                                                          |
| `sideOffset`                   | `number`                                                                                                                                                                       | `0`         | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                                                                                      |
| `align`                        | `'start' \| 'center' \| 'end'`                                                                                                                                                 | `'start'`   | The preferred alignment of the anchor to render the floating element against when open. May change when collisions occur.                                                                                                                                                                                                                                                                                                           |
| `alignOffset`                  | `number`                                                                                                                                                                       | `0`         | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                                                                                      |
| `arrowPadding`                 | `number`                                                                                                                                                                       | `0`         | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                                                                               |
| `avoidCollisions`              | `boolean`                                                                                                                                                                      | `true`      | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges.                                                                                                                                                                                                                                                                                                                               |
| `collisionBoundary`            | `Element \| null`                                                                                                                                                              | undefined   | A boundary element or array of elements to check for collisions against.                                                                                                                                                                                                                                                                                                                                                            |
| `collisionPadding`             | `number \| Partial<Record<Side, number>>`                                                                                                                                      | `0`         | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                                                                               |
| `sticky`                       | `'partial' \| 'always'`                                                                                                                                                        | `'partial'` | The sticky behavior on the align axis. `'partial'` keeps the content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps the content in the boundary regardless.                                                                                                                                                                                                                          |
| `hideWhenDetached`             | `boolean`                                                                                                                                                                      | `true`      | When `true`, hides the content when it is detached from the DOM. Useful for hiding content when the user scrolls away.                                                                                                                                                                                                                                                                                                              |
| `updatePositionStrategy`       | `'optimized' \| 'always'`                                                                                                                                                      | `'optimized'`| The strategy to use when updating the position of the content. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes.                                                                                                                                                                                                                                          |
| `strategy`                     | `'fixed' \| 'absolute'`                                                                                                                                                        | `'fixed'`   | The positioning strategy to use for the floating element. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor.                                                                                                                                                                                                                                                          |
| `preventScroll`                | `boolean`                                                                                                                                                                      | `false`     | When `true`, prevents the body from scrolling when the content is open. Useful when using the content as a modal.                                                                                                                                                                                                                                                                                                                   |
| `customAnchor`                 | `string \| HTMLElement \| Measurable \| null`                                                                                                                                  | `null`      | Use an element other than the trigger to anchor the content to. If provided, the content anchors to the provided element instead of the trigger.                                                                                                                                                                                                                                                                                    |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                                                                                                                | undefined   | Callback fired when an outside interaction event occurs (a `pointerdown` event). Call `event.preventDefault()` to prevent the default behavior.                                                                                                                                                                                                                                                                                     |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                                                                                                  | undefined   | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior.                                                                                                                                                                                                                                                                                                              |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                                                                                                   | `'close'`   | Behavior when an interaction occurs outside the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent if it exists, otherwise ignores.                                                                                                                                       |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                                                                                                               | undefined   | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior.                                                                                                                                                                                                                                                                                          |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                                                                                                   | `'close'`   | Behavior when an escape keydown event occurs in the floating content. Same options as `interactOutsideBehavior`.                                                                                                                                                                                                                                                                                                                    |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                                                                                                       | undefined   | Event handler called when auto-focusing the content as it is opened. Can be prevented.                                                                                                                                                                                                                                                                                                                                              |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                                                                                                       | undefined   | Event handler called when auto-focusing the content as it is closed. Can be prevented.                                                                                                                                                                                                                                                                                                                                              |
| `trapFocus`                    | `boolean`                                                                                                                                                                      | `true`      | Whether to trap focus within the content when open.                                                                                                                                                                                                                                                                                                                                                                                 |
| `preventOverflowTextSelection` | `boolean`                                                                                                                                                                      | `true`      | When `true`, prevents text selection from overflowing the bounds of the element.                                                                                                                                                                                                                                                                                                                                                    |
| `forceMount`                   | `boolean`                                                                                                                                                                      | `false`     | Whether to forcefully mount the content. Useful for using Svelte transitions or another animation library for the content.                                                                                                                                                                                                                                                                                                          |
| `dir`                          | `'ltr' \| 'rtl'`                                                                                                                                                               | `'ltr'`     | The reading direction of the app.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ref`                          | `HTMLDivElement` — **bindable**                                                                                                                                                | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                                                                                                                                                                                                                                          |
| `children`                     | `Snippet`                                                                                                                                                                      | undefined   | The children content to render.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `child`                        | `Snippet` with props `{ wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean }`                                                                | undefined   | Use render delegation to render your own element. `wrapperProps` are for the positioning wrapper (do not style this element — styling should be applied to the content element). `props` are for your content element (apply custom styles here). `open` is the content visibility state, useful for conditional rendering with Svelte transitions. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more.     |

> **Floating content wrapper rule:** When using the `child` snippet on `Content`, the `wrapperProps` must be spread onto a wrapper element that contains your custom content element. Do **not** style the wrapper element — apply all styling to the inner content element via `props`. The wrapper handles positioning and must remain unstyled for Floating UI to work correctly.

### DatePicker.Portal

When used, renders the popover content into the body or a custom `to` element when open. Wrap `DatePicker.Content` with this to portal it out of the DOM hierarchy.

| Property   | Type                        | Default         | Description                                                                                                                      |
| ---------- | --------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `to`       | `Element \| string`         | `document.body` | Where to render the content when it is open. Defaults to the body.                                                               |
| `disabled` | `boolean`                   | `false`         | Whether the portal is disabled. When disabled, the content is rendered in its original DOM location.                            |
| `children` | `Snippet`                   | undefined       | The children content to render.                                                                                                  |

### DatePicker.Calendar

The calendar component containing the grids of dates. Provides the `months` and `weekdays` snippet props used to render the grid structure.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLDivElement` — **bindable**                                       | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet` with props `{ months: Month[]; weekdays: string[] }`       | undefined | The children content to render. Receives the months and weekdays arrays to render the grid.                                                  |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.Header

The header of the calendar, typically containing the prev/next buttons and the heading.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLElement` — **bindable**                                          | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.PrevButton

The previous button of the calendar. Navigates to the previous month (or previous page of months if `pagedNavigation` is enabled).

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLButtonElement` — **bindable**                                    | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.Heading

The heading of the calendar. Displays the current month and year.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLDivElement` — **bindable**                                       | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.NextButton

The next button of the calendar. Navigates to the next month (or next page of months if `pagedNavigation` is enabled).

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLButtonElement` — **bindable**                                    | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.Grid

The grid of dates in the calendar, typically representing a single month. Renders as a `<table>`.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableElement` — **bindable**                                     | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.GridHead

The head of the grid of dates in the calendar. Renders as a `<thead>`.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableSectionElement` — **bindable**                              | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.GridBody

The body of the grid of dates in the calendar. Renders as a `<tbody>`.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableSectionElement` — **bindable**                              | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.GridRow

A row in the grid of dates in the calendar. Renders as a `<tr>`. Used both for weekday header rows and week-of-dates rows.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableRowElement` — **bindable**                                  | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.HeadCell

A cell in the head of the grid of dates in the calendar. Renders as a `<th>`. Displays a weekday label.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLTableCellElement` — **bindable**                                 | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.Cell

A cell in the calendar grid. Renders as a `<td>`. Requires `date` and `month` props to determine which date it represents and whether it is outside the current month.

| Property   | Type                                                                                                                                                                           | Default   | Description                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `date`     | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The date for the cell.                                                                                                                        |
| `month`    | `DateValue` ( `CalendarDate` \| `CalendarDateTime` \| `ZonedDateTime` )                                                                                                        | undefined | The current month the date is being displayed in. Used to determine if the date is outside the current month.                                 |
| `ref`      | `HTMLTableCellElement` — **bindable**                                                                                                                                          | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                                                                                                                                      | undefined | The children content to render.                                                                                                               |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`                                                                                                                     | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.Day

A day in the calendar grid. The clickable element inside a `Cell` that the user presses to select a date.

| Property   | Type                                                                  | Default   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `HTMLDivElement` — **bindable**                                       | `null`    | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                    |
| `children` | `Snippet`                                                             | undefined | The children content to render. Typically the day number (`date.day`).                                                                       |
| `child`    | `Snippet` with props `{ props: Record<string, unknown> }`            | undefined | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.      |

### DatePicker.MonthSelect

A select you can use to navigate to a specific month in the calendar view. Renders as a `<select>`. Place it inside the `DatePicker.Header` (or elsewhere in the calendar) to allow direct month jumping.

| Property      | Type                                                                                                                                                                             | Default     | Description                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `months`      | `number[]`                                                                                                                                                                       | `[1-12]`    | The month values to render in the select.                                                                                                                                                                       |
| `monthFormat` | `'narrow' \| 'short' \| 'long' \| 'numeric' \| '2-digit' \| ((month: number) => string)`                                                                                         | `'narrow'`  | The format to use for the month strings. If a function is provided, it is called with the month number as an argument and should return a string.                                                                                               |
| `ref`         | `HTMLSelectElement` — **bindable**                                                                                                                                               | `null`      | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                      |
| `children`    | `Snippet` with props `{ monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`                                              | undefined   | The children content to render. Receives the month items and the currently selected month item.                                                                                                                 |
| `child`       | `Snippet` with props `{ props: Record<string, unknown>; monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`              | undefined   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                                         |

### DatePicker.YearSelect

A select you can use to navigate to a specific year in the calendar view. Renders as a `<select>`. Place it inside the `DatePicker.Header` (or elsewhere in the calendar) to allow direct year jumping.

| Property     | Type                                                                                                                                                                           | Default                                                                                                                           | Description                                                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `years`      | `number[]`                                                                                                                                                                     | Current year or placeholder year (whichever is higher) + 10 and minus 100 years. Constrained by `minValue`/`maxValue` if provided. | The year values to render in the select.                                                                                                                                                                                                          |
| `yearFormat` | `'numeric' \| '2-digit' \| ((year: number) => string)`                                                                                                                         | `'numeric'`                                                                                                                       | The format to use for the year strings. If a function is provided, it is called with the year as an argument and should return a string.                                                                                                          |
| `ref`        | `HTMLSelectElement` — **bindable**                                                                                                                                             | `null`                                                                                                                            | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                                                       |
| `children`   | `Snippet` with props `{ yearItems: Array<{ value: number; label: string }>; selectedYearItem: { value: number; label: string } }`                                              | undefined                                                                                                                         | The children content to render. Receives the year items and the currently selected year item.                                                                                                                                                    |
| `child`      | `Snippet` with props `{ props: Record<string, unknown>; yearItems: Array<{ value: number; label: string }>; selectedYearItem: { value: number; label: string } }`              | undefined                                                                                                                         | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                                                                                                          |

---

## Data Attributes

### DatePicker.Label

| Data Attribute          | Value | Description                                        |
| ----------------------- | ----- | -------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.  |
| `data-disabled`         | `''`  | Present on the element when the field is disabled. |
| `data-date-field-label` | `''`  | Present on the element.                            |

### DatePicker.Input

| Data Attribute          | Value | Description                                         |
| ----------------------- | ----- | -------------------------------------------------- |
| `data-invalid`          | `''`  | Present on the element when the field is invalid.  |
| `data-disabled`         | `''`  | Present on the element when the field is disabled. |
| `data-date-field-input` | `''`  | Present on the element.                            |

### DatePicker.Segment

| Data Attribute            | Value                                                                                                               | Description                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `data-invalid`            | `''`                                                                                                                | Present on the element when the field is invalid.             |
| `data-disabled`           | `''`                                                                                                                | Present on the element when the field is disabled.            |
| `data-readonly`           | `''`                                                                                                                | Present on the element when the field or segment is readonly. |
| `data-segment`            | `'day' \| 'month' \| 'year' \| 'hour' \| 'minute' \| 'second' \| 'dayPeriod' \| 'timeZoneName' \| 'literal'`       | The part of the date being rendered.                          |
| `data-date-field-segment` | `''`                                                                                                                | Present on the element.                                       |

### DatePicker.Trigger

| Data Attribute         | Value                       | Description                            |
| ---------------------- | --------------------------- | -------------------------------------- |
| `data-state`           | `'open' \| 'closed'`        | Whether the popover is open or closed. |
| `data-popover-trigger` | `''`                        | Present on the trigger element.        |

### DatePicker.Content

| Data Attribute         | Value                       | Description                                                                                        |
| ---------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| `data-state`           | `'open' \| 'closed'`        | Whether the popover is open or closed.                                                             |
| `data-starting-style`  | `''`                        | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style`    | `''`                        | Present while closing before unmount. Use this to define the ending styles for CSS transitions.    |
| `data-popover-content` | `''`                        | Present on the content element.                                                                    |

### DatePicker.Calendar

| Data Attribute       | Value | Description                                                 |
| -------------------- | ----- | ----------------------------------------------------------- |
| `data-invalid`       | `''`  | Present on the calendar element when the calendar is invalid.  |
| `data-disabled`      | `''`  | Present on the calendar element when the calendar is disabled. |
| `data-readonly`      | `''`  | Present on the calendar element when the calendar is readonly. |
| `data-calendar-root` | `''`  | Present on the calendar element.                            |

### DatePicker.Header

| Data Attribute         | Value | Description                                                  |
| ---------------------- | ----- | ------------------------------------------------------------ |
| `data-disabled`        | `''`  | Present on the header element when the calendar is disabled. |
| `data-readonly`        | `''`  | Present on the header element when the calendar is readonly. |
| `data-calendar-header` | `''`  | Present on the header element.                               |

### DatePicker.PrevButton

| Data Attribute              | Value | Description                                                                      |
| --------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`             | `''`  | Present on the prev button element when the calendar or this button is disabled. |
| `data-calendar-prev-button` | `''`  | Present on the prev button element.                                              |

### DatePicker.Heading

| Data Attribute          | Value | Description                                                   |
| ----------------------- | ----- | ------------------------------------------------------------- |
| `data-disabled`         | `''`  | Present on the heading element when the calendar is disabled. |
| `data-readonly`         | `''`  | Present on the heading element when the calendar is readonly. |
| `data-calendar-heading` | `''`  | Present on the heading element.                               |

### DatePicker.NextButton

| Data Attribute              | Value | Description                                                                      |
| --------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`             | `''`  | Present on the next button element when the calendar or this button is disabled. |
| `data-calendar-next-button` | `''`  | Present on the next button element.                                              |

### DatePicker.Grid

| Data Attribute       | Value | Description                                                |
| -------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`      | `''`  | Present on the grid element when the calendar is disabled. |
| `data-readonly`      | `''`  | Present on the grid element when the calendar is readonly. |
| `data-calendar-grid` | `''`  | Present on the grid element.                               |

### DatePicker.GridHead

| Data Attribute            | Value | Description                                                     |
| ------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`           | `''`  | Present on the grid head element when the calendar is disabled. |
| `data-readonly`           | `''`  | Present on the grid head element when the calendar is readonly. |
| `data-calendar-grid-head` | `''`  | Present on the grid head element.                               |

### DatePicker.GridBody

| Data Attribute             | Value | Description                                                |
| -------------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`            | `''`  | Present on the grid element when the calendar is disabled. |
| `data-readonly`            | `''`  | Present on the grid element when the calendar is readonly. |
| `data-calendar-grid-body`  | `''`  | Present on the grid body element.                          |

### DatePicker.GridRow

| Data Attribute           | Value | Description                                                    |
| ------------------------ | ----- | -------------------------------------------------------------- |
| `data-disabled`          | `''`  | Present on the grid row element when the calendar is disabled. |
| `data-readonly`          | `''`  | Present on the grid row element when the calendar is readonly. |
| `data-calendar-grid-row` | `''`  | Present on the grid row element.                               |

### DatePicker.HeadCell

| Data Attribute            | Value | Description                                                     |
| ------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`           | `''`  | Present on the head cell element when the calendar is disabled. |
| `data-readonly`           | `''`  | Present on the head cell element when the calendar is readonly. |
| `data-calendar-head-cell` | `''`  | Present on the head cell element.                               |

### DatePicker.Cell

| Data Attribute                | Value | Description                                         |
| ----------------------------- | ----- | --------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                   |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                |
| `data-today`                  | `''`  | Present when the day is today.                      |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.  |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months. |
| `data-focused`                | `''`  | Present when the day is focused.                    |
| `data-selected`               | `''`  | Present when the day is selected.                   |
| `data-value`                  | `''`  | The date in the format `YYYY-MM-DD`.                |
| `data-calendar-cell`          | `''`  | Present on the cell element.                        |

### DatePicker.Day

| Data Attribute                | Value | Description                                         |
| ----------------------------- | ----- | --------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                   |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                |
| `data-today`                  | `''`  | Present when the day is today.                      |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.  |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months. |
| `data-focused`                | `''`  | Present when the day is focused.                    |
| `data-selected`               | `''`  | Present when the day is selected.                   |
| `data-value`                  | `''`  | The date in the format `YYYY-MM-DD`.                |
| `data-calendar-day`           | `''`  | Present on the day element.                         |

### DatePicker.MonthSelect

| Data Attribute               | Value | Description                                                        |
| ---------------------------- | ----- | ------------------------------------------------------------------ |
| `data-disabled`              | `''`  | Present on the month select element when the calendar is disabled. |
| `data-calendar-month-select` | `''`  | Present on the month select element.                               |

### DatePicker.YearSelect

| Data Attribute              | Value | Description                                                       |
| --------------------------- | ----- | ----------------------------------------------------------------- |
| `data-disabled`             | `''`  | Present on the year select element when the calendar is disabled. |
| `data-calendar-year-select` | `''`  | Present on the year select element.                               |

---

## CSS Variables

The `DatePicker.Content` part (sourced from the Popover component) exposes the following CSS variables for advanced positioning and layout use cases:

| CSS Variable                              | Description                                  |
| ----------------------------------------- | -------------------------------------------- |
| `--bits-popover-content-transform-origin` | The transform origin of the content element. |
| `--bits-popover-content-available-width`  | The available width of the content element.  |
| `--bits-popover-content-available-height` | The available height of the content element. |
| `--bits-popover-anchor-width`             | The width of the anchor element.             |
| `--bits-popover-anchor-height`            | The height of the anchor element.            |

No other parts of the Date Picker define component-specific `--bits-*` CSS variables. Styling is driven through props, data attributes, and the standard `class` attribute on each part.

---

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
</script>

<DatePicker.Root>
  <DatePicker.Label>Birthday</DatePicker.Label>
  <DatePicker.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DatePicker.Segment {part}>
          {value}
        </DatePicker.Segment>
      {/each}
      <DatePicker.Trigger />
    {/snippet}
  </DatePicker.Input>
  <DatePicker.Content>
    <DatePicker.Calendar>
      {#snippet children({ months, weekdays })}
        <DatePicker.Header>
          <DatePicker.PrevButton />
          <DatePicker.Heading />
          <DatePicker.NextButton />
        </DatePicker.Header>
        {#each months as month}
          <DatePicker.Grid>
            <DatePicker.GridHead>
              <DatePicker.GridRow>
                {#each weekdays as day}
                  <DatePicker.HeadCell>{day}</DatePicker.HeadCell>
                {/each}
              </DatePicker.GridRow>
            </DatePicker.GridHead>
            <DatePicker.GridBody>
              {#each month.weeks as weekDates}
                <DatePicker.GridRow>
                  {#each weekDates as date}
                    <DatePicker.Cell {date} month={month.value}>
                      <DatePicker.Day />
                    </DatePicker.Cell>
                  {/each}
                </DatePicker.GridRow>
              {/each}
            </DatePicker.GridBody>
          </DatePicker.Grid>
        {/each}
      {/snippet}
    </DatePicker.Calendar>
  </DatePicker.Content>
</DatePicker.Root>
```

### Controlled Value (Two-Way Binding)

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myValue = $state(new CalendarDateTime(2024, 8, 3, 12, 30));
</script>

<button onclick={() => (myValue = myValue.add({ days: 1 }))}>
  Add 1 day
</button>

<DatePicker.Root bind:value={myValue}>
  <!-- ... -->
</DatePicker.Root>
```

### Fully Controlled Value (Function Binding)

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
  import type { DateValue } from "@internationalized/date";

  let myValue = $state<DateValue>();

  function getValue() {
    return myValue;
  }
  function setValue(newValue: DateValue) {
    myValue = newValue;
  }
</script>

<DatePicker.Root bind:value={getValue, setValue}>
  <!-- ... -->
</DatePicker.Root>
```

### Controlled Placeholder (Two-Way Binding)

The `placeholder` determines which month the calendar shows when no value is selected. It updates as the user navigates. Bind to it to programmatically control the calendar's view.

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myPlaceholder = $state();
</script>

<button
  onclick={() => {
    myPlaceholder = new CalendarDateTime(2024, 8, 3, 12, 30);
  }}
>
  Set placeholder to August 3rd, 2024
</button>

<DatePicker.Root bind:placeholder={myPlaceholder}>
  <!-- ... -->
</DatePicker.Root>
```

### Controlled Open State (Two-Way Binding)

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";

  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open DatePicker</button>

<DatePicker.Root bind:open={isOpen}>
  <!-- ... -->
</DatePicker.Root>
```

### Fully Controlled Open State (Function Binding)

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";

  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<DatePicker.Root bind:open={getOpen, setOpen}>
  <!-- ... -->
</DatePicker.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet on any part to take full control over the rendered element while retaining the component's behavior. This example shows render delegation on `DatePicker.Content` with Svelte transitions:

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<DatePicker.Root>
  <DatePicker.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DatePicker.Segment {part}>{value}</DatePicker.Segment>
      {/each}
      <DatePicker.Trigger />
    {/snippet}
  </DatePicker.Input>
  <DatePicker.Content forceMount>
    {#snippet child({ wrapperProps, props, open })}
      <div {...wrapperProps}>
        {#if open}
          <div transition:fly={{ y: 8 }} {...props}>
            <DatePicker.Calendar>
              <!-- calendar content -->
            </DatePicker.Calendar>
          </div>
        {/if}
      </div>
    {/snippet}
  </DatePicker.Content>
</DatePicker.Root>
```

When using the `child` snippet on `Content`, spread `wrapperProps` onto the outer wrapper (do not style it) and spread `props` onto your inner content element (apply styles here). The `open` prop enables conditional rendering for transitions. Set `forceMount` to `true` so the content stays mounted and the transition can play.

### With Month and Year Selects

Use `MonthSelect` and `YearSelect` inside the header to allow direct navigation to any month or year:

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
</script>

<DatePicker.Root>
  <DatePicker.Input>
    {#snippet children({ segments })}
      {#each segments as { part, value }}
        <DatePicker.Segment {part}>{value}</DatePicker.Segment>
      {/each}
      <DatePicker.Trigger />
    {/snippet}
  </DatePicker.Input>
  <DatePicker.Content>
    <DatePicker.Calendar>
      {#snippet children({ months, weekdays })}
        <DatePicker.Header>
          <DatePicker.PrevButton />
          <DatePicker.MonthSelect monthFormat="long" />
          <DatePicker.YearSelect />
          <DatePicker.NextButton />
        </DatePicker.Header>
        <!-- grid rendering -->
      {/snippet}
    </DatePicker.Calendar>
  </DatePicker.Content>
</DatePicker.Root>
```

### With Disabled and Unavailable Dates

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
  import { CalendarDate, type DateValue } from "@internationalized/date";

  function isDateDisabled(date: DateValue) {
    // disable weekends
    const day = date.toDate().getDay();
    return day === 0 || day === 6;
  }

  function isDateUnavailable(date: DateValue) {
    // mark a specific date unavailable
    return date.toString() === "2024-08-15";
  }
</script>

<DatePicker.Root {isDateDisabled} {isDateUnavailable}>
  <!-- ... -->
</DatePicker.Root>
```

### Localization

```svelte
<script lang="ts">
  import { DatePicker } from "bits-ui";
</script>

<DatePicker.Root locale="de" weekdayFormat="short">
  <!-- ... -->
</DatePicker.Root>
```

---

## Accessibility

The `DatePicker` is designed for full keyboard interaction across both the date field segments and the calendar grid. The field and calendar each have their own keyboard model.

### Date Field Keyboard Navigation

Each segment in the input field is a focusable element. Users navigate between and within segments using the following keys:

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

### Calendar Keyboard Navigation

When the calendar grid has focus, the following keys move the selected/focused date:

| Key                      | Action                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `Arrow Left`             | Moves focus to the previous day.                                                             |
| `Arrow Right`            | Moves focus to the next day.                                                                 |
| `Arrow Up`               | Moves focus to the same day of the previous week.                                            |
| `Arrow Down`             | Moves focus to the same day of the next week.                                                |
| `Home`                   | Moves focus to the first day of the week.                                                    |
| `End`                    | Moves focus to the last day of the week.                                                     |
| `Page Up`                | Moves focus to the same day of the previous month.                                           |
| `Page Down`              | Moves focus to the same day of the next month.                                               |
| `Shift` + `Page Up`      | Moves focus to the same day of the previous year.                                            |
| `Shift` + `Page Down`    | Moves focus to the same day of the next year.                                                |
| `Enter` / `Space`        | Selects the focused date.                                                                    |
| `Escape`                 | Closes the popover (if `escapeKeydownBehavior` is `'close'`).                               |

### Popover Keyboard Behavior

| Key                      | Action                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `Tab`                    | Moves focus between focusable elements within the popover content (focus is trapped by default). |
| `Shift` + `Tab`          | Moves focus backwards within the popover content.                                            |
| `Escape`                 | Closes the popover (configurable via `escapeKeydownBehavior`).                              |

The trigger has `aria-haspopup` and `aria-expanded` attributes wired automatically. The calendar is labeled via the `calendarLabel` prop (or the `Heading` content), and the grid uses `role="grid"` with appropriate `aria-selected`, `aria-disabled`, and `aria-invalid` attributes on cells and segments.

---

## Tips

### Use the Right `DateValue` Type

The type of object you pass as `value` or `placeholder` controls which segments the field renders:

- **`CalendarDate`** — date only (`YYYY-MM-DD`). Field defaults to `'day'` granularity. Use `parseDate` to create one from an ISO string.
- **`CalendarDateTime`** — date + time, no timezone. Use when time selection is needed. Use `parseDateTime` to parse from an ISO string.
- **`ZonedDateTime`** — date + time + timezone. Use when timezone awareness matters. Use `parseZonedDateTime` to parse, or `now(timeZone)` / `today(timeZone)` for the current moment/date.

The `placeholder` sets the starting point when there is no `value` and determines the `DateValue` type used by the field. To enable time selection, set the placeholder to a `CalendarDateTime`; to enable timezone selection, set it to a `ZonedDateTime`.

### `placeholder` Is Not Placeholder Text

The `placeholder` prop is the date the field starts from when the user begins cycling segments and the month the calendar displays when no value is selected — it is **not** greyed-out hint text. It also doubles as the mechanism for setting the field's granularity.

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

### Parsing ISO 8601 Strings

When loading values from a database or API (typically ISO 8601 strings), parse them into the appropriate `DateValue` before passing to the component:

| Function             | Input example                                  | Output type         |
| -------------------- | ---------------------------------------------- | ------------------- |
| `parseDate`          | `"2024-08-03"`                                 | `CalendarDate`      |
| `parseDateTime`      | `"2024-08-03T12:30:00"`                        | `CalendarDateTime`  |
| `parseZonedDateTime` | `"2024-08-03T12:30:00-04:00[America/New_York]"` | `ZonedDateTime`    |

### Floating Content Wrapper Rules

The `DatePicker.Content` uses Floating UI for positioning. When you use the `child` snippet for render delegation, you must follow the wrapper pattern:

1. Spread `wrapperProps` onto an outer wrapper element. This element handles positioning — **do not style it**.
2. Spread `props` onto your inner content element. Apply all custom styles and classes here.
3. Use the `open` snippet prop for conditional rendering when combining with Svelte transitions.
4. Set `forceMount` to `true` on `Content` when using transitions so the element stays mounted for the transition to play.

Incorrectly styling the wrapper element can break positioning, collision detection, and animations.

### `closeOnDateSelect` Behavior

By default, selecting a date in the calendar closes the popover (`closeOnDateSelect` is `true`). Set it to `false` to keep the popover open after selection — useful when the user might want to verify their selection or when using time segments that require further input.

### Leap Years for Birthdays

When building a date picker for something like a birthday, set the `placeholder` to a leap year so users born on February 29 can select the correct date.

### Customization via Underlying Components

The `DatePicker` is composed of three other Bits UI components: [Date Field](./date-field.md), [Calendar](https://bits-ui.com/docs/components/calendar), and [Popover](https://bits-ui.com/docs/components/popover). Refer to each component's documentation for additional customization options, all of which apply to the corresponding parts of the `DatePicker`.

### Readonly Segments

Use the `readonlySegments` prop on `DatePicker.Root` to make specific field segments non-editable while keeping others interactive. This is useful when part of the date should be fixed (e.g. a fixed year) while the rest remains user-editable. Readonly segments display the `data-readonly` attribute for styling.
