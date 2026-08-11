# Dates and Times

The date and time components in Bits UI leverage the `@internationalized/date` package, providing a unified API for working with dates and times across different locales and time zones. This package is inspired by the [Temporal](https://tc39.es/proposal-temporal/) proposal.

## Installation

```bash
npm install @internationalized/date
```

It's highly recommended to familiarize yourself with the package's documentation. This guide covers the basics, but the package's docs provide more detail.

## DateValue Types

Bits UI uses `DateValue` objects from `@internationalized/date` to represent dates and times consistently. These immutable objects provide specific information about the type of date they represent.

`DateValue` is a union of three types:

| Type | Description | Example |
|------|-------------|---------|
| `CalendarDate` | Date without time component | `2024-07-10` |
| `CalendarDateTime` | Date with time | `2024-07-10T12:30:00` |
| `ZonedDateTime` | Date with time and timezone | `2024-07-10T21:00:00:00-04:00[America/New_York]` |

Using strongly-typed objects allows components to adapt appropriately to the date type you provide.

### CalendarDate

Represents a date without a time component:

```ts
import {
  CalendarDate,
  parseDate,
  today,
  getLocalTimeZone,
} from "@internationalized/date";

// From year, month, day parameters
const date = new CalendarDate(2024, 7, 10);

// From ISO 8601 string
const parsedDate = parseDate("2024-07-10");

// Current date in specific timezone
const losAngelesToday = today("America/Los_Angeles");

// Current date in user's timezone
const localToday = today(getLocalTimeZone());
```

### CalendarDateTime

Represents a date with a time component, but without timezone information:

```ts
import { CalendarDateTime, parseDateTime } from "@internationalized/date";

// From date and time components
const dateTime = new CalendarDateTime(2024, 7, 10, 12, 30, 0);

// From ISO 8601 string
const parsedDateTime = parseDateTime("2024-07-10T12:30:00");
```

### ZonedDateTime

Represents a specific date and time in a specific timezone — crucial for events that occur at an exact moment regardless of the user's location:

```ts
import {
  ZonedDateTime,
  parseZonedDateTime,
  parseAbsolute,
  parseAbsoluteToLocal,
} from "@internationalized/date";

const date = new ZonedDateTime(
  2022, 2, 3,           // Date (year, month, day)
  "America/Los_Angeles", // Timezone
  -28800000,            // UTC offset in milliseconds
  9, 15, 0              // Time (hour, minute, second)
);

// From ISO 8601 strings using different parsing functions
const date1 = parseZonedDateTime("2024-07-12T00:45[America/New_York]");
const date2 = parseAbsolute("2024-07-12T07:45:00Z", "America/New_York");
const date3 = parseAbsoluteToLocal("2024-07-12T07:45:00Z");
```

## Working with Date Ranges

For components that require date ranges, Bits UI provides a `DateRange` type:

```ts
type DateRange = {
  start: DateValue;
  end: DateValue;
};
```

Used in:
- Date Range Field
- Date Range Picker
- Range Calendar

## Using the Placeholder

Each date/time component has a **bindable** `placeholder` prop that serves multiple functions:

1. **Starting Point**: Acts as the initial date when no value is selected
2. **Type Definition**: Determines what type of date/time to display if value is absent
3. **Calendar Navigation**: Controls the visible date range in calendar views

```svelte
<script lang="ts">
  import { Calendar } from "bits-ui";
  import { today, getLocalTimeZone, type DateValue } from "@internationalized/date";

  let placeholder: DateValue = $state(today(getLocalTimeZone()));
  let selectedMonth: number = $state(placeholder.month);
</script>

<select
  onchange={() => {
    placeholder = placeholder.set({ month: selectedMonth });
  }}
  bind:value={selectedMonth}
>
  <option value={1}>January</option>
  <option value={2}>February</option>
  <!-- ... -->
</select>

<Calendar.Root bind:placeholder>
  <!-- Calendar components... -->
</Calendar.Root>
```

## Updating DateValue Objects

Since `DateValue` objects are immutable, you must create new instances when updating:

```ts
// ❌ INCORRECT — will not work
let placeholder = new CalendarDate(2024, 7, 10);
placeholder.month = 8; // Error! DateValue objects are immutable

// ✅ CORRECT — using methods that return new instances
let placeholder = new CalendarDate(2024, 7, 10);

// Method 1: Using set()
placeholder = placeholder.set({ month: 8 });

// Method 2: Using add()
placeholder = placeholder.add({ months: 1 });

// Method 3: Using subtract()
placeholder = placeholder.subtract({ days: 5 });

// Method 4: Using cycle() — cycles through valid values
placeholder = placeholder.cycle("month", "forward", [1, 3, 5, 7, 9, 11]);
```

## Formatting and Parsing

### Formatting Dates for Display

Use the `DateFormatter` class for consistent, locale-aware formatting:

```ts
import { DateFormatter } from "@internationalized/date";

const formatter = new DateFormatter("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

const formattedDate = formatter.format(myDateValue.toDate("America/New_York"));
// Example output: "Wednesday, July 10, 2024 at 12:30 PM"
```

The `DateFormatter` wraps the native `Intl.DateTimeFormat` API while fixing browser inconsistencies.

### Parsing Date Strings

```ts
import {
  parseDate,            // For CalendarDate
  parseDateTime,        // For CalendarDateTime
  parseZonedDateTime,   // For ZonedDateTime with timezone name
  parseAbsolute,        // For ZonedDateTime from UTC string + timezone
  parseAbsoluteToLocal, // For ZonedDateTime in local timezone
} from "@internationalized/date";

const date = parseDate("2024-07-10");                           // CalendarDate
const dateTime = parseDateTime("2024-07-10T12:30:00");          // CalendarDateTime
const zonedDate = parseZonedDateTime("2024-07-12T00:45[America/New_York]");
const absoluteDate = parseAbsolute("2024-07-12T07:45:00Z", "America/New_York");
const localDate = parseAbsoluteToLocal("2024-07-12T07:45:00Z");
```

## Common Gotchas

- **Month Indexing**: Unlike JavaScript's `Date` object (0-indexed), `@internationalized/date` uses **1-indexed months** (January = 1).
- **Immutability**: Always reassign when modifying: `date = date.add({ days: 1 })`.
- **Timezone Handling**: Use `ZonedDateTime` for schedule-critical events like meetings or appointments.
- **Type Consistency**: Match `placeholder` types to your needs — if you need time selection, use `CalendarDateTime` not `CalendarDate`.
- **Performance**: Create `DateFormatter` instances once and reuse them rather than creating new instances on each render.
