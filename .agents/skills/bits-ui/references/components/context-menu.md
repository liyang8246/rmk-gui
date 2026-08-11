# Context Menu

The Context Menu component displays contextual options and actions triggered by a right-click. It renders a floating menu near the cursor position, supports nested submenus, checkbox/radio items, groupings with headings, and full keyboard navigation.

## Table of Contents

- [Overview](#overview)
- [Component Structure](#component-structure)
- [API Reference](#api-reference)
  - [ContextMenu.Root](#contextmenuproot)
  - [ContextMenu.Trigger](#contextmenutrigger)
  - [ContextMenu.Portal](#contextmenuportal)
  - [ContextMenu.Content](#contextmenucontent)
  - [ContextMenu.ContentStatic](#contextmenucontentstatic)
  - [ContextMenu.Item](#contextmenuitem)
  - [ContextMenu.CheckboxGroup](#contextmenucheckboxgroup)
  - [ContextMenu.CheckboxItem](#contextmenucheckboxitem)
  - [ContextMenu.RadioGroup](#contextmenuradiogroup)
  - [ContextMenu.RadioItem](#contextmenuradioitem)
  - [ContextMenu.Separator](#contextmenuseparator)
  - [ContextMenu.Arrow](#contextmenuarrow)
  - [ContextMenu.Group](#contextmenugroup)
  - [ContextMenu.GroupHeading](#contextmenugroupheading)
  - [ContextMenu.Sub](#contextmenusub)
  - [ContextMenu.SubTrigger](#contextmenusubtrigger)
  - [ContextMenu.SubContent](#contextmenusubcontent)
  - [ContextMenu.SubContentStatic](#contextmenusubcontentstatic)
- [Data Attributes](#data-attributes)
- [CSS Variables](#css-variables)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Tips](#tips)

## Overview

The Context Menu is a compound component that opens on right-click (contextual menu event) rather than on a regular click. It is built on the [WAI-ARIA Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) and uses Floating UI for positioning.

Key characteristics:

- **Right-click triggered** — opens at the cursor position via the `contextmenu` event.
- **Floating UI positioning** — content is portaled and positioned with collision detection; a `ContentStatic` variant is available when floating UI is not needed.
- **Composable** — supports items, checkbox items, radio groups, checkbox groups, separators, group headings, arrows, and arbitrarily nested submenus.
- **Accessible by default** — ARIA roles, focus trapping, and full keyboard navigation built in.
- **Animation ready** — CSS variables for transform origin/available space, plus `forceMount` + `child` snippet support for Svelte transitions.

## Component Structure

The Context Menu is a compound component made up of the following parts:

- `ContextMenu.Root` — Container that manages and scopes the open/closed state of the menu.
- `ContextMenu.Trigger` — The element that, when right-clicked, opens the context menu.
- `ContextMenu.Portal` — Portals the content to the body (or a custom target) when open.
- `ContextMenu.Content` — The floating menu content displayed when the menu is open.
- `ContextMenu.ContentStatic` — A non-floating variant of the content (no Floating UI).
- `ContextMenu.Item` — A standard menu item.
- `ContextMenu.CheckboxGroup` — A group of checkbox menu items; `value` is an array of checked values.
- `ContextMenu.CheckboxItem` — A menu item that can be toggled like a checkbox.
- `ContextMenu.RadioGroup` — A group of radio menu items; only one can be checked at a time.
- `ContextMenu.RadioItem` — A menu item that behaves like a radio button; must be a child of a `RadioGroup`.
- `ContextMenu.Separator` — A horizontal line to visually separate menu items.
- `ContextMenu.Arrow` — An optional arrow pointing to the menu's anchor/trigger point.
- `ContextMenu.Group` — A group of menu items; requires an `aria-label` or a child `GroupHeading`.
- `ContextMenu.GroupHeading` — A visual label for a group; skipped during keyboard navigation.
- `ContextMenu.Sub` — A submenu container that manages the submenu's open/closed state.
- `ContextMenu.SubTrigger` — A menu item that opens the submenu it belongs to on press/hover.
- `ContextMenu.SubContent` — The floating submenu content displayed when the parent submenu is open.
- `ContextMenu.SubContentStatic` — A non-floating variant of the submenu content.

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
</script>
<ContextMenu.Root>
  <ContextMenu.Trigger />
  <ContextMenu.Portal>
    <ContextMenu.Content>
      <ContextMenu.Group>
        <ContextMenu.GroupHeading />
        <ContextMenu.Item />
      </ContextMenu.Group>
      <ContextMenu.Item />
      <ContextMenu.CheckboxItem>
        {#snippet children({ checked })}
          {checked ? "✅" : ""}
        {/snippet}
      </ContextMenu.CheckboxItem>
      <ContextMenu.RadioGroup>
        <ContextMenu.GroupHeading />
        <ContextMenu.RadioItem>
          {#snippet children({ checked })}
            {checked ? "✅" : ""}
          {/snippet}
        </ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger />
        <ContextMenu.SubContent />
      </ContextMenu.Sub>
      <ContextMenu.Separator />
      <ContextMenu.Arrow />
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

## API Reference

### ContextMenu.Root

The root component which manages and scopes the state of the context menu.

| Property               | Type                                  | Default     | Description |
| ---------------------- | ------------------------------------- | ----------- | ----------- |
| `open` (bindable)      | `boolean`                             | `false`     | The open state of the menu. |
| `onOpenChange`         | `(open: boolean) => void`             | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void`             | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `dir`                  | `'ltr' \| 'rtl'`                      | `'ltr'`     | The reading direction of the app. |
| `children`             | `Snippet`                             | `undefined` | The children content to render. |

### ContextMenu.Trigger

The element which, when right-clicked, opens the context menu.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `disabled`       | `boolean`                                     | `false`     | Whether or not the menu trigger is disabled. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.Portal

A component that portals the content of the menu to the body or a custom target (if provided).

| Property   | Type                       | Default          | Description |
| ---------- | -------------------------- | ---------------- | ----------- |
| `to`       | `Element \| string`        | `document.body`  | Where to render the content when it is open. Defaults to the body. |
| `disabled` | `boolean`                  | `false`          | Whether the portal is disabled. When disabled, the content will be rendered in its original DOM location. |
| `children` | `Snippet`                  | `undefined`      | The children content to render. |

### ContextMenu.Content

The floating content displayed when the context menu is open. Uses Floating UI for positioning.

| Property                       | Type                                                                                          | Default      | Description |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------ | ----------- |
| `side`                         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                      | `'bottom'`   | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur. |
| `sideOffset`                   | `number`                                                                                      | `0`          | The distance in pixels from the anchor to the floating element. |
| `align`                        | `'start' \| 'center' \| 'end'`                                                                | `'start'`    | The preferred alignment of the anchor to render the floating element against when open. This may change when collisions occur. |
| `alignOffset`                  | `number`                                                                                      | `0`          | The distance in pixels from the anchor to the floating element. |
| `arrowPadding`                 | `number`                                                                                      | `0`          | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `avoidCollisions`              | `boolean`                                                                                     | `true`       | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary`            | `Element \| null`                                                                             | `undefined`   | A boundary element or array of elements to check for collisions against. |
| `collisionPadding`             | `number \| Partial<Record<Side, number>>`                                                     | `0`          | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky`                       | `'partial' \| 'always'`                                                                       | `'partial'`  | The sticky behavior on the align axis. `'partial'` keeps content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps it in the boundary regardless. |
| `hideWhenDetached`             | `boolean`                                                                                     | `true`       | When `true`, hides the content when it is detached from the DOM. Useful for hiding the content when the user scrolls away. |
| `updatePositionStrategy`       | `'optimized' \| 'always'`                                                                     | `'optimized'`| The strategy to use when updating the position of the content. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes. |
| `strategy`                     | `'fixed' \| 'absolute'`                                                                       | `'fixed'`    | The positioning strategy for the floating element. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll`                | `boolean`                                                                                     | `true`       | When `true`, prevents the body from scrolling when the content is open. |
| `customAnchor`                 | `string \| HTMLElement \| Measurable \| null`                                                 | `null`       | Use an element other than the trigger to anchor the content to. If provided, the content will be anchored to the provided element instead of the trigger. |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`  | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an escape keydown event occurs. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent if it exists, otherwise ignores. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`  | Callback fired when an outside interaction event (`pointerdown`) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`  | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an interaction occurs outside of the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus`                    | `boolean`                                                                                     | `true`       | Whether or not to trap the focus within the content when open. |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`       | When `true`, prevents the text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                                                              | `'ltr'`      | The reading direction of the app. |
| `forceMount`                   | `boolean`                                                                                     | `false`      | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `loop`                         | `boolean`                                                                                     | `false`      | Whether or not the context menu should loop through items when reaching the end. |
| `ref` (bindable)               | `HTMLDivElement`                                                                              | `null`       | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                     | `Snippet`                                                                                     | `undefined`  | The children content to render. |
| `child`                        | `Snippet<{ wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean }>` | `undefined` | Use render delegation to render your own element. `wrapperProps` are for the positioning wrapper (do not style); `props` are for your content element; `open` is the content visibility state for conditional rendering with Svelte transitions. See Child Snippet docs. |

### ContextMenu.ContentStatic

The content displayed when the context menu is open, without Floating UI positioning. Useful when you want to handle positioning yourself or render inline.

| Property                       | Type                                                                                          | Default      | Description |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------ | ----------- |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`  | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an escape keydown event occurs. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`  | Callback fired when an outside interaction event (`pointerdown`) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`  | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an interaction occurs outside of the floating content. |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus`                    | `boolean`                                                                                     | `true`       | Whether or not to trap the focus within the content when open. |
| `preventScroll`                | `boolean`                                                                                     | `true`       | When `true`, prevents the body from scrolling when the content is open. |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`       | When `true`, prevents the text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                                                              | `'ltr'`      | The reading direction of the app. |
| `forceMount`                   | `boolean`                                                                                     | `false`      | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `loop`                         | `boolean`                                                                                     | `false`      | Whether or not the context menu should loop through items when reaching the end. |
| `ref` (bindable)               | `HTMLDivElement`                                                                              | `null`       | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                     | `Snippet`                                                                                     | `undefined`  | The children content to render. |
| `child`                        | `Snippet<{ props: Record<string, unknown> }>`                                                | `undefined`  | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.Item

A menu item within the context menu.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `disabled`       | `boolean`                                     | `false`     | Whether or not the menu item is disabled. |
| `textValue`      | `string`                                      | `undefined` | The text value of the menu item. Used for typeahead. |
| `onSelect`       | `() => void`                                  | `undefined` | A callback that is fired when the menu item is selected. |
| `closeOnSelect`  | `boolean`                                     | `true`      | Whether or not the menu item should close when selected. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.CheckboxGroup

A group of checkbox menu items, where multiple can be checked at a time.

| Property           | Type                                          | Default     | Description |
| ------------------ | --------------------------------------------- | ----------- | ----------- |
| `value` (bindable) | `string[]`                                    | `[]`        | The value of the group. This is an array of the values of the checked checkboxes within the group. |
| `onValueChange`    | `(value: string[]) => void`                   | `undefined` | A callback that is fired when the checkbox group's value state changes. |
| `ref` (bindable)   | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`         | `Snippet`                                     | `undefined` | The children content to render. |
| `child`            | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.CheckboxItem

A menu item that can be controlled and toggled like a checkbox.

| Property                 | Type                                                                                                  | Default     | Description |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ----------- | ----------- |
| `disabled`               | `boolean`                                                                                             | `false`     | Whether or not the checkbox menu item is disabled. Disabled items cannot be interacted with and are skipped during keyboard navigation. |
| `checked` (bindable)     | `boolean`                                                                                             | `false`     | The checked state of the checkbox. |
| `onCheckedChange`        | `(checked: boolean) => void`                                                                          | `undefined` | A callback that is fired when the checked state changes. |
| `indeterminate` (bindable) | `boolean`                                                                                           | `false`     | The indeterminate state of the checkbox. |
| `onIndeterminateChange`  | `(indeterminate: boolean) => void`                                                                    | `undefined` | A callback that is fired when the indeterminate state changes. |
| `value`                  | `string`                                                                                              | `undefined` | The value of the checkbox item when used in a `CheckboxGroup`. |
| `textValue`              | `string`                                                                                              | `undefined` | The text value of the checkbox menu item. Used for typeahead. |
| `onSelect`               | `() => void`                                                                                          | `undefined` | A callback that is fired when the menu item is selected. |
| `closeOnSelect`          | `boolean`                                                                                             | `true`      | Whether or not the menu item should close when selected. |
| `ref` (bindable)         | `HTMLDivElement`                                                                                      | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`               | `Snippet<{ checked: boolean; indeterminate: boolean }>`                                               | `undefined` | The children content to render. Receives `checked` and `indeterminate` state. |
| `child`                  | `Snippet<{ props: Record<string, unknown>; checked: boolean; indeterminate: boolean }>`               | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.RadioGroup

A group of radio menu items, where only one can be checked at a time.

| Property           | Type                                          | Default     | Description |
| ------------------ | --------------------------------------------- | ----------- | ----------- |
| `value` (bindable) | `string`                                      | `undefined` | The value of the currently checked radio menu item. |
| `onValueChange`    | `(value: string) => void`                     | `undefined` | A callback that is fired when the radio group's value changes. |
| `ref` (bindable)   | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`         | `Snippet`                                     | `undefined` | The children content to render. |
| `child`            | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.RadioItem

A menu item that can be controlled and toggled like a radio button. It must be a child of a `RadioGroup`.

| Property         | Type                                                       | Default     | Description |
| ---------------- | ---------------------------------------------------------- | ----------- | ----------- |
| `value` (required) | `string`                                                 | `undefined` | The value of the radio item. When checked, the parent `RadioGroup`'s value will be set to this value. |
| `disabled`       | `boolean`                                                  | `false`     | Whether or not the radio menu item is disabled. Disabled items cannot be interacted with and are skipped during keyboard navigation. |
| `textValue`      | `string`                                                   | `undefined` | The text value of the radio menu item. Used for typeahead. |
| `onSelect`       | `() => void`                                               | `undefined` | A callback that is fired when the menu item is selected. |
| `closeOnSelect`  | `boolean`                                                  | `true`      | Whether or not the menu item should close when selected. |
| `ref` (bindable) | `HTMLDivElement`                                           | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet<{ checked: boolean }>`                            | `undefined` | The children content to render. Receives `checked` state. |
| `child`          | `Snippet<{ props: Record<string, unknown>; checked: boolean }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.Separator

A horizontal line to visually separate menu items.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.Arrow

An optional arrow which points to the context menu's anchor/trigger point.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `width`          | `number`                                      | `8`         | The width of the arrow in pixels. |
| `height`         | `number`                                      | `8`         | The height of the arrow in pixels. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.Group

A group of menu items. It should be passed an `aria-label` or have a child `ContextMenu.GroupHeading` component to provide a label for the group.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.GroupHeading

A heading for a group which will be skipped when navigating with the keyboard. It provides a visual label for a group of menu items and must be a child of either a `ContextMenu.Group` or `ContextMenu.RadioGroup` component.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.Sub

A submenu belonging to the parent context menu. Responsible for managing the state of the submenu.

| Property               | Type                                  | Default     | Description |
| ---------------------- | ------------------------------------- | ----------- | ----------- |
| `open` (bindable)      | `boolean`                             | `false`     | The open state of the submenu. |
| `onOpenChange`         | `(open: boolean) => void`             | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void`             | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `children`             | `Snippet`                             | `undefined` | The children content to render. |

### ContextMenu.SubTrigger

A menu item which, when pressed or hovered, opens the submenu it is a child of.

| Property         | Type                                          | Default     | Description |
| ---------------- | --------------------------------------------- | ----------- | ----------- |
| `disabled`       | `boolean`                                     | `false`     | Whether or not the submenu trigger is disabled. |
| `openDelay`      | `number`                                      | `0`         | The amount of time in ms from when the mouse enters the subtrigger until the submenu opens. |
| `textValue`      | `string`                                      | `undefined` | The text value of the submenu trigger. Used for typeahead. |
| `onSelect`       | `() => void`                                  | `undefined` | A callback that is fired when the menu item is selected. |
| `ref` (bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`       | `Snippet`                                     | `undefined` | The children content to render. |
| `child`          | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### ContextMenu.SubContent

The floating submenu content displayed when the parent submenu is open. Uses Floating UI for positioning.

| Property                       | Type                                                                                          | Default      | Description |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------ | ----------- |
| `side`                         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                      | `'bottom'`   | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur. |
| `sideOffset`                   | `number`                                                                                      | `0`          | The distance in pixels from the anchor to the floating element. |
| `align`                        | `'start' \| 'center' \| 'end'`                                                                | `'start'`    | The preferred alignment of the anchor to render the floating element against when open. This may change when collisions occur. |
| `alignOffset`                  | `number`                                                                                      | `0`          | The distance in pixels from the anchor to the floating element. |
| `arrowPadding`                 | `number`                                                                                      | `0`          | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `avoidCollisions`              | `boolean`                                                                                     | `true`       | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary`            | `Element \| null`                                                                             | `undefined`   | A boundary element or array of elements to check for collisions against. |
| `collisionPadding`             | `number \| Partial<Record<Side, number>>`                                                     | `0`          | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky`                       | `'partial' \| 'always'`                                                                       | `'partial'`  | The sticky behavior on the align axis. `'partial'` keeps content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps it in the boundary regardless. |
| `hideWhenDetached`             | `boolean`                                                                                     | `true`       | When `true`, hides the content when it is detached from the DOM. |
| `updatePositionStrategy`       | `'optimized' \| 'always'`                                                                     | `'optimized'`| The strategy to use when updating the position of the content. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes. |
| `strategy`                     | `'fixed' \| 'absolute'`                                                                       | `'fixed'`    | The positioning strategy for the floating element. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll`                | `boolean`                                                                                     | `true`       | When `true`, prevents the body from scrolling when the content is open. |
| `customAnchor`                 | `string \| HTMLElement \| Measurable \| null`                                                 | `null`       | Use an element other than the trigger to anchor the content to. |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`  | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an escape keydown event occurs. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent if it exists, otherwise ignores. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`  | Callback fired when an outside interaction event (`pointerdown`) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`  | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an interaction occurs outside of the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus`                    | `boolean`                                                                                     | `true`       | Whether or not to trap the focus within the content when open. |
| `forceMount`                   | `boolean`                                                                                     | `false`      | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`       | When `true`, prevents the text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                                                              | `'ltr'`      | The reading direction of the app. |
| `loop`                         | `boolean`                                                                                     | `false`      | Whether or not to loop through the menu items when navigating with the keyboard. |
| `ref` (bindable)               | `HTMLDivElement`                                                                              | `null`       | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                     | `Snippet`                                                                                     | `undefined`  | The children content to render. |
| `child`                        | `Snippet<{ wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean }>` | `undefined` | Use render delegation to render your own element. `wrapperProps` are for the positioning wrapper (do not style); `props` are for your content element; `open` is the content visibility state. See Child Snippet docs. |

### ContextMenu.SubContentStatic

The submenu content displayed when the parent submenu is open, without Floating UI positioning.

| Property                       | Type                                                                                          | Default      | Description |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------ | ----------- |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`  | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an escape keydown event occurs. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`  | Callback fired when an outside interaction event (`pointerdown`) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`  | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`    | The behavior to use when an interaction occurs outside of the floating content. |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | `undefined`  | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus`                    | `boolean`                                                                                     | `true`       | Whether or not to trap the focus within the content when open. |
| `forceMount`                   | `boolean`                                                                                     | `false`      | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`       | When `true`, prevents the text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                                                              | `'ltr'`      | The reading direction of the app. |
| `loop`                         | `boolean`                                                                                     | `true`       | Whether or not to loop through the menu items when reaching the end of the list when using the keyboard. |
| `ref` (bindable)               | `HTMLDivElement`                                                                              | `null`       | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                     | `Snippet`                                                                                     | `undefined`  | The children content to render. |
| `child`                        | `Snippet<{ open: boolean; props: Record<string, unknown> }>`                                  | `undefined`  | Use render delegation to render your own element. See Child Snippet docs. |

## Data Attributes

### ContextMenu.Trigger

| Data Attribute              | Value                       | Description |
| --------------------------- | --------------------------- | ----------- |
| `data-state`                | `'open' \| 'closed'`        | The open state of the menu or submenu the element controls or belongs to. |
| `data-context-menu-trigger` | `''`                        | Present on the trigger element. |

### ContextMenu.Content

| Data Attribute              | Value                       | Description |
| --------------------------- | --------------------------- | ----------- |
| `data-state`                | `'open' \| 'closed'`        | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style`       | `''`                        | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`         | `''`                        | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-context-menu-content` | `''`                        | Present on the content element. |

### ContextMenu.ContentStatic

| Data Attribute              | Value                       | Description |
| --------------------------- | --------------------------- | ----------- |
| `data-state`                | `'open' \| 'closed'`        | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style`       | `''`                        | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`         | `''`                        | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-context-menu-content` | `''`                        | Present on the content element. |

### ContextMenu.Item

| Data Attribute           | Value      | Description |
| ------------------------ | ---------- | ----------- |
| `data-orientation`       | `vertical` | The orientation of the menu. |
| `data-highlighted`       | `''`       | Present when the menu item is highlighted. |
| `data-disabled`          | `''`       | Present when the menu item is disabled. |
| `data-context-menu-item` | `''`       | Present on the item element. |

### ContextMenu.CheckboxGroup

| Data Attribute                     | Value | Description |
| ---------------------------------- | ----- | ----------- |
| `data-context-menu-checkbox-group` | `''`  | Present on the checkbox group element. |

### ContextMenu.CheckboxItem

| Data Attribute                    | Value                                                | Description |
| --------------------------------- | ---------------------------------------------------- | ----------- |
| `data-orientation`                | `vertical`                                           | The orientation of the menu. |
| `data-highlighted`                | `''`                                                 | Present when the menu item is highlighted. |
| `data-disabled`                   | `''`                                                 | Present when the menu item is disabled. |
| `data-state`                      | `'checked' \| 'unchecked' \| 'indeterminate'`        | The checkbox menu item's checked state. |
| `data-context-menu-checkbox-item` | `''`                                                 | Present on the checkbox item element. |

### ContextMenu.RadioGroup

| Data Attribute                  | Value | Description |
| ------------------------------- | ----- | ----------- |
| `data-context-menu-radio-group` | `''`  | Present on the radio group element. |

### ContextMenu.RadioItem

| Data Attribute                 | Value                       | Description |
| ------------------------------ | --------------------------- | ----------- |
| `data-orientation`             | `vertical`                  | The orientation of the menu. |
| `data-highlighted`             | `''`                        | Present when the menu item is highlighted. |
| `data-disabled`                | `''`                        | Present when the menu item is disabled. |
| `data-state`                   | `'checked' \| 'unchecked'`  | The radio menu item's checked state. |
| `data-value`                   | `''`                        | The value of the radio item. |
| `data-context-menu-radio-item` | `''`                        | Present on the radio item element. |

### ContextMenu.Separator

| Data Attribute                | Value      | Description |
| ----------------------------- | ---------- | ----------- |
| `data-orientation`            | `vertical` | The orientation of the separator. |
| `data-menu-separator`         | `''`       | Present on the separator element. |
| `data-context-menu-separator` | `''`       | Present on the separator element. |

### ContextMenu.Arrow

| Data Attribute            | Value                       | Description |
| ------------------------- | --------------------------- | ----------- |
| `data-state`              | `'open' \| 'closed'`        | The open state of the menu or submenu the element controls or belongs to. |
| `data-context-menu-arrow` | `''`                        | Present on the arrow element. |

### ContextMenu.Group

| Data Attribute            | Value | Description |
| ------------------------- | ----- | ----------- |
| `data-context-menu-group` | `''`  | Present on the group element. |

### ContextMenu.GroupHeading

| Data Attribute            | Value | Description |
| ------------------------- | ----- | ----------- |
| `data-menu-group-heading` | `''`  | Present on the group heading element. |

### ContextMenu.SubTrigger

| Data Attribute                  | Value                       | Description |
| ------------------------------- | --------------------------- | ----------- |
| `data-orientation`              | `vertical`                  | The orientation of the menu. |
| `data-highlighted`              | `''`                        | Present when the menu item is highlighted. |
| `data-disabled`                 | `''`                        | Present when the menu item is disabled. |
| `data-state`                    | `'open' \| 'closed'`        | The open state of the menu or submenu the element controls or belongs to. |
| `data-context-menu-sub-trigger` | `''`                        | Present on the submenu trigger element. |

### ContextMenu.SubContent

| Data Attribute                  | Value                       | Description |
| ------------------------------- | --------------------------- | ----------- |
| `data-state`                    | `'open' \| 'closed'`        | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style`           | `''`                        | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`             | `''`                        | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-context-menu-sub-content` | `''`                        | Present on the submenu content element. |

### ContextMenu.SubContentStatic

| Data Attribute                  | Value                       | Description |
| ------------------------------- | --------------------------- | ----------- |
| `data-state`                    | `'open' \| 'closed'`        | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style`           | `''`                        | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`             | `''`                        | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-context-menu-sub-content` | `''`                        | Present on the submenu content element. |

## CSS Variables

These CSS variables are exposed on `ContextMenu.Content` and can be used for positioning-aware styling and animations.

| CSS Variable                                   | Description |
| ---------------------------------------------- | ----------- |
| `--bits-context-menu-content-transform-origin` | The transform origin of the content element. |
| `--bits-context-menu-content-available-width`  | The available width of the content element. |
| `--bits-context-menu-content-available-height` | The available height of the content element. |
| `--bits-context-menu-anchor-width`             | The width of the anchor element. |
| `--bits-context-menu-anchor-height`            | The height of the anchor element. |

## Examples

### Basic Usage

A minimal context menu with a trigger and a few items:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger class="border-2 border-dashed p-8">
    Right-click me
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content class="w-56 rounded-lg border bg-popover p-1">
      <ContextMenu.Item class="rounded px-2 py-1.5 data-highlighted:bg-accent">
        Edit
      </ContextMenu.Item>
      <ContextMenu.Item class="rounded px-2 py-1.5 data-highlighted:bg-accent">
        Duplicate
      </ContextMenu.Item>
      <ContextMenu.Separator class="my-1 h-px bg-border" />
      <ContextMenu.Item class="rounded px-2 py-1.5 data-highlighted:bg-accent">
        Delete
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

### With Submenus

Use `ContextMenu.Sub`, `ContextMenu.SubTrigger`, and `ContextMenu.SubContent` for nested menus. Each submenu's `SubContent` should be wrapped in its own `ContextMenu.Portal`:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>Right-click me</ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content>
      <ContextMenu.Item>Item 1</ContextMenu.Item>
      <ContextMenu.Item>Item 2</ContextMenu.Item>
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>Open Sub Menu</ContextMenu.SubTrigger>
        <ContextMenu.Portal>
          <ContextMenu.SubContent sideOffset={10}>
            <ContextMenu.Item>Sub Item 1</ContextMenu.Item>
            <ContextMenu.Item>Sub Item 2</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Portal>
      </ContextMenu.Sub>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

Submenus can be nested arbitrarily deep. The `data-[state=open]` attribute on `SubTrigger` lets you style the trigger when its submenu is open.

### With Radio Group

Use `ContextMenu.RadioGroup` and `ContextMenu.RadioItem` for single-select behavior. The `children` snippet receives a `checked` boolean:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
  const values = ["one", "two", "three"];
  let value = $state("one");
</script>

<ContextMenu.RadioGroup bind:value>
  {#each values as value}
    <ContextMenu.RadioItem {value}>
      {#snippet children({ checked })}
        {#if checked}
          ✅
        {/if}
        {value}
      {/snippet}
    </ContextMenu.RadioItem>
  {/each}
</ContextMenu.RadioGroup>
```

### With Checkbox Item

Use `ContextMenu.CheckboxItem` for toggle behavior. The `children` snippet receives `checked` and `indeterminate` booleans:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
  let notifications = $state(true);
</script>

<ContextMenu.CheckboxItem bind:checked={notifications}>
  {#snippet children({ checked, indeterminate })}
    {#if indeterminate}
      -
    {:else if checked}
      ✅
    {/if}
    Notifications
  {/snippet}
</ContextMenu.CheckboxItem>
```

### With Checkbox Group

Use `ContextMenu.CheckboxGroup` around a set of `CheckboxItem` components for multi-select behavior. Each `CheckboxItem` needs a `value` prop:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
  let colors = $state<string[]>([]);
</script>

<ContextMenu.CheckboxGroup bind:value={colors}>
  <ContextMenu.GroupHeading>Favorite color</ContextMenu.GroupHeading>
  <ContextMenu.CheckboxItem value="red">
    {#snippet children({ checked })}
      {#if checked}
        ✅
      {/if}
      Red
    {/snippet}
  </ContextMenu.CheckboxItem>
  <ContextMenu.CheckboxItem value="blue">
    {#snippet children({ checked })}
      {#if checked}
        ✅
      {/if}
      Blue
    {/snippet}
  </ContextMenu.CheckboxItem>
  <ContextMenu.CheckboxItem value="green">
    {#snippet children({ checked })}
      {#if checked}
        ✅
      {/if}
      Green
    {/snippet}
  </ContextMenu.CheckboxItem>
</ContextMenu.CheckboxGroup>
```

The `value` state does not persist between menu open/close cycles. To persist it, store it in a `$state` variable and pass it to the `value` prop.

### With `child` Snippet (Render Delegation)

Use the `child` snippet for full control over the rendered element. The snippet receives `props` to spread onto your element:

```svelte
<ContextMenu.Item>
  {#snippet child({ props })}
    <button {...props} class="my-custom-item">
      Custom Item
    </button>
  {/snippet}
</ContextMenu.Item>
```

For `CheckboxItem` and `RadioItem`, the `child` snippet also receives `checked` (and `indeterminate` for checkboxes):

```svelte
<ContextMenu.RadioItem value="a">
  {#snippet child({ props, checked })}
    <div {...props} class="my-radio-item">
      {checked ? "●" : "○"} Option A
    </div>
  {/snippet}
</ContextMenu.RadioItem>
```

### With Svelte Transitions

Combine `forceMount` with the `child` snippet to apply Svelte transitions. The `child` snippet for floating content receives `wrapperProps` (for the positioning wrapper — do not style), `props` (for your content element), and `open` (content visibility state):

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<ContextMenu.Content forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:fly={{ duration: 300 }}>
          <ContextMenu.Item>Item 1</ContextMenu.Item>
          <ContextMenu.Item>Item 2</ContextMenu.Item>
        </div>
      </div>
    {/if}
  {/snippet}
</ContextMenu.Content>
```

The `wrapperProps` element is the positioning wrapper managed by Floating UI — do not apply your own styles to it. Apply all custom styles and transitions to the inner element that receives `props`.

### Managing Open State

#### Two-Way Binding

Use `bind:open` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Context Menu</button>
<ContextMenu.Root bind:open={isOpen}>
  <!-- ... -->
</ContextMenu.Root>
```

#### Fully Controlled (Function Binding)

Use a [Svelte Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over reads and writes:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<ContextMenu.Root bind:open={getOpen, setOpen}>
  <!-- ... -->
</ContextMenu.Root>
```

### Reusable Wrapper Component

For use across multiple places, create a reusable component that wraps the context menu primitives:

```svelte
<!-- CustomContextMenu.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { ContextMenu, type WithoutChild } from "bits-ui";

  type Props = ContextMenu.Props & {
    trigger: Snippet;
    items: string[];
    contentProps?: WithoutChild<ContextMenu.Content.Props>;
  };

  let {
    open = $bindable(false),
    children,
    trigger,
    items,
    contentProps,
    ...restProps
  }: Props = $props();
</script>

<ContextMenu.Root bind:open {...restProps}>
  <ContextMenu.Trigger>
    {@render trigger()}
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content {...contentProps}>
      <ContextMenu.Group>
        <ContextMenu.GroupHeading>Select an Office</ContextMenu.GroupHeading>
        {#each items as item}
          <ContextMenu.Item textValue={item}>
            {item}
          </ContextMenu.Item>
        {/each}
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

Usage with a snippet prop:

```svelte
<script lang="ts">
  import CustomContextMenu from "./CustomContextMenu.svelte";
</script>

{#snippet triggerArea()}
  <div class="grid size-20 place-items-center rounded-lg border border-dashed p-4">
    Right-click me
  </div>
{/snippet}

<CustomContextMenu
  items={[
    "Dunder Mifflin",
    "Vance Refrigeration",
    "Michael Scott Paper Company",
  ]}
  {triggerArea}
/>
```

### Complex Nested Menus

Submenus can be nested to arbitrary depth, combining radio groups, checkbox groups, and plain items. This example mirrors a project-tracker filter menu:

```svelte
<script lang="ts">
  import { ContextMenu } from "bits-ui";
  import CaretRight from "phosphor-svelte/lib/CaretRight";
  import Check from "phosphor-svelte/lib/Check";

  let selectedStatus = $state("in-progress");
  let selectedPriority = $state("p2");

  const statusItems = [
    { value: "icebox", label: "Icebox" },
    { value: "backlog", label: "Backlog" },
    { value: "todo", label: "Todo" },
    { value: "in-progress", label: "In progress" },
    { value: "done", label: "Done" },
  ] as const;

  const priorityItems = [
    { value: "p0", label: "P0 - Critical" },
    { value: "p1", label: "P1 - High" },
    { value: "p2", label: "P2 - Medium" },
    { value: "p3", label: "P3 - Low" },
  ] as const;

  const itemClass =
    "flex h-10 select-none items-center py-3 pl-3 pr-1.5 text-sm";
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger class="border-2 border-dashed p-8">
    Right-click this issue card
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content class="w-[250px] rounded-xl border p-1">
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger class={itemClass}>
          Status
          <CaretRight class="ml-auto size-4" />
        </ContextMenu.SubTrigger>
        <ContextMenu.Portal>
          <ContextMenu.SubContent class="w-[230px] rounded-xl border p-1" sideOffset={10}>
            <ContextMenu.RadioGroup bind:value={selectedStatus}>
              {#each statusItems as item (item.value)}
                <ContextMenu.RadioItem value={item.value} class={itemClass}>
                  {#snippet children({ checked })}
                    {item.label}
                    {#if checked}
                      <Check class="ml-auto size-4" />
                    {/if}
                  {/snippet}
                </ContextMenu.RadioItem>
              {/each}
            </ContextMenu.RadioGroup>
          </ContextMenu.SubContent>
        </ContextMenu.Portal>
      </ContextMenu.Sub>

      <ContextMenu.Sub>
        <ContextMenu.SubTrigger class={itemClass}>
          Issue properties
          <CaretRight class="ml-auto size-4" />
        </ContextMenu.SubTrigger>
        <ContextMenu.Portal>
          <ContextMenu.SubContent class="w-[230px] rounded-xl border p-1" sideOffset={10}>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger class={itemClass}>
                Priority
                <CaretRight class="ml-auto size-4" />
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent class="w-[230px] rounded-xl border p-1" sideOffset={10}>
                  <ContextMenu.RadioGroup bind:value={selectedPriority}>
                    {#each priorityItems as item (item.value)}
                      <ContextMenu.RadioItem value={item.value} class={itemClass}>
                        {item.label}
                      </ContextMenu.RadioItem>
                    {/each}
                  </ContextMenu.RadioGroup>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          </ContextMenu.SubContent>
        </ContextMenu.Portal>
      </ContextMenu.Sub>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

## Accessibility

The Context Menu follows the [WAI-ARIA Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

### Keyboard Navigation

| Key                       | Behavior |
| ------------------------- | -------- |
| `Right-click`             | Opens the menu at the cursor position. |
| `Enter` / `Space`         | When a menu item is focused, selects it (and closes the menu if `closeOnSelect` is `true`). |
| `ArrowDown`               | Moves focus to the next menu item. If `loop` is enabled, wraps from last to first. |
| `ArrowUp`                 | Moves focus to the previous menu item. If `loop` is enabled, wraps from first to last. |
| `ArrowRight`              | When a `SubTrigger` is focused, opens the submenu and focuses its first item. |
| `ArrowLeft`               | When inside a submenu, closes the submenu and returns focus to the parent `SubTrigger`. |
| `Home`                    | Moves focus to the first menu item. |
| `End`                     | Moves focus to the last menu item. |
| `Escape`                  | Closes the menu (or the current submenu if one is open). Behavior is controlled by `escapeKeydownBehavior`. |
| `Tab`                     | Not used for menu navigation; focus is trapped within the menu while open. |
| Typeahead (printable chars) | Moves focus to the next item whose `textValue` starts with the typed character(s). |

### ARIA Patterns

- `ContextMenu.Trigger` has `aria-haspopup="menu"` and `aria-expanded` reflecting open/closed state.
- `ContextMenu.Content` has `role="menu"`.
- `ContextMenu.Item` has `role="menuitem"`.
- `ContextMenu.CheckboxItem` has `role="menuitemcheckbox"` with `aria-checked` reflecting the checked state.
- `ContextMenu.RadioItem` has `role="menuitemradio"` with `aria-checked` reflecting the checked state.
- `ContextMenu.RadioGroup` has `role="group"` with `aria-activedescendant` tracking the checked item.
- `ContextMenu.SubTrigger` has `aria-haspopup="menu"` and `aria-expanded` reflecting the submenu's open state.
- `ContextMenu.SubContent` has `role="menu"`.
- `ContextMenu.Separator` has `role="separator"`.
- `ContextMenu.GroupHeading` is skipped during keyboard navigation and provides a visual label.
- `disabled` items set `aria-disabled` and are skipped during keyboard navigation.
- Focus is trapped within the content while open (`trapFocus` defaults to `true`).
- `data-state` (`'open'` / `'closed'`) on trigger, content, and arrow elements mirrors the open state for CSS targeting.
- `data-highlighted` on items reflects the current keyboard/mouse focus target.
- `data-state` on `CheckboxItem` (`'checked'` / `'unchecked'` / `'indeterminate'`) and `RadioItem` (`'checked'` / `'unchecked'`) mirrors the ARIA checked state for CSS targeting.

## Tips

- **Always wrap `Content` in a `Portal`.** The floating content must be portaled to `document.body` (or a custom target) so it escapes any parent `overflow: hidden` or stacking-context constraints. The same applies to `SubContent` — give each its own `ContextMenu.Portal`.

- **Floating content wrapper rules with `child` snippet.** When using the `child` snippet on floating content (`Content` / `SubContent`), the snippet receives `wrapperProps`, `props`, and `open`. The `wrapperProps` go on the outer positioning wrapper element managed by Floating UI — never apply your own styles to it. The `props` go on your inner content element where you apply all custom styles and transitions. Guard rendering with `{#if open}` when using Svelte transitions.

- **Use `ContentStatic` / `SubContentStatic` to skip Floating UI.** If you don't need floating positioning (e.g., rendering inline or handling position yourself), use the `*Static` variants. They omit all the `side`, `align`, `collision*`, and `strategy` props but retain the dismissible-layer and focus-trap behavior.

- **Set `textValue` for typeahead.** The menu supports typeahead navigation — typing characters moves focus to the next item whose text starts with those characters. If your item's text content is not a plain string (e.g., it contains icons or nested elements), set `textValue` explicitly so typeahead works correctly.

- **`closeOnSelect` controls menu dismissal.** By default, selecting any item closes the entire menu. Set `closeOnSelect={false}` on an item to keep the menu open after selection — useful for items that toggle state without dismissing the menu (e.g., checkbox-like behavior without using `CheckboxItem`).

- **Checkbox group value does not persist across open/close cycles.** The `value` state of a `CheckboxGroup` resets when the menu closes. To persist selections, store the value in a `$state` variable outside the menu and bind to it.

- **`openDelay` on `SubTrigger`.** By default, submenus open immediately on hover (`openDelay={0}`). Increase this value to add a delay, which can prevent accidental submenu opens when users are moving the mouse to a nearby item.

- **Disabling items.** Set `disabled={true}` on `Item`, `CheckboxItem`, `RadioItem`, or `SubTrigger` to make them non-interactive. Disabled items are skipped during keyboard navigation and receive the `data-disabled` attribute.

- **Animating with CSS.** Target `data-[state=open]` and `data-[state=closed]` on `Content` / `SubContent` to drive CSS animations. Use `data-starting-style` (present on the initial open frame) and `data-ending-style` (present while closing before unmount) for enter/exit keyframes. The `--bits-context-menu-content-transform-origin` variable helps align transform animations with the floating position.

- **Animating with Svelte transitions.** Set `forceMount` on `Content` / `SubContent` and use the `child` snippet. Guard the rendered content with `{#if open}` (using the snippet's `open` argument) and apply `transition:` directives to the inner element (the one receiving `props`). Without `forceMount`, the content unmounts immediately on close and transitions won't play.

- **`customAnchor` for custom positioning.** If you want the content to anchor to an element other than the trigger, pass a selector string, `HTMLElement`, or `Measurable` to `customAnchor`. This is useful when the trigger is large and you want the menu to appear near a specific child element.

- **RTL support.** Set `dir="rtl"` on `ContextMenu.Root` (or `Content`) for right-to-left layouts. Arrow-key navigation and submenu positioning adjust automatically.

- **Reusable wrapper for transitions.** If you use transitions across many context menus, wrap `ContextMenu.Content` in a reusable component that bundles `forceMount` + the `child` snippet logic. This keeps call sites clean and avoids repeating the `wrapperProps` / `props` / `open` boilerplate.
