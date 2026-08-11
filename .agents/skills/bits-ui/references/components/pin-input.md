# PIN Input

The PIN Input component enables users to input a sequence of one-character inputs, providing a customizable and accessible solution for One-Time Password (OTP), Two-Factor Authentication (2FA), or Multi-Factor Authentication (MFA) entry fields.

## Overview

The PIN Input component addresses the lack of a native HTML element for OTP/PIN code entry. Rather than resorting to basic input fields or fragile custom implementations, it offers a robust, accessible, and flexible alternative built on an invisible input technique.

Key characteristics:

- **Invisible Input Technique** — A hidden `<input>` element manages the actual value and interacts with browser autofill, form submission, and password managers.
- **Customizable Appearance** — Visual cells are fully customizable while core functionality remains intact.
- **Accessibility** — Keyboard navigation and screen reader compatibility built in.
- **Flexible Configuration** — Supports various PIN lengths and input types (numeric, alphanumeric) via pattern matching.

### Architecture

1. **Root Container** — A relatively positioned root element that encapsulates the entire component.
2. **Invisible Input** — A hidden input field that manages the actual value and interacts with the browser's built-in features (autofill, password managers, form submission).
3. **Visual Cells** — Customizable elements representing each character of the PIN, rendered as siblings to the invisible input.

This structure allows for a seamless user experience while providing developers with full control over the visual representation.

### Credits

This component is derived from and would not have been possible without the work done by [Guilherme Rodz](https://x.com/guilhermerodz) with [Input OTP](https://github.com/guilhermerodz/input-otp).

## Component Structure

The PIN Input is a compound component made up of two parts:

- `PinInput.Root` — The container component that manages the overall state, renders the invisible input, and provides the `cells` array to its children snippet for rendering visual cells.
- `PinInput.Cell` — A single visual cell representing one character of the PIN. Receives a `cell` object from the `cells` snippet prop of `PinInput.Root`.

Additionally, Bits UI exports helper constants for common input patterns:

- `REGEXP_ONLY_DIGITS` — Only allow digits to be entered.
- `REGEXP_ONLY_CHARS` — Only allow characters to be entered.
- `REGEXP_ONLY_DIGITS_AND_CHARS` — Only allow digits and characters to be entered.

## API Reference

### PinInput.Root

The pin input container component. It renders a relatively positioned root `<div>` encapsulating an invisible `<input>` and the user-provided visual cells.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (bindable) | `string` | `undefined` | The value of the input. Use `bind:value` for two-way binding. |
| `onValueChange` | `(value: string) => void` | `undefined` | A callback function that is called when the value of the input changes. |
| `disabled` | `boolean` | `false` | Whether or not the pin input is disabled. |
| `textalign` | `'left' \| 'center' \| 'right'` | `'left'` | Where the text is located within the input. Affects click-holding or long-press behavior. |
| `maxlength` | `number` | `6` | The maximum length of the pin input (number of cells). |
| `onComplete` | `(...args: any[]) => void` | `undefined` | A callback function that is called when the input is completely filled. |
| `pasteTransformer` | `(text: string) => string` | `undefined` | A callback function that is called when the user pastes text into the input. It receives the pasted text as an argument and should return the sanitized text. Useful for cleaning up pasted text, like removing hyphens or other characters that should not make it into the input. |
| `inputId` | `string` | `undefined` | Optionally provide an ID to apply to the hidden input element. |
| `inputRef` (bindable) | `HTMLInputElement` | `null` | The hidden `<input>` element that holds the OTP value. Bind to this to call `focus()`, read the selection, etc. |
| `pushPasswordManagerStrategy` | `'increase-width' \| 'none'` | `undefined` | Enabled by default, it's an optional strategy for detecting Password Managers in the page and then shifting their badges to the right side, outside the input. |
| `pattern` | `RegExp` | `undefined` | A regular expression to restrict the characters that can be entered or pasted into the input. Use the exported `REGEXP_ONLY_DIGITS`, `REGEXP_ONLY_CHARS`, or `REGEXP_ONLY_DIGITS_AND_CHARS` constants for common cases. |
| `name` | `string` | `undefined` | The name to apply to the hidden input element for HTML form submission. |
| `ref` (bindable) | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet<{ cells: PinInputCell[] }>` | `undefined` | The children content to render. The snippet receives a `cells` array, where each cell is of type `PinInputCell` (see below). |
| `child` | `Snippet<{ cells: PinInputCell[]; props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs for more information. |

#### `PinInputCell` Type

Each item in the `cells` array passed to the `children` or `child` snippet has the following shape:

```ts
type PinInputCell = {
  /** The character displayed in the cell. */
  char: string | null | undefined;
  /** Whether the cell is active. */
  isActive: boolean;
  /** Whether the cell has a fake caret. */
  hasFakeCaret: boolean;
};
```

### PinInput.Cell

A single cell of the pin input. Renders a `<div>` representing one character position.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `cell` | `PinInputCell` | `undefined` | The cell object provided by the `cells` snippet prop from the `PinInput.Root` component. See the `PinInputCell` type above. |
| `ref` (bindable) | `HTMLDivElement` | `null` | The underlying DOM element being rendered. Bind to this to get a reference to the element. |
| `children` | `Snippet` | `undefined` | The children content to render. |
| `child` | `Snippet<{ props: Record<string, unknown> }>` | `undefined` | Use render delegation to render your own element. See Child Snippet docs for more information. |

## Data Attributes

### PinInput.Root

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-pin-input-root` | `''` | Present on the root element. |

### PinInput.Cell

| Data Attribute | Value | Description |
| --- | --- | --- |
| `data-active` | `''` | Present when the cell is active. |
| `data-inactive` | `''` | Present when the cell is inactive. |
| `data-pin-input-cell` | `''` | Present on the cell element. |

## CSS Variables

The PIN Input component does not expose any `--bits-*` CSS variables.

## Examples

### Basic Usage

A minimal 6-digit PIN input:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
</script>

<PinInput.Root maxlength={6}>
  {#snippet children({ cells })}
    {#each cells as cell}
      <PinInput.Cell {cell} />
    {/each}
  {/snippet}
</PinInput.Root>
```

### Numeric Only (Digits Pattern)

Use the `REGEXP_ONLY_DIGITS` pattern to restrict input to digits:

```svelte
<script lang="ts">
  import { PinInput, REGEXP_ONLY_DIGITS } from "bits-ui";
</script>

<PinInput.Root pattern={REGEXP_ONLY_DIGITS} maxlength={6}>
  {#snippet children({ cells })}
    {#each cells as cell}
      <PinInput.Cell {cell} />
    {/each}
  {/snippet}
</PinInput.Root>
```

### Custom Cell Rendering with Fake Caret

Render custom cells that display the character and a blinking fake caret when active:

```svelte
<script lang="ts">
  import {
    PinInput,
    REGEXP_ONLY_DIGITS,
    type PinInputRootSnippetProps,
  } from "bits-ui";
  import cn from "clsx";

  let value = $state("");
  type CellProps = PinInputRootSnippetProps["cells"][0];

  function onComplete() {
    console.log(`Completed with value ${value}`);
    value = "";
  }
</script>

<PinInput.Root
  bind:value
  maxlength={6}
  {onComplete}
  pattern={REGEXP_ONLY_DIGITS}
>
  {#snippet children({ cells })}
    <div class="flex">
      {#each cells as cell}
        {@render Cell(cell)}
      {/each}
    </div>
  {/snippet}
</PinInput.Root>

{#snippet Cell(cell: CellProps)}
  <PinInput.Cell
    {cell}
    class={cn(
      "relative h-14 w-10 text-[2rem]",
      "flex items-center justify-center",
      "border border-border rounded-md",
      "outline-0",
      "data-active:outline-1 data-active:outline-primary"
    )}
  >
    {#if cell.char !== null}
      <div>{cell.char}</div>
    {/if}
    {#if cell.hasFakeCaret}
      <div
        class="animate-caret-blink pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="h-8 w-px bg-primary"></div>
      </div>
    {/if}
  </PinInput.Cell>
{/snippet}
```

### Grouped Cells with Separator

Split cells into groups with a visual separator between them (common in 6-digit OTP layouts):

```svelte
<script lang="ts">
  import {
    PinInput,
    REGEXP_ONLY_DIGITS,
    type PinInputRootSnippetProps,
  } from "bits-ui";

  let value = $state("");
  type CellProps = PinInputRootSnippetProps["cells"][0];
</script>

<PinInput.Root
  bind:value
  class="group/pininput flex items-center"
  maxlength={6}
  pattern={REGEXP_ONLY_DIGITS}
>
  {#snippet children({ cells })}
    <div class="flex">
      {#each cells.slice(0, 3) as cell}
        {@render Cell(cell)}
      {/each}
    </div>
    <div class="flex w-10 items-center justify-center">
      <div class="h-1 w-3 rounded-full bg-border"></div>
    </div>
    <div class="flex">
      {#each cells.slice(3, 6) as cell}
        {@render Cell(cell)}
      {/each}
    </div>
  {/snippet}
</PinInput.Root>

{#snippet Cell(cell: CellProps)}
  <PinInput.Cell
    {cell}
    class="relative h-14 w-10 text-[2rem] flex items-center justify-center border-y border-r border-border first:rounded-l-md first:border-l last:rounded-r-md outline-0"
  >
    {#if cell.char !== null}
      <div>{cell.char}</div>
    {/if}
    {#if cell.hasFakeCaret}
      <div
        class="animate-caret-blink pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="h-8 w-px bg-foreground"></div>
      </div>
    {/if}
  </PinInput.Cell>
{/snippet}
```

### Two-Way Binding

Use `bind:value` for simple, automatic state synchronization:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
  let myValue = $state("");
</script>

<button onclick={() => (myValue = "123456")}>
  Set value to 123456
</button>

<PinInput.Root bind:value={myValue} maxlength={6}>
  {#snippet children({ cells })}
    {#each cells as cell}
      <PinInput.Cell {cell} />
    {/each}
  {/snippet}
</PinInput.Root>
```

### Fully Controlled (Function Binding)

Use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) for complete control over the state's reads and writes:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
  let myValue = $state("");

  function getValue() {
    return myValue;
  }
  function setValue(newValue: string) {
    myValue = newValue;
  }
</script>

<PinInput.Root bind:value={getValue, setValue} maxlength={6}>
  {#snippet children({ cells })}
    {#each cells as cell}
      <PinInput.Cell {cell} />
    {/each}
  {/snippet}
</PinInput.Root>
```

### Paste Transformation

The `pasteTransformer` prop sanitizes or transforms pasted text before it enters the input. This is useful for cleaning up pasted text, like removing hyphens or other characters that should not make it into the input. The function should return the sanitized text, which will be used as the new value of the input:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
</script>

<PinInput.Root
  pasteTransformer={(text) => text.replace(/-/g, "")}
  maxlength={6}
>
  {#snippet children({ cells })}
    {#each cells as cell}
      <PinInput.Cell {cell} />
    {/each}
  {/snippet}
</PinInput.Root>
```

### HTML Forms

The `PinInput.Root` component works seamlessly with HTML forms. Pass the `name` prop and the hidden input will be submitted with the form:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
  let form = $state<HTMLFormElement>(null!);
</script>

<form method="POST" bind:this={form}>
  <PinInput.Root name="mfaCode" maxlength={6}>
    {#snippet children({ cells })}
      {#each cells as cell}
        <PinInput.Cell {cell} />
      {/each}
    {/snippet}
  </PinInput.Root>
</form>
```

### Submit On Complete

Use the `onComplete` callback to submit the form automatically when the input is filled:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
  let form = $state<HTMLFormElement>(null!);
</script>

<form method="POST" bind:this={form}>
  <PinInput.Root
    name="mfaCode"
    maxlength={6}
    onComplete={() => form.submit()}
  >
    {#snippet children({ cells })}
      {#each cells as cell}
        <PinInput.Cell {cell} />
      {/each}
    {/snippet}
  </PinInput.Root>
</form>
```

### With `child` Snippet (Render Delegation)

Use the `child` snippet on `PinInput.Root` for full control over the rendered root element. The snippet receives `props` (to spread onto your element) and the `cells` array:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
</script>

<PinInput.Root maxlength={6}>
  {#snippet child({ props, cells })}
    <div {...props} class="my-custom-root">
      {#each cells as cell}
        <PinInput.Cell {cell} />
      {/each}
    </div>
  {/snippet}
</PinInput.Root>
```

### Accessing the Hidden Input

Bind to `inputRef` to get a reference to the hidden `<input>` element. This is useful for calling `focus()`, reading the selection, or interacting with the input directly:

```svelte
<script lang="ts">
  import { PinInput } from "bits-ui";
  let inputRef = $state<HTMLInputElement>(null!);

  function focusInput() {
    inputRef?.focus();
  }
</script>

<button onclick={focusInput}>Focus PIN Input</button>

<PinInput.Root bind:inputRef={inputRef} maxlength={6}>
  {#snippet children({ cells })}
    {#each cells as cell}
      <PinInput.Cell {cell} />
    {/each}
  {/snippet}
</PinInput.Root>
```

## Accessibility

The PIN Input component is built to be accessible by default. The invisible input technique ensures that screen readers and browser features (autofill, password managers) interact with a standard `<input>` element, while the visual cells provide a customized presentation.

### Keyboard Navigation

| Key | Behavior |
| --- | --- |
| `Tab` | Moves focus into the hidden input. |
| `Shift` + `Tab` | Moves focus away from the input to the previous focusable element. |
| `ArrowLeft` | Moves the caret to the previous cell. |
| `ArrowRight` | Moves the caret to the next cell. |
| `Home` | Moves the caret to the first cell. |
| `End` | Moves the caret to the last cell. |
| `Backspace` | Deletes the character in the current cell and moves the caret to the previous cell. |
| `Delete` | Deletes the character in the current cell. |
| Any character key | Enters the character into the current cell (if it matches the `pattern`) and advances the caret to the next cell. |
| `Ctrl` + `V` / `Cmd` + `V` | Pastes text into the input, distributing characters across cells. The pasted text passes through `pasteTransformer` if provided. |

### ARIA Patterns

- The hidden `<input>` element holds the actual value and is the single focusable element, ensuring screen readers announce it as a standard text input.
- Visual cells are presentational and are not focusable individually; they reflect the state of the hidden input.
- The `data-active` and `data-inactive` attributes on `PinInput.Cell` indicate which cell currently has the caret, useful for styling focus indicators.
- The `hasFakeCaret` property on each cell signals when to render a visual caret placeholder, since the real caret is inside the invisible input.

## Tips

- **Use `bind:value` for state management.** Two-way binding via `bind:value` is the simplest way to track the input value. For more granular control, use the `onValueChange` callback or a Svelte function binding.
- **Set `maxlength` to match your OTP length.** The `maxlength` prop determines the number of cells rendered. The default is `6`; adjust it to match your use case (e.g., `4` for a 4-digit SMS code, `8` for a longer code).
- **Apply a `pattern` to restrict input.** Use the exported `REGEXP_ONLY_DIGITS`, `REGEXP_ONLY_CHARS`, or `REGEXP_ONLY_DIGITS_AND_CHARS` constants, or provide your own `RegExp`. This improves UX by preventing invalid characters. Client-side validation does not replace server-side validation — use it in addition to server-side checks.
- **Sanitize pasted text with `pasteTransformer`.** Users may paste codes copied from emails or messages that include hyphens, spaces, or other formatting. Use `pasteTransformer` to strip unwanted characters before they enter the input.
- **Render a fake caret for visual feedback.** Since the real caret lives in the invisible input, render a blinking caret in the active cell using the `hasFakeCaret` property. This gives users clear visual feedback about where the next character will appear.
- **Use `onComplete` for auto-submission.** To submit a form or trigger verification automatically when the user finishes typing, use the `onComplete` callback. Combine it with a form reference to call `form.submit()`.
- **Group cells with separators.** For longer codes (e.g., 6 digits), split the cells into groups with a visual separator between them using `cells.slice()`. This improves readability and matches common OTP UI patterns.
- **Bind `inputRef` for advanced control.** If you need to programmatically focus the input, read the selection range, or integrate with password manager APIs, bind to `inputRef` to access the hidden `<input>` element directly.
- **Disable the input when appropriate.** Set `disabled` on `PinInput.Root` to prevent interaction during loading or after submission. The `data-disabled` state can be targeted for styling (e.g., reducing opacity).
- **Password manager badge handling.** The `pushPasswordManagerStrategy` prop (enabled by default as `'increase-width'`) shifts password manager badges to the right side, outside the input. Set it to `'none'` to disable this behavior if it causes layout issues.
