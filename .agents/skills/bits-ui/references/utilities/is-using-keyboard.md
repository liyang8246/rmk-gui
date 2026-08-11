# IsUsingKeyboard

A utility that tracks whether the user is actively using the keyboard or not.

## Overview

`IsUsingKeyboard` is a utility class that tracks whether the user is currently using the keyboard. It's used internally by Bits UI components to provide keyboard accessibility features like focus rings and keyboard navigation hints.

It provides global state that is shared across all instances of the class to prevent duplicate event listener registration.

## Usage

```svelte
<script lang="ts">
  import { IsUsingKeyboard } from "bits-ui";

  const isUsingKeyboard = new IsUsingKeyboard();
  const shouldShowFocusRing = $derived(isUsingKeyboard.current);
</script>
```

## How It Works

The utility listens for `keydown` and `mousedown` events globally:
- When a `keydown` event is detected, `current` becomes `true`
- When a `mousedown` event is detected, `current` becomes `false`

This lets you conditionally show focus indicators only when the user is keyboard-navigating, which is a common accessibility pattern.

## Use Cases

- Conditionally showing focus rings (hide on mouse use, show on keyboard use)
- Triggering keyboard-only UI hints
- Custom focus management logic that depends on input modality
