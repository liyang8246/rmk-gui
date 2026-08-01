# Await Expressions

As of Svelte 5.36, you can use the `await` keyword inside your components in three places where it was previously unavailable:

- at the top level of your component's `<script>`
- inside `$derived(...)` declarations
- inside your markup

This feature is currently experimental, and you must opt in by adding the `experimental.async` option wherever you configure Svelte, usually `svelte.config.js`:

```js
// svelte.config.js
export default {
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};
```

The experimental flag will be removed in Svelte 6.

## Synchronized updates

When an `await` expression depends on a particular piece of state, changes to that state will not be reflected in the UI until the asynchronous work has completed, so that the UI is not left in an inconsistent state.

```svelte
<script>
	let a = $state(1);
	let b = $state(2);

	async function add(a, b) {
		await new Promise((f) => setTimeout(f, 500)); // artificial delay
		return a + b;
	}
</script>

<input type="number" bind:value={a}>
<input type="number" bind:value={b}>

<p>{a} + {b} = {await add(a, b)}</p>
```

If you increment `a`, the text will update to `2 + 2 = 4` when `add(a, b)` resolves, not immediately to an inconsistent state.

Updates can overlap — a fast update will be reflected in the UI while an earlier slow update is still ongoing.

## Concurrency

Svelte will do as much asynchronous work as it can in parallel. For example if you have two `await` expressions in your markup:

```svelte
<p>{await one(x)}</p>
<p>{await two(y)}</p>
```

Both functions will run at the same time, as they are independent expressions, even though they are visually sequential.

This does not apply to sequential `await` expressions inside your `<script>` or inside async functions — these run like any other asynchronous JavaScript. An exception is that independent `$derived` expressions will update independently:

```js
// `b` will not be created until `a` has resolved,
// but once created they will update independently
let a = $derived(await one(x));
let b = $derived(await two(y));
```

If you write code like this, expect Svelte to give you an `await_waterfall` warning.

## Indicating loading states

To render placeholder UI, wrap content in a `<svelte:boundary>` with a `pending` snippet. This will be shown when the boundary is first created, but not for subsequent updates, which are globally coordinated.

After the contents of a boundary have resolved for the first time, you can detect subsequent async work with `$effect.pending()`. This is what you would use to display a "we're asynchronously validating your input" spinner next to a form field.

You can also use `settled()` to get a promise that resolves when the current update is complete:

```js
import { tick, settled } from 'svelte';

async function onclick() {
	updating = true;

	// without this, the change to `updating` will be
	// grouped with the other changes, meaning it
	// won't be reflected in the UI
	await tick();

	color = 'octarine';
	answer = 42;

	await settled();

	// any updates affected by `color` or `answer`
	// have now been applied
	updating = false;
}
```

## Error handling

Errors in `await` expressions will bubble to the nearest error boundary.

## Server-side rendering

Svelte supports asynchronous server-side rendering (SSR) with the `render(...)` API. To use it, simply await the return value:

```js
import { render } from 'svelte/server';
import App from './App.svelte';

const { head, body } = await render(App);
```

If a `<svelte:boundary>` with a `pending` snippet is encountered during SSR, that snippet will be rendered while the rest of the content is ignored. All `await` expressions encountered outside boundaries with `pending` snippets will resolve and render their contents prior to `await render(...)` returning.

## Forking

The `fork(...)` API, added in 5.42, makes it possible to run `await` expressions that you expect to happen in the near future. This is mainly intended for frameworks like SvelteKit to implement preloading when users signal an intent to navigate.

```svelte
<script>
	import { fork } from 'svelte';
	import Menu from './Menu.svelte';

	let open = $state(false);

	/** @type {import('svelte').Fork | null} */
	let pending = null;

	function preload() {
		pending ??= fork(() => {
			open = true;
		});
	}

	function discard() {
		pending?.discard();
		pending = null;
	}
</script>

<button
	onfocusin={preload}
	onfocusout={discard}
	onpointerenter={preload}
	onpointerleave={discard}
	onclick={() => {
		pending?.commit();
		pending = null;
		open = true;
	}}
>open menu</button>

{#if open}
	<Menu onclose={() => open = false} />
{/if}
```

## Caveats

As an experimental feature, the details of how `await` is handled (and related APIs like `$effect.pending()`) are subject to breaking changes outside of a semver major release, though such changes should be minimal.

Effects run in a slightly different order when `experimental.async` is `true`. Specifically, block effects like `{#if ...}` and `{#each ...}` now run before an `$effect.pre` or `beforeUpdate` in the same component.
