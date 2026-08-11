# Menubar

The Menubar component renders a horizontal bar containing a collection of dropdown menus — the classic desktop application menu (File, Edit, View, etc.). Each menu has a trigger in the bar and a floating content panel with items, separators, radio groups, checkbox items, and nested submenus.

## Overview

The Menubar is a compound component that manages a set of menus laid out horizontally. Only one menu is open at a time; opening a new one closes the previous. The active menu is tracked by a string `value` on the root, which identifies which `Menubar.Menu` is currently open.

Key characteristics:

- **Horizontal layout** — Triggers sit side by side in a bar; content panels float below (or beside) them.
- **Single open menu** — The root's `value` tracks the active menu; opening one closes another.
- **Floating UI positioning** — `Menubar.Content` uses [Floating UI](https://floating-ui.com/) to position panels relative to their trigger, with collision detection and configurable side/align.
- **Rich items** — Supports plain items, checkbox items, radio groups, checkbox groups, separators, group headings, and nested submenus.
- **Accessible by default** — ARIA `menu`, `menubar`, `menuitem`, `menuitemcheckbox`, `menuitemradio` roles with full keyboard navigation, focus trapping, and typeahead.
- **Animation ready** — `forceMount` + `child` snippet enables Svelte transitions; `data-starting-style` / `data-ending-style` enable CSS transitions.

## Component Structure

The Menubar is composed of the following parts:

- **`Menubar.Root`** — Container that manages and scopes the state of the menubar. Tracks the active menu via `value`.
- **`Menubar.Menu`** — A single menu within the menubar, identified by a unique `value`.
- **`Menubar.Trigger`** — The button in the bar that toggles its parent menu open/closed.
- **`Menubar.Portal`** — Portals the content to the body or a custom target.
- **`Menubar.Content`** — The floating panel displayed when the menu is open. Uses Floating UI for positioning.
- **`Menubar.Item`** — A standard menu item.
- **`Menubar.CheckboxGroup`** — A group of checkbox items where `value` is an array of checked values.
- **`Menubar.CheckboxItem`** — A menu item that toggles like a checkbox (`menuitemcheckbox`).
- **`Menubar.RadioGroup`** — A group of radio items where only one is checked at a time.
- **`Menubar.RadioItem`** — A menu item that behaves like a radio button (`menuitemradio`). Must be a child of a `RadioGroup`.
- **`Menubar.Separator`** — A horizontal line separating items.
- **`Menubar.Group`** — A semantic group of items. Should receive an `aria-label` or contain a `GroupHeading`.
- **`Menubar.GroupHeading`** — A heading label for a group; skipped during keyboard navigation. Must be a child of a `Group` or `RadioGroup`.
- **`Menubar.Arrow`** — An optional arrow pointing to the menu's trigger.
- **`Menubar.Sub`** — A nested submenu, managing its own open state.
- **`Menubar.SubTrigger`** — The item that opens its parent submenu on press or hover.
- **`Menubar.SubContent`** — The floating content for a submenu. Uses Floating UI.
- **`Menubar.SubContentStatic`** — A non-Floating-UI variant of submenu content for manual positioning.

### Base Structure

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
</script>

<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger />
    <Menubar.Portal>
      <Menubar.Content>
        <Menubar.Group>
          <Menubar.GroupHeading />
          <Menubar.Item />
        </Menubar.Group>
        <Menubar.Item />
        <Menubar.CheckboxItem>
          {#snippet children({ checked })}
            {checked ? "✅" : ""}
          {/snippet}
        </Menubar.CheckboxItem>
        <Menubar.RadioGroup>
          <Menubar.GroupHeading />
          <Menubar.RadioItem>
            {#snippet children({ checked })}
              {checked ? "✅" : ""}
            {/snippet}
          </Menubar.RadioItem>
        </Menubar.RadioGroup>
        <Menubar.Sub>
          <Menubar.SubTrigger />
          <Menubar.SubContent />
        </Menubar.Sub>
        <Menubar.Separator />
        <Menubar.Arrow />
      </Menubar.Content>
    </Menubar.Portal>
  </Menubar.Menu>
</Menubar.Root>
```

## API Reference

### Menubar.Root

The root menubar component which manages & scopes the state of the menubar.

| Property          | Type                                              | Default     | Description |
| ----------------- | ------------------------------------------------- | ----------- | ----------- |
| `value` ($bindable) | `string`                                        | `undefined` | The value of the currently active menu. |
| `onValueChange`   | `(value: string) => void`                         | `undefined` | A callback function called when the active menu value changes. |
| `dir`             | `'ltr' \| 'rtl'`                                  | `'ltr'`     | The reading direction of the app. |
| `loop`            | `boolean`                                         | `true`      | Whether or not to loop through the menubar menu triggers when navigating with the keyboard. |
| `ref` ($bindable) | `HTMLDivElement`                                  | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                         | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>`     | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs. |

### Menubar.Menu

A menu within the menubar.

| Property       | Type                          | Default     | Description |
| -------------- | ----------------------------- | ----------- | ----------- |
| `value`        | `string`                      | `undefined` | The value of this menu within the menubar, used to identify it when determining which menu is active. |
| `onOpenChange` | `(open: boolean) => void`     | `undefined` | A callback function called when the open state changes. |
| `children`     | `Snippet`                     | `undefined` | The children content to render. |

### Menubar.Trigger

The button element which toggles the dropdown menu.

| Property          | Type                                          | Default     | Description |
| ----------------- | --------------------------------------------- | ----------- | ----------- |
| `disabled`        | `boolean`                                     | `false`     | Whether or not the menu trigger is disabled. |
| `ref` ($bindable) | `HTMLButtonElement`                           | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                     | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.Portal

A component that portals the content of the dropdown menu to the body or a custom target (if provided).

| Property   | Type                 | Default          | Description |
| ---------- | -------------------- | ---------------- | ----------- |
| `to`       | `Element \| string`  | `document.body`  | Where to render the content when it is open. Defaults to the body. |
| `disabled` | `boolean`            | `false`          | Whether the portal is disabled. When disabled, the content is rendered in its original DOM location. |
| `children` | `Snippet`            | `undefined`      | The children content to render. |

### Menubar.Content

The content displayed when the dropdown menu is open. Uses [Floating UI](https://floating-ui.com/) to position the content relative to the trigger.

| Property                       | Type                                                                                          | Default       | Description |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `side`                         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                      | `'bottom'`    | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur. |
| `sideOffset`                   | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element. |
| `align`                        | `'start' \| 'center' \| 'end'`                                                                | `'start'`     | The preferred alignment of the anchor to render the floating element against when open. May change when collisions occur. |
| `alignOffset`                  | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element. |
| `arrowPadding`                 | `number`                                                                                      | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `avoidCollisions`              | `boolean`                                                                                     | `true`        | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary`            | `Element \| null`                                                                             | `undefined`   | A boundary element or array of elements to check for collisions against. |
| `collisionPadding`             | `number \| Partial<Record<Side, number>>`                                                     | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky`                       | `'partial' \| 'always'`                                                                       | `'partial'`   | The sticky behavior on the align axis. `'partial'` keeps content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps it in the boundary regardless. |
| `hideWhenDetached`             | `boolean`                                                                                     | `true`        | When `true`, hides the content when it is detached from the DOM. Useful for hiding content when the user scrolls away. |
| `updatePositionStrategy`       | `'optimized' \| 'always'`                                                                     | `'optimized'` | The strategy for updating content position. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes. |
| `strategy`                     | `'fixed' \| 'absolute'`                                                                       | `'fixed'`     | The positioning strategy. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll`                | `boolean`                                                                                     | `true`        | When `true`, prevents the body from scrolling when the content is open. |
| `customAnchor`                 | `string \| HTMLElement \| Measurable \| null`                                                 | `null`        | Use an element other than the trigger to anchor the content to. |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent default behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`     | Behavior when an escape keydown occurs. `'close'` closes immediately; `'ignore'` prevents closing; `'defer-otherwise-close'` defers to parent if it exists, otherwise closes; `'defer-otherwise-ignore'` defers to parent if it exists, otherwise ignores. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`   | Callback fired when an outside interaction (`pointerdown`) occurs. Call `event.preventDefault()` to prevent default behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`   | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`     | Behavior when an interaction occurs outside the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | `undefined`   | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | `undefined`   | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus`                    | `boolean`                                                                                     | `true`        | Whether or not to trap focus within the content when open. |
| `forceMount`                   | `boolean`                                                                                     | `false`       | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`        | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                                                              | `'ltr'`       | The reading direction of the app. |
| `loop`                         | `boolean`                                                                                     | `false`       | Whether or not to loop through the menu items when navigating with the keyboard. |
| `ref` ($bindable)              | `HTMLDivElement`                                                                              | `null`        | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                     | `Snippet`                                                                                     | `undefined`   | The children content to render. |
| `child`                        | `Snippet<{ wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean; }>` | `undefined` | Use render delegation to render your own element. `wrapperProps` is for the positioning wrapper (do not style); `props` is for your content element (apply styles here); `open` is the content visibility state for conditional rendering with transitions. See Child Snippet docs. |

### Menubar.Item

A menu item within the dropdown menu.

| Property          | Type                                          | Default     | Description |
| ----------------- | --------------------------------------------- | ----------- | ----------- |
| `disabled`        | `boolean`                                     | `false`     | Whether or not the menu item is disabled. |
| `textValue`       | `string`                                      | `undefined` | The text value of the menu item. Used for typeahead. |
| `onSelect`        | `() => void`                                  | `undefined` | A callback fired when the menu item is selected. |
| `closeOnSelect`   | `boolean`                                     | `true`      | Whether or not the menu should close when the item is selected. |
| `ref` ($bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                     | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.CheckboxGroup

A group of checkbox menu items, where multiple can be checked at a time.

| Property            | Type                                          | Default     | Description |
| ------------------- | --------------------------------------------- | ----------- | ----------- |
| `value` ($bindable) | `string[]`                                    | `[]`        | The value of the group — an array of the values of the checked checkboxes within the group. |
| `onValueChange`     | `(value: string[]) => void`                   | `undefined` | A callback fired when the checkbox group's value state changes. |
| `ref` ($bindable)   | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`          | `Snippet`                                     | `undefined` | The children content to render. |
| `child`             | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.CheckboxItem

A menu item that can be controlled and toggled like a checkbox.

| Property                    | Type                                                                                  | Default     | Description |
| --------------------------- | ------------------------------------------------------------------------------------- | ----------- | ----------- |
| `disabled`                  | `boolean`                                                                             | `false`     | Whether or not the checkbox menu item is disabled. Disabled items cannot be interacted with and are skipped during keyboard navigation. |
| `checked` ($bindable)       | `boolean`                                                                             | `false`     | The checked state of the checkbox. |
| `onCheckedChange`           | `(checked: boolean) => void`                                                          | `undefined` | A callback fired when the checked state changes. |
| `indeterminate` ($bindable) | `boolean`                                                                             | `false`     | The indeterminate state of the checkbox. |
| `onIndeterminateChange`     | `(indeterminate: boolean) => void`                                                    | `undefined` | A callback fired when the indeterminate state changes. |
| `value`                     | `string`                                                                              | `undefined` | The value of the checkbox item when used in a `Menubar.CheckboxGroup`. |
| `textValue`                 | `string`                                                                              | `undefined` | The text value of the checkbox menu item. Used for typeahead. |
| `onSelect`                  | `() => void`                                                                          | `undefined` | A callback fired when the menu item is selected. |
| `closeOnSelect`             | `boolean`                                                                             | `true`      | Whether or not the menu should close when the item is selected. |
| `ref` ($bindable)           | `HTMLDivElement`                                                                      | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                  | `Snippet<{ checked: boolean; indeterminate: boolean; }>`                              | `undefined` | The children content to render. The snippet receives `checked` and `indeterminate` booleans. |
| `child`                     | `Snippet<{ props: Record<string, unknown>; checked: boolean; indeterminate: boolean; }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.RadioGroup

A group of radio menu items, where only one can be checked at a time.

| Property            | Type                                          | Default     | Description |
| ------------------- | --------------------------------------------- | ----------- | ----------- |
| `value` ($bindable) | `string`                                      | `undefined` | The value of the currently checked radio menu item. |
| `onValueChange`     | `(value: string) => void`                     | `undefined` | A callback fired when the radio group's value changes. |
| `ref` ($bindable)   | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`          | `Snippet`                                     | `undefined` | The children content to render. |
| `child`             | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.RadioItem

A menu item that can be controlled and toggled like a radio button. Must be a child of a `Menubar.RadioGroup`.

| Property          | Type                                                               | Default     | Description |
| ----------------- | ------------------------------------------------------------------ | ----------- | ----------- |
| `value` (required)| `string`                                                           | `undefined` | The value of the radio item. When checked, the parent `RadioGroup`'s value is set to this value. |
| `disabled`        | `boolean`                                                          | `false`     | Whether or not the radio menu item is disabled. Disabled items cannot be interacted with and are skipped during keyboard navigation. |
| `textValue`       | `string`                                                           | `undefined` | The text value of the radio menu item. Used for typeahead. |
| `onSelect`        | `() => void`                                                       | `undefined` | A callback fired when the menu item is selected. |
| `closeOnSelect`   | `boolean`                                                          | `true`      | Whether or not the menu should close when the item is selected. |
| `ref` ($bindable) | `HTMLDivElement`                                                   | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet<{ checked: boolean; }>`                                   | `undefined` | The children content to render. The snippet receives a `checked` boolean. |
| `child`           | `Snippet<{ props: Record<string, unknown>; checked: boolean; }>`  | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.Separator

A horizontal line to visually separate menu items.

| Property          | Type                                          | Default     | Description |
| ----------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` ($bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                     | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.Arrow

An optional arrow which points to the dropdown menu's anchor/trigger point.

| Property          | Type                                          | Default | Description |
| ----------------- | --------------------------------------------- | ------- | ----------- |
| `width`           | `number`                                      | `8`     | The width of the arrow in pixels. |
| `height`          | `number`                                      | `8`     | The height of the arrow in pixels. |
| `ref` ($bindable) | `HTMLDivElement`                              | `null`  | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                     | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.Group

A group of menu items. Should be passed an `aria-label` or have a child `Menubar.GroupHeading` to provide a label for the group.

| Property          | Type                                          | Default     | Description |
| ----------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` ($bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                     | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.GroupHeading

A heading for a group which is skipped during keyboard navigation. It provides a label for a group of menu items and must be a child of either a `Menubar.Group` or `Menubar.RadioGroup`.

| Property          | Type                                          | Default     | Description |
| ----------------- | --------------------------------------------- | ----------- | ----------- |
| `ref` ($bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                     | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.Sub

A submenu belonging to the parent dropdown menu. Responsible for managing the state of the submenu.

| Property               | Type                          | Default     | Description |
| ---------------------- | ----------------------------- | ----------- | ----------- |
| `open` ($bindable)     | `boolean`                     | `false`     | The open state of the submenu. |
| `onOpenChange`         | `(open: boolean) => void`     | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void`     | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `children`             | `Snippet`                     | `undefined` | The children content to render. |

### Menubar.SubTrigger

A menu item which when pressed or hovered, opens the submenu it is a child of.

| Property          | Type                                          | Default     | Description |
| ----------------- | --------------------------------------------- | ----------- | ----------- |
| `disabled`        | `boolean`                                     | `false`     | Whether or not the submenu trigger is disabled. |
| `openDelay`       | `number`                                      | `0`         | The amount of time in ms from when the mouse enters the subtrigger until the submenu opens. |
| `textValue`       | `string`                                      | `undefined` | The text value of the submenu trigger. Used for typeahead. |
| `onSelect`        | `() => void`                                  | `undefined` | A callback fired when the menu item is selected. |
| `ref` ($bindable) | `HTMLDivElement`                              | `null`      | The underlying DOM element being rendered. Bind to get a reference. |
| `children`        | `Snippet`                                     | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Menubar.SubContent

The submenu content displayed when the parent submenu is open. Uses [Floating UI](https://floating-ui.com/) for positioning.

| Property                       | Type                                                                                          | Default       | Description |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------- | ----------- |
| `side`                         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                      | `'bottom'`    | The preferred side of the anchor to render the floating element against when open. Will be reversed when collisions occur. |
| `sideOffset`                   | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element. |
| `align`                        | `'start' \| 'center' \| 'end'`                                                                | `'start'`     | The preferred alignment of the anchor to render the floating element against when open. May change when collisions occur. |
| `alignOffset`                  | `number`                                                                                      | `0`           | The distance in pixels from the anchor to the floating element. |
| `arrowPadding`                 | `number`                                                                                      | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `avoidCollisions`              | `boolean`                                                                                     | `true`        | When `true`, overrides the `side` and `align` options to prevent collisions with the boundary edges. |
| `collisionBoundary`            | `Element \| null`                                                                             | `undefined`   | A boundary element or array of elements to check for collisions against. |
| `collisionPadding`             | `number \| Partial<Record<Side, number>>`                                                     | `0`           | The amount in pixels of virtual padding around the viewport edges to check for overflow which will cause a collision. |
| `sticky`                       | `'partial' \| 'always'`                                                                       | `'partial'`   | The sticky behavior on the align axis. `'partial'` keeps content in the boundary as long as the trigger is at least partially in the boundary; `'always'` keeps it in the boundary regardless. |
| `hideWhenDetached`             | `boolean`                                                                                     | `true`        | When `true`, hides the content when it is detached from the DOM. |
| `updatePositionStrategy`       | `'optimized' \| 'always'`                                                                     | `'optimized'` | The strategy for updating content position. `'optimized'` only repositions when the trigger is in the viewport; `'always'` repositions whenever the position changes. |
| `strategy`                     | `'fixed' \| 'absolute'`                                                                       | `'fixed'`     | The positioning strategy. `'fixed'` positions relative to the viewport; `'absolute'` positions relative to the nearest positioned ancestor. |
| `preventScroll`                | `boolean`                                                                                     | `true`        | When `true`, prevents the body from scrolling when the content is open. |
| `customAnchor`                 | `string \| HTMLElement \| Measurable \| null`                                                 | `null`        | Use an element other than the trigger to anchor the content to. |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                                                              | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent default behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`     | Behavior when an escape keydown occurs. `'close'` closes immediately; `'ignore'` prevents closing; `'defer-otherwise-close'` defers to parent if it exists, otherwise closes; `'defer-otherwise-ignore'` defers to parent if it exists, otherwise ignores. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                                                               | `undefined`   | Callback fired when an outside interaction (`pointerdown`) occurs. Call `event.preventDefault()` to prevent default behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                                                 | `undefined`   | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'`                  | `'close'`     | Behavior when an interaction occurs outside the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus`              | `(event: Event) => void`                                                                      | `undefined`   | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                                                                      | `undefined`   | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus`                    | `boolean`                                                                                     | `true`        | Whether or not to trap focus within the content when open. |
| `forceMount`                   | `boolean`                                                                                     | `false`       | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean`                                                                                     | `true`        | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                                                              | `'ltr'`       | The reading direction of the app. |
| `loop`                         | `boolean`                                                                                     | `false`       | Whether or not to loop through the menu items when navigating with the keyboard. |
| `ref` ($bindable)              | `HTMLDivElement`                                                                              | `null`        | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                     | `Snippet`                                                                                     | `undefined`   | The children content to render. |
| `child`                        | `Snippet<{ wrapperProps: Record<string, unknown>; props: Record<string, unknown>; open: boolean; }>` | `undefined` | Use render delegation to render your own element. `wrapperProps` is for the positioning wrapper (do not style); `props` is for your content element (apply styles here); `open` is the content visibility state for conditional rendering. See Child Snippet docs. |

### Menubar.SubContentStatic

The submenu content displayed when the parent submenu is open. Static variant — opts out of Floating UI positioning; you must handle positioning yourself.

| Property                       | Type                                                          | Default       | Description |
| ------------------------------ | ------------------------------------------------------------- | ------------- | ----------- |
| `onEscapeKeydown`              | `(event: KeyboardEvent) => void`                              | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent default behavior. |
| `escapeKeydownBehavior`        | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'`     | Behavior when an escape keydown occurs. Same semantics as above. |
| `onInteractOutside`            | `(event: PointerEvent) => void`                               | `undefined`   | Callback fired when an outside interaction (`pointerdown`) occurs. Call `event.preventDefault()` to prevent default behavior. |
| `onFocusOutside`               | `(event: FocusEvent) => void`                                 | `undefined`   | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent default behavior. |
| `interactOutsideBehavior`      | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'`     | Behavior when an interaction occurs outside the floating content. Same semantics as above. |
| `onOpenAutoFocus`              | `(event: Event) => void`                                      | `undefined`   | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus`             | `(event: Event) => void`                                      | `undefined`   | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus`                    | `boolean`                                                     | `true`        | Whether or not to trap focus within the content when open. |
| `forceMount`                   | `boolean`                                                     | `false`       | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean`                                                     | `true`        | When `true`, prevents text selection from overflowing the bounds of the element. |
| `dir`                          | `'ltr' \| 'rtl'`                                              | `'ltr'`       | The reading direction of the app. |
| `loop`                         | `boolean`                                                     | `true`        | Whether or not to loop through the menu items when reaching the end of the list using the keyboard. |
| `ref` ($bindable)              | `HTMLDivElement`                                              | `null`        | The underlying DOM element being rendered. Bind to get a reference. |
| `children`                     | `Snippet`                                                     | `undefined`   | The children content to render. |
| `child`                        | `Snippet<{ open: boolean; props: Record<string, unknown> }>` | `undefined`   | Use render delegation to render your own element. See Child Snippet docs. |

## Data Attributes

### Menubar.Trigger

| Data Attribute         | Value                       | Description |
| ---------------------- | --------------------------- | ----------- |
| `data-state`           | `'open' \| 'closed'`        | The open state of the menu the trigger controls. |
| `data-menubar-trigger` | `''`                        | Present on the trigger element. |

### Menubar.Content

| Data Attribute         | Value                       | Description |
| ---------------------- | --------------------------- | ----------- |
| `data-state`           | `'open' \| 'closed'`        | The open state of the menu the element belongs to. |
| `data-starting-style`  | `''`                        | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`    | `''`                        | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-menubar-content` | `''`                        | Present on the content element. |

### Menubar.Item

| Data Attribute      | Value      | Description |
| ------------------- | ---------- | ----------- |
| `data-orientation`  | `'vertical'` | The orientation of the menu. |
| `data-highlighted`  | `''`       | Present when the menu item is highlighted. |
| `data-disabled`     | `''`       | Present when the menu item is disabled. |
| `data-menubar-item` | `''`       | Present on the item element. |

### Menubar.CheckboxGroup

| Data Attribute                | Value | Description |
| ----------------------------- | ----- | ----------- |
| `data-menubar-checkbox-group` | `''`  | Present on the checkbox group element. |

### Menubar.CheckboxItem

| Data Attribute               | Value                                  | Description |
| ---------------------------- | -------------------------------------- | ----------- |
| `data-orientation`           | `'vertical'`                           | The orientation of the menu. |
| `data-highlighted`           | `''`                                   | Present when the menu item is highlighted. |
| `data-disabled`              | `''`                                   | Present when the menu item is disabled. |
| `data-state`                 | `'checked' \| 'unchecked' \| 'indeterminate'` | The checkbox menu item's checked state. |
| `data-menubar-checkbox-item` | `''`                                   | Present on the checkbox item element. |

### Menubar.RadioGroup

| Data Attribute             | Value | Description |
| -------------------------- | ----- | ----------- |
| `data-menubar-radio-group` | `''`  | Present on the radio group element. |

### Menubar.RadioItem

| Data Attribute            | Value                      | Description |
| ------------------------- | -------------------------- | ----------- |
| `data-orientation`        | `'vertical'`               | The orientation of the menu. |
| `data-highlighted`        | `''`                       | Present when the menu item is highlighted. |
| `data-disabled`           | `''`                       | Present when the menu item is disabled. |
| `data-state`              | `'checked' \| 'unchecked'` | The radio menu item's checked state. |
| `data-value`              | `''`                       | The value of the radio item. |
| `data-menubar-radio-item` | `''`                       | Present on the radio item element. |

### Menubar.Separator

| Data Attribute           | Value        | Description |
| ------------------------ | ------------ | ----------- |
| `data-orientation`       | `'vertical'` | The orientation of the separator. |
| `data-menu-separator`    | `''`         | Present on the separator element. |
| `data-menubar-separator` | `''`         | Present on the separator element. |

### Menubar.Arrow

| Data Attribute       | Value                | Description |
| -------------------- | -------------------- | ----------- |
| `data-state`         | `'open' \| 'closed'` | The open state of the menu the element belongs to. |
| `data-menubar-arrow` | `''`                 | Present on the arrow element. |

### Menubar.Group

| Data Attribute       | Value | Description |
| -------------------- | ----- | ----------- |
| `data-menubar-group` | `''`  | Present on the group element. |

### Menubar.GroupHeading

| Data Attribute               | Value | Description |
| ---------------------------- | ----- | ----------- |
| `data-menubar-group-heading` | `''`  | Present on the group heading element. |

### Menubar.SubTrigger

| Data Attribute             | Value                | Description |
| -------------------------- | -------------------- | ----------- |
| `data-orientation`         | `'vertical'`         | The orientation of the menu. |
| `data-highlighted`         | `''`                 | Present when the menu item is highlighted. |
| `data-disabled`            | `''`                 | Present when the menu item is disabled. |
| `data-state`               | `'open' \| 'closed'` | The open state of the submenu the trigger controls. |
| `data-menubar-sub-trigger` | `''`                 | Present on the submenu trigger element. |

### Menubar.SubContent

| Data Attribute             | Value                       | Description |
| -------------------------- | --------------------------- | ----------- |
| `data-state`               | `'open' \| 'closed'`        | The open state of the submenu the element belongs to. |
| `data-starting-style`      | `''`                        | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`        | `''`                        | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-menubar-sub-content` | `''`                        | Present on the submenu content element. |

### Menubar.SubContentStatic

| Data Attribute             | Value                       | Description |
| -------------------------- | --------------------------- | ----------- |
| `data-state`               | `'open' \| 'closed'`        | The open state of the submenu the element belongs to. |
| `data-starting-style`      | `''`                        | Present during the initial open frame. Use to define starting styles for CSS transitions. |
| `data-ending-style`        | `''`                        | Present while closing before unmount. Use to define ending styles for CSS transitions. |
| `data-menubar-sub-content` | `''`                        | Present on the submenu content element. |

## CSS Variables

These CSS variables are exposed on `Menubar.Content` and `Menubar.SubContent` and can be used for positioning-aware styling and animations.

| CSS Variable                                   | Description |
| ---------------------------------------------- | ----------- |
| `--bits-menubar-menu-content-transform-origin` | The transform origin of the content element. |
| `--bits-menubar-menu-content-available-width`  | The available width of the content element. |
| `--bits-menubar-menu-content-available-height` | The available height of the content element. |
| `--bits-menubar-menu-anchor-width`             | The width of the anchor element. |
| `--bits-menubar-menu-anchor-height`            | The height of the anchor element. |

## Examples

### Basic Usage

A minimal menubar with two menus, each containing simple items:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
</script>

<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Portal>
      <Menubar.Content align="start" sideOffset={3}>
        <Menubar.Item>New File</Menubar.Item>
        <Menubar.Item>Open...</Menubar.Item>
        <Menubar.Separator />
        <Menubar.Item>Save</Menubar.Item>
        <Menubar.Item>Save As...</Menubar.Item>
      </Menubar.Content>
    </Menubar.Portal>
  </Menubar.Menu>
  <Menubar.Menu>
    <Menubar.Trigger>Edit</Menubar.Trigger>
    <Menubar.Portal>
      <Menubar.Content align="start" sideOffset={3}>
        <Menubar.Item>Undo</Menubar.Item>
        <Menubar.Item>Redo</Menubar.Item>
        <Menubar.Separator />
        <Menubar.Item>Cut</Menubar.Item>
        <Menubar.Item>Copy</Menubar.Item>
        <Menubar.Item>Paste</Menubar.Item>
      </Menubar.Content>
    </Menubar.Portal>
  </Menubar.Menu>
</Menubar.Root>
```

### With Submenus

Use `Menubar.Sub` with `Menubar.SubTrigger` and `Menubar.SubContent` for nested menu structures:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  import CaretRight from "phosphor-svelte/lib/CaretRight";
</script>

<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger>Edit</Menubar.Trigger>
    <Menubar.Portal>
      <Menubar.Content align="start" sideOffset={3}>
        <Menubar.Item>Undo</Menubar.Item>
        <Menubar.Item>Redo</Menubar.Item>
        <Menubar.Separator />
        <Menubar.Sub>
          <Menubar.SubTrigger>
            Find
            <CaretRight class="ml-auto h-4 w-4" />
          </Menubar.SubTrigger>
          <Menubar.SubContent>
            <Menubar.Item>Search the web</Menubar.Item>
            <Menubar.Separator />
            <Menubar.Item>Find...</Menubar.Item>
            <Menubar.Item>Find Next</Menubar.Item>
            <Menubar.Item>Find Previous</Menubar.Item>
          </Menubar.SubContent>
        </Menubar.Sub>
        <Menubar.Separator />
        <Menubar.Item>Cut</Menubar.Item>
        <Menubar.Item>Copy</Menubar.Item>
        <Menubar.Item>Paste</Menubar.Item>
      </Menubar.Content>
    </Menubar.Portal>
  </Menubar.Menu>
</Menubar.Root>
```

### With Radio Groups

Combine `Menubar.RadioGroup` and `Menubar.RadioItem` to let users pick one option from a set:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  import Check from "phosphor-svelte/lib/Check";

  const views = [
    { value: "table", label: "Table" },
    { value: "board", label: "Board" },
    { value: "gallery", label: "Gallery" },
  ];
  let selectedView = $state("table");
</script>

<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger>View</Menubar.Trigger>
    <Menubar.Portal>
      <Menubar.Content align="start" sideOffset={3}>
        <Menubar.RadioGroup bind:value={selectedView}>
          {#each views as view (view.label)}
            <Menubar.RadioItem value={view.value}>
              {#snippet children({ checked })}
                {view.label}
                <div class="ml-auto size-5">
                  {#if checked}
                    <Check class="size-5" />
                  {/if}
                </div>
              {/snippet}
            </Menubar.RadioItem>
          {/each}
        </Menubar.RadioGroup>
      </Menubar.Content>
    </Menubar.Portal>
  </Menubar.Menu>
</Menubar.Root>
```

### With Checkbox Items

Use `Menubar.CheckboxItem` to add toggleable options. The `children` snippet receives `checked` and `indeterminate`:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";

  let showBookmarks = $state(true);
  let showFullURLs = $state(false);
</script>

<Menubar.CheckboxItem bind:checked={showBookmarks}>
  {#snippet children({ checked, indeterminate })}
    {#if indeterminate}-{:else if checked}✅{/if}
    Show Bookmarks
  {/snippet}
</Menubar.CheckboxItem>
<Menubar.CheckboxItem bind:checked={showFullURLs}>
  {#snippet children({ checked })}
    {#if checked}✅{/if}
    Show Full URLs
  {/snippet}
</Menubar.CheckboxItem>
```

### With Checkbox Groups

Wrap checkbox items in a `Menubar.CheckboxGroup` to track an array of checked values:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  let colors = $state<string[]>([]);
</script>

<Menubar.CheckboxGroup bind:value={colors}>
  <Menubar.GroupHeading>Favorite color</Menubar.GroupHeading>
  <Menubar.CheckboxItem value="red">
    {#snippet children({ checked })}
      {#if checked}✅{/if}
      Red
    {/snippet}
  </Menubar.CheckboxItem>
  <Menubar.CheckboxItem value="blue">
    {#snippet children({ checked })}
      {#if checked}✅{/if}
      Blue
    {/snippet}
  </Menubar.CheckboxItem>
  <Menubar.CheckboxItem value="green">
    {#snippet children({ checked })}
      {#if checked}✅{/if}
      Green
    {/snippet}
  </Menubar.CheckboxItem>
</Menubar.CheckboxGroup>
```

### Managing Value State

Control which menu is open via the root's `value`. Use `bind:value` for two-way binding:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  let activeValue = $state("");
</script>

<button onclick={() => (activeValue = "menu-1")}>Open File Menu</button>

<Menubar.Root bind:value={activeValue}>
  <Menubar.Menu value="menu-1">
    <Menubar.Trigger>File</Menubar.Trigger>
    <!-- ... -->
  </Menubar.Menu>
  <Menubar.Menu value="menu-2">
    <Menubar.Trigger>Edit</Menubar.Trigger>
    <!-- ... -->
  </Menubar.Menu>
</Menubar.Root>
```

For full control, use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings):

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  let activeValue = $state("");

  function getValue() {
    return activeValue;
  }
  function setValue(newValue: string) {
    activeValue = newValue;
  }
</script>

<Menubar.Root bind:value={getValue, setValue}>
  <Menubar.Menu value="menu-1"><!-- ... --></Menubar.Menu>
  <Menubar.Menu value="menu-2"><!-- ... --></Menubar.Menu>
</Menubar.Root>
```

### With Svelte Transitions

Use `forceMount` with the `child` snippet to apply Svelte transitions. The `open` state drives an `{#if}` block:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  import { fly } from "svelte/transition";
</script>

<Menubar.Content forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div {...props} transition:fly>
          <Menubar.Item>Item 1</Menubar.Item>
          <Menubar.Item>Item 2</Menubar.Item>
        </div>
      </div>
    {/if}
  {/snippet}
</Menubar.Content>
```

### Reusable Menu Component

Wrap the trigger, content, and items into a reusable component for cleaner code:

```svelte
<!-- MyMenubarMenu.svelte -->
<script lang="ts">
  import { Menubar, type WithoutChildrenOrChild } from "bits-ui";

  type Props = WithoutChildrenOrChild<Menubar.MenuProps> & {
    triggerText: string;
    items: { label: string; value: string; onSelect?: () => void }[];
    contentProps?: WithoutChildrenOrChild<Menubar.ContentProps>;
  };

  let { triggerText, items, contentProps, ...restProps }: Props = $props();
</script>

<Menubar.Menu {...restProps}>
  <Menubar.Trigger>
    {triggerText}
  </Menubar.Trigger>
  <Menubar.Content {...contentProps}>
    <Menubar.Group aria-label={triggerText}>
      {#each items as item}
        <Menubar.Item textValue={item.label} onSelect={item.onSelect}>
          {item.label}
        </Menubar.Item>
      {/each}
    </Menubar.Group>
  </Menubar.Content>
</Menubar.Menu>
```

Usage:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  import MyMenubarMenu from "./MyMenubarMenu.svelte";

  const sales = [
    { label: "Michael Scott", value: "michael" },
    { label: "Dwight Schrute", value: "dwight" },
  ];
  const hr = [
    { label: "Toby Flenderson", value: "toby" },
    { label: "Holly Flax", value: "holly" },
  ];

  const menubarMenus = [
    { title: "Sales", items: sales },
    { title: "HR", items: hr },
  ];
</script>

<Menubar.Root>
  {#each menubarMenus as { title, items }}
    <MyMenubarMenu triggerText={title} {items} />
  {/each}
</Menubar.Root>
```

## Accessibility

The Menubar follows the [WAI-ARIA Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/) and the [WAI-ARIA Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/).

### Keyboard Navigation

When a menu trigger is focused (within the menubar bar):

| Key              | Behavior |
| ---------------- | -------- |
| `Enter` / `Space`| Opens the menu and focuses the first item. |
| `ArrowDown`      | Opens the menu and focuses the first item. |
| `ArrowUp`        | Opens the menu and focuses the last item. |
| `ArrowLeft`      | Moves focus to the previous menu trigger. If `loop` is enabled, wraps from the first to the last. |
| `ArrowRight`     | Moves focus to the next menu trigger. If `loop` is enabled, wraps from the last to the first. |
| `Home`           | Moves focus to the first menu trigger. |
| `End`            | Moves focus to the last menu trigger. |
| `Tab`            | Closes the menu and moves focus to the next focusable element. |

When a menu item is focused (within open content):

| Key              | Behavior |
| ---------------- | -------- |
| `ArrowDown`      | Moves focus to the next item. If `loop` is enabled, wraps. |
| `ArrowUp`        | Moves focus to the previous item. If `loop` is enabled, wraps. |
| `ArrowRight`     | If the focused item is a `SubTrigger`, opens the submenu and focuses its first item. Otherwise moves focus to the next menu trigger in the bar (opening that menu). |
| `ArrowLeft`      | If inside a submenu, closes the submenu and returns focus to its `SubTrigger`. Otherwise moves focus to the previous menu trigger in the bar (opening that menu). |
| `Home`           | Moves focus to the first item in the current menu. |
| `End`            | Moves focus to the last item in the current menu. |
| `Enter` / `Space`| Selects the focused item. |
| `Escape`         | Closes the menu (or submenu) and returns focus to its trigger. |
| `Tab`            | Closes the menu and moves focus to the next focusable element. |
| Type a character | Moves focus to the next item whose `textValue` starts with that character (typeahead). |

### ARIA

- The menubar bar has `role="menubar"`; triggers have `role="menuitem"`.
- Each `Menubar.Content` has `role="menu"`.
- `Menubar.Item` has `role="menuitem"`.
- `Menubar.CheckboxItem` has `role="menuitemcheckbox"` with `aria-checked` reflecting the checked state (including `indeterminate`).
- `Menubar.RadioItem` has `role="menuitemradio"` with `aria-checked` reflecting the checked state; the parent `RadioGroup` manages the mutually exclusive selection.
- `Menubar.Separator` has `role="separator"`.
- `Menubar.SubTrigger` has `aria-haspopup="menu"` and `aria-expanded` reflecting the submenu's open state.
- `Menubar.Group` has `role="group"` and should be labelled via `aria-label` or a child `GroupHeading`.
- `data-state` attributes (`'open'` / `'closed'`, `'checked'` / `'unchecked'` / `'indeterminate'`) mirror the ARIA state for CSS targeting.
- `data-highlighted` reflects the currently highlighted item (the one that would be activated on `Enter`).

## Tips

### Floating Content Wrapper Rules

When using `Menubar.Content` or `Menubar.SubContent` with the `child` snippet for Svelte transitions, you receive `wrapperProps`, `props`, and `open`:

- Spread `wrapperProps` onto an outer wrapper element. This is the positioning wrapper used by Floating UI — **do not style it**.
- Spread `props` onto your actual content element. **Apply all custom styles here.**
- Use the `open` boolean to conditionally render with transitions (guard with `{#if open}`).

### Opting Out of Floating UI

Use `Menubar.SubContentStatic` instead of `Menubar.SubContent` to opt out of Floating UI positioning for submenus. You must handle positioning yourself. Combining `Menubar.Portal` with static content may cause unexpected positioning behavior — consider omitting the portal or working around it.

### Custom Anchor

By default, `Menubar.Content` is anchored to its `Menubar.Trigger`. To anchor to a different element, pass a selector string, `HTMLElement`, or `Measurable` to the `customAnchor` prop:

```svelte
<script lang="ts">
  import { Menubar } from "bits-ui";
  let customAnchor = $state<HTMLElement>(null!);
</script>

<div bind:this={customAnchor}></div>
<Menubar.Menu>
  <Menubar.Trigger>Menu</Menubar.Trigger>
  <Menubar.Portal>
    <Menubar.Content {customAnchor}>
      <!-- ... -->
    </Menubar.Content>
  </Menubar.Portal>
</Menubar.Menu>
```

### Managing Value State

- **Two-way binding**: Use `bind:value` on `Menubar.Root` for automatic synchronization. Set the value to a menu's `value` to programmatically open it.
- **Fully controlled**: Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) (`bind:value={getValue, setValue}`) for complete control over reads and writes.
- `onValueChange` fires when the active menu value changes.

### Unique `value` per Menu

Always set explicit `value` props on each `Menubar.Menu` if you plan to control which menu is open. Omitting `value` generates a random ID per render, making `bind:value` on the root unreliable.

### Checkbox Group State Persistence

The `value` state of a `Menubar.CheckboxGroup` does **not** persist between menu open/close cycles. To persist the state, store it in a `$state` variable and pass it to the `value` prop (or use `bind:value`).

### `closeOnSelect`

By default, selecting any menu item closes the entire menu. Set `closeOnSelect={false}` on `Menubar.Item`, `Menubar.CheckboxItem`, or `Menubar.RadioItem` to keep the menu open after selection — useful for multi-select scenarios or when the user needs to see immediate feedback.

### Styling Highlighted Items

Use the `data-highlighted` attribute on items to style them differently when highlighted via keyboard navigation or hover:

```css
[data-highlighted] {
  background-color: var(--muted);
}
```

### Styling Open/Closed States

Use `data-[state=open]` and `data-[state=closed]` on `Menubar.Trigger` and `Menubar.Content` to style based on open state. Use `data-starting-style` and `data-ending-style` on content for CSS enter/exit transitions, driven by the `--bits-menubar-menu-content-*` CSS variables.

### Disabled Items

Set `disabled` on `Menubar.Trigger`, `Menubar.Item`, `Menubar.CheckboxItem`, `Menubar.RadioItem`, or `Menubar.SubTrigger` to prevent interaction. Disabled items are skipped during keyboard navigation and receive a `data-disabled` attribute.

### Submenu Open Delay

Control how long the mouse must hover on a `Menubar.SubTrigger` before the submenu opens using the `openDelay` prop (in milliseconds). The default of `0` opens immediately on hover.

### `textValue` for Typeahead

Set `textValue` on items whose visible label is not plain text (e.g., rendered via icons or snippets). The typeahead feature uses `textValue` to match typed characters and move focus.
