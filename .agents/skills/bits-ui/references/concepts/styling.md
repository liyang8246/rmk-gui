# Styling

Bits UI ships almost zero styles by design, giving you complete flexibility. For each component that renders an HTML element, the `class` and `style` props are exposed to apply styles directly.

## Styling Approaches

### CSS Frameworks (TailwindCSS / UnoCSS)

Pass classes directly to the component:

```svelte
<Accordion.Trigger class="h-12 w-full bg-blue-500 hover:bg-blue-600">
  Click me
</Accordion.Trigger>
```

### Data Attributes

Each Bits UI component applies specific `data-*` attributes to its rendered elements. These provide reliable selectors for styling:

```css
/* app.css */
[data-accordion-trigger] {
  height: 3rem;
  width: 100%;
  background-color: #3182ce;
  color: #fff;
}
```

Import the stylesheet in your layout:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import "../app.css";
  let { children } = $props();
</script>

{@render children()}
```

Now every `Accordion.Trigger` component gets these styles automatically.

### Global Classes

```css
/* app.css */
.accordion-trigger {
  height: 3rem;
  width: 100%;
  background-color: #3182ce;
  color: #fff;
}
```

```svelte
<Accordion.Trigger class="accordion-trigger">Click me</Accordion.Trigger>
```

### Scoped Styles

To use Svelte's scoped styles, use the `child` snippet to bring the element into your component's scope:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
</script>

<Accordion.Trigger>
  {#snippet child({ props })}
    <button {...props} class="my-accordion-trigger">Click me!</button>
  {/snippet}
</Accordion.Trigger>

<style>
  .my-accordion-trigger {
    height: 3rem;
    width: 100%;
    background-color: #3182ce;
    color: #fff;
  }
</style>
```

### Style Prop

All components that render an element accept a `style` prop as either a string or an object:

```svelte
<!-- String form -->
<Accordion.Trigger style="background-color: #3182ce; color: white; padding: 1rem;">
  Click me
</Accordion.Trigger>

<!-- Object form -->
<Accordion.Trigger
  style={{ backgroundColor: "#3182ce", color: "white", padding: "1rem" }}
>
  Click me
</Accordion.Trigger>
```

These are merged with internal styles using the `mergeProps` function.

## Styling Component States

### State Data Attributes

Components apply state-specific data attributes you can target:

```css
[data-accordion-trigger][data-state="open"] {
  background-color: #f0f0f0;
  font-weight: bold;
}

[data-accordion-trigger][data-state="closed"] {
  background-color: #ffffff;
}

[data-accordion-trigger][data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

See each component's API reference for its specific data attributes.

### CSS Variables

Components expose CSS variables for accessing internal values. For example, to make `Select.Content` match the anchor width:

```css
[data-select-content] {
  width: var(--bits-select-anchor-width);
  min-width: var(--bits-select-anchor-width);
  max-width: var(--bits-select-anchor-width);
}
```

### Combining Data Attributes with CSS Variables

Animate accordion content using the `--bits-accordion-content-height` variable and `data-state`:

```css
[data-accordion-content] {
  overflow: hidden;
  transition: height 300ms ease-out;
  height: 0;
}

[data-accordion-content][data-state="open"] {
  height: var(--bits-accordion-content-height);
}

[data-accordion-content][data-state="closed"] {
  height: 0;
}
```

## CSS Transitions on Mount-Managed Surfaces

Components that manage their mount lifecycle for animations expose transient `data-starting-style` and `data-ending-style` attributes:

```css
[data-popover-content] {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

[data-popover-content][data-starting-style],
[data-popover-content][data-ending-style] {
  opacity: 0;
  transform: scale(0.96);
}
```

This enables enter/exit transitions without losing the close animation during unmount — no `forceMount` or `child` snippet needed.

## Custom Keyframe Animations

For more control, use keyframe animations with CSS variables:

```css
@keyframes accordionOpen {
  0% { height: 0; opacity: 0; }
  80% { height: var(--bits-accordion-content-height); opacity: 0.8; }
  100% { height: var(--bits-accordion-content-height); opacity: 1; }
}

@keyframes accordionClose {
  0% { height: var(--bits-accordion-content-height); opacity: 1; }
  20% { height: var(--bits-accordion-content-height); opacity: 0.8; }
  100% { height: 0; opacity: 0; }
}

[data-accordion-content][data-state="open"] {
  animation: accordionOpen 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

[data-accordion-content][data-state="closed"] {
  animation: accordionClose 300ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
}
```
