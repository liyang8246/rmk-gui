# mergeProps

A utility function to merge multiple props objects, used internally by Bits UI to merge your custom props with the component's internal props.

## Overview

`mergeProps` merges multiple props objects into one. It's particularly useful for composing components with different prop sets or extending the functionality of existing components.

## Key Features

- Merges multiple props objects
- Chains event handlers with cancellation support
- Combines class names (via `clsx`)
- Merges style objects and strings
- Chains non-event handler functions

## Event Handlers

Event handlers are chained in the order they're passed. If a handler calls `event.preventDefault()`, subsequent handlers in the chain are **not** executed:

```ts
import { mergeProps } from "bits-ui";

const props1 = { onclick: () => console.log("First click") };
const props2 = { onclick: () => console.log("Second click") };

const merged = mergeProps(props1, props2);
merged.onclick(new MouseEvent("click"));
// Logs: "First click" then "Second click"
```

With `preventDefault()` cancellation:

```ts
const props1 = { onclick: () => console.log("First") };
const props2 = {
  onclick: (e: MouseEvent) => {
    console.log("Second");
    e.preventDefault();
  },
};
const props3 = { onclick: () => console.log("Third") };

const merged = mergeProps(props1, props2, props3);
merged.onclick(new MouseEvent("click"));
// Logs: "First" then "Second" only — props3 is skipped
```

## Non-Event Handler Functions

Non-event handler functions are also chained, but without cancellation support:

```ts
const props1 = { doSomething: () => console.log("Action 1") };
const props2 = { doSomething: () => console.log("Action 2") };

const merged = mergeProps(props1, props2);
merged.doSomething();
// Logs: "Action 1" then "Action 2"
```

## Classes

Class names are merged using [`clsx`](https://www.npmjs.com/package/clsx):

```ts
const props1 = { class: "text-lg font-bold" };
const props2 = { class: ["bg-blue-500", "hover:bg-blue-600"] };

const merged = mergeProps(props1, props2);
console.log(merged.class);
// "text-lg font-bold bg-blue-500 hover:bg-blue-600"
```

## Styles

Style objects and strings are merged, with later properties overriding earlier ones:

```ts
const props1 = { style: { color: "red", fontSize: "16px" } };
const props2 = { style: "background-color: blue; font-weight: bold;" };

const merged = mergeProps(props1, props2);
console.log(merged.style);
// "color: red; font-size: 16px; background-color: blue; font-weight: bold;"
```

CSS custom properties work too:

```ts
const props1 = { style: "--foo: red" };
const props2 = { style: { "--foo": "green", color: "blue" } };

const merged = mergeProps(props1, props2);
console.log(merged.style);
// "--foo: green; color: blue;"
```

## When to Use

`mergeProps` is most useful when building reusable component wrappers that need to merge user-provided props with internal defaults — the same pattern Bits UI uses internally.
