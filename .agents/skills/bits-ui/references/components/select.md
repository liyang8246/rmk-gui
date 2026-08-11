# Select

The Select component enables users to pick from a list of options displayed in a dropdown. It provides typeahead search, full keyboard navigation, grouped options, scroll management, and accessibility support — a feature-rich alternative to the native `<select>` element.

## Overview

The Select component displays a selectable list of options in a dropdown panel anchored to a trigger button. The trigger shows the currently selected value (or a placeholder), and the dropdown content uses [Floating UI](https://floating-ui.com/) for positioning.

Use Select when the user chooses from a **predefined, typically static** set of options. If the user needs to **type to filter or create** options dynamically, use the Combobox component instead. Select is the better choice when the full option list is short enough to display in a dropdown and typeahead (first-letter matching) is sufficient for finding items.

Key characteristics:

- **Single or Multiple selection** — pick one value, or an array of values.
- **Typeahead search** — users can type to jump to matching items, even while the dropdown is closed (when the `items` prop is provided).
- **Keyboard navigation** — full arrow-key, Home/End, and Enter support following the WAI-ARIA combobox pattern.
- **Grouped options** — organize items into logical groups with headings.
- **Scroll management** — optional scroll-up/down buttons for long lists, or native overflow scrolling.
- **Floating UI positioning** — content is positioned relative to the trigger with collision detection; or opt out with `ContentStatic`.
- **Portal support** — render the dropdown into the body or a custom target to avoid clipping/overflow issues.
- **Form integration** — a hidden input is rendered when `name` is provided, enabling native form submission.

## Component Structure

The Select is a compound component composed of the following parts:

- `Select.Root` — The main container that manages state (value, open) and provides context to all children.
- `Select.Trigger` — The button that toggles the dropdown's open state. Renders a `<button>` element.
- `Select.Value` — A text label displaying the currently selected item(s). Renders a `<span>` by default; use the `child`/`children` snippets for full control.
- `Select.Portal` — Optionally portals the dropdown content to the body or a custom target element, preventing layout clipping.
- `Select.Content` — The dropdown container that holds the items. Uses Floating UI for positioning relative to the trigger.
- `Select.ContentStatic` — An alternative to `Content` that opts out of Floating UI; you handle positioning yourself.
- `Select.Viewport` — The visible scroll area inside `Content`. Required when using scroll buttons; determines their visibility and manages scroll behavior.
- `Select.Item` — An individual selectable option within the list.
- `Select.Group` — A container for grouping related items together.
- `Select.GroupHeading` — A heading/label for a group of items, providing a descriptive title.
- `Select.ScrollUpButton` — A button that scrolls the content upward when the list is longer than the viewport. Use with `Viewport`.
- `Select.ScrollDownButton` — A button that scrolls the content downward when the list is longer than the viewport. Use with `Viewport`.
- `Select.Arrow` — An optional arrow element that visually points from the content to the trigger.

Basic structure:

```svelte
<script lang="ts">
  import { Select } from "bits-ui";
</script>

<Select.Root type="single">
  <Select.Trigger>
    <Select.Value placeholder="Pick an option" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.ScrollUpButton />
      <Select.Viewport>
        <Select.Item value="a" label="Option A" />
        <Select.Group>
          <Select.GroupHeading>Group Label</Select.GroupHeading>
          <Select.Item value="b" label="Option B" />
        </Select.Group>
      </Select.Viewport>
      <Select.ScrollDownButton />
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

## API Reference

### Select.Root

The root select component which manages and scopes the state of the select.

| Property               | Type                                              | Default      | Description |
| ---------------------- | ------------------------------------------------- | ------------ | ----------- |
| `type` (required)      | `'single' \| 'multiple'`                          | `undefined`  | The type of the component, which determines the shape of `value`. When `'multiple'`, the value is an array of strings; when `'single'`, it is a single string. |
| `value` (bindable)     | `string \| string[]`                              | `undefined`  | The value of the select. A `string` when `type` is `'single'`; a `string[]` when `type` is `'multiple'`. Use `bind:value` for two-way binding. |
| `onValueChange`        | `(value: string) => void \| (value: string[]) => void` | `undefined` | Callback fired when the select value changes. The argument is a `string` for `'single'`, or `string[]` for `'multiple'`. |
| `open` (bindable)      | `boolean`                                         | `false`      | The open state of the dropdown. Use `bind:open` for two-way binding. |
| `onOpenChange`         | `(open: boolean) => void`                         | `undefined`  | Callback fired when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void`                         | `undefined`  | Callback fired after the open state changes and all animations have completed. |
| `disabled`             | `boolean`                                         | `false`      | Whether the entire select component is disabled. |
| `name`                 | `string`                                          | `undefined`  | The name applied to the hidden input element for form submission. If provided, a hidden input is rendered to submit the select's value. |
| `required`             | `boolean`                                         | `false`      | Whether the select is required for form validation. When `true`, a `name` must also be provided so the hidden input is rendered. |
| `scrollAlignment`      | `'nearest' \| 'center'`                           | `'nearest'`  | The alignment of the highlighted item when scrolling. |
| `loop`                 | `boolean`                                         | `false`      | Whether keyboard navigation loops through items when reaching the end of the list. |
| `allowDeselect`        | `boolean`                                         | `false`      | Whether the user can deselect the selected item by pressing it again. Only applies to single-select mode. |
| `items`                | `{ value: string; label: string; disabled?: boolean }[]` | `undefined` | An array of value/label pairs used for typeahead matching when the trigger is focused and a key is pressed while the content is closed. Also used for form autofill when `type` is `'single'`. |
| `autocomplete`         | `string`                                          | `undefined`  | The autocomplete attribute forwarded to the hidden input element. |
| `children`             | `Snippet`                                         | `undefined`  | The children content to render. |

### Select.Trigger

A button which toggles the select's open state. Renders a `<button>` element.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLButtonElement`                           | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Select.Value

A text label of the currently selected item(s). Renders a `<span>` by default, or use the `child`/`children` snippets for full control over rendering.

| Property         | Type                                                                                                            | Default     | Description |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | ----------- |
| `placeholder`    | `string`                                                                                                        | `undefined` | Text shown when no value is selected. |
| `children`       | `Snippet<{ selection, placeholder, disabled }>`                                                                 | `undefined` | The children content to render. The `selection` argument is a discriminated union: `{ type: 'single', selected?, setValue }` or `{ type: 'multiple', selected: [], setValue }`. |
| `child`          | `Snippet<{ props, selection, placeholder, disabled }>`                                                          | `undefined` | Use render delegation to render your own element. Same `selection` shape as `children`, plus `props` to spread. See Child Snippet docs. |
| `ref` (bindable) | `HTMLSpanElement`                                                                                               | `null`      | The underlying DOM element. Bind to get a reference. |

The `selection` object passed to the `child`/`children` snippets has this shape:

- **Single mode:** `{ type: 'single', selected?: { value: string; label: string }, setValue: (value: string) => void }`
- **Multiple mode:** `{ type: 'multiple', selected: { value: string; label: string }[], setValue: (value: string[]) => void }`

### Select.Content

The element which contains the select's items. Uses Floating UI to position itself relative to the trigger (or a custom anchor).

| Property                       | Type                                                                                                            | Default      | Description |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| `side`                         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                                        | `'bottom'`   | The preferred side of the anchor to render the floating element against. Will be reversed when collisions occur. |
| `sideOffset`                   | `number`                                                                                                        | `0`          | The distance in pixels from the anchor to the floating element. |
| `align`                        | `'start' \| 'center' \| 'end'`                                                                                  | `'start'`    | The preferred alignment of the floating element relative to the anchor. May change when collisions occur. |
| `alignOffset`                  | `number`                                                                                                        | `0`          | The distance in pixels from the anchor to the floating element along the alignment axis. |
| `arrowPadding`                 | `number`                                                                                                        | `0`          | The padding in pixels between the arrow and the edges of the content. |
| `avoidCollisions`              | `boolean`                                                                                                       | `true`       | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary`            | `Element \| null`                                                                                               | `undefined`  | A boundary element or array of elements to check for collisions against. |
| `collisionPadding`             | `number \| Partial<Record<Side, number>>`                                                                       | `0`          | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky`                       | `'partial' \| 'always'`                                                                                         | `'partial'`  | The sticky behavior on the align axis. `'partial'` keeps the content in the boundary as long as the trigger is at least partially in view; `'always'` keeps it in the boundary regardless. |
| `hideWhenDetached`             | `boolean`                                                                                                       | `true`       | When `true`, hides the content when the trigger is detached from the DOM (e.g., scrolled out of view). |
| `updatePositionStrategy`       | `'optimized' \| 'always'`                                                                                       | `'optimized'`| The strategy for updating the content position. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes. |
| `strategy`                     | `'fixed' \| 'absolute'`                                                                                         | `'fixed'`    | The CSS positioning strategy. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll`                | `boolean`                                                                                                       | `false`      | When `true`, prevents the body from scrolling while the content is open. |
| `customAnchor`                 | `string \| HTMLElement \| Measurable \| null`                                                                   | `null`       | Use an element other than the trigger to anchor the content to. Accepts a selector string, an `HTMLElement`, or a `Measurable` object. |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                                                | `undefined`  | Callback fired on escape keydown within the floating content. Call `event.preventDefault()` to prevent the default close behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                                    | `'close'`    | The behavior when an escape keydown occurs. `'close'` closes immediately; `'ignore'` prevents closing; `'defer-otherwise-close'` defers to a parent floating element if one exists, otherwise closes; `'defer-otherwise-ignore'` defers to parent, otherwise ignores. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                                                 | `undefined`  | Callback fired when an outside interaction (pointerdown) occurs. Call `event.preventDefault()` to prevent the default close behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                                   | `undefined`  | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                                    | `'close'`    | The behavior when an interaction occurs outside the floating content. Same options as `escapeKeydownBehavior`. |
| `preventOverflowTextSelection` | `boolean`                                                                                                       | `true`       | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                                                                                | `'ltr'`      | The reading direction of the app. |
| `loop`                         | `boolean`                                                                                                       | `false`      | Whether the select should loop through items when reaching the end via keyboard navigation. |
| `forceMount`                   | `boolean`                                                                                                       | `false`      | Whether to forcefully mount the content. Useful with Svelte transitions or other animation libraries that require control over mount/unmount. |
| `ref` (bindable)               | `HTMLDivElement`                                                                                                | `null`       | The underlying DOM element. Bind to get a reference. |
| `children`                     | `Snippet`                                                                                                       | `undefined`  | The children content to render. |
| `child`                        | `Snippet<{ wrapperProps, props, open }>`                                                                        | `undefined`  | Use render delegation to render your own element. `wrapperProps` are for the positioning wrapper (do not style); `props` are for your content element (apply styles here); `open` is the visibility state for conditional rendering with transitions. See Child Snippet docs. |

### Select.ContentStatic

An alternative to `Select.Content` that opts out of Floating UI positioning. You handle the content's positioning yourself. Useful when you want the content to render in the normal document flow or with custom CSS positioning.

Using `Select.Portal` alongside `ContentStatic` may result in unexpected positioning behavior — you may omit the portal or work around it.

| Property                       | Type                                          | Default      | Description |
| ------------------------------ | --------------------------------------------- | ------------ | ----------- |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`              | `undefined`  | Callback fired on escape keydown within the floating content. Call `event.preventDefault()` to prevent the default close behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'`    | The behavior when an escape keydown occurs. See `Select.Content` for option semantics. |
| `onInteractOutside`            | `(event: PointerEvent) => void`               | `undefined`  | Callback fired when an outside interaction (pointerdown) occurs. Call `event.preventDefault()` to prevent the default close behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                 | `undefined`  | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'`    | The behavior when an interaction occurs outside the floating content. See `Select.Content` for option semantics. |
| `onOpenAutoFocus`              | `(event: Event) => void`                      | `undefined`  | Event handler called when auto-focusing the content as it opens. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                      | `undefined`  | Event handler called when auto-focusing the content as it closes. Can be prevented. |
| `trapFocus`                    | `boolean`                                     | `true`       | Whether to trap focus within the content when open. |
| `preventScroll`                | `boolean`                                     | `true`       | When `true`, prevents the body from scrolling while the content is open. |
| `preventOverflowTextSelection` | `boolean`                                     | `true`       | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                              | `'ltr'`      | The reading direction of the app. |
| `loop`                         | `boolean`                                     | `false`      | Whether the select should loop through items when reaching the end via keyboard navigation. |
| `forceMount`                   | `boolean`                                     | `false`      | Whether to forcefully mount the content. Useful with Svelte transitions or other animation libraries. |
| `ref` (bindable)               | `HTMLDivElement`                              | `null`       | The underlying DOM element. Bind to get a reference. |
| `children`                     | `Snippet`                                     | `undefined`  | The children content to render. |
| `child`                        | `Snippet<{ open, props }>`                    | `undefined`  | Use render delegation to render your own element. `open` is the visibility state; `props` are for your content element. See Child Snippet docs. |

### Select.Portal

When used, renders the select content into the body or a custom `to` element when open. This prevents the content from being clipped by parent `overflow: hidden` or `transform` containers.

| Property   | Type                  | Default         | Description |
| ---------- | --------------------- | --------------- | ----------- |
| `to`       | `Element \| string`   | `document.body` | Where to render the content when open. Defaults to the body. |
| `disabled` | `boolean`             | `false`         | Whether the portal is disabled. When disabled, the content renders in its original DOM location. |
| `children` | `Snippet`             | `undefined`     | The children content to render. |

### Select.Item

A select item, which must be a child of the `Select.Content` (or `ContentStatic`) component.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `value` (required) | `string`                                    | `undefined`  | The value of the item. |
| `label`          | `string`                                      | `undefined` | The label of the item, which is what the list is filtered by using typeahead behavior. |
| `disabled`       | `boolean`                                     | `false`     | Whether the select item is disabled. This prevents interaction and selection. |
| `onHighlight`    | `() => void`                                  | `undefined` | Callback fired when the item is highlighted (via keyboard navigation or hover). |
| `onUnhighlight`  | `() => void`                                  | `undefined` | Callback fired when the item is unhighlighted. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Select.Viewport

An optional element to track the scroll position of the select for rendering the scroll up/down buttons. Required when using `ScrollUpButton`/`ScrollDownButton`. Apply min/max height constraints to this component, not to `Content`.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Select.ScrollUpButton

An optional scroll-up button to improve the scroll experience within the select. Must be used in conjunction with the `Select.Viewport` component. Rendered only when the content overflows the viewport.

| Property         | Type                                          | Default | Description |
| ---------------- | --------------------------------------------- | ------- | ----------- |
| `delay`          | `(tick: number) => number`                    | `() => 50` | Controls the initial delay (tick `0`) and the delay between auto-scrolls in milliseconds. The `tick` argument increments with each scroll step, enabling custom acceleration curves. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`  | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Select.ScrollDownButton

An optional scroll-down button to improve the scroll experience within the select. Must be used in conjunction with the `Select.Viewport` component. Rendered only when the content overflows the viewport.

| Property         | Type                                          | Default | Description |
| ---------------- | --------------------------------------------- | ------- | ----------- |
| `delay`          | `(tick: number) => number`                    | `() => 50` | Controls the initial delay (tick `0`) and the delay between auto-scrolls in milliseconds. The `tick` argument increments with each scroll step, enabling custom acceleration curves. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`  | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Select.Group

A container for grouping related select items. Used with `Select.GroupHeading` to provide a descriptive label for the group.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Select.GroupHeading

A heading for the parent select group. This is used to describe a group of related select items and is announced by screen readers.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Select.Arrow

An optional arrow element which points to the content when open. Typically rendered as a child of `Select.Content`.

| Property         | Type                                          | Default | Description |
| ---------------- | --------------------------------------------- | ------- | ----------- |
| `width`          | `number`                                      | `8`     | The width of the arrow in pixels. |
| `height`         | `number`                                      | `8`     | The height of the arrow in pixels. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`  | The underlying DOM element. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

## Data Attributes

Data attributes are applied to the rendered DOM elements and can be targeted with CSS for styling (e.g., `data-[state=open]:animate-in`).

### Select.Trigger

| Data Attribute        | Value                  | Description |
| --------------------- | ---------------------- | ----------- |
| `data-state`          | `'open' \| 'closed'`   | The select's open state. |
| `data-placeholder`    | `''`                   | Present when the select does not have a value. |
| `data-disabled`       | `''`                   | Present when the select is disabled. |
| `data-select-trigger` | `''`                   | Present on the trigger element. |

### Select.Value

| Data Attribute      | Value | Description |
| ------------------- | ----- | ----------- |
| `data-placeholder`  | `''`  | Present when the select does not have a value. |
| `data-select-value` | `''`  | Present on the value element. |

### Select.Content / Select.ContentStatic

| Data Attribute        | Value                  | Description |
| --------------------- | ---------------------- | ----------- |
| `data-state`          | `'open' \| 'closed'`   | The select's open state. |
| `data-starting-style` | `''`                   | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`   | `''`                   | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-select-content` | `''`                   | Present on the content element. |

### Select.Item

| Data Attribute     | Value    | Description |
| ------------------ | -------- | ----------- |
| `data-value`       | `string` | The value of the select item. |
| `data-label`       | `string` | The label of the select item. |
| `data-disabled`    | `''`     | Present when the item is disabled. |
| `data-highlighted` | `''`     | Present when the item is highlighted via keyboard navigation or hover. |
| `data-selected`    | `''`     | Present when the item is selected. |
| `data-select-item` | `''`     | Present on the item element. |

### Select.Viewport

| Data Attribute         | Value | Description |
| ---------------------- | ----- | ----------- |
| `data-select-viewport` | `''`  | Present on the viewport element. |

### Select.ScrollUpButton

| Data Attribute                 | Value | Description |
| ------------------------------ | ----- | ----------- |
| `data-select-scroll-up-button` | `''`  | Present on the scroll-up button element. |

### Select.ScrollDownButton

| Data Attribute                   | Value | Description |
| -------------------------------- | ----- | ----------- |
| `data-select-scroll-down-button` | `''`  | Present on the scroll-down button element. |

### Select.Group

| Data Attribute      | Value | Description |
| ------------------- | ----- | ----------- |
| `data-select-group` | `''`  | Present on the group element. |

### Select.GroupHeading

| Data Attribute              | Value | Description |
| --------------------------- | ----- | ----------- |
| `data-select-group-heading` | `''`  | Present on the group heading element. |

### Select.Arrow

| Data Attribute | Value | Description |
| -------------- | ----- | ----------- |
| `data-arrow`   | `''`  | Present on the arrow element. |

## CSS Variables

These CSS custom properties are exposed by `Select.Content` (Floating UI variant) and can be referenced in your styles for responsive sizing and positioning.

| CSS Variable                             | Description |
| ---------------------------------------- | ----------- |
| `--bits-select-content-transform-origin` | The transform origin of the content element, used for scale/zoom animations. |
| `--bits-select-content-available-width`  | The available width of the content element after collision detection. |
| `--bits-select-content-available-height` | The available height of the content element after collision detection. |
| `--bits-select-anchor-width`             | The width of the anchor (trigger) element. Useful for matching content width to trigger width. |
| `--bits-select-anchor-height`            | The height of the anchor (trigger) element. |

Example usage in Tailwind CSS:

```svelte
<Select.Content class="w-[var(--bits-select-anchor-width)] max-h-[var(--bits-select-content-available-height)]">
  <!-- items -->
</Select.Content>
```

## Examples

### Basic Single Select

A simple single-selection select with a placeholder and check indicator on the selected item.

```svelte
<script lang="ts">
  import { Select } from "bits-ui";
  import Check from "phosphor-svelte/lib/Check";

  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ];

  let value = $state("");
</script>

<Select.Root type="single" bind:value>
  <Select.Trigger aria-label="Select a fruit">
    <Select.Value placeholder="Pick a fruit" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content sideOffset={10}>
      <Select.Viewport>
        {#each fruits as fruit (fruit.value)}
          <Select.Item value={fruit.value} label={fruit.label}>
            {#snippet children({ selected })}
              {fruit.label}
              {#if selected}
                <div class="ml-auto"><Check /></div>
              {/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

### Multiple Selection

Set `type="multiple"` to allow selecting more than one item. The `value` is an array of strings.

```svelte
<script lang="ts">
  import { Select } from "bits-ui";

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  let value = $state<string[]>([]);
</script>

<Select.Root type="multiple" bind:value>
  <Select.Trigger aria-label="Select themes">
    <Select.Value placeholder="Select your favorite themes" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content sideOffset={10}>
      <Select.Viewport>
        {#each themes as theme (theme.value)}
          <Select.Item value={theme.value} label={theme.label}>
            {theme.label}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

### With child Snippet (Selected Indicator)

Use the `children` snippet on `Select.Item` to access the `selected` boolean and render a custom indicator.

```svelte
<Select.Item value={item.value} label={item.label}>
  {#snippet children({ selected })}
    <span>{item.label}</span>
    {#if selected}
      <span class="ml-auto text-green-500">✓</span>
    {/if}
  {/snippet}
</Select.Item>
```

### With Grouped Items

Organize items into logical groups using `Select.Group` and `Select.GroupHeading`.

```svelte
<Select.Root type="single">
  <Select.Trigger>
    <Select.Value placeholder="Pick a food" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.Viewport>
        <Select.Group>
          <Select.GroupHeading>Fruits</Select.GroupHeading>
          <Select.Item value="apple" label="Apple" />
          <Select.Item value="banana" label="Banana" />
        </Select.Group>
        <Select.Group>
          <Select.GroupHeading>Vegetables</Select.GroupHeading>
          <Select.Item value="carrot" label="Carrot" />
          <Select.Item value="daikon" label="Daikon" />
        </Select.Group>
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

### With Scroll Buttons

For long lists, add `Select.ScrollUpButton` and `Select.ScrollDownButton` around the `Select.Viewport`. The `Viewport` is required when using scroll buttons.

```svelte
<Select.Portal>
  <Select.Content>
    <Select.ScrollUpButton>
      <ChevronUp />
    </Select.ScrollUpButton>
    <Select.Viewport>
      {#each items as item (item.value)}
        <Select.Item value={item.value} label={item.label}>
          {item.label}
        </Select.Item>
      {/each}
    </Select.Viewport>
    <Select.ScrollDownButton>
      <ChevronDown />
    </Select.ScrollDownButton>
  </Select.Content>
</Select.Portal>
```

### With Custom Scroll Acceleration

The `delay` prop on scroll buttons accepts a function `(tick: number) => number`, enabling acceleration curves. Use an easing function to speed up scrolling over time.

```svelte
<script lang="ts">
  import { cubicOut } from "svelte/easing";

  function autoScrollDelay(tick: number) {
    const maxDelay = 200;
    const minDelay = 25;
    const steps = 30;
    const progress = Math.min(tick / steps, 1);
    return maxDelay - (maxDelay - minDelay) * cubicOut(progress);
  }
</script>

<Select.ScrollUpButton delay={autoScrollDelay}>
  <ChevronUp />
</Select.ScrollUpButton>
```

### Native Scrolling (No Scroll Buttons)

If you prefer native scrollbar overflow instead of scroll buttons, omit the `ScrollUpButton`, `ScrollDownButton`, and `Viewport` components. Set a height and `overflow` styles on the `Content` directly.

```svelte
<Select.Content class="max-h-60 overflow-y-auto">
  {#each items as item (item.value)}
    <Select.Item value={item.value} label={item.label}>
      {item.label}
    </Select.Item>
  {/each}
</Select.Content>
```

### Floating Content with Svelte Transitions

Use `forceMount` with the `child` snippet to integrate Svelte transitions. The `child` snippet receives `wrapperProps` (for the positioning wrapper — do not style), `props` (for your content element — apply styles here), and `open` (for conditional rendering).

```svelte
<script lang="ts">
  import { Select } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<Select.Content forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:fly={{ duration: 300 }}>
          <!-- items here -->
        </div>
      </div>
    {/if}
  {/snippet}
</Select.Content>
```

### Customizing Select.Value

Use the `child` or `children` snippets on `Select.Value` to fully customize how the selected value is displayed. The snippet receives `selection`, `placeholder`, and `disabled`.

```svelte
<!-- Using children snippet (renders inside the default span) -->
<Select.Value placeholder="Pick a theme">
  {#snippet children({ selection, placeholder })}
    {#if selection.type === "single" && selection.selected}
      {selection.selected.label}
    {:else}
      {placeholder}
    {/if}
  {/snippet}
</Select.Value>

<!-- Using child snippet (full render delegation) -->
<Select.Value placeholder="Pick themes">
  {#snippet child({ props, selection, placeholder, disabled })}
    <div {...props}>
      {#if selection.type === "multiple" && selection.selected.length > 0}
        {#each selection.selected as item (item.value)}
          <span class="chip">
            {item.label}
            <button
              onclick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                selection.setValue(
                  selection.selected
                    .filter((t) => t.value !== item.value)
                    .map((t) => t.value)
                );
              }}
            >×</button>
          </span>
        {/each}
      {:else}
        <span>{placeholder}</span>
      {/if}
    </div>
  {/snippet}
</Select.Value>
```

### Custom Anchor

By default, `Select.Content` is anchored to the `Select.Trigger`. Pass a selector string or `HTMLElement` to `customAnchor` to anchor the content to a different element.

```svelte
<script lang="ts">
  import { Select } from "bits-ui";
  let customAnchor = $state<HTMLElement>(null!);
</script>

<div bind:this={customAnchor} class="anchor-wrapper">
  <Select.Root type="single">
    <Select.Trigger>
      <Select.Value placeholder="Pick an option" />
    </Select.Trigger>
    <!-- No Portal needed when anchoring to a specific element -->
    <Select.Content {customAnchor}>
      <Select.Viewport>
        <Select.Item value="a" label="Option A" />
        <Select.Item value="b" label="Option B" />
      </Select.Viewport>
    </Select.Content>
  </Select.Root>
</div>
```

### Opting Out of Floating UI

Use `Select.ContentStatic` instead of `Select.Content` to opt out of Floating UI positioning. You handle positioning via CSS yourself.

```svelte
<Select.Root type="single">
  <Select.Trigger>
    <Select.Value placeholder="Pick an option" />
  </Select.Trigger>
  <Select.Portal>
    <Select.ContentStatic>
      <Select.Viewport>
        <Select.Item value="a" label="Option A" />
        <Select.Item value="b" label="Option B" />
      </Select.Viewport>
    </Select.ContentStatic>
  </Select.Portal>
</Select.Root>
```

### Reusable Wrapper Component

Create a reusable select component that wraps the primitives for a more convenient API across your app.

```svelte
<!-- MySelect.svelte -->
<script lang="ts">
  import { Select, type WithoutChildren } from "bits-ui";

  type Props = WithoutChildren<Select.RootProps> & {
    placeholder?: string;
    items: { value: string; label: string; disabled?: boolean }[];
    contentProps?: WithoutChildren<Select.ContentProps>;
  };

  let {
    value = $bindable(),
    items,
    contentProps,
    placeholder,
    ...restProps
  }: Props = $props();
</script>

<Select.Root bind:value={value as never} {...restProps}>
  <Select.Trigger>
    <Select.Value {placeholder} />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content {...contentProps}>
      <Select.Viewport>
        {#each items as { value, label, disabled } (value)}
          <Select.Item {value} {label} {disabled}>
            {#snippet children({ selected })}
              {selected ? "✅ " : ""}{label}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

Usage:

```svelte
<script lang="ts">
  import MySelect from "$lib/components/MySelect.svelte";

  const items = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ];
  let fruit = $state("apple");
</script>

<MySelect {items} bind:value={fruit} />
```

### Managing Value and Open State

Use `bind:value` and `bind:open` for two-way binding, or function bindings for full control.

```svelte
<script lang="ts">
  import { Select } from "bits-ui";

  // Two-way binding
  let myValue = $state("");
  let myOpen = $state(false);

  // Function binding (fully controlled)
  function getValue() { return myValue; }
  function setValue(v: string) { myValue = v; }
</script>

<!-- Two-way binding -->
<Select.Root type="single" bind:value={myValue} bind:open={myOpen}>
  <!-- ... -->
</Select.Root>

<!-- Function binding (fully controlled) -->
<Select.Root type="single" bind:value={getValue, setValue}>
  <!-- ... -->
</Select.Root>
```

## Accessibility

The Select component follows the [WAI-ARIA combobox pattern](https://www.w3.org/TR/wai-aria-practices-1.2/#combobox) using the **descendant approach**: the `Select.Trigger` retains DOM focus at all times, while items are highlighted (not focused) as the user navigates. This keeps focus management simple and predictable for screen readers.

### Keyboard Navigation

When the trigger is focused and the dropdown is **closed**:

| Key | Action |
| --- | --- |
| `Enter` / `Space` | Opens the dropdown and highlights the selected item (or the first item). |
| `ArrowDown` | Opens the dropdown and highlights the first item. |
| `ArrowUp` | Opens the dropdown and highlights the last item. |
| Letter / number keys | If `items` is provided on `Root`, triggers typeahead: opens the dropdown and highlights the first matching item. |

When the dropdown is **open**:

| Key | Action |
| --- | --- |
| `ArrowDown` | Moves highlight to the next item. Loops if `loop` is `true`. |
| `ArrowUp` | Moves highlight to the previous item. Loops if `loop` is `true`. |
| `Home` | Moves highlight to the first item. |
| `End` | Moves highlight to the last item. |
| `Enter` | Selects the highlighted item and closes the dropdown. |
| `Space` | Selects the highlighted item and closes the dropdown. |
| `Escape` | Closes the dropdown without changing selection. Focus returns to the trigger. |
| `Tab` | Closes the dropdown and moves focus to the next focusable element. |
| Letter / number keys | Typeahead: highlights the next item whose label starts with the typed character(s). |

### ARIA Attributes

The component automatically manages the following ARIA attributes:

- The trigger has `aria-haspopup="listbox"` and `aria-expanded` reflecting the open state.
- The trigger has `aria-controls` pointing to the content's `id`.
- The content has `role="listbox"`.
- Items have `role="option"`, with `aria-selected` reflecting selection state.
- Disabled items have `aria-disabled="true"`.
- Groups use `role="group"` with `aria-labelledby` pointing to the `GroupHeading`.
- When the select is required or disabled, the appropriate `aria-required` / `aria-disabled` attributes are applied.

Always provide an `aria-label` on `Select.Trigger` if the trigger does not contain descriptive text, so screen readers can announce the select's purpose.

## Tips

### Floating Content Wrapper Rules

When using `Select.Content` with the `child` snippet (for Svelte transitions or custom rendering), the snippet receives three sets of props:

- **`wrapperProps`** — Spread these onto the outermost wrapper `<div>`. This is the positioning wrapper managed by Floating UI. **Do not apply your own styles to this element** — doing so can break positioning.
- **`props`** — Spread these onto your content element. **Apply your custom styles and classes here.**
- **`open`** — A boolean for conditional rendering. Use `{#if open}` to mount/unmount the inner content when integrating transitions.

The correct pattern:

```svelte
<Select.Content forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:fly>
          <!-- your items -->
        </div>
      </div>
    {/if}
  {/snippet}
</Select.Content>
```

### Viewport vs. Content Height

Apply min/max height constraints to `Select.Viewport`, not to `Select.Content`. The `Viewport` measures its own size to determine whether the scroll buttons should render. If you constrain `Content` instead, the scroll button visibility logic may not work correctly.

When using native overflow (no scroll buttons, no `Viewport`), apply height and `overflow` styles directly to `Select.Content`.

### When to Use items on Root

Pass the `items` prop to `Select.Root` when you want:

1. **Typeahead while closed** — users can type a character while the trigger is focused to open the dropdown and jump to the matching item.
2. **Form autofill** — when `type` is `'single'`, the browser can autofill the select based on the `items` list.

Without `items`, typeahead only works while the dropdown is open (matching against rendered `Select.Item` labels).

### Deselection in Single Mode

By default, a selected item cannot be deselected in single-select mode. Set `allowDeselect={true}` on `Select.Root` to allow users to click a selected item again (or press Enter on it) to clear the selection, setting `value` to an empty string.

### Scroll Lock

By default, body scrolling is **not** prevented when the select opens. Set `preventScroll={true}` on `Select.Content` to lock body scroll while the dropdown is open. Note that `ContentStatic` defaults to `preventScroll={true}`.

### Creating a Reusable Component

The primitives are verbose. For any project with more than one select, create a wrapper component (see the Examples section) that accepts an `items` array and renders the items internally. This keeps usage sites clean and ensures consistent styling.

When wrapping, use the `WithoutChildren<Select.RootProps>` utility type to avoid prop conflicts between the `children` snippet on `Root` and your own component's children.

### Custom Anchor for Complex Layouts

If the trigger is inside a transformed or overflow-hidden container that interferes with Floating UI positioning, use the `customAnchor` prop on `Select.Content` to anchor to a stable ancestor element. Pass either a CSS selector string or an `HTMLElement` reference.

### ContentStatic Positioning Caveats

When using `Select.ContentStatic`, be aware that combining it with `Select.Portal` can produce unexpected positioning, since the portal moves the content out of its natural DOM position while `ContentStatic` expects normal flow. Either omit the portal or handle positioning with absolute/fixed CSS on the content element.
