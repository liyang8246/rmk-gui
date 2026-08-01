# Attachments (`{@attach ...}`)

Attachments are functions that run in an effect when an element is mounted to the DOM or when state read inside the function updates.

Optionally, they can return a function that is called before the attachment re-runs, or after the element is later removed from the DOM.

Attachments are available in Svelte 5.29 and newer.

```svelte
<script>
	/** @type {import('svelte/attachments').Attachment} */
	function myAttachment(element) {
		console.log(element.nodeName); // 'DIV'

		return () => {
			console.log('cleaning up');
		};
	}
</script>

<div {@attach myAttachment}>...</div>
```

An element can have any number of attachments.

## Attachment factories

A useful pattern is for a function, such as `tooltip` in this example, to return an attachment:

```svelte
<script>
	import tippy from 'tippy.js';

	let content = $state('Hello!');

	/**
	 * @param {string} content
	 * @returns {import('svelte/attachments').Attachment}
	 */
	function tooltip(content) {
		return (element) => {
			const tooltip = tippy(element, { content });
			return tooltip.destroy;
		};
	}
</script>

<input bind:value={content} />

<button {@attach tooltip(content)}>
	Hover me
</button>
```

Since the `tooltip(content)` expression runs inside an effect, the attachment will be destroyed and recreated whenever `content` changes. The same thing would happen for any state read inside the attachment function when it first runs.

## Inline attachments

Attachments can also be created inline:

```svelte
<canvas
	width={32}
	height={32}
	{@attach (canvas) => {
		const context = canvas.getContext('2d');

		$effect(() => {
			context.fillStyle = color;
			context.fillRect(0, 0, canvas.width, canvas.height);
		});
	}}
></canvas>
```

The nested effect runs whenever `color` changes, while the outer effect (where `canvas.getContext(...)` is called) only runs once, since it doesn't read any reactive state.

## Conditional attachments

Falsy values like `false` or `undefined` are treated as no attachment, enabling conditional usage:

```svelte
<div {@attach enabled && myAttachment}>...</div>
```

## Passing attachments to components

When used on a component, `{@attach ...}` will create a prop whose key is a `Symbol`. If the component then spreads props onto an element, the element will receive those attachments.

This allows you to create wrapper components that augment elements:

```svelte
<!-- Button.svelte -->
<script>
	/** @type {import('svelte/elements').HTMLButtonAttributes} */
	let { children, ...props } = $props();
</script>

<button {...props}>
	{@render children?.()}
</button>
```

```svelte
<!-- App.svelte -->
<script>
	import tippy from 'tippy.js';
	import Button from './Button.svelte';

	let content = $state('Hello!');

	function tooltip(content) {
		return (element) => {
			const tooltip = tippy(element, { content });
			return tooltip.destroy;
		};
	}
</script>

<input bind:value={content} />

<Button {@attach tooltip(content)}>
	Hover me
</Button>
```

## Controlling when attachments re-run

Attachments, unlike actions, are fully reactive: `{@attach foo(bar)}` will re-run on changes to `foo` or `bar` (or any state read inside `foo`):

```js
function foo(bar) {
	return (node) => {
		veryExpensiveSetupWork(node);
		update(node, bar);
	};
}
```

In the rare case that this is a problem (for example, if `foo` does expensive and unavoidable setup work) consider passing the data inside a function and reading it in a child effect:

```js
function foo(getBar) {
	return (node) => {
		veryExpensiveSetupWork(node);

		$effect(() => {
			update(node, getBar());
		});
	}
}
```

## Creating attachments programmatically

To add attachments to an object that will be spread onto a component or element, use `createAttachmentKey` from `svelte/attachments`.

## Converting actions to attachments

If you're using a library that only provides actions, you can convert them to attachments with `fromAction` from `svelte/attachments`, allowing you to use them with components.
