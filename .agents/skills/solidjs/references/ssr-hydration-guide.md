# SolidJS SSR & Hydration Guide

## Server-Side Rendering Functions

SolidJS provides three server-side rendering functions, each suited to different use cases. All are imported from `solid-js/web`.

### renderToString

Synchronous rendering — the simplest form. Renders the entire component tree to a string in one pass. Does **not** support `Suspense`; any async resources inside the tree will fall back to their `fallback` and never resolve on the server.

```ts
import { renderToString } from "solid-js/web";
import App from "./App";

const html = renderToString(() => <App />, {
  nonce: "server-nonce",   // CSP nonce injected into <style> tags
  renderId: "my-app",      // prefixes hydration markers (useful for multiple roots)
});

console.log(html);
// "<div data-hk="my-app-0">...</div>"
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `nonce` | `string` | Content-Security-Policy nonce added to inline `<style>` elements |
| `renderId` | `string` | Prefix for hydration marker keys; disambiguates when multiple roots exist on one page |

**When to use:** Static pages, email templates, or any scenario where all data is available synchronously and no `Suspense` boundaries exist.

---

### renderToStringAsync

Asynchronous rendering — waits for all `Suspense` boundaries and resources to resolve before returning the final HTML. Ideal for pages that fetch data during rendering.

```ts
import { renderToStringAsync } from "solid-js/web";
import App from "./App";

const html = await renderToStringAsync(() => <App />, {
  timeoutMs: 10000,        // max time to wait for async resources
  nonce: "server-nonce",
  renderId: "my-app",
});

console.log(html);
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `timeoutMs` | `number` | Maximum time (ms) to wait for Suspense resources. After timeout, fallbacks are rendered instead. |
| `nonce` | `string` | CSP nonce for inline styles |
| `renderId` | `string` | Prefix for hydration markers |

**How it works:** The renderer encounters a `Suspense` boundary, immediately renders the `fallback`, then waits. When the resource resolves, the fallback is replaced with the real content in the final HTML string.

**When to use:** Pages with data fetching that must be fully rendered before the response is sent (SEO-critical content, social media meta tags).

---

### renderToStream

Streaming SSR — sends the initial HTML shell immediately, then streams in async content as it resolves. This gives the fastest Time-to-First-Byte (TTFB).

```ts
import { renderToStream } from "solid-js/web";
import App from "./App";

// Node.js example
const stream = renderToStream(() => <App />, {
  nonce: "server-nonce",
  renderId: "my-app",
  onCompleteShell() {
    // The initial shell (everything before Suspense boundaries) has been written.
    // Good place to set headers before the response starts streaming.
    console.log("Shell complete");
  },
  onCompleteAll() {
    // All async content has resolved and been written.
    console.log("All content complete");
  },
});

// Pipe to a Node.js writable stream
stream.pipeTo(writable);

// Or pipe to a Web WritableStream
stream.pipe(writable);
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `nonce` | `string` | CSP nonce for inline styles |
| `renderId` | `string` | Prefix for hydration markers |
| `onCompleteShell` | `() => void` | Called when the initial shell HTML is written |
| `onCompleteAll` | `() => void` | Called when all Suspense content has resolved |
| `deferStream` | `boolean` | If `true`, delays streaming until all resources resolve (see below) |

**pipe vs pipeTo:**

```ts
// pipeTo — Web Streams API (WritableStream)
stream.pipeTo(webWritableStream);

// pipe — Node.js-style streaming (ServerResponse, etc.)
stream.pipe(nodeWritable);
```

**When to use:** Most production SSR scenarios. Provides the best user experience by showing content progressively.

---

## Hydration

Hydration is the process of attaching SolidJS reactivity to server-rendered HTML on the client, without destroying the existing DOM.

### hydrate()

```ts
import { hydrate } from "solid-js/web";
import App from "./App";

// Match the renderId used during SSR
hydrate(() => <App />, document.getElementById("root")!, {
  renderId: "my-app",
  owner: undefined, // advanced: set a custom reactive owner
});
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `renderId` | `string` | Must match the `renderId` used during SSR so hydration markers align |
| `owner` | `Owner` | Custom reactive owner for the hydration root (rarely needed) |

### Hydration Rules

1. **Matching DOM** — The client-rendered virtual DOM must match the server-rendered HTML exactly. Any mismatch causes hydration errors and potentially duplicated nodes.

2. **Same component tree** — The same components must render in the same order on both server and client. You cannot render `<A/>` on the server and `<B/>` on the client at the same position.

3. **Same props** — Props passed to components must produce the same output on both sides.

```ts
// BAD: different rendering on server vs client
function Greeting() {
  // This renders "Loading..." on server (no localStorage),
  // but the user's name on client — hydration mismatch!
  const name = typeof window !== "undefined"
    ? localStorage.getItem("name") ?? "Loading..."
    : "Loading...";
  return <h1>Hello, {name}</h1>;
}

// GOOD: same output, update after hydration
function Greeting() {
  const [name, setName] = createSignal("Loading...");

  onMount(() => {
    setName(localStorage.getItem("name") ?? "Guest");
  });

  return <h1>Hello, {name()}</h1>;
}
```

### HydrationScript / generateHydrationScript

When using streaming SSR, SolidJS injects inline scripts that tell the client which Suspense boundaries have resolved. For custom document setups, you may need to include the hydration script manually.

```ts
import { generateHydrationScript } from "solid-js/web";

// Returns a <script> tag string for injection into <head>
const script = generateHydrationScript({ nonce: "my-nonce" });
// "<script nonce="my-nonce">...</script>"

// Use in a custom document template
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  ${script}
  ${assets}
</head>
<body>
  <div id="root">${body}</div>
  <script src="/src/client.tsx" type="module"></script>
</body>
</html>
`;
```

```tsx
// Alternatively, as a component in JSX
import { HydrationScript } from "solid-js/web";

function Document(props: { title: string; assets: string; children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>{props.title}</title>
        <HydrationScript nonce="my-nonce" />
        <solid:head />
      </head>
      <body>
        <div id="root">{props.children}</div>
        <solid:scripts />
      </body>
    </html>
  );
}
```

---

## Streaming SSR

### How Streaming Works

Streaming SSR sends HTML in progressive chunks:

1. **Shell phase** — The server renders all synchronous content and Suspense fallbacks, then immediately sends this "shell" to the browser. The user sees a loading state instantly.
2. **Async phase** — As resources resolve, the server streams additional HTML that replaces the fallbacks in-place using inline `<script>` tags.

```
Timeline:
  Server sends:  <div>Header</div><div>Loading...</div>
  ... data resolves ...
  Server sends:  <script>$hc.replace("s0", "<div>Actual Content</div>")</script>
```

### Suspense Integration

`<Suspense>` is the cornerstone of streaming SSR. Each boundary acts as a streaming insertion point.

```tsx
import { Suspense, createResource } from "solid-js";

function UserProfile() {
  const [user] = createResource(() => fetchUser(userId));

  return (
    <div>
      <h1>Profile Page</h1>
      {/* This Suspense boundary streams independently */}
      <Suspense fallback={<div class="skeleton">Loading profile...</div>}>
        <UserDetails user={user()} />
      </Suspense>
    </div>
  );
}

// Multiple boundaries stream independently
function Dashboard() {
  return (
    <div>
      <Suspense fallback={<ChartSkeleton />}>
        <SalesChart />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

### deferStream Option

When you need to set HTTP headers or perform redirects based on data fetched during SSR, use `deferStream: true`. This tells the renderer to hold the stream until all resources resolve, giving you a chance to modify the response.

```ts
import { renderToStream } from "solid-js/web";
import { redirect } from "@solidjs/router";
import App from "./App";

const stream = renderToStream(() => <App />, {
  deferStream: true, // Don't send anything until resources resolve

  onCompleteShell() {
    // With deferStream, this fires after resources resolve but before streaming starts.
    // Check if a server function triggered a redirect:
    const event = getRequestEvent();
    if (event?.response.headers.get("Location")) {
      // The response will be a redirect instead of HTML
    }
  },
});
```

**When to use `deferStream`:**
- You need to set response headers based on async data (e.g., cache headers from API response)
- Server functions may trigger redirects (e.g., auth checks)
- You need to know the final HTTP status code before sending the response

### onCompleteShell vs onCompleteAll

```ts
renderToStream(() => <App />, {
  onCompleteShell() {
    // Fires when the initial HTML (before any async content) has been written.
    // At this point the browser has received the page shell.
    // Safe place to:
    //   - Flush early headers
    //   - Send a "shell complete" signal
    //   - Start timing LCP
    console.log("User can see the loading state now");
  },

  onCompleteAll() {
    // Fires when every Suspense boundary has resolved and been written.
    // At this point the full page content is in the browser.
    // Good for:
    //   - Logging full render time
    //   - Marking the page as fully loaded
    //   - Cleanup
    console.log("All content delivered");
  },
});
```

---

## isServer / isDev

Import `isServer` and `isDev` from `"solid-js/web"` to conditionally execute code based on the environment.

```ts
import { isServer, isDev } from "solid-js/web";
```

### Tree-Shaking

Because `isServer` is a compile-time constant, bundlers can eliminate unreachable branches entirely:

```ts
import { isServer } from "solid-js/web";

if (isServer) {
  // This block is completely removed from the client bundle
  const fs = await import("fs");
  const data = fs.readFileSync("./data.json", "utf-8");
  console.log(data);
}

if (!isServer) {
  // This block is completely removed from the server bundle
  window.addEventListener("resize", handleResize);
  navigator.geolocation.getCurrentPosition(loc => {});
}
```

### Usage Patterns

```ts
// 1. Server-only imports (client bundle won't include "fs")
const readTemplate = async () => {
  if (isServer) {
    const { readFileSync } = await import("fs");
    return readFileSync("./template.html", "utf-8");
  }
  return "";
};

// 2. Client-only side effects
const [width, setWidth] = createSignal(0);

if (!isServer) {
  setWidth(window.innerWidth);
  window.addEventListener("resize", () => setWidth(window.innerWidth));
}

// 3. Conditional component rendering
function Analytics() {
  if (isServer) return null; // no analytics on server
  return <script async src="https://analytics.example.com/script.js" />;
}

// 4. isDev for development-only code
if (isDev) {
  console.log("Debug info:", someValue);
}

// 5. Combined: client-only, dev-only
if (!isServer && isDev) {
  // Expose debug tools on window
  (window as any).__debug = { state, actions };
}
```

---

## getRequestEvent

`getRequestEvent` provides access to the current HTTP request context inside server functions and during SSR. It is the SolidJS equivalent of accessing `req`/`res` in Express.

```ts
import { getRequestEvent } from "solid-js/web";
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `request` | `Request` | The standard Web API `Request` object |
| `locals` | `Record<string, any>` | Shared state across middleware and server functions for this request |
| `response` | `{ status: number; headers: Headers }` | Mutate to set response status and headers |

### Usage in Server Functions

```ts
import { createServerAction$, createServerData$ } from "solid-start/server";
import { getRequestEvent } from "solid-js/web";

// Access request info in a server function
async function getAuthenticatedUser() {
  "use server";
  const event = getRequestEvent();

  if (!event) {
    throw new Error("Not running in a request context");
  }

  // Read the authorization header
  const authHeader = event.request.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  return verifyToken(token);
}

// Set response headers
function setCacheHeaders() {
  "use server";
  const event = getRequestEvent();
  if (event) {
    event.response.headers.set("Cache-Control", "public, max-age=3600");
    event.response.headers.set("X-Custom", "my-value");
  }
}

// Use locals for request-scoped data (e.g., from middleware)
function getCurrentUser() {
  "use server";
  const event = getRequestEvent();
  return event?.locals.user ?? null;
}
```

### Usage Outside Managed Scope

```ts
// getRequestEvent returns undefined outside a request context
import { getRequestEvent } from "solid-js/web";

// In a server function during SSR — works
async function handler() {
  "use server";
  const event = getRequestEvent(); // RequestEvent | undefined
  console.log(event?.request.url); // defined
}

// In a top-level module or utility — returns undefined
const event = getRequestEvent(); // undefined — no active request
console.log(event); // undefined

// Always guard against undefined
function safeGetUrl(): string {
  const event = getRequestEvent();
  return event?.request.url ?? "unknown";
}
```

### Integration with Middleware

```ts
// middleware.ts (SolidStart example)
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onRequest: (event) => {
    // Set locals for downstream server functions
    event.locals.requestStart = Date.now();
    event.locals.sessionId = parseSessionId(event.request);
  },
  onResponse: (event) => {
    const duration = Date.now() - event.locals.requestStart;
    event.response.headers.set("X-Response-Time", `${duration}ms`);
  },
});

// server-function.ts
async function getDashboardData() {
  "use server";
  const event = getRequestEvent();
  const sessionId = event?.locals.sessionId;
  // Use sessionId to fetch user-specific data
  return fetchDashboard(sessionId);
}
```

---

## SSR with SolidStart

SolidStart provides a complete SSR setup out of the box. The entry point is `entry-server.tsx`.

### entry-server.tsx Setup

```tsx
// src/entry-server.tsx
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="root">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

### createHandler + StartServer

`createHandler` wraps your application with all necessary SSR context (router, meta, server functions). `StartServer` is the root component that renders your app within the server request lifecycle.

```tsx
import { createHandler, StartServer } from "@solidjs/start/server";

// createHandler accepts a function returning JSX
export default createHandler(() => {
  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            {assets}
          </head>
          <body>
            <div id="root">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  );
});
```

The `document` prop receives:
- **`assets`** — Injected `<link>` and `<style>` tags for CSS and font assets
- **`children`** — The rendered app HTML
- **`scripts`** — Script tags including the hydration script and client entry point

### Rendering Modes

Configure the rendering mode in `app.config.ts` (or `vite.config.ts`):

```ts
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true, // enable SSR (default)
  start: {
    // Rendering mode for SSR
    ssr: {
      // "sync" — uses renderToString (no Suspense support)
      // "async" — uses renderToStringAsync (waits for all data)
      // "stream" — uses renderToStream (default, progressive)
      mode: "stream",
    },
  },
});
```

**Mode comparison:**

| Mode | Function | Suspense | Streaming | Use Case |
|------|----------|----------|-----------|----------|
| `sync` | `renderToString` | No (fallbacks only) | No | Static pages, no data fetching |
| `async` | `renderToStringAsync` | Yes (resolved) | No | SEO-critical, full HTML needed |
| `stream` | `renderToStream` | Yes (progressive) | Yes | Default, best UX |

### Custom Document Component with Assets and Scripts

```tsx
function Document(props: {
  assets: string;
  children: JSX.Element;
  scripts: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Assets include Vite-generated CSS links and modulepreload links */}
        {props.assets}
      </head>
      <body class="bg-white text-gray-900 antialiased">
        <div id="root">{props.children}</div>
        {/* Scripts include hydration data and the client entry module */}
        {props.scripts}
      </body>
    </html>
  );
}
```

---

## SSR with Router

When rendering on the server, the router needs to know the current URL to render the correct route.

### Router url Prop

```tsx
import { Router } from "@solidjs/router";
import { renderToString } from "solid-js/web";

// Pass the URL to the Router during SSR
const html = renderToString(() => (
  <Router url={request.url}>
    <App />
  </Router>
));
```

### Passing Request URL to Router

```tsx
// entry-server.tsx with full URL handling
import { createHandler, StartServer } from "@solidjs/start/server";
import { Router } from "@solidjs/router";

export default createHandler(({ request }) => {
  const url = new URL(request.url);

  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            {assets}
          </head>
          <body>
            <div id="root">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  );
});
```

SolidStart's `StartServer` automatically passes the request URL to the `Router`, so you typically don't need to do this manually. But for custom setups:

```tsx
// Custom server (e.g., Express + SolidJS)
import express from "express";
import { renderToStringAsync } from "solid-js/web";
import { Router } from "@solidjs/router";
import App from "./App";

const app = express();

app.get("*", async (req, res) => {
  const html = await renderToStringAsync(() => (
    <Router url={req.originalUrl}>
      <App />
    </Router>
  ));

  res.send(`<!DOCTYPE html>
<html>
  <head><title>My App</title></head>
  <body>
    <div id="root">${html}</div>
    <script type="module" src="/src/client.tsx"></script>
  </body>
</html>`);
});

app.listen(3000);
```

---

## SSR with Meta

SolidJS's meta system lets you set `<head>` tags (title, meta, link) from within components. During SSR, these need to be collected and injected into the document.

### getAssets() for Injecting Head Tags

```tsx
import { renderToStringAsync } from "solid-js/web";
import { MetaProvider } from "@solidjs/meta";
import App from "./App";

// Wrap with MetaProvider and collect assets after rendering
const html = await renderToStringAsync(() => (
  <MetaProvider>
    <App />
  </MetaProvider>
));

// getAssets() returns the collected <head> tags as a string
import { getAssets } from "@solidjs/meta";

const headTags = getAssets();

const document = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    ${headTags}
  </head>
  <body>
    <div id="root">${html}</div>
  </body>
</html>`;
```

### MetaProvider on Server

```tsx
// Full example with MetaProvider
import { renderToStream } from "solid-js/web";
import { MetaProvider, getAssets } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import App from "./App";

function handleRequest(request: Request) {
  let assets = "";

  const stream = renderToStream(() => (
    <MetaProvider tags={getAssets}>
      <Router url={request.url}>
        <App />
      </Router>
    </MetaProvider>
  ));

  // In the onCompleteShell callback, assets have been collected
  // onCompleteShell is the right time to read getAssets()
  return new Response(stream, {
    headers: { "Content-Type": "text/html" },
  });
}
```

### Using Meta in Components

```tsx
import { Title, Meta, Link } from "@solidjs/meta";

function BlogPost(props: { title: string; description: string; slug: string }) {
  return (
    <>
      <Title>{props.title} | My Blog</Title>
      <Meta name="description" content={props.description} />
      <Meta property="og:title" content={props.title} />
      <Meta property="og:description" content={props.description} />
      <Link rel="canonical" href={`https://myblog.com/posts/${props.slug}`} />

      <article>
        <h1>{props.title}</h1>
        {/* ... */}
      </article>
    </>
  );
}
```

---

## Hydration Pitfalls

### Mismatched DOM

When the server-rendered HTML doesn't match what the client expects, hydration fails. This causes duplicated DOM nodes and broken interactivity.

```tsx
// BAD: Server renders "light" (system preference unknown),
//      client renders "dark" (localStorage has dark mode)
function ThemeWrapper() {
  const theme = localStorage.getItem("theme") ?? "light";
  return <div class={`theme-${theme}`}>{/* ... */}</div>;
}

// GOOD: Start with server value, update after hydration
function ThemeWrapper() {
  const [theme, setTheme] = createSignal("light");

  onMount(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  });

  return <div class={`theme-${theme()}`}>{/* ... */}</div>;
}
```

### Conditional Rendering Differences

Never render different content on the server vs the client based on browser APIs or state that only exists on one side:

```tsx
// BAD: Server never has window.__INITIAL_DATA__, client does
function App() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    return <Dashboard data={window.__INITIAL_DATA__} />;
  }
  return <Loading />;
}

// GOOD: Use isServer for clean separation, or use resources
function App() {
  const [data] = createResource(fetchDashboard);
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard data={data()} />
    </Suspense>
  );
}

// GOOD: If you must use conditional, ensure both sides render the same thing
function App() {
  const [showDashboard, setShowDashboard] = createSignal(false);

  onMount(() => {
    setShowDashboard(true);
  });

  return (
    <Show when={showDashboard()} fallback={<Loading />}>
      <Dashboard />
    </Show>
  );
}
```

### createUniqueId

`createUniqueId` generates IDs that must be consistent between server and client. If called a different number of times on each side, hydration markers will be misaligned.

```tsx
import { createUniqueId } from "solid-js";

// BAD: different number of unique IDs on server vs client
function UnstableList() {
  // If items differ between server and client, ID counts mismatch
  const [items, setItems] = createSignal(getItemsFromLocalStorage());
  return (
    <ul>
      <For each={items()}>
        {(item) => {
          const id = createUniqueId(); // Called N times on server, M times on client
          return <li id={id}>{item.name}</li>;
        }}
      </For>
    </ul>
  );
}

// GOOD: Use deterministic IDs or only generate after hydration
function StableList() {
  const [items, setItems] = createSignal(initialItems); // Same on both sides

  onMount(() => {
    // Update after hydration if needed
    setItems(getItemsFromLocalStorage());
  });

  return (
    <ul>
      <For each={items()}>
        {(item, i) => <li id={`item-${i()}`}>{item.name}</li>}
      </For>
    </ul>
  );
}
```

### Resources: ssrLoadFrom Option

When creating resources, you can control how data is loaded during SSR:

```tsx
import { createResource } from "solid-js";

// Default: fetches on both server and client
const [data] = createResource(fetchData);

// server-only: only fetch on the server, serialized to client
const [data] = createResource(fetchData, { ssrLoadFrom: "server" });

// client-only: skip fetch on server, only load on client
const [data] = createResource(fetchData, { ssrLoadFrom: "client" });

// Practical example: skip expensive server-side fetch
function ClientOnlyChart() {
  const [chartData] = createResource(
    () => fetchLargeDataset(),
    { ssrLoadFrom: "client" } // Don't block SSR for this data
  );

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <Chart data={chartData()} />
    </Suspense>
  );
}
```

### onHydrated Callback

The `onHydrated` callback fires after hydration completes, giving you a safe point to run client-only logic:

```tsx
import { createResource } from "solid-js";

const [data, { refetch }] = createResource(fetchData, {
  // onHydrated runs once after the client-side hydration is complete
  onHydrated(k, info) {
    // Safe to access browser APIs now
    console.log("Hydration complete, current value:", info.value);

    // Optionally refetch with fresher data
    if (isStale(info.value)) {
      refetch();
    }
  },
});
```

---

## Common SSR Patterns

### Server-Only Code with isServer

```tsx
import { isServer } from "solid-js/web";

// Server-only database access
async function getPosts() {
  "use server";

  if (!isServer) {
    throw new Error("This function must only run on the server");
  }

  const db = await import("./db");
  return db.query("SELECT * FROM posts ORDER BY created_at DESC");
}

// Server-only module
// logger.server.ts
export function logToServer(message: string, meta?: Record<string, unknown>) {
  if (isServer) {
    console.log(`[Server] ${message}`, meta);
    // Could also write to file, send to monitoring service, etc.
  }
}
```

### Client-Only Components with NoHydration or clientOnly

```tsx
// Option 1: NoHydration — renders on server but doesn't hydrate on client
import { NoHydration } from "solid-js/web";

function App() {
  return (
    <div>
      <h1>My Page</h1>
      <NoHydration>
        {/* This renders to HTML on the server but is not interactive on the client.
            Useful for static content that doesn't need reactivity. */}
        <StaticContent />
      </NoHydration>
    </div>
  );
}

// Option 2: clientOnly — skips server rendering entirely
import { clientOnly } from "@solidjs/start";

// The component is only loaded and rendered on the client.
// On the server, the fallback is rendered instead.
const HeavyChart = clientOnly(() => import("./HeavyChart"));

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}

// clientOnly with custom fallback
const MapWidget = clientOnly(() => import("./MapWidget"));

function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      {/* MapWidget renders nothing on server, loads client-side */}
      <MapWidget />
    </div>
  );
}
```

### Streaming with Suspense Boundaries

```tsx
import { Suspense, createResource, Show } from "solid-js";

// Pattern: Nested Suspense for progressive loading
function ProductPage({ productId }: { productId: string }) {
  const [product] = createResource(() => fetchProduct(productId));
  const [reviews] = createResource(() => fetchReviews(productId));
  const [related] = createResource(() => fetchRelated(productId));

  return (
    <div>
      {/* Top-level: product details are critical, stream first */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails product={product()} />

        {/* Reviews can load independently */}
        <Suspense fallback={<ReviewsSkeleton />}>
          <ReviewList reviews={reviews()} />
        </Suspense>
      </Suspense>

      {/* Related products are below the fold, load last */}
      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedProducts products={related()} />
      </Suspense>
    </div>
  );
}

// Pattern: Error boundaries around Suspense
import { ErrorBoundary } from "solid-js";

function SafeSection() {
  return (
    <ErrorBoundary
      fallback={(err) => (
        <div class="error">
          <p>Something went wrong: {err.message}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
    >
      <Suspense fallback={<Loading />}>
        <AsyncContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Error Handling During SSR

```tsx
import { ErrorBoundary } from "solid-js";
import { renderToStream } from "solid-js/web";

// 1. ErrorBoundary catches rendering errors
function App() {
  return (
    <ErrorBoundary fallback={(err) => <ErrorPage error={err} />}>
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}

// 2. Catch errors at the stream level
const stream = renderToStream(() => <App />);

try {
  stream.pipeTo(writable);
} catch (err) {
  // Handle streaming errors (e.g., broken pipe, resource timeout)
  console.error("SSR streaming error:", err);

  // Fallback: send a minimal error page
  const errorHtml = renderToString(() => <ErrorPage error={err} />);
  writable.write(errorHtml);
  writable.end();
}

// 3. Error handling in server functions
async function deletePost(id: string) {
  "use server";

  try {
    await db.posts.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    // Server function errors are serialized and sent to the client
    throw new Error(`Failed to delete post: ${(error as Error).message}`);
  }
}

// 4. Catching resource errors with ErrorBoundary + Suspense
function UserProfile({ id }: { id: string }) {
  const [user] = createResource(
    () => id,
    async (userId) => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error(`User not found: ${userId}`);
      return res.json();
    }
  );

  return (
    <ErrorBoundary fallback={(err) => <UserNotFound error={err} />}>
      <Suspense fallback={<UserSkeleton />}>
        <UserCard user={user()!} />
      </Suspense>
    </ErrorBoundary>
  );
}

// 5. Global error handling in SolidStart
// src/entry-server.tsx
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          {assets}
        </head>
        <body>
          <ErrorBoundary fallback={(err) => <GlobalError error={err} />}>
            <div id="root">{children}</div>
          </ErrorBoundary>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

---

## Quick Reference

| Function | Import | Use Case |
|----------|--------|----------|
| `renderToString` | `solid-js/web` | Sync SSR, no Suspense |
| `renderToStringAsync` | `solid-js/web` | Async SSR, full HTML |
| `renderToStream` | `solid-js/web` | Streaming SSR (default) |
| `hydrate` | `solid-js/web` | Client-side hydration |
| `generateHydrationScript` | `solid-js/web` | Hydration script string |
| `HydrationScript` | `solid-js/web` | Hydration script component |
| `isServer` | `solid-js/web` | Server check (tree-shakeable) |
| `isDev` | `solid-js/web` | Dev mode check |
| `getRequestEvent` | `solid-js/web` | Access request context |
| `NoHydration` | `solid-js/web` | Render without hydration |
| `clientOnly` | `@solidjs/start` | Client-only lazy component |
| `getAssets` | `@solidjs/meta` | Collect head tags for SSR |

| SSR Mode | Suspense | Streaming | Best For |
|----------|----------|-----------|----------|
| `sync` | Fallbacks only | No | Static pages |
| `async` | Full resolution | No | SEO-critical pages |
| `stream` | Progressive | Yes | Default production |
