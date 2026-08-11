# Command

A command menu component that enables users to search, filter, and select items. Also known as a command palette, it combines a search input with a dynamic, filterable list of commands or options.

## Overview

The `Command` component provides a quick and efficient way for users to search, filter, and select items within an application. It combines the functionality of a search input with a dynamic, filterable list of commands or options, making it ideal for applications that require fast navigation or action execution.

It is part of Bits UI, a headless Svelte component library, meaning it provides the behavior and accessibility wiring without imposing any styles — you bring your own classes.

### Key Features

- **Dynamic Filtering** — As users type in the input field, the list of commands or items is instantly filtered and sorted based on an overridable scoring algorithm.
- **Keyboard Navigation** — Full support for keyboard interactions, allowing users to quickly navigate and select items without using a mouse.
- **Grouped Commands** — Ability to organize commands into logical groups, enhancing readability and organization.
- **Empty and Loading States** — Built-in components to handle scenarios where no results are found or when results are being loaded.
- **Accessibility** — Designed with ARIA attributes and keyboard interactions to ensure screen reader compatibility and accessibility standards.

## Component Structure

The Command component is composed of the following parts:

- **`Command.Root`** — The main container that manages the overall state and context of the command menu.
- **`Command.Input`** — The text input field where users can type to search or filter commands.
- **`Command.List`** — The container for the list of commands or items.
- **`Command.Viewport`** — The visible area of the command list, which applies CSS variables to handle dynamic resizing/animations based on the height of the list.
- **`Command.Empty`** — A component to display when no results are found.
- **`Command.Loading`** — A component to display while results are being fetched or processed.
- **`Command.Group`** — A container for a group of items within the command menu.
- **`Command.GroupHeading`** — A header element to provide an accessible label for a group of items.
- **`Command.GroupItems`** — A container for the items within a group.
- **`Command.Item`** — Individual selectable command or item.
- **`Command.LinkItem`** — A variant of `Command.Item` specifically for link-based actions; renders an `<a>` instead of a `<div>`.
- **`Command.Separator`** — A visual separator to divide different sections of the command list.

```svelte
<script lang="ts">
  import { Command } from "bits-ui";
</script>

<Command.Root>
  <Command.Input />
  <Command.List>
    <Command.Viewport>
      <Command.Empty />
      <Command.Loading />
      <Command.Group>
        <Command.GroupHeading />
        <Command.GroupItems>
          <Command.Item />
          <Command.LinkItem />
        </Command.GroupItems>
      </Command.Group>
      <Command.Separator />
      <Command.Item />
      <Command.LinkItem />
    </Command.Viewport>
  </Command.List>
</Command.Root>
```

## API Reference

### `Command.Root`

The main container that manages the overall state and context of the component.

| Prop                  | Type                                               | Default     | Description                                                                                                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value` $bindable     | `string`                                           | `""`        | The value of the command. Bindable — use `bind:value` to synchronize with your own state.                                                                                                                                                                                                           |
| `onValueChange`       | `(value: string) => void`                          | `undefined` | A callback that is fired when the command value changes.                                                                                                                                                                                                                                            |
| `label`               | `string`                                           | `undefined` | An accessible label for the command menu. This is not visible and is only used for screen readers.                                                                                                                                                                                                  |
| `filter`              | `(value: string, search: string, keywords?: string[]) => number` | `undefined` | A custom filter function used to filter items. This function should return a number between `0` and `1`, with `1` being a perfect match, and `0` being no match, resulting in the item being hidden entirely. The items are sorted/filtered based on this score.                                     |
| `shouldFilter`        | `boolean`                                          | `true`      | Whether or not the command menu should filter items. This is useful when you want to apply custom filtering logic outside of the Command component.                                                                                                                                                 |
| `columns`             | `number`                                           | `undefined` | The number of columns in the grid layout. When set, the command renders as a grid instead of a list.                                                                                                                                                                                               |
| `onStateChange`       | `(state: Readonly<CommandState>) => void`          | `undefined` | A callback that fires when the command's internal state changes. This callback receives a readonly snapshot of the current state. The callback is debounced and only fires once per batch of related updates (e.g., when typing triggers filtering and selection changes).                           |
| `loop`                | `boolean`                                          | `false`     | Whether or not the command menu should loop through items when navigating with the keyboard.                                                                                                                                                                                                       |
| `disablePointerSelection` | `boolean`                                      | `false`     | Set this to `true` to prevent items from being selected when the user's pointer moves over them.                                                                                                                                                                                                   |
| `vimBindings`         | `boolean`                                          | `true`      | Whether VIM bindings should be enabled or not, which allow the user to navigate using `ctrl+n`/`j`/`p`/`k`.                                                                                                                                                                                        |
| `disableInitialScroll`| `boolean`                                          | `false`     | Whether to disable scrolling the selected item into view on initial mount. When `true`, prevents automatic scrolling when the command menu first renders and selects its first item, but still allows scrolling on subsequent selections.                                                            |
| `ref` $bindable       | `HTMLDivElement`                                   | `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element.                                                                                                                                                                                            |
| `children`            | `Snippet`                                          | `undefined` | The children content to render.                                                                                                                                                                                                                                                                     |
| `child`               | `Snippet`                                          | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information.                                                                                                                                                                               |

#### `CommandState` type

The `onStateChange` callback receives a `Readonly<CommandState>` with the following shape:

```ts
type CommandState = {
  /** The value of the search query */
  search: string;
  /** The value of the selected command menu item */
  value: string;
  /** The filtered items */
  filtered: {
    /** The count of all visible items. */
    count: number;
    /** Map from visible item id to its search store. */
    items: Map<string, number>;
    /** Set of groups with at least one visible item. */
    groups: Set<string>;
  };
};
```

#### Imperative API methods

When you bind to the component with `bind:this`, the following methods are available for programmatic control:

| Method                                  | Returns                          | Description                                                                                                                                                            |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getValidItems()`                       | `CommandItem[]`                  | Returns an array of valid (non-disabled, visible) command items. Useful for checking bounds before operations.                                                         |
| `updateSelectedToIndex(index: number)`  | `void`                           | Sets selection to item at specified index. No-op if index is invalid.                                                                                                  |
| `updateSelectedByGroup(change: 1 \| -1)`| `void`                           | Moves selection to first item in next/previous group. Falls back to next/previous item if no group found.                                                              |
| `updateSelectedByItem(change: 1 \| -1)` | `void`                           | Moves selection up/down relative to current item. Wraps around if the `loop` option is enabled.                                                                        |

### `Command.Input`

The text input field where users can type to search or filter commands.

| Prop          | Type                  | Default     | Description                                                                                          |
| ------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `value` $bindable | `string`          | `undefined` | The value of the search query. This is used to filter items and to search for items. Bindable.       |
| `ref` $bindable   | `HTMLInputElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`             | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`             | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### `Command.List`

The container for the viewport, items, and other elements of the command menu.

| Prop          | Type              | Default     | Description                                                                                          |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### `Command.Viewport`

The visible area of the command list, which applies CSS variables to handle dynamic resizing/animations based on the height of the list.

| Prop          | Type              | Default     | Description                                                                                          |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### `Command.Group`

A container for a group of items within the command menu.

| Prop          | Type              | Default     | Description                                                                                                                                                                                                                         |
| ------------- | ----------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `string`          | `undefined` | If a `Command.GroupHeading` is used within this group, the contents of the heading will be used as the value. If the content is dynamic or you wish to have a more specific value, you can provide a unique value for the group here. |
| `forceMount`  | `boolean`         | `false`     | Whether or not the group should always be mounted to the DOM, regardless of the internal filtering logic.                                                                                                                          |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element.                                                                                                                            |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                                                                                                                                                    |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information.                                                                                                              |

### `Command.GroupHeading`

A heading element to provide an accessible label for a group of items.

| Prop          | Type              | Default     | Description                                                                                          |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### `Command.GroupItems`

The container for the items within a group.

| Prop          | Type              | Default     | Description                                                                                          |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### `Command.Item`

Represents a single item within the command menu. If you wish to render an anchor element to link to a page, use the `Command.LinkItem` component.

| Prop          | Type                  | Default     | Description                                                                                          |
| ------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `value` (required) | `string`         | `undefined` | The value of the item. Must be unique across all items. When set, the text content is used for display purposes only; the `value` is used for filtering and selection. |
| `keywords`    | `string[]`            | `undefined` | An array of additional keywords or aliases that will be used to filter the item.                     |
| `forceMount`  | `boolean`             | `false`     | Whether or not the item should always be mounted to the DOM, regardless of the internal filtering logic. |
| `onSelect`    | `() => void`          | `undefined` | A callback that is fired when the item is selected.                                                  |
| `disabled`    | `boolean`             | `false`     | Whether or not the item is disabled. This will prevent interaction/selection.                        |
| `ref` $bindable | `HTMLDivElement`    | `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`             | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`             | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### `Command.LinkItem`

Similar to the `Command.Item` component, but renders an anchor (`<a>`) element to take advantage of preloading before navigation.

| Prop          | Type                  | Default     | Description                                                                                          |
| ------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `value` (required) | `string`         | `undefined` | The value of the item. Must be unique across all items.                                              |
| `keywords`    | `string[]`            | `undefined` | An array of additional keywords or aliases that will be used to filter the item.                     |
| `forceMount`  | `boolean`             | `false`     | Whether or not the item should always be mounted to the DOM, regardless of the internal filtering logic. |
| `onSelect`    | `() => void`          | `undefined` | A callback that is fired when the item is selected.                                                  |
| `disabled`    | `boolean`             | `false`     | Whether or not the item is disabled. This will prevent interaction/selection.                        |
| `ref` $bindable | `HTMLDivElement`    | `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`             | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`             | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

> **Note**: `Command.LinkItem` accepts the standard `href` attribute (and other anchor attributes) since it renders an `<a>` element. Pass `href="/some/path"` to set the link destination.

### `Command.Empty`

A component to display when no results are found.

| Prop          | Type              | Default     | Description                                                                                                                                                |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forceMount`  | `boolean`         | `false`     | Whether or not to forcefully mount the empty state, regardless of the internal filtering logic. Useful when you want to handle filtering yourself.          |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element.                                                    |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                                                                            |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information.                                      |

### `Command.Loading`

A component to display while results are being fetched or processed.

| Prop          | Type              | Default     | Description                                                                                          |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `progress`    | `number`          | `0`         | The progress of the loading state.                                                                   |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### `Command.Separator`

A visual separator to divide different sections of the command list. Visible when the search query is empty or the `forceMount` prop is `true`.

| Prop          | Type              | Default     | Description                                                                                          |
| ------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `forceMount`  | `boolean`         | `false`     | Whether or not the separator should always be mounted to the DOM, regardless of the internal filtering logic. |
| `ref` $bindable | `HTMLDivElement`| `null`      | The underlying DOM element being rendered. Bindable — use `bind:ref` to get a reference to the element. |
| `children`    | `Snippet`         | `undefined` | The children content to render.                                                                      |
| `child`       | `Snippet`         | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

## Data Attributes

Data attributes are present on the rendered elements and can be targeted via CSS or queried via JavaScript.

| Data Attribute              | Value | Description                              |
| --------------------------- | ----- | ---------------------------------------- |
| `data-command-root`         | `''`  | Present on the root element.             |
| `data-command-input`        | `''`  | Present on the input element.            |
| `data-command-list`         | `''`  | Present on the list element.             |
| `data-command-viewport`     | `''`  | Present on the viewport element.         |
| `data-command-group`        | `''`  | Present on the group element.            |
| `data-command-group-heading`| `''`  | Present on the group heading element.    |
| `data-command-group-items`  | `''`  | Present on the group items element.      |
| `data-command-item`         | `''`  | Present on the item element.             |
| `data-command-empty`        | `''`  | Present on the empty element.            |
| `data-command-loading`      | `''`  | Present on the loading element.          |
| `data-command-separator`    | `''`  | Present on the separator element.        |
| `data-disabled`             | `''`  | Present on an item when it is disabled.  |
| `data-selected`             | `''`  | Present on an item when it is selected.  |

### Styling with data attributes

Use the `data-*` attributes as styling hooks to target components without coupling to specific class names:

```css
[data-command-item] {
  /* shared item styles */
}

[data-command-item][data-selected] {
  /* selected item styles */
}

[data-command-item][data-disabled] {
  /* disabled item styles */
}
```

## CSS Variables

The Command component exposes the following CSS variable, which is set on the `Command.List` element by the `Command.Viewport` component. Use it to drive dynamic resizing or animations based on the computed height of the list.

| CSS Variable                 | Description                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bits-command-list-height` | The height of the command list element, which is computed by the `Command.Viewport` component.    |

### Using the CSS variable

```css
[data-command-list] {
  height: var(--bits-command-list-height);
  transition: height 0.2s ease;
}
```

## Examples

### Basic Command Menu

A simple command menu with grouped items, an empty state, and a separator:

```svelte
<script lang="ts">
  import { Command } from "bits-ui";
  import Sticker from "phosphor-svelte/lib/CalendarBlank";
  import CodeBlock from "phosphor-svelte/lib/CodeBlock";
  import Palette from "phosphor-svelte/lib/Palette";
</script>

<Command.Root
  class="flex h-full w-full flex-col divide-y overflow-hidden rounded-xl border bg-background self-start"
>
  <Command.Input
    class="inline-flex h-input truncate rounded-tl-xl rounded-tr-xl bg-background px-4 text-sm transition-colors placeholder:text-foreground-alt/50 focus:outline-hidden focus:ring-0"
    placeholder="Search for something..."
  />
  <Command.List class="max-h-[280px] overflow-y-auto overflow-x-hidden px-2 pb-2">
    <Command.Viewport>
      <Command.Empty
        class="flex w-full items-center justify-center pb-6 pt-8 text-sm text-muted-foreground"
      >
        No results found.
      </Command.Empty>
      <Command.Group>
        <Command.GroupHeading class="px-3 pb-2 pt-4 text-xs text-muted-foreground">
          Suggestions
        </Command.GroupHeading>
        <Command.GroupItems>
          <Command.Item
            class="flex h-10 cursor-pointer select-none items-center gap-2 rounded-button px-3 py-2.5 text-sm capitalize outline-hidden data-selected:bg-muted"
            keywords={["getting started", "tutorial"]}
          >
            <Sticker class="size-4" />
            Introduction
          </Command.Item>
          <Command.Item
            class="flex h-10 cursor-pointer select-none items-center gap-2 rounded-button px-3 py-2.5 text-sm capitalize outline-hidden data-selected:bg-muted"
            keywords={["child", "custom element", "snippets"]}
          >
            <CodeBlock class="size-4" />
            Delegation
          </Command.Item>
          <Command.Item
            class="flex h-10 cursor-pointer select-none items-center gap-2 rounded-button px-3 py-2.5 text-sm capitalize outline-hidden data-selected:bg-muted"
            keywords={["css", "theme", "colors", "fonts", "tailwind"]}
          >
            <Palette class="size-4" />
            Styling
          </Command.Item>
        </Command.GroupItems>
      </Command.Group>
      <Command.Separator class="h-px w-full bg-foreground/5" />
      <Command.Group>
        <Command.GroupHeading class="px-3 pb-2 pt-4 text-xs text-muted-foreground">
          Components
        </Command.GroupHeading>
        <Command.GroupItems>
          <Command.Item class="flex h-10 cursor-pointer select-none items-center gap-2 rounded-button px-3 py-2.5 text-sm capitalize outline-hidden data-selected:bg-muted">
            Calendar
          </Command.Item>
        </Command.GroupItems>
      </Command.Group>
    </Command.Viewport>
  </Command.List>
</Command.Root>
```

### Two-Way Binding

Use Svelte's `bind:value` directive to keep your local state in sync with the component's internal state:

```svelte
<script lang="ts">
  import { Command } from "bits-ui";

  let myValue = $state("");
</script>

<button onclick={() => (myValue = "A")}>Select A</button>

<Command.Root bind:value={myValue}>
  <!-- ... -->
</Command.Root>
```

### Change Handler

Use the `onValueChange` prop to execute side effects when the value changes:

```svelte
<script lang="ts">
  import { Command } from "bits-ui";
</script>

<Command.Root
  onValueChange={(value) => {
    console.log(value);
  }}
>
  <!-- ... -->
</Command.Root>
```

### Fully Controlled

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the value state:

```svelte
<script lang="ts">
  import { Command } from "bits-ui";

  let myValue = $state("");
</script>

<Command.Root bind:value={() => myValue, (newValue) => (myValue = newValue)}>
  <!-- ... -->
</Command.Root>
```

### In a Modal (Dialog)

Combine `Command` with `Dialog` to display the command menu within a modal. A common pattern is to trigger the modal with a keyboard shortcut (e.g., `⌘J`):

```svelte
<script lang="ts">
  import { Command, Dialog } from "bits-ui";

  let dialogOpen = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      dialogOpen = true;
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger>Open Command Menu ⌘J</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/80" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 w-full max-w-[490px] translate-x-[-50%] translate-y-[-50%] rounded-card-lg bg-background shadow-popover outline-hidden">
      <Dialog.Title class="sr-only">Command Menu</Dialog.Title>
      <Dialog.Description class="sr-only">
        This is the command menu. Use the arrow keys to navigate.
      </Dialog.Description>
      <Command.Root>
        <Command.Input placeholder="Search for something..." />
        <Command.List>
          <Command.Viewport>
            <Command.Empty>No results found.</Command.Empty>
            <Command.Group>
              <Command.GroupHeading>Suggestions</Command.GroupHeading>
              <Command.GroupItems>
                <Command.Item>Introduction</Command.Item>
              </Command.GroupItems>
            </Command.Group>
          </Command.Viewport>
        </Command.List>
      </Command.Root>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Grid Layout

Add the `columns` prop to use the command as a grid. This is useful for emoji pickers, icon selectors, and similar interfaces:

```svelte
<script lang="ts">
  import { Command } from "bits-ui";
</script>

<Command.Root columns={8}>
  <Command.Input placeholder="Search Emoji and Symbols..." />
  <Command.List>
    <Command.Viewport>
      <Command.Empty>No emojis or symbols found.</Command.Empty>
      <Command.Group>
        <Command.GroupHeading>Frequently Used</Command.GroupHeading>
        <Command.GroupItems class="grid grid-cols-8 gap-2 px-2">
          <Command.Item class="flex aspect-square size-full items-center justify-center text-2xl">
            🚀
          </Command.Item>
          <Command.Item class="flex aspect-square size-full items-center justify-center text-2xl">
            👍
          </Command.Item>
          <Command.Item class="flex aspect-square size-full items-center justify-center text-2xl">
            ⭐
          </Command.Item>
        </Command.GroupItems>
      </Command.Group>
    </Command.Viewport>
  </Command.List>
</Command.Root>
```

### Custom Filter

Provide a custom filter function to override the default scoring algorithm. The function should return a number between `0` and `1`, with `1` being a perfect match and `0` hiding the item entirely:

```svelte
<script lang="ts">
  import { Command } from "bits-ui";

  function customFilter(
    commandValue: string,
    search: string,
    commandKeywords?: string[]
  ): number {
    return commandValue.includes(search) ? 1 : 0;
  }
</script>

<Command.Root filter={customFilter}>
  <!-- ... -->
</Command.Root>
```

### Extend the Default Filter

The `computeCommandScore` function is exported for you to use and extend:

```svelte
<script lang="ts">
  import { Command, computeCommandScore } from "bits-ui";

  function customFilter(
    commandValue: string,
    search: string,
    commandKeywords?: string[]
  ): number {
    const score = computeCommandScore(commandValue, search, commandKeywords);
    // Add custom logic here
    return score;
  }
</script>

<Command.Root filter={customFilter}>
  <!-- ... -->
</Command.Root>
```

### Disable Filtering

Set `shouldFilter` to `false` when you want to handle filtering yourself (e.g., asynchronous fetching):

```svelte
<Command.Root shouldFilter={false}>
  <!-- ... -->
</Command.Root>
```

### Item Selection

Use the `onSelect` prop to handle item selection:

```svelte
<Command.Item onSelect={() => console.log("selected something!")}>
  Do Something
</Command.Item>
```

### Links

Use `Command.LinkItem` to render an anchor element that takes advantage of prefetching/preloading:

```svelte
<Command.LinkItem href="/some/path">
  Go to Page
</Command.LinkItem>
```

### Imperative API

Bind to the component to access methods for programmatic control, such as custom keybindings:

```svelte
<script lang="ts">
  import { Command } from "bits-ui";

  let command: typeof Command.Root;

  function jumpToLastItem() {
    if (!command) return;
    const items = command.getValidItems();
    if (!items.length) return;
    command.updateSelectedToIndex(items.length - 1);
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "o") {
      jumpToLastItem();
    }
  }}
/>

<Command.Root bind:this={command}>
  <!-- Command content -->
</Command.Root>
```

## Accessibility

The Command component is designed with ARIA attributes and keyboard interactions to ensure screen reader compatibility and accessibility standards.

### Keyboard Navigation

| Key                    | Action                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `ArrowDown`            | Moves selection to the next item. Wraps around if `loop` is enabled.   |
| `ArrowUp`              | Moves selection to the previous item. Wraps around if `loop` is enabled. |
| `ArrowRight`           | Moves selection to the next item (grid mode).                          |
| `ArrowLeft`            | Moves selection to the previous item (grid mode).                      |
| `Home`                 | Moves selection to the first item.                                     |
| `End`                  | Moves selection to the last item.                                      |
| `PageDown`             | Moves selection to the next group's first item.                        |
| `PageUp`               | Moves selection to the previous group's first item.                    |
| `Enter`                | Selects the currently focused item.                                    |
| `Escape`               | Clears the search query (if the input has focus).                      |
| `Tab`                  | Standard tab navigation.                                               |
| `Ctrl`+`n` / `Ctrl`+`j`| Moves selection to the next item (VIM bindings, enabled by default).   |
| `Ctrl`+`p` / `Ctrl`+`k`| Moves selection to the previous item (VIM bindings, enabled by default). |

> **VIM bindings**: When `vimBindings` is `true` (the default), users can navigate with `Ctrl+n`/`j` (next) and `Ctrl+p`/`k` (previous). Set `vimBindings={false}` on `Command.Root` to disable this behavior.

> **Accessible label**: Provide a `label` prop to `Command.Root` for screen readers. This label is not visible to sighted users.

## Tips

- **Unique item values**: The `value` of each `Command.Item` must be unique. If two items share the same text content, use the `value` prop to postfix a unique identifier (e.g., an ID or number) so filtering still matches while selection remains unambiguous:
  ```svelte
  <Command.Item value="my item 1">My Item</Command.Item>
  <Command.Item value="my item 2">My Item</Command.Item>
  ```
- **Keywords for searchability**: Use the `keywords` prop on `Command.Item` to add aliases that improve discoverability. Keywords are passed to the filter function and contribute to the item's score.
- **Links vs. actions**: Use `Command.LinkItem` (renders `<a>`) for navigation that benefits from prefetching/preloading, and `Command.Item` (renders `<div>`) for actions triggered via `onSelect`.
- **Async filtering**: Set `shouldFilter={false}` and use `onStateChange` to drive asynchronous data fetching. You are then responsible for rendering only the relevant items.
- **Force mounting**: Use `forceMount` on `Command.Empty`, `Command.Loading`, `Command.Group`, `Command.Item`, and `Command.Separator` to keep them in the DOM regardless of the internal filtering logic. This is useful when you handle filtering yourself.
- **Grid mode**: Set the `columns` prop on `Command.Root` to render items in a grid. Combine with `ArrowRight`/`ArrowLeft` navigation for 2D selection.
- **Disable pointer selection**: Set `disablePointerSelection={true}` on `Command.Root` when you want selection to be driven solely by keyboard or programmatic API.
- **Initial scroll**: Set `disableInitialScroll={true}` on `Command.Root` to prevent the menu from auto-scrolling to the first selected item on mount, which is helpful in nested or stacked views.
- **Looping navigation**: Enable `loop` on `Command.Root` to wrap `ArrowUp`/`ArrowDown` navigation around the list boundaries.
- **Imperative control**: Bind to `Command.Root` with `bind:this` to access `getValidItems()`, `updateSelectedToIndex()`, `updateSelectedByGroup()`, and `updateSelectedByItem()` for custom keybindings and programmatic selection.
- **State snapshot**: Use `onStateChange` to observe the debounced internal state (search query, selected value, filtered item count/groups). This is ideal for analytics, syncing external UI, or driving async fetching.
- **Styling hooks**: Target `[data-command-item][data-selected]` and `[data-command-item][data-disabled]` in CSS for state-based styling without coupling to consumer class names. Use `--bits-command-list-height` for dynamic height transitions on the list.
