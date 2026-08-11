# Pagination

A navigation component that enables users to browse through a series of pages, typically used to break up large sets of data or content into manageable chunks.

## Overview

The `Pagination` component provides the behavior and accessibility wiring for navigating between numbered pages of content. It computes which page triggers to render (including ellipsis placeholders for gaps), exposes the current range of visible items, and manages the selected page state with support for two-way binding and fully controlled usage.

It is part of Bits UI, a headless Svelte component library, meaning it provides the behavior and accessibility wiring without imposing any styles — you bring your own classes.

## Component Structure

The Pagination component is composed of four parts:

- **`Pagination.Root`** — The root container that manages state, computes the visible page items, and provides snippet props for rendering the pages, range, and current page.
- **`Pagination.PrevButton`** — A button that navigates to the previous page. Disabled when on the first page (unless `loop` is set on the root).
- **`Pagination.NextButton`** — A button that navigates to the next page. Disabled when on the last page (unless `loop` is set on the root).
- **`Pagination.Page`** — A button that triggers a change to a specific page. Receives a `page` item from the `pages` snippet prop.

```svelte
<script lang="ts">
  import { Pagination } from "bits-ui";
</script>

<Pagination.Root count={100} perPage={10}>
  {#snippet children({ pages, range })}
    <Pagination.PrevButton />
    {#each pages as page (page.key)}
      {#if page.type === "ellipsis"}
        <span>...</span>
      {:else}
        <Pagination.Page {page} />
      {/if}
    {/each}
    <Pagination.NextButton />
  {/snippet}
</Pagination.Root>
```

## API Reference

### `Pagination.Root`

The root pagination component which contains all other pagination components.

| Prop            | Type                                                                                                                                                                       | Default       | Description                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `count`         | `number`                                                                                                                                                                   | `undefined`   | **Required.** The total number of items being paginated. Used together with `perPage` to compute the total number of pages.                                 |
| `page`          | `number`                                                                                                                                                                   | `undefined`   | The selected page (1-indexed). Bindable (`$bindable`) — use `bind:page` to control or synchronize the selected page from outside the component.              |
| `onPageChange`  | `(page: number) => void`                                                                                                                                                   | `undefined`   | A callback function invoked when the selected page changes. Receives the new page number as its argument.                                                    |
| `perPage`       | `number`                                                                                                                                                                   | `1`           | The number of items per page. Used together with `count` to compute the total number of pages.                                                              |
| `siblingCount`  | `number`                                                                                                                                                                   | `1`           | The number of page triggers to show on either side of the current page. Higher values show more direct page links; lower values rely more on ellipses.      |
| `loop`          | `boolean`                                                                                                                                                                  | `false`       | Whether the pagination should loop through items when reaching the end (or beginning) while navigating with the keyboard.                                    |
| `orientation`   | `'horizontal' \| 'vertical'`                                                                                                                                               | `'horizontal'`| The orientation of the pagination. Determines how keyboard navigation works with the component (e.g., ArrowLeft/ArrowRight vs. ArrowUp/ArrowDown).           |
| `ref`           | `HTMLDivElement`                                                                                                                                                           | `null`        | The underlying DOM element being rendered. Bindable (`$bindable`) — bind to this to get a reference to the element.                                          |
| `children`      | `Snippet<ChildrenSnippetProps>`                                                                                                                                            | `undefined`   | The children content to render. Receives `pages`, `range`, and `currentPage` as snippet props (see below).                                                   |
| `child`         | `Snippet<ChildSnippetProps>`                                                                                                                                               | `undefined`   | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information.                 |

#### `children` snippet props (`ChildrenSnippetProps`)

| Property       | Type                                                 | Description                                                                 |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `pages`        | `PageItem[]`                                         | The items to iterate over and render for the pagination component.          |
| `range`        | `{ start: number; end: number }`                     | The range of items currently visible (1-indexed start and end).             |
| `currentPage`  | `number`                                             | The currently active page number.                                           |

#### `PageItem` type

The `pages` array contains items of type `PageItem`, which is a union of `Page` and `Ellipsis`:

```ts
type Page = {
  type: "page";
  /** The page number the item represents */
  value: number;
};

type Ellipsis = {
  type: "ellipsis";
};

type PageItem = (Page | Ellipsis) & {
  /** A unique key to be used as the key in a Svelte `#each` block */
  key: string;
};
```

#### `child` snippet props (`ChildSnippetProps`)

| Property       | Type                                                 | Description                                                                 |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `pages`        | `PageItem[]`                                         | The items to iterate over and render for the pagination component.          |
| `range`        | `{ start: number; end: number }`                     | The range of items currently visible (1-indexed start and end).             |
| `currentPage`  | `number`                                             | The currently active page number.                                           |
| `props`        | `Record<string, unknown>`                            | The props to forward to the rendered element when using render delegation.  |

### `Pagination.Page`

A button that triggers a page change to the specific page it represents.

| Prop         | Type                                                                                       | Default       | Description                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`       | `PageItem`                                                                                 | `undefined`   | The page item this component represents. Pass the item from the `pages` array returned by the `Pagination.Root` children snippet.            |
| `ref`        | `HTMLButtonElement`                                                                        | `null`        | The underlying DOM element being rendered. Bindable (`$bindable`) — bind to this to get a reference to the element.                          |
| `children`   | `Snippet`                                                                                  | `undefined`   | The children content to render.                                                                                                              |
| `child`      | `Snippet<{ props: Record<string, unknown> }>`                                             | `undefined`   | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### `Pagination.PrevButton`

The previous button of the pagination. Navigates to the page before the current one. Disabled when on the first page (unless `loop` is enabled on the root).

| Prop         | Type                                                                                       | Default       | Description                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`        | `HTMLButtonElement`                                                                        | `null`        | The underlying DOM element being rendered. Bindable (`$bindable`) — bind to this to get a reference to the element.                          |
| `children`   | `Snippet`                                                                                  | `undefined`   | The children content to render.                                                                                                              |
| `child`      | `Snippet<{ props: Record<string, unknown> }>`                                             | `undefined`   | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

### `Pagination.NextButton`

The next button of the pagination. Navigates to the page after the current one. Disabled when on the last page (unless `loop` is enabled on the root).

| Prop         | Type                                                                                       | Default       | Description                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`        | `HTMLButtonElement`                                                                        | `null`        | The underlying DOM element being rendered. Bindable (`$bindable`) — bind to this to get a reference to the element.                          |
| `children`   | `Snippet`                                                                                  | `undefined`   | The children content to render.                                                                                                              |
| `child`      | `Snippet<{ props: Record<string, unknown> }>`                                             | `undefined`   | Use render delegation to render your own element. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for more information. |

## Data Attributes

Data attributes are present on the rendered elements and can be targeted via CSS or queried via JavaScript.

| Data Attribute                | Value | Description                                              |
| ----------------------------- | ----- | -------------------------------------------------------- |
| `data-pagination-page`        | `''`  | Present on each `Pagination.Page` trigger element.       |
| `data-selected`               | `''`  | Present on the `Pagination.Page` element for the current page. |
| `data-pagination-prev-button` | `''`  | Present on the `Pagination.PrevButton` element.          |
| `data-pagination-next-button` | `''`  | Present on the `Pagination.NextButton` element.          |

### Styling with the data attributes

Use the data attributes as styling hooks to target components without coupling to specific class names:

```css
/* All page triggers */
[data-pagination-page] {
  /* shared page button styles */
}

/* The currently selected page */
[data-pagination-page][data-selected] {
  background: var(--accent);
  color: var(--accent-foreground);
}

/* Previous / Next buttons */
[data-pagination-prev-button],
[data-pagination-next-button] {
  /* shared nav button styles */
}

/* Disabled state for prev/next */
[data-pagination-prev-button]:disabled,
[data-pagination-next-button]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## CSS Variables

The Pagination component does not expose any `--bits-*` CSS variables. Styling is done entirely via class names or the data attributes listed above.

## Examples

### Basic Usage

A complete pagination with previous/next buttons, page triggers, and ellipsis handling:

```svelte
<script lang="ts">
  import { Pagination } from "bits-ui";
  import CaretLeft from "phosphor-svelte/lib/CaretLeft";
  import CaretRight from "phosphor-svelte/lib/CaretRight";
</script>

<Pagination.Root count={100} perPage={10}>
  {#snippet children({ pages, range })}
    <div class="flex items-center">
      <Pagination.PrevButton
        class="inline-flex size-10 items-center justify-center rounded-[9px] bg-transparent hover:bg-dark-10 disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        <CaretLeft class="size-6" />
      </Pagination.PrevButton>

      <div class="flex items-center gap-2.5">
        {#each pages as page (page.key)}
          {#if page.type === "ellipsis"}
            <div class="select-none text-[15px] font-medium">...</div>
          {:else}
            <Pagination.Page
              {page}
              class="inline-flex size-10 select-none items-center justify-center rounded-[9px] bg-transparent text-[15px] font-medium hover:bg-dark-10 data-selected:bg-foreground data-selected:text-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {page.value}
            </Pagination.Page>
          {/if}
        {/each}
      </div>

      <Pagination.NextButton
        class="inline-flex size-10 items-center justify-center rounded-[9px] bg-transparent hover:bg-dark-10 disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        <CaretRight class="size-6" />
      </Pagination.NextButton>
    </div>

    <p class="text-center text-[13px] text-muted-foreground">
      Showing {range.start} - {range.end}
    </p>
  {/snippet}
</Pagination.Root>
```

### Minimal Structure

The simplest valid structure using snippet props:

```svelte
<script lang="ts">
  import { Pagination } from "bits-ui";
</script>

<Pagination.Root count={50} perPage={10}>
  {#snippet children({ pages })}
    <Pagination.PrevButton />
    {#each pages as page (page.key)}
      {#if page.type === "ellipsis"}
        <span>...</span>
      {:else}
        <Pagination.Page {page}>{page.value}</Pagination.Page>
      {/if}
    {/each}
    <Pagination.NextButton />
  {/snippet}
</Pagination.Root>
```

### Two-Way Binding with `bind:page`

Use `bind:page` for simple, automatic state synchronization. This lets you read and write the current page from outside the component:

```svelte
<script lang="ts">
  import { Pagination } from "bits-ui";

  let myPage = $state(1);
</script>

<button onclick={() => (myPage = 2)}>Go to page 2</button>

<Pagination.Root count={100} perPage={10} bind:page={myPage}>
  {#snippet children({ pages })}
    <Pagination.PrevButton />
    {#each pages as page (page.key)}
      {#if page.type === "ellipsis"}
        <span>...</span>
      {:else}
        <Pagination.Page {page}>{page.value}</Pagination.Page>
      {/if}
    {/each}
    <Pagination.NextButton />
  {/snippet}
</Pagination.Root>
```

### Fully Controlled with a Function Binding

Use a [Svelte Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes. This is useful when you need to intercept or transform page changes (e.g., to sync with a URL or fetch data):

```svelte
<script lang="ts">
  import { Pagination } from "bits-ui";

  let myPage = $state(1);

  function getPage() {
    return myPage;
  }

  function setPage(newPage: number) {
    myPage = newPage;
  }
</script>

<Pagination.Root count={100} perPage={10} bind:page={getPage, setPage}>
  {#snippet children({ pages })}
    <Pagination.PrevButton />
    {#each pages as page (page.key)}
      {#if page.type === "ellipsis"}
        <span>...</span>
      {:else}
        <Pagination.Page {page}>{page.value}</Pagination.Page>
      {/if}
    {/each}
    <Pagination.NextButton />
  {/snippet}
</Pagination.Root>
```

### Reacting to Page Changes with `onPageChange`

Use `onPageChange` to react to page changes without controlling the state directly. This is ideal for triggering data fetches when the page changes:

```svelte
<script lang="ts">
  import { Pagination } from "bits-ui";

  let data = $state([]);

  async function fetchPage(page: number) {
    const res = await fetch(`/api/items?page=${page}`);
    data = await res.json();
  }
</script>

<Pagination.Root
  count={1000}
  perPage={20}
  onPageChange={(page) => fetchPage(page)}
>
  {#snippet children({ pages })}
    <Pagination.PrevButton />
    {#each pages as page (page.key)}
      {#if page.type === "ellipsis"}
        <span>...</span>
      {:else}
        <Pagination.Page {page}>{page.value}</Pagination.Page>
      {/if}
    {/each}
    <Pagination.NextButton />
  {/snippet}
</Pagination.Root>
```

### Adjusting Sibling Count

The `siblingCount` prop controls how many page triggers appear on either side of the current page. Increase it to show more direct page links:

```svelte
<Pagination.Root count={500} perPage={10} siblingCount={2}>
  <!-- ... -->
</Pagination.Root>
```

### Vertical Orientation

Set `orientation` to `'vertical'` to change the keyboard navigation behavior (ArrowUp/ArrowDown instead of ArrowLeft/ArrowRight):

```svelte
<Pagination.Root count={100} perPage={10} orientation="vertical">
  <!-- ... -->
</Pagination.Root>
```

### Looping Navigation

Enable `loop` so that keyboard navigation wraps from the last page back to the first (and vice versa):

```svelte
<Pagination.Root count={100} perPage={10} loop>
  <!-- ... -->
</Pagination.Root>
```

### Using the `range` Snippet Prop

The `range` snippet prop provides the 1-indexed start and end of the items currently visible on the active page. Use it to display context like "Showing 1 - 10 of 100":

```svelte
<Pagination.Root count={100} perPage={10}>
  {#snippet children({ pages, range, currentPage })}
    <Pagination.PrevButton />
    {#each pages as page (page.key)}
      {#if page.type === "ellipsis"}
        <span>...</span>
      {:else}
        <Pagination.Page {page}>{page.value}</Pagination.Page>
      {/if}
    {/each}
    <Pagination.NextButton />

    <p>Showing {range.start} - {range.end} of 100 (Page {currentPage})</p>
  {/snippet}
</Pagination.Root>
```

## Accessibility

The Pagination component is built with keyboard navigation and semantic markup in mind.

### Keyboard Navigation

The component renders the page triggers, previous button, and next button as native `<button>` elements, making them focusable and operable via the keyboard by default.

| Key                     | Behavior (horizontal orientation)        | Behavior (vertical orientation)        |
| ----------------------- | ----------------------------------------- | --------------------------------------- |
| `Tab`                   | Moves focus between prev, pages, and next | Moves focus between prev, pages, and next |
| `ArrowRight`            | Moves focus to the next page trigger      | —                                       |
| `ArrowLeft`             | Moves focus to the previous page trigger  | —                                       |
| `ArrowDown`             | —                                         | Moves focus to the next page trigger    |
| `ArrowUp`               | —                                         | Moves focus to the previous page trigger|
| `Home`                  | Moves focus to the first page trigger     | Moves focus to the first page trigger   |
| `End`                   | Moves focus to the last page trigger      | Moves focus to the last page trigger    |
| `Enter` / `Space`       | Activates the focused page trigger        | Activates the focused page trigger      |

When `loop` is enabled, focus wraps from the last page trigger back to the first (and vice versa) during arrow-key navigation.

### ARIA and Semantics

- All interactive elements (`Pagination.Page`, `Pagination.PrevButton`, `Pagination.NextButton`) render as native `<button>` elements, which carry the correct implicit ARIA roles and are announced by screen readers.
- The `data-selected` attribute on the current page's trigger can be used as a styling hook; pair it with `aria-current="page"` on the active trigger for explicit screen-reader indication of the current page if you build a custom layout.
- Use descriptive content inside the previous and next buttons (e.g., icon with a visually-hidden label) so screen-reader users understand their purpose.
- Keep the ellipsis items as non-interactive elements (e.g., `<span>`) so they are not focusable.

## Tips

- **Ellipsis handling**: Always check `page.type === "ellipsis"` inside the `#each` loop before rendering `Pagination.Page`. Ellipsis items do not have a `value` property and should be rendered as plain text (e.g., `...`). Using the `page.key` as the keyed-each key ensures correct diffing.
- **Use `range` for context**: The `range` snippet prop gives you the visible item window (`start` and `end`). Display it alongside the total count so users know where they are in the dataset.
- **Bind vs. callback**: Use `bind:page` when you need to read the current page in your own code (e.g., to control an external button). Use `onPageChange` when you only need to react to changes (e.g., to trigger a data fetch) without necessarily owning the state.
- **Function bindings for side effects**: When using `bind:page` with a function binding (`{getPage, setPage}`), you can intercept page writes to perform side effects like URL updates, analytics, or data fetching inside `setPage`.
- **`siblingCount` and total pages**: With the default `siblingCount` of `1`, the component shows one page trigger on each side of the current page plus ellipses for gaps. Increase `siblingCount` for dense datasets where users need to jump further; decrease it (to `0`) for compact layouts.
- **Styling the selected page**: Target `[data-pagination-page][data-selected]` in your CSS to style the active page trigger distinctly. This keeps your styles decoupled from consumer-supplied class names.
- **Disabled prev/next buttons**: The previous button is automatically disabled on the first page, and the next button on the last page. Style them with `:disabled` or the `disabled:` variant in Tailwind to communicate the inactive state.
- **Looping**: Enable `loop` on the root if you want keyboard navigation to wrap around. This does not change the disabled state of the prev/next buttons when at the extremes — it only affects keyboard focus traversal.
- **Orientation**: Set `orientation="vertical"` when the pagination is laid out vertically. This swaps the arrow-key bindings so keyboard navigation matches the visual layout.
