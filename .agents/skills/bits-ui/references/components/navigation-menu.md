# Navigation Menu

A menu that allows users to navigate between pages of a website. The Navigation Menu provides a collection of links and dropdown panels, typically rendered in a horizontal or vertical bar, with support for hover/click triggers, animated viewports, indicators, and nested submenus.

## Table of Contents

- [Overview](#overview)
- [Component Structure](#component-structure)
- [API Reference](#api-reference)
  - [NavigationMenu.Root](#navigationmenuroot)
  - [NavigationMenu.Sub](#navigationmenusub)
  - [NavigationMenu.List](#navigationmenulist)
  - [NavigationMenu.Item](#navigationmenuitem)
  - [NavigationMenu.Trigger](#navigationmenutrigger)
  - [NavigationMenu.Content](#navigationmenucontent)
  - [NavigationMenu.Link](#navigationmenulink)
  - [NavigationMenu.Viewport](#navigationmenuviewport)
  - [NavigationMenu.Indicator](#navigationmenuindicator)
- [Data Attributes](#data-attributes)
- [CSS Variables](#css-variables)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Tips](#tips)

## Overview

The Navigation Menu component enables site-wide navigation. It renders a list of items, where each item can either be a direct link or a trigger that reveals a content panel. When a `Viewport` is present, the active item's content is portalled into it, enabling smooth size and position transitions between panels without full close/open animations. An optional `Indicator` highlights the active trigger.

### Key Features

- **Horizontal & Vertical Orientation** — Switch between a traditional horizontal bar and a vertical menu via the `orientation` prop.
- **Hover or Click to Open** — Items open on hover by default; set `openOnHover={false}` for click-only behavior.
- **Viewport Transitions** — The optional `Viewport` component renders the active item's content in a shared container, enabling smooth overlapping animations between panels.
- **Indicator** — An optional visual cue (e.g., an arrow) that tracks the active trigger.
- **Submenus** — Nest a `Sub` menu inside a `Content` panel for hierarchical navigation.
- **Force Mounting** — Persist links in the DOM for SEO by force-mounting `Content` and `Viewport`.
- **Advanced Animation** — `data-motion` attributes and `--bits-navigation-menu-viewport-*` CSS variables expose enter/exit direction and viewport dimensions for custom keyframe animations.
- **Accessibility** — Full keyboard navigation with `Tab`, `Arrow`, `Home`, `End`, and `Escape`, plus ARIA attributes managed automatically.

## Component Structure

The Navigation Menu is composed of the following parts:

- **Root** — The root navigation menu component which manages & scopes the state of the navigation menu. Renders a `<nav>` element.
- **Sub** — A sub navigation menu component which manages & scopes the state of a submenu, used inside the content of a Root menu. Renders a `<div>` element.
- **List** — The `<ul>` element containing the navigation menu items.
- **Item** — A `<li>` element within the navigation menu. Wraps a `Trigger`/`Content` pair or a standalone `Link`.
- **Trigger** — The button element which toggles the dropdown content for an item.
- **Content** — The content panel displayed when the item is active/open.
- **Link** — An anchor (`<a>`) element for direct navigation links.
- **Viewport** — An optional element that renders the active item's content in a shared container, enabling smooth transitions between panels. If absent, content renders in place.
- **Indicator** — An optional element that highlights the currently active trigger, useful for animated visual cues.

### Base Structure

```svelte
<script lang="ts">
  import { NavigationMenu } from "bits-ui";
</script>

<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger />
      <NavigationMenu.Content />
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger />
      <NavigationMenu.Content>
        <NavigationMenu.Link />
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Link />
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger />
      <NavigationMenu.Content>
        <NavigationMenu.Sub>
          <NavigationMenu.List />
          <NavigationMenu.Viewport />
        </NavigationMenu.Sub>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Indicator />
  </NavigationMenu.List>
  <NavigationMenu.Viewport />
</NavigationMenu.Root>
```

## API Reference

### NavigationMenu.Root

The root navigation menu component which manages & scopes the state of the navigation menu. Renders a `<nav>` element.

| Property          | Type                                       | Default       | Description                                                                                                                   |
| ----------------- | ------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `value` ($bindable) | `string`                                 | `undefined`   | The value of the currently active menu.                                                                                       |
| `onValueChange`   | `(value: string) => void`                  | `undefined`   | A callback function called when the active menu value changes. Called with an empty string when the menu closes.              |
| `dir`             | `enum` — `'ltr'` \| `'rtl'`                | `'ltr'`       | The reading direction of the app.                                                                                             |
| `skipDelayDuration` | `number`                                | `300`         | How much time (in ms) a user has to enter another trigger without incurring a delay again.                                    |
| `delayDuration`   | `number`                                   | `200`         | The duration (in ms) from when the mouse enters a trigger until the content opens.                                            |
| `orientation`     | `enum` — `'horizontal'` \| `'vertical'`    | `'horizontal'`| The orientation of the menu.                                                                                                  |
| `ref` ($bindable) | `HTMLNavElement`                           | `null`        | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                            |
| `children`        | `Snippet`                                  | `undefined`   | The children content to render.                                                                                                |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined`   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.           |

### NavigationMenu.Sub

A sub navigation menu component which manages & scopes the state of a submenu, inside the content of a Root menu. Renders a `<div>` element.

| Property          | Type                                       | Default        | Description                                                                                                                   |
| ----------------- | ------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `value` ($bindable) | `string`                                 | `undefined`    | The value of the currently active submenu.                                                                                    |
| `onValueChange`   | `(value: string) => void`                  | `undefined`    | A callback function called when the active menu value changes.                                                                |
| `orientation`     | `enum` — `'horizontal'` \| `'vertical'`    | `'horizontal'` | The orientation of the menu.                                                                                                  |
| `ref` ($bindable) | `HTMLDivElement`                           | `null`         | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                            |
| `children`        | `Snippet`                                  | `undefined`    | The children content to render.                                                                                                |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined`    | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.           |

### NavigationMenu.List

A menu within the menubar. Renders a `<ul>` element.

| Property          | Type                                       | Default     | Description                                                                                                                   |
| ----------------- | ------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ref` ($bindable) | `HTMLUListElement`                         | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                            |
| `children`        | `Snippet`                                  | `undefined` | The children content to render.                                                                                                |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.           |

### NavigationMenu.Item

A list item within the navigation menu. Renders a `<li>` element. Wraps a `Trigger`/`Content` pair or a standalone `Link`.

| Property          | Type                                       | Default     | Description                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`           | `string`                                   | `undefined` | The value of the item.                                                                                                                                                                                                                                                                                                     |
| `openOnHover`     | `boolean`                                  | `true`      | Whether or not the item should open its content when the trigger is hovered. When `false`, the menu will not close when the pointer moves outside of the content and will instead require the user to interact outside of the menu or press escape to close it.                                                              |
| `ref` ($bindable) | `HTMLLiElement`                            | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                                                                                                                                                                                                                         |
| `children`        | `Snippet`                                  | `undefined` | The children content to render.                                                                                                                                                                                                                                                                                            |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.                                                                                                                                                                                                        |

### NavigationMenu.Trigger

The button element which toggles the dropdown menu. Renders a `<button>` element.

| Property          | Type                                       | Default     | Description                                                                                                                   |
| ----------------- | ------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `disabled`        | `boolean`                                  | `false`     | Whether or not the trigger is disabled.                                                                                       |
| `ref` ($bindable) | `HTMLButtonElement`                        | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                            |
| `children`        | `Snippet`                                  | `undefined` | The children content to render.                                                                                                |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.           |

### NavigationMenu.Content

The content displayed when the dropdown menu is open. Renders a `<div>` element.

| Property                  | Type                                                                                          | Default       | Description                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onInteractOutside`       | `(event: PointerEvent) => void`                                                               | `undefined`   | Callback fired when an outside interaction event occurs, which is a `pointerdown` event. You can call `event.preventDefault()` to prevent the default behavior of handling the outside interaction.                                                                                                                                                                  |
| `onFocusOutside`          | `(event: FocusEvent) => void`                                                                 | `undefined`   | Callback fired when focus leaves the dismissible layer. You can call `event.preventDefault()` to prevent the default behavior on focus leaving the layer.                                                                                                                                                                                                            |
| `interactOutsideBehavior` | `enum` — `'close'` \| `'ignore'` \| `'defer-otherwise-close'` \| `'defer-otherwise-ignore'`   | `'close'`     | The behavior to use when an interaction occurs outside of the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction.                           |
| `onEscapeKeydown`         | `(event: KeyboardEvent) => void`                                                              | `undefined`   | Callback fired when an escape keydown event occurs in the floating content. You can call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event.                                                                                                                                                                              |
| `escapeKeydownBehavior`   | `enum` — `'close'` \| `'ignore'` \| `'defer-otherwise-close'` \| `'defer-otherwise-ignore'`   | `'close'`     | The behavior to use when an escape keydown event occurs in the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores the interaction.                           |
| `forceMount`              | `boolean`                                                                                     | `false`       | Whether or not to forcefully mount the content. This is useful if you want to use Svelte transitions or another animation library for the content, or to persist links in the DOM for SEO. When using `forceMount`, you must manage the visibility of the element yourself using the `data-state` attribute.                                                          |
| `ref` ($bindable)         | `HTMLDivElement`                                                                              | `null`        | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                                                                                                                                                                                                                                                                  |
| `children`                | `Snippet`                                                                                     | `undefined`   | The children content to render.                                                                                                                                                                                                                                                                                                                                      |
| `child`                   | `Snippet` — `SnippetProps`                                                                    | `undefined`   | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.                                                                                                                                                                                                                                                 |

### NavigationMenu.Link

A link within the navigation menu. Renders an `<a>` element.

| Property          | Type                                       | Default     | Description                                                                                                                   |
| ----------------- | ------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `active`          | `boolean`                                  | `false`     | Whether or not the link is active.                                                                                            |
| `onSelect`        | `() => void`                               | `undefined` | A callback function called when the link is selected.                                                                         |
| `ref` ($bindable) | `HTMLAnchorElement`                        | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                            |
| `children`        | `Snippet`                                  | `undefined` | The children content to render.                                                                                                |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.           |

### NavigationMenu.Viewport

An optional viewport element for the navigation menu, which renders the content of the menu items if it is present. If no `Viewport` is provided, the content renders in place. When present, the active item's content is portalled into the viewport, enabling smooth size and position transitions between panels without a full close/open animation. Renders a `<div>` element.

| Property          | Type                                       | Default     | Description                                                                                                                                                        |
| ----------------- | ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `forceMount`      | `boolean`                                  | `false`     | Whether or not to forcefully mount the content. This is useful if you want to use Svelte transitions or another animation library for the content, or to persist the viewport in the DOM. When using `forceMount`, you must manage the visibility of the element yourself using the `data-state` attribute. |
| `ref` ($bindable) | `HTMLDivElement`                           | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                                                                |
| `children`        | `Snippet`                                  | `undefined` | The children content to render.                                                                                                                                    |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.                                               |

### NavigationMenu.Indicator

The indicator element for the navigation menu, which is used to indicate the current active item. Useful when you want to provide an animated visual cue such as an arrow or highlight to accompany the `Viewport`. Renders a `<span>` element.

| Property          | Type                                       | Default     | Description                                                                                                                                                        |
| ----------------- | ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `forceMount`      | `boolean`                                  | `false`     | Whether or not to forcefully mount the content. This is useful if you want to use Svelte transitions or another animation library for the content.                 |
| `ref` ($bindable) | `HTMLSpanElement`                          | `null`      | The underlying DOM element being rendered. You can bind to this to get a reference to the element.                                                                |
| `children`        | `Snippet`                                  | `undefined` | The children content to render.                                                                                                                                    |
| `child`           | `Snippet` — `SnippetProps`                 | `undefined` | Use render delegation to render your own element. See [Child Snippet](https://bits-ui.com/docs/child-snippet) docs.                                               |

## Data Attributes

| Attribute                          | Value                                  | Component    | Description                                                                                         |
| ---------------------------------- | -------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `data-state`                       | `'open'` \| `'closed'`                 | Trigger      | The open state of the trigger's associated content.                                                 |
| `data-state`                       | `'open'` \| `'closed'`                 | Content      | The open state of the content. Used with `forceMount` to control visibility.                        |
| `data-state`                       | `'open'` \| `'closed'`                 | Viewport     | The open state of the viewport. Used with `forceMount` to control visibility.                       |
| `data-state`                       | `'visible'` \| `'hidden'`              | Indicator    | The visibility state of the indicator. `'visible'` when an item is active, `'hidden'` otherwise.    |
| `data-motion`                      | `'from-start'` \| `'from-end'` \| `'to-start'` \| `'to-end'` | Content | The direction of the enter/exit animation, used to animate content position when moving between items. |
| `data-starting-style`              | `''`                                   | Content      | Present during the initial open frame. Use this to define the starting styles for CSS transitions.  |
| `data-ending-style`                | `''`                                   | Content      | Present while closing before unmount. Use this to define the ending styles for CSS transitions.     |
| `data-starting-style`              | `''`                                   | Viewport     | Present during the initial open frame. Use this to define the starting styles for CSS transitions.  |
| `data-ending-style`                | `''`                                   | Viewport     | Present while closing before unmount. Use this to define the ending styles for CSS transitions.     |
| `data-starting-style`              | `''`                                   | Indicator    | Present during the initial open frame. Use this to define the starting styles for CSS transitions.  |
| `data-ending-style`                | `''`                                   | Indicator    | Present while closing before unmount. Use this to define the ending styles for CSS transitions.     |
| `data-navigation-menu-content`     | `''`                                   | Content      | Present on the content element.                                                                     |
| `data-navigation-menu-viewport`    | `''`                                   | Viewport     | Present on the viewport element.                                                                    |
| `data-navigation-menu-indicator`   | `''`                                   | Indicator    | Present on the indicator element.                                                                   |
| `data-orientation`                 | `'horizontal'` \| `'vertical'`         | Root, Sub    | The orientation of the menu.                                                                        |
| `data-disabled`                    | `''`                                   | Trigger      | Present when the trigger is disabled.                                                               |
| `data-active`                      | `''`                                   | Link         | Present when the link is active (via the `active` prop).                                            |

## CSS Variables

These CSS variables are exposed by the `NavigationMenu.Viewport` component for use in styling and animation:

| CSS Variable                                   | Description                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--bits-navigation-menu-viewport-width`        | The width of the active content rendered in the viewport. Use this to animate the viewport's width when transitioning between items. |
| `--bits-navigation-menu-viewport-height`       | The height of the active content rendered in the viewport. Use this to animate the viewport's height when transitioning between items. |

## Examples

### Basic with Viewport and Indicator

A full navigation menu with a `Viewport` to share a content container and an `Indicator` to highlight the active trigger.

```svelte
<script lang="ts">
  import { NavigationMenu } from "bits-ui";
  import CaretDown from "phosphor-svelte/lib/CaretDown";
  import cn from "clsx";

  const components: { title: string; href: string; description: string }[] = [
    {
      title: "Alert Dialog",
      href: "/docs/components/alert-dialog",
      description:
        "A modal dialog that interrupts the user with important content and expects a response.",
    },
    {
      title: "Link Preview",
      href: "/docs/components/link-preview",
      description:
        "For sighted users to preview content available behind a link.",
    },
    {
      title: "Progress",
      href: "/docs/components/progress",
      description:
        "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
    },
  ];

  type ListItemProps = {
    className?: string;
    title: string;
    href: string;
    content: string;
  };
</script>

{#snippet ListItem({ className, title, content, href }: ListItemProps)}
  <li>
    <NavigationMenu.Link
      class={cn(
        "hover:bg-muted block select-none space-y-1 rounded-md p-3 leading-none no-underline transition-colors",
        className
      )}
      {href}
    >
      <div class="text-sm font-medium leading-none">{title}</div>
      <p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
        {content}
      </p>
    </NavigationMenu.Link>
  </li>
{/snippet}

<NavigationMenu.Root class="relative z-10 flex w-full justify-center">
  <NavigationMenu.List class="flex list-none items-center justify-center p-1">
    <NavigationMenu.Item value="getting-started">
      <NavigationMenu.Trigger class="group inline-flex h-8 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white data-[state=open]:bg-white">
        Getting started
        <CaretDown
          class="relative top-[1px] ml-1 size-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </NavigationMenu.Trigger>
      <NavigationMenu.Content class="absolute left-0 top-0 w-full sm:w-auto">
        <ul class="grid list-none gap-x-2.5 p-3 sm:w-[600px] sm:grid-flow-col sm:grid-rows-3">
          {@render ListItem({
            href: "/docs",
            title: "Introduction",
            content: "Headless components for Svelte and SvelteKit",
          })}
          {@render ListItem({
            href: "/docs/getting-started",
            title: "Getting Started",
            content: "How to install and use Bits UI",
          })}
        </ul>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger class="group inline-flex h-8 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white data-[state=open]:bg-white">
        Components
        <CaretDown
          class="relative top-[1px] ml-1 size-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </NavigationMenu.Trigger>
      <NavigationMenu.Content class="absolute left-0 top-0 w-full sm:w-auto">
        <ul class="grid gap-3 p-3 sm:w-[400px] md:grid-cols-2">
          {#each components as component (component.title)}
            {@render ListItem({
              href: component.href,
              title: component.title,
              content: component.description,
            })}
          {/each}
        </ul>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Link
        class="inline-flex h-8 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white"
        href="/docs"
      >
        Documentation
      </NavigationMenu.Link>
    </NavigationMenu.Item>
    <NavigationMenu.Indicator class="top-full z-10 flex h-2.5 items-end justify-center overflow-hidden transition-[all,transform_250ms_ease] duration-200 data-[state=hidden]:opacity-0">
      <div class="relative top-[70%] size-2.5 rotate-[45deg] rounded-tl-[2px] bg-border"></div>
    </NavigationMenu.Indicator>
  </NavigationMenu.List>
  <div class="absolute left-0 top-full flex w-full justify-center">
    <NavigationMenu.Viewport
      class="relative mt-2.5 h-[var(--bits-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden rounded-md border shadow-lg transition-[width,_height] duration-200 sm:w-[var(--bits-navigation-menu-viewport-width)]"
    />
  </div>
</NavigationMenu.Root>
```

### Vertical Orientation

Create a vertical menu by setting the `orientation` prop on the `Root`.

```svelte
<NavigationMenu.Root orientation="vertical">
  <!-- ... -->
</NavigationMenu.Root>
```

### Flexible Layouts (Viewport Outside the List)

Use the `Viewport` component when you need control over where `Content` is rendered. This is useful for adjusted DOM structures or advanced animations. Tab focus is managed automatically.

```svelte
<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item one</NavigationMenu.Trigger>
      <NavigationMenu.Content>Item one content</NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item two</NavigationMenu.Trigger>
      <NavigationMenu.Content>Item two content</NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
  <!-- NavigationMenu.Content will be rendered here when active -->
  <NavigationMenu.Viewport />
</NavigationMenu.Root>
```

### With Indicator

Use the optional `Indicator` component to highlight the currently active `Trigger`. Place it as the last child of `NavigationMenu.List`.

```svelte
<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item one</NavigationMenu.Trigger>
      <NavigationMenu.Content>Item one content</NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item two</NavigationMenu.Trigger>
      <NavigationMenu.Content>Item two content</NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Indicator />
  </NavigationMenu.List>
  <NavigationMenu.Viewport />
</NavigationMenu.Root>
```

### Submenus

Create a submenu by nesting a navigation menu inside a `Content` panel, using `NavigationMenu.Sub` in place of `NavigationMenu.Root`.

```svelte
<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item one</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Sub>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger>Subitem one</NavigationMenu.Trigger>
              <NavigationMenu.Content>Subitem one content</NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Sub>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu.Root>
```

### Submenus with Viewport

Use a `NavigationMenu.Viewport` inside a `NavigationMenu.Sub` to create a viewport dedicated to that submenu.

```svelte
<NavigationMenu.Sub>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item one</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link>Item one content</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item two</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link>Item two content</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
  <NavigationMenu.Viewport />
</NavigationMenu.Sub>
```

### No Viewport (Content Renders In Place)

The `Viewport` is optional. Without it, `Content` renders in place (e.g., positioned absolutely beneath the trigger) and you get a full close/open animation between items.

```svelte
<NavigationMenu.Root class="relative z-10 flex w-full justify-center">
  <NavigationMenu.List class="flex list-none items-center justify-center p-1">
    <NavigationMenu.Item value="getting-started">
      <NavigationMenu.Trigger class="group inline-flex h-8 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white data-[state=open]:bg-white">
        Getting started
        <CaretDown class="relative top-[1px] ml-1 size-3 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
      </NavigationMenu.Trigger>
      <NavigationMenu.Content
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 absolute left-0 top-full mt-2 w-full rounded-md border bg-background shadow-lg sm:w-auto"
      >
        <ul class="grid gap-3 p-3 sm:w-[400px] md:grid-cols-2">
          <li>
            <NavigationMenu.Link href="/docs" class="block select-none rounded-md p-3 no-underline transition-colors hover:bg-muted">
              Introduction
            </NavigationMenu.Link>
          </li>
        </ul>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu.Root>
```

### Advanced Animation

The component exposes `--bits-navigation-menu-viewport-[width|height]` and `data-motion` (`'from-start'`, `'to-start'`, `'from-end'`, `'to-end'`) to animate the `Viewport` size and `Content` position based on the enter/exit direction. Combining these with `position: absolute` creates smooth overlapping animation effects when moving between items.

```svelte
<NavigationMenu.Root>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item one</NavigationMenu.Trigger>
      <NavigationMenu.Content class="NavigationMenuContent">
        Item one content
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Item two</NavigationMenu.Trigger>
      <NavigationMenu.Content class="NavigationMenuContent">
        Item two content
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
  <NavigationMenu.Viewport class="NavigationMenuViewport" />
</NavigationMenu.Root>
```

```css
/* app.css */
.NavigationMenuContent {
  position: absolute;
  top: 0;
  left: 0;
  animation-duration: 250ms;
  animation-timing-function: ease;
}
.NavigationMenuContent[data-motion="from-start"] {
  animation-name: enter-from-left;
}
.NavigationMenuContent[data-motion="from-end"] {
  animation-name: enter-from-right;
}
.NavigationMenuContent[data-motion="to-start"] {
  animation-name: exit-to-left;
}
.NavigationMenuContent[data-motion="to-end"] {
  animation-name: exit-to-right;
}
.NavigationMenuViewport {
  position: relative;
  width: var(--bits-navigation-menu-viewport-width);
  height: var(--bits-navigation-menu-viewport-height);
  transition:
    width,
    height,
    250ms ease;
}
@keyframes enter-from-right {
  from {
    opacity: 0;
    transform: translateX(200px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes enter-from-left {
  from {
    opacity: 0;
    transform: translateX(-200px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes exit-to-right {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(200px);
  }
}
@keyframes exit-to-left {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-200px);
  }
}
```

### Force Mounting (SEO)

Force-mount `Content` and `Viewport` to persist links in the DOM regardless of whether the menu is open — useful for SEO. When using `forceMount`, manage visibility yourself via the `data-state` attribute (e.g., hide with `data-[state=closed]:hidden`).

```svelte
<NavigationMenu.Content forceMount class="data-[state=closed]:hidden">
  <!-- content persists in DOM -->
</NavigationMenu.Content>
<NavigationMenu.Viewport forceMount class="data-[state=closed]:hidden" />
```

### Open on Click (Disable Hover)

By default, items open their content when the trigger is hovered. Set `openOnHover={false}` on the `Item` to require a click. When `openOnHover` is `false`, the menu will not close when the pointer moves outside the content — the user must interact outside the menu or press `Escape` to close it.

```svelte
<NavigationMenu.Item openOnHover={false}>
  <NavigationMenu.Trigger>Item one</NavigationMenu.Trigger>
  <NavigationMenu.Content>Item one content</NavigationMenu.Content>
</NavigationMenu.Item>
```

## Accessibility

### Keyboard Navigation

| Key                | Behavior                                                                 |
| ------------------ | ------------------------------------------------------------------------ |
| `Tab`              | Moves focus to the next focusable element (trigger or link).             |
| `Shift` + `Tab`    | Moves focus to the previous focusable element.                           |
| `ArrowRight`       | Moves focus to the next trigger/link (horizontal) or opens content.      |
| `ArrowLeft`        | Moves focus to the previous trigger/link (horizontal).                   |
| `ArrowDown`        | Moves focus to the next trigger/link (vertical) or into the content.     |
| `ArrowUp`          | Moves focus to the previous trigger/link (vertical).                     |
| `Enter` / `Space`  | Toggles the content open/closed for the focused trigger, or activates a link. |
| `Escape`           | Closes the open content and returns focus to the trigger.                |
| `Home`             | Moves focus to the first trigger/link.                                   |
| `End`              | Moves focus to the last trigger/link.                                    |

### ARIA

- The `Root` renders a `<nav>` element with an accessible name.
- The `List` renders a `<ul>` and each `Item` renders an `<li>`, preserving semantic list structure.
- The `Trigger` renders a `<button>` with `aria-expanded` reflecting the open state and `aria-controls` pointing to the associated content.
- The `Content` has an appropriate role and is associated with its trigger.
- The `Link` renders an `<a>` element; use the `active` prop to indicate the current page (applies `data-active`).
- Focus is managed automatically: when content opens, focus moves appropriately; when it closes via `Escape`, focus returns to the trigger.
- The `dir` prop sets the reading direction (`'ltr'` / `'rtl'`), which affects arrow key navigation.

## Tips

### Viewport vs. In-Place Content

- **With `Viewport`**: The active item's content is portalled into the shared viewport container. This enables smooth size and position transitions between panels without a full close/open animation. Place the `Viewport` as a sibling of the `List` (or inside a `Sub`).
- **Without `Viewport`**: Content renders in place (typically positioned absolutely beneath its trigger). You get a full close/open animation between items. Style the `Content` with absolute positioning and open/close animations.

### Indicator Placement

Place the `Indicator` as the **last child** of `NavigationMenu.List`. It tracks the active trigger's position and animates between triggers. Use `data-state="visible"` / `data-state="hidden"` to control its visibility with CSS transitions.

### Force Mounting & Visibility

When using `forceMount` on `Content` or `Viewport`, the element stays in the DOM even when closed. You must manage visibility yourself using the `data-state` attribute. A common pattern is to add `data-[state=closed]:hidden` (Tailwind) or `[data-state="closed"] { display: none; }` (CSS) to hide closed content while keeping it in the DOM for SEO.

### Open on Hover Behavior

- **Default (`openOnHover={true}`)**: Content opens when the pointer enters the trigger (after `delayDuration` ms) and closes when the pointer leaves the trigger and content. Rapid movement between triggers is smoothed by `skipDelayDuration`.
- **`openOnHover={false}`**: Content only opens on click. The menu will not close on pointer leave — the user must interact outside the menu or press `Escape`. Use this when you want explicit click-to-open behavior.

### Delay Duration

The `delayDuration` prop (default `200`ms) on `Root` controls how long the pointer must rest on a trigger before the content opens. The `skipDelayDuration` prop (default `300`ms) is the window during which moving to another trigger opens its content instantly (no delay), making rapid navigation feel responsive.

### Submenus

- Use `NavigationMenu.Sub` in place of `NavigationMenu.Root` inside a `Content` panel to create a nested menu.
- A `Sub` can have its own `Viewport` for dedicated content transitions.
- The `Sub` manages its own active value independently from the parent `Root`.

### Advanced Animation with `data-motion`

The `data-motion` attribute on `Content` indicates the animation direction when transitioning between items:

- `'from-start'` — content is entering from the start (left in LTR).
- `'from-end'` — content is entering from the end (right in LTR).
- `'to-start'` — content is exiting toward the start.
- `'to-end'` — content is exiting toward the end.

Combine `data-motion` with `position: absolute` on `Content` and the `--bits-navigation-menu-viewport-width` / `--bits-navigation-menu-viewport-height` CSS variables on the `Viewport` to create smooth overlapping slide animations.

### Render Delegation

Every part supports the `child` snippet for render delegation, allowing you to render your own element while preserving the component's behavior. See the [Child Snippet](https://bits-ui.com/docs/child-snippet) docs for details.
