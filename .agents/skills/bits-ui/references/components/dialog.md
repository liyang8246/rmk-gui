# Dialog

A modal window for displaying content or requesting user input without navigating away from the current context. The Dialog component follows a compound component pattern, allowing fine-grained control over structure and behavior while maintaining accessibility.

## Overview

The Dialog provides a flexible, accessible way to create modal dialogs in Svelte applications. It is the general-purpose modal component in Bits UI — use it for non-blocking interactions such as opening a settings panel, viewing details, filling out a form, or any scenario where the user interacts with a transient overlay.

### When to use Dialog vs. Alert Dialog

- Use a **Dialog** when the interaction is non-blocking or optional, and no explicit confirmation/cancel decision is required (e.g., settings panel, detail view, creation form).
- Use an **Alert Dialog** when the user must acknowledge or respond before continuing — typically for destructive or irreversible actions. The Alert Dialog announces itself to assistive technologies with the `alertdialog` ARIA role, signaling that attention is required and the rest of the page is blocked.

### Key Features

- **Compound Component Structure**: A set of sub-components that work together to create a fully-featured dialog.
- **Accessibility**: Built with WAI-ARIA guidelines in mind, ensuring keyboard navigation and screen reader support.
- **Customizable**: Each sub-component can be styled and configured independently.
- **Portal Support**: Content can be rendered in a portal, ensuring proper stacking context.
- **Managed Focus**: Automatically manages focus, with the option to take control if needed.
- **Flexible State Management**: Supports both controlled and uncontrolled state, allowing full control over the dialog's open state.

## Component Structure

The Dialog is built from sub-components, each with a specific purpose:

| Part | Description |
| --- | --- |
| **Root** | The main container that manages state and provides context to all child components. |
| **Trigger** | A button that toggles the dialog's open state. |
| **Portal** | Renders its children in a portal, outside the normal DOM hierarchy. |
| **Overlay** | A backdrop that sits behind the dialog content. |
| **Content** | The main container for the dialog's content. |
| **Title** | Renders the dialog's accessible title. |
| **Description** | Renders an accessible description or additional context for the dialog. |
| **Close** | A button that closes the dialog. |

Minimal structure in code:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger />
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title />
      <Dialog.Description />
      <Dialog.Close />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

## API Reference

### Dialog.Root

The root component used to set and manage the state of the dialog.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `open` `$bindable` | `boolean` | `false` | Whether or not the dialog is open. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | A callback function called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void` | `undefined` | A callback function called after the open state changes and all animations have completed. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### Dialog.Trigger

The element which opens the dialog on press.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### Dialog.Portal

A portal which renders the dialog into the body when it is open.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `to` | `Element \| string` | `document.body` | Where to render the content when it is open. Defaults to the body. |
| `disabled` | `boolean` | `false` | Whether the portal is disabled. When disabled, the content renders in its original DOM location. |
| `children` | `Snippet` | `undefined` | The children content to render. |

### Dialog.Content

The content displayed within the dialog modal.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | `undefined` | Callback fired when an escape keydown event occurs in the floating content. Call `event.preventDefault()` to prevent the default behavior of handling the escape keydown event. |
| `escapeKeydownBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an escape keydown event occurs in the floating content. `'close'` closes the content immediately. `'ignore'` prevents the content from closing. `'defer-otherwise-close'` defers to the parent element if it exists, otherwise closes. `'defer-otherwise-ignore'` defers to the parent element if it exists, otherwise ignores. |
| `onInteractOutside` | `(event: PointerEvent) => void` | `undefined` | Callback fired when an outside interaction event (a `pointerdown` event) occurs. Call `event.preventDefault()` to prevent the default behavior of handling the outside interaction. |
| `onFocusOutside` | `(event: FocusEvent) => void` | `undefined` | Callback fired when focus leaves the dismissible layer. Call `event.preventDefault()` to prevent the default behavior on focus leaving the layer. |
| `interactOutsideBehavior` | `'close' \| 'ignore' \| 'defer-otherwise-close' \| 'defer-otherwise-ignore'` | `'close'` | The behavior to use when an interaction occurs outside of the floating content. Same semantics as `escapeKeydownBehavior`. |
| `onOpenAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is opened. Can be prevented. |
| `onCloseAutoFocus` | `(event: Event) => void` | `undefined` | Event handler called when auto-focusing the content as it is closed. Can be prevented. |
| `trapFocus` | `boolean` | `true` | Whether or not to trap focus within the content when open. |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `preventOverflowTextSelection` | `boolean` | `true` | When `true`, prevents text selection from overflowing the bounds of the element. |
| `preventScroll` | `boolean` | `true` | When `true`, prevents the body from scrolling when the content is open. Useful when using the content as a modal. |
| `restoreScrollDelay` | `number` | `0` | The delay in milliseconds before the scrollbar is restored after closing the dialog. Only applicable when using the `child` snippet for custom transitions and `preventScroll` and `forceMount` are `true`. Set to a value greater than the transition duration to prevent content shifting during the transition. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { props: Record<string, unknown>; open: boolean }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### Dialog.Overlay

An overlay which covers the body when the dialog is open.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `forceMount` | `boolean` | `false` | Whether or not to forcefully mount the content. Useful with Svelte transitions or another animation library. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `ChildSnippetProps = { props: Record<string, unknown>; open: boolean }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### Dialog.Close

A button used to close the dialog.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLButtonElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### Dialog.Title

An accessible title for the dialog.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` | The heading level of the title. This is set as the `aria-level` attribute. |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

### Dialog.Description

An accessible description for the dialog.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` `$bindable` | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet` — `SnippetProps = { props: Record<string, unknown> }` | `undefined` | Use render delegation to render your own element. See [Child Snippet](/docs/child-snippet) docs for more information. |

## Data Attributes

Data attributes are available on specific elements to enable state-based styling via CSS attribute selectors.

### Dialog.Trigger

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dialog-trigger` | `''` | Present on the trigger element. |

### Dialog.Content

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The state of the dialog. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-dialog-content` | `''` | Present on the content element. |
| `data-nested-open` | `''` | Present when one or more nested dialogs are open within this dialog. Can be used to style parent dialogs differently when children are open. |
| `data-nested` | `''` | Present when the dialog is a nested dialog. Useful for hiding the overlay of nested dialogs to avoid overlapping with the root dialog's overlay. |

### Dialog.Overlay

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-state` | `'open' \| 'closed'` | The state of the dialog. |
| `data-starting-style` | `''` | Present during the initial open frame. Use this to define the starting styles for CSS transitions. |
| `data-ending-style` | `''` | Present while closing before unmount. Use this to define the ending styles for CSS transitions. |
| `data-dialog-overlay` | `''` | Present on the overlay element. |
| `data-nested-open` | `''` | Present when one or more nested dialogs are open within this dialog. Can be used to style parent dialogs differently when children are open. |
| `data-nested` | `''` | Present when the dialog is a nested dialog. Useful for hiding the overlay of nested dialogs to avoid overlapping with the root dialog's overlay. |

### Dialog.Close

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dialog-close` | `''` | Present on the close button element. |

### Dialog.Title

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dialog-title` | `''` | Present on the title element. |

### Dialog.Description

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-dialog-description` | `''` | Present on the description element. |

## CSS Variables

CSS variables are exposed on `Dialog.Content` and `Dialog.Overlay` to support styling nested dialogs. They update reactively as nested dialogs open and close.

| CSS Variable | Description |
| --- | --- |
| `--bits-dialog-depth` | The nesting depth of the dialog (0 for root dialogs, 1 for first nested, etc.). |
| `--bits-dialog-nested-count` | The number of currently open nested dialogs within this dialog. Updates reactively as nested dialogs open and close. |

## Examples

### Basic Usage

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/80" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-background p-6">
      <Dialog.Title class="text-lg font-semibold">Dialog Title</Dialog.Title>
      <Dialog.Description class="text-sm text-muted-foreground">
        A description of the dialog's purpose.
      </Dialog.Description>
      <div class="mt-4 flex justify-end">
        <Dialog.Close>Close</Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Controlled Open State (Two-Way Binding)

Use `bind:open` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>Open Dialog</button>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Controlled Dialog</Dialog.Title>
      <Dialog.Description>
        This dialog's open state is bound to a variable.
      </Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Fully Controlled (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
  let myOpen = $state(false);

  function getOpen() {
    return myOpen;
  }
  function setOpen(newOpen: boolean) {
    myOpen = newOpen;
  }
</script>

<Dialog.Root bind:open={getOpen, setOpen}>
  <!-- ... -->
</Dialog.Root>
```

### With the `child` Snippet (Render Delegation)

The `child` snippet provides access to component props and open state, enabling custom element rendering and transition control. When `forceMount` is set, the component stays mounted and you control visibility via the `open` value from the snippet.

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content forceMount>
    {#snippet child({ props, open })}
      {#if open}
        <div {...props} class="custom-content">
          Custom-rendered content
        </div>
      {/if}
    {/snippet}
  </Dialog.Content>
</Dialog.Root>
```

### With Svelte Transitions

Combine `forceMount` with the `child` snippet and Svelte's `transition:` directives to animate the `Content` and `Overlay`. The `child` snippet exposes `props` (to spread onto your element) and `open` (to gate visibility).

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
  import { fly, fade } from "svelte/transition";
</script>

<Dialog.Root>
  <!-- ... other dialog components -->
  <Dialog.Overlay forceMount>
    {#snippet child({ props, open })}
      {#if open}
        <div {...props} transition:fade>
          <!-- overlay content -->
        </div>
      {/if}
    {/snippet}
  </Dialog.Overlay>
  <Dialog.Content forceMount>
    {#snippet child({ props, open })}
      {#if open}
        <div {...props} transition:fly>
          <!-- dialog content -->
        </div>
      {/if}
    {/snippet}
  </Dialog.Content>
</Dialog.Root>
```

A reusable, encapsulated overlay with a configurable duration:

```svelte
<!-- MyDialogOverlay.svelte -->
<script lang="ts">
  import { Dialog, type WithoutChildrenOrChild } from "bits-ui";
  import { fade } from "svelte/transition";
  import type { Snippet } from "svelte";

  let {
    ref = $bindable(null),
    duration = 200,
    children,
    ...restProps
  }: WithoutChildrenOrChild<Dialog.OverlayProps> & {
    duration?: number;
    children?: Snippet;
  } = $props();
</script>

<Dialog.Overlay forceMount bind:ref {...restProps}>
  {#snippet child({ props, open })}
    {#if open}
      <div {...props} transition:fade={{ duration }}>
        {@render children?.()}
      </div>
    {/if}
  {/snippet}
</Dialog.Overlay>
```

### `forceMount` (Always Mounted)

Use `forceMount` to keep the `Content` or `Overlay` in the DOM regardless of open state. This is required when applying Svelte transitions (as above) or when using animation libraries that need a persistent element.

```svelte
<Dialog.Content forceMount>
  <!-- content remains mounted; control visibility yourself -->
</Dialog.Content>
```

### Reusable Dialog Component

Combine props and snippets to build a versatile, reusable Dialog that consumers can customize.

```svelte
<!-- MyDialog.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { Dialog, type WithoutChild } from "bits-ui";

  type Props = Dialog.RootProps & {
    buttonText: string;
    title: Snippet;
    description: Snippet;
    contentProps?: WithoutChild<Dialog.ContentProps>;
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

<Dialog.Root bind:open {...restProps}>
  <Dialog.Trigger>
    {buttonText}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content {...contentProps}>
      <Dialog.Title>
        {@render title()}
      </Dialog.Title>
      <Dialog.Description>
        {@render description()}
      </Dialog.Description>
      {@render children?.()}
      <Dialog.Close>Close Dialog</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Usage with inline snippets:

```svelte
<MyDialog buttonText="Open Dialog">
  {#snippet title()}
    Account settings
  {/snippet}
  {#snippet description()}
    Manage your account settings and preferences.
  {/snippet}
  <!-- Additional dialog content here... -->
</MyDialog>
```

Usage with separate snippets passed as props:

```svelte
{#snippet title()}
  Account settings
{/snippet}
{#snippet description()}
  Manage your account settings and preferences.
{/snippet}

<MyDialog buttonText="Open Dialog" {title} {description}>
  <!-- Additional dialog content here... -->
</MyDialog>
```

### Form Submission

Submit a form and close the dialog programmatically after the async action completes:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Confirm your action</Dialog.Title>
      <Dialog.Description>Are you sure you want to do this?</Dialog.Description>
      <form
        method="POST"
        action="?/someAction"
        onsubmit={() => {
          wait(1000).then(() => (open = false));
        }}
      >
        <button type="submit">Submit form</button>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

When a `Dialog` is used *within* a `<form>`, disable the `Portal` (or omit it) so the dialog content stays inside the form and form submission works correctly:

```svelte
<form method="POST" action="?/someAction">
  <Dialog.Root>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Dialog.Portal disabled>
      <Dialog.Overlay />
      <Dialog.Content>
        <!-- inputs here remain inside the form -->
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</form>
```

### Nested Dialogs

Dialogs can be nested. The component automatically tracks nesting depth and count, exposed as data attributes and CSS variables, to create visual hierarchy (e.g., scaling down or dimming parent dialogs when a child opens).

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
  let rootOpen = $state(false);
  let nestedOpen = $state(false);
</script>

<Dialog.Root bind:open={rootOpen}>
  <Dialog.Trigger>Open First Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay
      class="data-nested:hidden fixed inset-0 z-50 bg-black/80 transition-opacity duration-200"
    />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border p-6"
      style="transform: scale(calc(1 - var(--bits-dialog-nested-count) * 0.05));
             filter: blur(calc(var(--bits-dialog-nested-count) * 2px));"
    >
      <Dialog.Title>First Dialog</Dialog.Title>
      <Dialog.Description>
        This is the first dialog in the nested stack.
      </Dialog.Description>

      <Dialog.Root bind:open={nestedOpen}>
        <Dialog.Trigger>Open Second Dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="data-nested:hidden fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content class="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border p-6">
            <Dialog.Title>Second Dialog</Dialog.Title>
            <Dialog.Description>
              This is the second dialog in the nested stack.
            </Dialog.Description>
            <Dialog.Close>Close Second Dialog</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Styling hooks for nested dialogs:

- Hide a nested dialog's overlay to avoid stacking over the parent's: use the `data-nested` attribute (e.g., `data-nested:hidden`).
- Style a parent differently when it has open children: use `data-nested-open`.
- Scale or blur parents based on how many children are open: use `--bits-dialog-nested-count`.
- Vary styling by depth: use `--bits-dialog-depth`.

```svelte
<Dialog.Content
  style="transform: scale(calc(1 - var(--bits-dialog-nested-count) * 0.05));
         filter: blur(calc(var(--bits-dialog-nested-count) * 2px));"
>
  <!-- ... -->
</Dialog.Content>
```

## Accessibility

The Dialog follows the WAI-ARIA modal dialog design pattern.

### Focus Management

- **Focus Trap**: While open, keyboard focus is trapped within `Dialog.Content`, preventing interaction with the rest of the page. Disable with `trapFocus={false}` only if you have an alternative focus strategy — this can compromise accessibility.
- **Open Auto-Focus**: When the dialog opens, focus moves to the first focusable element within `Dialog.Content`. Customize with `onOpenAutoFocus` — call `event.preventDefault()` and manually focus a target element. Always ensure *something* within the dialog receives focus.
- **Close Auto-Focus**: When the dialog closes, focus returns to the element that triggered its opening (typically `Dialog.Trigger`). Customize with `onCloseAutoFocus` — call `event.preventDefault()` and focus a specific element.

Customizing initial focus on open:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
  let nameInput = $state<HTMLInputElement>();
</script>

<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Content
    onOpenAutoFocus={(e) => {
      e.preventDefault();
      nameInput?.focus();
    }}
  >
    <input type="text" bind:this={nameInput} />
  </Dialog.Content>
</Dialog.Root>
```

Customizing focus on close:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
  let nameInput = $state<HTMLInputElement>();
</script>

<input type="text" bind:this={nameInput} />

<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Content
    onCloseAutoFocus={(e) => {
      e.preventDefault();
      nameInput?.focus();
    }}
  >
    <!-- ... -->
  </Dialog.Content>
</Dialog.Root>
```

### Keyboard Navigation

| Key | Action |
| --- | --- |
| `Tab` | Moves focus to the next focusable element within the dialog (trapped). |
| `Shift` + `Tab` | Moves focus to the previous focusable element within the dialog (trapped). |
| `Escape` | Closes the dialog. Customizable via `escapeKeydownBehavior` or `onEscapeKeydown`. |

### ARIA

- `Dialog.Title` sets `aria-level` based on the `level` prop and is linked to the dialog content via `aria-labelledby`.
- `Dialog.Description` is linked to the dialog content via `aria-describedby`.
- `Dialog.Content` is announced as a `dialog` to assistive technologies.
- `Dialog.Trigger` and `Dialog.Close` render as `<button>` elements and toggle the dialog's open state.

### Scroll Lock

By default, body scrolling is disabled while the dialog is open (`preventScroll` defaults to `true`). Allow body scrolling with `preventScroll={false}` — use judiciously, as it may affect focus and accessibility.

## Tips

### Dismissing Behaviors

Two levers control how the dialog dismisses:

- **Escape key**: `escapeKeydownBehavior` (declarative: `'close' | 'ignore' | 'defer-otherwise-close' | 'defer-otherwise-ignore'`) or `onEscapeKeydown` (imperative: call `event.preventDefault()` to block).
- **Outside interaction**: `interactOutsideBehavior` (same enum) or `onInteractOutside` (imperative).

The `defer-*` options are useful for nested dialogs where a child should defer dismissal decisions to an ancestor Bits UI component that also implements these behaviors.

### Transition Patterns

For Svelte transitions, the consistent pattern is: set `forceMount`, then use the `child` snippet to gate visibility with `{#if open}` and apply `transition:` directives on the inner element. Spread `props` from the snippet onto that element so Bits UI's behaviors (focus trap, dismissal, etc.) keep working.

When using `forceMount` + `preventScroll` + custom transitions, set `restoreScrollDelay` to a value greater than the transition duration. This prevents the scrollbar from reappearing before the close animation finishes, which would otherwise cause content to shift.

### Reusable Components

- Accept props for nested components (`contentProps`, etc.) for maximum flexibility.
- Use `clsx` or similar to merge class overrides.
- Expose `$bindable` props (`open`, `ref`) so consumers can bind to them.
- Use the exported types (`Dialog.RootProps`, `Dialog.ContentProps`, `WithoutChild`, `WithoutChildrenOrChild`) to type your wrapper component props.

### Portal and Forms

When a `Dialog` lives *inside* a `<form>`, disable the `Portal` (`disabled` prop or omit `Dialog.Portal`) so dialog inputs remain within the form's DOM subtree and submit correctly.

### Nested Dialog Visual Hierarchy

Use the reactive `--bits-dialog-nested-count` variable to scale/blur parent dialogs and `data-nested` to hide child overlays, creating a clear stacking hierarchy without overlapping backdrops.
