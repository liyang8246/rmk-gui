# Hydratable Data

In Svelte, when you want to render asynchronous content data on the server, you can simply `await` it. However, when hydrating that content on the client, Svelte has to redo the asynchronous work, which blocks hydration for however long it takes:

```svelte
<script>
  import { getUser } from 'my-database-library';

  // This will get the user on the server, render the user's name into the h1,
  // and then, during hydration on the client, it will get the user again,
  // blocking hydration until it's done.
  const user = await getUser();
</script>

<h1>{user.name}</h1>
```

`hydratable` is a low-level API built to solve this problem. You probably won't need this very often — it will be used behind the scenes by whatever data-fetching library you use. For example, it powers remote functions in SvelteKit.

To fix the example above:

```svelte
<script>
  import { hydratable } from 'svelte';
  import { getUser } from 'my-database-library';

  // During server rendering, this will serialize and stash the result of `getUser`, associating
  // it with the provided key and baking it into the `head` content. During hydration, it will
  // look for the serialized version, returning it instead of running `getUser`. After hydration
  // is done, if it's called again, it'll simply invoke `getUser`.
  const user = await hydratable('user', () => getUser());
</script>

<h1>{user.name}</h1>
```

This API can also be used to provide access to random or time-based values that are stable between server rendering and hydration:

```ts
import { hydratable } from 'svelte';
const rand = hydratable('random', () => Math.random());
```

If you're a library author, prefix the keys of your `hydratable` values with the name of your library to avoid conflicts.

## Serialization

All data returned from a `hydratable` function must be serializable. Svelte uses `devalue`, which can serialize `Map`, `Set`, `URL`, `BigInt`, and more. Thanks to Svelte magic, you can also use promises:

```svelte
<script>
  import { hydratable } from 'svelte';
  const promises = hydratable('random', () => {
    return {
      one: Promise.resolve(1),
      two: Promise.resolve(2)
    }
  });
</script>

{await promises.one}
{await promises.two}
```

## CSP

`hydratable` adds an inline `<script>` block to the `head` returned from `render`. If you're using Content Security Policy (CSP), provide a `nonce` to `render`:

```js
const nonce = crypto.randomUUID();

const { head, body } = await render(App, {
	csp: { nonce }
});
```

Add the same nonce to the CSP header:

```js
response.headers.set(
  'Content-Security-Policy',
  `script-src 'nonce-${nonce}'`
);
```

For static HTML generation, use hashes instead:

```js
const { head, body, hashes } = await render(App, {
	csp: { hash: true }
});
```

`hashes.script` will be an array of strings like `["sha256-abcd123"]`:

```js
response.headers.set(
  'Content-Security-Policy',
  `script-src ${hashes.script.map((hash) => `'${hash}'`).join(' ')}`
);
```

Use `nonce` over `hash` when possible, as `hash` will interfere with streaming SSR in the future.
