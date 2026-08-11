# Getting Started

Welcome to Bits UI, a collection of headless component primitives for Svelte 5 that prioritizes developer experience, accessibility, and flexibility.

## Installation

```bash
npm install bits-ui
```

## Basic Usage

After installation, import and use Bits UI components in your Svelte files. Here's a simple example using the Accordion component:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
</script>

<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>Item 1 Title</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>
      This is the collapsible content for this section.
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Header>
      <Accordion.Trigger>Item 2 Title</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>
      This is the collapsible content for this section.
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

## Adding Styles

Bits UI components are headless by design — they ship with minimal styling. This gives you complete control over appearance. Each component that renders an HTML element exposes `class` and `style` props.

### Styling with TailwindCSS or UnoCSS

Pass classes directly to the components:

```svelte
<Accordion.Root class="mx-auto w-full max-w-md">
  <Accordion.Item class="mb-2 rounded-md border border-gray-200">
    <Accordion.Header class="bg-gray-50 transition-colors hover:bg-gray-100">
      <Accordion.Trigger
        class="flex w-full items-center justify-between p-4 text-left font-medium"
      >
        <span>Tailwind-styled Accordion</span>
        <svg class="h-5 w-5 transform transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content class="p-4 text-gray-700">
      This accordion is styled using Tailwind CSS classes.
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### Styling with Data Attributes

Each Bits UI component applies specific `data-*` attributes to the underlying HTML elements. Use these as CSS selectors:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { Button } from "bits-ui";
  import "../app.css";
</script>

<Button.Root>Click me</Button.Root>
```

```css
/* app.css */
[data-button-root] {
  height: 3rem;
  width: 100%;
  background-color: #3182ce;
  color: white;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
}

[data-button-root]:hover {
  background-color: #2c5282;
}
```

## TypeScript Support

Bits UI is built with TypeScript and provides comprehensive type definitions:

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";

  const accordionMultipleProps: Accordion.RootProps = {
    type: "multiple",
    value: ["item-1"], // type error if value is not an array
  };

  const accordionSingleProps: Accordion.RootProps = {
    type: "single",
    value: "item-1", // type error if value is an array
  };
</script>
```

## Next Steps

- Explore the [Component Documentation](https://bits-ui.com/docs/components) to learn about all available components
- Learn about render delegation using the [Child Snippet](./child-snippet.md) for maximum flexibility
- Learn how Bits UI handles [State Management](./state-management.md) and how you can take more control
- Read the [Styling](./styling.md) guide for CSS approaches
