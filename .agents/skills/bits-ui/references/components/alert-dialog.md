# Alert Dialog

A modal window that presents content or seeks user input without navigating away from the current context. The Alert Dialog is purpose-built for situations requiring explicit user confirmation or attention before an action can proceed.

## Overview

The Alert Dialog is a modal dialog variant designed for interruptive scenarios where the user must acknowledge or respond before continuing. Unlike a standard `Dialog`, the Alert Dialog has semantic meaning: it signals to assistive technologies that the user's attention is required and that interaction with the rest of the page is blocked.

Use an Alert Dialog when:

- The user is about to perform an irreversible or destructive action (e.g., deleting an account, confirming a financial transaction).
- You need to block all other page interaction until the user explicitly confirms or cancels.
- You want screen readers to announce the dialog as an `alertdialog` ARIA pattern, distinct from a generic `dialog`.

Use a regular `Dialog` instead when:

- The interaction is non-blocking or optional (e.g., opening a settings panel, viewing details).
- There is no explicit confirmation/cancel decision required from the user.

### Key Features

- **Compound Component Structure**: Build flexible, customizable alert dialogs using sub-components.
- **Accessibility**: ARIA-compliant with full keyboard navigation support.
- **Portal Support**: Render content outside the normal DOM hierarchy for proper stacking.
- **Managed Focus**: Automatically traps focus with customization options.
- **Flexible State**: Supports both controlled and uncontrolled open states.

## Component Structure

The Alert Dialog is built from sub-components, each with a specific purpose:

| Part | Description |
| --- | --- |
| **Root** | Manages state and provides context to child components. |
| **Trigger** | Toggles the dialog's open/closed state. |
| **Portal** | Renders its children in a portal, outside the normal DOM hierarchy. |
| **Overlay** | Displays a backdrop behind the dialog. |
| **Content** | Holds the dialog's main content. |
| **Title** | Displays the dialog's title (accessible heading). |
| **Description** | Displays a description or additional context for the dialog. |
| **Cancel** | Closes the dialog without action. |
| **Action** | Confirms the dialog's action. |

## API Reference

### AlertDialog.Root

The root component used to set and manage the state of the alert dialog.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `open` `$bindable` | `boolean` | `false` | The open state of the component. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void` | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### AlertDialog.Trigger

The element which opens the alert dialog on press.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### AlertDialog.Content

The content displayed within the alert dialog modal.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event (a `pointerdown` event) occurs. Call `event.preventDefault()` to prevent the default behavior of handling the outside interaction. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior on focus leaving the layer. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. `'close'` closes immediately. `'ignore'` prevents closing. `'defer-otherwise-close'` defers to a parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to a parent element if it exists, otherwise ignores. |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs. Same semantics as `interactOutsideBehavior`. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap focus within the content when open. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `preventScroll` | `boolean` | `true` | When `true`, prevents the body from scrolling when the content is open. |
| `restoreScrollDelay` | `number` | `0` | The delay in milliseconds before the scrollbar is restored after closing the dialog. Only applicable when using the `child` snippet for custom transitions and `preventScroll` and `forceMount` are `true`. Set to a value greater than the transition duration to prevent content shifting during the transition. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { props: Record<string, unknown>; open: boolean }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### AlertDialog.Overlay

An overlay which covers the body when the alert dialog is open.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { props: Record<string, unknown>; open: boolean }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### AlertDialog.Portal

A portal which renders the alert dialog into the body when it is open.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `to` | `Element \| string` | `document.body` | Where to render the content when it is open. Defaults to the body. |
| `disabled` | `boolean` | `false` | Whether the portal is disabled. When disabled, the content renders in its original DOM location. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### AlertDialog.Action

The button responsible for taking an action within the alert dialog. This button does **not** close the dialog out of the box. Close it programmatically after your action completes (see [Form Submission](#form-submission) below).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### AlertDialog.Cancel

A button used to close the alert dialog without taking an action.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### AlertDialog.Title

An accessible title for the alert dialog.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` | The heading level of the title. This is set as the `aria-level` attribute. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### AlertDialog.Description

An accessible description for the alert dialog.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

## Data Attributes

Data attributes are available on specific elements to enable state-based styling via CSS attribute selectors.

### AlertDialog.Trigger

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The state of the alert dialog. |
| `data-alert-dialog-trigger` | `''` | Present on the trigger element. |

### AlertDialog.Content

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The state of the alert dialog. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-alert-dialog-content` | `''` | Present on the content element. |
| `data-nested-open` | `''` | Present when one or more nested dialogs are open within this dialog. Can be used to style parent dialogs differently when children are open. |
| `data-nested` | `''` | Present when the dialog is a nested dialog. Useful for hiding the overlay of nested dialogs to avoid overlapping with the root dialog's overlay. |

### AlertDialog.Overlay

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The state of the alert dialog. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-alert-dialog-overlay` | `''` | Present on the overlay element. |
| `data-nested-open` | `''` | Present when one or more nested dialogs are open within this dialog. Can be used to style parent dialogs differently when children are open. |
| `data-nested` | `''` | Present when the dialog is a nested dialog. Useful for hiding the overlay of nested dialogs to avoid overlapping with the root dialog's overlay. |

### AlertDialog.Action

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-alert-dialog-action` | `''` | Present on the action element. |

### AlertDialog.Cancel

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-alert-dialog-cancel` | `''` | Present on the cancel element. |

### AlertDialog.Title

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-alert-dialog-title` | `''` | Present on the title element. |

### AlertDialog.Description

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-alert-dialog-description` | `''` | Present on the description element. |

## CSS Variables

These CSS custom properties are exposed on `AlertDialog.Content` and `AlertDialog.Overlay` for use in custom styling, particularly for nested dialog scenarios.

| CSS Variable | Description |
| --- | --- |
| `--bits-dialog-depth` | The nesting depth of the dialog (0 for root dialogs, 1 for first nested, etc.). |
| `--bits-dialog-nested-count` | The number of currently open nested dialogs within this dialog. Updates reactively as nested dialogs open and close. |

Example usage:

```svelte
<AlertDialog.Content
  style="transform: scale(calc(1 - var(--bits-dialog-nested-count) * 0.05));"
>
  <!-- Alert dialog content -->
</AlertDialog.Content>
```

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { AlertDialog } from "bits-ui";
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger>Open Dialog</AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title>Confirm Action</AlertDialog.Title>
      <AlertDialog.Description>Are you sure?</AlertDialog.Description>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Confirm</AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

### Styled with Tailwind

```svelte
<script lang="ts">
  import { AlertDialog } from "bits-ui";
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger
    class="bg-dark text-background hover:bg-dark/95 inline-flex h-12 select-none
    items-center justify-center rounded-lg px-[21px] text-[15px] font-semibold
    shadow-sm transition-all active:scale-[0.98]"
  >
    Subscribe
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in
      data-[state=closed]:animate-out data-[state=open]:fade-in-0
      data-[state=closed]:fade-out-0"
    />
    <AlertDialog.Content
      class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]
      max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border
      bg-background p-7 shadow-lg outline-hidden
      data-[state=open]:animate-in data-[state=closed]:animate-out
      data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
      data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
    >
      <div class="flex flex-col gap-4 pb-6">
        <AlertDialog.Title class="text-lg font-semibold tracking-tight">
          Confirm your transaction
        </AlertDialog.Title>
        <AlertDialog.Description class="text-sm text-muted-foreground">
          This action cannot be undone. This will initiate a monthly wire in the
          amount of $10,000 to Huntabyte. Do you wish to continue?
        </AlertDialog.Description>
      </div>
      <div class="flex w-full items-center justify-center gap-2">
        <AlertDialog.Cancel
          class="inline-flex h-10 w-full items-center justify-center rounded-lg
          bg-muted px-4 text-[15px] font-medium shadow-sm transition-all
          active:scale-[0.98]"
        >
          Cancel
        </AlertDialog.Cancel>
        <AlertDialog.Action
          class="inline-flex h-10 w-full items-center justify-center rounded-lg
          bg-dark px-4 text-[15px] font-semibold text-background shadow-sm
          transition-all active:scale-[0.98]"
        >
          Continue
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

### With Child Snippet (Render Delegation)

Use the `child` snippet to render your own element while preserving the component's behavior. This is useful when you need a different tag or want to spread props onto a custom element.

```svelte
<script lang="ts">
  import { AlertDialog } from "bits-ui";
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger>
    {#snippet child({ props })}
      <a {...props} href="/confirm">Open Alert Dialog</a>
    {/snippet}
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title>Confirm Action</AlertDialog.Title>
      <AlertDialog.Description>Are you sure?</AlertDialog.Description>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Confirm</AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

### With Svelte Transitions

To use Svelte transitions, set `forceMount` on the `Content` (and optionally the `Overlay`), then apply transitions conditionally based on the `open` state exposed via the `child` snippet. The `onOpenChangeComplete` callback on the Root lets you react once animations finish.

```svelte
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import { fade, scale } from "svelte/transition";
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger>Open Dialog</AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay forceMount>
      {#snippet child({ props, open })}
        {#if open}
          <div {...props} transition:fade={{ duration: 200 }} />
        {/if}
      {/snippet}
    </AlertDialog.Overlay>
    <AlertDialog.Content forceMount>
      {#snippet child({ props, open })}
        {#if open}
          <div {...props} transition:scale={{ duration: 200, start: 0.95 }}>
            <AlertDialog.Title>Confirm Action</AlertDialog.Title>
            <AlertDialog.Description>Are you sure?</AlertDialog.Description>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action>Confirm</AlertDialog.Action>
          </div>
        {/if}
      {/snippet}
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

When using `preventScroll` together with custom transitions via the `child` snippet and `forceMount`, set `restoreScrollDelay` to a value greater than your transition duration to prevent the scrollbar from reappearing — and shifting layout — before the close transition finishes:

```svelte
<AlertDialog.Content forceMount preventScroll restoreScrollDelay={250}>
  {#snippet child({ props, open })}
    <!-- ... -->
  {/snippet}
</AlertDialog.Content>
```

### Controlled Open State

#### Two-Way Binding

Use `bind:open` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Dialog</button>

<AlertDialog.Root bind:open={isOpen}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title>Confirm Action</AlertDialog.Title>
      <AlertDialog.Description>Are you sure?</AlertDialog.Description>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Confirm</AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

#### Fully Controlled (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for total control over get/set behavior:

```svelte
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<AlertDialog.Root bind:open={getOpen, setOpen}>
  <!-- ... -->
</AlertDialog.Root>
```

### Reusable Component

For consistency across your app, wrap the Alert Dialog in a reusable component that exposes typed props and snippets.

`MyAlertDialog.svelte`:

```svelte
<script lang="ts">
  import type { Snippet } from "svelte";
  import { AlertDialog, type WithoutChild } from "bits-ui";

  type Props = AlertDialog.RootProps & {
    buttonText: string;
    title: Snippet;
    description: Snippet;
    contentProps?: WithoutChild<AlertDialog.ContentProps>;
  };

  let {
    open = $bindable(false),
    children,
    buttonText,
    contentProps,
    title,
    description,
    ...restProps
  }: Props = $props();
</script>

<AlertDialog.Root bind:open {...restProps}>
  <AlertDialog.Trigger>
    {buttonText}
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content {...contentProps}>
      <AlertDialog.Title>
        {@render title()}
      </AlertDialog.Title>
      <AlertDialog.Description>
        {@render description()}
      </AlertDialog.Description>
      {@render children?.()}
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Confirm</AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

Usage with inline snippets:

```svelte
<script lang="ts">
  import MyAlertDialog from "$lib/components/MyAlertDialog.svelte";
</script>

<MyAlertDialog buttonText="Open Dialog">
  {#snippet title()}
    Delete your account
  {/snippet}
  {#snippet description()}
    This action cannot be undone.
  {/snippet}
</MyAlertDialog>
```

Alternatively, define snippets separately and pass them as props:

```svelte
<script lang="ts">
  import MyAlertDialog from "$lib/components/MyAlertDialog.svelte";
</script>

{#snippet title()}
  Delete your account
{/snippet}
{#snippet description()}
  This action cannot be undone.
{/snippet}

<MyAlertDialog buttonText="Open Dialog" {title} {description}>
  <!-- ... additional content here -->
</MyAlertDialog>
```

### Form Submission

When the user clicks the `Action` button, you will often want to submit a form or perform an asynchronous action. Note that `AlertDialog.Action` does **not** close the dialog automatically — close it programmatically after the action completes.

```svelte
<script lang="ts">
  import { AlertDialog } from "bits-ui";

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let open = $state(false);
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title>Confirm your action</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to do this?
      </AlertDialog.Description>
      <form
        method="POST"
        action="?/someAction"
        onsubmit={() => {
          wait(1000).then(() => (open = false));
        }}
      >
        <AlertDialog.Cancel type="button">
          No, cancel (close dialog)
        </AlertDialog.Cancel>
        <AlertDialog.Action type="submit">
          Yes (submit form)
        </AlertDialog.Action>
      </form>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

> **Inside a form**: If the Alert Dialog lives *within* a `<form>`, disable or omit the `Portal`. The portal renders content outside the form, which prevents form submission from working correctly.

## Accessibility

### Keyboard Navigation

| Key | Behavior |
| --- | --- |
| `Tab` | Moves focus to the next focusable element inside the dialog. Focus is trapped within the content. |
| `Shift` + `Tab` | Moves focus to the previous focusable element inside the dialog. |
| `Escape` | Closes the dialog (default behavior; customizable via `escapeKeydownBehavior` / `onEscapeKeydown`). |
| `Enter` / `Space` (on Trigger) | Opens the dialog. |
| `Enter` / `Space` (on Cancel) | Closes the dialog without action. |
| `Enter` / `Space` (on Action) | Triggers the action button (does not auto-close). |

### Focus Management

- **Focus trap**: When the dialog opens, focus is trapped within the content so keyboard users cannot tab out of it. Disable with `trapFocus={false}` on `AlertDialog.Content` (use with caution — this reduces accessibility).
- **Open auto-focus**: By default, focus moves to the `AlertDialog.Content` element when the dialog opens. This lets screen readers announce the content and gives keyboard users a starting point. Override with `onOpenAutoFocus` — call `e.preventDefault()` on the event, then focus your desired element.
- **Close auto-focus**: By default, focus returns to the trigger element when the dialog closes. Override with `onCloseAutoFocus` — call `e.preventDefault()`, then focus your desired element.

### ARIA Pattern

The Alert Dialog implements the WAI-ARIA `alertdialog` pattern:

- `AlertDialog.Content` is rendered with `role="alertdialog"`.
- `AlertDialog.Title` is linked via `aria-labelledby`.
- `AlertDialog.Description` is linked via `aria-describedby`.
- `AlertDialog.Title` exposes `aria-level` based on the `level` prop (default `3`).
- The overlay and content are rendered in a portal so they sit outside any interfering DOM context while preserving correct stacking order.

### Scroll Locking

By default, body scrolling is disabled while the dialog is open to keep user attention on the modal. Disable with `preventScroll={false}` on `AlertDialog.Content`. Enabling body scroll can affect focus and accessibility — use judiciously.

## Tips

- **Action does not auto-close.** `AlertDialog.Action` only fires its click handler; it will not close the dialog. Bind `open` on the Root and set it to `false` after your async work resolves.
- **Cancel auto-closes.** `AlertDialog.Cancel` closes the dialog immediately. If you need to run cleanup first, handle it in the button's `onclick` before the close completes.
- **Disable the Portal inside a form.** If the dialog is nested within a `<form>`, set `disabled` on `AlertDialog.Portal` (or omit it) so the dialog content stays inside the form and form submission works.
- **Use `onOpenChangeComplete` for post-animation work.** This fires only after all open/close animations finish, making it the right hook for cleanup that must wait for visual transitions.
- **`interactOutsideBehavior` defaults to `'close'` for Content.** To make the dialog behave like a strict alert (no dismiss on outside click), set `interactOutsideBehavior="ignore"`. This matches the expectation that an alert dialog requires an explicit decision.
- **Prefer `escapeKeydownBehavior` over `onEscapeKeydown` for simple cases.** The behavior enum covers the common scenarios declaratively; reach for the event handler only when you need custom logic.
- **Use `data-starting-style` and `data-ending-style` for CSS transitions.** These attributes are present only during the first/last animation frames, letting you define enter/exit styles without JavaScript.
- **Style nested dialogs with CSS variables.** `--bits-dialog-depth` and `--bits-dialog-nested-count` let you scale, dim, or offset parent dialogs when a child is open, without JS state.
- **Use `forceMount` with Svelte transitions.** When you need `svelte/transition` or an animation library, set `forceMount` and gate rendering with the `open` value from the `child` snippet. Remember to set `restoreScrollDelay` above your transition duration if `preventScroll` is on.
- **Always include Title and Description.** They are required for an accessible `alertdialog`. If you don't want them visible, render them with an `sr-only` class rather than omitting them.
- **Use `child` snippet for non-button triggers.** `AlertDialog.Trigger` renders a `<button>` by default; use the `child` snippet to render an `<a>` or other element while preserving the open-on-click behavior.
