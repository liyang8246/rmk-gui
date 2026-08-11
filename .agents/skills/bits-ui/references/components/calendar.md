# Calendar

Displays dates and days of the week, facilitating date-related interactions. A headless, fully accessible calendar primitive that supports single and multiple date selection, localization, validation, and programmatic navigation.

## Overview

The `Calendar` component renders an interactive calendar grid for selecting dates. It is built on top of the `@internationalized/date` library, which means all date values are represented as immutable `DateValue` objects — never plain JavaScript `Date` instances.

There are three `DateValue` types, all imported from `@internationalized/date`:

| Type             | Represents                                | Example                          |
| ---------------- | ----------------------------------------- | -------------------------------- |
| `CalendarDate`   | A date without a time component           | `new CalendarDate(2024, 8, 3)`   |
| `CalendarDateTime` | A date with a time but no timezone       | `new CalendarDateTime(2024, 8, 3, 12, 30)` |
| `ZonedDateTime`  | A date with a time and an explicit timezone | `toZoned(today(getLocalTimeZone()), 'America/New_York')` |

The `DateValue` type is a union of all three: `CalendarDate | CalendarDateTime | ZonedDateTime`. The `type` prop on `Calendar.Root` determines whether the `value` is a single `DateValue` (`type="single"`) or an array of `DateValue`s (`type="multiple"`).

Before using this component, read `references/concepts/dates.md` to understand immutability, parsing, formatting, and the placeholder concept.

## Component Structure

The Calendar is a compound component composed of the following parts:

- **`Calendar.Root`** — The root container that holds all behavior, state, and other calendar parts. Renders a `<div>`.
- **`Calendar.Header`** — A flex container for the navigation controls and heading. Renders an `<HTMLElement>` (default `<div>`).
- **`Calendar.Heading`** — Displays the current month/year being viewed. Renders a `<div>`.
- **`Calendar.PrevButton`** — A button that navigates the calendar to the previous month (or page). Renders a `<button>`.
- **`Calendar.NextButton`** — A button that navigates the calendar to the next month (or page). Renders a `<button>`.
- **`Calendar.Grid`** — The table element containing the calendar grid for a single month. Renders a `<table>`.
- **`Calendar.GridHead`** — The `<thead>` of the grid, containing weekday labels.
- **`Calendar.GridBody`** — The `<tbody>` of the grid, containing the date cells.
- **`Calendar.GridRow`** — A `<tr>` row within the grid (used for both weekday headers and date rows).
- **`Calendar.HeadCell`** — A `<th>` cell in the grid head, displaying a weekday label.
- **`Calendar.Cell`** — A `<td>` cell in the grid body, representing a single date. Requires `date` and `month` props.
- **`Calendar.Day`** — The interactive day element rendered inside a `Calendar.Cell`. Renders a `<div>`.
- **`Calendar.MonthSelect`** — A `<select>` for jumping directly to a specific month.
- **`Calendar.YearSelect`** — A `<select>` for jumping directly to a specific year.

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
</script>

<Calendar.Root type="single">
  {#snippet children({ months, weekdays })}
    <Calendar.Header>
      <Calendar.PrevButton />
      <Calendar.Heading />
      <Calendar.NextButton />
    </Calendar.Header>
    {#each months as month}
      <Calendar.Grid>
        <Calendar.GridHead>
          <Calendar.GridRow>
            {#each weekdays as day}
              <Calendar.HeadCell>
                {day}
              </Calendar.HeadCell>
            {/each}
          </Calendar.GridRow>
        </Calendar.GridHead>
        <Calendar.GridBody>
          {#each month.weeks as weekDates}
            <Calendar.GridRow>
              {#each weekDates as date}
                <Calendar.Cell {date} month={month.value}>
                  <Calendar.Day />
                </Calendar.Cell>
              {/each}
            </Calendar.GridRow>
          {/each}
        </Calendar.GridBody>
      </Calendar.Grid>
    {/each}
  {/snippet}
</Calendar.Root>
```

### The `children` Snippet Props

The `Calendar.Root` `children` snippet receives `months` and `weekdays`:

```ts
type Month<T> = {
  // A DateValue representing the month this grid is for.
  value: DateValue;
  // An array of weeks, each containing an array of dates.
  weeks: T[][];
  // A flat array of all dates in the grid (including outside-month fill dates).
  dates: T[];
};

type ChildrenSnippetProps = {
  months: Month<DateValue>[];
  weekdays: string[];
};
```

## API Reference

### `Calendar.Root`

The root calendar component which contains all other calendar components. It manages the selected value, the placeholder (view) state, localization, validation, and the number of months displayed.

| Prop                    | Type                                                                                                                                                               | Default       | Description                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type` *(required)*     | `enum` — `'single'` \| `'multiple'`                                                                                                                                | `undefined`   | The type of the component, used to determine the type of the value. When `'multiple'`, the `value` will be an array.                                                                                                                                                                                                                                         |
| `value` *($bindable)*   | `DateValue` \| `DateValue[]`                                                                                                                                       | `undefined`   | The selected date(s). If `type` is `'single'`, this will be a `DateValue`. If `type` is `'multiple'`, this will be an array of `DateValue`s.                                                                                                                                                                                                                 |
| `onValueChange`         | `(value: DateValue) => void` \| `(value: DateValue[]) => void`                                                                                                     | `undefined`   | A function called when the selected date changes.                                                                                                                                                                                                                                                                                                            |
| `placeholder` *($bindable)* | `DateValue`                                                                                                                                                    | `undefined`   | The placeholder date, which determines what month to display when no date is selected. Updates as the user navigates the calendar, and can be used to programmatically control the calendar's view.                                                                                                                                                          |
| `onPlaceholderChange`   | `(date: DateValue) => void`                                                                                                                                        | `undefined`   | A function called when the placeholder date changes.                                                                                                                                                                                                                                                                                                         |
| `pagedNavigation`       | `boolean`                                                                                                                                                          | `false`       | Whether to use paged navigation. When `true`, the previous and next buttons navigate by the number of months displayed at once, rather than by one month.                                                                                                                                                                                                    |
| `preventDeselect`       | `boolean`                                                                                                                                                          | `false`       | Whether to prevent the user from deselecting a date without selecting another date first.                                                                                                                                                                                                                                                                    |
| `weekStartsOn`          | `number`                                                                                                                                                           | `undefined`   | An absolute day of the week to start the calendar on, regardless of locale. `0` is Sunday, `1` is Monday, etc. If not provided, the calendar defaults to the locale's first day of the week.                                                                                                                                                                |
| `weekdayFormat`         | `enum` — `'narrow'` \| `'short'` \| `'long'`                                                                                                                       | `'narrow'`    | The format to use for the weekday strings provided via the `weekdays` slot prop.                                                                                                                                                                                                                                                                             |
| `calendarLabel`         | `string`                                                                                                                                                           | `undefined`   | The accessible label for the calendar.                                                                                                                                                                                                                                                                                                                       |
| `fixedWeeks`            | `boolean`                                                                                                                                                          | `false`       | Whether to always display 6 weeks in the calendar. Useful for keeping the calendar height visually consistent across months.                                                                                                                                                                                                                                 |
| `isDateDisabled`        | `(date: DateValue) => boolean`                                                                                                                                     | `undefined`   | A function that returns whether a date is disabled (cannot be focused or selected).                                                                                                                                                                                                                                                                          |
| `isDateUnavailable`     | `(date: DateValue) => boolean`                                                                                                                                     | `undefined`   | A function that returns whether a date is unavailable (can be focused but not selected).                                                                                                                                                                                                                                                                     |
| `maxValue`              | `DateValue`                                                                                                                                                        | `undefined`   | The maximum date that can be selected. Dates beyond this value are disabled.                                                                                                                                                                                                                                                                                 |
| `minValue`              | `DateValue`                                                                                                                                                        | `undefined`   | The minimum date that can be selected. Dates before this value are disabled.                                                                                                                                                                                                                                                                                 |
| `locale`                | `string`                                                                                                                                                           | `'en'`        | The locale to use for formatting dates. Accepts any locale supported by the `Intl.DateTimeFormat` API (e.g., `'fr-FR'`, `'ja-JP'`).                                                                                                                                                                                                                          |
| `numberOfMonths`        | `number`                                                                                                                                                           | `1`           | The number of months to display at once.                                                                                                                                                                                                                                                                                                                     |
| `disabled`              | `boolean`                                                                                                                                                          | `false`       | Whether the calendar is disabled.                                                                                                                                                                                                                                                                                                                            |
| `readonly`              | `boolean`                                                                                                                                                          | `false`       | Whether the calendar is readonly (navigation allowed, but no selection).                                                                                                                                                                                                                                                                                     |
| `initialFocus`          | `boolean`                                                                                                                                                          | `false`       | If `true`, the calendar will focus the selected day, today, or the first day of the month (in that order) depending on what is visible when mounted.                                                                                                                                                                                                        |
| `disableDaysOutsideMonth` | `boolean`                                                                                                                                                        | `false`       | Whether to disable days outside the current month.                                                                                                                                                                                                                                                                                                           |
| `maxDays`               | `number`                                                                                                                                                           | `undefined`   | The maximum number of days that can be selected when `type` is `'multiple'`.                                                                                                                                                                                                                                                                                 |
| `monthFormat`           | `'short'` \| `'long'` \| `'narrow'` \| `'numeric'` \| `'2-digit'` \| `((month: number) => string)`                                                                | `'long'`      | The format to use for the month strings provided via the `months` slot prop.                                                                                                                                                                                                                                                                                 |
| `yearFormat`            | `'numeric'` \| `'2-digit'` \| `((year: number) => string)`                                                                                                         | `'numeric'`   | The format to use for the year strings provided via the `years` slot prop.                                                                                                                                                                                                                                                                                   |
| `ref` *($bindable)*     | `HTMLDivElement`                                                                                                                                                   | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                                                                                                                                                                                                   |
| `children`              | `Snippet` — `{ months: Month<DateValue>[]; weekdays: string[] }`                                                                                                   | `undefined`   | The children content to render. Receives `months` and `weekdays` as snippet props.                                                                                                                                                                                                                                                                           |
| `child`                 | `Snippet` — `{ props: Record<string, unknown>; months: Month<DateValue>[]; weekdays: string[] }`                                                                  | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.                                                                                                                                                                                                                                                           |

> **Bindable props**: `value`, `placeholder`, and `ref` are all `$bindable`. Use `bind:value`, `bind:placeholder`, and `bind:ref` for two-way binding, or function bindings (`bind:value={getValue, setValue}`) for full control.

> **Placeholder default**: When no `placeholder` is provided, it defaults to the closest allowed (by `maxValue`/`minValue`) value to the current date, and is of type `CalendarDate`.

### `Calendar.Header`

The header of the calendar, typically containing the navigation buttons and heading.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLElement`                                   | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.Heading`

The heading of the calendar, displaying the current month and year being viewed.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLDivElement`                                | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.PrevButton`

A button that navigates the calendar to the previous month, or the previous page if `pagedNavigation` is enabled.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLButtonElement`                             | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.NextButton`

A button that navigates the calendar to the next month, or the next page if `pagedNavigation` is enabled.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLButtonElement`                             | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.Grid`

The grid of dates in the calendar, typically representing a single month. Renders a `<table>` element.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableElement`                              | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.GridHead`

The head (`<thead>`) of the grid of dates, containing weekday labels.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableSectionElement`                       | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.GridBody`

The body (`<tbody>`) of the grid of dates, containing the date rows.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableSectionElement`                       | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.GridRow`

A row (`<tr>`) in the grid of dates. Used for both the weekday header row and the date rows.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableRowElement`                           | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.HeadCell`

A cell (`<th>`) in the head of the grid, displaying a weekday label.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLTableCellElement`                          | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.Cell`

A cell (`<td>`) in the grid body representing a single date. Requires both `date` and `month` props so the cell can determine whether the date falls inside or outside the displayed month.

| Prop                | Type           | Default       | Description                                                                                                                        |
| ------------------- | -------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `date`              | `DateValue`    | `undefined`   | The date for the cell.                                                                                                             |
| `month`             | `DateValue`    | `undefined`   | The current month the date is being displayed in. Used to determine if the date is outside the displayed month.                    |
| `ref` *($bindable)* | `HTMLTableCellElement` | `null`  | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                         |
| `children`          | `Snippet`      | `undefined`   | The children content to render.                                                                                                    |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information.                              |

### `Calendar.Day`

The interactive day element rendered inside a `Calendar.Cell`. Renders a `<div>` by default.

| Prop                | Type                                            | Default       | Description                                                                                              |
| ------------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `ref` *($bindable)* | `HTMLDivElement`                                | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.               |
| `children`          | `Snippet`                                       | `undefined`   | The children content to render.                                                                          |
| `child`             | `Snippet` — `{ props: Record<string, unknown> }` | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.       |

### `Calendar.MonthSelect`

A `<select>` element for navigating directly to a specific month in the calendar view. Updates the `placeholder` when changed.

| Prop                | Type                                                                                                                                                                             | Default       | Description                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `months`            | `number[]`                                                                                                                                                                       | `[1-12]`      | The month values (1–12) to render in the select.                                                                                                                                         |
| `monthFormat`       | `enum` — `'narrow'` \| `'short'` \| `'long'` \| `'numeric'` \| `'2-digit'` \| `((month: number) => string)`                                                                       | `'narrow'`    | The format to use for the month strings. If a function is provided, it will be called with the month number as an argument and should return a string.                                  |
| `ref` *($bindable)* | `HTMLSelectElement`                                                                                                                                                              | `null`        | The underlying DOM element being rendered. Bind to this to get a reference to the element.                                                                                               |
| `children`          | `Snippet` — `{ monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`                                                       | `undefined`   | The children content to render. Receives `monthItems` and `selectedMonthItem`.                                                                                                           |
| `child`             | `Snippet` — `{ props: Record<string, unknown>; monthItems: Array<{ value: number; label: string }>; selectedMonthItem: { value: number; label: string } }`                      | `undefined`   | Use render delegation to render your own element. See the Child Snippet docs for more information.                                                                                       |

### `Calendar.YearSelect`

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

### `Calendar.Root`

| Data Attribute       | Value | Description                                         |
| -------------------- | ----- | --------------------------------------------------- |
| `data-invalid`       | `''`  | Present on the root element when the calendar is invalid.  |
| `data-disabled`      | `''`  | Present on the root element when the calendar is disabled. |
| `data-readonly`      | `''`  | Present on the root element when the calendar is readonly. |
| `data-calendar-root` | `''`  | Present on the root element.                               |

### `Calendar.Header`

| Data Attribute         | Value | Description                                                  |
| ---------------------- | ----- | ------------------------------------------------------------ |
| `data-disabled`        | `''`  | Present on the header element when the calendar is disabled. |
| `data-readonly`        | `''`  | Present on the header element when the calendar is readonly. |
| `data-calendar-header` | `''`  | Present on the header element.                               |

### `Calendar.Heading`

| Data Attribute          | Value | Description                                                   |
| ----------------------- | ----- | ------------------------------------------------------------- |
| `data-disabled`         | `''`  | Present on the heading element when the calendar is disabled. |
| `data-readonly`         | `''`  | Present on the heading element when the calendar is readonly. |
| `data-calendar-heading` | `''`  | Present on the heading element.                               |

### `Calendar.NextButton`

| Data Attribute              | Value | Description                                                                      |
| --------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`             | `''`  | Present on the next button element when the calendar or this button is disabled. |
| `data-calendar-next-button` | `''`  | Present on the next button element.                                              |

### `Calendar.PrevButton`

| Data Attribute              | Value | Description                                                                      |
| --------------------------- | ----- | -------------------------------------------------------------------------------- |
| `data-disabled`             | `''`  | Present on the prev button element when the calendar or this button is disabled. |
| `data-calendar-prev-button` | `''`  | Present on the prev button element.                                              |

### `Calendar.Grid`

| Data Attribute       | Value | Description                                                |
| -------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`      | `''`  | Present on the grid element when the calendar is disabled. |
| `data-readonly`      | `''`  | Present on the grid element when the calendar is readonly. |
| `data-calendar-grid` | `''`  | Present on the grid element.                               |

### `Calendar.GridBody`

| Data Attribute            | Value | Description                                                |
| ------------------------- | ----- | ---------------------------------------------------------- |
| `data-disabled`           | `''`  | Present on the grid body element when the calendar is disabled. |
| `data-readonly`           | `''`  | Present on the grid body element when the calendar is readonly. |
| `data-calendar-grid-body` | `''`  | Present on the grid body element.                          |

### `Calendar.GridHead`

| Data Attribute            | Value | Description                                                     |
| ------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`           | `''`  | Present on the grid head element when the calendar is disabled. |
| `data-readonly`           | `''`  | Present on the grid head element when the calendar is readonly. |
| `data-calendar-grid-head` | `''`  | Present on the grid head element.                               |

### `Calendar.GridRow`

| Data Attribute           | Value | Description                                                    |
| ------------------------ | ----- | -------------------------------------------------------------- |
| `data-disabled`          | `''`  | Present on the grid row element when the calendar is disabled. |
| `data-readonly`          | `''`  | Present on the grid row element when the calendar is readonly. |
| `data-calendar-grid-row` | `''`  | Present on the grid row element.                               |

### `Calendar.HeadCell`

| Data Attribute            | Value | Description                                                     |
| ------------------------- | ----- | --------------------------------------------------------------- |
| `data-disabled`           | `''`  | Present on the head cell element when the calendar is disabled. |
| `data-readonly`           | `''`  | Present on the head cell element when the calendar is readonly. |
| `data-calendar-head-cell` | `''`  | Present on the head cell element.                               |

### `Calendar.Cell`

| Data Attribute                | Value | Description                                         |
| ----------------------------- | ----- | --------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                   |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                |
| `data-today`                  | `''`  | Present when the day is today.                      |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.  |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months. |
| `data-focused`                | `''`  | Present when the day is focused.                    |
| `data-selected`               | `''`  | Present when the day is selected.                   |
| `data-value`                  | `''`  | The date in the format `"YYYY-MM-DD"`.              |
| `data-calendar-cell`          | `''`  | Present on the cell element.                        |

### `Calendar.Day`

| Data Attribute                | Value | Description                                         |
| ----------------------------- | ----- | --------------------------------------------------- |
| `data-disabled`               | `''`  | Present when the day is disabled.                   |
| `data-unavailable`            | `''`  | Present when the day is unavailable.                |
| `data-today`                  | `''`  | Present when the day is today.                      |
| `data-outside-month`          | `''`  | Present when the day is outside the current month.  |
| `data-outside-visible-months` | `''`  | Present when the day is outside the visible months. |
| `data-focused`                | `''`  | Present when the day is focused.                    |
| `data-selected`               | `''`  | Present when the day is selected.                   |
| `data-value`                  | `''`  | The date in the format `"YYYY-MM-DD"`.              |
| `data-calendar-day`           | `''`  | Present on the day element.                         |

### `Calendar.MonthSelect`

| Data Attribute               | Value | Description                                                        |
| ---------------------------- | ----- | ------------------------------------------------------------------ |
| `data-disabled`              | `''`  | Present on the month select element when the calendar is disabled. |
| `data-calendar-month-select` | `''`  | Present on the month select element.                               |

### `Calendar.YearSelect`

| Data Attribute              | Value | Description                                                       |
| --------------------------- | ----- | ----------------------------------------------------------------- |
| `data-disabled`             | `''`  | Present on the year select element when the calendar is disabled. |
| `data-calendar-year-select` | `''`  | Present on the year select element.                               |

## CSS Variables

The Calendar component does not expose any `--bits-*` CSS variables. Styling is done entirely via class names or the `data-*` attributes listed above.

## Examples

### Basic Usage

A minimal single-selection calendar with navigation:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
</script>

<Calendar.Root type="single">
  {#snippet children({ months, weekdays })}
    <Calendar.Header>
      <Calendar.PrevButton>Previous</Calendar.PrevButton>
      <Calendar.Heading />
      <Calendar.NextButton>Next</Calendar.NextButton>
    </Calendar.Header>
    {#each months as month}
      <Calendar.Grid>
        <Calendar.GridHead>
          <Calendar.GridRow>
            {#each weekdays as day}
              <Calendar.HeadCell>{day}</Calendar.HeadCell>
            {/each}
          </Calendar.GridRow>
        </Calendar.GridHead>
        <Calendar.GridBody>
          {#each month.weeks as weekDates}
            <Calendar.GridRow>
              {#each weekDates as date}
                <Calendar.Cell {date} month={month.value}>
                  <Calendar.Day>{date.day}</Calendar.Day>
                </Calendar.Cell>
              {/each}
            </Calendar.GridRow>
          {/each}
        </Calendar.GridBody>
      </Calendar.Grid>
    {/each}
  {/snippet}
</Calendar.Root>
```

### Controlled with Two-Way Binding

Use `bind:value` for automatic state synchronization. The `type` prop must match the value shape — a single `DateValue` for `'single'`, an array for `'multiple'`:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { CalendarDateTime } from "@internationalized/date";

  let myValue = $state(new CalendarDateTime(2024, 8, 3, 12, 30));
</script>

<button onclick={() => (myValue = myValue.add({ days: 1 }))}>
  Add 1 day
</button>

<Calendar.Root type="single" bind:value={myValue}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

### Fully Controlled (Function Binding)

Use a function binding for complete control over reads and writes — useful when you need conditional updates or derived state:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import type { DateValue } from "@internationalized/date";

  let myValue = $state<DateValue>();

  function getValue() {
    return myValue;
  }
  function setValue(newValue: DateValue) {
    myValue = newValue;
  }
</script>

<Calendar.Root type="single" bind:value={getValue, setValue}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

### With Placeholder

The `placeholder` prop controls what month the calendar displays when no value is selected, and it updates as the user navigates. Bind to it to programmatically control the view:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { CalendarDate } from "@internationalized/date";

  let placeholder = $state(new CalendarDate(2024, 8, 3));
</script>

<button
  onclick={() => {
    placeholder = placeholder.set({ month: 8 });
  }}
>
  Set month to August
</button>

<Calendar.Root bind:placeholder>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

### Default Value from ISO String

When a date comes from a database or API as an ISO 8601 string, parse it with `parseDate` before passing it as the value:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { parseDate } from "@internationalized/date";

  // this came from a database/API call
  const date = "2024-08-03";
  let value = $state(parseDate(date));
</script>

<Calendar.Root type="single" {value}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

### Multiple Months

Display multiple months side by side using `numberOfMonths`. Combine with `pagedNavigation` to shift by the full number of displayed months instead of one:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
</script>

<Calendar.Root type="single" numberOfMonths={2} pagedNavigation>
  {#snippet children({ months, weekdays })}
    <Calendar.Header>
      <Calendar.PrevButton />
      <Calendar.Heading />
      <Calendar.NextButton />
    </Calendar.Header>
    <div class="flex gap-4">
      {#each months as month}
        <Calendar.Grid>
          <!-- ... grid markup ... -->
        </Calendar.Grid>
      {/each}
    </div>
  {/snippet}
</Calendar.Root>
```

### Multiple Selection

Set `type="multiple"` to allow selecting more than one date. The `value` is an array of `DateValue`s. Use `maxDays` to limit the number of selections:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { getLocalTimeZone, today } from "@internationalized/date";

  let value = $state([today(getLocalTimeZone())]);
</script>

<Calendar.Root type="multiple" bind:value maxDays={3}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

### Validation — Min/Max Values

Use `minValue` and `maxValue` to constrain selectable dates. Dates outside the range are disabled:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { today, getLocalTimeZone } from "@internationalized/date";

  const todayDate = today(getLocalTimeZone());
</script>

<Calendar.Root type="single" minValue={todayDate}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

### Validation — Unavailable and Disabled Dates

`isDateUnavailable` marks dates as unavailable (focusable but not selectable). `isDateDisabled` marks dates as fully disabled (not focusable):

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import type { DateValue } from "@internationalized/date";

  function isDateUnavailable(date: DateValue) {
    return date.day === 1; // every 1st of the month is unavailable
  }

  function isDateDisabled(date: DateValue) {
    return date.day === 15; // every 15th is disabled
  }
</script>

<Calendar.Root type="single" {isDateUnavailable} {isDateDisabled}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

### Month and Year Selects

Use `Calendar.MonthSelect` and `Calendar.YearSelect` to let users jump directly to a month or year:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { getLocalTimeZone, today } from "@internationalized/date";

  let value = $state(today(getLocalTimeZone()));
</script>

<Calendar.Root type="single" bind:value>
  {#snippet children({ months, weekdays })}
    <Calendar.Header>
      <Calendar.MonthSelect aria-label="Select month" />
      <Calendar.YearSelect aria-label="Select year" />
    </Calendar.Header>
    {#each months as month}
      <Calendar.Grid>
        <!-- ... grid markup ... -->
      </Calendar.Grid>
    {/each}
  {/snippet}
</Calendar.Root>
```

### Preset Dates

Programmatically set the `value` when a user clicks a preset button:

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { getLocalTimeZone, today } from "@internationalized/date";

  const currentDate = today(getLocalTimeZone());
  let value = $state(currentDate);

  const presets = [
    { label: "Today", onclick: () => (value = currentDate) },
    { label: "Tomorrow", onclick: () => (value = currentDate.add({ days: 1 })) },
    { label: "In a week", onclick: () => (value = currentDate.add({ days: 7 })) },
    { label: "In a month", onclick: () => (value = currentDate.add({ months: 1 })) },
  ];
</script>

<Calendar.Root type="single" bind:value>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>

<div class="flex gap-2">
  {#each presets as preset (preset.label)}
    <button onclick={preset.onclick}>{preset.label}</button>
  {/each}
</div>
```

### Localization

Set the `locale` prop to any value supported by `Intl.DateTimeFormat`. This affects weekday names, month names in the heading, and the first day of the week:

```svelte
<Calendar.Root type="single" locale="fr-FR">
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

To force a specific first day of the week regardless of locale, use `weekStartsOn` (0 = Sunday, 6 = Saturday):

```svelte
<Calendar.Root type="single" locale="fr-FR" weekStartsOn={1}>
  {#snippet children({ months, weekdays })}
    <!-- ... grid markup ... -->
  {/snippet}
</Calendar.Root>
```

## Accessibility

The Calendar follows WAI-ARIA patterns for grid-based date selection widgets.

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
| `Enter` / `Space`        | Select the focused date.                                               |
| `Tab`                    | Move focus between the grid, navigation buttons, and selects.          |

### ARIA and Labels

- The grid is labeled via the `calendarLabel` prop, which provides an accessible name for screen readers.
- The `Calendar.Heading` provides a visible label for the current month/year.
- The `Calendar.PrevButton` and `Calendar.NextButton` have built-in `aria-label` attributes for screen reader navigation.
- Disabled dates are marked with `aria-disabled`, and unavailable dates with `aria-disabled` as well.
- When using `Calendar.MonthSelect` and `Calendar.YearSelect`, provide an `aria-label` to each for screen reader clarity.

### Initial Focus

Set `initialFocus={true}` on `Calendar.Root` to automatically focus the selected day, today, or the first day of the month (in that priority order) when the calendar mounts. This is useful when the calendar is displayed in a popover or dialog that opens on user interaction.

## Tips

### Date Type Selection

- Use `CalendarDate` when you only need a date without a time component (e.g., a birthday, a due date). This is the default type for the `placeholder` when none is provided.
- Use `CalendarDateTime` when you need a date and time but don't need timezone awareness (e.g., a local event time).
- Use `ZonedDateTime` when you need full timezone awareness (e.g., scheduling across timezones). Use `toZoned()` from `@internationalized/date` to create one.
- The `type` you use for `value` and `placeholder` must be consistent — don't mix `CalendarDate` with `CalendarDateTime` in the same calendar instance unless you handle conversions explicitly.

### Immutability

All `DateValue` objects from `@internationalized/date` are **immutable**. Methods like `.add()`, `.subtract()`, and `.set()` return **new** instances rather than mutating the original. Always assign the result:

```ts
// Correct — assigns the new instance
myValue = myValue.add({ days: 1 });

// Incorrect — original is unchanged, myValue stays the same
myValue.add({ days: 1 });
```

This is why the controlled examples use `myValue = myValue.add({ days: 1 })` in click handlers rather than mutating a property.

### Parsing and Formatting

- Use `parseDate("2024-08-03")` to parse an ISO 8601 date string into a `CalendarDate`.
- Use `today(getLocalTimeZone())` to get today's date as a `CalendarDate` in the user's local timezone.
- Use `toCalendarDateTime()` or `toZoned()` to convert between date types when needed.
- Never pass a native JavaScript `Date` object as a prop value — the calendar expects `DateValue` types from `@internationalized/date`.

### Disabled vs. Unavailable Dates

- `isDateDisabled` — The date cannot be focused or selected at all. Use for dates that are entirely out of scope (e.g., past dates in a booking system).
- `isDateUnavailable` — The date can be focused and navigated to, but cannot be selected. Use for dates that are temporarily unavailable (e.g., booked dates, holidays).
- `minValue` and `maxValue` are a shorthand for disabling all dates before/after a boundary. They set `data-disabled` on the affected cells.

### Placeholder vs. Value

- `value` is the user's selection — what they've chosen.
- `placeholder` is the calendar's view state — what month/year is currently displayed. It defaults to the current date (clamped to `minValue`/`maxValue`) when no value is selected.
- When the user navigates the calendar, the `placeholder` updates to reflect the focused date, even if no value is selected.
- Binding to `placeholder` is the recommended way to programmatically control which month the calendar shows, such as when implementing month/year dropdowns.

### Fixed Weeks

Enable `fixedWeeks` when the calendar height must remain constant across months (e.g., to prevent layout shift). This forces the grid to always render 6 weeks (42 days), filling in dates from adjacent months as needed.

### Paged Navigation

When `numberOfMonths` is greater than 1, the default behavior shifts the view by one month per navigation click. Enable `pagedNavigation` to shift by the full number of displayed months instead — so with `numberOfMonths={2}`, clicking "next" advances by 2 months.

### `preventDeselect`

By default, clicking a selected date in single-selection mode deselects it (setting `value` to `undefined`). Set `preventDeselect={true}` to prevent this, forcing the user to always have a date selected once one is chosen.
