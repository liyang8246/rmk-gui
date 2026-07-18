# React → Solid Migration Guide

A comprehensive guide for developers moving from React to SolidJS. Covers concept mapping, common traps, side-by-side examples, and patterns that don't translate directly.

---

## Concept Mapping

| React Concept | Solid Equivalent | Key Difference |
|---------------|-----------------|----------------|
| `useState` | `createSignal` | Returns getter function, not value |
| `useEffect` | `createEffect` | Auto-tracks, no dependency array |
| `useLayoutEffect` | `createRenderEffect` | Runs during render phase |
| `useMemo` | `createMemo` | Returns accessor function |
| `useCallback` | Not needed | Functions are stable (component runs once) |
| `useRef` | `let` variable | No `.current` wrapper |
| `useContext` | `useContext` | Same API, but may return `undefined` |
| `React.memo` | Not needed | Components don't re-run |
| `key` prop | `<For>` component | Built-in keyed list rendering |
| `className` | `class` | Solid uses HTML attribute name |
| `children` prop | `children()` helper | Must resolve with helper |
| `ErrorBoundary` | `ErrorBoundary` | Same concept, different API |
| `Suspense` | `Suspense` | Works with `createResource` |
| `lazy` | `lazy` | Same API, `.preload()` available |
| `Fragment` | `<>...</>` | Same syntax |

---

## Migration Traps (Detailed)

### 1. Signal Access Syntax

The most fundamental difference: Solid signals return a **getter function**, not a value.

```jsx
// React — count IS the value
const [count, setCount] = useState(0);
console.log(count); // 0

// Solid — count() IS the value, count is the getter function
const [count, setCount] = createSignal(0);
console.log(count);   // [Function]
console.log(count()); // 0
```

**Why it matters:** Every place you read a signal, you must call it as a function. This is what enables Solid's fine-grained reactivity — the framework knows exactly which signals are accessed during each reactive computation.

**Common mistake:**
```jsx
// ❌ Wrong — this is the getter function, always truthy
if (count) { ... }

// ✅ Correct — this is the actual value
if (count()) { ... }
```

### 2. Component Execution Model

React components re-execute on every state change. Solid components run **once**. JSX expressions are reactive.

```jsx
// React — this logs on EVERY render
function Counter() {
  const [count, setCount] = useState(0);
  console.log("I render every time count changes!"); // runs repeatedly
  return <div>{count}</div>;
}

// Solid — this logs ONCE
function Counter() {
  const [count, setCount] = createSignal(0);
  console.log("I run only once!"); // runs once
  return <div>{count()}</div>;     // this expression is reactive
}
```

**Implications:**
- No need for `useCallback` or `useMemo` for referential equality — functions and values created in the component body are already stable.
- Side effects in the component body run once, not on every render. Use `createEffect` for reactive side effects.
- You cannot "recalculate" a variable by relying on re-renders. Use `createMemo` or `createEffect` instead.

```jsx
// ❌ React pattern — won't work in Solid
function Component() {
  const [items, setItems] = createSignal([]);
  const total = items().reduce((sum, i) => sum + i.value, 0); // NOT reactive
  return <div>{total}</div>;
}

// ✅ Solid — use createMemo for derived reactive values
function Component() {
  const [items, setItems] = createSignal([]);
  const total = createMemo(() => items().reduce((sum, i) => sum + i.value, 0));
  return <div>{total()}</div>;
}
```

### 3. Props Destructuring

Destructuring props at the top of a component **breaks reactivity** in Solid because it reads the value once at component creation time.

```jsx
// React — destructuring is fine, component re-runs with new props
function Greeting({ name, age }) {
  return <div>{name} is {age}</div>;
}

// Solid — ❌ BREAKS REACTIVITY: values captured once, never update
function Greeting({ name, age }) {
  return <div>{name} is {age}</div>;
}

// Solid — ✅ Access props directly (reactive proxy)
function Greeting(props) {
  return <div>{props.name} is {props.age}</div>;
}

// Solid — ✅ Use splitProps when you need to separate props
function Greeting(props) {
  const [local, rest] = splitProps(props, ["name"]);
  return <div>{local.name} is {rest.age}</div>;
}

// Solid — ✅ Use mergeProps to merge/override reactively
function Greeting(props) {
  const merged = mergeProps({ age: 30 }, props);
  return <div>{merged.name} is {merged.age}</div>;
}
```

**Rule of thumb:** Never destructure props in a Solid component's parameter list or at the top of the function body. Always access `props.x` directly in JSX or inside reactive computations.

### 4. List Rendering

```jsx
// React — .map() with key
function ItemList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// Solid — <For> component with built-in keying
function ItemList(props) {
  return (
    <ul>
      <For each={props.items}>
        {(item) => <li>{item.name}</li>}
      </For>
    </ul>
  );
}
```

**`<For>` advantages:**
- Built-in keyed reconciliation — no separate `key` prop needed.
- The callback receives the item **and** an index accessor:
  ```jsx
  <For each={props.items}>
    {(item, index) => <li>{index()}: {item.name}</li>}
  </For>
  ```
- Only the DOM nodes for changed items update — true fine-grained updates, not virtual DOM diffing.

**`<Index>` alternative:** Use `<Index>` when items are fixed but their content changes (keyed by index instead of value):
```jsx
<Index each={props.items}>
  {(item) => <li>{item()}</li>}
</Index>
```

**Avoid `.map()` in Solid** — it re-creates all DOM nodes on every change:
```jsx
// ❌ Anti-pattern in Solid
{items().map(item => <li>{item.name}</li>)}

// ✅ Use <For> instead
<For each={items()}>{(item) => <li>{item.name}</li>}</For>
```

### 5. Effect Dependencies

```jsx
// React — manual dependency array
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]); // must remember to list all deps

// Solid — automatic dependency tracking
createEffect(() => {
  document.title = `Count: ${count()}`;
  // count() is automatically tracked — no dependency array needed
});
```

**How auto-tracking works:** Solid tracks which signals are read during the effect's execution. Any signal accessed via its getter function (e.g., `count()`) becomes a dependency automatically.

**Pitfall — conditional tracking:**
```jsx
createEffect(() => {
  if (someCondition()) {
    console.log(count()); // count only tracked when someCondition() is true
  }
});
// Dependencies can change between runs!
```

**Explicit dependencies with `on`:**
```jsx
// If you want to be explicit (or ignore the return value of a signal)
createEffect(on(count, (value) => {
  document.title = `Count: ${value}`;
}));

// With { defer: true } to skip the initial run
createEffect(on(count, (value) => {
  document.title = `Count: ${value}`;
}, { defer: true }));
```

### 6. Conditional Rendering

```jsx
// React — logical && and ternary
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <div>
      {isLoggedIn && <Dashboard />}
      {isLoggedIn ? <Dashboard /> : <Login />}
    </div>
  );
}

// Solid — <Show> component (idiomatic)
function App() {
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  return (
    <div>
      <Show when={isLoggedIn()}>
        <Dashboard />
      </Show>
      <Show when={isLoggedIn()} fallback={<Login />}>
        <Dashboard />
      </Show>
    </div>
  );
}
```

**Why `<Show>` over `&&`:**
- Supports `fallback` prop for else-branches.
- Supports `keyed` prop to destroy/recreate content when the condition changes:
  ```jsx
  <Show when={selectedUser()} keyed>
    {(user) => <UserProfile user={user} />}
  </Show>
  ```
- More explicit and readable for complex conditions.

**`<Switch>` / `<Match>` for multiple conditions:**
```jsx
// React — chained ternaries or early returns
function Status({ status }) {
  return (
    <div>
      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorView />}
      {status === "success" && <Content />}
    </div>
  );
}

// Solid — <Switch>/<Match>
function Status(props) {
  return (
    <Switch fallback={<Spinner />}>
      <Match when={props.status === "loading"}><Spinner /></Match>
      <Match when={props.status === "error"}><ErrorView /></Match>
      <Match when={props.status === "success"}><Content /></Match>
    </Switch>
  );
}
```

### 7. Event Handling

```jsx
// React — synthetic events, camelCase
<button onClick={handleClick}>Click</button>
<input onChange={handleChange} />

// Solid — delegated events (camelCase, same as React)
<button onClick={handleClick}>Click</button>

// Solid — native events (lowercase, for custom elements or non-bubbling events)
<div on:click={handleClick}>Click</div>
<div on:custom-event={handleCustom}>Custom</div>
```

**Key differences for input handling:**

```jsx
// React — onChange fires on every keystroke
<input onChange={(e) => setName(e.target.value)} />

// Solid — onChange fires on blur (native behavior)
// Use onInput for real-time updates
<input onInput={(e) => setName(e.target.value)} />

// Solid — bind:value for two-way binding on signals
const [name, setName] = createSignal("");
<input bind:value={name} onInput={(e) => setName(e.target.value)} />
```

**Event delegation in Solid:**
- CamelCase events (`onClick`, `onInput`) are delegated — a single listener on `document` handles all events of that type. This is more performant.
- `on:click` syntax attaches a real DOM listener directly. Use this for custom events or when you need `stopPropagation` to work correctly with Shadow DOM.

### 8. Styling

```jsx
// React
<div className="container active">
  <div style={{ backgroundColor: "red", fontSize: "16px" }}>
    Styled
  </div>
</div>

// Solid
<div class="container active">
  <div style={{ "background-color": "red", "font-size": "16px" }}>
    Styled
  </div>
</div>

// Solid also supports classList for conditional classes
<div classList={{ active: isActive(), disabled: isDisabled() }}>
  Conditional classes
</div>
```

**Summary of styling differences:**

| Feature | React | Solid |
|---------|-------|-------|
| CSS class attribute | `className` | `class` |
| Inline styles | `{ camelCase: value }` | `{ "dash-case": value }` |
| Conditional classes | Template literals or `classnames()` | `classList` prop |
| CSS modules | `style.module.css` | `*.module.css` (same) |
| CSS-in-JS | styled-components, emotion | Usually unnecessary; use CSS modules or `style` prop |

### 9. Refs

```jsx
// React — useRef with .current
function Input() {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return <input ref={inputRef} />;
}

// Solid — plain variable, directly the element
function Input() {
  let inputRef;
  onMount(() => {
    inputRef?.focus();
  });
  return <input ref={inputRef} />;
}
```

**Why no `.current`:** Solid doesn't need the `.current` wrapper because the `ref` attribute assigns the DOM element directly to the variable. The assignment happens during rendering, so the variable is populated by the time `onMount` runs.

**Forwarding refs:**
```jsx
// React
const FancyInput = React.forwardRef((props, ref) => (
  <input ref={ref} className="fancy" />
));

// Solid — just pass the ref prop
function FancyInput(props) {
  return <input ref={props.ref} class="fancy" />;
}
```

### 10. Children

```jsx
// React — props.children is resolved JSX
function Wrapper({ children }) {
  return <div className="wrapper">{children}</div>;
}

// Solid — props.children is a function, must call it
function Wrapper(props) {
  return <div class="wrapper">{props.children}</div>;
  // This works in simple cases because JSX handles the call
}

// Solid — when you need to inspect or transform children
import { children } from "solid-js";

function Wrapper(props) {
  const resolved = children(() => props.children);
  // resolved() gives you the resolved child nodes
  createEffect(() => {
    console.log("Children changed:", resolved());
  });
  return <div class="wrapper">{resolved()}</div>;
}
```

**When to use the `children()` helper:**
- When you need to read or transform children inside a reactive computation.
- When you need to know when children change.
- When passing children through multiple layers.

---

## Side-by-Side Examples

### Counter Component

```jsx
// ============ React ============
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  // Must use useCallback to avoid recreating on every render
  const increment = useCallback(() => {
    setCount(c => c + step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <button onClick={increment}>+{step}</button>
      <button onClick={reset}>Reset</button>
      <label>
        Step:
        <input
          type="number"
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
        />
      </label>
    </div>
  );
}

// ============ Solid ============
import { createSignal } from "solid-js";

function Counter() {
  const [count, setCount] = createSignal(0);
  const [step, setStep] = createSignal(1);

  // No useCallback needed — function is stable (component runs once)
  const increment = () => {
    setCount(c => c + step());
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div class="counter">
      {/* count() — must call the signal getter */}
      <h2>Count: {count()}</h2>
      <button onClick={increment}>+{step()}</button>
      <button onClick={reset}>Reset</button>
      <label>
        Step:
        {/* onInput for real-time updates; bind:value for two-way binding */}
        <input
          type="number"
          bind:value={step}
          onInput={(e) => setStep(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
```

### Data Fetching

```jsx
// ============ React ============
import { useState, useEffect } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{user.name}</div>;
}

// ============ Solid ============
import { createResource, Show } from "solid-js";

function UserProfile(props) {
  // createResource handles fetching, loading, and error states
  const [user] = createResource(() => props.userId, async (id) => {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

  return (
    <>
      <Show when={user.loading}>
        <div>Loading...</div>
      </Show>
      <Show when={user.error}>
        <div>Error: {user.error.message}</div>
      </Show>
      <Show when={user()}>
        <div>{user().name}</div>
      </Show>
    </>
  );
}

// With Suspense for declarative loading states:
import { Suspense, createResource } from "solid-js";

function App() {
  const [userId, setUserId] = createSignal(1);
  const [user] = createResource(userId, fetchUser);

  return (
    <div>
      <button onClick={() => setUserId(prev => prev + 1)}>Next User</button>
      <Suspense fallback={<div>Loading...</div>}>
        <div>{user()?.name}</div>
      </Suspense>
    </div>
  );
}
```

**Key differences:**
- No manual `loading`/`error` state management — `createResource` provides `.loading`, `.error`, and the data accessor.
- No cleanup function needed — `createResource` automatically cancels stale requests.
- The source signal (`() => props.userId`) is tracked reactively; when it changes, the resource refetches.
- `Suspense` integrates directly with `createResource` for declarative loading UI.

### Form Handling

```jsx
// ============ React ============
import { useState } from "react";

function ContactForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.includes("@")) newErrors.email = "Invalid email";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        className={errors.name ? "error" : ""}
      />
      {errors.name && <span className="error-text">{errors.name}</span>}

      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        className={errors.email ? "error" : ""}
      />
      {errors.email && <span className="error-text">{errors.email}</span>}

      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
      />

      <button type="submit">Submit</button>
    </form>
  );
}

// ============ Solid ============
import { createSignal, Show } from "solid-js";

function ContactForm(props) {
  const [form, setForm] = createSignal({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = createSignal({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const f = form();
    const newErrors = {};
    if (!f.name.trim()) newErrors.name = "Name is required";
    if (!f.email.includes("@")) newErrors.email = "Invalid email";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    props.onSubmit(form());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={form().name}
        onInput={handleChange}
        classList={{ error: !!errors().name }}
      />
      <Show when={errors().name}>
        <span class="error-text">{errors().name}</span>
      </Show>

      <input
        name="email"
        value={form().email}
        onInput={handleChange}
        classList={{ error: !!errors().email }}
      />
      <Show when={errors().email}>
        <span class="error-text">{errors().email}</span>
      </Show>

      <textarea
        name="message"
        value={form().message}
        onInput={handleChange}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

**Notable changes:**
- `onChange` → `onInput` for real-time input updates.
- `className` → `class`; conditional classes use `classList`.
- `form().name` instead of `form.name` — signals must be called.
- `{errors.name && ...}` → `<Show when={errors().name}>` — more idiomatic.

### Context Provider

```jsx
// ============ React ============
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

function ThemedButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`btn btn-${theme}`}
    >
      Current: {theme}
    </button>
  );
}

// Usage
function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}

// ============ Solid ============
import { createContext, useContext, createSignal } from "solid-js";

// createContext takes an optional default value (used when no provider)
const ThemeContext = createContext();

function ThemeProvider(props) {
  const [theme, setTheme] = createSignal("light");

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Value passed to provider — note theme() is reactive inside JSX
  const themeValue = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={themeValue}>
      {props.children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  // Solid's useContext may return undefined if no provider is present
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

function ThemedButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      class={`btn btn-${theme()}`}
    >
      Current: {theme()}
    </button>
  );
}

// Usage
function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

**Key differences:**
- Pass the signal getter (`theme`) in the context value, not the value (`theme()`). This preserves reactivity for consumers.
- In the consumer, call the getter: `theme()` instead of `theme`.
- `useContext` may return `undefined` in Solid if no provider is found — always check.
- The API is nearly identical otherwise.

---

## Patterns That Don't Translate

### React.useId → createUniqueId

```jsx
// React
const id = useId();
// Returns a stable unique ID like ":r0:"

// Solid
import { createUniqueId } from "solid-js";
const id = createUniqueId();
// Returns a stable unique ID for SSR/hydration-safe identifiers
```

### React.useImperativeHandle → Direct Ref Forwarding

```jsx
// React — useImperativeHandle to customize what the ref exposes
const FancyInput = React.forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    scrollIntoView: () => inputRef.current.scrollIntoView(),
  }));
  return <input ref={inputRef} />;
});

// Solid — just assign the ref or create a wrapper object
function FancyInput(props) {
  let inputRef;
  const api = {
    focus: () => inputRef.focus(),
    scrollIntoView: () => inputRef.scrollIntoView(),
  };
  // Assign API to parent ref if provided
  if (typeof props.ref === "function") props.ref(api);
  else if (props.ref) props.ref = api;
  return <input ref={inputRef} />;
}
```

### React.useDebugValue → Signal Name Option

```jsx
// React — label for DevTools
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useDebugValue(isOnline ? "Online" : "Offline");
  return isOnline;
}

// Solid — name option for DevTools
const [isOnline, setIsOnline] = createSignal(navigator.onLine, {
  name: "isOnline" // appears in Solid DevTools
});
```

### React.useSyncExternalStore → from() or createRoot Pattern

```jsx
// React
const width = useSyncExternalStore(
  (callback) => {
    window.addEventListener("resize", callback);
    return () => window.removeEventListener("resize", callback);
  },
  () => window.innerWidth
);

// Solid — use from() to wrap external stores
import { from } from "solid-js";

const width = from((set) => {
  const handler = () => set(window.innerWidth);
  handler(); // set initial value
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
});
// width() returns the current value

// Solid — manual approach with createSignal + onMount/onCleanup
const [width, setWidth] = createSignal(window.innerWidth);

onMount(() => {
  const handler = () => setWidth(window.innerWidth);
  window.addEventListener("resize", handler);
  onCleanup(() => window.removeEventListener("resize", handler));
});
```

### React.useDeferredValue → createDeferred

```jsx
// React
const [search, setSearch] = useState("");
const deferredSearch = useDeferredValue(search);
// deferredSearch lags behind search during heavy renders

// Solid
import { createDeferred } from "solid-js";

const [search, setSearch] = createSignal("");
const deferredSearch = createDeferred(search, {
  timeoutMs: 300 // optional: max delay before forcing update
});
// deferredSearch() returns the deferred value
```

### React.useTransition → useTransition

```jsx
// React
const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() => {
    setCount(c => c + 1); // low-priority update
  });
}

// Solid
import { useTransition } from "solid-js";

const [isPending, start] = useTransition();

function handleClick() {
  start(() => {
    setCount(c => c + 1); // schedules as transition
  });
}
// isPending() returns boolean signal — note the getter call
```

---

## Quick Reference Cheat Sheet

### State Management

```
React                              Solid
────────────────────────────       ────────────────────────────
useState(0)                        createSignal(0)
  [val, setVal]                      [val, setVal]  // val is getter!
  val                                 val()

useReducer(reducer, init)          createSignal + custom logic
  const [state, dispatch]            const [state, setState]
                                      // or use a store:
                                      createStore({ ... })

useRef(null)                        let ref;
  ref.current                         ref  // direct reference
```

### Lifecycle

```
React                              Solid
────────────────────────────       ────────────────────────────
useEffect(() => {}, [])            onMount(() => {})
useEffect(() => {                  onCleanup(() => {})
  return () => cleanup()
}, [])
useEffect(() => { ... })           createEffect(() => { ... })
useLayoutEffect(() => {})          createRenderEffect(() => {})
```

### Rendering

```
React                              Solid
────────────────────────────       ────────────────────────────
{condition && <X/>}                <Show when={condition}><X/></Show>
{a ? <X/> : <Y/>}                 <Show when={a} fallback={<Y/>}><X/></Show>
{items.map(i => ...)}              <For each={items}>{(i) => ...}</For>
<Fragment> or <>                   <> or <For>
```

### Common Gotchas Checklist

- [ ] All signal reads use `signal()` (getter function call), not `signal`
- [ ] No props destructuring at component top level — use `props.x` or `splitProps`
- [ ] `class` instead of `className`
- [ ] `onInput` instead of `onChange` for real-time input
- [ ] `style` prop uses dash-case strings, not camelCase
- [ ] No `useCallback` / `useMemo` needed (component runs once)
- [ ] Use `<For>` for lists, not `.map()`
- [ ] Use `let ref;` instead of `useRef()`
- [ ] `createEffect` has no dependency array — tracking is automatic
- [ ] Side effects in component body run once — wrap in `createEffect` for reactivity
- [ ] `children` may need the `children()` helper to resolve
- [ ] `useContext` can return `undefined` — always check
