# Tabs

The Tabs component organizes content into tabbed sections, allowing users to switch between different views while sharing the same screen area. It provides accessible keyboard navigation, flexible state management, and support for both automatic and manual activation modes.

## Overview

The Tabs component is a compound component that manages a set of tab triggers and their associated content panels. Only one tab's content is visible at a time. Use it for settings panels, dashboards, product detail pages, or any UI where switching between related views reduces clutter and cognitive load.

Key characteristics:

- **Controlled or uncontrolled** — accept a default active value or fully control the active tab via `bind:value`.
- **Accessible by default** — ARIA attributes and full keyboard navigation built in, following the WAI-ARIA Tabs Pattern.
- **Orientation aware** — horizontal or vertical layouts, with keyboard navigation adapting automatically.
- **Activation modes** — automatic (tab activates on focus) or manual (tab activates on click/press).
- **Render delegation** — every part supports the `child` snippet for full control over the rendered element.

## Component Structure

The Tabs component is a compound component made up of four parts:

- `Tabs.Root` — Container that manages the active tab value and shared configuration (orientation, activation mode, loop, disabled).
- `Tabs.List` — The container for tab triggers, acting as the tablist region for accessibility.
- `Tabs.Trigger` — The clickable button element that activates its associated tab content panel.
- `Tabs.Content` — The content panel associated with a trigger, displayed when its tab is active.

```svelte
<script lang="ts">
  import { Tabs } from "bits-ui";
</script>

<Tabs.Root>
  <Tabs.List>
    <Tabs.Trigger value="tab-1" />
  </Tabs.List>
  <Tabs.Content value="tab-1" />
</Tabs.Root>
```

## API Reference

### Tabs.Root

The root tabs component which contains the other tab components and manages the active tab state.

| Property          | Type                                            | Default        | Description |
| ----------------- | ----------------------------------------------- | -------------- | ----------- |
| `value` (bindable) | `string`                                        | `undefined`    | The active tab value. Bind to read or programmatically set the active tab. |
| `onValueChange`   | `(value: string) => void`                       | `undefined`    | Callback fired when the active tab value changes. Receives the new value. |
| `activationMode`  | `'automatic' \| 'manual'`                       | `'automatic'`  | How tab activation is handled. `'automatic'` activates the tab when its trigger is focused. `'manual'` activates the tab only when the trigger is pressed (click or Enter/Space). |
| `disabled`        | `boolean`                                       | `false`        | Whether all tabs are disabled. When disabled, no tab can be interacted with. |
| `loop`            | `boolean`                                       | `true`         | Whether keyboard navigation loops through triggers when reaching the first or last tab. |
| `orientation`     | `'horizontal' \| 'vertical'`                    | `'horizontal'` | The orientation of the tabs. Influences keyboard navigation: horizontal uses ArrowLeft/ArrowRight; vertical uses ArrowUp/ArrowDown. |
| `ref` (bindable)  | `HTMLDivElement`                                | `null`         | The underlying DOM element. Bind to get a reference. |
| `children`        | `Snippet`                                       | `undefined`    | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>`   | `undefined`    | Use render delegation to render your own element. See Child Snippet docs. |

### Tabs.List

The component containing the tab triggers. Renders as the ARIA `tablist` role.

| Property          | Type                                            | Default     | Description |
| ----------------- | ----------------------------------------------- | ----------- | ----------- |
| `ref` (bindable)  | `HTMLDivElement`                                | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`        | `Snippet`                                       | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>`   | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Tabs.Trigger

The trigger button for a tab. Renders as the ARIA `tab` role and activates its associated content panel when clicked or focused (depending on `activationMode`).

| Property          | Type                                            | Default     | Description |
| ----------------- | ----------------------------------------------- | ----------- | ----------- |
| `value` (required) | `string`                                        | `undefined` | The value of the tab this trigger represents. Must match the `value` of the corresponding `Tabs.Content`. |
| `disabled`        | `boolean`                                       | `false`     | Whether this specific tab trigger is disabled. Independent of the root-level `disabled` prop. |
| `ref` (bindable)  | `HTMLButtonElement`                             | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`        | `Snippet`                                       | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>`   | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

### Tabs.Content

The panel containing the contents of a tab. Renders as the ARIA `tabpanel` role and is displayed only when its tab is the active value.

| Property          | Type                                            | Default     | Description |
| ----------------- | ----------------------------------------------- | ----------- | ----------- |
| `value` (required) | `string`                                        | `undefined` | The value of the tab this content represents. Must match the `value` of the corresponding `Tabs.Trigger`. |
| `ref` (bindable)  | `HTMLDivElement`                                | `null`      | The underlying DOM element. Bind to get a reference. |
| `children`        | `Snippet`                                       | `undefined` | The children content to render. |
| `child`           | `Snippet<{ props: Record<string, unknown> }>`   | `undefined` | Use render delegation to render your own element. See Child Snippet docs. |

## Data Attributes

### Tabs.Root

| Data Attribute     | Value                              | Description |
| ------------------ | ---------------------------------- | ----------- |
| `data-orientation` | `'horizontal' \| 'vertical'`       | The orientation of the tabs. |
| `data-tabs-root`   | `''`                               | Present on the root element. |

### Tabs.List

| Data Attribute     | Value                              | Description |
| ------------------ | ---------------------------------- | ----------- |
| `data-orientation` | `'horizontal' \| 'vertical'`       | The orientation of the tabs. |
| `data-tabs-list`   | `''`                               | Present on the list element. |

### Tabs.Trigger

| Data Attribute      | Value                              | Description |
| ------------------- | ---------------------------------- | ----------- |
| `data-state`        | `'active' \| 'inactive'`           | The state of the tab trigger. `'active'` when this tab is the current value; `'inactive'` otherwise. |
| `data-value`        | `''`                               | The value of the tab this trigger represents. |
| `data-orientation`  | `'horizontal' \| 'vertical'`       | The orientation of the tabs. |
| `data-disabled`     | `''`                               | Present when the tab trigger is disabled. |
| `data-tabs-trigger` | `''`                               | Present on the trigger elements. |

### Tabs.Content

| Data Attribute      | Value | Description |
| ------------------- | ----- | ----------- |
| `data-tabs-content` | `''`  | Present on the content elements. |

## CSS Variables

The Tabs component does not expose any `--bits-*` CSS variables.

## Examples

### Basic Usage

A minimal tabs component with two tabs:

```svelte
<script lang="ts">
  import { Tabs } from "bits-ui";
</script>

<Tabs.Root value="tab-1">
  <Tabs.List>
    <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab-2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1">Content for Tab 1</Tabs.Content>
  <Tabs.Content value="tab-2">Content for Tab 2</Tabs.Content>
</Tabs.Root>
```

### Controlled with `bind:value`

Use `bind:value` for two-way binding. Set an initial value to pre-select a tab, and update the bound variable to programmatically switch tabs:

```svelte
<script lang="ts">
  import { Tabs } from "bits-ui";
  let myValue = $state("tab-1");
</script>

<button onclick={() => (myValue = "tab-2")}>Activate Tab 2</button>

<Tabs.Root bind:value={myValue}>
  <Tabs.List>
    <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab-2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1">Content for Tab 1</Tabs.Content>
  <Tabs.Content value="tab-2">Content for Tab 2</Tabs.Content>
</Tabs.Root>
```

### Fully Controlled (Function Binding)

Use a Svelte function binding for complete control over the state's reads and writes:

```svelte
<script lang="ts">
  import { Tabs } from "bits-ui";
  let myValue = $state("");

  function getValue() {
    return myValue;
  }
  function setValue(newValue: string) {
    myValue = newValue;
  }
</script>

<Tabs.Root bind:value={getValue, setValue}>
  <Tabs.List>
    <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab-2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1">Content for Tab 1</Tabs.Content>
  <Tabs.Content value="tab-2">Content for Tab 2</Tabs.Content>
</Tabs.Root>
```

### With `child` Snippet (Render Delegation)

Use the `child` snippet for full control over the rendered element. The snippet receives `props` to spread onto your own element:

```svelte
<Tabs.Root value="tab-1">
  <Tabs.List>
    <Tabs.Trigger value="tab-1">
      {#snippet child({ props })}
        <button {...props} class="my-custom-trigger">Tab 1</button>
      {/snippet}
    </Tabs.Trigger>
    <Tabs.Trigger value="tab-2">
      {#snippet child({ props })}
        <button {...props} class="my-custom-trigger">Tab 2</button>
      {/snippet}
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1">
    {#snippet child({ props })}
      <div {...props} class="my-custom-content">Content for Tab 1</div>
    {/snippet}
  </Tabs.Content>
  <Tabs.Content value="tab-2">
    {#snippet child({ props })}
      <div {...props} class="my-custom-content">Content for Tab 2</div>
    {/snippet}
  </Tabs.Content>
</Tabs.Root>
```

### Vertical Orientation

Set `orientation="vertical"` for a vertical tab layout. Keyboard navigation switches to ArrowUp/ArrowDown automatically:

```svelte
<script lang="ts">
  import { Tabs } from "bits-ui";
</script>

<Tabs.Root orientation="vertical" value="tab-1">
  <Tabs.List>
    <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab-2">Tab 2</Tabs.Trigger>
    <Tabs.Trigger value="tab-3">Tab 3</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1">Content for Tab 1</Tabs.Content>
  <Tabs.Content value="tab-2">Content for Tab 2</Tabs.Content>
  <Tabs.Content value="tab-3">Content for Tab 3</Tabs.Content>
</Tabs.Root>
```

### Manual Activation

Set `activationMode="manual"` so tabs are activated only on click or Enter/Space, not on focus. This is useful when automatic activation would cause unnecessary content shifts:

```svelte
<Tabs.Root activationMode="manual" value="tab-1">
  <Tabs.List>
    <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab-2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1">Content for Tab 1</Tabs.Content>
  <Tabs.Content value="tab-2">Content for Tab 2</Tabs.Content>
</Tabs.Root>
```

### Disabled Tabs

Disable individual triggers with the `disabled` prop, or the entire tab set via `Tabs.Root`:

```svelte
<Tabs.Root value="tab-1">
  <Tabs.List>
    <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab-2" disabled>Tab 2 (Disabled)</Tabs.Trigger>
    <Tabs.Trigger value="tab-3">Tab 3</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab-1">Content for Tab 1</Tabs.Content>
  <Tabs.Content value="tab-2">Content for Tab 2</Tabs.Content>
  <Tabs.Content value="tab-3">Content for Tab 3</Tabs.Content>
</Tabs.Root>
```

To disable all tabs at once:

```svelte
<Tabs.Root disabled value="tab-1">
  <!-- all triggers are disabled -->
</Tabs.Root>
```

### Styled with Data Attributes

Use `data-state` and `data-orientation` attributes to style triggers based on their active state:

```svelte
<script lang="ts">
  import { Tabs } from "bits-ui";
</script>

<Tabs.Root value="outbound">
  <Tabs.List class="flex gap-1 p-1">
    <Tabs.Trigger
      value="outbound"
      class="rounded-md px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
    >
      Outbound
    </Tabs.Trigger>
    <Tabs.Trigger
      value="inbound"
      class="rounded-md px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
    >
      Inbound
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="outbound" class="pt-4">
    Outbound flight details.
  </Tabs.Content>
  <Tabs.Content value="inbound" class="pt-4">
    Inbound flight details.
  </Tabs.Content>
</Tabs.Root>
```

### Reusable Wrapper Components

For larger apps, wrap the primitives into reusable components:

```svelte
<!-- MyTabs.svelte -->
<script lang="ts">
  import { Tabs, type WithoutChildrenOrChild } from "bits-ui";

  type TabItem = {
    value: string;
    label: string;
    content: string;
    disabled?: boolean;
  };

  let {
    value = $bindable(),
    ref = $bindable(null),
    items,
    ...restProps
  }: WithoutChildrenOrChild<Tabs.RootProps> & {
    items: TabItem[];
  } = $props();
</script>

<Tabs.Root bind:value bind:ref {...restProps}>
  <Tabs.List>
    {#each items as item (item.value)}
      <Tabs.Trigger value={item.value} disabled={item.disabled}>
        {item.label}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
  {#each items as item (item.value)}
    <Tabs.Content value={item.value}>
      {item.content}
    </Tabs.Content>
  {/each}
</Tabs.Root>
```

Usage:

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import MyTabs from "$lib/components/MyTabs.svelte";

  const items = [
    { value: "tab-1", label: "Account", content: "Account settings." },
    { value: "tab-2", label: "Profile", content: "Profile settings." },
    { value: "tab-3", label: "Billing", content: "Billing settings." },
  ];
</script>

<MyTabs value="tab-1" {items} />
```

## Accessibility

The Tabs component follows the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard Navigation

| Key | Behavior |
| --- | -------- |
| `Tab` | Moves focus to the next focusable element. When focus enters the tabs, it lands on the active tab trigger. |
| `Shift` + `Tab` | Moves focus to the previous focusable element. |
| `ArrowRight` | (Horizontal) Moves focus to the next trigger. If `loop` is enabled, wraps from the last to the first. |
| `ArrowLeft` | (Horizontal) Moves focus to the previous trigger. If `loop` is enabled, wraps from the first to the last. |
| `ArrowDown` | (Vertical) Moves focus to the next trigger. If `loop` is enabled, wraps from the last to the first. |
| `ArrowUp` | (Vertical) Moves focus to the previous trigger. If `loop` is enabled, wraps from the first to the last. |
| `Home` | Moves focus to the first trigger. |
| `End` | Moves focus to the last trigger. |
| `Enter` | (Manual activation mode) Activates the focused tab. |
| `Space` | (Manual activation mode) Activates the focused tab. |

When `activationMode` is `'automatic'` (the default), focusing a trigger via arrow keys immediately activates that tab. When set to `'manual'`, arrow keys only move focus; the user must press `Enter` or `Space` (or click) to activate the tab.

### ARIA Patterns

- `Tabs.List` renders with `role="tablist"` and `aria-orientation` set to match the `orientation` prop.
- `Tabs.Trigger` renders a `<button>` with `role="tab"`, `aria-selected` reflecting active/inactive state, and `aria-controls` linking to its associated content panel.
- `Tabs.Content` renders with `role="tabpanel"` and `aria-labelledby` linking back to its associated trigger.
- `disabled` triggers set `aria-disabled` and are skipped during keyboard roving.
- `data-state` (`'active'` / `'inactive'`) on `Tabs.Trigger` mirrors `aria-selected` for CSS targeting.

## Tips

- **Always set explicit `value` props.** Every `Tabs.Trigger` and its matching `Tabs.Content` must share the same `value`. Omitting `value` breaks the trigger-to-content association since there is no auto-generated fallback for tabs.
- **Pre-select a tab with `value`.** Set `value` on `Tabs.Root` (or bind to it) to control which tab is active on mount. Without it, no tab is active initially.
- **`onValueChange` vs. `bind:value`.** Use `onValueChange` for side effects (e.g., logging, fetching data) and `bind:value` when you need to read or write the active tab from parent state. Both can be used together.
- **Disabling all tabs vs. one tab.** `disabled` on `Tabs.Root` disables all triggers; `disabled` on `Tabs.Trigger` disables only that trigger.
- **Automatic vs. manual activation.** Automatic activation (the default) is best for simple tab sets where users expect instant content switching. Manual activation is preferable for complex panels where switching is expensive (e.g., heavy data loads), giving users a chance to navigate without triggering renders.
- **Orientation affects keyboard navigation.** Horizontal tabs respond to ArrowLeft/ArrowRight; vertical tabs respond to ArrowUp/ArrowDown. Set `orientation` to match your visual layout so keyboard behavior aligns with user expectations.
- **Styling with data attributes.** Target `data-[state=active]` and `data-[state=inactive]` on `Tabs.Trigger` to apply active/inactive styles. Use `data-disabled` to style disabled triggers. Use `data-orientation` to adjust layout for horizontal vs. vertical modes.
- **Animating content transitions.** Since `Tabs.Content` is mounted/unmounted on activation, CSS transitions on the panel itself won't play. For enter animations, use the `child` snippet with Svelte transitions, or apply animations to inner content that mounts with the panel.
- **Render delegation with `child`.** Every part supports the `child` snippet for cases where you need a custom element (e.g., an `<a>` instead of a `<button>` for a trigger, or a `<section>` instead of a `<div>` for content). Always spread the received `props` onto your element to preserve accessibility attributes.
