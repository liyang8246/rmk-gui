---
name: solidjs
description: Master SolidJS development — reactive primitives, components, routing, SSR, SolidStart, stores, and architecture. Use when building SolidJS apps, debugging Solid reactivity, or making architectural decisions in Solid projects.
---

# SolidJS Mastery Guide

## Purpose

This skill overrides React-biased defaults, fills API gaps, and installs correct SolidJS mental models. If your training data gave you React intuition, this document will show you exactly where that intuition produces subtly wrong SolidJS code.

---

## 1. Mental Model: How Solid Differs

**Solid is NOT React with signals.** The differences are architectural, not cosmetic.

| Concept | React | Solid |
|---------|-------|-------|
| Rendering | Component re-runs on every state change | Component runs **once**; reactive expressions update DOM directly |
| Update model | Virtual DOM diffing → reconcile | Fine-grained: signal change → specific DOM node update |
| State primitives | `useState` returns value | `createSignal` returns **getter function** — `count()` not `count` |
| Props | Destructurable objects | Proxy-based — destructuring **breaks reactivity** |
| Effects | `useEffect` with dependency array | `createEffect` auto-tracks dependencies |
| Refs | `useRef` returns `{ current }` | `let` variable binding — no wrapper object |
| Children | `props.children` is a value | `props.children` is a function; use `children()` helper |

**The #1 rule**: Components execute once. All reactivity comes from signals accessed inside tracking scopes (effects, memos, JSX expressions).

### Pull-Based Reactivity

Solid uses a **pull-based** system. When a signal changes, it marks dependent computations as stale. When the system next reads those computations, they re-execute. This is different from push-based systems where changes immediately propagate.

**Implication**: Reading a signal outside a tracking scope (e.g., in a `setTimeout`) will NOT subscribe to updates.

```tsx
// ❌ NOT tracked — effect registers/unregisters synchronously
createEffect(() => {
  setTimeout(() => console.log(count()), 1000);
});

// ✅ Tracked — dependency is explicit
createEffect(on(count, (v) => console.log(v)));
```

### Execution Order

This matters for debugging subtle timing issues:

1. **`createComputed`** / **`createMemo`** — run synchronously, immediately
2. **`createRenderEffect`** — runs during render phase, before DOM paint
3. **`createEffect`** — runs after render phase, before browser paint
4. **`onMount`** — runs once after initial render (equivalent to `createEffect(() => untrack(fn))`)

→ For the internal tracking mechanism, see `references/reactive-system-internals.md`

---

## 2. Core Reactivity

### createSignal

```tsx
const [count, setCount] = createSignal(0);
// count()  → 0 (getter, tracks in current scope)
// setCount(5)  → sets to 5
// setCount(prev => prev + 1)  → functional update
```

**Options**: `{ name?: string, equals?: false | ((prev, next) => boolean), internal?: boolean }`

- `equals: false` — forces update even if value is same (useful for mutable objects)
- `name` — debug label for devtools

⚠️ **GOTCHA**: `count` is the getter function. `count` alone does NOT read the value. Always call it: `count()`.

### Decision Point: Signal vs Store vs Context

| Need | Use |
|------|-----|
| Single primitive value | `createSignal` |
| Derived computation | `createMemo` or derived signal |
| Complex nested state | `createStore` |
| Shared state across distant components | `createContext` + Provider |
| Temporary local state | `createSignal` in component |
| Global app state | `createContext` at root, or external store |

### Derived Signals vs createMemo

```tsx
// Derived signal — recomputes every time it's read by a tracking scope
const double = () => count() * 2;

// Memo — computes once per dependency change, caches result
const double = createMemo(() => count() * 2);
```

**Use memo when**: computation is expensive OR result is read by multiple consumers. For simple derivations, a function is fine.

⚠️ **GOTCHA**: Memos must be pure. Side effects in memos can cause infinite loops. Use `createEffect` for side effects.

### createEffect

```tsx
createEffect(() => {
  console.log(count()); // auto-tracks count
});
```

⚠️ **GOTCHA**: Don't set signals inside effects — can cause infinite loops. Use `createMemo` for derived state that feeds back.

Effects never run during SSR. `onMount` also doesn't run during SSR (it's client-only). For code that must run on both server and client, use `createComputed`. For client-only one-time setup, use `onMount`.

### on — Explicit Dependencies

```tsx
// Only track `count`, not other signals read inside
createEffect(on(count, (v) => {
  console.log(v, otherValue()); // otherValue not tracked
}));

// Defer: don't run immediately, only on change
createEffect(on(count, (v) => console.log(v), { defer: true }));
```

⚠️ **GOTCHA with stores**: `on(state.a, fn)` doesn't track. Use `on(() => state.a, fn)` — the arrow function accesses the proxy.

### onMount / onCleanup

```tsx
onMount(() => {
  // Runs once after initial render
  // Does NOT track dependencies
  const timer = setInterval(() => setCount(c => c + 1), 1000);
  onCleanup(() => clearInterval(timer));
});
```

**`onCleanup`** runs when: component unmounts, effect re-executes, or reactive scope is disposed.

### createDeferred — Deferred Updates

```tsx
const [value, setValue] = createSignal("");
const deferredValue = createDeferred(value, { timeoutMs: 300 });
// deferredValue() lags behind value() — updates deferred through scheduler
// Useful for expensive downstream computations that don't need to be synchronous
// Equivalent to React's useDeferredValue
```

### createReaction — One-Shot Tracking

```tsx
const track = createReaction(() => {
  console.log("value changed!"); // runs untracked, only on first change
});
track(() => value()); // start tracking value
setValue("new"); // logs "value changed!"
setValue("another"); // no-op until track() called again
```
Use for: one-time reactions, debugging, lazy subscription patterns.

### createSelector — Efficient Selection Highlighting

```tsx
const [selectedId, setSelectedId] = createSignal<number>();
const isSelected = createSelector(selectedId);

<For each={items}>
  {(item) => (
    <li classList={{ active: isSelected(item.id) }}>
      {item.name}
    </li>
  )}
</For>
```
Only the previously-selected and newly-selected items update — not the entire list. Critical for performance with large lists.

### from / observable — Observable Interop

```tsx
// Convert any subscribable (RxJS, etc.) to a Solid accessor
const time = from({
  subscribe(next) {
    const id = setInterval(() => next(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }
});

// Convert Solid accessor to Observable
const value$ = observable(mySignal);
```
Use for: integrating RxJS, Svelte stores, or any Observable-compatible source.

### getOwner / runWithOwner — Escape & Re-enter Owner Tree

```tsx
const owner = getOwner();

// Later, in async context (setTimeout, event handler, etc.)
setTimeout(() => {
  if (owner) {
    runWithOwner(owner, () => {
      createEffect(() => console.log("effect in original owner"));
      // Cleanup, context, and error boundaries work correctly
    });
  }
}, 1000);
```
Use for: creating reactive primitives inside async callbacks or event handlers where the owner context is lost.

### createResource — Async Data

```tsx
const [user, { mutate, refetch }] = createResource(userId, async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

// user()         → data or undefined
// user.loading   → boolean
// user.error     → error object
// user.state     → "unresolved" | "pending" | "ready" | "refreshing" | "errored"
// user.latest    → most recent resolved value
// mutate(newVal) → set optimistically
// refetch()      → re-trigger fetch
```

**With source signal**: First arg is a signal; fetcher re-runs when source changes.
**Without source**: Fetcher runs once immediately.

**Options**: `{ initialValue, deferStream, ssrLoadFrom, storage, onHydrated, name }`

> **Note**: `createResource` is the low-level primitive. In SolidStart/router contexts, prefer `createAsync()` with `query()` for automatic deduplication and integration with actions/revalidation.

### batch / untrack

```tsx
// Batch: multiple updates trigger one re-render
batch(() => {
  setA(1);
  setB(2);
}); // Effects fire once after batch completes

// Untrack: read a signal without subscribing
createEffect(() => {
  console.log(count(), untrack(() => other())); // only tracks count
});
```

**Auto-batched**: `createEffect`, `onMount`, store setters, mutable array mutations are automatically batched.

### createRoot — Escape the Owner Tree

```tsx
createRoot((dispose) => {
  // Computations here are NOT owned by any component
  // Must call dispose() manually to clean up
  const [count, setCount] = createSignal(0);
  createEffect(() => console.log(count()));
  dispose();
});
```

Use for: utility functions that create reactive primitives outside component scope.

### Error Propagation in Reactive Chains

- If `createMemo` throws, downstream computations see the error as a value change.
- If `createEffect` throws, the error propagates to the nearest `ErrorBoundary` or `catchError`.
- `catchError(fn, handler)` — like a reactive try/catch:
```tsx
catchError(
  () => { /* reactive scope */ },
  (err) => console.error(err)
);
```

### Transitions (Client-Side)

```tsx
const [pending, start] = useTransition();

await start(() => {
  setSelectedId(id); // Low-priority update
});

// pending() → true while transition is in progress
// Current UI stays visible until new one is ready
```

`startTransition(fn)` — same as `start` from `useTransition` but standalone. Returns a Promise.

### When to Use Transitions

| Scenario | Use Transition? |
|----------|----------------|
| Tab switching with data loading | ✅ Yes — keeps current tab visible while loading |
| Search input with filtered results | ✅ Yes — input stays responsive, results deferred |
| Form submission | ❌ No — use action/useSubmission instead |
| Navigation | ❌ No — router handles this automatically |
| Simple state toggle | ❌ No — overkill, just set the signal |

---

## 3. Stores & Complex State

### createStore

```tsx
const [store, setStore] = createStore({
  users: [{ id: 1, name: "Alice" }],
  count: 0,
});

// Read (reactive at property level)
store.users[0].name  // tracks users.0.name

// Write — path syntax
setStore("count", 1);
setStore("users", 0, "name", "Bob");
setStore("users", store.users.length, { id: 2, name: "Carol" }); // append

// Functional path — filter
setStore("users", u => u.id === 1, "name", "Alice Updated");

// Multiple indices
setStore("users", [0, 2], "active", false);

// Shallow merge (doesn't replace, merges)
setStore("users", 0, { name: "New", age: 30 });

// Full replacement
setStore(reconcile(newState)); // smart diff
```

**How it works**: Proxy-based deep reactivity. Each property access creates/reads a signal lazily. Nested objects are automatically proxied.

Store signals are **lazy** — a signal for each property is created only on first access. If no computation has ever read a property, there are no observers to notify when you set it. Always access store properties inside tracking scopes (effects, memos, JSX) to establish observers.

### Decision Point: createStore vs createMutable

| Feature | `createStore` | `createMutable` |
|---------|---------------|-----------------|
| API | `[get, set]` tuple | Single mutable proxy |
| Reads | Through store proxy | Through same proxy |
| Writes | Via `setStore()` function | Direct assignment `state.x = 5` |
| Safety | Setter validates path | No validation |
| Best for | Component state, controlled updates | Integrating with external libs, simple state |

### produce — Mutable Syntax for Stores

```tsx
import { produce } from "solid-js/store";

setStore("users", 0, produce(user => {
  user.name = "Updated";
  user.active = true;
}));
```

Use when you need to make multiple mutations in one batch without multiple `setStore` calls.

### reconcile — Smart Diffing

```tsx
import { reconcile } from "solid-js/store";

// Replaces only changed values, preserves reactivity
setStore("users", reconcile(newUsersArray, { key: "id" }));
// key: "id" — match items by id (default: "id")
// merge: true — push updates deeper instead of replacing branches
```

Use when receiving fresh data from server — reconciles against existing state.

### unwrap — Get Raw Data

```tsx
import { unwrap } from "solid-js/store";

const rawData = unwrap(store);
// WARNING: modifies the original underlying object!
// Do NOT assume it produces an isolated deep clone.
```

### createMutable

```tsx
const state = createMutable({ count: 0, list: [] });
state.count = 5;           // triggers reactivity
state.list.push("item");   // array methods are batched
```

Use `modifyMutable` for applying produce/reconcile to mutable stores:
```tsx
modifyMutable(state, produce(s => { s.count = 5; }));
```

---

## 4. Components & JSX

### Component Rules

1. **Names must start with capital letter** — lowercase = HTML element
2. **Function runs once** — all reactivity from signals/effects
3. **Props are a proxy** — destructuring breaks reactivity

```tsx
function MyComponent(props) {
  // ❌ Destructuring breaks reactivity
  const { name } = props;

  // ✅ Access directly or create derived signal
  const name = () => props.name;

  return <div>{props.name}</div>;
}
```

### Props Utilities

```tsx
// mergeProps — defaults while preserving reactivity
const merged = mergeProps({ greeting: "Hi" }, props);

// splitProps — destructure without breaking reactivity
const [local, rest] = splitProps(props, ["class", "style"]);

// children() — resolve children properly
// In Solid, props.children is a function, not resolved JSX
const resolved = children(() => props.children);
// resolved() → resolved JSX elements
// resolved.toArray() → as array
```

⚠️ **GOTCHA**: `props.children` is a function in Solid, not a value like React. You must use the `children()` helper to resolve it. The helper is a memo that resolves the children accessor — it resolves **before** parent effects run. If you need to inspect or transform children, always use `children()`.

### JSX Attributes

```tsx
// class + classList
<div class="base" classList={{ active: isActive(), editing: isEdit() }} />

// ⚠️ GOTCHA: If both class and classList are reactive, class overrides classList.
// Don't mix reactive class and classList on the same element.

// style — string or object
<div style="color: red" />
<div style={{ color: "red", "background-color": bg() }} />
<div style={{ "--custom": themeColor() }} />  {/* CSS custom properties */}

// innerHTML — UNSAFE, sanitize input!
<div innerHTML={userHtml} />

// textContent — safe, escaped text
<div textContent={userInput} />
```

### Event Handling

```tsx
// Delegated events (onClick, onInput, etc.) — attached to document
<button onClick={(e) => setCount(c => c + 1)}>Click</button>

// Bound data — first arg to handler
<li onClick={[handleClick, item.id]} />

// Native events (on:click) — attached directly to element
<div on:scroll={handleScroll} />

// ⚠️ GOTCHA: Delegated events (onClick) bubble to `document` first.
// `stopPropagation()` on a child works to stop bubbling to parents,
// but the event still reaches `document` where delegation happens.
// For reliable propagation control, use `on:click` (native events attached directly to the element).

// onInput fires immediately; onChange fires after blur.
// For real-time input tracking, use onInput.
```

### Two-Way Binding

```tsx
// bind:value — shorthand for signal + input event
const [name, setName] = createSignal("");
<input bind:value={name} />  // equivalent to value={name()} onInput={e => setName(e.target.value)}

// Works with: bind:value, bind:checked, bind:selectedIndex, etc.
// Only for signals — passes [getter, setter] pair
```

### Refs

```tsx
function Component() {
  let myDiv: HTMLDivElement;

  onMount(() => {
    console.log(myDiv); // ✅ available
  });

  return <div ref={myDiv}>Hello</div>;
}

// Callback ref (access before DOM attachment)
<div ref={(el) => { myDiv = el; doSomething(el); }} />

// TypeScript: use definite assignment
let myDiv!: HTMLDivElement;
```

### Custom Directives (use:*)

```tsx
// Define directive
function model(element: HTMLInputElement, value: () => [Accessor<string>, Setter<string>]) {
  const [field, setField] = value();
  createRenderEffect(() => element.value = field());
  element.addEventListener("input", (e) => setField(e.currentTarget.value));
}

// Use it
<input use:model={[name, setName]} />

// TypeScript: declare directive type
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      model: [Accessor<string>, Setter<string>];
    }
  }
}
```

### Attribute Directives

```tsx
// prop:* — force DOM property (not attribute)
<input type="checkbox" prop:indeterminate={true} />

// attr:* — force attribute (not property)
<div attr:data-value={computed()} />

// bool:* — boolean attribute
<button bool:disabled={isDisabled()} />

// /*@once*/ — mark expression as static (no reactivity)
<MyComponent value={/*@once*/ computeOnce()} />
```

### Integrating Non-Solid Libraries

Pattern for imperative libraries (D3, Three.js, Leaflet, etc.):

```tsx
function Chart(props) {
  let canvas: HTMLCanvasElement;
  let chart: ExternalChart;

  onMount(() => {
    chart = new ExternalChart(canvas, props.data);
  });

  createEffect(() => {
    // Update chart when data changes
    chart?.update(props.data);
  });

  onCleanup(() => {
    chart?.destroy();
  });

  return <canvas ref={canvas} />;
}
```

Key: `ref` + `onMount` for initialization, `createEffect` for reactive updates, `onCleanup` for teardown.

---

## 5. Control Flow

### Show — Conditional Rendering

```tsx
// Non-keyed (default) — child persists when condition toggles
<Show when={user()} fallback={<p>Loading...</p>}>
  <p>{user().name}</p>
</Show>

// Keyed — child re-mounts when `when` value changes
<Show when={user()} keyed>
  {(u) => <p>{u.name}</p>}  {/* u is typed, not Accessor */}
</Show>
```

Non-keyed Show with function children — the function receives an `Accessor`, not the raw value. Use `keyed` to get the raw value directly.

### Switch / Match — Multi-Branch

```tsx
<Switch fallback={<p>Unknown</p>}>
  <Match when={status() === "loading"}>
    <p>Loading...</p>
  </Match>
  <Match when={status() === "error"}>
    <p>Error!</p>
  </Match>
</Switch>
```

Both `Show` and `Match` support `keyed` prop for type-safe function children.

### For vs Index — List Rendering

```tsx
// For — keyed by value identity (item is stable, index is signal)
<For each={items()}>
  {(item, index) => <li>#{index()} {item.name}</li>}
</For>

// Index — keyed by index (index is stable, item is signal)
<Index each={items()}>
  {(item, index) => <li>#{index} {item().name}</li>}
</Index>
```

**When to use which**:
- `For`: objects, dynamic lists (add/remove/reorder), key by identity
- `Index`: primitives (strings/numbers), input fields, stable-length lists

⚠️ **GOTCHA**: In `For`, `index` is a signal (`index()`). In `Index`, `item` is a signal (`item()`). Don't mix them up.

### Dynamic — Dynamic Component Rendering

```tsx
<Dynamic component={views[selected()]} someProp="value" />
```

### ErrorBoundary

```tsx
<ErrorBoundary fallback={(err, reset) => (
  <div>
    <p>Error: {err.message}</p>
    <button onClick={reset}>Try Again</button>
  </div>
)}>
  <RiskyComponent />
</ErrorBoundary>
```

⚠️ **GOTCHA**: ErrorBoundary only catches rendering errors and reactive computation errors. NOT errors in event handlers or `setTimeout`.

### Portal — Render Outside DOM Hierarchy

```tsx
<Portal mount={document.body}>
  <div class="modal">...</div>
</Portal>

<Portal mount={svgElement} isSVG={true}>
  <rect fill="red" />
</Portal>
```

⚠️ **GOTCHA**: Portal events propagate through Solid's component tree, not the DOM tree.

### Suspense

```tsx
<Suspense fallback={<p>Loading...</p>}>
  <AsyncComponent />
</Suspense>
```

Works with `createResource` and `lazy` components. Nested boundaries handle their own dependencies.

### SuspenseList (Experimental)

```tsx
<SuspenseList revealOrder="forwards" tail="collapsed">
  <Suspense fallback={<p>Loading A...</p>}>{componentA()}</Suspense>
  <Suspense fallback={<p>Loading B...</p>}>{componentB()}</Suspense>
</SuspenseList>
```

> **Note**: SuspenseList has been experimental for a long time. Avoid in production unless you've tested thoroughly.

---

## 6. Context — Shared State

```tsx
// Create
const CounterContext = createContext<{ count: Accessor<number>; increment: () => void }>();

// Provide
function CounterProvider(props) {
  const [count, setCount] = createSignal(0);
  return (
    <CounterContext.Provider value={{ count, increment: () => setCount(c => c + 1) }}>
      {props.children}
    </CounterContext.Provider>
  );
}

// Consume
function Counter() {
  const ctx = useContext(CounterContext);
  if (!ctx) throw new Error("Missing CounterProvider");
  return <button onClick={ctx.increment}>{ctx.count()}</button>;
}
```

⚠️ **GOTCHA**: `useContext` returns `undefined` if no provider found. Always handle this (throw or default).

⚠️ **GOTCHA**: Define context in its own module to keep it stable across HMR imports.

**Custom hook pattern**:
```tsx
export function useCounter() {
  const ctx = useContext(CounterContext);
  if (!ctx) throw new Error("useCounter must be used within CounterProvider");
  return ctx;
}
```

### Context Reactivity Model

⚠️ **GOTCHA**: Context Provider `value` is NOT reactive. If you pass `value={count()}`, the context receives the current value at render time but won't update. To make context reactive, pass the **accessor** (signal getter), not the value:

```tsx
// ❌ NOT reactive — context gets snapshot of count
<CounterContext.Provider value={count()}>
  {props.children}
</CounterContext.Provider>

// ✅ Reactive — consumers call count() to get current value
<CounterContext.Provider value={count}>
  {props.children}
</CounterContext.Provider>
```

### Context Composition Patterns

```tsx
// Multiple contexts — nest providers
<ThemeContext.Provider value={theme}>
  <AuthContext.Provider value={auth}>
    <App />
  </AuthContext.Provider>
</ThemeContext.Provider>

// Or use MultiProvider from @solid-primitives/context
import { MultiProvider } from "@solid-primitives/context";
<MultiProvider values={[[ThemeContext, theme], [AuthContext, auth]]}>
  <App />
</MultiProvider>
```

### Context Decision Tree

| Need | Pattern |
|------|---------|
| Shared state across tree | Context + Provider |
| Reactive context updates | Pass signal accessors in value, not values |
| Default when no provider | Use createContext(defaultValue) |
| Error on missing provider | Custom hook that throws if useContext returns undefined |
| Multiple contexts | MultiProvider or nest manually |

---

## 7. SSR & Hydration

### Server-Side Rendering Functions

```tsx
// Sync rendering (simple, no Suspense)
const html = renderToString(() => <App />);

// Async rendering (waits for Suspense)
const html = await renderToStringAsync(() => <App />, { timeoutMs: 5000 });

// Streaming (best performance, streams HTML as data resolves)
const { pipe } = renderToStream(() => <App />);
pipe(writable);
```

### Hydration

```tsx
// Client-side: attach to server-rendered HTML
import { hydrate } from "solid-js/web";
hydrate(() => <App />, document.getElementById("app")!);
```

**Hydration rules**: Server and client must produce matching DOM. Same component tree, same conditional branches, same number of `createUniqueId` calls.

### Streaming SSR with Suspense

```tsx
// Shell renders immediately, async content streams as it resolves
<Suspense fallback={<p>Loading...</p>}>
  <AsyncData />
</Suspense>
```

With `renderToStream`: shell sent first, Suspense fallbacks shown, then replaced as data arrives.

**`deferStream`**: When a resource needs to set headers or redirect before streaming:
```tsx
const user = createResource(() => getCurrentUser(), { deferStream: true });
```

### isServer / isDev / getRequestEvent

```tsx
import { isServer } from "solid-js/web";
import { isDev } from "solid-js/web";

if (isServer) {
  // Server-only code (tree-shaken from client bundle)
}

// Access request in server functions
import { getRequestEvent } from "solid-js/web";
const event = getRequestEvent();
event?.request.headers.get("Authorization");
```

---

## 8. Routing (@solidjs/router)

### Setup

```tsx
import { Router, Route, A } from "@solidjs/router";
import { lazy } from "solid-js";

const Home = lazy(() => import("./pages/Home"));
const Users = lazy(() => import("./pages/Users"));

render(() => (
  <Router root={Layout}>
    <Route path="/" component={Home} />
    <Route path="/users" component={Users} />
    <Route path="/users/:id" component={User} />
    <Route path="*404" component={NotFound} />
  </Router>
), document.getElementById("app"));

function Layout(props) {
  return (
    <>
      <nav><A href="/">Home</A><A href="/users">Users</A></nav>
      {props.children}
    </>
  );
}
```

### Navigation

```tsx
// <A> component — SPA links with active state
<A href="/users" activeClass="active" inactiveClass="inactive" end={true}>Users</A>

// Programmatic navigation
const navigate = useNavigate();
navigate("/dashboard", { replace: true });
navigate(-1); // go back

// Redirect (in actions/queries)
throw redirect("/login");
```

### Route Parameters

```tsx
// Path params
<Route path="/users/:id" component={User} />
const params = useParams(); // params.id

// Optional params
<Route path="/stories/:id?" component={Stories} />

// Wildcard (must be last segment)
<Route path="/docs/*rest" component={Docs} />

// Multiple paths
<Route path={["login", "register"]} component={Auth} />

// Validation with MatchFilters
const filters = { id: /^\d+$/, parent: ["mom", "dad"] };
<Route path="/:parent/:id" component={User} matchFilters={filters} />
```

### Search Parameters

```tsx
const [searchParams, setSearchParams] = useSearchParams();
searchParams.page; // string
setSearchParams({ page: "2" }); // updates URL
```

### Data Fetching with Queries

```tsx
import { query, createAsync } from "@solidjs/router";

// Define query (deduplicates requests)
const getUser = query(async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}, "getUser");

// Use in component
function UserPage() {
  const user = createAsync(() => getUser(params.id));
  return <Show when={user()}>{u => <h1>{u.name}</h1>}</Show>;
}

// Preload on route
<Route path="/users/:id" component={UserPage} preload={({ params }) => getUser(params.id)} />
```

### Actions — Form Mutations

```tsx
const addPost = action(async (formData: FormData) => {
  const title = formData.get("title") as string;
  await savePost(title);
}, "addPost");

// Form with progressive enhancement
<form action={addPost} method="post">
  <input name="title" />
  <button type="submit">Add</button>
</form>

// With extra args
<form action={addPost.with(userId)} method="post">

// Track submission state
const submission = useSubmission(addPost);
<button disabled={submission.pending}>
  {submission.pending ? "Saving..." : "Save"}
</button>

// Programmatic trigger
const submit = useAction(addPost);
await submit(formData);
```

### Revalidation

After an action completes, all queries automatically revalidate. Manual revalidation:

```tsx
import { revalidate } from "@solidjs/router";
void revalidate(getUser.key); // all instances
void revalidate(getUser.keyFor(id)); // specific args
```

### Alternative Routers

```tsx
// HashRouter — client-side only, URLs like #/docs
<HashRouter>...</HashRouter>

// MemoryRouter — for testing
const history = createMemoryHistory();
<MemoryRouter history={history}>...</MemoryRouter>
```

### Key Primitives

| Primitive | Purpose |
|-----------|---------|
| `useParams` | Path parameters |
| `useSearchParams` | Query string |
| `useNavigate` | Programmatic navigation |
| `useLocation` | Current URL info |
| `useMatch` | Check if path matches |
| `useIsRouting` | Navigation in progress |
| `useCurrentMatches` | All matched routes |
| `useBeforeLeave` | Guard navigation |
| `usePreloadRoute` | Imperative preloading |
| `useResolvedPath` | Resolve relative paths |

→ For full routing reference, see `references/routing-deep-dive.md`

---

## 9. SolidStart (Meta-Framework)

### Project Structure

```
src/
├── routes/           # File-based routing
│   ├── index.tsx     # /
│   ├── about.tsx     # /about
│   ├── users/
│   │   ├── [id].tsx  # /users/:id
│   │   └── index.tsx # /users
│   └── api/
│       └── health.ts # API route
├── entry-client.tsx  # Client entry
├── entry-server.tsx  # Server entry
└── app.tsx           # App component
```

### File-Based Routing Syntax

| File Pattern | URL Pattern |
|-------------|-------------|
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `[id].tsx` | `/:id` (dynamic) |
| `[[id]].tsx` | `/:id?` (optional) |
| `[...slug].tsx` | `/*` (catch-all) |
| `(static)/about.tsx` | `/about` (group, no URL effect) |
| `users(details)/[id].tsx` | `/users/:id` (escapes parent layout) |

### Server Functions

```tsx
// Inline directive
const logMessage = async (msg: string) => {
  "use server";
  console.log(msg);
};

// File-level directive — all exports are server functions
"use server";
export async function getData() { /* server-only */ }
```

### API Routes

```tsx
// routes/api/users.ts
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ params }: APIEvent) {
  return new Response(JSON.stringify(users));
}

export async function POST({ request }: APIEvent) {
  const body = await request.json();
  return new Response(JSON.stringify(created), { status: 201 });
}
```

### Middleware

```tsx
// src/middleware/index.ts
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onRequest: (event) => {
    event.locals.startTime = Date.now();
  },
  onBeforeResponse: (event) => {
    console.log(`Request took ${Date.now() - event.locals.startTime}ms`);
  },
});
```

⚠️ **GOTCHA**: Middleware does NOT run on client-side navigation. Don't use it for authorization checks.

### SSR Entry (entry-server.tsx)

```tsx
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(
  (event) => <StartServer document={Document} />,
  { mode: "stream" }  // "sync" | "async" | "stream" (default)
);
```

### Configuration (app.config.ts)

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true,
  server: {
    preset: "node",  // "node" | "netlify_edge" | "vercel" | "cloudflare_module" | "bun" | "deno"
    prerender: { routes: ["/", "/about"], crawlLinks: true },
  },
  middleware: "src/middleware/index.ts",
  serialization: { mode: "json" },  // "json" (CSP-safe) | "js" (smaller)
});
```

### Security Patterns

```tsx
// CSP with nonce
const nonce = randomBytes(16).toString("base64");
event.response.headers.set("Content-Security-Policy",
  `default-src 'self'; script-src 'nonce-${nonce}' 'strict-dynamic'`
);

// CORS
if (TRUSTED_ORIGINS.includes(origin)) {
  event.response.headers.set("Access-Control-Allow-Origin", origin);
}

// CSRF — validate origin on mutating requests
if (!SAFE_METHODS.includes(request.method)) {
  const origin = new URL(request.headers.get("Origin")).origin;
  if (origin !== new URL(request.url).origin) {
    return json({ error: "forbidden" }, { status: 403 });
  }
}
```

### clientOnly — Client-Only Components

```tsx
import { clientOnly } from "@solidjs/start";
const Map = clientOnly(() => import("./Map"));

<Map fallback={<p>Loading map...</p>} />
```

### Sessions

```tsx
import { useSession } from "vinxi/http";

const session = await useSession({
  password: process.env.SESSION_SECRET, // ≥32 chars
  name: "session",
});
```

→ For full SolidStart reference, see `references/solidstart-reference.md`

---

## 10. TypeScript

### Essential tsconfig

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true
  }
}
```

### Component Types

```tsx
import type { Component, ParentComponent, VoidComponent, FlowComponent } from "solid-js";

const MyComp: Component<{ name: string }> = (props) => <div>{props.name}</div>;
const WithChildren: ParentComponent<{ title: string }> = (props) => (
  <div><h1>{props.title}</h1>{props.children}</div>
);
const NoChildren: VoidComponent<{ value: number }> = (props) => <span>{props.value}</span>;
```

### Signal Types

```tsx
const [count, setCount] = createSignal<number>(0);
// count: Accessor<number>
// setCount: Setter<number>

// Avoid | undefined by providing default
const [name, setName] = createSignal("default"); // Accessor<string>
const [name, setName] = createSignal<string>(); // Accessor<string | undefined>
```

### Event Types

```tsx
const handleClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (e) => {
  e.currentTarget; // HTMLButtonElement (correctly typed)
};

// Inline handlers get auto-inferred types
<button onClick={(e) => { /* e is MouseEvent */ }} />
```

### Control Flow Narrowing

```tsx
// Can't narrow accessors directly
const user = createSignal<User>(); // Accessor<User | undefined>
user()?.name // optional chaining works

// Use Show keyed for narrowing
<Show when={user()} keyed>
  {(u) => <p>{u.name}</p>}  {/* u is User, not User | undefined */}
</Show>

// Use createMemo for union type discrimination
const isLoaded = createMemo(() => user() !== undefined);
```

### Custom Type Extensions

```tsx
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      model: [Accessor<string>, Setter<string>];
    }
    interface CustomEvents {
      "my-event": { detail: string };
    }
  }
}
```

→ For full TypeScript guide, see `references/typescript-guide.md`

---

## 11. Architecture Patterns

### State Management Hierarchy

```
createSignal     → leaf values, primitives, simple toggles
derived signal   → cheap computations, no caching needed
createMemo       → expensive computations, read by multiple consumers
createStore      → complex nested state, fine-grained property updates
createContext    → shared state across component tree
createResource   → async data with loading/error states
```

### Performance Optimization

1. **Use `For` over `Index` for keyed lists** — preserves DOM nodes on reorder
2. **Use `createMemo` for expensive computations** — caches, prevents redundant recalculation
3. **Lazy-load routes** — `lazy(() => import("./Page"))`
4. **Use `untrack` to avoid unnecessary subscriptions** — read without tracking
5. **Batch updates** — `batch()` or rely on auto-batching
6. **`createSelector` for selection highlighting** — only updates the selected/deselected items
7. **Preload data on hover/focus** — `<A>` preloads by default; `usePreloadRoute` for imperative

### Scalable App Structure

```
src/
├── routes/           # File-based routing (SolidStart)
│   ├── (public)/     # Public layout group
│   └── (auth)/       # Auth layout group
├── components/       # Shared components
├── lib/              # Business logic, utilities
│   ├── db.ts         # Database queries
│   └── auth.ts       # Auth functions
├── contexts/         # Context providers
├── hooks/            # Custom reactive primitives
└── styles/           # Global styles
```

### Error Handling Architecture

```tsx
// Route level — catch rendering errors
<ErrorBoundary fallback={ErrorPage}>
  <App />
</ErrorBoundary>

// Reactive scope — catch computation errors
catchError(() => {
  createEffect(() => { /* risky computation */ });
}, (err) => logError(err));

// Resource level — handle async errors
const [data] = createResource(fetcher);
<Show when={data.error}>{(err) => <p>Error: {err.message}</p>}</Show>

// Action level — validation errors
const result = await action(formData);
if (result.error) { /* show validation */ }
```

### Debugging Decision Map

**Symptom: Effect doesn't fire**
→ Is the signal read in a tracking scope? Add `console.log` in getter to verify.
→ Is the read inside setTimeout/async? Use `on()` for explicit dependencies.
→ Is the effect inside a conditional that's false? Dependencies only tracked when accessed.

**Symptom: Infinite effect loop**
→ Are you setting a signal inside an effect that depends on it? Use `createMemo` instead.
→ Is a store setter triggering a re-read? Use `batch()` to group writes.

**Symptom: Component doesn't update**
→ Did you destructure props? Access `props.x` directly.
→ Is the value from a signal (calling `()`) or just the getter function?

**Symptom: Store update doesn't trigger**
→ Has the property been read in a tracking scope? (Lazy signal creation)
→ Use `createEffect(() => { store.prop; })` to establish tracking.

**Symptom: Hydration mismatch**
→ Do server and client produce the same DOM? Check conditionals.
→ Is `createUniqueId` called the same number of times on both sides?

**Symptom: Memory leak**
→ Is `onCleanup` registered for intervals, event listeners, subscriptions?
→ Are you using `createRoot` without calling `dispose()`?

→ For full debugging guide with DevTools and DEV hooks, see `references/debugging-guide.md`

---

## 12. Head Management (@solidjs/meta)

```tsx
import { MetaProvider, Title, Meta, Link } from "@solidjs/meta";

<MetaProvider>
  <Title>Page Title</Title>
  <Meta name="description" content="Page description" />
  <Link rel="canonical" href="https://example.com/page" />
</MetaProvider>
```

**Server**: Use `getAssets()` from `solid-js/web` to inject head tags into HTML.

---

## 13. Styling Options

| Method | Setup | Usage |
|--------|-------|-------|
| CSS files | `import "./style.css"` | `<div class="my-class">` |
| CSS Modules | `import styles from "./style.module.css"` | `<div class={styles.myClass}>` |
| SASS/LESS | Install preprocessor | `import "./style.scss"` |
| Tailwind v4 | `@import "tailwindcss"` in CSS | `<div class="p-4 text-red-500">` |
| UnoCSS | `unocssPlugin()` before `solidPlugin()` in Vite config | `<div class="p-4">` |
| Macaron | `@macaron-css/solid` | `styled("button", { base: {...} })` |

---

## 14. Testing

```tsx
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

test("counter increments", async () => {
  const user = userEvent.setup();
  const { getByRole } = render(() => <Counter />);
  const btn = getByRole("button");
  await user.click(btn);
  expect(btn).toHaveTextContent("2");
});

// Testing with context
const wrapper = (props) => <MyContext.Provider value="test" {...props} />;
render(() => <MyComponent />, { wrapper });

// Testing routes (first query must be async)
const { findByText } = render(() => <Route path="/:id" component={Page} />, { location: "/123" });
expect(await findByText("Item 123")).toBeInTheDocument();
```

→ For full testing patterns, see `references/testing-recipes.md`

---

## 15. @solid-primitives Ecosystem

Common primitives to avoid reimplementing:

| Package | Purpose |
|---------|---------|
| `@solid-primitives/storage` | LocalStorage/sessionStorage |
| `@solid-primitives/media` | Media query reactive |
| `@solid-primitives/keyboard` | Keyboard shortcuts |
| `@solid-primitives/schedule` | Debounce/throttle |
| `@solid-primitives/fetch` | Reactive fetch |
| `@solid-primitives/i18n` | Internationalization |
| `@solid-primitives/marker` | Map markers |
| `@solid-primitives/date` | Date utilities |
| `@solid-primitives/event-dispatcher` | Custom events |
| `@solid-primitives/context` | MultiProvider for nested contexts |

→ Full catalog: see `references/primitives-ecosystem.md`

---

## 16. React → Solid Migration Traps

| React Pattern | Solid Equivalent | Trap |
|---------------|-----------------|------|
| `useState` → value | `createSignal` → getter function | Write `count()` not `count` |
| `useEffect` with deps array | `createEffect` auto-tracks | Remove manual dependency arrays |
| `useCallback` | Not needed | Functions in components are stable (component runs once) |
| `useMemo` | `createMemo` | Memo returns accessor: `memo()` not `memo` |
| `useRef` | `let` variable | No `.current`, just use the variable |
| `props.children` value | `children()` helper | Resolves before parent effects |
| `key` prop on lists | `<For>` handles keys internally | Use `<For>` not `.map()` |
| `.map()` in JSX | `<For>` component | `.map()` recreates all items on change |
| `className` | `class` | Solid uses `class`, not `className` |
| `useContext` returns value | `useContext` may return undefined | Handle missing provider |
| Component re-renders | Component runs once | All reactivity from signals |

→ For detailed migration guide, see `references/react-migration-guide.md`
