# SolidJS TypeScript Guide

A comprehensive guide to using TypeScript with SolidJS, covering configuration, type signatures, and common patterns.

---

## Essential tsconfig.json

SolidJS relies on the compiler (Vite plugin, Babel, etc.) to transform JSX, **not** TypeScript itself. Because of this, TypeScript must be told to leave JSX alone and simply emit it as-is, while the `jsxImportSource` pragma tells both the type checker and the compiler where to find the JSX runtime.

### Key options explained

| Option | Value | Why |
|---|---|---|
| `jsx` | `"preserve"` | Prevents TypeScript from transforming JSX. The Solid compiler (vite-plugin-solid, babel-preset-solid) handles transformation instead. If this were set to `"react-jsx"`, TS would emit `React.createElement` calls that break Solid. |
| `jsxImportSource` | `"solid-js"` | Tells TypeScript where to find the `JSX` namespace, `createElement`, and `Fragment`. Without this, TS cannot resolve JSX types and you get `Cannot find name 'JSX'` errors. Also used by the Solid compiler to inject the correct imports. |
| `strict` | `true` | Enables all strict type-checking options. Solid's types are designed for strict mode; you will get incorrect inference without it. |
| `noUnusedLocals` / `noUnusedParameters` | `true` (recommended) | Helps catch dead code, especially useful with signals and destructured props you might forget to use. |

### Full recommended tsconfig

```jsonc
{
  "compilerOptions": {
    // ── JSX ──────────────────────────────────────────────────
    "jsx": "preserve",
    "jsxImportSource": "solid-js",

    // ── Module resolution ────────────────────────────────────
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "isolatedModules": true,

    // ── Strictness ───────────────────────────────────────────
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,

    // ── Interop ──────────────────────────────────────────────
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,

    // ── Language ─────────────────────────────────────────────
    "target": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    // ── Paths (optional) ─────────────────────────────────────
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

> **Note:** If you are using Solid Start, it generates its own `tsconfig.json`. Only customize the `compilerOptions` that Solid Start does not override.

---

## Signal Types

### createSignal<T>: returns [Accessor<T>, Setter<T>]

```ts
import { createSignal, Accessor, Setter } from "solid-js";

const [count, setCount] = createSignal<number>(0);
//  count: Accessor<number>   — () => number
//  setCount: Setter<number>  — overloads below
```

### Accessor<T> = () => T

An `Accessor` is simply a zero-argument function that returns the current value.

```ts
type Accessor<T> = () => T;

// Reading:
const current: number = count();
```

> **Important:** `Accessor` is a *function*, not a value. You must call it (`count()`) to read it, even inside JSX: `{count()}`.

### Setter<T> overloads

The setter supports two calling patterns:

```ts
// 1. Direct value — replace the signal value
setCount(5);

// 2. Functional update — receive previous value, return new value
setCount((prev) => prev + 1);

// The full Setter type (simplified):
type Setter<T> = {
  (value: T): T;                              // direct value
  (fn: (prev: T) => T): T;                    // functional update
  // When T is an object, partial merge is also supported:
  // (value: Partial<T>): T;                  // partial merge
  // (fn: (prev: T) => Partial<T>): T;        // functional partial merge
};
```

**Functional update is essential** when the new value depends on the old one — it avoids stale closure bugs.

```ts
// ❌ Potentially stale — reads current value at call time
const increment = () => setCount(count() + 1);

// ✅ Always correct — prev is guaranteed fresh
const increment = () => setCount((prev) => prev + 1);
```

### Avoiding | undefined with default values

If you create a signal without a default, its type includes `undefined`:

```ts
const [name, setName] = createSignal<string>();
//  name: Accessor<string | undefined>

// Provide a default to avoid | undefined:
const [name, setName] = createSignal<string>("");
//  name: Accessor<string>
```

This is especially important for union types:

```ts
// ❌ Every usage must handle undefined
const [user, setUser] = createSignal<User>();
// user() is User | undefined

// ✅ Use a sentinel or default
const [user, setUser] = createSignal<User | null>(null);
// user() is User | null — more intentional
```

### SignalOptions<T>

```ts
interface SignalOptions<T> {
  /** Internal signal — skips top-level reactive scope tracking */
  internal?: boolean;

  /** Custom equality check. Return true to skip update. */
  equals?: ((prev: T, next: T) => boolean) | false;

  /** Dev-only name for debugging */
  name?: string;
}

// Custom equality — skip updates when data is structurally equal
const [items, setItems] = createSignal<Item[]>([], {
  equals: (prev, next) => prev.length === next.length && prev.every((p, i) => p.id === next[i].id),
  name: "items",
});

// Disable equality check — always trigger update (useful for mutable objects)
const [obj, setObj] = createSignal<Config>(defaultConfig, {
  equals: false,
  name: "config",
});
```

---

## Component Types

Solid provides several component type helpers. Each encodes a different expectation about children and props.

### Component<P>

The base component type. Props must include `children?` explicitly if you accept children.

```ts
import { Component } from "solid-js";

type GreetingProps = {
  name: string;
  children?: JSX.Element;
};

const Greeting: Component<GreetingProps> = (props) => {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      {props.children}
    </div>
  );
};
```

### ParentComponent<P>

Same as `Component<P>` but automatically adds `children: JSX.Element` to the props type. Use this when your component always wraps children.

```ts
import { ParentComponent } from "solid-js";

type CardProps = {
  title: string;
  // children is already included
};

const Card: ParentComponent<CardProps> = (props) => {
  return (
    <div class="card">
      <h2>{props.title}</h2>
      <div class="card-body">{props.children}</div>
    </div>
  );
};
```

### VoidComponent<P>

A component that takes no children. Use for leaf components — buttons, inputs, icons.

```ts
import { VoidComponent } from "solid-js";

type IconProps = {
  name: string;
  size?: number;
};

const Icon: VoidComponent<IconProps> = (props) => {
  return <i class={`icon-${props.name}`} style={{ "font-size": `${props.size ?? 16}px` }} />;
};
```

### FlowComponent<P>

Used for control-flow components that receive a callback child (like `<Show>`, `<For>`). The `children` prop is typed as a function rather than `JSX.Element`.

```ts
import { FlowComponent } from "solid-js";

type MaybeProps<T> = {
  when: T | undefined | null | false;
  children: (item: T) => JSX.Element;
  fallback?: JSX.Element;
};

// FlowComponent adds children automatically, but for custom flow
// components you define the children signature yourself:
const Maybe: FlowComponent<MaybeProps<unknown>> = (props) => {
  // ...
  return <>{props.when ? props.children(props.when) : props.fallback}</>;
};
```

### When to use each

| Type | Children | Use case |
|---|---|---|
| `Component<P>` | Must add `children?` manually | General-purpose, flexible |
| `ParentComponent<P>` | `children: JSX.Element` auto-added | Layout / wrapper components |
| `VoidComponent<P>` | No children allowed | Leaf components (icons, inputs) |
| `FlowComponent<P>` | `children` is a function | Control-flow components |

### Props type inference

Solid's JSX compiles to template literals, not `React.createElement`. This means **props are always proxied** — TypeScript infers the type from your component's type annotation, not from JSX usage.

```ts
// Props are a reactive proxy — never destructure them!
const Bad: Component<{ name: string }> = ({ name }) => {
  // ❌ `name` is captured once, never updates
  return <span>{name}</span>;
};

const Good: Component<{ name: string }> = (props) => {
  // ✅ `props.name` re-evaluates each time
  return <span>{props.name}</span>;
};
```

---

## Event Types

### JSX.EventHandler<TElement, TEvent>

Solid provides a typed event handler type:

```ts
import { JSX } from "solid-js";

// <button onClick={handleClick}>Click</button>
const handleClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event) => {
  event.currentTarget; // HTMLButtonElement
  event.clientX;       // from MouseEvent
};
```

### Inline handler auto-inference

For inline handlers, TypeScript infers the event type from the JSX attribute:

```ts
<div
  onClick={(e) => {
    // e is MouseEvent & { currentTarget: HTMLDivElement; }
    console.log(e.currentTarget.getBoundingClientRect());
  }}
  onInput={(e) => {
    // e is InputEvent & { currentTarget: HTMLInputElement; }
    console.log(e.currentTarget.value);
  }}
/>;
```

> **Tip:** Prefer inline handlers or `JSX.EventHandler` over manual typing — they automatically narrow `currentTarget` to the correct element type.

### Custom event types

For custom DOM events (e.g., from Web Components), extend Solid's event map:

```ts
import { JSX } from "solid-js";

// 1. Declare the custom event and its detail type
interface MyCustomEvent extends Event {
  detail: { productId: string; quantity: number };
}

// 2. Extend JSX.CustomEvents (see Custom Extensions section)
declare module "solid-js" {
  namespace JSX {
    interface CustomEvents {
      "product-selected": MyCustomEvent;
    }
  }
}

// 3. Now on:* works with full type safety
<my-widget
  on:product-selected={(e) => {
    e.detail.productId;    // string
    e.detail.quantity;     // number
  }}
/>;
```

---

## Ref Types

### HTMLDivElement | undefined for strict null checks

Refs are assigned *after* the component mounts, so under strict null checks they start as `undefined`:

```ts
import { onMount } from "solid-js";

let canvas: HTMLCanvasElement | undefined;

onMount(() => {
  // Inside onMount, the ref is guaranteed assigned
  const ctx = canvas?.getContext("2d");
  ctx?.fillRect(0, 0, 100, 100);
});

return <canvas ref={canvas} />;
```

### Definite assignment assertion: ref!

If you are confident the ref is always used after mount, you can use the `!` assertion:

```ts
let canvas!: HTMLCanvasElement;

onMount(() => {
  // No null check needed
  const ctx = canvas.getContext("2d");
});

return <canvas ref={canvas} />;
```

> **Warning:** Using `!` suppresses the null check. Accessing the ref before mount will throw at runtime. Prefer `| undefined` when unsure.

### Refs as props

When forwarding a ref to a child component, type it as a function or `Directive`:

```ts
import { JSX } from "solid-js";

type InputProps = {
  ref?: (el: HTMLInputElement) => void;
  value: string;
};

const Input: Component<InputProps> = (props) => {
  return <input ref={props.ref} value={props.value} />;
};

// Usage:
let inputEl!: HTMLInputElement;
<Input
  ref={(el) => { inputEl = el; }}
  value="hello"
/>;
```

---

## Context Types

### createContext<T> with default value vs undefined

```ts
import { createContext, useContext } from "solid-js";

// ✅ With default value — context is always defined
const ThemeContext = createContext({
  theme: "light" as "light" | "dark",
  toggle: () => {},
});

const [themeCtx] = useContext(ThemeContext);
themeCtx.theme; // "light" | "dark" — no undefined

// ✅ Without default — must handle undefined
const AuthContext = createContext<{
  user: Accessor<User | null>;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}>();

const auth = useContext(AuthContext);
if (!auth) throw new Error("AuthContext must be used within AuthProvider");
auth.user(); // Accessor<User | null>
```

> **Best practice:** Provide a default value when possible. It avoids the need for null checks at every consumption site and makes the provider optional for testing.

### Using ReturnType for complex context types

When the context value is created by a function, use `ReturnType` to avoid duplicating the type:

```ts
function createAuth() {
  const [user, setUser] = createSignal<User | null>(null);
  const login = async (creds: Credentials) => { /* ... */ };
  const logout = () => setUser(null);
  return { user, login, logout } as const;
}

type AuthContextValue = ReturnType<typeof createAuth>;

const AuthContext = createContext<AuthContextValue>();

// Provider
const AuthProvider: ParentComponent = (props) => {
  return (
    <AuthContext.Provider value={createAuth()}>
      {props.children}
    </AuthContext.Provider>
  );
};

// Consumer
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

### HMR stability: define context in own module

During Hot Module Replacement, module-level code re-executes. If `createContext` is called inside a component, a new context instance is created on every HMR update, breaking the provider/consumer link.

```ts
// ✅ context.ts — own module, stable across HMR
import { createContext } from "solid-js";

export const ThemeContext = createContext<{
  theme: "light" | "dark";
  toggle: () => void;
}>();

// ✅ provider.tsx — imports the stable context
import { ThemeContext } from "./context";

export const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme: theme(), toggle }}>
      {props.children}
    </ThemeContext.Provider>
  );
};
```

---

## Control Flow Narrowing

### Can't narrow accessors directly

In Solid, signals are *functions*. TypeScript cannot narrow the return type of a function call across code boundaries:

```ts
const [user, setUser] = createSignal<User | null>(null);

// ❌ TypeScript cannot narrow this — user() might change between checks
if (user()) {
  // user() is still User | null here from TS perspective
  // because it's a function call, not a binding
  user().name; // Error: Object is possibly null
}
```

### Optional chaining: user()?.name

The simplest approach — use optional chaining on every access:

```ts
const [user, setUser] = createSignal<User | null>(null);

// ✅ Safe but repetitive
const name = user()?.name ?? "Anonymous";
const email = user()?.email ?? "";
```

### Show keyed: `<Show when={user()} keyed>`

The `keyed` prop on `<Show>` passes the narrowed value to the children function:

```ts
import { Show } from "solid-js";

const [user, setUser] = createSignal<User | null>(null);

// ✅ The callback parameter `u` is narrowed to User (not User | null)
<Show when={user()} keyed>
  {(u) => (
    <div>
      <p>{u.name}</p>      {/* u: User — no null check */}
      <p>{u.email}</p>     {/* u: User — fully typed */}
    </div>
  )}
</Show>;
```

Without `keyed`, the `when` value is not passed to children:

```ts
// Without keyed — no narrowing in children
<Show when={user()}>
  {/* children still see user() as User | null */}
  <p>{user()?.name}</p>
</Show>
```

### createMemo for union type discrimination

Use `createMemo` to create a derived signal that TypeScript can narrow:

```ts
import { createMemo, Show } from "solid-js";

type Result = { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: Item[] };

const [result, setResult] = createSignal<Result>({ status: "loading" });

// ✅ createMemo lets you derive a narrow type
const isLoading = createMemo(() => result().status === "loading");
const error = createMemo(() => {
  const r = result();
  return r.status === "error" ? r : null;
});
const items = createMemo(() => {
  const r = result();
  return r.status === "success" ? r.data : [];
});

// Use in templates
<Show when={isLoading()}>
  <p>Loading...</p>
</Show>

<Show when={error()} keyed>
  {(e) => <p class="error">{e.message}</p>}
</Show>

<For each={items()}>
  {(item) => <ItemRow item={item} />}
</For>
```

### Switch/Match narrowing

`<Switch>` / `<Match>` also support narrowing via `keyed`:

```ts
import { Switch, Match } from "solid-js";

<Switch fallback={<p>Unknown status</p>}>
  <Match when={error()} keyed>
    {(e) => <p class="error">{e.message}</p>}
  </Match>
  <Match when={isLoading()}>
    <p>Loading...</p>
  </Match>
</Switch>
```

---

## Store Types

### createStore<T> type inference

```ts
import { createStore } from "solid-js/store";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  filter: "all" | "active" | "completed";
}

const [state, setState] = createStore<TodoState>({
  todos: [],
  filter: "all",
});

// state.todos   → Todo[]
// state.filter  → "all" | "active" | "completed"
// state.todos[0]?.text → string | undefined
```

The store is **deeply reactive** — nested objects and arrays are also reactive proxies:

```ts
// Accessing a nested property is reactive
state.todos[0].text; // tracked automatically
```

### SetStoreFunction<T> overloads

The setter supports multiple patterns for updates:

```ts
// 1. Direct partial merge (shallow merge at root)
setState({ filter: "active" });

// 2. Path + value (deep update)
setState("filter", "completed");

// 3. Path + partial (deep merge)
setState("todos", 0, { completed: true });

// 4. Path + functional update
setState("todos", 0, (todo) => ({
  ...todo,
  text: todo.text + " (edited)",
}));

// 5. Array splice-style for lists
setState("todos", (todos) => [...todos, { id: Date.now(), text: "New", completed: false }]);

// 6. Multiple updates at once
setState([
  { filter: "all" as const },
  ["todos", 0, { completed: true }],
]);
```

### Path typing

Solid's `SetStoreFunction` provides type-safe paths:

```ts
// ✅ Valid paths are type-checked
setState("todos", 0, "text", "Updated");     // OK
setState("todos", 0, "completed", true);      // OK

// ❌ Invalid paths produce type errors
setState("todos", 0, "invalid_key", "value"); // Error — not a key of Todo
setState("filter", "invalid");                 // Error — not "all" | "active" | "completed"
```

> **Note:** Path type safety works up to reasonable depth. Very deep or dynamic paths may fall back to `any`.

---

## Custom Extensions

Solid provides extension points in the `JSX` namespace for custom directives, events, and properties.

### JSX.Directives interface for use:* directives

```ts
import { JSX } from "solid-js";

// 1. Define the directive
function clickOutside(el: HTMLElement, accessor: () => boolean) {
  const onClick = (e: MouseEvent) => {
    if (!el.contains(e.target as Node)) {
      accessor(); // trigger the bound expression
    }
  };
  document.addEventListener("click", onClick);
  onCleanup(() => document.removeEventListener("click", onClick));
}

// 2. Register in JSX.Directives for type safety
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      clickOutside: boolean; // the type of the bound value
    }
  }
}

// 3. Usage — now fully typed
<div use:clickOutside={true} />;
```

The value type in `Directives` determines what the bound expression must evaluate to. The directive function receives `(element, accessor)` where `accessor()` returns that type.

### DirectiveFunctions interface

If you want to type the directive function itself, use `DirectiveFunctions`:

```ts
import type { DirectiveFunctions } from "solid-js";

type MyDirectives = {
  clickOutside: boolean;
  tooltip: string;
};

// This ensures your directive map is correctly typed
const directives: DirectiveFunctions<MyDirectives> = {
  clickOutside(el, accessor) {
    const shouldListen = accessor(); // boolean
    // ...
  },
  tooltip(el, accessor) {
    const text = accessor(); // string
    // ...
  },
};
```

### JSX.CustomEvents interface

For custom DOM events (e.g., from Web Components or `on:*` syntax):

```ts
declare module "solid-js" {
  namespace JSX {
    interface CustomEvents {
      "my-event": CustomEvent<{ value: number }>;
      "drag-complete": DragEvent;
    }
  }
}

// Usage with on:* syntax (lowercase, colon-separated)
<div
  on:my-event={(e) => {
    e.detail.value; // number — fully typed
  }}
  on:drag-complete={(e) => {
    e.dataTransfer; // DataTransfer — fully typed
  }}
/>;
```

### JSX.CustomProperties interface

For custom HTML attributes that are not in the standard spec:

```ts
declare module "solid-js" {
  namespace JSX {
    interface CustomProperties {
      "my-custom-prop"?: string;
      "v-bind"?: Record<string, unknown>;
    }
  }
}

// Usage — no more "Property does not exist" errors
<div my-custom-prop="hello" v-bind={{ class: "active" }} />;
```

---

## Resource Types

### Resource<T> type

A `Resource<T>` is a special signal that tracks async state. It extends `Accessor<T | undefined>` with additional reactive properties:

```ts
interface Resource<T> {
  (): T | undefined;         // current value (undefined while loading)
  state: "unresolved" | "pending" | "ready" | "refreshing" | "errored";
  loading: boolean;          // true when fetching
  error: any;                // error value if errored
  latest: T | undefined;     // latest value, even if refreshing
}
```

```ts
import { createResource } from "solid-js";

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

const [user] = createResource(() => userId(), fetchUser);

// Reading
user();          // User | undefined
user.loading;    // boolean
user.error;      // any
user.state;      // ResourceState
user.latest;     // User | undefined (doesn't go to undefined on refetch)
```

### ResourceReturn<T, R> type

The full return type from `createResource`:

```ts
type ResourceReturn<T, R = T> = [
  Resource<T>,                                              // read signal
  {
    mutate: (v: T | undefined) => T | undefined;            // sync setter
    refetch: (info?: R) => T | undefined;                   // re-run fetcher
  }
];
```

```ts
const [user, { mutate, refetch }] = createResource(() => userId(), fetchUser);

// Mutate — immediately set the value (optimistic updates)
mutate({ id: 1, name: "Optimistic" });

// Refetch — re-run the fetcher
refetch();

// Refetch with info passed to fetcher
refetch({ force: true });
```

### ResourceOptions<T, S> type

```ts
interface ResourceOptions<T, S = unknown> {
  /** Initial value before first fetch completes */
  initialValue?: T;

  /** Name for debugging */
  name?: string;

  /** Custom equality function */
  equals?: ((prev: T, next: T) => boolean) | false;

  /** Source signal — when it changes, refetch automatically */
  source?: Accessor<S>;

  /** Called when fetcher resolves */
  onHydrated?: (k: { value: T }) => void;

  /** Storage — use a store instead of signal */
  storage?: (init: T | undefined) => [get: Accessor<T>, set: Setter<T>];

  /** SSR defer streams — server-side only */
  deferStream?: boolean;

  /** SSR serialization key */
  ssrLoadFrom?: "initial" | "server";

  /** Skip SSR — only fetch on client */
  skipHydrate?: boolean;
}
```

```ts
const [user] = createResource(
  () => userId(),    // source: reactive dependency
  fetchUser,
  {
    initialValue: defaultUser,
    name: "user-resource",
    storage: createSignal, // custom storage
  }
);
```

---

## Common Type Patterns

### Typing props with mergeProps/splitProps

`mergeProps` merges multiple props objects, with later ones taking priority. TypeScript infers the intersection type:

```ts
import { mergeProps } from "solid-js";

type ButtonProps = {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: JSX.Element;
};

const Button: Component<ButtonProps> = (rawProps) => {
  // mergeProps provides defaults while preserving reactivity
  const props = mergeProps({ variant: "primary", size: "md" } as ButtonProps, rawProps);

  return (
    <button class={`btn btn-${props.variant} btn-${props.size}`}>
      {props.children}
    </button>
  );
};
```

`splitProps` splits a props object into groups. Each group is a reactive proxy:

```ts
import { splitProps } from "solid-js";

type InputProps = {
  value: string;
  onChange: (v: string) => void;
  label: string;
  error?: string;
  class?: string;
};

const Input: Component<InputProps> = (allProps) => {
  // Split into groups — each is a reactive proxy
  const [local, rest] = splitProps(allProps, ["label", "error", "class"]);

  return (
    <div class={local.class}>
      <label>{local.label}</label>
      <input value={rest.value} onInput={(e) => rest.onChange(e.currentTarget.value)} />
      {local.error && <span class="error">{local.error}</span>}
    </div>
  );
};
```

### Typing children() helper

The `children()` helper resolves and tracks the children of a component:

```ts
import { children, Component, JSX } from "solid-js";

type WrapperProps = {
  children: JSX.Element;
};

const Wrapper: Component<WrapperProps> = (props) => {
  // children() returns a memoized accessor
  const resolved = children(() => props.children);

  // resolved() is JSX.Element
  return <div class="wrapper">{resolved()}</div>;
};
```

For functional children, type the function signature:

```ts
type RenderProps = {
  children: (item: Item) => JSX.Element;
  items: Item[];
};

const ItemList: Component<RenderProps> = (props) => {
  return (
    <ul>
      <For each={props.items}>
        {(item) => props.children(item)}
      </For>
    </ul>
  );
};
```

### Typing refs forwarded to child components

```ts
import { Component, JSX } from "solid-js";

// Child component — accepts a ref callback
type FancyInputProps = {
  ref?: (el: HTMLInputElement) => void;
  value: string;
  placeholder?: string;
};

const FancyInput: Component<FancyInputProps> = (props) => {
  return (
    <div class="fancy-input-wrapper">
      <input
        ref={(el) => props.ref?.(el)}
        value={props.value}
        placeholder={props.placeholder}
      />
    </div>
  );
};

// Parent component — holds the ref
const Form: Component = () => {
  let inputRef!: HTMLInputElement;

  const focusInput = () => inputRef.focus();

  return (
    <form>
      <FancyInput
        ref={(el) => { inputRef = el; }}
        value=""
        placeholder="Type here..."
      />
      <button type="button" onClick={focusInput}>Focus</button>
    </form>
  );
};
```

### Typing event handlers with bound data

Solid supports `on:` and `on` with bound data via curried handlers:

```ts
import { For, Component } from "solid-js";

type Item = { id: number; name: string };

type ItemListProps = {
  items: Item[];
  onSelect: (id: number) => void;
};

const ItemList: Component<ItemListProps> = (props) => {
  return (
    <ul>
      <For each={props.items}>
        {(item) => (
          <li>
            <button onClick={[props.onSelect, item.id]}>
              {item.name}
            </button>
          </li>
        )}
      </For>
    </ul>
  );
};

// Usage
const [selectedId, setSelectedId] = createSignal<number | null>(null);

<ItemList
  items={items()}
  onSelect={setSelectedId}
/>;
```

The `[handler, data]` tuple pattern — Solid calls `handler(data, event)`:

```ts
// The handler type for bound data
function handleSelect(id: number, event: MouseEvent): void {
  console.log(`Selected ${id}`, event);
}

<button onClick={[handleSelect, 42]}>Click</button>;
```

### Generic component patterns

```ts
import { Component, JSX } from "solid-js";

// Generic list component
function List<T>(props: {
  items: T[];
  render: (item: T, index: () => number) => JSX.Element;
  key: (item: T) => string | number;
}): JSX.Element {
  return (
    <ul>
      <For each={props.items} fallback={<p>No items</p>}>
        {(item, index) => <li>{props.render(item, index)}</li>}
      </For>
    </ul>
  );
}

// Usage — T is inferred as User
<List
  items={users()}
  key={(u) => u.id}
  render={(user) => <span>{user.name}</span>}
/>;
```

> **Note:** Generic components cannot use `Component<P>` because TypeScript does not allow generic arrow functions with `Component<P>` syntax. Use a plain function declaration instead.

### Typing dynamic components

```ts
import { Dynamic } from "solid-js/web";

type Tag = "h1" | "h2" | "h3" | "p";

type HeadingProps = {
  as?: Tag;
  children: JSX.Element;
};

const Heading: Component<HeadingProps> = (props) => {
  return (
    <Dynamic component={props.as ?? "h2"}>
      {props.children}
    </Dynamic>
  );
};
```

---

## Quick Reference

| Pattern | Type |
|---|---|
| `createSignal<T>(initial)` | `[Accessor<T>, Setter<T>]` |
| `createMemo<T>(fn)` | `Accessor<T>` |
| `createEffect(fn)` | `void` |
| `createStore<T>(initial)` | `[T, SetStoreFunction<T>]` |
| `createResource<T>(source, fetcher)` | `[Resource<T>, { mutate, refetch }]` |
| `createContext<T>()` | `Context<T \| undefined>` |
| `Component<P>` | `(props: P & { children?: JSX.Element }) => JSX.Element` |
| `ParentComponent<P>` | `(props: P & { children: JSX.Element }) => JSX.Element` |
| `VoidComponent<P>` | `(props: P) => JSX.Element` |
| `FlowComponent<P>` | `(props: P & { children: any }) => JSX.Element` |
| `JSX.EventHandler<E, Ev>` | `(event: Ev & { currentTarget: E }) => void` |
| `Accessor<T>` | `() => T` |
| `Setter<T>` | `(value: T \| ((prev: T) => T)) => T` |
| `Resource<T>` | `Accessor<T \| undefined> & { state, loading, error, latest }` |
