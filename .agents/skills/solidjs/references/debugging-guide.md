# SolidJS Debugging Guide

## Common Failure Modes

### Effect Doesn't Fire

**Cause:** Signal read outside tracking scope — inside `setTimeout`, an async callback, or an `untracked` context. Solid's reactivity system only tracks signal reads that occur synchronously during a computation's execution.

**Fix:** Use `on()` to specify dependencies explicitly, or move the signal read into the synchronous part of the effect.

```tsx
import { createSignal, createEffect, on, untrack } from "solid-js";

const [count, setCount] = createSignal(0);

// ❌ BUG: Signal read inside setTimeout — not tracked
createEffect(() => {
  setTimeout(() => {
    console.log(count()); // This read is NOT tracked
  }, 100);
});

// ✅ FIX 1: Read the signal synchronously, pass the value into the async code
createEffect(() => {
  const currentCount = count(); // Tracked — effect re-runs when count changes
  setTimeout(() => {
    console.log(currentCount); // Uses the captured (but fresh per run) value
  }, 100);
});

// ✅ FIX 2: Use on() to explicitly declare dependencies
createEffect(on(count, (currentCount) => {
  setTimeout(() => {
    console.log(currentCount); // on() guarantees the dependency
  }, 100);
}));

// ❌ BUG: Signal read inside untracked — explicitly opted out
createEffect(() => {
  untrack(() => {
    console.log(count()); // Not tracked
  });
});

// ✅ FIX: Read outside untrack, or use on()
createEffect(() => {
  const currentCount = count(); // Tracked
  untrack(() => {
    // Do non-reactive work here
    console.log(currentCount);
  });
});
```

### Infinite Effect Loop

**Cause:** Setting a signal inside an effect that also reads that signal, creating a circular update cycle.

**Fix:** Use `createMemo` for derived state, or separate read and write signals so the effect doesn't depend on what it writes.

```tsx
import { createSignal, createEffect, createMemo } from "solid-js";

const [count, setCount] = createSignal(0);

// ❌ BUG: Effect reads count, then sets count → infinite loop
createEffect(() => {
  console.log(count());
  setCount(count() + 1); // Triggers the effect again immediately
});

// ✅ FIX 1: Use createMemo for derived/computed state
const doubled = createMemo(() => count() * 2);
createEffect(() => {
  console.log(doubled()); // No write, no loop
});

// ✅ FIX 2: Separate read and write signals
const [readCount, setCount] = createSignal(0);
const [displayCount, setDisplayCount] = createSignal(0);

createEffect(() => {
  // This effect only reads readCount, writes displayCount — no cycle
  setDisplayCount(readCount() * 2);
});

// ✅ FIX 3: Use untrack to write without creating a read dependency
import { untrack } from "solid-js";

createEffect(() => {
  const current = count();
  untrack(() => {
    setCount(current + 1); // Write doesn't re-trigger this effect
  });
});
// Note: This still runs once on setup, but won't loop.
// Be careful — this pattern can still cause issues if other effects read count.
```

### Component Doesn't Update

**Cause:** Destructured props break Solid's reactivity proxy. When you destructure, you extract the current value at destructuring time, losing the reactive getter.

**Fix:** Access `props.x` directly, use `splitProps`, or create a derived signal.

```tsx
import { createSignal, splitProps, createMemo } from "solid-js";

// ❌ BUG: Destructuring breaks reactivity
function MyComponent(props: { name: string; age: number }) {
  const { name, age } = props; // Values captured at call time — not reactive!
  return <div>{name} is {age}</div>; // Won't update when props change
}

// ✅ FIX 1: Access props directly (keeps the proxy active)
function MyComponent(props: { name: string; age: number }) {
  return <div>{props.name} is {props.age}</div>; // Reactive — updates on change
}

// ✅ FIX 2: Use splitProps to partition while preserving reactivity
function MyComponent(props: { name: string; age: number; email: string }) {
  const [local, others] = splitProps(props, ["name", "age"]);
  return (
    <div>
      {local.name} is {local.age}  {/* Still reactive */}
      <pre>{JSON.stringify(others)}</pre>
    </div>
  );
}

// ✅ FIX 3: Create derived signals for individual props
function MyComponent(props: { name: string; age: number }) {
  const name = createMemo(() => props.name);
  const age = createMemo(() => props.age);
  return <div>{name()} is {age()}</div>; // Reactive via memo
}
```

### Store Update Doesn't Trigger

**Cause:** Store properties are lazy signals — they only become reactive when accessed within a tracking scope. If a component or effect never reads a property, updating it won't trigger any re-render.

**Fix:** Access the store property inside an effect, memo, or JSX expression to establish the dependency.

```tsx
import { createStore } from "solid-js/store";

const [store, setStore] = createStore({ user: { name: "Alice", age: 30 } });

// ❌ BUG: Never accessing store.user.name in a tracking scope
// Even if you call setStore("user", "name", "Bob"), nothing re-renders
// because nothing is subscribed to store.user.name

// ✅ FIX: Access the property in a tracking scope (JSX is a tracking scope)
function UserProfile() {
  return <div>{store.user.name}</div>; // Now reactive — updates on change
}

// ✅ FIX: Access in an effect or memo
createEffect(() => {
  console.log(store.user.name); // Tracked — effect runs on change
});

// ❌ BUG: Iterating over store keys without accessing values
function UserList() {
  // Object.keys doesn't access values — no tracking
  return Object.keys(store).map(key => <div>{key}</div>);
}

// ✅ FIX: Access each value to establish tracking
function UserList() {
  return Object.keys(store).map(key => <div>{store[key]}</div>); // Tracked
}
```

### Hydration Mismatch

**Cause:** Server and client produce different DOM output — different conditionals evaluated, different `createUniqueId` call counts, or browser-only APIs accessed during SSR.

**Fix:** Ensure the same rendering conditions on server and client, and match `createUniqueId` call counts.

```tsx
import { createUniqueId, createSignal, onMount } from "solid-js";
import { isServer } from "solid-js/web";

// ❌ BUG: Browser-only API called during SSR
function MyComponent() {
  const width = window.innerWidth; // Crashes on server / produces different output
  return <div>Width: {width}</div>;
}

// ✅ FIX: Use onMount for browser-only code (onMount only runs on client)
function MyComponent() {
  const [width, setWidth] = createSignal(0);
  onMount(() => {
    setWidth(window.innerWidth);
  });
  return <div>Width: {width()}</div>;
}

// ❌ BUG: Conditional that differs between server and client
function Greeting() {
  // typeof window is "undefined" on server, "object" on client
  if (typeof window !== "undefined") {
    return <div>Client only</div>;  // Client renders this
  }
  return <div>Universal</div>;       // Server renders this → mismatch!
}

// ✅ FIX: Use isServer from solid-js/web
function Greeting() {
  if (isServer) {
    return <div>Universal</div>;
  }
  return <div>Client only</div>;
}
// Better yet: use onMount or Show with a client-only signal

// ❌ BUG: createUniqueId called conditionally — different count on server vs client
function Form() {
  const showExtra = someCondition(); // May differ server vs client
  const id1 = createUniqueId();
  const id2 = showExtra ? createUniqueId() : ""; // Different call count!
  return (
    <form>
      <label for={id1}>Field 1</label>
      <input id={id1} />
      {showExtra && <>
        <label for={id2}>Field 2</label>
        <input id={id2} />
      </>}
    </form>
  );
}

// ✅ FIX: Always call createUniqueId the same number of times
function Form() {
  const id1 = createUniqueId();
  const id2 = createUniqueId(); // Always called, same count on server & client
  const showExtra = someCondition();
  return (
    <form>
      <label for={id1}>Field 1</label>
      <input id={id1} />
      {showExtra && <>
        <label for={id2}>Field 2</label>
        <input id={id2} />
      </>}
    </form>
  );
}
```

### Memory Leak

**Cause:** Missing `onCleanup` for intervals, event listeners, subscriptions, or other side-effect resources that outlive the component.

**Fix:** Always pair resource creation with `onCleanup` to ensure disposal when the owner (component/effect) is destroyed.

```tsx
import { onCleanup, onMount, createEffect } from "solid-js";

// ❌ BUG: Interval never cleared — leaks when component unmounts
function LiveClock() {
  const [time, setTime] = createSignal(new Date());

  setInterval(() => {
    setTime(new Date());
  }, 1000);
  // No cleanup! Interval keeps running after component is removed.

  return <div>{time().toLocaleTimeString()}</div>;
}

// ✅ FIX: Use onCleanup to clear the interval
function LiveClock() {
  const [time, setTime] = createSignal(new Date());

  const intervalId = setInterval(() => {
    setTime(new Date());
  }, 1000);

  onCleanup(() => clearInterval(intervalId));

  return <div>{time().toLocaleTimeString()}</div>;
}

// ❌ BUG: Event listener never removed
function MouseTracker() {
  const [pos, setPos] = createSignal({ x: 0, y: 0 });

  window.addEventListener("mousemove", (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  });
  // No cleanup! Listener persists after component unmounts.

  return <div>{pos().x}, {pos().y}</div>;
}

// ✅ FIX: Remove listener in onCleanup
function MouseTracker() {
  const [pos, setPos] = createSignal({ x: 0, y: 0 });

  const handler = (e: MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  window.addEventListener("mousemove", handler);
  onCleanup(() => window.removeEventListener("mousemove", handler));

  return <div>{pos().x}, {pos().y}</div>;
}

// ❌ BUG: Subscription never unsubscribed
function LiveData() {
  const [data, setData] = createSignal(null);

  const subscription = someObservable.subscribe((value) => {
    setData(value);
  });
  // No cleanup!

  return <div>{JSON.stringify(data())}</div>;
}

// ✅ FIX: Unsubscribe in onCleanup
function LiveData() {
  const [data, setData] = createSignal(null);

  const subscription = someObservable.subscribe((value) => {
    setData(value);
  });

  onCleanup(() => subscription.unsubscribe());

  return <div>{JSON.stringify(data())}</div>;
}

// ✅ TIP: createEffect auto-cleans up — but only for its own re-runs
// If you create resources inside createEffect, onCleanup runs on each re-execution
createEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", { signal: controller.signal })
    .then(res => res.json())
    .then(setData);

  onCleanup(() => controller.abort()); // Runs when effect re-executes or owner disposes
});
```

### Conditional Dependencies Disappear

**Cause:** An early return in an effect or memo skips a signal access, removing that dependency from the reactive graph. This is by design — Solid tracks actual execution paths, not potential ones.

**Fix:** Understand this is expected behavior. Use `on()` for explicit dependencies if you need them regardless of conditionals.

```tsx
import { createSignal, createEffect, createMemo, on } from "solid-js";

const [mode, setMode] = createSignal<"a" | "b">("a");
const [valueA, setValueA] = createSignal(0);
const [valueB, setValueB] = createSignal(0);

// ❌ SURPRISE: When mode is "a", valueB is not tracked
createEffect(() => {
  if (mode() === "a") {
    console.log("A:", valueA());
    return; // valueB() never reached — not a dependency
  }
  console.log("B:", valueB());
});

// If you call setValueB(10) while mode is "a", the effect does NOT re-run.
// If you then call setMode("b"), the effect runs and NOW tracks valueB.
// But if you call setValueA(10) while mode is "b", the effect does NOT re-run
// because valueA is no longer a dependency!

// ✅ FIX 1: Use on() to explicitly declare all dependencies
createEffect(on([mode, valueA, valueB], ([currentMode, a, b]) => {
  if (currentMode === "a") {
    console.log("A:", a);
  } else {
    console.log("B:", b);
  }
}));

// ✅ FIX 2: Always read all signals (even if you don't use the result)
createEffect(() => {
  const m = mode();
  const a = valueA(); // Always tracked
  const b = valueB(); // Always tracked

  if (m === "a") {
    console.log("A:", a);
  } else {
    console.log("B:", b);
  }
});

// ✅ FIX 3: Use createMemo to always track, then use the memo
const activeValue = createMemo(() => {
  if (mode() === "a") return valueA();
  return valueB();
});
// This memo always tracks mode, and conditionally tracks valueA or valueB.
// But the memo itself always re-evaluates when mode changes.

createEffect(() => {
  console.log("Active:", activeValue());
});
```

## Debugging Tools

### Solid DevTools

The Solid DevTools browser extension is the primary tool for inspecting Solid's reactive graph at runtime.

**Features:**
- Visualize the dependency tree: which signals feed which effects/memos
- Inspect current signal values in real time
- See computation states (active, stale, disposed)
- Highlight which components own which computations
- Track updates as they happen

**Installation:**
- [Chrome Extension](https://chrome.google.com/webstore/detail/solid-devtools/giglcgiglglhhgkhbbhcfhcbglnlhio)
- [Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/solid-devtools/)

**Setup:**
```tsx
// In your app entry point (e.g., index.tsx), ensure DevTools integration is enabled.
// With Vite + solid-plugin, DevTools are auto-enabled in dev mode.
// No additional configuration needed for most setups.

// For custom setups, you may need:
import { Devtools } from "@solid-devtools/frontend";
// See @solid-devtools packages for advanced integration.
```

**Usage Tips:**
1. Open browser DevTools → find the "Solid" tab
2. Select a component in the tree to see its signals and computations
3. Click a signal to see its current value and dependents
4. Click an effect to see its dependencies (what it reads)
5. Use the "Update" panel to see which signals changed and triggered updates

### DEV Object

The `DEV` object provides programmatic hooks into Solid's reactivity system. Only available in development builds — stripped in production.

```tsx
import { DEV } from "solid-js";

// afterUpdate — called after every reactive update cycle
// Useful for logging when updates happen
if (import.meta.env.DEV && DEV) {
  DEV.hooks.afterUpdate = () => {
    console.log("[DEV] Reactive update completed at", performance.now());
  };
}

// afterCreateOwner — called when a new reactive owner is created (component, effect, etc.)
if (import.meta.env.DEV && DEV) {
  DEV.hooks.afterCreateOwner = (owner) => {
    console.log("[DEV] Owner created:", owner);
    // owner contains: sourceMap (signals), owned (child computations), context
  };
}

// afterCreateSignal — called when a new signal is created
if (import.meta.env.DEV && DEV) {
  DEV.hooks.afterCreateSignal = (signal) => {
    console.log("[DEV] Signal created:", signal);
    // signal contains: value, name, observers
  };
}

// Practical example: Track all reactive updates for debugging
if (import.meta.env.DEV && DEV) {
  let updateCount = 0;
  DEV.hooks.afterUpdate = () => {
    updateCount++;
    console.log(`[DEV] Update #${updateCount} at ${performance.now().toFixed(2)}ms`);
    if (updateCount > 100) {
      console.warn("[DEV] Over 100 updates — possible infinite loop!");
    }
  };
}

// Practical example: Log all signal creation with names
if (import.meta.env.DEV && DEV) {
  DEV.hooks.afterCreateSignal = (signal) => {
    if (signal.name) {
      console.log(`[DEV] Signal "${signal.name}" created with value:`, signal.value);
    }
  };
}
```

**Important:** The `DEV` object is `undefined` in production builds. Always guard access with a conditional check.

### Signal Names

Naming signals, effects, and memos makes them identifiable in DevTools and error stack traces.

```tsx
import { createSignal, createEffect, createMemo, createStore } from "solid-js";

// createSignal — second argument options include name
const [count, setCount] = createSignal(0, { name: "count" });

// createEffect — first argument can be options with name
createEffect(
  { name: "logCountEffect" },
  () => {
    console.log(count());
  }
);

// createMemo — first argument can be options with name
const doubled = createMemo(
  { name: "doubledMemo" },
  () => count() * 2
);

// createStore — name option for the store
const [store, setStore] = createStore(
  { user: { name: "Alice" } },
  { name: "userStore" }
);

// Names appear in:
// - Solid DevTools signal/computation tree
// - Error messages and stack traces
// - DEV.hooks callbacks (signal.name, owner.name)

// Without names, DevTools shows anonymous signals like "Signal #5"
// With names, DevTools shows "count", "doubledMemo", etc.
```

### createReaction

`createReaction` provides one-shot tracking: it tracks dependencies once, notifies you on change, and then you must explicitly re-subscribe. Useful for debugging because you can see exactly when specific dependencies change.

```tsx
import { createReaction, createSignal } from "solid-js";

const [count, setCount] = createSignal(0);
const [name, setName] = createSignal("Alice");

// Basic usage: track and get notified on change
const track = createReaction(() => {
  console.log("[Reaction] A tracked dependency changed!");
  // This callback runs ONCE when a dependency changes.
  // After it fires, tracking is cleared — you must re-subscribe.
});

// Start tracking by calling track() with a function that reads signals
track(() => count()); // Now tracking count

setCount(1); // Logs: "[Reaction] A tracked dependency changed!"
setCount(2); // Nothing — tracking was one-shot, already fired

// Re-subscribe to track again
track(() => count());
setCount(3); // Logs: "[Reaction] A tracked dependency changed!"

// Debugging: Track multiple signals and identify which one changed
const trackCount = createReaction(() => {
  console.log("[Debug] count changed to:", count());
  trackCount(() => count()); // Re-subscribe immediately for continuous tracking
});

const trackName = createReaction(() => {
  console.log("[Debug] name changed to:", name());
  trackName(() => name()); // Re-subscribe
});

// Initialize tracking
trackCount(() => count());
trackName(() => name());

setCount(10); // Logs: "[Debug] count changed to: 10"
setName("Bob"); // Logs: "[Debug] name changed to: Bob"

// Debugging: Measure time between changes
const trackWithTiming = createReaction(() => {
  const now = performance.now();
  console.log(`[Debug] Dependency changed at ${now.toFixed(2)}ms, value: ${count()}`);
  trackWithTiming(() => count()); // Re-subscribe
});

trackWithTiming(() => count());
```

## Systematic Debugging Approach

When something isn't updating as expected, walk through these checks in order:

### 1. Is the signal being read in a tracking scope?

The most common issue. A signal read must happen synchronously inside a reactive computation (effect, memo, JSX expression, or component function body) to be tracked.

```tsx
import { createSignal, createEffect } from "solid-js";

const [count, setCount] = createSignal(0);

// Debug: Add console.log to confirm the getter is being called
createEffect(() => {
  console.log("[Debug] Effect running, count =", count());
  // If this only logs once and never again, the signal read IS tracked
  // but the signal might not be changing, OR the effect is being disposed.
});

// Debug: Verify the setter is actually being called
setCount(1);
console.log("[Debug] After setCount(1), count =", count()); // Should be 1

// Debug: Check if the read is inside an async boundary
createEffect(() => {
  // This read IS tracked
  const currentCount = count();
  console.log("[Debug] Sync read:", currentCount);

  fetch("/api").then(() => {
    // This read is NOT tracked — it's in a .then() callback
    console.log("[Debug] Async read:", count());
  });
});
```

### 2. Is the effect actually subscribed?

Use DevTools to check the dependency count. An effect with zero dependencies will never re-run.

```tsx
import { createSignal, createEffect, DEV } from "solid-js";

const [count, setCount] = createSignal(0, { name: "count" });

createEffect(() => {
  // Empty effect — no signal reads, no dependencies
  console.log("[Debug] This runs once and never again");
}, { name: "emptyEffect" });

createEffect(() => {
  console.log("[Debug] count =", count());
  // Check DevTools: this effect should show "count" as a dependency
}, { name: "countEffect" });

// Debug with DEV hooks: log when signals are observed
if (import.meta.env.DEV && DEV) {
  DEV.hooks.afterCreateSignal = (signal) => {
    console.log(`[Debug] Signal "${signal.name}" created. Observers: ${signal.observers?.length ?? 0}`);
  };
}
```

### 3. Is there a circular dependency?

Trace the signal → effect → signal chain. If an effect reads a signal and then writes to that same signal (directly or indirectly), you have a cycle.

```tsx
import { createSignal, createEffect, createMemo } from "solid-js";

const [a, setA] = createSignal(1, { name: "a" });
const [b, setB] = createSignal(2, { name: "b" });

// ❌ Circular: a → effect → b → effect → a
createEffect(() => {
  console.log("[Debug] Effect1: a =", a());
  setB(a() + 1); // Writes b
}, { name: "effect1" });

createEffect(() => {
  console.log("[Debug] Effect2: b =", b());
  setA(b() + 1); // Writes a → triggers Effect1 → writes b → triggers Effect2 → ...
}, { name: "effect2" });

// Debug: Detect cycles by logging the update chain
let depth = 0;
if (import.meta.env.DEV && DEV) {
  DEV.hooks.afterUpdate = () => {
    depth++;
    if (depth > 10) {
      console.error("[Debug] Possible infinite loop detected! Update depth:", depth);
    }
  };
}

// ✅ Fix: Use createMemo for derived values — no write, no cycle
const derivedB = createMemo(() => a() + 1, { name: "derivedB" });
const derivedA = createMemo(() => derivedB() + 1, { name: "derivedA" });
// Memos are read-only — no circular writes possible
```

### 4. Is a conditional branch hiding a dependency?

When a signal is only read in one branch of a conditional, it's only tracked when that branch executes.

```tsx
import { createSignal, createEffect, on } from "solid-js";

const [showDetails, setShowDetails] = createSignal(false, { name: "showDetails" });
const [details, setDetails] = createSignal("", { name: "details" });

// ❌ Bug: details not tracked when showDetails is false
createEffect(() => {
  if (showDetails()) {
    console.log("[Debug] Details:", details());
    // details() only tracked when showDetails() is true
  }
}, { name: "conditionalEffect" });

// Test: Set details while showDetails is false
setDetails("Hello"); // Effect does NOT run — details not tracked
setShowDetails(true); // Effect runs, NOW tracks details
setDetails("World"); // Effect runs — details is now tracked

// Debug: Log all signal reads to see what's being tracked
const originalEffect = createEffect;
// (In practice, use DevTools instead of monkey-patching)

// ✅ Fix: Use on() to always track both signals
createEffect(on([showDetails, details], ([show, data]) => {
  if (show) {
    console.log("Details:", data);
  }
}), { name: "explicitDepsEffect" });
```

### 5. Is props destructuring breaking reactivity?

This is the #1 mistake for developers coming from React. In Solid, props is a reactive proxy — destructuring extracts current values and breaks reactivity.

```tsx
import { splitProps } from "solid-js";

// ❌ Bug: Destructured props lose reactivity
function BrokenComponent(props: { title: string; count: number }) {
  const { title, count } = props; // Not reactive!
  return <h1>{title} — {count}</h1>; // Static values, never updates
}

// ✅ Fix: Use props directly
function FixedComponent(props: { title: string; count: number }) {
  return <h1>{props.title} — {props.count}</h1>; // Reactive!
}

// Debug: Add logging to confirm props are reactive
function DebugComponent(props: { title: string; count: number }) {
  createEffect(() => {
    console.log("[Debug] props.title =", props.title); // Runs when title changes
    console.log("[Debug] props.count =", props.count); // Runs when count changes
  });
  return <h1>{props.title} — {props.count}</h1>;
}

// Debug: Compare destructured vs direct access
function CompareComponent(props: { count: number }) {
  const { count } = props; // Static value

  createEffect(() => {
    console.log("[Debug] destructured count:", count);     // Always the initial value
    console.log("[Debug] props.count:", props.count);      // Current reactive value
  });

  return <div>{props.count}</div>;
}
```

### 6. Is an async boundary losing tracking?

Signal reads inside `.then()`, `await`, `setTimeout`, or any async callback are not tracked.

```tsx
import { createSignal, createEffect, on, createResource } from "solid-js";

const [userId, setUserId] = createSignal(1);

// ❌ Bug: Signal read inside .then() — not tracked
createEffect(() => {
  fetch(`/api/user/${userId()}`) // userId() IS tracked (synchronous)
    .then(res => res.json())
    .then(data => {
      console.log("[Debug] Data for user:", userId()); // userId() NOT tracked here
    });
});

// ✅ Fix 1: Capture the value before going async
createEffect(() => {
  const currentUserId = userId(); // Tracked
  fetch(`/api/user/${currentUserId}`)
    .then(res => res.json())
    .then(data => {
      console.log("Data for user:", currentUserId); // Uses captured value
    });
});

// ✅ Fix 2: Use createResource for proper async data fetching
const [user] = createResource(userId, async (id) => {
  const res = await fetch(`/api/user/${id}`);
  return res.json();
});
// createResource properly tracks userId and refetches when it changes

// ✅ Fix 3: Use on() for explicit dependency
createEffect(on(userId, async (id) => {
  const res = await fetch(`/api/user/${id}`);
  const data = await res.json();
  console.log("Data for user:", id); // Uses the value from on()
}));
```

## React-to-Solid Debugging Differences

Developers coming from React need to shift their debugging mindset. The failure modes are different.

| Concern | React | Solid |
|---|---|---|
| **Primary question** | "Why is my component re-rendering?" | "Why isn't my effect firing?" |
| **Dependency tracking** | Manual dependency arrays (`useEffect deps`) | Automatic tracking (but can miss async reads) |
| **Stale closures** | Common bug — callbacks capture old values | Rare — signals are functions, always return current value |
| **Props reactivity** | Destructuring is fine — component re-renders | Destructuring breaks reactivity — use `props.x` directly |
| **Update granularity** | Component-level re-render | Fine-grained — only the specific DOM node updates |
| **Async state** | `useEffect` + `useState` | `createResource` (built-in) |
| **Concurrent rendering** | Concurrent mode, `useTransition` | `startTransition`, `useTransition` (similar but different impl) |
| **Ref pattern** | `useRef` for mutable values | `createSignal` for reactive, plain variables for non-reactive |
| **Cleanup** | Return function from `useEffect` | `onCleanup()` (can be called from any scope) |
| **Key debugging tool** | React DevTools (component tree) | Solid DevTools (reactive graph) |

### React: "Why is it re-rendering?" → Solid: "Why isn't it updating?"

```tsx
// React: Unnecessary re-renders are the common problem
function ReactComponent({ items }) {
  // This re-renders the entire component whenever ANY prop changes
  // even if `items` didn't change
  console.log("Rendered!"); // Fires too often
  return <List items={items} />;
}

// Solid: Only the specific reactive expressions update
function SolidComponent(props) {
  // This effect only runs when props.items changes
  createEffect(() => {
    console.log("Items changed:", props.items); // Only on actual change
  });
  return <List items={props.items} />;
}
```

### React: Dependency arrays → Solid: Automatic tracking

```tsx
// React: Must manually specify dependencies — easy to forget or over-specify
useEffect(() => {
  console.log(count, name);
}, [count]); // Forgot `name` — stale value!

// Solid: Automatic tracking — but async reads are invisible
createEffect(() => {
  console.log(count(), name()); // Both tracked automatically
});

// Solid gotcha: async reads aren't tracked
createEffect(() => {
  fetchData(userId()).then(() => {
    console.log(userId()); // NOT tracked — inside .then()
  });
});
// Fix: use on() or createResource
```

### React: Stale closures → Solid: Always fresh

```tsx
// React: Stale closure — callback captures old value
function ReactCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1); // BUG: `count` is stale — always 0
    }, 1000);
    return () => clearInterval(id);
  }, []); // Empty deps = count is captured as 0

  // Fix: Use functional update
  // setCount(c => c + 1);
}

// Solid: Signals are functions — always return current value
function SolidCounter() {
  const [count, setCount] = createSignal(0);

  const intervalId = setInterval(() => {
    setCount(count() + 1); // count() always returns the latest value
  }, 1000);

  onCleanup(() => clearInterval(intervalId));
  // No stale closure possible — count() reads the current signal value
}
```

### React: Concurrent mode → Solid: Transitions

```tsx
// React: Concurrent rendering with useTransition
const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() => {
    setSearchQuery(input); // Low-priority update
  });
}

// Solid: Similar concept with startTransition
import { startTransition } from "solid-js";

function handleClick() {
  startTransition(() => {
    setSearchQuery(input()); // Marks updates as transitional
  });
}

// Solid also has useTransition for pending state
import { useTransition } from "solid-js";

const [isPending, start] = useTransition();

function handleClick() {
  start(() => {
    setSearchQuery(input());
  });
  // isPending() returns true until the transition completes
}
```

### Quick Reference: React Bug → Solid Equivalent

| React Bug | Solid Equivalent | How to Debug in Solid |
|---|---|---|
| Missing `useEffect` dependency | Signal read outside tracking scope | Check if read is synchronous in effect body |
| Stale closure in callback | N/A (signals always fresh) | Not a problem in Solid |
| Unnecessary re-renders | N/A (fine-grained updates) | Not a problem in Solid |
| `useEffect` cleanup race condition | `createResource` handles this | Use `createResource` instead of manual fetch |
| Wrong `useMemo` deps | `createMemo` auto-tracks | Check if all reads are synchronous |
| Destructured props stale | Destructured props break reactivity | Use `props.x` or `splitProps` |
| `key` warning on lists | Same concept in Solid `<For>` | Ensure `<For>` uses a stable key function |
