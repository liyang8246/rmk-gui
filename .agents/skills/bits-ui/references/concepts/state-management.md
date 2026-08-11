# State Management

State management is a critical aspect of modern UI development. Bits UI components support multiple approaches to manage component state, giving you flexibility based on your needs.

Each component's API reference highlights which props are `bindable`. You can replace the `value` prop used in the examples below with any bindable prop.

## Two-Way Binding

The simplest approach uses Svelte's built-in two-way binding with `bind:`:

```svelte
<script lang="ts">
  import { ComponentName } from "bits-ui";
  let myValue = $state("default-value");
</script>

<button onclick={() => (myValue = "new-value")}>Update Value</button>
<ComponentName.Root bind:value={myValue}></ComponentName.Root>
```

### Why Use It?

- Zero-boilerplate state updates
- External controls work automatically
- Great for simple use cases

When the component's internal state changes (e.g., user selects an item), it updates `myValue` automatically. When you change `myValue` externally (e.g., the button click), the component reflects the new state.

## Function Binding

For complete control, use a [Function Binding](https://svelte.dev/docs/svelte/bind#Function-bindings) that handles both getting and setting values:

```svelte
<script lang="ts">
  import { ComponentName } from "bits-ui";
  let myValue = $state("default-value");

  function getValue() {
    return myValue;
  }

  function setValue(newValue: string) {
    // Only update during business hours
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 9 && hour <= 17) {
      myValue = newValue;
    }
  }
</script>

<ComponentName.Root bind:value={getValue, setValue}></ComponentName.Root>
```

When the component wants to set the value from an internal action, it invokes the setter, where you determine if the setter actually updates the state or not.

### When to Use

- Complex state transformation logic
- Conditional updates (e.g., only during business hours)
- Debouncing or throttling state changes
- Maintaining additional state alongside the primary value
- Integrating with external state systems (stores, context, etc.)

## Uncontrolled State

If you don't bind to a prop, the component manages its own state internally. This is useful for simple cases where you don't need to know the value externally:

```svelte
<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Trigger>Section 1</Accordion.Trigger>
    <Accordion.Content>Content</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

You can still set a default value without binding:

```svelte
<Accordion.Root type="single" value="item-1">
  <!-- item-1 starts open -->
</Accordion.Root>
```

## Choosing an Approach

| Approach | When to use | Control level |
|----------|-------------|---------------|
| Uncontrolled | Simple, self-contained components | None |
| Two-way binding | Need external access to state | Shared |
| Function binding | Need to intercept/transform state changes | Full |
