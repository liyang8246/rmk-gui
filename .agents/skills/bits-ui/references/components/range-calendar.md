# Range Calendar

Enables users to select a range of dates using a calendar interface. A headless, fully accessible calendar primitive specialized for date range selection, supporting localization, validation, min/max day constraints, and programmatic navigation.

## Overview

The `RangeCalendar` component renders an interactive calendar grid for selecting a range of dates — a start date and an end date. Unlike the [Calendar](./calendar.md) component which supports single or multiple discrete date selection, RangeCalendar is purpose-built for contiguous range selection: the user clicks a start date, then an end date, and all dates in between are highlighted as the selection.

It is built on top of the `@internationalized/date` library, which means all date values are represented as immutable `DateValue` objects — never plain JavaScript `Date` instances.

There are three `DateValue` types, all imported from `@internationalized/date`:

| Type               | Represents                                    | Example                                                    |
| ------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| `CalendarDate`     | A date without a time component               | `new CalendarDate(2024, 8, 3)`                             |
| `CalendarDateTime` | A date with a time but no timezone            | `new CalendarDateTime(2024, 8, 3, 12, 30)`                 |
| `ZonedDateTime`    | A date with a time and an explicit timezone   | `toZoned(today(getLocalTimeZone()), 'America/New_York')`  |

The `DateValue` type is a union of all three: `CalendarDate | CalendarDateTime | ZonedDateTime`.

The `value` prop is a `DateRange` object:

```ts
type DateRange = {
  start: DateValue | undefined;
  end: DateValue | undefined;
};
```

Both `start` and `end` must be the same `DateValue` subtype — do not mix a `CalendarDate` start with a `CalendarDateTime` end. Either field may be `undefined` during the selection process (e.g., after the user picks a start date but before they pick an end date).

Before using this component, read `references/concepts/dates.md` to understand immutability, parsing, formatting, and the placeholder concept.

## Component Structure

The RangeCalendar is a compound component composed of the following parts:

- **`RangeCalendar.Root`** — The root container that holds all behavior, state, and other calendar parts. Renders a `<div>`.
- **`RangeCalendar.Header`** — A flex container for the navigation controls and heading. Renders an `<HTMLElement>` (default `<div>`).
- **`RangeCalendar.Heading`** — Displays the current month/year being viewed. Renders a `<div>`.
- **`RangeCalendar.PrevButton`** — A button that navigates the calendar to the previous month (or page). Renders a `<button>`.
- **`RangeCalendar.NextButton`** — A button that navigates the calendar to the next month (or page). Renders a `<button>`.
- **`RangeCalendar.Grid`** — The table element containing the calendar grid for a single month. Renders a `<table>`.
- **`RangeCalendar.GridHead`** — The `<thead>` of the grid, containing weekday labels.
- **`RangeCalendar.GridBody`** — The `<tbody>` of the grid, containing the date cells.
- **`RangeCalendar.GridRow`** — A `<tr>` row within the grid (used for both weekday headers and date rows).
- **`RangeCalendar.HeadCell`** — A `<th>` cell in the grid head, displaying a weekday label.
- **`RangeCalendar.Cell`** — A `<td>` cell in the grid body, representing a single date. Requires `date` and `month` props.
- **`RangeCalendar.Day`** — The interactive day element rendered inside a `RangeCalendar.Cell`. Renders a `<div>`.
- **`RangeCalendar.MonthSelect`** — A `<select>` for jumping directly to a specific month.
- **`RangeCalendar.YearSelect`** — A `<select>` for jumping directly to a specific year.

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
</script>

<RangeCalendar.Root>
  {#snippet children({ months, weekdays })}
    <RangeCalendar.Header>
      <RangeCalendar.PrevButton />
      <RangeCalendar.Heading />
      <RangeCalendar.NextButton />
    </RangeCalendar.Header>
    {#each months as month}
      <RangeCalendar.Grid>
        <RangeCalendar.GridHead>
          <RangeCalendar.GridRow>
            {#each weekdays as day}
              <RangeCalendar.HeadCell>
                {day}
              </RangeCalendar.HeadCell>
            {/each}
          </RangeCalendar.GridRow>
        </RangeCalendar.GridHead>
        <RangeCalendar.GridBody>
          {#each month.weeks as weekDates}
            <RangeCalendar.GridRow>
              {#each weekDates as date}
                <RangeCalendar.Cell {date} month={month.value}>
                  <RangeCalendar.Day />
                </RangeCalendar.Cell>
              {/each}
            </RangeCalendar.GridRow>
          {/each}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
    {/each}
  {/snippet}
</RangeCalendar.Root>
```

### The `children` Snippet Props

The `RangeCalendar.Root` `children` snippet receives `months` and `weekdays`:

```ts
type Month<T> = {
  // A DateValue representing the month this grid is for.
  // Since days from previous and next months may be included in the
  // calendar grid, this is the source of truth for the grid's month.
  value: DateValue;
  // An array of weeks, each containing an array of dates.
  // Each sub-array represents a week, useful for rendering as table rows.
  weeks: T[][];
  // A flat array of all dates in the grid, including outside-month fill dates.
  dates: T[];
};

type ChildrenSnippetProps = {
  months: Month<DateValue>[];
  weekdays: string[];
};
```

## API Reference

### `RangeCalendar.Root`

The root range calendar component which contains all other calendar components. It manages the selected `DateRange` value, the placeholder (view) state, localization, validation, range constraints, and the number of months displayed.

| Prop                    | Type                                                                                                                                                               | Default       | Description                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value` *($bindable)*   | `DateRange` — `{ start: DateValue \| undefined; end: DateValue \| undefined }`                                                                                     | `undefined`   | The selected date range.                                                                                                                                                                                                     |
| `onValueChange`         | `(range: DateRange) => void`                                                                                                                                       | `undefined`   | A function called when the selected date range changes.                                                                                                                                                                      |
| `placeholder` *($bindable)* | `DateValue`                                                                                                                                                    | `undefined`   | The placeholder date, which determines what month to display when no date is selected. Updates as the user navigates the calendar, and can be used to programmatically control the calendar's view.                         |
| `onPlaceholderChange`   | `(date: DateValue) => void`                                                                                                                                        | `undefined`   | A function called when the placeholder date changes.                                                                                                                                                                         |
| `pagedNavigation`       | `boolean`                                                                                                                                                          | `false`       | Whether to use paged navigation. When `true`, the previous and next buttons navigate by the number of months displayed at once, rather than by one month.                                                                    |
| `preventDeselect`       | `boolean`                                                                                                                                                          | `false`       | Whether to prevent the user from deselecting a date without selecting another date first.                                                                                                                                    |
| `weekdayFormat`         | `enum` — `'narrow'` \| `'short'` \| `'long'`                                                                                                                       | `'narrow'`    | The format to use for the weekday strings provided via the `weekdays` slot prop.                                                                                                                                             |
| `weekStartsOn`          | `number`                                                                                                                                                           | `undefined`   | An absolute day of the week to start the calendar on, regardless of locale. `0` is Sunday, `1` is Monday, etc. If not provided, the calendar defaults to the locale's first day of the week.                                |
| `calendarLabel`         | `string`                                                                                                                                                           | `undefined`   | The accessible label for the calendar.                                                                                                                                                                                       |
| `fixedWeeks`            | `boolean`                                                                                                                                                          | `false`       | Whether to always display 6 weeks in the calendar. Useful for keeping the calendar height visually consistent across months.                                                                                                 |
| `isDateDisabled`        | `(date: DateValue) => boolean`                                                                                                                                     | `undefined`   | A function that returns whether a date is disabled (cannot be focused or selected).                                                                                                                                          |
| `isDateUnavailable`     | `(date: DateValue) => boolean`                                                                                                                                     | `undefined`   | A function that returns whether a date is unavailable (can be focused but not selected).                                                                                                                                     |
| `maxValue`              | `DateValue`                                                                                                                                                        | `undefined`   | The maximum date that can be selected. Dates beyond this value are disabled.                                                                                                                                                 |
| `minValue`              | `DateValue`                                                                                                                                                        | `undefined`   | The minimum date that can be selected. Dates before this value are disabled.                                                                                                                                                 |
| `locale`                | `string`                                                                                                                                                           | `'en'`        | The locale to use for formatting dates. Accepts any locale supported by the `Intl.DateTimeFormat` API (e.g., `'fr-FR'`, `'ja-JP'`).                                                                                          |
| `numberOfMonths`        | `number`                                                                                                                                                           | `1`           | The number of months to display at once.                                                                                                                                                                                     |
| `disabled`              | `boolean`                                                                                                                                                          | `false`       | Whether the calendar is disabled.                                                                                                                                                                                            |
| `readonly`              | `boolean`                                                                                                                                                          | `false`       | Whether the calendar is readonly (navigation allowed, but no selection).                                                                                                                                                     |
| `disableDaysOutsideMonth` | `boolean`                                                                                                                                                        | `false`       | Whether to disable days outside the current month.                                                                                                                                                                           |
| `onStartValueChange`    | `(value: DateValue) => void`                                                                                                                                       | `undefined`   | A function called when the start date of the range changes.                                                                                                                                                                  |
| `onEndValueChange`      | `(value: DateValue) => void`                                                                                                                                       | `undefined`   | A function called when the end date of the range changes.                                                                                                                                                                    |
| `minDays`               | `number`                                                                                                                                                           | `undefined`   | The minimum number of days that can be selected in a range.                                                                                                                                                                  |
| `maxDays`               | `number`                                                                                                                                                           | `undefined`   | The maximum number of days that can be selected in a range.                                                                                                                                                                  |
| `excludeDisabled`       | `boolean`                                                                                                                                                          | `false`       | Whether to automatically reset the range if any date within the selected range becomes disabled.                                                                                                                             |
| `monthFormat`           | `'short'` \| `'long'` \| `'narrow'` \| `'numeric'` \| `'2-digit'` \| `((month: number) => string)`                                                                | `'long'`      | The format to use for the month strings provided via the `months` slot prop.                                                                                                                                                 |
| `yearFormat`            | `'numeric'` \| `'2-digit'` \| `((year: number) => string)`                                                                                                         | `'numeric'`   | The format to use for the year strings provided via the `years` slot prop.                                                                                                                                                   |
| `ref` *($bindable)*     | `HTMLDivElement`                                                                                                                                                   | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                                   |
| `children`              | `Snippet` — `{ months: Month<DateValue>[]; weekdays: string[] }`                                                                                                   | `undefined`   | The children content to render. Receives `months` and `weekdays` as snippet props.                                                                                                                                           |
| `child`                 | `Snippet` — `{ props: Record<string, unknown>; months: Month<DateValue>[]; weekdays: string[] }`                                                                  | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.                                                                                                                           |

> **Bindable props**: `value`, `placeholder`, and `ref` are all `$bindable`. Use `bind:value`, `bind:placeholder`, and `bind:ref` for two-way binding, or function bindings (`bind:value={getValue, setValue}`) for full control.

> **Placeholder default**: When no `placeholder` is provided, it defaults to the closest allowed (by `maxValue`/`minValue`) value to the current date, and is of type `CalendarDate`.

> **Range-specific props**: `minDays`, `maxDays`, `excludeDisabled`, `onStartValueChange`, and `onEndValueChange` are unique to RangeCalendar and do not exist on the standard Calendar component.

### `RangeCalendar.Header`

The header of the calendar, typically containing the navigation buttons and heading.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLElement`                                   | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.Heading`

The heading of the calendar, displaying the current month and year being viewed.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLDivElement`                                | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.PrevButton`

A button that navigates the calendar to the previous month, or the previous page if `pagedNavigation` is enabled.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLButtonElement`                             | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.NextButton`

A button that navigates the calendar to the next month, or the next page if `pagedNavigation` is enabled.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLButtonElement`                             | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.Grid`

The grid of dates in the calendar, typically representing a single month. Renders a `<table>` element.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableElement`                              | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.GridHead`

The head (`<thead>`) of the grid of dates, containing weekday labels.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableSectionElement`                       | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.GridBody`

The body (`<tbody>`) of the grid of dates, containing the date rows.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableSectionElement`                       | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.GridRow`

A row (`<tr>`) in the grid of dates. Used for both the weekday header row and the date rows.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableRowElement`                           | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.HeadCell`

A cell (`<th>`) in the head of the grid, displaying a weekday label.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableCellElement`                          | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.Cell`

A cell (`<td>`) in the grid body representing a single date. Requires both `date` and `month` props so the cell can determine whether the date falls inside or outside the displayed month, as well as its position within a selection range.

| Prop                | Type                                            | Default       | Description                                                                                                                        |
| ------------------- | ----------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `date`              | `DateValue`                                     | `undefined`   | The date for the cell.                                                                                                             |
| `month`             | `DateValue`                                     | `undefined`   | The current month the date is being displayed in. Used to determine if the date is outside the displayed month.                    |
| `ref` *($bindable)* | `HTMLTableCellElement`                          | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                         |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                                                    |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.                              |

### `RangeCalendar.Day`

The interactive day element rendered inside a `RangeCalendar.Cell`. Renders a `<div>` by default.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLDivElement`                                | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `RangeCalendar.MonthSelect`

A `<select>` element for navigating directly to a specific month in the calendar view. Updates the `placeholder` when changed.

| Prop                | Type                                                                                                                                                                             | Default       | Description                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `months`            | `number[]`                                                                                                                                                                       | `[1-12]`      | The month values (1–12) to render in the select.                                                                                                                                         |
| `monthFormat`       | `enum` — `'narrow'` \| `'short'` \| `'long'` \| `'numeric'` \| `'2-digit'` \| `((month: number) => string)`                                                                       | `'narrow'`    | The format to use for the month strings. If a function is provided, it will be called with the month number as an argument and should return a string.                                  |
| `ref` *($bindable)* | `HTMLSelectElement`                                                                                                                                                              | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                               |
| `children`          | `Snippet` — `{ monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`                                                       | `undefined`   | The children content to render. Receives `monthItems` and `selectedMonthItem`.                                                                                                           |
| `child`             | `Snippet` — `{ props: Record<string, unknown>; monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`                      | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.                                                                                       |

### `RangeCalendar.YearSelect`

A `<select>` element for navigating directly to a specific year in the calendar view. Updates the `placeholder` when changed.

| Prop                | Type                                                                                                                                                                           | Default                                                                                                              | Description                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `years`             | `number[]`                                                                                                                                                                     | Current year or placeholder year (whichever is higher) + 10 and minus 100 years. Constrained by `minValue`/`maxValue` if provided. | The year values to render in the select.                                                                                                                                                 |
| `yearFormat`        | `enum` — `'numeric'` \| `'2-digit'` \| `((year: number) => string)`                                                                                                            | `'numeric'`                                                                                                          | The format to use for the year strings. If a function is provided, it will be called with the year as an argument and should return a string.                                            |
| `ref` *($bindable)* | `HTMLSelectElement`                                                                                                                                                            | `null`                                                                                                               | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                               |
| `children`          | `Snippet` — `{ yearItems: Array<{ value: number; label: string }>; selectedYearItem: { value: number; label: string } }`                                                       | `undefined`                                                                                                          | The children content to render. Receives `yearItems` and `selectedYearItem`.                                                                                                             |
| `child`             | `Snippet` — `{ props: Record<string, unknown>; yearItems: Array<{ value: number; label: string }>; selectedYearItem: { value: number; label: string } }`                      | `undefined`                                                                                                          | Use render delegation to render your own element. See the Child Snippet docs for more information.                                                                                       |

## Data Attributes

Data attributes are present on the rendered elements and can be targeted via CSS or queried via JavaScript.

### `RangeCalendar.Root`

| Data Attribute             | Value | Description                                                |
| -------------------------- | ----- | ---------------------------------------------------------- |
| `data-invalid`             | `''`  | Present on the root element when the calendar is invalid.  |
| `data-disabled`            | `''`  | Present on the root element when the calendar is disabled. |
| `data-readonly`            | `''`  | Present on the root element when the calendar is readonly. |
| `data-range-calendar-root` | `''`  | Present on the root element.                               |

### `RangeCalendar.Header`

| Data Attribute               | Value | Description                                                  |
| ---------------------------- | ----- | ------------------------------------------------------------ |
| `data-disabled`              | `''`  | Present on the header element when the calendar is disabled. |
| `data-readonly`              | `''`  | Present on the header element when the calendar is readonly. |
| `data-range-calendar-header` | `''`  | Present on the header element.                               |

### `RangeCalendar.Heading`

| Data Attribute                | Value | Description                                                   |
| ----------------------------- | ----- | ------------------------------------------------------------- |
| `data-disabled`               | `''`  | Present on the heading element when the calendar is disabled. |
| `data-readonly`               | `''`  | Present on the heading element when the calendar is readonly. |
| `data-range-calendar-heading` | `''`  | Present on the heading element.                               |

### `RangeCalendar.NextButton`

| Data Attribute                    | Value | Description                                                                      |
| --------------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`                   | `''`  | Present on the next button element when the calendar or this button is disabled. |
| `data-range-calendar-next-button` | `''`  | Present on the next button element.                                              |

### `RangeCalendar.PrevButton`

| Data Attribute                    | Value | Description                                                                      |
| --------------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`                   | `''`  | Present on the prev button element when the calendar or this button is disabled. |
| `data-range-calendar-prev-button` | `''`  | Present on the prev button element.                                              |

### `RangeCalendar.Grid`

| Data Attribute             | Value | Description                                                |
| -------------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`            | `''`  | Present on the grid element when the calendar is disabled. |
| `data-readonly`            | `''`  | Present on the grid element when the calendar is readonly. |
| `data-range-calendar-grid` | `''`  | Present on the grid element.                               |

### `RangeCalendar.GridBody`

| Data Attribute                  | Value | Description                                                |
| ------------------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`                 | `''`  | Present on the grid body element when the calendar is disabled. |
| `data-readonly`                 | `''`  | Present on the grid body element when the calendar is readonly. |
| `data-range-calendar-grid-body` | `''`  | Present on the grid body element.                          |

### `RangeCalendar.GridHead`

| Data Attribute                  | Value | Description                                                     |
| ------------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`                 | `''`  | Present on the grid head element when the calendar is disabled. |
| `data-readonly`                 | `''`  | Present on the grid head element when the calendar is readonly. |
| `data-range-calendar-grid-head` | `''`  | Present on the grid head element.                               |

### `RangeCalendar.GridRow`

| Data Attribute                 | Value | Description                                                    |
| ------------------------------ | ----- | -------------------------------------------------------------- |
| `data-disabled`                | `''`  | Present on the grid row element when the calendar is disabled. |
| `data-readonly`                | `''`  | Present on the grid row element when the calendar is readonly. |
| `data-range-calendar-grid-row` | `''`  | Present on the grid row element.                               |

### `RangeCalendar.HeadCell`

| Data Attribute                  | Value | Description                                                     |
| ------------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`                 | `''`  | Present on the head cell element when the calendar is disabled. |
| `data-readonly`                 | `''`  | Present on the head cell element when the calendar is readonly. |
| `data-range-calendar-head-cell` | `''`  | Present on the head cell element.                               |

### `RangeCalendar.Cell`

| Data Attribute                | Value | Description                                                                                             |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                                                                       |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                                                                    |
| `data-today`                  | `''`  | Present when the day is today.                                                                          |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.                                                      |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months.                                                     |
| `data-focused`                | `''`  | Present when the day is focused.                                                                        |
| `data-selected`               | `''`  | Present when the day is selected.                                                                       |
| `data-value`                  | `''`  | The date in the format `"YYYY-MM-DD"`.                                                                  |
| `data-range-calendar-cell`    | `''`  | Present on the cell element.                                                                            |
| `data-range-start`            | `''`  | Present when the cell is the start of a selection range.                                                |
| `data-range-end`              | `''`  | Present when the cell is the end of a selection range.                                                  |
| `data-range-middle`           | `''`  | Present when the cell is in the middle of a selection range, but not the start or end of the selection. |
| `data-highlighted`            | `''`  | Present when the cell is highlighted within a selection range.                                          |

### `RangeCalendar.Day`

| Data Attribute                | Value | Description                                                                                             |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                                                                       |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                                                                    |
| `data-today`                  | `''`  | Present when the day is today.                                                                          |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.                                                      |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months.                                                     |
| `data-focused`                | `''`  | Present when the day is focused.                                                                        |
| `data-selected`               | `''`  | Present when the day is selected.                                                                       |
| `data-value`                  | `''`  | The date in the format `"YYYY-MM-DD"`.                                                                  |
| `data-range-calendar-day`     | `''`  | Present on the day element.                                                                             |
| `data-range-start`            | `''`  | Present when the cell is the start of a selection range.                                                |
| `data-range-end`              | `''`  | Present when the cell is the end of a selection range.                                                  |
| `data-range-middle`           | `''`  | Present when the cell is in the middle of a selection range, but not the start or end of the selection. |
| `data-highlighted`            | `''`  | Present when the cell is highlighted within a selection range.                                          |

### `RangeCalendar.MonthSelect`

| Data Attribute                     | Value | Description                                                        |
| ---------------------------------- | ----- | ------------------------------------------------------------------ |
| `data-disabled`                    | `''`  | Present on the month select element when the calendar is disabled. |
| `data-range-calendar-month-select` | `''`  | Present on the month select element.                               |

### `RangeCalendar.YearSelect`

| Data Attribute                    | Value | Description                                                       |
| --------------------------------- | ----- | ----------------------------------------------------------------- |
| `data-disabled`                   | `''`  | Present on the year select element when the calendar is disabled. |
| `data-range-calendar-year-select` | `''`  | Present on the year select element.                               |

## CSS Variables

The RangeCalendar component does not expose any `--bits-*` CSS variables. Styling is done entirely via class names or the `data-*` attributes listed above.

## Examples

### Basic Usage

A minimal range calendar with navigation:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
</script>

<RangeCalendar.Root>
  {#snippet children({ months, weekdays })}
    <RangeCalendar.Header>
      <RangeCalendar.PrevButton>Previous</RangeCalendar.PrevButton>
      <RangeCalendar.Heading />
      <RangeCalendar.NextButton>Next</RangeCalendar.NextButton>
    </RangeCalendar.Header>
    {#each months as month}
      <RangeCalendar.Grid>
        <RangeCalendar.GridHead>
          <RangeCalendar.GridRow>
            {#each weekdays as day}
              <RangeCalendar.HeadCell>{day}</RangeCalendar.HeadCell>
            {/each}
          </RangeCalendar.GridRow>
        </RangeCalendar.GridHead>
        <RangeCalendar.GridBody>
          {#each month.weeks as weekDates}
            <RangeCalendar.GridRow>
              {#each weekDates as date}
                <RangeCalendar.Cell {date} month={month.value}>
                  <RangeCalendar.Day>{date.day}</RangeCalendar.Day>
                </RangeCalendar.Cell>
              {/each}
            </RangeCalendar.GridRow>
          {/each}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
    {/each}
  {/snippet}
</RangeCalendar.Root>
```

### Controlled with Two-Way Binding

Use `bind:value` for automatic state synchronization. The value is a `DateRange` object with `start` and `end` properties:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
  import { CalendarDate } from "@internationalized/date";

  let value = $state({
    start: new CalendarDate(2024, 8, 3),
    end: new CalendarDate(2024, 8, 10),
  });
</script>

<RangeCalendar.Root bind:value>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Fully Controlled (Function Binding)

Use a function binding for complete control over reads and writes — useful when you need conditional updates or derived state:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
  import type { DateRange } from "@internationalized/date";

  let myValue = $state<DateRange>({ start: undefined, end: undefined });

  function getValue() {
    return myValue;
  }
  function setValue(newValue: DateRange) {
    myValue = newValue;
  }
</script>

<RangeCalendar.Root bind:value={getValue, setValue}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### With Placeholder

The `placeholder` prop controls what month the calendar displays when no value is selected, and it updates as the user navigates. Bind to it to programmatically control the view:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
  import { CalendarDate } from "@internationalized/date";

  let placeholder = $state(new CalendarDate(2024, 8, 3));
</script>

<RangeCalendar.Root bind:placeholder>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Min Days

Set `minDays` to require a minimum number of days in the selected range. The user cannot complete a selection that is shorter than the minimum:

```svelte
<RangeCalendar.Root minDays={3}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Max Days

Set `maxDays` to limit the maximum number of days that can be selected in a range:

```svelte
<RangeCalendar.Root maxDays={7}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Min and Max Days

Combine `minDays` and `maxDays` to constrain the range to a specific window:

```svelte
<RangeCalendar.Root minDays={3} maxDays={10}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Exclude Disabled Dates

Set `excludeDisabled` to automatically reset the range if any date within the selected range becomes disabled. This is useful when used with `isDateDisabled` to prevent ranges that span disabled dates:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
  import { isWeekend } from "@internationalized/date";
</script>

<RangeCalendar.Root
  excludeDisabled
  isDateDisabled={(date) => isWeekend(date, "en-US")}
>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Validation — Min/Max Values

Use `minValue` and `maxValue` to constrain selectable dates. Dates outside the range are disabled:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
  import { today, getLocalTimeZone } from "@internationalized/date";

  const todayDate = today(getLocalTimeZone());
</script>

<RangeCalendar.Root minValue={todayDate}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Validation — Unavailable and Disabled Dates

`isDateUnavailable` marks dates as unavailable (focusable but not selectable). `isDateDisabled` marks dates as fully disabled (not focusable):

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
  import type { DateValue } from "@internationalized/date";

  function isDateUnavailable(date: DateValue) {
    return date.day === 1; // every 1st of the month is unavailable
  }

  function isDateDisabled(date: DateValue) {
    return date.day === 15; // every 15th is disabled
  }
</script>

<RangeCalendar.Root {isDateUnavailable} {isDateDisabled}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Multiple Months

Display multiple months side by side using `numberOfMonths`. Combine with `pagedNavigation` to shift by the full number of displayed months instead of one:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
</script>

<RangeCalendar.Root numberOfMonths={2} pagedNavigation>
  {#snippet children({ months, weekdays })}
    <RangeCalendar.Header>
      <RangeCalendar.PrevButton />
      <RangeCalendar.Heading />
      <RangeCalendar.NextButton />
    </RangeCalendar.Header>
    <div class="flex gap-4">
      {#each months as month}
        <RangeCalendar.Grid>
          <!-- ... grid markup ... -->
        </RangeCalendar.Grid>
      {/each}
    </div>
  {/snippet}
</RangeCalendar.Root>
```

### Month and Year Selects

Use `RangeCalendar.MonthSelect` and `RangeCalendar.YearSelect` to let users jump directly to a month or year:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
</script>

<RangeCalendar.Root>
  {#snippet children({ months, weekdays })}
    <RangeCalendar.Header>
      <RangeCalendar.MonthSelect aria-label="Select month" />
      <RangeCalendar.YearSelect aria-label="Select year" />
    </RangeCalendar.Header>
    {#each months as month}
      <RangeCalendar.Grid>
        <!-- ... grid markup ... -->
      </RangeCalendar.Grid>
    {/each}
  {/snippet}
</RangeCalendar.Root>
```

### Localization

Set the `locale` prop to any value supported by `Intl.DateTimeFormat`. This affects weekday names, month names in the heading, and the first day of the week:

```svelte
<RangeCalendar.Root locale="fr-FR">
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

To force a specific first day of the week regardless of locale, use `weekStartsOn` (0 = Sunday, 6 = Saturday):

```svelte
<RangeCalendar.Root locale="fr-FR" weekStartsOn={1}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

### Default Value from ISO String

When dates come from a database or API as ISO 8601 strings, parse them with `parseDate` before passing them as the value:

```svelte
<script lang="ts">
  import { RangeCalendar } from "bits-ui";
  import { parseDate } from "@internationalized/date";

  // these came from a database/API call
  let value = $state({
    start: parseDate("2024-08-03"),
    end: parseDate("2024-08-10"),
  });
</script>

<RangeCalendar.Root {value}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</RangeCalendar.Root>
```

## Accessibility

The RangeCalendar follows WAI-ARIA patterns for grid-based date selection widgets.

### Keyboard Navigation

| Key                      | Action                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| `Arrow Left`             | Move focus to the previous day.                                        |
| `Arrow Right`            | Move focus to the next day.                                            |
| `Arrow Up`               | Move focus to the same day in the previous week.                       |
| `Arrow Down`             | Move focus to the same day in the next week.                           |
| `Home`                   | Move focus to the first day of the week.                               |
| `End`                    | Move focus to the last day of the week.                                |
| `Page Up`                | Move focus to the same day in the previous month.                      |
| `Page Down`              | Move focus to the same day in the next month.                          |
| `Shift` + `Page Up`      | Move focus to the same day in the previous year.                       |
| `Shift` + `Page Down`    | Move focus to the same day in the next year.                           |
| `Enter` / `Space`        | Select the focused date as the start or end of the range.              |
| `Tab`                    | Move focus between the grid, navigation buttons, and selects.          |

### ARIA and Labels

- The grid is labeled via the `calendarLabel` prop, which provides an accessible name for screen readers.
- The `RangeCalendar.Heading` provides a visible label for the current month/year.
- The `RangeCalendar.PrevButton` and `RangeCalendar.NextButton` have built-in `aria-label` attributes for screen reader navigation.
- Disabled dates are marked with `aria-disabled`, and unavailable dates with `aria-disabled` as well.
- When using `RangeCalendar.MonthSelect` and `RangeCalendar.YearSelect`, provide an `aria-label` to each for screen reader clarity.

### Range Selection Behavior

When a user interacts with the calendar to select a range:

1. The first `Enter`/`Space` or click sets the **start** date. The `placeholder` moves to this date.
2. As the user moves focus or hovers, dates between the start and the focused date are highlighted (marked with `data-highlighted`).
3. The second `Enter`/`Space` or click sets the **end** date, completing the range.
4. If the user selects a date before the current start, the start is reset to the new date (the previous start becomes a hovered mid-range date).
5. A subsequent selection after a complete range resets the selection, starting a new range from the clicked date.

## Tips

### Date Type Selection

- Use `CalendarDate` when you only need a date without a time component (e.g., a hotel check-in/check-out range). This is the default type for the `placeholder` when none is provided.
- Use `CalendarDateTime` when you need a date and time but don't need timezone awareness (e.g., a local event range).
- Use `ZonedDateTime` when you need full timezone awareness (e.g., scheduling across timezones). Use `toZoned()` from `@internationalized/date` to create one.
- The type you use for `value` and `placeholder` must be consistent — don't mix `CalendarDate` with `CalendarDateTime` in the same calendar instance unless you handle conversions explicitly.
- Both `start` and `end` within a `DateRange` must be the same `DateValue` subtype.

### The `DateRange` Type

The `value` prop accepts a `DateRange` object, not a tuple or array:

```ts
type DateRange = {
  start: DateValue | undefined;
  end: DateValue | undefined;
};
```

- Either `start` or `end` may be `undefined` during the selection process. For example, after the user picks a start date but before they pick an end date, the `value` will be `{ start: <DateValue>, end: undefined }`.
- Access the selected dates via `value.start` and `value.end`. Always check for `undefined` before using them.
- The `onStartValueChange` and `onEndValueChange` callbacks fire independently when the start or end date changes, which is useful for validation or side effects tied to a specific endpoint.

### Immutability

All `DateValue` objects from `@internationalized/date` are **immutable**. Methods like `.add()`, `.subtract()`, and `.set()` return **new** instances rather than mutating the original. Always assign the result:

```ts
// Correct — assigns the new instance
value = { ...value, end: value.end!.add({ days: 1 }) };

// Incorrect — original is unchanged, value.end stays the same
value.end!.add({ days: 1 });
```

This is why controlled examples use reassignment in click handlers rather than mutating a property.

### Parsing and Formatting

- Use `parseDate("2024-08-03")` to parse an ISO 8601 date string into a `CalendarDate`.
- Use `today(getLocalTimeZone())` to get today's date as a `CalendarDate` in the user's local timezone.
- Use `toCalendarDateTime()` or `toZoned()` to convert between date types when needed.
- Never pass a native JavaScript `Date` object as a prop value — the calendar expects `DateValue` types from `@internationalized/date`.

### Disabled vs. Unavailable Dates

- `isDateDisabled` — The date cannot be focused or selected at all. Use for dates that are entirely out of scope (e.g., past dates in a booking system).
- `isDateUnavailable` — The date can be focused and navigated to, but cannot be selected. Use for dates that are temporarily unavailable (e.g., booked dates, holidays).
- `minValue` and `maxValue` are a shorthand for disabling all dates before/after a boundary. They set `data-disabled` on the affected cells.
- When `excludeDisabled` is `true`, the range is automatically reset if any date within the selected range becomes disabled. This prevents ranges from spanning disabled dates.

### Min/Max Days Constraints

- `minDays` — The minimum number of days that must be in the selected range. The user cannot complete a selection shorter than this. Useful for minimum-stay requirements (e.g., hotel bookings requiring at least 2 nights).
- `maxDays` — The maximum number of days that can be in the selected range. The user cannot extend a selection beyond this. Useful for maximum-stay limits.
- Both can be combined: `minDays={3} maxDays={10}` requires a range between 3 and 10 days.
- These constraints affect the highlighted range preview as the user hovers/navigates after selecting a start date.

### Placeholder vs. Value

- `value` is the user's selection — the `DateRange` they've chosen.
- `placeholder` is the calendar's view state — what month/year is currently displayed. It defaults to the current date (clamped to `minValue`/`maxValue`) when no value is selected.
- When the user navigates the calendar, the `placeholder` updates to reflect the focused date, even if no value is selected.
- Binding to `placeholder` is the recommended way to programmatically control which month the calendar shows, such as when implementing month/year dropdowns.

### Range-Specific Data Attributes

The `Cell` and `Day` elements expose range-specific data attributes for styling:

- `data-range-start` — Present on the cell/day that is the start of the selection range.
- `data-range-end` — Present on the cell/day that is the end of the selection range.
- `data-range-middle` — Present on cells/days that are between the start and end (inclusive of neither).
- `data-highlighted` — Present on cells/days that are currently highlighted as part of the in-progress range preview (before the end date is selected).

Use these to apply distinct visual styles for the start, middle, and end of a range. For example, style `data-range-start` and `data-range-end` with fully rounded backgrounds, and `data-highlighted` with a lighter background to indicate the hovered/previewed range.

### Fixed Weeks

Enable `fixedWeeks` when the calendar height must remain constant across months (e.g., to prevent layout shift). This forces the grid to always render 6 weeks (42 days), filling in dates from adjacent months as needed.

### Paged Navigation

When `numberOfMonths` is greater than 1, the default behavior shifts the view by one month per navigation click. Enable `pagedNavigation` to shift by the full number of displayed months instead — so with `numberOfMonths={2}`, clicking "next" advances by 2 months.
