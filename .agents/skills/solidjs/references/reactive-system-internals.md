# SolidJS Reactive System Internals

A deep dive into the internal mechanics of Solid's reactive system — the data structures, algorithms, and execution model that make fine-grained reactivity work with zero virtual DOM diffing.

---

## Core Data Structures

Solid's reactive system is built on three foundational types that live in `packages/solid/src/reactive/signal.ts`. Understanding these is prerequisite to understanding everything else.

### SignalState\<T\>

Every `createSignal` call produces a `SignalState<T>` object. This is the atom of reactivity — a container for a value plus the bookkeeping needed to notify dependents when the value changes.

```ts
export interface SignalState<T> {
  value: T;           // The current value
  observers: Computation[] | null;   // Computations that depend on this signal
  observerSlots: number[] | null;    // Parallel array: each observer's slot index back into its sources
  tValue: T;          // "Transition value" — the pending value during a transition
  comparator: ((prev: T, next: T) => boolean) | undefined;  // Custom equality check
}
```

**`value` and `tValue`**: Under normal operation, `value` holds the current state. During a transition (see Transition State), `tValue` holds the value that will be committed when the transition completes. This dual-value design allows the UI to remain responsive to urgent updates while a low-priority transition is in flight.

**`observers` and `observerSlots`**: These two parallel arrays are the key to O(1) dependency unlinking. When a computation depends on a signal, it registers itself in `observers`, and the index where it was placed is stored in the computation's own `sourceSlots` array. Symmetrically, the signal stores the computation's slot index in `observerSlots`:

```
Signal.observers       = [compA, compB, compC]
Signal.observerSlots   = [2,     0,     1    ]
                         │      │      │
                         ▼      ▼      ▼
compA.sources          = [sigX, sigY, thisSignal]
compA.sourceSlots      = [0,    1,    2           ]  ← observerSlots[0]=2 means compA.sourceSlots[2] has our index

compB.sources          = [thisSignal, sigZ]
compB.sourceSlots      = [0,          1   ]  ← observerSlots[1]=0 means compB.sourceSlots[0] has our index
```

This bidirectional slot mapping means removing a dependency is a constant-time swap-and-pop: swap the last element into the vacated slot, update the corresponding slot in the partner array, then pop. No array scanning required.

**`comparator`**: When provided, `writeSignal` calls `comparator(prev, next)`. If it returns `true`, the write is a no-op — no observers are marked stale. This is how `createSignal(value, { equals: false })` forces every write to notify, and how custom comparators (e.g., shallow object comparison) prevent unnecessary recomputation.

### Computation

A `Computation` is any reactive derivation — memos, effects, computed values. It tracks both its dependencies (sources/signals it reads) and its own execution state.

```ts
export interface Computation {
  fn: ((v: T) => T) | null;     // The computation function; receives previous value
  state: number;                 // 0 = Clean, 1 = Stale, 2 = Pending
  sources: SignalState[] | null; // Signals this computation depends on
  sourceSlots: number[] | null;  // Parallel array: each source's slot index in its observers
  value: T;                      // The cached result of fn()
  updatedAt: number | null;      // Timestamp for staleness checks
  pure: boolean;                 // true = memo/computed, false = effect
  user: boolean;                 // true = user-facing effect (createEffect)
  owner: Owner | null;           // Owning scope for cleanup/context
  sourceMap?: any;               // For mapArray/indexArray tracking
  sources?: any;                 // Overloaded for mapArray use
}
```

**`state`** — the lifecycle of a computation:

| State | Constant | Meaning |
|-------|----------|---------|
| 0 | `Clean` | Up to date. No source has changed since last execution. |
| 1 | `Stale` | A source changed. Must re-execute before next read. |
| 2 | `Pending` | A source *might* have changed (transitive dependency). Check sources to determine if re-execution needed. |

When a signal is written to, its direct observers are marked `Stale`. Their observers in turn are marked `Pending` — they might not need to re-run if the direct observer recomputes to the same value. This two-level propagation avoids unnecessary work.

**`pure` vs `user`**: These flags determine which scheduler queue the computation enters when it becomes stale:

- `pure = true, user = false` → `Updates` queue (memos, computed). Processed first, synchronously.
- `pure = false, user = false` → `Effects` queue (render effects). Processed after updates.
- `pure = false, user = true` → `Effects` queue (user effects). Processed last, after render.

**`fn`**: The computation function receives the previous return value as its argument, enabling efficient accumulators and diffing. For example, `createMemo((prev) => ...)` can diff against `prev` instead of recomputing from scratch.

**`updatedAt`**: A monotonically increasing clock value set when the computation last ran. Used by `lookup` to determine if a computation is fresher than the signal value it's reading — this prevents stale reads in edge cases with diamond dependency graphs.

### Owner

The `Owner` tree provides scoping for cleanup and context. Every computation has an `owner`, and owners form a parent-child tree.

```ts
export interface Owner {
  owner: Owner | null;       // Parent owner
  context: any | null;       // Context map for this scope
  sourceMap?: any;           // For disposal tracking
  owned: Computation[] | null;  // Child computations
  cleanups: (() => void)[] | null;  // Cleanup functions registered via onCleanup
}
```

**Disposal**: When an owner is disposed (e.g., a component unmounts), it iterates `owned` and recursively disposes all children, then runs all `cleanups`. This is how Solid guarantees no memory leaks from effects that outlive their component.

**Context resolution**: The `context` map stores key-value pairs set by `Provider`. `useContext` walks up the `owner` chain to find the nearest provider. See Context Resolution below.

---

## Dependency Tracking Mechanism

### The Listener Global

Solid uses a module-level global variable called `Listener` to track which computation is currently executing:

```ts
let Listener: Computation | null = null;
```

When a computation's `fn` runs, Solid sets `Listener = computation` for the duration. When the computation finishes, `Listener` is restored to its previous value (which may be another computation if they're nested). This is the mechanism that makes automatic dependency tracking work — no explicit subscription API is needed.

### readSignal — Registration

When a computation reads a signal via `signal[0]()`, it calls `readSignal` internally:

```ts
function readSignal(node: SignalState<any>) {
  const value = node.value;

  // If there's a currently executing computation, register it as an observer
  if (Listener !== null) {
    createSignalDependency(node, Listener);
  }

  return value;
}
```

`createSignalDependency` does the bidirectional slot registration:

```ts
function createSignalDependency(signal: SignalState, computation: Computation) {
  // Add computation to signal's observers
  let observerSlot = signal.observers!.length;
  signal.observers!.push(computation);
  signal.observerSlots!.push(computation.sources!.length);

  // Add signal to computation's sources
  computation.sources!.push(signal);
  computation.sourceSlots!.push(observerSlot);
}
```

But first, it checks if this dependency already exists. If the computation ran before and is now re-executing, it needs to unregister stale dependencies and register new ones. The pattern is:

1. Before re-executing `fn`, call `removeSourceDependencies(computation)` to unlink from all current sources.
2. During execution, any `readSignal` call with `Listener` set re-registers the dependency.
3. After execution, the computation's source list reflects exactly what it read — no more, no less.

This is how Solid achieves precise dependency tracking: dependencies are always the exact set of signals read in the *latest* execution, not a union of all historical reads.

### writeSignal — Propagation

When you call `signal[1](newValue)`, it calls `writeSignal`:

```ts
function writeSignal(node: SignalState<any>, value: any, isTransition?: boolean) {
  // Check comparator
  if (node.comparator) {
    if (node.comparator(node.value, value)) return value;
  }

  // Set the value (or tValue during transitions)
  if (isTransition) {
    node.tValue = value;
  } else {
    node.value = value;
  }

  // If no observers, nothing to propagate
  if (!node.observers) return value;

  // Mark observers
  for (let i = 0; i < node.observers.length; i++) {
    const observer = node.observers[i];
    // If the observer is already Stale, no need to re-mark
    if (observer.state === STALE) continue;

    // Mark direct dependents as Stale (1)
    // Mark transitive dependents as Pending (2)
    if (!observer.pure) {
      observer.state = STALE;
      scheduleEffect(observer);
    } else if (Updates === null || !Updates.includes(observer)) {
      observer.state = STALE;
      if (observer.pure) Updates!.push(observer);
      else Effects!.push(observer);
    }
  }

  return value;
}
```

The propagation algorithm:

1. Direct observers of the changed signal are marked `STALE` (state = 1).
2. Their observers (transitive dependents) are marked `PENDING` (state = 2) via a recursive walk.
3. Computations are pushed into either the `Updates` queue (pure = memos) or the `Effects` queue (non-pure = effects).

The key insight: marking is lazy. We don't re-execute anything during `writeSignal` — we just record that things *need* to re-execute. The actual execution happens when the scheduler runs.

### Slot Array O(1) Removal

When a computation is disposed or a dependency is removed, the swap-and-pop algorithm ensures constant time:

```ts
function removeSourceDependencies(computation: Computation) {
  if (computation.sources) {
    for (let i = 0; i < computation.sources.length; i++) {
      const source = computation.sources[i];
      const slot = computation.sourceSlots![i];
      const lastObserver = source.observers!.pop()!;
      const lastSlot = source.observerSlots!.pop()!;

      // If the removed observer wasn't the last one, swap
      if (slot < source.observers!.length) {
        source.observers![slot] = lastObserver;
        source.observerSlots![slot] = lastSlot;

        // Update the swapped observer's sourceSlot to point to its new position
        lastObserver.sourceSlots![lastSlot] = slot;
      }
    }
    computation.sources.length = 0;
    computation.sourceSlots!.length = 0;
  }
}
```

This is critical for performance: a computation with N dependencies can unlink all of them in O(N) total, with each individual removal being O(1). Without slot arrays, each removal would require scanning the signal's observer list, making it O(N*M) for M observers per signal.

---

## Execution Model

### Pull-Based Reactivity

Solid uses a **pull-based** model: signals don't push values to observers. Instead, they mark observers as stale, and the observers pull (re-execute) when the scheduler runs them.

This contrasts with push-based systems (like RxJS) where values flow through the graph immediately. Pull-based has two key advantages:

1. **Guaranteed consistency**: When a computation runs, all its sources have their final values. No intermediate/glitch states.
2. **Automatic deduplication**: If signal A is written twice before the scheduler runs, its observers only execute once.

The tradeoff is that reads outside of tracked contexts return potentially stale values. But since Solid's template system always reads signals within tracked computations, this is rarely an issue.

### Execution Order

Solid has three tiers of computation, each with different scheduling semantics:

```ts
// Tier 1: Immediate synchronous execution
createComputed(() => { /* runs immediately on creation and on every change */ });
createMemo(() => computeExpensive()); // also synchronous, but cached

// Tier 2: Render phase
createRenderEffect(() => { /* runs during render, before DOM paint */ });

// Tier 3: After render
createEffect(() => { /* runs after DOM is painted */ });
```

**Why the order matters**:

- `createComputed`/`createMemo` are **synchronous**: when created, they execute immediately. When a source changes, they re-execute in the same microtask, before anything else reads the stale value. This ensures derived state is always consistent.
- `createRenderEffect` is scheduled in the `Effects` queue but runs before the browser paints. It's used internally for DOM bindings — ensuring the DOM is updated before the user sees anything.
- `createEffect` runs after the render phase. This is where side effects like `fetch`, `console.log`, or analytics should go. The DOM is already updated, so you can safely read DOM measurements.

Internally, `createComputed` uses `pure: true` and runs immediately. `createRenderEffect` uses `pure: false, user: false` and goes to the front of the Effects queue. `createEffect` uses `pure: false, user: true` and goes to the end.

### How the Scheduler Processes Queues

```ts
function runUpdates(fn: () => void, init: boolean) {
  if (Updates) return fn(); // Already in a runUpdates context, just run
  let wait = 0;
  try {
    Updates = [];   // Pure computations queue
    Effects = [];   // Effects queue
    fn();
    // Process Updates queue first — all pure computations
    while (Updates.length) {
      const updates = Updates;
      Updates = [];  // Reset — new updates may be queued during execution
      for (let i = 0; i < updates.length; i++) {
        const computation = updates[i];
        if (computation.state === STALE) {
          computation.state = CLEAN;
          runTop(computation);
        }
      }
      wait++;
      if (wait > 10000) throw new Error("Potential Infinite Loop");
    }
    // Then process Effects queue — all effects in order
    for (let i = 0; i < Effects.length; i++) {
      const effect = Effects[i];
      if (effect.state === STALE) {
        effect.state = CLEAN;
        runTop(effect);
      }
    }
  } finally {
    Updates = null;
    Effects = null;
  }
}
```

`runTop` walks up the computation's owner/dependency chain to find the topmost stale ancestor, then executes downward. This ensures parent computations run before children, maintaining consistency:

```ts
function runTop(computation: Computation) {
  // Walk up to find the topmost stale computation
  let top = computation;
  while (top.owner && top.owner.state !== CLEAN) {
    top = top.owner as Computation;
  }
  // Execute from top down
  lookUpstream(top);
}
```

---

## Scheduler

Beyond the reactive graph, Solid has a separate **scheduler** for tasks that need to yield to the browser — primarily used by `createDeferred` and transitions.

### Priority-Based Task Queue

The scheduler lives in `packages/solid/src/scheduler.ts` and implements a priority queue with cooperative yielding:

```ts
interface Task {
  id: number;            // Unique identifier for cancellation
  fn: (() => void) | null;  // The callback
  startTime: number;     // When the task becomes eligible to run
  expirationTime: number; // Deadline — task must run before this
}
```

Tasks are sorted by `startTime`. The scheduler processes them in order, but yields to the browser between tasks using `MessageChannel`:

```ts
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = () => {
  // Process scheduled tasks
  const currentTime = Date.now();
  // ... execute tasks whose startTime <= currentTime
};

function scheduleCallback(fn: () => void, options?: { delay?: number }) {
  const task: Task = {
    id: taskIdCounter++,
    fn,
    startTime: Date.now() + (options?.delay || 0),
    expirationTime: -1, // Will be set based on priority
  };
  push(task); // Insert into priority queue
  schedulePerform(); // Post message to MessageChannel
  return task;
}
```

### Input Pending API

For responsiveness during user input, Solid checks `navigator.scheduling.isInputPending()`:

```ts
function performWork() {
  const currentTime = Date.now();
  let currentTask = peek(); // Get highest-priority task

  while (currentTask) {
    // Yield if there's pending user input
    if (
      currentTask.startTime > currentTime ||
      (typeof navigator !== "undefined" &&
        navigator.scheduling?.isInputPending?.())
    ) {
      break;
    }
    // Execute the task
    const task = pop();
    task.fn?.();
    currentTask = peek();
  }

  // If there are remaining tasks, schedule another batch
  if (currentTask) {
    schedulePerform();
  }
}
```

This means that if the user is clicking or typing, the scheduler pauses reactive updates to keep the main thread responsive. This is especially important for `createDeferred`, which uses the scheduler to avoid blocking the UI during expensive recomputations.

### createDeferred Integration

`createDeferred` wraps a signal to produce a deferred version that updates on a schedule rather than synchronously:

```ts
function createDeferred<T>(source: () => T, options?: { timeoutMs?: number }) {
  let t: Task | null = null;
  const [deferred, setDeferred] = createSignal(source());

  createEffect((prev) => {
    const value = source();
    if (t) t.fn = null; // Cancel previous pending update
    t = scheduleCallback(
      () => {
        setDeferred(value);
        t = null;
      },
      { delay: options?.timeoutMs }
    );
    return value;
  });

  return deferred;
}
```

The `timeoutMs` option sets a maximum delay before the deferred value must update, even under heavy load. This prevents the deferred signal from lagging too far behind the source.

---

## Array Utilities

Solid provides two reactive array mapping primitives that are the backbone of `<For>` and `<Index>`. They both maintain a stable list of computations keyed differently.

### mapArray — Keyed by Value Identity

`mapArray` powers `<For>`. It diffs the new array against the old one by value identity (reference equality), and reuses existing computations for items that persist:

```ts
function mapArray<T, U>(
  list: () => T[],
  map: (value: () => T, index: () => number) => U,
  options?: { fallback?: () => U }
): () => U[] {
  let items: (U | undefined)[] = [];
  let mapped: () => U[] = () => [];
  const disposers: (() => void)[] = [];
  let prevList: T[] = [];

  return () => {
    const newItems = list() || [];
    const newMapped: U[] = [];

    // Diff new list against previous
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      let found = false;

      for (let j = 0; j < prevList.length; j++) {
        if (Object.is(item, prevList[j])) {
          // Reuse existing computation
          newMapped[j] = items[j]!;
          found = true;
          break;
        }
      }

      if (!found) {
        // Create new computation
        const [value, setValue] = createSignal(item);
        const [index, setIndex] = createSignal(i);
        const computation = createRoot((dispose) => {
          disposers.push(dispose);
          return map(value, index);
        });
        newMapped[i] = computation;
      }
    }

    // Dispose removed items
    // ... (dispose computations for items not in new list)

    prevList = newItems;
    items = newMapped;
    return newMapped as U[];
  };
}
```

**Diffing algorithm**: The diff is O(N*M) in the worst case (every item compared to every other), but in practice most list updates are appends, removals, or reorderings of small lists. The tradeoff is simplicity and correctness — no key allocation bugs.

**Signal per item**: Each item gets its own signal for the value and index. When the array updates, items that persist get their signals updated (not recreated), so their derived computations only re-run if the actual value changed.

### indexArray — Keyed by Index

`indexArray` powers `<Index>`. Instead of keying by value identity, it keys by index position. This means moving an item doesn't recreate its computation — it just updates the value signal at that position:

```ts
function indexArray<T, U>(
  list: () => T[],
  map: (value: () => T, index: number) => U
): () => U[] {
  let items: U[] = [];
  let disposers: (() => void)[] = [];
  let prevLen = 0;

  return () => {
    const newList = list() || [];
    const newItems: U[] = [];

    // Reuse or create computations based on index
    for (let i = 0; i < newList.length; i++) {
      if (i < prevLen) {
        // Reuse existing — just update the value signal
        newItems[i] = items[i];
      } else {
        // Create new computation for new index
        const computation = createRoot((dispose) => {
          disposers.push(dispose);
          return map(/* value signal */, i);
        });
        newItems[i] = computation;
      }
    }

    // Dispose extra items if list shrunk
    for (let i = newList.length; i < prevLen; i++) {
      disposers[i]?.();
    }

    prevLen = newList.length;
    items = newItems;
    return newItems;
  };
}
```

**When to use which**: `mapArray` (and `<For>`) is better when items have stable identity (e.g., objects with IDs). `indexArray` (and `<Index>`) is better for primitive lists where the index is the stable reference, or when you want to minimize computation recreation during reorderings.

---

## Store Internals

Solid's `createStore` provides deep reactive proxies — reading any nested property creates a signal, and writing any nested property triggers exactly the dependents of that property.

### Proxy Architecture

The store proxy is built around several symbols:

```ts
const $PROXY = Symbol("solid-proxy");   // Marks the object as a proxy
const $RAW   = Symbol("solid-raw");     // Accesses the underlying raw object
const $NODE  = Symbol("solid-node");    // Lazy signal node for a property
const $HAS   = Symbol("solid-has");     // Tracks key existence
const $SELF  = Symbol("solid-self");    // The proxy itself (for tracking)
```

### getNode — Lazy Signal Per Property

Each property on a store object gets a signal created lazily on first read:

```ts
function getNode(store: any, property: string | symbol): SignalState {
  let node = store[$NODE]?.[property];
  if (!node) {
    // Create a signal whose value reads from the raw object
    node = createSignalState(
      store[$RAW][property],
      /* comparator */ undefined
    );
    if (!store[$NODE]) store[$NODE] = {};
    store[$NODE]![property] = node;
  }
  return node;
}
```

When you read `store.user.name`:

1. `store.user` — the proxy intercepts the `get` trap for `"user"`, calls `getNode(store, "user")`, and calls `readSignal(node)`. This registers the current computation as an observer of `store.user`. If `store.user` is an object, it returns a nested proxy (not the raw object).
2. `.name` — the nested proxy intercepts `get` for `"name"`, calls `getNode(nestedStore, "name")`, and registers the computation as an observer of the nested property.

This means `store.user.name` creates *two* signals: one for `user` on the root store, and one for `name` on the nested store. If you later do `setStore("user", "name", "Alice")`, only the `name` signal is triggered — not the `user` signal, and not the root store signal.

### setProperty — Triggering Signals

When you call `setStore("user", "name", "Alice")`, Solid traverses the path, reaches the nested proxy for `user`, and calls `setProperty`:

```ts
function setProperty(
  store: any,
  property: string | symbol,
  value: any
) {
  // If the value is an object, wrap it in a proxy
  if (typeof value === "object" && value !== null) {
    value = wrap(value);
  }

  // Update the raw object
  store[$RAW][property] = value;

  // Trigger the signal for this property
  const node = store[$NODE]?.[property];
  if (node) {
    writeSignal(node, value);
  }

  // Trigger the $HAS signal if this is a new key
  const hasNode = store[$NODE]?.[$HAS];
  if (hasNode) {
    writeSignal(hasNode, true);
  }
}
```

### Nested Wrapping — Automatic Deep Proxies

When a property value is an object or array, `wrap` creates a new proxy for it:

```ts
function wrap(value: any): any {
  if (typeof value === "object" && value !== null && !value[$PROXY]) {
    // It's a plain object — wrap it
    const proxy = new Proxy(value, {
      get(target, property, receiver) {
        if (property === $RAW) return target;
        if (property === $PROXY) return true;
        // For other properties, track and possibly recurse
        const node = getNode(store, property);
        trackNode(node);
        const result = target[property];
        return typeof result === "object" && result !== null
          ? wrap(result)  // Recursively wrap nested objects
          : result;
      },
      set(target, property, value) {
        setProperty(store, property, value);
        return true;
      }
    });
    return proxy;
  }
  return value;
}
```

The key behavior: **reading a nested property lazily creates signals at each level**. Writing a nested property only triggers signals along the exact path that changed. This is what makes stores efficient for large, deeply nested state — you only pay for what you touch.

### Accessing Raw Data

`store[$RAW]` bypasses reactivity entirely, returning the underlying plain object. This is useful for:

- Serialization (`JSON.stringify(store[$RAW])`)
- Debugging without triggering dependencies
- Passing data to non-reactive code

---

## Suspense Mechanism

Solid's `<Suspense>` tracks pending asynchronous resources using an increment/decrement counter per suspense boundary.

### Counter-Based Tracking

```ts
interface SuspenseContextType {
  increment: () => void;
  decrement: () => void;
  inFallback: () => boolean;
}
```

When a resource starts loading (e.g., `createResource` fetch begins), it calls `increment()` on the nearest `Suspense` boundary. When loading completes, it calls `decrement()`.

```ts
function Suspense(props: { fallback: JSX.Element; children: JSX.Element }) {
  let counter = 0;
  const [state, setState] = createSignal<"fallback" | "default">("default");

  const ctx = {
    increment: () => {
      if (++counter === 1) setState("fallback");
    },
    decrement: () => {
      if (--counter === 0) setState("default");
    },
    inFallback: () => counter > 0,
  };

  // Provide context to children
  return (
    <SuspenseContext.Provider value={ctx}>
      <Switch>
        <Match when={state() === "fallback"}>{props.fallback}</Match>
        <Match when={state() === "default"}>{props.children}</Match>
      </Switch>
    </SuspenseContext.Provider>
  );
}
```

**Multiple resources**: If two resources are loading simultaneously, `counter = 2`. The fallback shows until *both* complete (`counter` returns to 0).

### resumeEffects — Running Effects After Promises Resolve

When a resource's promise resolves, Solid needs to run the effects that were suspended. But effects can't run in a suspended state — they need the owner tree to be intact. `resumeEffects` handles this:

```ts
function resumeEffects(effects: Computation[]) {
  // Effects were collected during the suspended render
  // Now that the data is available, run them
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    effect.state = STALE;
    // Re-run the effect with the resolved data
    runTop(effect);
  }
}
```

During SSR/hydration, effects are queued instead of executed immediately. When the client takes over and resources are resolved, `resumeEffects` flushes the queue, ensuring all reactive bindings are established.

---

## Transition State

Transitions let you mark updates as low-priority, keeping the UI responsive during expensive state changes.

### TransitionState Structure

```ts
interface TransitionState {
  sources: Set<SignalState>;     // Signals that have transition values pending
  effects: Computation[];        // Effects to run when transition commits
  promises: Set<Promise<any>>;   // Promises that must resolve before commit
  disposed: Computation[];       // Computations disposed during transition
  queue: Computation[];          // Computations waiting to run
  running: boolean;              // Whether a transition is currently executing
}
```

### startTransition — Marking Updates as Low-Priority

```ts
function startTransition(fn: () => void): Promise<void> {
  const transition: TransitionState = {
    sources: new Set(),
    effects: [],
    promises: new Set(),
    disposed: [],
    queue: [],
    running: true,
  };

  // Set the global transition
  prevTransition = Transition;
  Transition = transition;

  try {
    fn(); // Execute the update function
    // During this, any writeSignal calls set tValue instead of value
  } finally {
    Transition.running = false;
    Transition = prevTransition;

    // If there are pending promises, wait for them
    if (transition.promises.size > 0) {
      return Promise.all(transition.promises).then(() => {
        commitTransition(transition);
      });
    } else {
      commitTransition(transition);
    }
  }
}
```

### Dual-Value Signal Model

During a transition, `writeSignal` writes to `tValue` instead of `value`:

```ts
function writeSignal(node: SignalState, value: any) {
  if (Transition && Transition.running) {
    // Don't update the "live" value — store in tValue
    if (node.tValue === undefined) {
      Transition.sources.add(node); // Track that this signal has a pending transition value
    }
    node.tValue = value;
  } else {
    node.value = value;
  }
  // ... propagate
}
```

When the transition commits, all `tValue`s are promoted to `value`:

```ts
function commitTransition(transition: TransitionState) {
  for (const source of transition.sources) {
    if (source.tValue !== undefined) {
      source.value = source.tValue;
      source.tValue = undefined;
    }
  }
  // Run all queued effects
  for (const effect of transition.effects) {
    runTop(effect);
  }
}
```

### useTransition — Tracking Pending State

`useTransition` provides a reactive `pending()` signal that indicates whether a transition is in progress:

```ts
function useTransition(): [pending: () => boolean, start: TransitionFunction] {
  const [pending, setPending] = createSignal(false);

  const start = (fn: () => void) => {
    setPending(true);
    startTransition(fn).then(() => {
      setPending(false);
    });
  };

  return [pending, start];
}
```

This allows UI to show loading indicators during transitions — for example, dimming the current view while the new view is being prepared.

---

## Context Resolution

Solid's context system uses the owner tree for scoping, similar to React's context but without re-renders.

### Provider — Setting Context

```ts
function Provider<T>(props: {
  value: T;
  children: JSX.Element;
}) {
  const id = props.id || contextId;
  return createMemo(() => {
    // Set context on the current owner
    Owner!.context = { ...Owner!.context, [id]: props.value };
    return props.children;
  });
}
```

Actually, the provider sets context on the **owner at the time of creation**. The context map is a plain object stored on the owner:

```ts
owner.context = {
  [contextId1]: value1,
  [contextId2]: value2,
  // ...
};
```

### useContext — Walking Up the Tree

```ts
function useContext<T>(contextId: any): T {
  let owner = Owner;
  while (owner) {
    if (owner.context && contextId in owner.context) {
      return owner.context[contextId];
    }
    owner = owner.owner; // Walk up the owner tree
  }
  return defaultValue;
}
```

This is a simple linear walk up the owner tree. In practice, the tree depth is shallow (component nesting depth), so this is fast. The context lookup happens once during computation creation — not on every read — because the computation captures the value in its closure.

**Key difference from React**: In React, context changes trigger re-renders of all consumers. In Solid, context is just a signal — only the specific computations that read it re-execute. No virtual DOM diffing needed.

---

## Hydration

Hydration is the process of attaching Solid's reactive system to server-rendered HTML, enabling client-side interactivity without destroying the existing DOM.

### HydrationContext

```ts
interface HydrationContext {
  id: string;    // Unique identifier for this hydration root
  count: number; // Counter for generating unique IDs within this root
}
```

### sharedConfig — Global Hydration State

```ts
const sharedConfig: {
  context: HydrationContext | null;  // Current hydration context
  resources: Record<string, any>;    // Server-provided resource data
  effects: Computation[];            // Effects to run after hydration
  registry: Record<string, Element>; // Map of data-hk attributes to DOM elements
} = {
  context: null,
  resources: {},
  effects: [],
  registry: {},
};
```

### Server-Side Rendering with data Attributes

When Solid renders on the server, it annotates DOM elements with `data-hk` (hydration key) attributes:

```html
<div data-hk="0-0">
  <span data-hk="0-0-0">Hello</span>
  <span data-hk="0-0-1">World</span>
</div>
```

The `data-hk` values encode the position in the component tree: `0-0` means root component, first child; `0-0-1` means root component, first child, second child.

### Client-Side Hydration Process

On the client, Solid walks the existing DOM and matches elements to reactive computations:

```ts
function hydrate(fn: () => JSX.Element, node: Element) {
  sharedConfig.context = { id: "0", count: 0 };
  sharedConfig.registry = {};

  // Populate registry from DOM
  const elements = node.querySelectorAll("[data-hk]");
  for (const el of elements) {
    sharedConfig.registry[el.getAttribute("data-hk")!] = el;
  }

  // Run the component function — but instead of creating DOM elements,
  // claim existing ones from the registry
  fn();

  // Run queued effects (deferred during hydration)
  resumeEffects(sharedConfig.effects);
}
```

During hydration, DOM creation functions check `sharedConfig.context`:

```ts
function createElement(tag: string) {
  if (sharedConfig.context) {
    // Hydration mode — find existing element
    const hk = `${sharedConfig.context.id}-${sharedConfig.context.count++}`;
    const existing = sharedConfig.registry[hk];
    if (existing) return existing;
  }
  // Normal mode — create new element
  return document.createElement(tag);
}
```

### Loading Resources from Initial Data

Server-rendered resources are serialized into a global variable:

```html
<script>window.__INITIAL_DATA__ = {"0": {"data": "...", "loading": false}};</script>
```

On the client, `createResource` checks for this data:

```ts
function createResource<T>(source: () => any, fetcher: (...args: any[]) => Promise<T>) {
  // Check for server-provided initial data
  const initialData = sharedConfig.resources?.[resourceId];
  if (initialData) {
    // Resource already has data — no fetch needed
    signal[1](initialData.data);
    return;
  }
  // Normal client-side fetch
  // ...
}
```

This means the first render on the client is synchronous — it reads the pre-fetched data from `__INITIAL_DATA__` and immediately produces the same DOM as the server. No loading states, no layout shifts.

**Hydration constraints**:
- The server and client component trees must match exactly. Mismatches cause hydration failures.
- Effects are deferred until after hydration completes, so side effects don't run during the hydration pass.
- Resources that were loaded on the server are not re-fetched on the client — they're read from the serialized data.

---

## Summary

Solid's reactive system achieves its performance through a combination of:

1. **Fine-grained dependency tracking** — only the exact computations affected by a change re-execute
2. **O(1) slot-based dependency management** — adding and removing dependencies is constant-time
3. **Lazy signal creation in stores** — only properties that are read get signals
4. **Two-level staleness propagation** — direct dependents are marked Stale, transitive ones are Pending, avoiding unnecessary re-execution
5. **Priority-based scheduling** — pure computations before render effects before user effects, with browser yielding via MessageChannel
6. **Dual-value transitions** — keeping the UI responsive during expensive updates by staging changes in `tValue`
7. **Proxy-based deep reactivity** — automatic nested tracking without manual subscription management

The entire system is designed around the principle that **reading is cheap and writing is targeted**. By making signal reads the tracking mechanism (via the `Listener` global), Solid eliminates the need for explicit subscription APIs, dependency arrays, or virtual DOM diffing — the reactive graph is always exactly as granular as the code that reads from it.
