# BitsConfig

A global context provider for configuring default props across all Bits UI components within its scope.

## Overview

`BitsConfig` simplifies managing default prop values across all Bits UI components. Use it to set defaults like portal targets or locales centrally, avoiding the need to pass the same props to every component.

## Key Features

- **Scoped defaults**: Applies defaults only to components within its scope
- **Inheritance**: Child `BitsConfig` instances inherit parent values and can selectively override them
- **Fallback resolution**: Automatically resolves values through the hierarchy of configs

## Basic Usage

```svelte
<script lang="ts">
  import { BitsConfig, Dialog, DateField } from "bits-ui";
</script>

<BitsConfig defaultPortalTo="#modal-root" defaultLocale="es">
  <Dialog.Root>
    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
    <Dialog.Portal>
      <!-- This will portal to #modal-root by default -->
      <Dialog.Content>
        <Dialog.Title>Dialog Title</Dialog.Title>
        <Dialog.Description>Dialog content here</Dialog.Description>
        <!-- DateField will use the default locale -->
        <DateField.Root>
          <!-- ... -->
        </DateField.Root>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</BitsConfig>
```

## Inheritance & Overrides

Child instances inherit and override parent values:

```svelte
<!-- Root level config -->
<BitsConfig defaultPortalTo="#main-portal" defaultLocale="de">
  <Dialog.Root>
    <Dialog.Portal>
      <Dialog.Content>Main dialog → #main-portal</Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>

  <!-- Child config overrides portal target, inherits locale -->
  <BitsConfig defaultPortalTo="#tooltip-portal">
    <Tooltip.Root>
      <Tooltip.Trigger>Hover me</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content>→ #tooltip-portal</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </BitsConfig>
</BitsConfig>
```

## Real-world Examples

### Global Defaults in Layout

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { BitsConfig } from "bits-ui";
  import { locale } from "$lib/states/i18n.svelte.js";
  let { children } = $props();
</script>

<BitsConfig defaultPortalTo="body" defaultLocale={locale.current}>
  {@render children()}
</BitsConfig>
```

### Route-specific Locales

```svelte
<!-- routes/(admin)/+layout.svelte -->
<script lang="ts">
  import { BitsConfig } from "bits-ui";
  let { children } = $props();
</script>

<BitsConfig defaultLocale="en">
  {@render children()}
</BitsConfig>
```

### Component-level Overrides

Individual components can override global defaults:

```svelte
<BitsConfig defaultPortalTo="#main-portal">
  <!-- Uses config default -->
  <Dialog.Root>
    <Dialog.Portal>
      <Dialog.Content>Uses #main-portal</Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>

  <!-- Overrides the config -->
  <Dialog.Root>
    <Dialog.Portal to="#special-portal">
      <Dialog.Content>Uses #special-portal</Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</BitsConfig>
```

## Value Resolution Order

Bits UI resolves default values in this priority:

1. **Direct component prop** (e.g., `to="#special-portal"`)
2. **Nearest parent BitsConfig**
3. **Inherited from parent BitsConfig(s)**
4. **Built-in component default** (e.g., portals default to `"body"`, locales default to `"en"`)

## API Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultPortalTo` | `Element \| string` | `document.body` | Where to render portalled content by default |
| `defaultLocale` | `string` | `"en"` | The default locale for date/time components |
| `children` | `Snippet` | `undefined` | The children content to render |
