# Snippets

## Table of Contents
1. [Declaration](#declaration)
2. [Snippet scope](#snippet-scope)
3. [Passing snippets to components](#passing-snippets-to-components)
4. [Implicit children snippet](#implicit-children-snippet)
5. [Optional snippet props](#optional-snippet-props)
6. [Typing snippets](#typing-snippets)
7. [Exporting snippets](#exporting-snippets)
8. [Programmatic snippets](#programmatic-snippets)
9. [Snippets and slots](#snippets-and-slots)

## Declaration

```svelte
{#snippet name()}...{/snippet}
{#snippet name(param1, param2, paramN)}...{/snippet}
```

Snippets, and render tags, are a way to create reusable chunks of markup inside your components. Instead of writing duplicative code:

```svelte
{#each images as image}
	{#if image.href}
		<a href={image.href}>
			<figure>
				<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
				<figcaption>{image.caption}</figcaption>
			</figure>
		</a>
	{:else}
		<figure>
			<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
			<figcaption>{image.caption}</figcaption>
		</figure>
	{/if}
{/each}
```

You can write this:

```svelte
{#snippet figure(image)}
	<figure>
		<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
		<figcaption>{image.caption}</figcaption>
	</figure>
{/snippet}

{#each images as image}
	{#if image.href}
		<a href={image.href}>
			{@render figure(image)}
		</a>
	{:else}
		{@render figure(image)}
	{/if}
{/each}
```

Like function declarations, snippets can have an arbitrary number of parameters, which can have default values, and you can destructure each parameter. You cannot use rest parameters, however.

## Snippet scope

Snippets can be declared anywhere inside your component. They can reference values declared outside themselves:

```svelte
<script>
	let { message = `it's great to see you!` } = $props();
</script>

{#snippet hello(name)}
	<p>hello {name}! {message}!</p>
{/snippet}

{@render hello('alice')}
{@render hello('bob')}
```

They are visible to everything in the same lexical scope (siblings, and children of those siblings):

```svelte
<div>
	{#snippet x()}
		{#snippet y()}...{/snippet}

		<!-- this is fine -->
		{@render y()}
	{/snippet}

	<!-- this will error, as `y` is not in scope -->
	{@render y()}
</div>
```

Snippets can reference themselves and each other:

```svelte
{#snippet blastoff()}
	<span>rocket</span>
{/snippet}

{#snippet countdown(n)}
	{#if n > 0}
		<span>{n}...</span>
		{@render countdown(n - 1)}
	{:else}
		{@render blastoff()}
	{/if}
{/snippet}

{@render countdown(10)}
```

## Passing snippets to components

### Explicit props

Within the template, snippets are values just like any other. They can be passed to components as props:

```svelte
<!-- App.svelte -->
<script>
	import Table from './Table.svelte';

	const fruits = [
		{ name: 'apples', qty: 5, price: 2 },
		{ name: 'bananas', qty: 10, price: 1 },
		{ name: 'cherries', qty: 20, price: 0.5 }
	];
</script>

{#snippet header()}
	<th>fruit</th>
	<th>qty</th>
	<th>price</th>
	<th>total</th>
{/snippet}

{#snippet row(d)}
	<td>{d.name}</td>
	<td>{d.qty}</td>
	<td>{d.price}</td>
	<td>{d.qty * d.price}</td>
{/snippet}

<Table data={fruits} {header} {row} />
```

```svelte
<!-- Table.svelte -->
<script>
	let { data, header, row } = $props();
</script>

<table>
	{#if header}
		<thead>
			<tr>{@render header()}</tr>
		</thead>
	{/if}

	<tbody>
		{#each data as d}
			<tr>{@render row(d)}</tr>
		{/each}
	</tbody>
</table>
```

### Implicit props

As an authoring convenience, snippets declared directly inside a component implicitly become props on the component:

```svelte
<Table data={fruits}>
	{#snippet header()}
		<th>fruit</th>
		<th>qty</th>
		<th>price</th>
		<th>total</th>
	{/snippet}

	{#snippet row(d)}
		<td>{d.name}</td>
		<td>{d.qty}</td>
		<td>{d.price}</td>
		<td>{d.qty * d.price}</td>
	{/snippet}
</Table>
```

## Implicit children snippet

Any content inside the component tags that is not a snippet declaration implicitly becomes part of the `children` snippet:

```svelte
<!-- App.svelte -->
<Button>click me</Button>
```

```svelte
<!-- Button.svelte -->
<script>
	let { children } = $props();
</script>

<button>{@render children()}</button>
```

You cannot have a prop called `children` if you also have content inside the component — avoid having props with that name.

## Optional snippet props

Use optional chaining to not render anything if the snippet isn't set:

```svelte
{@render children?.()}
```

Or use an `#if` block to render fallback content:

```svelte
{#if children}
    {@render children()}
{:else}
    fallback content
{/if}
```

## Typing snippets

Snippets implement the `Snippet` interface imported from `'svelte'`:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		data: any[];
		children: Snippet;
		row: Snippet<[any]>;
	}

	let { data, children, row }: Props = $props();
</script>
```

The type argument provided to `Snippet` is a tuple, since snippets can have multiple parameters.

With a generic, `data` and `row` can refer to the same type:

```svelte
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	let {
		data,
		children,
		row
	}: {
		data: T[];
		children: Snippet;
		row: Snippet<[T]>;
	} = $props();
</script>
```

## Exporting snippets

Snippets declared at the top level of a `.svelte` file can be exported from a `<script module>` for use in other components, provided they don't reference any declarations in a non-module `<script>`:

```svelte
<!-- App.svelte -->
<script>
	import { add } from './snippets.svelte';
</script>

{@render add(1, 2)}
```

```svelte
<!-- snippets.svelte -->
<script module>
	export { add };
</script>

{#snippet add(a, b)}
	{a} + {b} = {a + b}
{/snippet}
```

This requires Svelte 5.5.0 or newer.

## Programmatic snippets

Snippets can be created programmatically with the `createRawSnippet` API. This is intended for advanced use cases.

## Snippets and slots

In Svelte 4, content can be passed to components using slots. Snippets are more powerful and flexible, and so slots have been deprecated in Svelte 5.
