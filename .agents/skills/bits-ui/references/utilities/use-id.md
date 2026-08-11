# useId

A utility function to generate unique IDs.

## Overview

The `useId` function generates unique IDs and is used internally by all Bits UI components for accessibility attributes (like `aria-labelledby`, `for`, etc.). It's exposed for your convenience when building custom components.

## Usage

```svelte
<script lang="ts">
  import { useId } from "bits-ui";

  const id = useId();
</script>

<label for={id}>Label here</label>
<input {id} />
```

## When to Use

- Generating unique IDs for `label`/`input` associations
- Creating `aria-labelledby` relationships between elements
- Any scenario requiring a guaranteed-unique DOM element ID
