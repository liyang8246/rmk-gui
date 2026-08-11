# Avatar

Represents an entity with an image and a fallback placeholder. The Avatar component provides a consistent way to display user or entity images throughout your application, handling image loading states gracefully and offering fallback options when images fail to load.

## Overview

The Avatar component provides a consistent way to display user or entity images throughout your application. It handles image loading states gracefully and offers fallback options when images fail to load, ensuring your UI remains resilient.

**When to use it:**

- Displaying user profile pictures, organization logos, or any entity image that may fail to load.
- Anywhere you need a graceful fallback (initials, placeholder) when an image is unavailable or slow.
- When you want consistent avatar presentation across lists, headers, comments, or cards.

**Features:**

- **Smart Image Loading** — Automatically detects and handles image loading states.
- **Fallback System** — Displays alternatives when images are unavailable or slow to load.
- **Compound Structure** — Flexible primitives that can be composed and customized.
- **Customizable** — Choose to show the image immediately without a load check when you're certain the image will load.

## Component Structure

The Avatar component follows a compound component pattern with three parts:

| Part | Element | Role |
|------|---------|------|
| `Avatar.Root` | `<span>` | Container that manages the state of the image and its fallback. |
| `Avatar.Image` | `<img>` | Displays the user or entity image once loaded. |
| `Avatar.Fallback` | `<span>` | Shows when the image is loading or fails to load. |

```svelte
<script lang="ts">
  import { Avatar } from "bits-ui";
</script>

<Avatar.Root>
  <Avatar.Image
    src="https://github.com/huntabyte.png"
    alt="Huntabyte's avatar"
  />
  <Avatar.Fallback>HB</Avatar.Fallback>
</Avatar.Root>
```

## API Reference

### Avatar.Root

The root component used to set and manage the state of the avatar.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `loadingStatus` | `'loading' \| 'loaded' \| 'error'` | `undefined` | The loading status of the avatar's source image. Bindable (`bind:loadingStatus`) to track the status outside the component and use it to show a loading indicator or error message. |
| `onLoadingStatusChange` | `(status: LoadingStatus) => void` | `undefined` | A callback function called when the loading status of the image changes. |
| `delayMs` | `number` | `0` | How long (in milliseconds) to wait before showing the image after it has loaded. Useful to prevent a harsh flickering effect when the image loads quickly. |
| `ref` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### Avatar.Image

The avatar image displayed once it has loaded. Inherits standard `<img>` attributes (e.g., `src`, `alt`, `width`, `height`, `srcset`, `sizes`).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ref` | `HTMLImageElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

### Avatar.Fallback

The fallback displayed while the avatar image is loading or if it fails to load.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ref` | `HTMLSpanElement` | `null` | The underlying DOM element being rendered. Bindable (`bind:ref`) to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See the Child Snippet docs for more information. |

## Data Attributes

State and identity are exposed via `data-*` attributes on each part. Use these for CSS targeting and state-based styling.

### Avatar.Root

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-status` | `'loading' \| 'loaded' \| 'error'` | The loading status of the image. |
| `data-avatar-root` | `''` | Present on the root element. |

### Avatar.Image

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-status` | `'loading' \| 'loaded' \| 'error'` | The loading status of the image. |
| `data-avatar-image` | `''` | Present on the image element. |

### Avatar.Fallback

| Data Attribute | Value | Description |
|----------------|-------|-------------|
| `data-status` | `'loading' \| 'loaded' \| 'error'` | The loading status of the image. |
| `data-avatar-fallback` | `''` | Present on the fallback element. |

## CSS Variables

The Avatar component does not expose any `--bits-*` CSS variables. Use the `data-status` attribute for state-based styling instead.

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { Avatar } from "bits-ui";
</script>

<Avatar.Root>
  <Avatar.Image
    src="https://github.com/huntabyte.png"
    alt="Huntabyte's avatar"
  />
  <Avatar.Fallback>HB</Avatar.Fallback>
</Avatar.Root>
```

### With Fallback and Delay

Use `delayMs` to prevent flicker when the image loads quickly, and style the root based on `data-status`.

```svelte
<script lang="ts">
  import { Avatar } from "bits-ui";
</script>

<Avatar.Root
  delayMs={200}
  class="data-[status=loaded]:border-foreground bg-muted text-muted-foreground h-12 w-12 rounded-full border text-[17px] font-medium uppercase data-[status=loading]:border-transparent"
>
  <div
    class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
  >
    <Avatar.Image src="/avatar-1.png" alt="@huntabyte" />
    <Avatar.Fallback class="border-muted border">HB</Avatar.Fallback>
  </div>
</Avatar.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet to render your own element while preserving all internal props (event handlers, ARIA attributes, data attributes).

```svelte
<script lang="ts">
  import { Avatar } from "bits-ui";
</script>

<Avatar.Root>
  <Avatar.Image
    src="https://github.com/huntabyte.png"
    alt="Huntabyte's avatar"
  >
    {#snippet child({ props })}
      <img {...props} class="rounded-full object-cover" />
    {/snippet}
  </Avatar.Image>
  <Avatar.Fallback>
    {#snippet child({ props })}
      <span {...props} class="flex items-center justify-center">HB</span>
    {/snippet}
  </Avatar.Fallback>
</Avatar.Root>
```

### Reusable Component Wrapper

Create a reusable `UserAvatar` component to maintain consistent styling and behavior across your application.

**UserAvatar.svelte**

```svelte
<script lang="ts">
  import { Avatar, type WithoutChildrenOrChild } from "bits-ui";

  let {
    src,
    alt,
    fallback,
    ref = $bindable(null),
    imageRef = $bindable(null),
    fallbackRef = $bindable(null),
    ...restProps
  }: WithoutChildrenOrChild<Avatar.RootProps> & {
    src: string;
    alt: string;
    fallback: string;
    imageRef?: HTMLImageElement | null;
    fallbackRef?: HTMLElement | null;
  } = $props();
</script>

<Avatar.Root {...restProps} bind:ref>
  <Avatar.Image {src} {alt} bind:ref={imageRef} />
  <Avatar.Fallback bind:ref={fallbackRef}>
    {fallback}
  </Avatar.Fallback>
</Avatar.Root>
```

**Usage:**

```svelte
<script lang="ts">
  import UserAvatar from "$lib/components/UserAvatar.svelte";

  const users = [
    { handle: "huntabyte", initials: "HJ" },
    { handle: "pavelstianko", initials: "PS" },
    { handle: "adriangonz97", initials: "AG" },
  ];
</script>

{#each users as user}
  <UserAvatar
    src="https://github.com/{user.handle}.png"
    alt="{user.name}'s avatar"
    fallback={user.initials}
  />
{/each}
```

### Skip Loading Check

When you're confident that an image will load (such as local assets), bypass the loading check by setting `loadingStatus` to `'loaded'` on the root.

```svelte
<script lang="ts">
  import { Avatar } from "bits-ui";
  // local asset that's guaranteed to be available
  import localAvatar from "/avatar.png";
</script>

<Avatar.Root loadingStatus="loaded">
  <Avatar.Image src={localAvatar} alt="User avatar" />
  <Avatar.Fallback>HB</Avatar.Fallback>
</Avatar.Root>
```

### Tracking Loading Status

Bind `loadingStatus` to react to image load state externally, or use the `onLoadingStatusChange` callback.

```svelte
<script lang="ts">
  import { Avatar } from "bits-ui";

  let status = $state<"loading" | "loaded" | "error">("loading");

  function handleChange(s: "loading" | "loaded" | "error") {
    console.log("Avatar status:", s);
  }
</script>

<Avatar.Root bind:loadingStatus={status} onLoadingStatusChange={handleChange}>
  <Avatar.Image src="/avatar.png" alt="User avatar" />
  <Avatar.Fallback>HB</Avatar.Fallback>
</Avatar.Root>

{#if status === "loading"}
  <p>Loading…</p>
{:else if status === "error"}
  <p>Failed to load image.</p>
{/if}
```

### Clickable Avatar (Composed with Link Preview)

Combine the Avatar with a `LinkPreview` trigger to create a clickable avatar with a hover preview.

```svelte
<script lang="ts">
  import { Avatar, LinkPreview } from "bits-ui";
  import CalendarBlank from "phosphor-svelte/lib/CalendarBlank";
  import MapPin from "phosphor-svelte/lib/MapPin";
</script>

<LinkPreview.Root>
  <LinkPreview.Trigger
    href="https://x.com/huntabyte"
    target="_blank"
    rel="noreferrer noopener"
    class="rounded-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
  >
    <Avatar.Root
      class="data-[status=loaded]:border-foreground bg-muted text-muted-foreground h-12 w-12 rounded-full border border-transparent text-[17px] font-medium uppercase"
    >
      <div
        class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
      >
        <Avatar.Image src="/avatar-1.png" alt="@huntabyte" />
        <Avatar.Fallback class="border-muted border">HB</Avatar.Fallback>
      </div>
    </Avatar.Root>
  </LinkPreview.Trigger>
  <LinkPreview.Content
    class="border-muted bg-background shadow-popover w-[331px] rounded-xl border p-[17px]"
    sideOffset={8}
  >
    <div class="flex space-x-4">
      <Avatar.Root
        class="data-[status=loaded]:border-foreground bg-muted text-muted-foreground h-12 w-12 rounded-full border border-transparent text-[17px] font-medium uppercase"
      >
        <div
          class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
        >
          <Avatar.Image src="/avatar-1.png" alt="@huntabyte" />
          <Avatar.Fallback class="border-muted border">HB</Avatar.Fallback>
        </div>
      </Avatar.Root>
      <div class="space-y-1 text-sm">
        <h4 class="font-medium">@huntabyte</h4>
        <p>I do things on the internet.</p>
        <div
          class="text-muted-foreground flex items-center gap-[21px] pt-2 text-xs"
        >
          <div class="flex items-center text-xs">
            <MapPin class="mr-1 size-4" />
            <span>FL, USA</span>
          </div>
          <div class="flex items-center text-xs">
            <CalendarBlank class="mr-1 size-4" />
            <span>Joined May 2020</span>
          </div>
        </div>
      </div>
    </div>
  </LinkPreview.Content>
</LinkPreview.Root>
```

## Tips

- **Prevent flicker with `delayMs`.** When an image loads nearly instantly, the fallback can flash before the image appears. Set `delayMs` (e.g., `200`) on `Avatar.Root` to delay the image display and produce a smoother transition.
- **Skip the loading check for local assets.** If you're confident an image will load (bundled assets, data URIs), set `loadingStatus="loaded"` on `Avatar.Root` to bypass the loading state entirely.
- **Style with `data-status`.** Target `data-[status=loading]`, `data-[status=loaded]`, and `data-[status=error]` on the root to adjust borders, backgrounds, or opacity per state — no JavaScript needed.
- **Bind `loadingStatus` for external UI.** Use `bind:loadingStatus` when you need to show a spinner, skeleton, or error message outside the avatar itself.
- **Always set `alt` on `Avatar.Image`.** The `Avatar.Image` renders an `<img>` element; provide a meaningful `alt` for accessibility. If the avatar is purely decorative, use `alt=""`.
- **Fallback content is flexible.** The `Avatar.Fallback` accepts any snippet — initials, an icon, a skeleton block, or another component.
- **Build a reusable wrapper.** For consistent avatars across an app, wrap `Avatar.Root`, `Avatar.Image`, and `Avatar.Fallback` in a custom component and forward props with `...restProps`. Use the `WithoutChildrenOrChild<Avatar.RootProps>` type helper to expose `src`, `alt`, and `fallback` as explicit props.
- **Use `child` snippet for custom elements.** When you need scoped styles, Svelte actions, or a non-default element, use the `child` snippet on any part and spread `{...props}` onto your custom element to preserve behavior and accessibility.
