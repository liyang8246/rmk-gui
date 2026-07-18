# SolidJS API Quick Reference

A comprehensive cheat sheet covering every major SolidJS API with TypeScript signatures, parameter descriptions, and usage examples.

---

## Core Reactivity (from `"solid-js"`)

### `createSignal`

Creates a reactive signal — a getter/setter pair for a piece of state.

```ts
function createSignal<T>(
  initialValue: T,
  options?: { name?: string; equals?: false | ((prev: T, next: T) => boolean) }
): [get: () => T, set: (v: T | ((prev: T) => T)) => T]
```

- **`initialValue`** — The starting value of the signal.
- **`options.name`** — Debug name for DevTools.
- **`options.equals`** — Custom equality check. Set to `false` to always trigger updates, or provide a `(prev, next) => boolean`.
- **Returns** — A tuple `[getter, setter]`. The getter is reactive; the setter accepts a new value or an updater function `(prev) => next`.

```ts
const [count, setCount] = createSignal(0);
setCount(prev => prev + 1);
console.log(count()); // 1
```

---

### `createEffect`

Runs a side-effectful computation that automatically re-runs when its reactive dependencies change.

```ts
function createEffect<T>(
  effect: (v: T) => T | void,
  value?: T,
  options?: { name?: string }
): void
```

- **`effect`** — The effect function. Receives the last return value (or `value` on first run). Reactive reads inside trigger re-runs.
- **`value`** — Optional initial value passed to the effect on first execution.
- **`options.name`** — Debug name.

```ts
const [name, setName] = createSignal("World");
createEffect(() => console.log(`Hello, ${name()}!`));
```

---

### `createMemo`

Creates a derived reactive value that caches its result and only recomputes when dependencies change.

```ts
function createMemo<T>(
  fn: (v: T) => T,
  value?: T,
  options?: { name?: string; equals?: false | ((prev: T, next: T) => boolean) }
): () => T
```

- **`fn`** — The computation function. Receives the previous return value.
- **`value`** — Optional initial value for the first run.
- **`options.equals`** — Custom equality check (same as `createSignal`).
- **Returns** — A reactive getter for the memoized value.

```ts
const [count, setCount] = createSignal(5);
const doubled = createMemo(() => count() * 2);
console.log(doubled()); // 10
```

---

### `createResource`

Creates a signal that asynchronously fetches data. Integrates with `Suspense`.

```ts
function createResource<T, S = true>(
  source: S | (() => S),
  fetcher: (source: S, info: { value: T | undefined; refetching: boolean | unknown }) => Promise<T>,
  options?: {
    name?: string;
    initialValue?: T;
    deferStream?: boolean;
    ssrLoadFrom?: "initial" | "server";
    storage?: () => [() => T | undefined, (v: T | undefined) => void];
    onHydrated?: (k: S, info: { value: T | undefined }) => void;
  }
): [
  () => T | undefined,
  {
    mutate: (v: T | undefined) => void;
    refetch: (info?: unknown) => Promise<void> | undefined;
    loading: () => boolean;
    error: () => any;
    latest: () => T | undefined;
  }
]
```

- **`source`** — A reactive getter or static value passed to the fetcher. When reactive, refetches on change.
- **`fetcher`** — Async function that returns data. Receives the current source value and an info object with `value` (previous) and `refetching`.
- **`options.initialValue`** — Synchronous default before fetch resolves.
- **`options.deferStream`** — Defer streaming until the resource resolves (SSR).
- **`options.ssrLoadFrom`** — `"initial"` uses `initialValue` on server; `"server"` always fetches.
- **`options.storage`** — Custom signal factory for the resource state.
- **`options.onHydrated`** — Callback after SSR hydration.
- **Returns** — `[stateGetter, resourceActions]`. `mutate` sets the value directly; `refetch` re-triggers the fetcher; `loading` is a reactive boolean; `error` returns any thrown error; `latest` returns the latest value without triggering `Suspense`.

```ts
const [userId, setUserId] = createSignal(1);
const [user] = createResource(userId, async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});
```

---

### `createComputed`

Creates a computation that runs immediately and on every dependency change, without deferring (unlike `createEffect` which may be batched). Useful for synchronous derived state.

```ts
function createComputed<T>(
  fn: (v: T) => T,
  value?: T,
  options?: { name?: string }
): void
```

- **`fn`** — The computation function. Receives previous return value.
- **`value`** — Optional initial value.
- **`options.name`** — Debug name.

```ts
const [a, setA] = createSignal(1);
createComputed(() => console.log("computed:", a()));
```

---

### `createRenderEffect`

Like `createEffect` but runs during the render phase — it tracks dependencies and re-runs synchronously during rendering. Useful for DOM updates that must happen before paint.

```ts
function createRenderEffect<T>(
  fn: (v: T) => T,
  value?: T,
  options?: { name?: string }
): void
```

- **`fn`** — The effect function. Receives previous return value.
- **`value`** — Optional initial value.
- **`options.name`** — Debug name.

```ts
const [width, setWidth] = createSignal(0);
createRenderEffect(() => {
  el.style.width = `${width()}px`;
});
```

---

### `createDeferred`

Creates a deferred (debounced) version of a source signal. Useful for delaying updates to expensive computations.

```ts
function createDeferred<T>(
  source: () => T,
  options?: { timeoutMs?: number; name?: string; equals?: false | ((prev: T, next: T) => boolean) }
): () => T
```

- **`source`** — A reactive getter to defer.
- **`options.timeoutMs`** — Maximum time in ms before the deferred value updates.
- **`options.equals`** — Custom equality check.
- **Returns** — A reactive getter that updates on a timeout or during idle time.

```ts
const [input, setInput] = createSignal("");
const deferredInput = createDeferred(input, { timeoutMs: 200 });
```

---

### `createReaction`

Creates a fine-grained reactive observer. The tracking function is only re-run when the `track` callback is called.

```ts
function createReaction(
  onInvalidate: () => void,
  options?: { name?: string }
): (tracking: () => void) => void
```

- **`onInvalidate`** — Called when tracked dependencies change.
- **Returns** — A `track` function. Call `track(fn)` to establish reactive dependencies; `onInvalidate` fires when those deps change.

```ts
const [count, setCount] = createSignal(0);
const track = createReaction(() => console.log("count changed!"));
track(() => count()); // start tracking
```

---

### `createSelector`

Creates an efficient key-based selector. Optimized for checking if a specific key matches — avoids re-rendering list items that don't match.

```ts
function createSelector<T, K = T>(
  source: () => T,
  fn?: (a: K, b: T) => boolean,
  options?: { name?: string }
): (key: K) => boolean
```

- **`source`** — A reactive getter for the current selected value.
- **`fn`** — Custom comparison function `(key, selected) => boolean`. Defaults to `===`.
- **Returns** — A reactive getter `(key) => boolean` — returns `true` when `key` matches the current source value.

```ts
const [selectedId, setSelectedId] = createSignal(3);
const isSelected = createSelector(selectedId);
// In a list component:
<div classList={{ active: isSelected(item.id) }} />
```

---

## Reactive Utilities (from `"solid-js"`)

### `batch`

Batches multiple reactive updates so dependents only run once after all updates are complete.

```ts
function batch<T>(fn: () => T): T
```

- **`fn`** — Function containing multiple signal writes.
- **Returns** — The return value of `fn`.

```ts
const [x, setX] = createSignal(1);
const [y, setY] = createSignal(2);
batch(() => {
  setX(10);
  setY(20);
}); // effects/memos run once, not twice
```

---

### `untrack`

Runs a function without tracking any reactive reads inside it.

```ts
function untrack<T>(fn: () => T): T
```

- **`fn`** — Function to run without reactive tracking.
- **Returns** — The return value of `fn`.

```ts
const [count, setCount] = createSignal(0);
createEffect(() => {
  console.log(count());        // tracked
  console.log(untrack(count)); // not tracked
});
```

---

### `on`

Makes dependency tracking explicit. Used inside `createEffect` / `createMemo` to declare exactly which sources to track.

```ts
function on<T extends Array<() => any> | (() => any), U>(
  deps: T,
  fn: (input: T extends Array<infer V> ? { [K in keyof V]: ReturnType<V> } : ReturnType<T extends () => infer R ? () => R : never>, prevInput: any, prevValue: U | undefined) => U,
  options?: { defer?: boolean }
): (prevValue: U | undefined) => U | undefined
```

- **`deps`** — A single reactive getter or an array of reactive getters to track.
- **`fn`** — Computation function. Receives current values of deps, previous dep values, and previous return.
- **`options.defer`** — If `true`, the effect does not run immediately; only on subsequent changes.

```ts
const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);
createEffect(on([a, b], ([valA, valB]) => {
  console.log(valA + valB);
}));
```

---

### `onMount`

Registers a callback that runs once after the component's initial render.

```ts
function onMount(fn: () => void): void
```

- **`fn`** — Callback to run on mount.

```ts
onMount(() => {
  console.log("Component mounted!");
  const id = setInterval(() => setCount(c => c + 1), 1000);
  onCleanup(() => clearInterval(id));
});
```

---

### `onCleanup`

Registers a cleanup callback that runs when the current reactive scope is disposed.

```ts
function onCleanup(fn: () => void): void
```

- **`fn`** — Cleanup function.

```ts
onCleanup(() => {
  console.log("Cleaning up!");
  clearInterval(timerId);
});
```

---

### `createRoot`

Creates a non-tracked reactive scope that doesn't auto-dispose. Essential for preventing memory leaks when creating reactive primitives outside components.

```ts
function createRoot<T>(fn: (dispose: () => void) => T): T
```

- **`fn`** — Receives a `dispose` function. Return value is returned from `createRoot`.
- **Returns** — The return value of `fn`.

```ts
const [signal, setSignal] = createRoot((dispose) => {
  const [value, setValue] = createSignal(0);
  return [value, setValue] as const;
});
```

---

### `getOwner`

Returns the current reactive owner (scope), which can be passed to `runWithOwner`.

```ts
function getOwner(): Owner | null
```

- **Returns** — The current reactive owner, or `null` if called outside a reactive scope.

```ts
const owner = getOwner();
```

---

### `runWithOwner`

Runs a function with a given reactive owner as the current scope. Useful for running reactive code outside its natural scope.

```ts
function runWithOwner<T>(owner: Owner | null, fn: () => T): T | undefined
```

- **`owner`** — An owner obtained from `getOwner()`.
- **`fn`** — Function to execute within that owner's scope.
- **Returns** — The return value of `fn`, or `undefined` if owner is null.

```ts
const owner = getOwner();
setTimeout(() => {
  runWithOwner(owner, () => {
    createEffect(() => console.log(count()));
  });
}, 1000);
```

---

### `catchError`

Catches errors thrown in child reactive scopes.

```ts
function catchError(fn: () => void, handler: (err: any) => void): void
```

- **`fn`** — Function to execute.
- **`handler`** — Called with the error if `fn` or its children throw.

```ts
catchError(
  () => { /* risky code */ },
  (err) => console.error("Caught:", err)
);
```

---

### `startTransition`

Wraps state updates in a transition — the UI stays responsive during the update. Returns a promise that resolves when the transition completes.

```ts
function startTransition(fn: () => void): Promise<void>
```

- **`fn`** — Function containing the state updates to defer.
- **Returns** — A promise that resolves when the transition finishes.

```ts
const [tab, setTab] = createSignal("home");
async function switchTab(name: string) {
  await startTransition(() => setTab(name));
}
```

---

### `useTransition`

Returns a tuple for performing and tracking transitions.

```ts
function useTransition(): [
  pending: () => boolean,
  startTransition: (fn: () => void) => Promise<void>
]
```

- **Returns** — `[isPending, start]`. `isPending()` is `true` while a transition is in progress. `start(fn)` begins a transition.

```ts
const [isPending, start] = useTransition();
// In JSX:
<Show when={isPending()}><Spinner /></Show>
```

---

### `enableScheduling`

Enables Solid's internal scheduler. Must be called before any reactive system usage.

```ts
function enableScheduling(): void
```

```ts
enableScheduling();
```

---

### `observable`

Converts a Solid signal getter into an RxJS-compatible Observable.

```ts
function observable<T>(source: () => T): Observable<T>
```

- **`source`** — A reactive getter.
- **Returns** — An `Observable` that emits whenever the source changes.

```ts
import { observable } from "solid-js";
const [count, setCount] = createSignal(0);
const count$ = observable(count);
count$.subscribe(val => console.log(val));
```

---

### `from`

Converts an Observable into a Solid signal getter. The inverse of `observable`.

```ts
function from<T>(
  producer: Observable<T> | ((setter: (v: T | ((prev: T) => T)) => void) => () => void)
): () => T
```

- **`producer`** — An RxJS Observable or a custom producer function that receives a setter and returns a cleanup function.
- **Returns** — A reactive getter.

```ts
import { from } from "solid-js";
const mousePos = fromEvent(document, "mousemove").pipe(
  map((e) => ({ x: e.clientX, y: e.clientY }))
);
const pos = from(mousePos);
```

---

### `mapArray`

Reactive map over an array that minimizes re-renders by keying on reference identity. Reuses previous computation for items that remain the same reference.

```ts
function mapArray<T, U>(
  map: () => readonly T[],
  fn: (v: T, i: () => number) => U
): () => U[]
```

- **`map`** — A reactive getter returning the source array.
- **`fn`** — Mapping function. Receives each item and a reactive index getter.
- **Returns** — A reactive getter returning the mapped array.

```ts
const [items, setItems] = createSignal([1, 2, 3]);
const doubled = mapArray(items, (item) => item * 2);
```

---

### `indexArray`

Reactive map over an array keyed by index. The item getter is reactive, but the index is fixed.

```ts
function indexArray<T, U>(
  map: () => readonly T[],
  fn: (v: () => T, i: number) => U
): () => U[]
```

- **`map`** — A reactive getter returning the source array.
- **`fn`** — Mapping function. Receives a reactive item getter and a fixed index.
- **Returns** — A reactive getter returning the mapped array.

```ts
const [items, setItems] = createSignal(["a", "b", "c"]);
const mapped = indexArray(items, (getItem, i) => `${i}: ${getItem()}`);
```

---

### `mergeProps`

Merges multiple props objects into one. Later props override earlier ones. Proxy-based — preserves reactivity. Useful for setting default props.

```ts
function mergeProps<T extends Record<string, any>[]>(...sources: T): MergeProps<T>
```

- **`sources`** — One or more props objects.
- **Returns** — A merged reactive proxy.

```ts
function MyComponent(props: { color?: string; size?: number }) {
  const merged = mergeProps({ color: "blue", size: 14 }, props);
  return <div style={{ color: merged.color, fontSize: `${merged.size}px` }} />;
}
```

---

### `splitProps`

Splits a props object into one or more separate props objects by key. Preserves reactivity.

```ts
function splitProps<T extends Record<string, any>, K1 extends keyof T, K2 extends keyof T, ...>(
  props: T,
  ...keys: K1[][], K2[][], ...
): [Pick<T, K1>, Pick<T, K2>, ...remaining: Omit<T, K1 | K2 | ...>]
```

- **`props`** — The source props object.
- **`keys`** — One or more arrays of keys to extract.
- **Returns** — An array of split props objects. The last element contains remaining keys.

```ts
const [local, others] = splitProps(props, ["class", "style"]);
// local has class & style, others has everything else
```

---

### `children`

Resolves and caches the children of a component. Returns a memo of the resolved children.

```ts
function children(fn: () => any): () => any
```

- **`fn`** — A function returning `props.children`.
- **Returns** — A memoized getter that resolves children.

```ts
function List(props) {
  const resolved = children(() => props.children);
  createEffect(() => {
    console.log(resolved().length);
  });
  return <ul>{resolved()}</ul>;
}
```

---

### `lazy`

Creates a lazily-loaded component. The component is only imported when first rendered. Integrates with `Suspense`.

```ts
function lazy<T extends Component<any>>(
  fn: () => Promise<{ default: T }>,
  options?: { name?: string }
): T & { preload: () => Promise<{ default: T }> }
```

- **`fn`** — A dynamic import function returning a module with a `default` export.
- **`options.name`** — Debug name.
- **Returns** — A lazy component with a `preload()` method.

```ts
const HeavyComponent = lazy(() => import("./HeavyComponent"));
// In JSX:
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

---

## Store (from `"solid-js/store"`)

### `createStore`

Creates a deeply reactive store — a proxy-based object where nested property access and mutations are tracked.

```ts
function createStore<T extends object>(
  initialState: T | Store<T, T>,
  options?: { name?: string }
): [get: Store<T, T>, set: SetStoreFunction<T>]
```

- **`initialState`** — The initial state object (can be nested).
- **`options.name`** — Debug name.
- **Returns** — `[state, setState]`. `state` is a reactive proxy. `setState` supports path-based updates.

**`setState` signatures:**

```ts
type SetStoreFunction<T> = {
  (state: T): void;                                           // callback with draft
  (fn: (state: T) => T): void;                                // callback returning new state
  (...args: any[]): void;                                     // path + value or path + updater
};
// setState("key", value)
// setState("key", "nested", value)
// setState("key", (prev) => newValue)
// setState({ key: value })
```

```ts
const [state, setState] = createStore({
  user: { name: "Alice", age: 30 },
  todos: [],
});
setState("user", "age", 31);
setState("todos", [...state.todos, { id: 1, text: "Learn Solid" }]);
```

---

### `createMutable`

Creates a mutable reactive store. Unlike `createStore`, you mutate properties directly (no `setState`).

```ts
function createMutable<T extends object>(
  initialState: T | Store<T, T>,
  options?: { name?: string }
): Store<T, T>
```

- **`initialState`** — The initial state object.
- **`options.name`** — Debug name.
- **Returns** — A mutable reactive proxy.

```ts
const state = createMutable({ count: 0 });
state.count++; // triggers reactive updates
```

---

### `produce`

Immer-like utility for `createStore`. Provides a mutable draft inside `setState`. Runs inside `setState` — not standalone.

```ts
function produce<T>(
  fn: (state: T) => void
): (state: T) => T
```

- **`fn`** — Receives a mutable draft. Mutations are applied immutably.
- **Returns** — A setter-compatible function.

```ts
const [state, setState] = createStore({ items: [] });
setState(produce((s) => {
  s.items.push({ id: 1, text: "new item" });
}));
```

---

### `modifyMutable`

Applies mutations to a `createMutable` store using `produce` or `reconcile`.

```ts
function modifyMutable<T>(
  state: T,
  modifier: (state: T) => T
): void
```

- **`state`** — The mutable store.
- **`modifier`** — A function like `produce` or `reconcile` that returns the new state.

```ts
const state = createMutable({ items: [] });
modifyMutable(state, produce((s) => {
  s.items.push({ id: 1 });
}));
```

---

### `reconcile`

Replaces the store state with new data while minimizing unnecessary updates by diffing. Useful for replacing entire store state from external sources.

```ts
function reconcile<T>(
  value: T | Store<T, T>,
  options?: { key?: string | ((item: any, index: number) => string | number) }
): (state: T) => T
```

- **`value`** — The new state to reconcile against.
- **`options.key`** — Key function or property name for list items to identify them during diffing.
- **Returns** — A setter-compatible function.

```ts
const [state, setState] = createStore({ users: [] });
// Replace with server data, keeping referential stability where possible:
setState(reconcile({ users: serverData }, { key: "id" }));
```

---

### `unwrap`

Returns the underlying non-reactive plain object from a store proxy. Useful for serialization or debugging.

```ts
function unwrap<T>(store: T): T
```

- **`store`** — A reactive store proxy.
- **Returns** — A deep plain-object clone without reactivity.

```ts
const [state] = createStore({ a: { b: 1 } });
const plain = unwrap(state);
console.log(JSON.stringify(plain));
```

---

## Context (from `"solid-js"`)

### `createContext`

Creates a new context object for providing/injecting values down the component tree.

```ts
function createContext<T>(
  defaultValue?: T,
  options?: { name?: string }
): Context<T>
```

- **`defaultValue`** — Used when `useContext` is called outside a `Provider`.
- **`options.name`** — Debug name.
- **Returns** — A `Context<T>` object with `Provider` component and `id`.

**`Context.Provider` signature:**

```tsx
<Context.Provider value={T}>
  {children}
</Context.Provider>
```

```ts
const ThemeCtx = createContext<{ theme: string }>({ theme: "light" });
```

---

### `useContext`

Retrieves the value from the nearest ancestor `Provider` for a given context.

```ts
function useContext<T>(context: Context<T>): T
```

- **`context`** — A context created by `createContext`.
- **Returns** — The context value from the nearest Provider, or the default value.

```ts
const theme = useContext(ThemeCtx);
console.log(theme.theme); // "light" or whatever the Provider set
```

---

### `createUniqueId`

Generates a unique ID that is consistent between server and client (SSR-safe). Useful for accessibility attributes.

```ts
function createUniqueId(): string
```

- **Returns** — A unique string ID.

```ts
const id = createUniqueId();
return <label for={id}>Name</label><input id={id} />;
```

---

## Control Flow Components (from `"solid-js"`)

### `<For>`

Reactive list rendering. Keys items by reference for efficient updates.

```tsx
function For<T>(props: {
  each: readonly T[];
  fallback?: JSX.Element;
  children: (item: T, index: () => number) => JSX.Element;
}): JSX.Element
```

- **`each`** — The source array (reactive).
- **`fallback`** — Optional content shown when `each` is empty.
- **`children`** — Render function receiving each item and a reactive index.

```tsx
<For each={items()} fallback={<p>No items</p>}>
  {(item, i) => <li>{i()}: {item.name}</li>}
</For>
```

---

### `<Index>`

Reactive list rendering keyed by index. The item getter is reactive, index is fixed. Better for primitive arrays.

```tsx
function Index<T>(props: {
  each: readonly T[];
  fallback?: JSX.Element;
  children: (item: () => T, index: number) => JSX.Element;
}): JSX.Element
```

- **`each`** — The source array.
- **`fallback`** — Content for empty lists.
- **`children`** — Render function receiving a reactive item getter and a fixed index.

```tsx
<Index each={names()}>
  {(name, i) => <li>{i}: {name()}</li>}
</Index>
```

---

### `<Show>`

Conditionally renders content. Supports an `else` fallback via `fallback`.

```tsx
function Show<T>(props: {
  when: T | undefined | null | false;
  keyed?: boolean;
  fallback?: JSX.Element;
  children: JSX.Element | ((item: NonNullable<T>) => JSX.Element);
}): JSX.Element
```

- **`when`** — The condition. Falsy values hide the content.
- **`keyed`** — If `true`, the content is re-created when the value changes (not just truthiness).
- **`fallback`** — Content to show when `when` is falsy.
- **`children`** — Can be JSX or a render function receiving the non-null value.

```tsx
<Show when={user()} fallback={<p>Loading...</p>}>
  {(u) => <p>Hello, {u.name}</p>}
</Show>
```

---

### `<Switch>` / `<Match>`

Conditional rendering with multiple branches (like a switch-case). Evaluates `<Match>` children in order.

```tsx
function Switch(props: {
  fallback?: JSX.Element;
  children: JSX.Element;
}): JSX.Element

function Match<T>(props: {
  when: T | undefined | null | false;
  keyed?: boolean;
  children: JSX.Element | ((item: NonNullable<T>) => JSX.Element);
}): JSX.Element
```

- **Switch `fallback`** — Content when no Match succeeds.
- **Match `when`** — Condition for this branch.
- **Match `keyed`** — Same as `Show` keyed.

```tsx
<Switch fallback={<p>Unknown</p>}>
  <Match when={status() === "loading"}><Spinner /></Match>
  <Match when={status() === "error"}><ErrorView /></Match>
  <Match when={status() === "success"}><DataView /></Match>
</Switch>
```

---

### `<Dynamic>`

Renders a component dynamically by name/type. Useful for polymorphic components.

```tsx
function Dynamic<T extends Component<any>>(props: {
  component: T | string | undefined;
  [key: string]: any;
}): JSX.Element
```

- **`component`** — The component function or HTML tag string to render.
- **Other props** — Passed through to the component.

```tsx
<Dynamic component={currentTab()} {...tabProps} />
```

---

### `<ErrorBoundary>`

Catches JavaScript errors in child components and renders a fallback.

```tsx
function ErrorBoundary(props: {
  fallback: JSX.Element | ((err: any, reset: () => void) => JSX.Element);
  children: JSX.Element;
}): JSX.Element
```

- **`fallback`** — Either JSX or a function receiving the error and a `reset` callback.
- **`children`** — Content to wrap.

```tsx
<ErrorBoundary fallback={(err, reset) => (
  <p>Error: {err.message} <button onClick={reset}>Retry</button></p>
)}>
  <RiskyComponent />
</ErrorBoundary>
```

---

### `<Suspense>`

Shows fallback content while async resources in children are loading. Integrates with `createResource` and `lazy`.

```tsx
function Suspense(props: {
  fallback?: JSX.Element;
  children: JSX.Element;
}): JSX.Element
```

- **`fallback`** — Content shown while resources are pending.
- **`children`** — Content that may contain async resources.

```tsx
<Suspense fallback={<Loading />}>
  <AsyncDataComponent />
</Suspense>
```

---

### `<SuspenseList>`

Coordinates the reveal order of multiple `Suspense` boundaries.

```tsx
function SuspenseList(props: {
  children: JSX.Element;
  revealOrder?: "together" | "forwards" | "backwards";
  tail?: "collapsed" | "hidden";
}): JSX.Element
```

- **`revealOrder`** — How suspended children are revealed: `"together"` (all at once), `"forwards"` (top-down), `"backwards"` (bottom-up).
- **`tail`** — How to show fallbacks: `"collapsed"` (only the first), `"hidden"` (none until revealed).

```tsx
<SuspenseList revealOrder="forwards" tail="collapsed">
  <Suspense fallback={<Loading />}><Profile /></Suspense>
  <Suspense fallback={<Loading />}><Posts /></Suspense>
</SuspenseList>
```

---

### `<Portal>`

Renders children into a DOM node outside the current component tree (e.g., modals, tooltips).

```tsx
function Portal(props: {
  mount?: Element;
  useShadow?: boolean;
  isSVG?: boolean;
  children: JSX.Element;
}): JSX.Element
```

- **`mount`** — The DOM element to portal into. Defaults to `document.body`.
- **`useShadow`** — Uses a shadow DOM root.
- **`isSVG`** — Set to `true` if mounting inside an SVG context.

```tsx
<Portal mount={document.getElementById("modal-root")!}>
  <div class="modal">Hello from portal!</div>
</Portal>
```

---

### `<NoHydration>`

Prevents its children from being hydrated on the client. The content is server-rendered but not interactive on the client.

```tsx
function NoHydration(props: {
  children: JSX.Element;
}): JSX.Element
```

```tsx
<NoHydration>
  <div>This won't hydrate on the client</div>
</NoHydration>
```

---

## Rendering (from `"solid-js/web"`)

### `render`

Mounts a Solid component tree into a DOM element. Client-side entry point.

```ts
function render(
  code: () => JSX.Element,
  element: MountableElement
): () => void
```

- **`code`** — A function returning the root JSX element.
- **`element`** — The DOM element to mount into.
- **Returns** — A disposal function that unmounts the app.

```ts
import { render } from "solid-js/web";
render(() => <App />, document.getElementById("root")!);
```

---

### `hydrate`

Attaches Solid's reactivity to existing server-rendered HTML without destroying it.

```ts
function hydrate(
  code: () => JSX.Element,
  element: MountableElement,
  options?: { renderId?: string }
): () => void
```

- **`code`** — Function returning the root JSX.
- **`element`** — The DOM element containing SSR'd HTML.
- **`options.renderId`** — Matches the server-side render ID for hydration.
- **Returns** — A disposal function.

```ts
import { hydrate } from "solid-js/web";
hydrate(() => <App />, document.getElementById("root")!);
```

---

### `renderToString`

Server-side: renders the component tree to an HTML string synchronously.

```ts
function renderToString(
  code: () => JSX.Element,
  options?: { renderId?: string; nonce?: string }
): string
```

- **`code`** — Function returning the root JSX.
- **`options.renderId`** — ID for multiple render targets.
- **`options.nonce`** — CSP nonce for inline scripts.
- **Returns** — HTML string.

```ts
import { renderToString } from "solid-js/web";
const html = renderToString(() => <App />);
```

---

### `renderToStringAsync`

Server-side: renders to HTML string, waiting for all async resources to resolve.

```ts
function renderToStringAsync(
  code: () => JSX.Element,
  options?: { renderId?: string; nonce?: string; timeoutMs?: number }
): Promise<string>
```

- **`code`** — Function returning the root JSX.
- **`options.timeoutMs`** — Maximum time to wait for async resources.
- **Returns** — Promise resolving to HTML string.

```ts
import { renderToStringAsync } from "solid-js/web";
const html = await renderToStringAsync(() => <App />);
```

---

### `renderToStream`

Server-side: streams HTML as resources resolve. Supports `PipeToWritableResults` (Node) and `ReadableStream` (web streams).

```ts
function renderToStream(
  code: () => JSX.Element,
  options?: {
    renderId?: string;
    nonce?: string;
    onCompleteShell?: (info: { write: (v: string) => void }) => void;
    onCompleteAll?: (info: { write: (v: string) => void }) => void;
    onError?: (err: any) => void;
  }
): {
  pipe: (writable: Writable) => void;
  pipeTo: (writable: WritableStream) => void;
}
```

- **`options.onCompleteShell`** — Called when the initial shell is ready.
- **`options.onCompleteAll`** — Called when all async content is resolved.
- **`options.onError`** — Error handler.
- **Returns** — Object with `pipe` (Node) and `pipeTo` (web streams) methods.

```ts
import { renderToStream } from "solid-js/web";
renderToStream(() => <App />).pipe(res);
```

---

### `isServer`

Boolean constant — `true` on the server, `false` on the client. Tree-shaken at build time.

```ts
export const isServer: boolean
```

```ts
if (isServer) {
  // server-only code — removed from client bundle
}
```

---

### `isDev`

Boolean constant — `true` in development mode, `false` in production.

```ts
export const isDev: boolean
```

```ts
if (isDev) {
  console.log("Debug info");
}
```

---

### `HydrationScript`

Component that injects Solid's hydration script into the document head.

```tsx
function HydrationScript(props?: { nonce?: string }): JSX.Element
```

- **`props.nonce`** — CSP nonce.

```tsx
<head>
  <HydrationScript />
</head>
```

---

### `generateHydrationScript`

Returns a string of the hydration script (for non-JSX contexts).

```ts
function generateHydrationScript(options?: { nonce?: string }): string
```

- **`options.nonce`** — CSP nonce.
- **Returns** — Script tag string.

```ts
const script = generateHydrationScript({ nonce: "abc123" });
```

---

### `getRequestEvent`

Server-side: retrieves the current request event during SSR. Useful in server functions.

```ts
function getRequestEvent(): RequestEvent | undefined
```

- **Returns** — The current `RequestEvent` object, or `undefined` if not in a request context.

```ts
const event = getRequestEvent();
const request = event?.request;
```

---

### `DEV`

Object exposed in development mode for DevTools hooks and debugging.

```ts
export const DEV: {
  hooks?: Record<string, Function>;
} | undefined
```

```ts
if (DEV) {
  DEV.hooks?.afterCreateSignal?.(signal);
}
```

---

## Router (from `"@solidjs/router"`)

### `<Router>`

Top-level router provider. Wraps the app to enable routing.

```tsx
function Router(props: {
  base?: string;
  children: JSX.Element;
  root?: Component<{ children: JSX.Element }>;
  url?: string;
  out?: object;
}): JSX.Element
```

- **`base`** — Base path prefix.
- **`root`** — Optional wrapper component (layout).
- **`url`** — For SSR, the request URL.

```tsx
<Router root={AppLayout}>
  <Routes>...</Routes>
</Router>
```

---

### `<Route>`

Declares a route with a path and component or data functions.

```tsx
function Route(props: {
  path: string | string[];
  component?: Component<RouteSectionProps>;
  children?: JSX.Element;
  load?: () => Promise<any>;
  matchFilters?: Record<string, MatchFilter>;
  info?: Record<string, any>;
}): typeof props
```

- **`path`** — Route path(s). Supports params (`:id`), wildcards (`*rest`), and optional params (`:id?`).
- **`component`** — Component to render.
- **`load`** — Preload function (called on navigation).
- **`children`** — Nested routes.

```tsx
<Route path="/users/:id" component={UserPage} />
<Route path="/" component={Home}>
  <Route path="/about" component={About} />
</Route>
```

---

### `<A>`

Accessible navigation link. Applies `aria-current` to active links.

```tsx
function A(props: {
  href: string;
  replace?: boolean;
  noScroll?: boolean;
  state?: unknown;
  inactiveClass?: string;
  activeClass?: string;
  end?: boolean;
  onClick?: (e: MouseEvent) => void;
  children: JSX.Element;
}): JSX.Element
```

- **`href`** — Target path.
- **`replace`** — Replace history entry instead of pushing.
- **`noScroll`** — Don't scroll to top on navigation.
- **`state`** — History state object.
- **`activeClass`** — CSS class applied when link is active.
- **`inactiveClass`** — CSS class applied when link is inactive.
- **`end`** — If `true`, only active on exact match (not partial).

```tsx
<A href="/about" activeClass="link-active">About</A>
```

---

### `<Navigate>`

Programmatic navigation component. Renders `null` and navigates on mount.

```tsx
function Navigate(props: {
  href: string;
  replace?: boolean;
  state?: unknown;
}): null
```

```tsx
<Show when={!isLoggedIn()}><Navigate href="/login" /></Show>
```

---

### `<HashRouter>`

Router that uses the URL hash for routing. Useful for static hosting.

```tsx
function HashRouter(props: {
  base?: string;
  children: JSX.Element;
  root?: Component<{ children: JSX.Element }>;
  url?: string;
  out?: object;
}): JSX.Element
```

```tsx
<HashRouter>
  <Routes>...</Routes>
</HashRouter>
```

---

### `<MemoryRouter>`

Router that keeps routing state in memory (no URL changes). Useful for testing.

```tsx
function MemoryRouter(props: {
  base?: string;
  initialUrl?: string;
  children: JSX.Element;
  root?: Component<{ children: JSX.Element }>;
  out?: object;
}): JSX.Element
```

```tsx
<MemoryRouter initialUrl="/test">
  <Routes>...</Routes>
</MemoryRouter>
```

---

### `useParams`

Returns the current route parameters as a reactive object.

```ts
function useParams<Params extends Record<string, string> = RouteParams>(): Params
```

```ts
const params = useParams();
console.log(params.id); // route param from /users/:id
```

---

### `useSearchParams`

Returns a tuple for reading and updating URL search parameters.

```ts
function useSearchParams<T extends Record<string, string | undefined>>(
  options?: { baseURL?: string }
): [
  params: T,
  setter: (params: Partial<T>, options?: { replace?: boolean; resolve?: boolean }) => void
]
```

- **Returns** — `[searchParams, setSearchParams]`. The setter merges new params into the URL.

```ts
const [search, setSearch] = useSearchParams();
console.log(search.q);
setSearch({ q: "solid" });
```

---

### `useNavigate`

Returns a function for programmatic navigation.

```ts
function useNavigate(): (
  path: string,
  options?: { replace?: boolean; resolve?: boolean; state?: unknown }
) => void
```

- **`path`** — Target path (relative to current route by default).
- **`options.replace`** — Replace history entry.
- **`options.resolve`** — Resolve path relative to current route (default `true`).
- **`options.state`** — History state.

```ts
const navigate = useNavigate();
navigate("/dashboard", { replace: true });
```

---

### `useLocation`

Returns a reactive location object.

```ts
function useLocation(): Location
```

- **Returns** — `{ pathname, search, hash, state, query, key }` — all reactive.

```ts
const location = useLocation();
console.log(location.pathname);
```

---

### `useMatch`

Tests if the current route matches a given path pattern.

```ts
function useMatch(path: () => string): Accessor<boolean>
```

- **`path`** — A function returning the path pattern to match.
- **Returns** — Reactive boolean.

```ts
const isAdmin = useMatch(() => "/admin/*");
```

---

### `useResolvedPath`

Resolves a path relative to the current route.

```ts
function useResolvedPath(path: () => string): Accessor<string>
```

- **`path`** — Function returning the relative path.
- **Returns** — Reactive getter with the resolved absolute path.

```ts
const resolved = useResolvedPath(() => "../other");
```

---

### `usePreloadRoute`

Preloads the data for a route path without navigating.

```ts
function usePreloadRoute(): (path: string) => Promise<void>
```

```ts
const preload = usePreloadRoute();
<a onMouseEnter={() => preload("/heavy-page")}>Link</a>
```

---

### `useIsRouting`

Returns a reactive signal indicating if a navigation is in progress.

```ts
function useIsRouting(): Accessor<boolean>
```

```ts
const isRouting = useIsRouting();
<Show when={isRouting()}><ProgressBar /></Show>
```

---

### `useCurrentMatches`

Returns the array of current route matches (including nested).

```ts
function useCurrentMatches(): RouteMatch[]
```

```ts
const matches = useCurrentMatches();
matches.forEach(m => console.log(m.route.path));
```

---

### `useBeforeLeave`

Registers a guard that runs before navigating away from the current route.

```ts
function useBeforeLeave(
  handler: (e: BeforeLeaveEventArgs) => void
): void
```

- **`handler`** — Called with `{ from, to, preventDefault }`. Call `preventDefault()` to block navigation.

```ts
useBeforeLeave((e) => {
  if (hasUnsavedChanges()) {
    e.preventDefault();
  }
});
```

---

### `action`

Creates a server action — a function that runs on the server and can be called from the client.

```ts
function action<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): Action<T, ReturnType<T>>
```

- **`fn`** — The server function.
- **`name`** — Optional action name (for introspection).
- **Returns** — A callable action with `.url` property.

```ts
// server-only function
const submitForm = action(async (formData: FormData) => {
  // server-side logic
  return { success: true };
});
```

---

### `query`

Creates a cached query function for data fetching. Used with `createAsync`.

```ts
function query<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string
): Query<T>
```

- **`fn`** — The async fetcher function.
- **`key`** — Cache key string.
- **Returns** — A query function with `.keyFor` method for cache key generation.

```ts
const getUser = query(async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}, "user");
```

---

### `createAsync`

Creates an async signal from a query/action. Integrates with `Suspense`.

```ts
function createAsync<T>(
  fn: () => Promise<T>,
  options?: { deferStream?: boolean; name?: string }
): () => T
```

- **`fn`** — A function returning a promise (typically a query call).
- **`options.deferStream`** — Defer SSR streaming until resolved.
- **Returns** — A reactive getter that suspends while loading.

```ts
const user = createAsync(() => getUser(params.id));
```

---

### `createAsyncStore`

Like `createAsync` but returns a store instead of a signal for deep reactivity.

```ts
function createAsyncStore<T extends object>(
  fn: () => Promise<T>,
  options?: { deferStream?: boolean; name?: string; reconcile?: ReconcileOptions }
): () => T
```

- **`fn`** — Async function returning an object.
- **`options.reconcile`** — Options passed to `reconcile` for merging updates.
- **Returns** — A reactive store getter.

```ts
const data = createAsyncStore(() => getComplexData());
```

---

### `revalidate`

Triggers revalidation of cached queries.

```ts
function revalidate(
  key?: string | ((key: string) => boolean),
  opts?: { force?: boolean }
): Promise<void>
```

- **`key`** — Specific cache key to revalidate, or a predicate. If omitted, revalidates all.
- **`opts.force`** — Force revalidation even if not stale.

```ts
await revalidate("user");
await revalidate(); // revalidate all
```

---

### `useAction`

Returns a callable reference to a server action.

```ts
function useAction<T extends (...args: any[]) => Promise<any>>(
  action: Action<T, ReturnType<T>>
): (...args: Parameters<T>) => ReturnType<T>
```

```ts
const submit = useAction(submitForm);
await submit(new FormData(formEl));
```

---

### `useSubmission`

Returns the latest submission state for an action.

```ts
function useSubmission<T extends (...args: any[]) => Promise<any>>(
  action: Action<T, ReturnType<T>>,
  filter?: (input: Parameters<T>) => boolean
): Submission<ReturnType<T>>
```

- **`action`** — The action to track.
- **`filter`** — Optional filter to match specific submissions.
- **Returns** — `{ pending, result, error, input }`.

```ts
const submission = useSubmission(submitForm);
<Show when={submission.pending}>Submitting...</Show>
```

---

### `useSubmissions`

Returns all submissions for an action.

```ts
function useSubmissions<T extends (...args: any[]) => Promise<any>>(
  action: Action<T, ReturnType<T>>,
  filter?: (input: Parameters<T>) => boolean
): Submission<ReturnType<T>>[]
```

```ts
const submissions = useSubmissions(uploadAction);
```

---

### `redirect`

Throws a redirect response from server functions/actions.

```ts
function redirect(
  url: string,
  options?: { status?: number; headers?: Headers }
): Response
```

- **`url`** — Target URL.
- **`options.status`** — HTTP status code (default 302).
- **`options.headers`** — Additional response headers.

```ts
const login = action(async (form: FormData) => {
  const user = await authenticate(form);
  if (!user) throw redirect("/login");
  throw redirect("/dashboard");
});
```

---

### `reload`

Throws a reload instruction from server functions.

```ts
function reload(
  options?: { revalidate?: string | string[] | ((key: string) => boolean); status?: number }
): Response
```

```ts
throw reload({ revalidate: "user" });
```

---

### `json`

Creates a JSON response (for use in server functions).

```ts
function json<T>(
  data: T,
  options?: { status?: number; headers?: HeadersInit }
): Response
```

```ts
return json({ message: "ok" }, { status: 200 });
```

---

## SolidStart (from `"@solidjs/start"`)

### `defineConfig`

Defines the SolidStart configuration (Vite-based).

```ts
function defineConfig(
  config: SolidStartConfig
): SolidStartConfig
```

- **`config`** — Configuration object extending Vite config with SolidStart-specific options (`ssr`, `start`, etc.).

```ts
// vite.config.ts
import { defineConfig } from "@solidjs/start/config";
export default defineConfig({});
```

---

### `createMiddleware`

Creates middleware for the server entry. Handles request/response lifecycle.

```ts
function createMiddleware(
  fn: (event: RequestEvent) => { request: Request; response: Response }
): Middleware
```

```ts
const middleware = createMiddleware(({ request }) => {
  // modify request/response
  return { request, response: new Response() };
});
```

---

### `clientOnly`

Wraps a component import to only render on the client. Returns `null` during SSR.

```ts
function clientOnly<T extends Component<any>>(
  fn: () => Promise<{ default: T }>
): T & { preload: () => Promise<{ default: T }> }
```

- **`fn`** — Dynamic import function.
- **Returns** — A component that renders `null` on server and the real component on client.

```ts
const ClientOnlyWidget = clientOnly(() => import("./Widget"));
// Usage:
<ClientOnlyWidget />
```

---

### `HttpStatusCode`

Component to set the HTTP response status code during SSR.

```tsx
function HttpStatusCode(props: {
  code: number;
}): null
```

```tsx
<Show when={!user()}>
  <HttpStatusCode code={404} />
  <p>Not Found</p>
</Show>
```

---

### `HttpHeader`

Component to set an HTTP response header during SSR.

```tsx
function HttpHeader(props: {
  name: string;
  value: string;
  append?: boolean;
}): null
```

- **`name`** — Header name.
- **`value`** — Header value.
- **`append`** — If `true`, appends instead of setting.

```tsx
<HttpHeader name="Cache-Control" value="max-age=3600" />
```

---

### `StartServer`

Renders the full server-side app with built-in router and meta handling.

```tsx
function StartServer(props: {
  event: RequestEvent;
}): JSX.Element
```

```tsx
import { StartServer } from "@solidjs/start/server";
export default render((event) => <StartServer event={event} />);
```

---

### `StartClient`

Client-side entry point that hydrates the app.

```tsx
function StartClient(props?: {}): JSX.Element
```

```tsx
import { StartClient } from "@solidjs/start/client";
hydrate(() => <StartClient />, document.getElementById("root")!);
```

---

### `createHandler`

Creates a request handler for serverless / Node.js deployment.

```ts
function createHandler(
  fn: (event: RequestEvent) => Response | Promise<Response>,
  options?: { nonce?: string }
): (request: Request) => Promise<Response>
```

```ts
import { createHandler } from "@solidjs/start/server";
const handler = createHandler(({ request }) => new Response("OK"));
```

---

### `mount`

Mounts the SolidStart client-side app.

```ts
function mount(
  fn: () => JSX.Element,
  element: Element
): void
```

```ts
mount(() => <StartClient />, document.getElementById("root")!);
```

---

## Meta (from `"@solidjs/meta"`)

### `<MetaProvider>`

Provides the meta tag management context. Required for SSR.

```tsx
function MetaProvider(props: {
  tags?: Array<{ id?: string; name?: string; property?: string; [key: string]: any }>;
  children: JSX.Element;
}): JSX.Element
```

- **`tags`** — Initial tags (for hydration from SSR).

```tsx
<MetaProvider>
  <App />
</MetaProvider>
```

---

### `<Title>`

Sets the document title.

```tsx
function Title(props: {
  children: string;
}): null
```

```tsx
<Title>My Page Title</Title>
```

---

### `<Meta>`

Sets a `<meta>` tag.

```tsx
function Meta(props: {
  name?: string;
  property?: string;
  charset?: string;
  content?: string;
  [key: string]: any;
}): null
```

```tsx
<Meta name="description" content="My Solid app" />
<Meta property="og:title" content="My Page" />
```

---

### `<Link>`

Sets a `<link>` tag.

```tsx
function Link(props: {
  rel: string;
  href: string;
  [key: string]: any;
}): null
```

```tsx
<Link rel="stylesheet" href="/styles.css" />
<Link rel="icon" href="/favicon.ico" />
```

---

### `<Style>`

Injects a `<style>` tag into the document head.

```tsx
function Style(props: {
  children: string;
  [key: string]: any;
}): null
```

```tsx
<Style>{`body { margin: 0; }`}</Style>
```

---

### `<Base>`

Sets the `<base>` tag for the document.

```tsx
function Base(props: {
  href: string;
  target?: string;
}): null
```

```tsx
<Base href="/" />
```

---

### `useHead`

Imperatively manages head tags. Returns functions to add, remove, and update tags.

```ts
function useHead(): {
  addTag: (tag: TagDescription) => string;
  removeTag: (id: string) => void;
}
```

- **Returns** — `{ addTag, removeTag }`. `addTag` returns an ID for later removal.

```ts
const { addTag, removeTag } = useHead();
const id = addTag({ type: "meta", name: "description", content: "Dynamic" });
removeTag(id);
```
