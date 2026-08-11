# Dropdown Menu

Displays a menu of items that users can select from when triggered. The Dropdown Menu is a non-modal menu component for presenting actions, navigation, or selection options in a compact, floating panel anchored to a trigger element.

## Overview

The Dropdown Menu renders a floating menu of actions or options that opens from a trigger button and closes when the user selects an item, presses Escape, or clicks outside. It is built on the WAI-ARIA `menu` pattern and supports submenus, checkbox items, radio groups, checkbox groups, keyboard navigation, and typeahead.

Use a Dropdown Menu when:

- You need to present a list of actions or options tied to a trigger element (e.g., a "more" button, a user avatar).
- You want keyboard-navigable, accessible menu behavior with roving focus and typeahead.
- You need nested submenus or grouped sections with headings.

Use a `Select` or `Combobox` instead when the primary goal is choosing a single value from a list to fill a form field. Use a `Context Menu` when the menu should appear on right-click rather than from a trigger button.

### Key Features

- **Compound Component Structure**: Build flexible menus with sub-components for items, groups, separators, and submenus.
- **Accessibility**: WAI-ARIA `menu` pattern with full keyboard navigation, roving focus, and typeahead.
- **Portal Support**: Render content outside the normal DOM hierarchy for proper stacking.
- **Floating UI**: Content is positioned with Floating UI, with collision detection and configurable placement.
- **Submenus**: Nest menus within menus for complex hierarchies.
- **Checkbox & Radio Items**: Built-in `menuitemcheckbox` and `menuitemradio` semantics with controlled state.
- **Checkbox & Radio Groups**: Group checkbox or radio items with shared state that can be bound.
- **Svelte Transitions**: Support for `forceMount` and the `child` snippet to use Svelte transitions or animation libraries.

## Component Structure

The Dropdown Menu is built from sub-components, each with a specific purpose:

| Part | Description |
| --- | --- |
| **Root** | Manages state and provides context to child components. |
| **Trigger** | The button that toggles the menu's open/closed state. |
| **Portal** | Renders menu content in a portal, outside the normal DOM hierarchy. |
| **Content** | The floating menu panel displayed when open. |
| **ContentStatic** | A variant of Content without Floating UI positioning (static layout). |
| **Item** | A standard selectable menu item (`menuitem`). |
| **CheckboxItem** | A menu item that toggles like a checkbox (`menuitemcheckbox`). |
| **CheckboxGroup** | Groups multiple `CheckboxItem`s with a shared array value. |
| **RadioGroup** | Groups `RadioItem`s so only one can be selected at a time. |
| **RadioItem** | A menu item that behaves like a radio button (`menuitemradio`). Must be a child of `RadioGroup`. |
| **Group** | A semantic group of menu items. Requires an `aria-label` or a child `GroupHeading`. |
| **GroupHeading** | A label/heading for a group. Must be a child of `Group` or `RadioGroup`. |
| **Sub** | Manages the open state of a submenu. |
| **SubTrigger** | A menu item that opens the submenu it belongs to on press or hover. |
| **SubContent** | The floating content panel for a submenu. |
| **SubContentStatic** | A variant of SubContent without Floating UI positioning. |
| **Separator** | A horizontal line to visually separate menu items. |
| **Arrow** | An optional arrow that points to the menu's anchor/trigger. |

## API Reference

### DropdownMenu.Root

The root component which manages and scopes the state of the dropdown menu.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `open` `$bindable` | `boolean` | `false` | The open state of the menu. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void` | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### DropdownMenu.Trigger

The button element which toggles the dropdown menu.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Whether or not the menu trigger is disabled. |
| `ref` `$bindable` | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.Portal

A component that portals the content of the dropdown menu to the body or a custom target (if provided).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `to` | `Element \| string` | `document.body` | Where to render the content when it is open. Defaults to the body. |
| `disabled` | `boolean` | `false` | Whether the portal is disabled. When disabled, the content renders in its original DOM location. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### DropdownMenu.Content

The content displayed when the dropdown menu is open. Positioned with Floating UI relative to the trigger (or a custom anchor).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | The preferred side of the anchor to render the floating element against when open. Reversed when collisions occur. |
| `sideOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | The preferred alignment of the anchor to render the floating element against when open. May change when collisions occur. |
| `alignOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element along the align axis. |
| `arrowPadding` | `number` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `avoidCollisions` | `boolean` | `true` | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary` | `Element \| null` | `undefined` | A boundary element or array of elements to check for collisions against. |
| `collisionPadding` | `number \| Partial<Record<Side, number>>` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky` | `'partial' \| 'always'` | `'partial'` | The sticky behavior on the align axis. `'partial'` keeps the content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps it in the boundary regardless. |
| `hideWhenDetached` | `boolean` | `true` | When `true`, hides the content when it is detached from the DOM. Useful for hiding content when the user scrolls away. |
| `updatePositionStrategy` | `'optimized' \| 'always'` | `'optimized'` | The strategy for updating position. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes. |
| `strategy` | `'fixed' \| 'absolute'` | `'fixed'` | The positioning strategy. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll` | `boolean` | `true` | When `true`, prevents the body from scrolling when the content is open. |
| `customAnchor` | `string \| HTMLElement \| Measurable \| null` | `null` | Use an element other than the trigger to anchor the content to. If provided, the content anchors to this element instead of the trigger. |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to a parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to a parent element if it exists, otherwise ignores. |
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event (a `pointerdown` event) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap focus within the content when open. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `loop` | `boolean` | `false` | Whether or not to loop through the menu items when navigating with the keyboard. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean }` | `undefined` | Use render delegation to render your own element. `wrapperProps` are for the positioning wrapper (do not style this element); `props` are for your content element (apply custom styles here); `open` is the content visibility state, useful for conditional rendering with Svelte transitions. See [Child Snippet](/docs/child-snippet) docs. |

### DropdownMenu.ContentStatic

The content displayed when the dropdown menu is open, without Floating UI positioning. Use this when you want a statically-laid-out menu (no floating positioning logic).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to a parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to a parent element if it exists, otherwise ignores. |
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event (a `pointerdown` event) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap focus within the content when open. |
| `preventScroll` | `boolean` | `true` | When `true`, prevents the body from scrolling when the content is open. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `loop` | `boolean` | `false` | Whether or not to loop through the menu items when navigating with the keyboard. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { open: boolean; props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.Item

A menu item within the dropdown menu.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Whether or not the menu item is disabled. |
| `textValue` | `string` | `undefined` | The text value of the menu item. Used for typeahead. |
| `onSelect` | `() => void` | `undefined` | A callback that is fired when the menu item is selected. |
| `closeOnSelect` | `boolean` | `true` | Whether or not the menu item should close when selected. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.CheckboxGroup

A group of checkbox menu items, where multiple can be checked at a time. The `value` is an array of the checked items' values.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `value` `$bindable` | `string[]` | `[]` | The value of the group. An array of the values of the checked checkboxes within the group. |
| `onValueChange` | `(value: string[]) => void` | `undefined` | A callback that is fired when the checkbox group's value state changes. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.CheckboxItem

A menu item that can be controlled and toggled like a checkbox. When used inside a `CheckboxGroup`, set the `value` prop so the group can track it.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Whether or not the checkbox menu item is disabled. Disabled items cannot be interacted with and are skipped during keyboard navigation. |
| `checked` `$bindable` | `boolean` | `false` | The checked state of the checkbox. |
| `onCheckedChange` | `(checked: boolean) => void` | `undefined` | A callback that is fired when the checked state changes. |
| `indeterminate` `$bindable` | `boolean` | `false` | The indeterminate state of the checkbox. |
| `onIndeterminateChange` | `(indeterminate: boolean) => void` | `undefined` | A callback that is fired when the indeterminate state changes. |
| `value` | `string` | `undefined` | The value of the checkbox item when used in a `CheckboxGroup`. |
| `textValue` | `string` | `undefined` | The text value of the checkbox menu item. Used for typeahead. |
| `onSelect` | `() => void` | `undefined` | A callback that is fired when the menu item is selected. |
| `closeOnSelect` | `boolean` | `true` | Whether or not the menu item should close when selected. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` — `ChildrenSnippetProps = { checked: boolean; indeterminate: boolean }` | `undefined` | The children content to render. Receives `checked` and `indeterminate` state. |
| `child` | `Snippet` — `ChildSnippetProps = { props: Record<string, unknown>; checked: boolean; indeterminate: boolean }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.RadioGroup

A group of radio menu items, where only one can be checked at a time.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `value` `$bindable` | `string` | `undefined` | The value of the currently checked radio menu item. |
| `onValueChange` | `(value: string) => void` | `undefined` | A callback that is fired when the radio group's value changes. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.RadioItem

A menu item that can be controlled and toggled like a radio button. It must be a child of a `RadioGroup`.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (required) | `string` | `undefined` | The value of the radio item. When checked, the parent `RadioGroup`'s value will be set to this value. |
| `disabled` | `boolean` | `false` | Whether or not the radio menu item is disabled. Disabled items cannot be interacted with and are skipped during keyboard navigation. |
| `textValue` | `string` | `undefined` | The text value of the radio menu item. Used for typeahead. |
| `onSelect` | `() => void` | `undefined` | A callback that is fired when the menu item is selected. |
| `closeOnSelect` | `boolean` | `true` | Whether or not the menu item should close when selected. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` — `ChildrenSnippetProps = { checked: boolean }` | `undefined` | The children content to render. Receives `checked` state. |
| `child` | `Snippet` — `ChildSnippetProps = { props: Record<string, unknown>; checked: boolean }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.Separator

A horizontal line to visually separate menu items.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.Arrow

An optional arrow which points to the dropdown menu's anchor/trigger point.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | `8` | The width of the arrow in pixels. |
| `height` | `number` | `8` | The height of the arrow in pixels. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.Group

A group of menu items. It should be passed an `aria-label` or have a child `DropdownMenu.GroupHeading` component to provide a label for the group.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.GroupHeading

A heading for a group which is skipped when navigating with the keyboard. It provides a description for a group of menu items and must be a child of either a `DropdownMenu.Group` or `DropdownMenu.RadioGroup` component. If used on its own, an error is thrown during development.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.Sub

A submenu belonging to the parent dropdown menu. Responsible for managing the state of the submenu.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `open` `$bindable` | `boolean` | `false` | The open state of the submenu. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void` | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### DropdownMenu.SubTrigger

A menu item which when pressed or hovered, opens the submenu it is a child of.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Whether or not the submenu trigger is disabled. |
| `openDelay` | `number` | `0` | The amount of time in ms from when the mouse enters the subtrigger until the submenu opens. |
| `textValue` | `string` | `undefined` | The text value of the submenu trigger. Used for typeahead. |
| `onSelect` | `() => void` | `undefined` | A callback that is fired when the menu item is selected. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### DropdownMenu.SubContent

The submenu content displayed when the parent submenu is open. Positioned with Floating UI relative to the `SubTrigger`.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | The preferred side of the anchor to render the floating element against when open. Reversed when collisions occur. |
| `sideOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | The preferred alignment of the anchor to render the floating element against when open. May change when collisions occur. |
| `alignOffset` | `number` | `0` | The distance in pixels from the anchor to the floating element along the align axis. |
| `arrowPadding` | `number` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `avoidCollisions` | `boolean` | `true` | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary` | `Element \| null` | `undefined` | A boundary element or array of elements to check for collisions against. |
| `collisionPadding` | `number \| Partial<Record<Side, number>>` | `0` | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky` | `'partial' \| 'always'` | `'partial'` | The sticky behavior on the align axis. `'partial'` keeps the content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps it in the boundary regardless. |
| `hideWhenDetached` | `boolean` | `true` | When `true`, hides the content when it is detached from the DOM. Useful for hiding content when the user scrolls away. |
| `updatePositionStrategy` | `'optimized' \| 'always'` | `'optimized'` | The strategy for updating position. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes. |
| `strategy` | `'fixed' \| 'absolute'` | `'fixed'` | The positioning strategy. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll` | `boolean` | `true` | When `true`, prevents the body from scrolling when the content is open. |
| `customAnchor` | `string \| HTMLElement \| Measurable \| null` | `null` | Use an element other than the trigger to anchor the content to. If provided, the content anchors to this element instead of the trigger. |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to a parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to a parent element if it exists, otherwise ignores. |
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event (a `pointerdown` event) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap focus within the content when open. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `loop` | `boolean` | `false` | Whether or not to loop through the menu items when navigating with the keyboard. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean }` | `undefined` | Use render delegation to render your own element. `wrapperProps` are for the positioning wrapper (do not style); `props` are for your content element; `open` is the content visibility state. See [Child Snippet](/docs/child-snippet) docs. |

### DropdownMenu.SubContentStatic

The submenu content displayed when the parent submenu is open, without Floating UI positioning.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to a parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to a parent element if it exists, otherwise ignores. |
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event (a `pointerdown` event) occurs. Call `event.preventDefault()` to prevent the default behavior. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap focus within the content when open. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | The reading direction of the app. |
| `loop` | `boolean` | `true` | Whether or not to loop through the menu items when reaching the end of the list when using the keyboard. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { open: boolean; props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

## Data Attributes

Data attributes are available on specific elements to enable state-based styling via CSS attribute selectors.

### DropdownMenu.Trigger

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The open state of the menu or submenu the element controls or belongs to. |
| `data-dropdown-menu-trigger` | `''` | Present on the trigger element. |

### DropdownMenu.Content

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-dropdown-menu-content` | `''` | Present on the content element. |

### DropdownMenu.ContentStatic

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-dropdown-menu-content` | `''` | Present on the content element. |

### DropdownMenu.Item

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `vertical` | The orientation of the menu. |
| `data-highlighted` | `''` | Present when the menu item is highlighted. |
| `data-disabled` | `''` | Present when the menu item is disabled. |
| `data-dropdown-menu-item` | `''` | Present on the item element. |

### DropdownMenu.CheckboxGroup

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dropdown-menu-checkbox-group` | `''` | Present on the checkbox group element. |

### DropdownMenu.CheckboxItem

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `vertical` | The orientation of the menu. |
| `data-highlighted` | `''` | Present when the menu item is highlighted. |
| `data-disabled` | `''` | Present when the menu item is disabled. |
| `data-state` | `'checked' \| 'unchecked' \| 'indeterminate'` | The checkbox menu item's checked state. |
| `data-dropdown-menu-checkbox-item` | `''` | Present on the checkbox item element. |

### DropdownMenu.RadioGroup

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dropdown-menu-radio-group` | `''` | Present on the radio group element. |

### DropdownMenu.RadioItem

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `vertical` | The orientation of the menu. |
| `data-highlighted` | `''` | Present when the menu item is highlighted. |
| `data-disabled` | `''` | Present when the menu item is disabled. |
| `data-state` | `'checked' \| 'unchecked'` | The radio menu item's checked state. |
| `data-value` | `''` | The value of the radio item. |
| `data-dropdown-menu-radio-item` | `''` | Present on the radio item element. |

### DropdownMenu.Separator

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `vertical` | The orientation of the separator. |
| `data-menu-separator` | `''` | Present on the separator element. |
| `data-dropdown-menu-separator` | `''` | Present on the separator element. |

### DropdownMenu.Arrow

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The open state of the menu or submenu the element controls or belongs to. |
| `data-dropdown-menu-arrow` | `''` | Present on the arrow element. |

### DropdownMenu.Group

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dropdown-menu-group` | `''` | Present on the group element. |

### DropdownMenu.GroupHeading

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dropdown-menu-group-heading` | `''` | Present on the group heading element. |

### DropdownMenu.SubTrigger

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-orientation` | `vertical` | The orientation of the menu. |
| `data-highlighted` | `''` | Present when the menu item is highlighted. |
| `data-disabled` | `''` | Present when the menu item is disabled. |
| `data-state` | `'open' \| 'closed'` | The open state of the menu or submenu the element controls or belongs to. |
| `data-dropdown-menu-sub-trigger` | `''` | Present on the submenu trigger element. |

### DropdownMenu.SubContent

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-dropdown-menu-sub-content` | `''` | Present on the submenu content element. |

### DropdownMenu.SubContentStatic

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The open state of the menu or submenu the element controls or belongs to. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-dropdown-menu-sub-content` | `''` | Present on the submenu content element. |

## CSS Variables

These CSS custom properties are exposed on `DropdownMenu.Content` for use in custom styling, particularly for animations and responsive sizing relative to the anchor.

| CSS Variable | Description |
| --- | --- |
| `--bits-dropdown-menu-content-transform-origin` | The transform origin of the content element. Useful for animating the content from its placement direction. |
| `--bits-dropdown-menu-content-available-width` | The available width of the content element (constrained by the viewport/collision boundary). |
| `--bits-dropdown-menu-content-available-height` | The available height of the content element (constrained by the viewport/collision boundary). |
| `--bits-dropdown-menu-anchor-width` | The width of the anchor (trigger) element. |
| `--bits-dropdown-menu-anchor-height` | The height of the anchor (trigger) element. |

Example usage:

```svelte
<DropdownMenu.Content
  style="transform-origin: var(--bits-dropdown-menu-content-transform-origin);"
>
  <!-- menu items -->
</DropdownMenu.Content>
```

Match the content width to the trigger width:

```svelte
<DropdownMenu.Content
  style="min-width: var(--bits-dropdown-menu-anchor-width);"
>
  <!-- menu items -->
</DropdownMenu.Content>
```

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Open Menu</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="w-56 rounded-md border bg-background p-1 shadow-md">
      <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent">
        Profile
      </DropdownMenu.Item>
      <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent">
        Settings
      </DropdownMenu.Item>
      <DropdownMenu.Separator class="my-1 h-px bg-muted" />
      <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent">
        Logout
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Groups and Headings

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>File</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="w-56 rounded-md border bg-background p-1 shadow-md">
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          File
        </DropdownMenu.GroupHeading>
        <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
          New
        </DropdownMenu.Item>
        <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
          Open
        </DropdownMenu.Item>
        <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
          Save
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator class="my-1 h-px bg-muted" />
      <DropdownMenu.Group aria-label="export">
        <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
          Export as PDF
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Submenus

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Open Menu</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="w-56 rounded-md border bg-background p-1 shadow-md">
      <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
        Item 1
      </DropdownMenu.Item>
      <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
        Item 2
      </DropdownMenu.Item>
      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent data-[state=open]:bg-accent">
          Open Sub Menu
        </DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent class="w-48 rounded-md border bg-background p-1 shadow-md">
            <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
              Sub Item 1
            </DropdownMenu.Item>
            <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
              Sub Item 2
            </DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Checkbox Items

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";

  let notifications = $state(true);
  let showStatus = $state(false);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="w-56 rounded-md border bg-background p-1 shadow-md">
      <DropdownMenu.CheckboxItem
        bind:checked={notifications}
        class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent"
      >
        {#snippet children({ checked, indeterminate })}
          {#if indeterminate}
            <span class="mr-2">–</span>
          {:else if checked}
            <span class="mr-2">✅</span>
          {:else}
            <span class="mr-2">⬜</span>
          {/if}
          Notifications
        {/snippet}
      </DropdownMenu.CheckboxItem>
      <DropdownMenu.CheckboxItem
        bind:checked={showStatus}
        class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent"
      >
        {#snippet children({ checked })}
          {#if checked}
            <span class="mr-2">✅</span>
          {:else}
            <span class="mr-2">⬜</span>
          {/if}
          Show status
        {/snippet}
      </DropdownMenu.CheckboxItem>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Checkbox Group

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";

  let colors = $state<string[]>([]);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Filter</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="w-56 rounded-md border bg-background p-1 shadow-md">
      <DropdownMenu.CheckboxGroup bind:value={colors}>
        <DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Favorite color
        </DropdownMenu.GroupHeading>
        <DropdownMenu.CheckboxItem
          value="red"
          class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent"
        >
          {#snippet children({ checked })}
            {#if checked}<span class="mr-2">✅</span>{/if}
            Red
          {/snippet}
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem
          value="blue"
          class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent"
        >
          {#snippet children({ checked })}
            {#if checked}<span class="mr-2">✅</span>{/if}
            Blue
          {/snippet}
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem
          value="green"
          class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent"
        >
          {#snippet children({ checked })}
            {#if checked}<span class="mr-2">✅</span>{/if}
            Green
          {/snippet}
        </DropdownMenu.CheckboxItem>
      </DropdownMenu.CheckboxGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Radio Items

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";

  const values = ["one", "two", "three"];
  let value = $state("one");
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Favorite number</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="w-56 rounded-md border bg-background p-1 shadow-md">
      <DropdownMenu.RadioGroup bind:value>
        <DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Favorite number
        </DropdownMenu.GroupHeading>
        {#each values as value}
          <DropdownMenu.RadioItem
            {value}
            class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent"
          >
            {#snippet children({ checked })}
              {#if checked}<span class="mr-2">✅</span>{/if}
              {value}
            {/snippet}
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Arrow

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Open Menu</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="w-56 rounded-md border bg-background p-1 shadow-md" sideOffset={8}>
      <DropdownMenu.Arrow class="fill-border" />
      <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
        Profile
      </DropdownMenu.Item>
      <DropdownMenu.Item class="rounded-sm px-2 py-1.5 text-sm data-highlighted:bg-accent">
        Settings
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet to render your own element while preserving the component's behavior. This is useful when you need a different tag or want to spread props onto a custom element.

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <a {...props} href="/menu">Open Menu</a>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Item 1</DropdownMenu.Item>
      <DropdownMenu.Item>Item 2</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### With Svelte Transitions

To use Svelte transitions, set `forceMount` on the `Content`, then apply transitions conditionally based on the `open` state exposed via the `child` snippet. The `child` snippet provides `wrapperProps` (for the positioning wrapper — do not style this element), `props` (for your content element — apply styles here), and `open` (the content visibility state).

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Open Menu</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content forceMount>
      {#snippet child({ wrapperProps, props, open })}
        {#if open}
          <div {...wrapperProps}>
            <div {...props} transition:fly={{ duration: 200 }}>
              <DropdownMenu.Item>Item 1</DropdownMenu.Item>
              <DropdownMenu.Item>Item 2</DropdownMenu.Item>
            </div>
          </div>
        {/if}
      {/snippet}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

### Custom Anchor

By default, the `Content` is anchored to the `Trigger`. Pass a selector string or an `HTMLElement` to `customAnchor` to anchor the content to a different element.

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";

  let customAnchor = $state<HTMLElement>(null!);
</script>

<div bind:this={customAnchor} class="anchor-element"></div>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Open Menu</DropdownMenu.Trigger>
  <DropdownMenu.Content {customAnchor}>
    <DropdownMenu.Item>Item 1</DropdownMenu.Item>
    <DropdownMenu.Item>Item 2</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Controlled Open State

#### Two-Way Binding

Use `bind:open` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";

  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Menu</button>

<DropdownMenu.Root bind:open={isOpen}>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Item 1</DropdownMenu.Item>
      <DropdownMenu.Item>Item 2</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

#### Fully Controlled (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for total control over get/set behavior:

```svelte
<script lang="ts">
  import { DropdownMenu } from "bits-ui";

  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<DropdownMenu.Root bind:open={getOpen, setOpen}>
  <!-- ... -->
</DropdownMenu.Root>
```

### Reusable Component

For consistency across your app, wrap the Dropdown Menu in a reusable component that exposes typed props.

`MyDropdownMenu.svelte`:

```svelte
<script lang="ts">
  import { DropdownMenu, type WithoutChild } from "bits-ui";

  type Props = DropdownMenu.RootProps & {
    buttonText: string;
    items: string[];
    contentProps?: WithoutChild<DropdownMenu.ContentProps>;
  };

  let {
    open = $bindable(false),
    children,
    buttonText,
    items,
    contentProps,
    ...restProps
  }: Props = $props();
</script>

<DropdownMenu.Root bind:open {...restProps}>
  <DropdownMenu.Trigger>
    {buttonText}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content {...contentProps}>
      <DropdownMenu.Group aria-label={buttonText}>
        {#each items as item}
          <DropdownMenu.Item textValue={item}>
            {item}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

Usage:

```svelte
<script lang="ts">
  import MyDropdownMenu from "./MyDropdownMenu.svelte";
</script>

<MyDropdownMenu
  buttonText="Select a manager"
  items={["Michael Scott", "Dwight Schrute", "Jim Halpert"]}
/>
```

## Accessibility

### Keyboard Navigation

| Key | Behavior |
| --- | --- |
| `Enter` / `Space` (on Trigger) | Opens the menu and focuses the first/highlighted item. |
| `Arrow Down` (on Trigger) | Opens the menu and focuses the first item. |
| `Arrow Up` (on Trigger) | Opens the menu and focuses the last item. |
| `Arrow Down` / `Arrow Up` (in Content) | Moves focus between menu items (roving focus). When `loop` is `true`, wraps around. |
| `Arrow Right` (on SubTrigger) | Opens the submenu and focuses its first item. |
| `Arrow Left` (in SubContent) | Closes the submenu and returns focus to the SubTrigger. |
| `Home` / `End` (in Content) | Moves focus to the first / last item. |
| Character keys (in Content) | Typeahead: focuses the next item whose `textValue` starts with the typed characters. |
| `Escape` | Closes the menu (or the open submenu first). Behavior is customizable via `escapeKeydownBehavior` / `onEscapeKeydown`. |
| `Tab` | Not trapped by default in the same way as a modal; closes the menu and moves focus to the next page element. |

### Focus Management

- **Open auto-focus**: By default, focus moves to the first menu item (or the highlighted item) when the menu opens. Override with `onOpenAutoFocus` — call `e.preventDefault()` on the event, then focus your desired element.
- **Close auto-focus**: By default, focus returns to the trigger element when the menu closes. Override with `onCloseAutoFocus` — call `e.preventDefault()`, then focus your desired element.
- **Roving focus**: Only one menu item is focusable at a time (the highlighted one). Arrow keys move the highlight, not `Tab`.

### ARIA Pattern

The Dropdown Menu implements the WAI-ARIA `menu` pattern:

- `DropdownMenu.Trigger` has `aria-haspopup="menu"` and `aria-expanded` reflecting the open state.
- `DropdownMenu.Content` is rendered with `role="menu"`.
- `DropdownMenu.Item` is rendered with `role="menuitem"`.
- `DropdownMenu.CheckboxItem` is rendered with `role="menuitemcheckbox"`, with `aria-checked` reflecting the checked state.
- `DropdownMenu.RadioItem` is rendered with `role="menuitemradio"`, with `aria-checked` reflecting the checked state.
- `DropdownMenu.RadioGroup` provides a shared radio context so only one radio item can be checked at a time.
- `DropdownMenu.Group` is rendered with `role="group"` and should be labeled via `aria-label` or a child `GroupHeading`.
- `DropdownMenu.GroupHeading` is skipped during keyboard navigation and provides an accessible label for its group.
- `DropdownMenu.Separator` is rendered with `role="separator"`.
- `DropdownMenu.SubTrigger` has `aria-haspopup="menu"` and `aria-expanded` reflecting the submenu open state.
- `DropdownMenu.SubContent` is rendered with `role="menu"`.

### Typeahead

Each item can provide a `textValue` prop used for typeahead matching. If `textValue` is not provided, the component attempts to derive it from the item's text content. Typing characters while the menu is open moves focus to the next item whose text value starts with the typed string.

## Tips

- **Persist checkbox/radio state externally.** The `checked` state of `CheckboxItem` and the `value` state of `RadioGroup` / `CheckboxGroup` do not persist between menu open/close cycles. Store them in a `$state` variable and pass them to the relevant prop (`bind:checked` / `bind:value`) to persist across opens.
- **Use `CheckboxGroup` for multi-select, `RadioGroup` for single-select.** A `CheckboxGroup` manages a shared `string[]` value; each `CheckboxItem` inside should have a `value` prop. A `RadioGroup` manages a single `string` value; each `RadioItem` must have a `value` prop.
- **`GroupHeading` must be inside a `Group` or `RadioGroup`.** Using it on its own throws an error during development. It is skipped during keyboard navigation, making it a safe place for non-interactive labels.
- **Label every `Group`.** Provide either an `aria-label` on `DropdownMenu.Group` or a child `GroupHeading`. Without a label, screen reader users lose the semantic grouping.
- **Floating content wrapper rules.** When using the `child` snippet on `Content` or `SubContent` with `forceMount` for transitions, the snippet provides `wrapperProps` and `props`. Spread `wrapperProps` onto the outer positioning wrapper and do **not** style that element — styling belongs on the element receiving `props`. The `open` value gates conditional rendering for transitions.
- **Use `closeOnSelect={false}` for items that toggle state.** When an item controls a checkbox or radio-like state and you don't want the menu to close on selection, set `closeOnSelect={false}`.
- **Set `textValue` for reliable typeahead.** When item content includes icons or non-text elements, the derived text value may be incorrect. Explicitly set `textValue` to the item's label for accurate typeahead.
- **Disable the Portal for inline forms.** If the menu lives within a `<form>`, set `disabled` on `DropdownMenu.Portal` (or omit it) so the content stays inside the form and form submission works.
- **Use `customAnchor` to detach content from the trigger.** Pass a selector string or `HTMLElement` to anchor the content to a different element when the trigger and the desired anchor differ.
- **Use `data-starting-style` and `data-ending-style` for CSS transitions.** These attributes are present only during the first/last animation frames, letting you define enter/exit styles without JavaScript. Pair with CSS transitions for declarative animations.
- **Use `onOpenChangeComplete` for post-animation work.** This fires only after all open/close animations finish, making it the right hook for cleanup that must wait for visual transitions.
- **Prefer `escapeKeydownBehavior` / `interactOutsideBehavior` over raw handlers.** The behavior enums cover common scenarios declaratively; reach for `onEscapeKeydown` / `onInteractOutside` only when you need custom logic.
- **Submenus require their own `Portal`.** Wrap `SubContent` in a `DropdownMenu.Portal` to render it outside the parent content's DOM, ensuring correct stacking and positioning.
- **`loop` defaults to `false` on `Content` but `true` on `SubContentStatic`.** Be aware of the difference when mixing static and floating submenu content.
