# @solid-primitives Ecosystem

## What Are Solid Primitives?

Community-maintained reactive primitives that follow Solid's design patterns. Think of them like React hooks libraries — but built on Solid's fine-grained reactive primitives instead of hooks. Every primitive integrates naturally with `createSignal`, `createEffect`, `createMemo`, and the rest of Solid's reactivity system, so they compose without extra wiring.

---

## Common Primitives by Category

### State & Storage

#### @solid-primitives/storage
Reactive wrappers around `localStorage` and `sessionStorage`. Values stay in sync across tabs.

```tsx
import { createLocalStorage, createSessionStorage } from "@solid-primitives/storage";

const [value, setValue] = createLocalStorage("my-key", { defaultValue: "" });
// value() reads from localStorage, setValue() writes to it
// Changes persist across page reloads and sync across tabs
```

#### @solid-primitives/context
`MultiProvider` to inject many contexts without deep nesting.

```tsx
import { MultiProvider } from "@solid-primitives/context";

// Instead of nesting <Provider1><Provider2><Provider3>>…</Provider3></Provider2></Provider1>
<MultiProvider values={[ThemeContext.Provider, AuthContext.Provider, I18nContext.Provider]}>
  <App />
</MultiProvider>
```

#### @solid-primitives/memo
Cached and lazy memo helpers.

```tsx
import { createMemoCache, createLazyMemo } from "@solid-primitives/memo";

// createMemoCache: memo with a configurable cache size
const cached = createMemoCache((key: string) => expensiveLookup(key), { size: 50 });

// createLazyMemo: deferred memo that only evaluates when first read
const lazy = createLazyMemo(() => computeHeavyValue());
```

#### @solid-primitives/signal
Helpers for creating and composing signals.

```tsx
import { createSignalFrom } from "@solid-primitives/signal";

// Create a signal from an existing value or reactive source
const [count, setCount] = createSignalFrom(0);
```

---

### Browser APIs

#### @solid-primitives/media
Reactive `matchMedia` / media-query tracking.

```tsx
import { createMediaQuery } from "@solid-primitives/media";

const isMobile = createMediaQuery("(max-width: 640px)");
// Use in templates: <Show when={isMobile()}>Mobile layout</Show>
```

#### @solid-primitives/keyboard
Declarative keyboard-shortcut binding.

```tsx
import { createShortcut } from "@solid-primitives/keyboard";

createShortcut(["Control", "s"], () => {
  saveDocument();
});
```

#### @solid-primitives/clipboard
Reactive Clipboard API wrapper.

```tsx
import { createClipboard } from "@solid-primitives/clipboard";

const [text, write] = createClipboard();
// text() reads current clipboard content
// write("copied!") writes to the clipboard
```

#### @solid-primitives/geolocation
Reactive Geolocation API.

```tsx
import { createGeolocation } from "@solid-primitives/geolocation";

const [location] = createGeolocation();
// location().latitude, location().longitude — updates in real time
```

#### @solid-primitives/online
Track online/offline status reactively.

```tsx
import { createOnline } from "@solid-primitives/online";

const isOnline = createOnline();
// isOnline() → true / false
```

#### @solid-primitives/visibility
Reactive page-visibility tracking.

```tsx
import { createVisibility } from "@solid-primitives/visibility";

const visibility = createVisibility();
// visibility() → "visible" | "hidden"
```

#### @solid-primitives/focus
Focus-management utilities.

```tsx
import { createFocus } from "@solid-primitives/focus";

const [focused, setFocused] = createFocus(ref);
// focused() → true when the element has focus
```

#### @solid-primitives/scroll
Reactive scroll-position tracking.

```tsx
import { createScrollPosition } from "@solid-primitives/scroll";

const scroll = createScrollPosition();
// scroll().x, scroll().y — reactive scroll offsets
```

#### @solid-primitives/resize
Reactive ResizeObserver wrapper.

```tsx
import { createResizeObserver } from "@solid-primitives/resize";

createResizeObserver(ref, ({ width, height }) => {
  console.log("Resized:", width, height);
});
```

#### @solid-primitives/intersection
Reactive IntersectionObserver wrapper.

```tsx
import { createIntersectionObserver } from "@solid-primitives/intersection";

const [isVisible] = createIntersectionObserver(ref, { threshold: 0.5 });
// isVisible() → true when element is 50 % visible
```

#### @solid-primitives/mutation
Reactive MutationObserver wrapper.

```tsx
import { createMutationObserver } from "@solid-primitives/mutation";

createMutationObserver(ref, { childList: true }, (mutations) => {
  console.log("DOM changed:", mutations);
});
```

---

### Timing

#### @solid-primitives/schedule
Debounce, throttle, and `requestAnimationFrame` scheduling.

```tsx
import { createDebounce, createThrottle } from "@solid-primitives/schedule";

const debouncedSave = createDebounce(() => save(), 300);
const throttledScroll = createThrottle(() => handleScroll(), 100);
```

#### @solid-primitives/timer
Reactive `setInterval` / `setTimeout` that auto-cleanup on owner disposal.

```tsx
import { createInterval, createTimeout } from "@solid-primitives/timer";

createInterval(() => poll(), 5000);           // polls every 5 s
createTimeout(() => showBanner(), 3000);      // shows after 3 s
```

---

### Data Fetching

#### @solid-primitives/fetch
Reactive `fetch` wrapper with built-in caching and abort support.

```tsx
import { createFetch } from "@solid-primitives/fetch";

const [data] = createFetch<User[]>("/api/users");
// data() → { loading: true } … { data: [...], loading: false }
```

#### @solid-primitives/async
Async utilities for Solid's reactivity — `createAsync`, resource helpers.

```tsx
import { createAsync } from "@solid-primitives/async";

const result = createAsync(async () => {
  const res = await fetch("/api/data");
  return res.json();
});
// result() reacts when the promise resolves
```

---

### UI

#### @solid-primitives/active-element
Track the currently active (focused) DOM element.

```tsx
import { createActiveElement } from "@solid-primitives/active-element";

const active = createActiveElement();
// active() → the currently focused element (or null)
```

#### @solid-primitives/cursor
Reactive cursor/mouse position.

```tsx
import { createCursor } from "@solid-primitives/cursor";

const pos = createCursor();
// pos().x, pos().y — reactive mouse coordinates
```

#### @solid-primitives/dropzone
Drag-and-drop zone utilities.

```tsx
import { createDropzone } from "@solid-primitives/dropzone";

const { setRef, isOver } = createDropzone({ onDrop: (files) => upload(files) });
// isOver() → true when a file is dragged over the ref
```

#### @solid-primitives/pagination
Headless pagination logic.

```tsx
import { createPagination } from "@solid-primitives/pagination";

const { page, setPage, totalPages } = createPagination({ pages: 20, initialPage: 1 });
// page() → current page number, setPage(5) navigates
```

#### @solid-primitives/presence
Presence detection for enter/leave animations.

```tsx
import { createPresence } from "@solid-primitives/presence";

const presence = createPresence(() => isVisible());
// presence() → "entering" | "visible" | "exiting" | "hidden"
```

#### @solid-primitives/transition
Transition utilities for smooth state changes.

```tsx
import { createTransition } from "@solid-primitives/transition";

const [pending, start] = createTransition();
// start(() => updateState()); pending() → true while transition is in progress
```

---

### Utilities

#### @solid-primitives/date
Reactive date/time utilities.

```tsx
import { createDate } from "@solid-primitives/date";

const now = createDate();
// now() → current Date, auto-updates on an interval
```

#### @solid-primitives/i18n
Internationalization primitives.

```tsx
import { createI18nContext } from "@solid-primitives/i18n";

const [t, { locale, setLocale }] = createI18nContext({ en: { hello: "Hello" } });
// t("hello") → "Hello"; setLocale("fr") switches language
```

#### @solid-primitives/event-dispatcher
Typed custom-event dispatching.

```tsx
import { createEventDispatcher } from "@solid-primitives/event-dispatcher";

const dispatch = createEventDispatcher<{ change: number }>();
dispatch("change", 42);
```

#### @solid-primitives/marker
Map-marker primitives (useful with Leaflet, MapLibre, etc.).

```tsx
import { createMarker } from "@solid-primitives/marker";

const marker = createMarker({ lat: 51.5, lng: -0.1 });
// marker() reacts to position changes
```

#### @solid-primitives/range
Range-slider logic.

```tsx
import { createRange } from "@solid-primitives/range";

const { value, setValue } = createRange({ min: 0, max: 100, step: 5 });
```

#### @solid-primitives/rootless
Run effects without attaching to the current owner (useful for event buses, global listeners).

```tsx
import { createRootEffect } from "@solid-primitives/rootless";

createRootEffect(() => {
  console.log("Independent effect:", signal());
});
```

#### @solid-primitives/uncontrollable
Bridge between controlled and uncontrollable props.

```tsx
import { createUncontrollable } from "@solid-primitives/uncontrollable";

const [value, setValue] = createUncontrollable({
  defaultValue: "",
  onChange: (v) => props.onChange?.(v),
});
```

---

### Animation

#### @solid-primitives/spring
Spring-physics–based animation.

```tsx
import { createSpring } from "@solid-primitives/spring";

const [value, setValue] = createSpring(0, { stiffness: 180, damping: 12 });
// setValue(100) → value() animates toward 100 with spring physics
```

#### @solid-primitives/motion
Motion/animation utilities built on Solid reactivity.

```tsx
import { createMotion } from "@solid-primitives/motion";

const progress = createMotion(0);
// progress.set(1) animates from 0 → 1
```

#### @solid-primitives/easings
Common easing functions for custom animations.

```tsx
import { easeInOutCubic, easeOutBounce } from "@solid-primitives/easings";

const t = easeInOutCubic(progress); // 0…1 eased value
```

---

### Styling

#### @solid-primitives/styled
Styled-components–like API for Solid.

```tsx
import { styled } from "@solid-primitives/styled";

const Button = styled("button")`
  background: rebeccapurple;
  color: white;
  padding: 8px 16px;
`;
// <Button>Click me</Button>
```

#### @solid-primitives/css
CSS utility helpers.

```tsx
import { css } from "@solid-primitives/css";

const className = css({ color: "tomato", fontSize: "16px" });
```

#### @solid-primitives/classlist
Reactive `classList` helpers.

```tsx
import { createClassList } from "@solid-primitives/classlist";

const cls = createClassList({ active: isActive, disabled: isDisabled });
// cls() → "active disabled" (reactively computed)
```

#### @solid-primitives/styles
Inline-style helpers.

```tsx
import { createStyles } from "@solid-primitives/styles";

const style = createStyles({ color: textColor(), fontSize: "14px" });
// style() → reactive style object
```

---

## Usage Pattern

```tsx
import { createLocalStorage } from "@solid-primitives/storage";

const [value, setValue] = createLocalStorage("my-key", { defaultValue: "" });
// Reactive: value() reads from localStorage, setValue() writes to it
```

**Key principles when using solid-primitives:**

1. **Auto-cleanup** — Most primitives create effects or listeners that are automatically cleaned up when their reactive owner is disposed. No manual teardown needed.
2. **Fine-grained** — Like all of Solid, primitives update only what changed. A `createMediaQuery` signal doesn't re-render your whole component.
3. **Composable** — Primitives compose with `createMemo`, `createEffect`, and each other just like built-in Solid primitives.
4. **Server-safe** — Many primitives are SSR-aware and gracefully handle non-browser environments.

---

## Finding Primitives

| Source | Link |
|--------|------|
| GitHub | https://github.com/solidjs-community/solid-primitives |
| npm | Search `@solid-primitives/*` |
| Solid Community Discord | #primitives channel |

When a primitive you need doesn't exist, consider contributing — the repo has a starter template and contribution guide.
