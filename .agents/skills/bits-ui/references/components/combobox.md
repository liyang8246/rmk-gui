# Combobox

Enables users to pick from a list of options displayed in a dropdown. The Combobox combines an input field with a dropdown list of selectable options, allowing users to search, filter, and select from a predefined set of choices.

## Overview

The Combobox component combines the functionality of an input field with a dropdown list of selectable options. It provides users with the ability to search, filter, and select from a predefined set of choices.

### When to use Combobox vs Select

- Use **Combobox** when the list of options is large enough that searching/filtering improves usability, when users may not know the exact option they need, or when you want to support free-text search to narrow down candidates.
- Use **Select** when the option set is small and fully visible without searching, and users are expected to scan the entire list rather than type.

### Key Features

- **Keyboard Navigation**: Full support for keyboard interactions, allowing users to navigate and select options without using a mouse.
- **Customizable Rendering**: Flexible architecture for rendering options, including support for grouped items.
- **Accessibility**: Built with ARIA attributes and keyboard interactions to ensure screen reader compatibility and accessibility standards.
- **Portal Support**: Ability to render the dropdown content in a portal, preventing layout issues in complex UI structures.
- **Single & Multiple Selection**: Supports both `'single'` and `'multiple'` selection modes via the `type` prop.

## Component Structure

The Combobox is composed of several sub-components, each with a specific role:

- **Root** — The main container component that manages the state and context for the combobox.
- **Input** — The input field that allows users to enter search queries.
- **Trigger** — The button or element that opens the dropdown list.
- **Portal** — Responsible for portalling the dropdown content to the body or a custom target.
- **Group** — A container for grouped items, used to group related items.
- **GroupHeading** — A heading for a group of items, providing a descriptive label for the group.
- **Item** — An individual item within the list.
- **Content** — The dropdown container that displays the items. It uses [Floating UI](https://floating-ui.com/) to position the content relative to the trigger.
- **ContentStatic** — An alternative to the Content component that enables you to opt-out of Floating UI and position the content yourself.
- **Viewport** — The visible area of the dropdown content, used to determine the size and scroll behavior.
- **ScrollUpButton** — A button that scrolls the content up when the content is larger than the viewport.
- **ScrollDownButton** — A button that scrolls the content down when the content is larger than the viewport.
- **Arrow** — An arrow element that points to the trigger when using the `Combobox.Content` component.

### Base Structure

```svelte
<script lang="ts">
  import { Combobox } from "bits-ui";
</script>

<Combobox.Root>
  <Combobox.Input />
  <Combobox.Trigger />
  <Combobox.Portal>
    <Combobox.Content>
      <Combobox.Group>
        <Combobox.GroupHeading />
        <Combobox.Item />
      </Combobox.Group>
      <Combobox.Item />
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
```

## API Reference

### Combobox.Root

The root combobox component which manages & scopes the state of the combobox.

| Property               | Type                                                            | Default       | Description                                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type` (required)      | `enum` — `'single'` \| `'multiple'`                             | `undefined`   | The type of combobox.                                                                                                                                                                                                                |
| `value` ($bindable)    | `string` \| `string[]`                                          | `undefined`   | The value of the combobox. When the type is `'single'`, this should be a string. When the type is `'multiple'`, this should be an array of strings.                                                                                  |
| `onValueChange`        | `(string) => void` \| `(string[]) => void`                      | `undefined`   | A callback that is fired when the combobox value changes. When the type is `'single'`, the argument will be a string. When the type is `'multiple'`, the argument will be an array of strings.                                       |
| `open` ($bindable)     | `boolean`                                                       | `false`       | The open state of the combobox menu.                                                                                                                                                                                                 |
| `onOpenChange`         | `(open: boolean) => void`                                       | `undefined`   | A callback function called when the open state changes.                                                                                                                                                                              |
| `onOpenChangeComplete` | `(open: boolean) => void`                                       | `undefined`   | A callback function called after the open state changes and all animations have completed.                                                                                                                                           |
| `disabled`             | `boolean`                                                       | `false`       | Whether or not the combobox component is disabled.                                                                                                                                                                                   |
| `name`                 | `string`                                                        | `undefined`   | The name to apply to the hidden input element for form submission. If provided, a hidden input element will be rendered to submit the value of the combobox.                                                                         |
| `required`             | `boolean`                                                       | `false`       | Whether or not the combobox menu is required.                                                                                                                                                                                        |
| `scrollAlignment`      | `enum` — `'nearest'` \| `'center'`                              | `'nearest'`   | The alignment of the highlighted item when scrolling.                                                                                                                                                                               |
| `loop`                 | `boolean`                                                       | `false`       | Whether or not the combobox menu should loop through items.                                                                                                                                                                         |
| `allowDeselect`        | `boolean`                                                       | `true`        | Whether or not the user can deselect the selected item by pressing it in a single select.                                                                                                                                            |
| `items`                | `{ value: string; label: string; disabled?: boolean }[]`        | `undefined`   | Optionally provide an array of objects representing the items in the select for autofill capabilities. Only applicable to combobox's with type `single`.                                                                            |
| `inputValue`           | `string`                                                        | `undefined`   | A read-only value that controls the text displayed in the combobox input. Use this to programmatically update the input value when the selection changes outside the component, ensuring the displayed text stays in sync with the actual value. |
| `children`             | `Snippet`                                                       | `undefined`   | The children content to render.                                                                                                                                                                                                      |

### Combobox.Trigger

A button which toggles the combobox's open state.

| Property         | Type                            | Default     | Description                                                                                                              |
| ---------------- | ------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ref` ($bindable) | `HTMLButtonElement`             | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`       | `Snippet`                       | `undefined` | The children content to render.                                                                                          |
| `child`          | `Snippet` — `SnippetProps`      | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.     |

### Combobox.Input

A representation of the combobox input element, which is typically displayed in the content.

| Property          | Type                        | Default     | Description                                                                                                                                                            |
| ----------------- | --------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultValue`    | `string`                    | `undefined` | The default value of the input. This is not a reactive prop and is only used to populate the input when the combobox is first mounted if there is already a value set. |
| `clearOnDeselect` | `boolean`                   | `false`     | Whether to clear the input when the last item is deselected.                                                                                                           |
| `ref` ($bindable) | `HTMLInputElement`          | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                                                                     |
| `children`        | `Snippet`                   | `undefined` | The children content to render.                                                                                                                                        |
| `child`           | `Snippet` — `SnippetProps`  | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.                                                   |

### Combobox.Content

The element which contains the combobox's items. Uses [Floating UI](https://floating-ui.com/) to position the content relative to the trigger (by default, the `Combobox.Input`).

| Property                       | Type                                                                                          | Default       | Description                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `side`                         | `enum` — `'top'` \| `'bottom'` \| `'left'` \| `'right'`                                       | `'bottom'`    | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur.                                                                                                                                                                                                                                           |
| `sideOffset`                   | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                      |
| `align`                        | `enum` — `'start'` \| `'center'` \| `'end'`                                                   | `'start'`     | The preferred alignment of the anchor to render the floating element against when open. This may change when collisions occur.                                                                                                                                                                                                                                       |
| `alignOffset`                  | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element.                                                                                                                                                                                                                                                                                                      |
| `arrowPadding`                 | `number`                                                                                      | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                |
| `avoidCollisions`              | `boolean`                                                                                     | `true`        | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges.                                                                                                                                                                                                                                                                |
| `collisionBoundary`            | `Element` \| `null`                                                                           | `undefined`   | A boundary element or array of elements to check for collisions against.                                                                                                                                                                                                                                                                                             |
| `collisionPadding`             | `number` \| `Partial<Record<Side, number>>`                                                   | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision.                                                                                                                                                                                                                                                |
| `sticky`                       | `enum` — `'partial'` \| `'always'`                                                            | `'partial'`   | The sticky behavior on the align axis. `'partial'` will keep the content in the boundary as long as the trigger is at least partially in the boundary whilst `'always'` will keep the content in the boundary regardless.                                                                                                                                            |
| `hideWhenDetached`             | `boolean`                                                                                     | `true`        | When `true`, hides the content when it is detached from the DOM. This is useful for when you want to hide the content when the user scrolls away.                                                                                                                                                                                                                    |
| `updatePositionStrategy`       | `enum` — `'optimized'` \| `'always'`                                                          | `'optimized'` | The strategy to use when updating the position of the content. When `'optimized'` the content will only be repositioned when the trigger is in the viewport. When `'always'` the content will be repositioned whenever the position changes.                                                                                                                         |
| `strategy`                     | `enum` — `'fixed'` \| `'absolute'`                                                            | `'fixed'`     | The positioning strategy to use for the floating element. When `'fixed'` the element will be positioned relative to the viewport. When `'absolute'` the element will be positioned relative to the nearest positioned ancestor.                                                                                                                                      |
| `preventScroll`                | `boolean`                                                                                     | `false`       | When `true`, prevents the body from scrolling when the content is open. This is useful when you want to use the content as a modal.                                                                                                                                                                                                                                  |
| `customAnchor`                 | `string` \| `HTMLElement` \| `Measurable` \| `null`                                           | `null`        | Use an element other than the trigger to anchor the content to. If provided, the content will be anchored to the provided element instead of the trigger.                                                                                                                                                                                                            |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. You can call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event.                                                                                                                                                                              |
| `escapeKeydownBehavior`        | `enum` — `'close'` \| `'ignore'` \| `'defer-otherwise-close'` \| `'defer-otherwise-ignore'`   | `'close'`     | The behavior to use when an escape keydown event occurs in the floating content. `'close'` will close the content immediately. `'ignore'` will prevent the content from closing. `'defer-otherwise-close'` will defer to the parent element if it exists, otherwise it will close the content. `'defer-otherwise-ignore'` will defer to the parent element if it exists, otherwise it will ignore the interaction. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`   | Callback fired when an outside interaction event occurs, which is a `pointerdown` event. You can call `event.preventDefault()` to prevent the default behavior of handling the outside interaction.                                                                                                                                                                  |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`   | Callback fired when focus leaves the dismissible layer. You can call `event.preventDefault()` to prevent the default behavior on focus leaving the layer.                                                                                                                                                                                                            |
| `interactOutsideBehavior`      | `enum` — `'close'` \| `'ignore'` \| `'defer-otherwise-close'` \| `'defer-otherwise-ignore'`   | `'close'`     | The behavior to use when an interaction occurs outside of the floating content. `'close'` will close the content immediately. `'ignore'` will prevent the content from closing. `'defer-otherwise-close'` will defer to the parent element if it exists, otherwise it will close the content. `'defer-otherwise-ignore'` will defer to the parent element if it exists, otherwise it will ignore the interaction.  |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`        | When `true`, prevents the text selection from overflowing the bounds of the element.                                                                                                                                                                                                                                                                                |
| `dir`                          | `enum` — `'ltr'` \| `'rtl'`                                                                   | `'ltr'`       | The reading direction of the app.                                                                                                                                                                                                                                                                                                                                    |
| `loop`                         | `boolean`                                                                                     | `false`       | Whether or not the combobox should loop through items when reaching the end.                                                                                                                                                                                                                                                                                        |
| `forceMount`                   | `boolean`                                                                                     | `false`       | Whether or not to forcefully mount the content. This is useful if you want to use Svelte transitions or another animation library for the content.                                                                                                                                                                                                                   |
| `ref` ($bindable)              | `HTMLDivElement`                                                                              | `null`        | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                                                                                                                                                                                                                                                                  |
| `children`                     | `Snippet`                                                                                     | `undefined`   | The children content to render.                                                                                                                                                                                                                                                                                                                                      |
| `child`                        | `Snippet` — `ChildSnippetProps`                                                               | `undefined`   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs. The `ChildSnippetProps` expose `wrapperProps` (positioning wrapper — do not style), `props` (apply custom styles here), and `open` (content visibility state for conditional rendering with Svelte transitions).                                |

### Combobox.ContentStatic

The element which contains the combobox's items. Static variant that opts out of Floating UI — you handle positioning yourself.

| Property                       | Type                                                                                          | Default       | Description                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. You can call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event.                                                                                                                                                                              |
| `escapeKeydownBehavior`        | `enum` — `'close'` \| `'ignore'` \| `'defer-otherwise-close'` \| `'defer-otherwise-ignore'`   | `'close'`     | The behavior to use when an escape keydown event occurs in the floating content. `'close'` will close the content immediately. `'ignore'` will prevent the content from closing. `'defer-otherwise-close'` will defer to the parent element if it exists, otherwise it will close the content. `'defer-otherwise-ignore'` will defer to the parent element if it exists, otherwise it will ignore the interaction. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`   | Callback fired when an outside interaction event occurs, which is a `pointerdown` event. You can call `event.preventDefault()` to prevent the default behavior of handling the outside interaction.                                                                                                                                                                  |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`   | Callback fired when focus leaves the dismissible layer. You can call `event.preventDefault()` to prevent the default behavior on focus leaving the layer.                                                                                                                                                                                                            |
| `interactOutsideBehavior`      | `enum` — `'close'` \| `'ignore'` \| `'defer-otherwise-close'` \| `'defer-otherwise-ignore'`   | `'close'`     | The behavior to use when an interaction occurs outside of the floating content. `'close'` will close the content immediately. `'ignore'` will prevent the content from closing. `'defer-otherwise-close'` will defer to the parent element if it exists, otherwise it will close the content. `'defer-otherwise-ignore'` will defer to the parent element if it exists, otherwise it will ignore the interaction.  |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | `undefined`   | Event handler called when auto-focusing the content as it is opened. Can be prevented.                                                                                                                                                                                                                                                                               |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | `undefined`   | Event handler called when auto-focusing the content as it is closed. Can be prevented.                                                                                                                                                                                                                                                                               |
| `trapFocus`                    | `boolean`                                                                                     | `true`        | Whether or not to trap the focus within the content when open.                                                                                                                                                                                                                                                                                                       |
| `preventScroll`                | `boolean`                                                                                     | `true`        | When `true`, prevents the body from scrolling when the content is open. This is useful when you want to use the content as a modal.                                                                                                                                                                                                                                  |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`        | When `true`, prevents the text selection from overflowing the bounds of the element.                                                                                                                                                                                                                                                                                |
| `dir`                          | `enum` — `'ltr'` \| `'rtl'`                                                                   | `'ltr'`       | The reading direction of the app.                                                                                                                                                                                                                                                                                                                                    |
| `loop`                         | `boolean`                                                                                     | `false`       | Whether or not the combobox should loop through items when reaching the end.                                                                                                                                                                                                                                                                                        |
| `forceMount`                   | `boolean`                                                                                     | `false`       | Whether or not to forcefully mount the content. This is useful if you want to use Svelte transitions or another animation library for the content.                                                                                                                                                                                                                   |
| `ref` ($bindable)              | `HTMLDivElement`                                                                              | `null`        | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                                                                                                                                                                                                                                                                  |
| `children`                     | `Snippet`                                                                                     | `undefined`   | The children content to render.                                                                                                                                                                                                                                                                                                                                      |
| `child`                        | `Snippet` — `ChildSnippetProps`                                                               | `undefined`   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs. The `ChildSnippetProps` expose `open` (content visibility state) and `props` (apply custom styles here).                                                                                                                                         |

### Combobox.Portal

When used, will render the combobox content into the body or custom `to` element when open.

| Property   | Type                       | Default          | Description                                                                                                                                |
| ---------- | -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `to`       | `Element` \| `string`      | `document.body`  | Where to render the content when it is open. Defaults to the body.                                                                         |
| `disabled` | `boolean`                  | `false`          | Whether the portal is disabled or not. When disabled, the content will be rendered in its original DOM location.                           |
| `children` | `Snippet`                  | `undefined`      | The children content to render.                                                                                                            |

### Combobox.Item

A combobox item, which must be a child of the `Combobox.Content` component.

| Property          | Type                        | Default     | Description                                                                                                              |
| ----------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `value` (required) | `string`                    | `undefined` | The value of the item.                                                                                                   |
| `label`           | `string`                    | `undefined` | The label of the item, which is what the list will be filtered by.                                                       |
| `disabled`        | `boolean`                   | `false`     | Whether or not the combobox item is disabled. This will prevent interaction/selection.                                   |
| `onHighlight`     | `() => void`                | `undefined` | A callback that is fired when the item is highlighted.                                                                   |
| `onUnhighlight`   | `() => void`                | `undefined` | A callback that is fired when the item is unhighlighted.                                                                 |
| `ref` ($bindable) | `HTMLDivElement`            | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`        | `Snippet`                   | `undefined` | The children content to render.                                                                                          |
| `child`           | `Snippet` — `SnippetProps`  | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.     |

### Combobox.Group

A group of related combobox items.

| Property          | Type                        | Default     | Description                                                                                                              |
| ----------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ref` ($bindable) | `HTMLDivElement`            | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`        | `Snippet`                   | `undefined` | The children content to render.                                                                                          |
| `child`           | `Snippet` — `SnippetProps`  | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.     |

### Combobox.GroupHeading

A heading for the parent combobox group. This is used to describe a group of related combobox items.

| Property          | Type                        | Default     | Description                                                                                                              |
| ----------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ref` ($bindable) | `HTMLDivElement`            | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`        | `Snippet`                   | `undefined` | The children content to render.                                                                                          |
| `child`           | `Snippet` — `SnippetProps`  | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.     |

### Combobox.Viewport

An optional element to track the scroll position of the combobox for rendering the scroll up/down buttons. If you wish to set a minimum/maximum height for the content, apply it to the `Combobox.Viewport` component.

| Property          | Type                        | Default     | Description                                                                                                              |
| ----------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ref` ($bindable) | `HTMLDivElement`            | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`        | `Snippet`                   | `undefined` | The children content to render.                                                                                          |
| `child`           | `Snippet` — `SnippetProps`  | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.     |

### Combobox.ScrollUpButton

An optional scroll up button element to improve the scroll experience within the combobox. Should be used in conjunction with the `Combobox.Viewport` component.

| Property          | Type                          | Default | Description                                                                                                              |
| ----------------- | ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `delay`           | `(tick: number) => number`    | `() => 50` | Controls the initial delay (tick 0) and delay between auto-scrolls in milliseconds.                                   |
| `ref` ($bindable) | `HTMLDivElement`              | `null`  | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`        | `Snippet`                     | `undefined` | The children content to render.                                                                                       |
| `child`           | `Snippet` — `SnippetProps`    | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.   |

### Combobox.ScrollDownButton

An optional scroll down button element to improve the scroll experience within the combobox. Should be used in conjunction with the `Combobox.Viewport` component.

| Property          | Type                          | Default | Description                                                                                                              |
| ----------------- | ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `delay`           | `(tick: number) => number`    | `() => 50` | Controls the initial delay (tick 0) and delay between auto-scrolls in milliseconds.                                   |
| `ref` ($bindable) | `HTMLDivElement`              | `null`  | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`        | `Snippet`                     | `undefined` | The children content to render.                                                                                       |
| `child`           | `Snippet` — `SnippetProps`    | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.   |

### Combobox.Arrow

An optional arrow element which points to the content when open.

| Property          | Type                        | Default     | Description                                                                                                              |
| ----------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `width`           | `number`                    | `8`         | The width of the arrow in pixels.                                                                                        |
| `height`          | `number`                    | `8`         | The height of the arrow in pixels.                                                                                       |
| `ref` ($bindable) | `HTMLDivElement`            | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                       |
| `children`        | `Snippet`                   | `undefined` | The children content to render.                                                                                          |
| `child`           | `Snippet` — `SnippetProps`  | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.     |

## Data Attributes

| Attribute                          | Value                       | Component                  | Description                                                                                         |
| ---------------------------------- | --------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| `data-state`                       | `'open'` \| `'closed'`      | Trigger, Input, Content, ContentStatic | The combobox's open state.                                                                          |
| `data-disabled`                    | `''`                        | Trigger, Input, Item       | Present when the combobox (or item) is disabled.                                                    |
| `data-combobox-trigger`            | `''`                        | Trigger                    | Present on the trigger element.                                                                     |
| `data-combobox-input`              | `''`                        | Input                      | Present on the input element.                                                                       |
| `data-combobox-content`            | `''`                        | Content, ContentStatic     | Present on the content element.                                                                     |
| `data-starting-style`              | `''`                        | Content, ContentStatic     | Present during the initial open frame. Use this to define the starting styles for CSS transitions.  |
| `data-ending-style`                | `''`                        | Content, ContentStatic     | Present while closing before unmount. Use this to define the ending styles for CSS transitions.     |
| `data-value`                       | `string`                    | Item                       | The value of the combobox item.                                                                     |
| `data-label`                       | `string`                    | Item                       | The label of the combobox item.                                                                     |
| `data-highlighted`                 | `''`                        | Item                       | Present when the item is highlighted, either via keyboard navigation of the menu or hover.          |
| `data-selected`                    | `''`                        | Item                       | Present when the item is selected.                                                                  |
| `data-combobox-item`               | `''`                        | Item                       | Present on the item element.                                                                        |
| `data-combobox-group`              | `''`                        | Group                      | Present on the group element.                                                                       |
| `data-combobox-group-heading`      | `''`                        | GroupHeading               | Present on the group heading element.                                                               |
| `data-combobox-viewport`           | `''`                        | Viewport                   | Present on the viewport element.                                                                    |
| `data-combobox-scroll-up-button`   | `''`                        | ScrollUpButton             | Present on the scroll up button element.                                                            |
| `data-combobox-scroll-down-button` | `''`                        | ScrollDownButton           | Present on the scroll down button element.                                                          |
| `data-arrow`                       | `''`                        | Arrow                      | Present on the arrow element.                                                                       |

## CSS Variables

These CSS variables are exposed on the `Combobox.Content` component for use in styling:

| CSS Variable                               | Description                                  |
| ------------------------------------------ | -------------------------------------------- |
| `--bits-combobox-content-transform-origin` | The transform origin of the content element. |
| `--bits-combobox-content-available-width`  | The available width of the content element.  |
| `--bits-combobox-content-available-height` | The available height of the content element. |
| `--bits-combobox-anchor-width`             | The width of the anchor element.             |
| `--bits-combobox-anchor-height`            | The height of the anchor element.            |

## Examples

### Basic Single Selection

```svelte
<script lang="ts">
  import { Combobox } from "bits-ui";
  import CaretUpDown from "phosphor-svelte/lib/CaretUpDown";
  import Check from "phosphor-svelte/lib/Check";

  const fruits = [
    { value: "mango", label: "Mango" },
    { value: "watermelon", label: "Watermelon" },
    { value: "apple", label: "Apple" },
    { value: "pineapple", label: "Pineapple" },
    { value: "orange", label: "Orange" },
    { value: "grape", label: "Grape" },
  ];

  let searchValue = $state("");
  const filteredFruits = $derived(
    searchValue === ""
      ? fruits
      : fruits.filter((fruit) =>
          fruit.label.toLowerCase().includes(searchValue.toLowerCase())
        )
  );
</script>

<Combobox.Root
  type="single"
  name="favoriteFruit"
  onOpenChangeComplete={(o) => {
    if (!o) searchValue = "";
  }}
>
  <div class="relative">
    <Combobox.Input
      oninput={(e) => (searchValue = e.currentTarget.value)}
      placeholder="Search a fruit"
      aria-label="Search a fruit"
    />
    <Combobox.Trigger class="absolute end-3 top-1/2 size-6 -translate-y-1/2">
      <CaretUpDown class="size-6" />
    </Combobox.Trigger>
  </div>
  <Combobox.Portal>
    <Combobox.Content sideOffset={10}>
      <Combobox.Viewport>
        {#each filteredFruits as fruit, i (i + fruit.value)}
          <Combobox.Item value={fruit.value} label={fruit.label}>
            {#snippet children({ selected })}
              {fruit.label}
              {#if selected}
                <div class="ml-auto"><Check /></div>
              {/if}
            {/snippet}
          </Combobox.Item>
        {:else}
          <span>No results found, try again.</span>
        {/each}
      </Combobox.Viewport>
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
```

### Multiple Selection

```svelte
<script lang="ts">
  import { Combobox } from "bits-ui";
  import CaretUpDown from "phosphor-svelte/lib/CaretUpDown";
  import Check from "phosphor-svelte/lib/Check";

  const fruits = [
    { value: "mango", label: "Mango" },
    { value: "watermelon", label: "Watermelon" },
    { value: "apple", label: "Apple" },
    { value: "pineapple", label: "Pineapple" },
    { value: "orange", label: "Orange" },
    { value: "grape", label: "Grape" },
  ];

  let searchValue = $state("");
  const filteredFruits = $derived(
    searchValue === ""
      ? fruits
      : fruits.filter((fruit) =>
          fruit.label.toLowerCase().includes(searchValue.toLowerCase())
        )
  );
</script>

<Combobox.Root
  type="multiple"
  name="favoriteFruits"
  onOpenChangeComplete={(o) => {
    if (!o) searchValue = "";
  }}
>
  <div class="relative">
    <Combobox.Input
      oninput={(e) => (searchValue = e.currentTarget.value)}
      placeholder="Search fruits"
      aria-label="Search fruits"
    />
    <Combobox.Trigger class="absolute end-3 top-1/2 size-6 -translate-y-1/2">
      <CaretUpDown class="size-6" />
    </Combobox.Trigger>
  </div>
  <Combobox.Portal>
    <Combobox.Content sideOffset={10}>
      <Combobox.Viewport>
        {#each filteredFruits as fruit, i (i + fruit.value)}
          <Combobox.Item value={fruit.value} label={fruit.label}>
            {#snippet children({ selected })}
              {fruit.label}
              {#if selected}
                <div class="ml-auto"><Check /></div>
              {/if}
            {/snippet}
          </Combobox.Item>
        {:else}
          <span>No results found, try again.</span>
        {/each}
      </Combobox.Viewport>
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet to render your own element while delegating event handling and props to the component. The `children` snippet on `Combobox.Item` receives `{ selected }` to reflect selection state.

```svelte
<script lang="ts">
  import { Combobox } from "bits-ui";

  const items = [
    { value: "mango", label: "Mango" },
    { value: "apple", label: "Apple" },
    { value: "orange", label: "Orange" },
  ];
</script>

<Combobox.Root type="single">
  <Combobox.Input />
  <Combobox.Trigger>
    {#snippet child({ props })}
      <button {...props} class="custom-trigger">Open</button>
    {/snippet}
  </Combobox.Trigger>
  <Combobox.Portal>
    <Combobox.Content>
      {#each items as item (item.value)}
        <Combobox.Item value={item.value} label={item.label}>
          {#snippet children({ selected })}
            {item.label}
            {#if selected}<span class="ml-auto">✅</span>{/if}
          {/snippet}
        </Combobox.Item>
      {/each}
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
```

### Floating Content with Svelte Transitions

Use `forceMount` along with the `child` snippet to mount the `Combobox.Content` and apply Svelte Transitions or another animation library.

```svelte
<script lang="ts">
  import { Combobox } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<Combobox.Content forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:fly={{ duration: 300 }}>
          <!-- items go here -->
        </div>
      </div>
    {/if}
  {/snippet}
</Combobox.Content>
```

- `wrapperProps` — Props for the positioning wrapper. Do not style this element; styling should be applied to the content element.
- `props` — Props for your content element. Apply your custom styles here.
- `open` — Content visibility state. Use this for conditional rendering with Svelte transitions.

### Reusable Custom Combobox Component

Wrap the primitives in a reusable component using `mergeProps` to forward props and manage search state internally:

```svelte
<!-- CustomCombobox.svelte -->
<script lang="ts">
  import { Combobox, type WithoutChildrenOrChild, mergeProps } from "bits-ui";

  type Props = Combobox.RootProps & {
    inputProps?: WithoutChildrenOrChild<Combobox.InputProps>;
    contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>;
  };

  let {
    items = [],
    value = $bindable(),
    open = $bindable(false),
    inputProps,
    contentProps,
    type,
    ...restProps
  }: Props = $props();

  let searchValue = $state("");

  const filteredItems = $derived.by(() => {
    if (searchValue === "") return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  });

  function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
    searchValue = e.currentTarget.value;
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) searchValue = "";
  }

  const mergedRootProps = $derived(
    mergeProps(restProps, { onOpenChange: handleOpenChange })
  );
  const mergedInputProps = $derived(
    mergeProps(inputProps, { oninput: handleInput })
  );
</script>

<Combobox.Root
  {type}
  {items}
  bind:value={value as never}
  bind:open
  {...mergedRootProps}
>
  <Combobox.Input {...mergedInputProps} />
  <Combobox.Trigger>Open</Combobox.Trigger>
  <Combobox.Portal>
    <Combobox.Content {...contentProps}>
      {#each filteredItems as item, i (i + item.value)}
        <Combobox.Item {...item}>
          {#snippet children({ selected })}
            {item.label}
            {selected ? "✅" : ""}
          {/snippet}
        </Combobox.Item>
      {:else}
        <span>No results found</span>
      {/each}
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { CustomCombobox } from "$lib/components";

  const items = [
    { value: "mango", label: "Mango" },
    { value: "watermelon", label: "Watermelon" },
    { value: "apple", label: "Apple" },
    // ...
  ];
</script>

<CustomCombobox type="single" {items} />
```

## Accessibility

### Keyboard Navigation

The Combobox follows the [WAI-ARIA combobox pattern](https://www.w3.org/TR/wai-aria-practices-1.2/#combobox) using the descendant approach. The `Combobox.Input` retains focus the entire time — even when navigating with the keyboard — and items are highlighted as the user navigates them.

| Key                    | Behavior                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `ArrowDown`            | Opens the menu and moves highlight to the next item.                     |
| `ArrowUp`              | Opens the menu and moves highlight to the previous item.                 |
| `Enter`                | Selects the highlighted item.                                            |
| `Escape`               | Closes the menu without changing selection.                              |
| `Home`                 | Moves highlight to the first item.                                       |
| `End`                  | Moves highlight to the last item.                                        |
| `Tab`                  | Closes the menu and moves focus to the next focusable element.           |
| Backspace / Typing     | Filters the list based on the input value.                               |

### ARIA

- The input element has `role="combobox"` with appropriate `aria-expanded`, `aria-controls`, and `aria-activedescendant` attributes that are managed automatically.
- The content has `role="listbox"`.
- Items have `role="option"` with `aria-selected` reflecting selection state.
- Groups use `role="group"` with `aria-labelledby` pointing to the `GroupHeading`.
- `data-highlighted` reflects the currently highlighted (aria-activedescendant) item.
- `onHighlight` / `onUnhighlight` callbacks fire when an item is highlighted or unhighlighted.

### Styling Highlighted Items

Use the `data-highlighted` attribute on `Combobox.Item` to style the item differently when it is highlighted (via keyboard navigation or hover):

```css
[data-highlighted] {
  background-color: var(--muted);
}
```

## Tips

### Floating Content Wrapper Rules

When using `Combobox.Content` with the `child` snippet for Svelte transitions, you receive `wrapperProps` and `props`:

- Spread `wrapperProps` onto an outer wrapper element. This is the positioning wrapper used by Floating UI — **do not style it**.
- Spread `props` onto your actual content element. **Apply all custom styles here.**
- Use the `open` boolean to conditionally render with transitions.

### Custom Anchor

By default, `Combobox.Content` is anchored to `Combobox.Input`. To anchor to a different element, pass a selector string or `HTMLElement` to the `customAnchor` prop:

```svelte
<script lang="ts">
  import { Combobox } from "bits-ui";
  let customAnchor = $state<HTMLElement>(null!);
</script>

<div bind:this={customAnchor}></div>
<Combobox.Root>
  <Combobox.Trigger />
  <Combobox.Input />
  <Combobox.Content {customAnchor}>
    <!-- ... -->
  </Combobox.Content>
</Combobox.Root>
```

### Opting Out of Floating UI

Use `Combobox.ContentStatic` instead of `Combobox.Content` to opt out of Floating UI positioning. You must handle positioning yourself. Combining `Combobox.Portal` with `Combobox.ContentStatic` may cause unexpected positioning behavior — consider omitting the portal or working around it.

### Scroll Buttons & Viewport

- `Combobox.ScrollUpButton` and `Combobox.ScrollDownButton` require `Combobox.Viewport` to function.
- Set min/max heights on the `Combobox.Viewport`, not the `Combobox.Content`.
- To use native scrollbar/overflow instead of scroll buttons, omit both the scroll button components and the `Viewport`, then set a height and `overflow` styles on `Combobox.Content`.

### Custom Scroll Delay

Control the initial and subsequent scroll delays using the `delay` prop (a function of `tick: number` returning milliseconds) on the scroll buttons:

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

<Combobox.ScrollUpButton delay={autoScrollDelay}>
  <!-- icon -->
</Combobox.ScrollUpButton>
```

### Managing Search Value

Clear the search value when the menu closes by using `onOpenChangeComplete`:

```svelte
<Combobox.Root
  onOpenChangeComplete={(o) => {
    if (!o) searchValue = "";
  }}
>
```

### Managing Value State

- **Two-way binding**: Use `bind:value` for automatic synchronization. For `type="single"` this is a `string`; for `type="multiple"` this is `string[]`.
- **Fully controlled**: Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) (`bind:value={getValue, setValue}`) for complete control over reads and writes.

### Managing Open State

- **Two-way binding**: Use `bind:open` for automatic synchronization.
- **Fully controlled**: Use a Function Binding (`bind:open={getOpen, setOpen}`).
- `onOpenChange` fires when the open state changes; `onOpenChangeComplete` fires after all animations complete.

### Forms & Hidden Input

Set the `name` prop on `Combobox.Root` to render a hidden input element that submits the combobox value with the form. Use `required` to mark it as required for form validation. The `items` prop (single select only) enables autofill capabilities.

### Discriminated Unions & Bindable

When building a reusable component that destructures `value` (required for `bindable`) and supports both `type="single"` and `type="multiple"`, cast the value to `never` to avoid type errors from the discriminated union. The consumer side will still be type-checked correctly:

```svelte
<Combobox.Root {type} bind:value={value as never}>
```
