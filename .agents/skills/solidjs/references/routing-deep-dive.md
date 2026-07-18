# SolidJS Router Deep Dive

A comprehensive guide to `@solidjs/router` — the official router for SolidJS, built around nested routing, fine-grained reactivity, and streaming SSR.

---

## Setup & Configuration

### Installation

```bash
npm install @solidjs/router
# or
pnpm add @solidjs/router
# or
yarn add @solidjs/router
```

### Basic Router Setup

Wrap your application with the `<Router>` component. It provides the routing context that all navigation primitives and components depend on.

```tsx
import { Router, Route } from "@solidjs/router";
import App from "./App";

// Mount the router with route definitions
const root = document.getElementById("root");

render(
  () => (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users" component={Users} />
    </Router>
  ),
  root!
);
```

### Component-Based Routing vs Config-Based Routing

**Component-based** — declare routes as JSX children of `<Router>`:

```tsx
<Router>
  <Route path="/" component={Home} />
  <Route path="/users" component={Users}>
    <Route path="/:id" component={UserProfile} />
  </Route>
  <Route path="/*" component={NotFound} />
</Router>
```

**Config-based** — define routes as a data structure and pass them via the `routes` prop:

```tsx
import { Router } from "@solidjs/router";

const routes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/users",
    component: Users,
    children: [
      {
        path: "/:id",
        component: UserProfile,
      },
    ],
  },
  {
    path: "/*",
    component: NotFound,
  },
];

function App() {
  return <Router routes={routes} />;
}
```

Both approaches are equivalent — choose whichever fits your project structure. Config-based routing is often preferred for large apps because routes can be split across files and composed programmatically.

### Root Layout with `root` Prop

The `root` prop on `<Router>` defines a wrapper component that renders around **all** routes. It receives a prop that you spread to render the matched child route.

```tsx
import { Router, Route } from "@solidjs/router";

function RootLayout(props: { children?: JSX.Element }) {
  return (
    <div class="app-shell">
      <nav>
        <A href="/">Home</A>
        <A href="/dashboard">Dashboard</A>
        <A href="/settings">Settings</A>
      </nav>
      <main>
        {/* The matched route renders here */}
        {props.children}
      </main>
      <footer>&copy; 2026 My App</footer>
    </div>
  );
}

render(
  () => (
    <Router root={RootLayout}>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  root!
);
```

The `root` component is the ideal place for global layouts, navigation bars, error boundaries, and context providers that should persist across all route transitions.

---

## Route Definition

### Path Syntax

SolidJS Router supports a rich path syntax for matching URL segments:

| Syntax | Meaning | Example Match |
|---|---|---|
| `/` | Exact root | `/` |
| `/static` | Static segment | `/static` |
| `/:id` | Required parameter | `/123`, `/abc` |
| `/:id?` | Optional parameter | `/`, `/123` |
| `/*` | Wildcard (rest) | `/a/b/c` |
| `/*rest` | Named wildcard | `/a/b/c` (captured as `rest`) |

```tsx
<Router>
  {/* Exact root */}
  <Route path="/" component={Home} />

  {/* Required path parameter */}
  <Route path="/users/:id" component={UserProfile} />

  {/* Optional path parameter — matches both /settings and /settings/tab */}
  <Route path="/settings/:tab?" component={Settings} />

  {/* Wildcard — matches /files and any sub-path like /files/docs/readme.md */}
  <Route path="/files/*" component={FileBrowser} />

  {/* Named wildcard — the rest is captured in params.rest */}
  <Route path="/docs/*rest" component={Docs} />
</Router>
```

Accessing the parameters in components:

```tsx
function UserProfile() {
  // For /users/:id → params.id
  const params = useParams();
  return <h1>User ID: {params.id}</h1>;
}

function Settings() {
  // For /settings/:tab? → params.tab may be undefined
  const params = useParams();
  return <h1>Settings Tab: {params.tab ?? "default"}</h1>;
}

function FileBrowser() {
  // For /files/* → the wildcard portion is empty string or the rest of the path
  const params = useParams();
  // params["*"] or params["0"] for unnamed wildcard
  return <p>File path: {params["*"]}</p>;
}

function Docs() {
  // For /docs/*rest → params.rest contains the remainder
  const params = useParams();
  return <p>Doc path: {params.rest}</p>;
}
```

### Multiple Paths

A single route can match multiple path patterns using an array:

```tsx
<Route path={["/blog", "/articles"]} component={Blog} />

// With parameters
<Route path={["/shop/:category", "/store/:category"]} component={Shop} />
```

This is useful when you want the same component to handle multiple URL patterns — for example, during a URL migration or when supporting legacy paths.

### Nested Routes and Layouts

Nested routes create a URL hierarchy and share a parent layout component. The parent renders `{props.children}` where the child route appears.

```tsx
<Router root={AppShell}>
  {/* /dashboard → DashboardLayout */}
  {/* /dashboard/analytics → DashboardLayout + Analytics */}
  {/* /dashboard/settings → DashboardLayout + DashboardSettings */}
  <Route path="/dashboard" component={DashboardLayout}>
    <Route path="/" component={DashboardHome} />
    <Route path="/analytics" component={Analytics} />
    <Route path="/settings" component={DashboardSettings} />
  </Route>
</Router>

function DashboardLayout(props: { children?: JSX.Element }) {
  return (
    <div class="dashboard">
      <aside class="sidebar">
        <A href="/dashboard">Overview</A>
        <A href="/dashboard/analytics">Analytics</A>
        <A href="/dashboard/settings">Settings</A>
      </aside>
      <section class="content">
        {props.children}
      </section>
    </div>
  );
}
```

Deeply nested example with three levels:

```tsx
<Route path="/admin" component={AdminLayout}>
  <Route path="/users" component={AdminUsersLayout}>
    <Route path="/" component={UserList} />
    <Route path="/:id" component={UserDetail} />
    <Route path="/new" component={NewUser} />
  </Route>
  <Route path="/reports" component={AdminReports} />
</Route>
```

URL structure:
- `/admin` → AdminLayout (no child matched)
- `/admin/users` → AdminLayout + AdminUsersLayout + UserList
- `/admin/users/42` → AdminLayout + AdminUsersLayout + UserDetail
- `/admin/reports` → AdminLayout + AdminReports

### MatchFilters for Parameter Validation

`MatchFilters` let you constrain path parameters with regex or custom validators. If a parameter fails validation, the route does **not** match.

```tsx
import { Route, MatchFilters } from "@solidjs/router";

// Define filters for your parameters
const filters: MatchFilters = {
  // Only match numeric IDs
  id: /^\d+$/,

  // Only match specific values
  section: /^(profile|account|security)$/,

  // Custom validator function — return true to match
  year: (value: string) => {
    const num = parseInt(value, 10);
    return num >= 2000 && num <= 2030;
  },
};

<Router>
  <Route path="/users/:id" matchFilters={filters} component={UserProfile} />
  <Route path="/settings/:section" matchFilters={filters} component={SettingsSection} />
  <Route path="/archive/:year" matchFilters={filters} component={Archive} />
</Router>
```

Now:
- `/users/42` → matches (id is numeric)
- `/users/abc` → does **not** match (id fails regex)
- `/settings/profile` → matches
- `/settings/unknown` → does **not** match
- `/archive/2024` → matches
- `/archive/1999` → does **not** match (year out of range)

### Route `info` Prop for Metadata

The `info` prop on `<Route>` lets you attach arbitrary metadata to a route definition. This is commonly used for breadcrumbs, page titles, permissions, or any data you want to associate with a route.

```tsx
<Route
  path="/dashboard"
  component={DashboardLayout}
  info={{ title: "Dashboard", breadcrumb: "Home" }}
>
  <Route
    path="/analytics"
    component={Analytics}
    info={{ title: "Analytics", breadcrumb: "Dashboard > Analytics" }}
  />
  <Route
    path="/settings"
    component={DashboardSettings}
    info={{ title: "Settings", breadcrumb: "Dashboard > Settings", requiresAuth: true }}
  />
</Route>
```

Access route info via `useCurrentMatches` or `useRouteData`:

```tsx
import { useCurrentMatches } from "@solidjs/router";

function Breadcrumbs() {
  const matches = useCurrentMatches();

  // Each match has a .route property with the info
  const crumbs = createMemo(() =>
    matches()
      .filter((m) => m.route.info?.breadcrumb)
      .map((m) => ({
        label: m.route.info.breadcrumb,
        path: m.path,
      }))
  );

  return (
    <nav class="breadcrumbs">
      <For each={crumbs()}>
        {(crumb) => <A href={crumb.path}>{crumb.label}</A>}
      </For>
    </nav>
  );
}

function PageTitle() {
  const matches = useCurrentMatches();
  const title = createMemo(() => {
    const last = matches().at(-1);
    return last?.route.info?.title ?? "My App";
  });

  return <title>{title()}</title>;
}
```

---

## Navigation

### `<A>` Component

The `<A>` component is SolidJS Router's replacement for `<a>` tags. It handles client-side navigation without full page reloads and provides active-state detection.

```tsx
import { A } from "@solidjs/router";

function NavBar() {
  return (
    <nav>
      {/* Basic link */}
      <A href="/">Home</A>

      {/* Active class — applied when the current URL starts with href */}
      <A href="/dashboard" activeClass="nav-active" inactiveClass="nav-inactive">
        Dashboard
      </A>

      {/* end prop — only mark active when href matches exactly (not sub-paths) */}
      <A href="/" end>
        Home (exact)
      </A>

      {/* replace — replace current history entry instead of pushing */}
      <A href="/login" replace>
        Login
      </A>

      {/* noScroll — don't scroll to top after navigation */}
      <A href="/long-page" noScroll>
        Long Page
      </A>

      {/* state — attach history state to the navigation */}
      <A href="/results" state={{ from: "search", query: "solid" }}>
        Search Results
      </A>
    </nav>
  );
}
```

**All `<A>` props:**

| Prop | Type | Description |
|---|---|---|
| `href` | `string` | Target path (absolute or relative) |
| `activeClass` | `string` | CSS class applied when link is active |
| `inactiveClass` | `string` | CSS class applied when link is inactive |
| `end` | `boolean` | Only active on exact match (not prefix) |
| `replace` | `boolean` | Replace history entry instead of push |
| `noScroll` | `boolean` | Disable scroll-to-top on navigation |
| `state` | `unknown` | Attach custom state to history entry |
| `onclick` | `EventHandler` | Custom click handler (navigation still occurs unless prevented) |

CSS-based active styling example:

```css
/* Using activeClass / inactiveClass */
.nav-active {
  color: white;
  background: #4a90d9;
  font-weight: bold;
}
.nav-inactive {
  color: #999;
}
```

### `useNavigate`

The `useNavigate` primitive returns a function for programmatic navigation.

```tsx
import { useNavigate } from "@solidjs/router";

function LoginForm() {
  const navigate = useNavigate();

  const [form, setForm] = createSignal({ email: "", password: "" });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const result = await login(form());
    if (result.success) {
      // Basic navigation
      navigate("/dashboard");

      // With options:
      navigate("/dashboard", {
        resolve: false,   // treat href as absolute (default: true, resolves relative to current route)
        replace: true,    // replace current history entry
        scroll: false,    // don't scroll to top
        state: { welcome: true },  // attach history state
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={form().email}
        onInput={(e) => setForm({ ...form(), email: e.currentTarget.value })}
      />
      <input
        type="password"
        value={form().password}
        onInput={(e) => setForm({ ...form(), password: e.currentTarget.value })}
      />
      <button type="submit">Log In</button>
    </form>
  );
}
```

**`navigate` signature:**

```ts
type NavigateOptions = {
  resolve?: boolean;  // resolve relative to current route (default: true)
  replace?: boolean;  // replace history entry (default: false)
  scroll?: boolean;   // scroll to top (default: true)
  state?: unknown;    // history state object
};

function navigate(href: string, options?: NavigateOptions): void;
```

### `<Navigate>` Component

For declarative redirects — useful in route components or conditionally in JSX:

```tsx
import { Navigate } from "@solidjs/router";

function ProtectedRoute() {
  const [isAuth] = createSignal(false);

  // If not authenticated, redirect to login
  return (
    <Show
      when={isAuth()}
      fallback={<Navigate href="/login" />}
    >
      <SecretContent />
    </Show>
  );
}

// With state
<Navigate href="/onboarding" state={{ newUser: true }} />

// With replace
<Navigate href="/home" replace />
```

### `redirect()` in Actions/Queries

The `redirect()` function is used inside route `preload` functions, `query` functions, and `action` handlers to trigger a server-side or client-side redirect. It works by throwing a special response object that the router intercepts.

```tsx
import { redirect } from "@solidjs/router";

// In a preload function
const routes = [
  {
    path: "/admin",
    preload: async ({ params }) => {
      const user = await getCurrentUser();
      if (!user.isAdmin) {
        // Redirect with status code for SSR
        throw redirect("/unauthorized", { status: 302 });
      }
    },
    component: AdminPanel,
  },
];

// In an action
const submitOrder = action(async (items: CartItem[]) => {
  const orderId = await createOrder(items);
  // Redirect after successful action
  throw redirect(`/orders/${orderId}`, { status: 303 });
});

// In a query
const userProfile = query(async (id: string) => {
  const user = await fetchUser(id);
  if (!user) {
    throw redirect("/users/not-found");
  }
  return user;
}, "userProfile");
```

**`redirect` signature:**

```ts
function redirect(url: string, options?: { status?: number; headers?: Headers }): Response;
```

The `status` defaults to 302. Use 303 for post-action redirects (forces GET). The function returns a `Response` object — you `throw` it so the router can intercept it.

---

## Parameters

### `useParams`

Access path parameters extracted from the current route match:

```tsx
import { useParams } from "@solidjs/router";

// Route: /users/:id/posts/:postId
function UserPost() {
  const params = useParams<{ id: string; postId: string }>();

  createEffect(() => {
    console.log("User ID:", params.id);
    console.log("Post ID:", params.postId);
  });

  return (
    <div>
      <h1>User {params.id} — Post {params.postId}</h1>
    </div>
  );
}
```

`useParams` returns a **reactive** object — accessing properties inside tracking scopes (effects, memos, JSX) will re-trigger when the URL changes.

### `useSearchParams`

Read and write query string parameters reactively:

```tsx
import { useSearchParams } from "@solidjs/router";

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Reading search params
  const currentPage = () => Number(searchParams.page) || 1;
  const category = () => searchParams.category ?? "all";
  const sortBy = () => searchParams.sort ?? "name";

  // Writing search params — updates the URL without full navigation
  function goToPage(page: number) {
    setSearchParams({ page: String(page) });
  }

  function setCategory(cat: string) {
    // Replace all search params
    setSearchParams({ category: cat, page: "1" });
  }

  function clearFilters() {
    // Set to empty to clear all
    setSearchParams({}, { replace: true });
  }

  // Partial update — only change specified keys, keep others
  function setSort(sort: string) {
    setSearchParams({ sort }, { replace: false });
  }

  return (
    <div>
      <p>Category: {category()}</p>
      <p>Page: {currentPage()}</p>
      <p>Sort: {sortBy()}</p>

      <button onClick={() => goToPage(currentPage() + 1)}>Next Page</button>
      <button onClick={() => setCategory("electronics")}>Electronics</button>
      <button onClick={() => setSort("price")}>Sort by Price</button>
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
}
```

**`setSearchParams` options:**

```ts
type SetSearchParamsOptions = {
  replace?: boolean;  // replace history entry (default: false)
};
```

### `useLocation`

Get full information about the current URL location:

```tsx
import { useLocation } from "@solidjs/router";

function LocationDebug() {
  const location = useLocation();

  createEffect(() => {
    console.log("pathname:", location.pathname);   // "/users/42/posts"
    console.log("search:", location.search);       // "?page=2&sort=name"
    console.log("hash:", location.hash);           // "#section-3"
    console.log("query:", location.query);         // { page: "2", sort: "name" } (parsed search)
    console.log("state:", location.state);         // { from: "dashboard" } (history state)
    console.log("key:", location.key);             // "default" or unique navigation key
    console.log("url:", location.url);             // full URL string
  });

  return (
    <dl>
      <dt>Pathname</dt><dd>{location.pathname}</dd>
      <dt>Search</dt><dd>{location.search}</dd>
      <dt>Hash</dt><dd>{location.hash}</dd>
      <dt>Query (page)</dt><dd>{location.query.page}</dd>
      <dt>State</dt><dd>{JSON.stringify(location.state)}</dd>
      <dt>Key</dt><dd>{location.key}</dd>
    </dl>
  );
}
```

**`Location` properties:**

| Property | Type | Description |
|---|---|---|
| `pathname` | `string` | Path portion of URL |
| `search` | `string` | Raw query string (including `?`) |
| `hash` | `string` | Hash fragment (including `#`) |
| `query` | `Record<string, string>` | Parsed search params |
| `state` | `unknown` | History state from navigation |
| `key` | `string` | Unique key for this location |
| `url` | `string` | Full URL |

### `useMatch`

Check if a specific path pattern matches the current route. Useful for conditional rendering based on route matching:

```tsx
import { useMatch } from "@solidjs/router";

function Sidebar() {
  // Returns the match object if the pattern matches, null otherwise
  const isAdmin = useMatch(() => "/admin/*");
  const isUserPage = useMatch(() => "/users/:id");

  return (
    <aside>
      <Show when={isAdmin()}>
        <AdminSidebarSection />
      </Show>
      <Show when={isUserPage()}>
        <UserSidebarSection />
      </Show>
      <GeneralSidebarSection />
    </aside>
  );
}
```

`useMatch` accepts a getter function that returns a path pattern. It returns a reactive signal — when the URL changes, the match result updates.

### `useResolvedPath`

Resolve a relative path against the current route's path. Essential for building links in nested route components:

```tsx
import { useResolvedPath } from "@solidjs/router";

function Breadcrumb() {
  // Resolve "../" relative to the current route
  const parentPath = useResolvedPath(() => "../");
  // Resolve a sibling path
  const siblingPath = useResolvedPath(() => "./settings");

  return (
    <div>
      <A href={parentPath() ?? "/"}>Parent</A>
      <A href={siblingPath() ?? "/"}>Settings</A>
    </div>
  );
}

// Practical example: a reusable card component that links to a detail page
function ItemCard(props: { id: string; name: string }) {
  const detailPath = useResolvedPath(() => `./${props.id}`);

  return (
    <div class="card">
      <h3>{props.name}</h3>
      <A href={detailPath()!}>View Details</A>
    </div>
  );
}
```

---

## Data Fetching

### `query()`

`query()` defines a cached, deduplicated data-fetching function. It is the primary way to declare data dependencies that the router can preload and cache.

```tsx
import { query, createAsync } from "@solidjs/router";

// Define a query — the first argument is the fetcher function,
// the second is a cache key (string or function)
const getUser = query(async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error("User not found");
  return response.json() as Promise<User>;
}, "user");

// You can also use a function for the cache key for parameterized caching
const searchProducts = query(
  async (keyword: string, category?: string) => {
    const params = new URLSearchParams({ q: keyword });
    if (category) params.set("cat", category);
    const res = await fetch(`/api/search?${params}`);
    return res.json() as Promise<Product[]>;
  },
  (keyword, category) => `search:${keyword}:${category ?? "all"}`
);
```

**Deduplication:** If multiple components call the same query with the same arguments while a fetch is already in-flight, the router reuses the pending promise instead of making duplicate requests.

**Static methods on query functions:**

```tsx
// query.get(key) — read from cache without triggering a fetch
const cachedUser = getUser.get("42");

// query.set(key, value) — manually write to the cache
getUser.set("42", { id: "42", name: "Alice", email: "alice@example.com" });

// query.delete(key) — remove a specific entry from cache
getUser.delete("42");

// query.clear() — clear all entries for this query
getUser.clear();
```

### `createAsync()`

`createAsync()` wraps a query call (or any async function) and returns a reactive signal that tracks the loading state. It integrates with Suspense boundaries.

```tsx
import { createAsync } from "@solidjs/router";

function UserProfile() {
  const params = useParams();

  // Basic usage — returns an accessor that resolves to the data
  const user = createAsync(() => getUser(params.id));

  // With initialValue — provides a synchronous fallback while loading
  const userWithDefault = createAsync(() => getUser(params.id), {
    initialValue: { id: "", name: "Loading...", email: "" },
  });

  return (
    <div>
      {/* user() is undefined until resolved, then contains the data */}
      <h1>{user()?.name ?? "Loading..."}</h1>
      <p>{user()?.email}</p>

      {/* With initialValue, userWithDefault() is always defined */}
      <h1>{userWithDefault().name}</h1>
    </div>
  );
}
```

**With `deferStream`:** When using SSR with streaming, `deferStream` controls whether the server should wait for this async operation before sending the HTML for the Suspense boundary, or defer it to the client.

```tsx
// deferStream: false (default) — server waits for this to resolve before streaming
const criticalData = createAsync(() => getCriticalData(), {
  deferStream: false,
});

// deferStream: true — server sends the fallback immediately, data loads on client
const nonCriticalData = createAsync(() => getNonCriticalData(), {
  deferStream: true,
});
```

### `createAsyncStore()`

Like `createAsync()`, but returns a **store** (deeply reactive object) instead of a signal. This enables fine-grained reactivity on nested properties. Uses `reconcile` under the hood for efficient updates.

```tsx
import { createAsyncStore } from "@solidjs/router";

function UserDashboard() {
  const params = useParams();

  // Returns a reactive store — accessing nested properties is fine-grained
  const user = createAsyncStore(() => getUser(params.id));

  // With reconcile options — control how the store is updated
  const settings = createAsyncStore(() => getSettings(params.id), {
    reconcile: {
      key: "id",         // match items by "id" key during reconciliation
      merge: true,       // merge instead of replace for objects
    },
  });

  return (
    <div>
      {/* Only the .name accessor re-runs when name changes */}
      <h1>{user().name}</h1>
      <p>{user().email}</p>

      {/* Nested access is also fine-grained */}
      <For each={settings().notifications}>
        {(notif) => <p>{notif.message}</p>}
      </For>
    </div>
  );
}
```

### `revalidate()`

Manually trigger re-fetching of cached query data. Useful after mutations or when you know server data has changed.

```tsx
import { revalidate } from "@solidjs/router";

const updateUser = action(async (id: string, data: Partial<User>) => {
  await fetch(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
});

function EditUserForm() {
  const params = useParams();

  async function handleSubmit(formData: FormData) {
    await updateUser(params.id, {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    });

    // Revalidate all queries — refetches everything
    revalidate();

    // Revalidate a specific query by cache key
    revalidate("user");

    // Revalidate with keyFor — matches the specific parameterized cache entry
    revalidate(getUser.keyFor(params.id));
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <input name="email" />
      <button type="submit">Save</button>
    </form>
  );
}
```

**`key` vs `keyFor`:**

```tsx
// revalidate("user") — revalidates all entries cached under the "user" key prefix
revalidate("user");

// revalidate(getUser.keyFor("42")) — revalidates only the entry for user "42"
revalidate(getUser.keyFor("42"));

// The keyFor method generates the exact cache key for given arguments
// If query was defined with key "user", then getUser.keyFor("42") might be "user:42"
```

### Preload Functions

Route preload functions run before the component mounts — perfect for fetching critical data early. They receive `RoutePreloadFuncArgs`.

```tsx
import { RoutePreloadFuncArgs } from "@solidjs/router";

const routes = [
  {
    path: "/users/:id",
    preload: async (args: RoutePreloadFuncArgs) => {
      // args.params — path parameters
      console.log(args.params.id);

      // args.location — current location info
      console.log(args.location.pathname);
      console.log(args.location.search);

      // args.intent — why preload was triggered
      // "preload" | "navigate" | "stay"
      // "preload" = hover/focus preloading
      // "navigate" = actual navigation
      // "stay" = same route, params changed
      if (args.intent === "preload") {
        // Maybe skip heavy computation on hover
        return;
      }

      // Preload data — the result is cached and available to the component
      await getUser(args.params.id);
    },
    component: UserProfile,
  },
];
```

**Intent values:**

| Intent | When |
|---|---|
| `"preload"` | User hovered or focused a link (speculative) |
| `"navigate"` | User is actually navigating to this route |
| `"stay"` | Already on this route, but params/search changed |

Using preload with component-based routing:

```tsx
<Route
  path="/products/:slug"
  preload={({ params }) => getProduct(params.slug)}
  component={ProductPage}
/>
```

---

## Actions

### `action()`

Actions are the primary way to handle mutations (form submissions, data updates) in SolidJS Router. They integrate with HTML forms for progressive enhancement.

```tsx
import { action, useAction, useSubmission } from "@solidjs/router";

// Define an action — returns an action function
const createPost = action(async (title: string, body: string) => {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });

  if (!response.ok) {
    throw new Error("Failed to create post");
  }

  return response.json() as Promise<Post>;
}, "createPost"); // optional name for tracking submissions
```

**Action with `name`:** Naming an action lets you track its submissions with `useSubmissions`.

**Action with `onComplete`:** Run a callback when the action completes (success or failure):

```tsx
const deletePost = action(
  async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
  },
  "deletePost",
  {
    onComplete: (result, error) => {
      if (error) {
        console.error("Delete failed:", error);
      } else {
        console.log("Delete succeeded:", result);
        revalidate("posts");
      }
    },
  }
);
```

### `.with()` for Prefilled Arguments

Create a derived action with some arguments pre-filled. Useful for binding an action to specific data:

```tsx
const updatePost = action(async (id: string, title: string, body: string) => {
  await fetch(`/api/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, body }),
  });
}, "updatePost");

// Prefill the first argument (id)
const updatePost42 = updatePost.with("42");

// Now updatePost42 only needs (title, body)
await updatePost42("New Title", "New body");
```

Practical example — binding actions in a list:

```tsx
function PostList() {
  const posts = createAsync(() => getPosts());

  return (
    <For each={posts()}>
      {(post) => {
        // Create a bound action for each post
        const deleteThisPost = deletePost.with(post.id);

        return (
          <div>
            <h2>{post.title}</h2>
            <button onClick={() => deleteThisPost()}>Delete</button>
          </div>
        );
      }}
    </For>
  );
}
```

### `useAction`

Programmatically trigger an action from a component:

```tsx
import { useAction } from "@solidjs/router";

function QuickPostForm() {
  const submitPost = useAction(createPost);

  async function handleQuickSubmit() {
    try {
      const result = await submitPost("Hello World", "This is my post");
      console.log("Created post:", result);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  return <button onClick={handleQuickSubmit}>Quick Post</button>;
}
```

### `useSubmission`

Track the state of a **single** action submission. Useful for showing loading indicators and error messages:

```tsx
import { useSubmission } from "@solidjs/router";

function CreatePostForm() {
  // Track submissions of the createPost action
  const submission = useSubmission(createPost);

  // submission() returns:
  // - undefined when no submission is in progress
  // - { input: [...], pending: true, result?: ..., error?: ... } during/after submission

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    await createPost(fd.get("title") as string, fd.get("body") as string);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" disabled={submission().pending} />
      <textarea name="body" disabled={submission().pending} />
      <button type="submit" disabled={submission().pending}>
        {submission().pending ? "Creating..." : "Create Post"}
      </button>

      <Show when={submission().error}>
        <p class="error">Error: {submission().error.message}</p>
      </Show>

      <Show when={submission().result}>
        <p class="success">Post created!</p>
      </Show>
    </form>
  );
}
```

**Submission properties:**

| Property | Type | Description |
|---|---|---|
| `input` | `any[]` | Arguments passed to the action |
| `pending` | `boolean` | Whether the action is currently running |
| `result` | `any` | The resolved value (after success) |
| `error` | `any` | The thrown error (after failure) |
| `url` | `string` | The URL where the action was submitted |

### `useSubmissions`

Track **multiple** submissions of an action. Useful for lists where each item can be independently acted upon:

```tsx
import { useSubmissions } from "@solidjs/router";

function PostManager() {
  // Get all submissions for the deletePost action
  const submissions = useSubmissions(deletePost);

  // Filter submissions for a specific post
  function isDeleting(id: string) {
    return submissions().some(
      (sub) => sub.pending && sub.input[0] === id
    );
  }

  // Count pending deletions
  const pendingCount = createMemo(
    () => submissions().filter((s) => s.pending).length
  );

  const posts = createAsync(() => getPosts());

  return (
    <div>
      <p>{pendingCount()} deletions in progress</p>
      <For each={posts()}>
        {(post) => (
          <div style={{ opacity: isDeleting(post.id) ? 0.5 : 1 }}>
            <h2>{post.title}</h2>
            <button
              onClick={() => deletePost(post.id)}
              disabled={isDeleting(post.id)}
            >
              {isDeleting(post.id) ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
```

**Filtering submissions by input:**

```tsx
// Get submissions where the first argument matches a specific ID
const deleteSubmissions = useSubmissions(deletePost);
const isDeletingPost42 = createMemo(() =>
  deleteSubmissions().some(
    (sub) => sub.input[0] === "42" && sub.pending
  )
);
```

### Progressive Enhancement with HTML Forms

Actions work with native HTML forms — even if JavaScript fails to load, the form still submits to the server. This is progressive enhancement.

```tsx
// Server action — works with or without JavaScript
const contactForm = action(async (formData: FormData) => {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  await sendEmail({ name, email, message });
  return { success: true };
}, "contactForm");

function ContactPage() {
  const submission = useSubmission(contactForm);

  return (
    <div>
      <Show when={submission().result}>
        <p>Thank you for your message!</p>
      </Show>

      {/* action attribute references the action name */}
      {/* method="post" is required for form submission */}
      <form action={contactForm} method="post">
        <label>
          Name: <input type="text" name="name" required />
        </label>
        <label>
          Email: <input type="email" name="email" required />
        </label>
        <label>
          Message: <textarea name="message" required></textarea>
        </label>
        <button type="submit" disabled={submission().pending}>
          {submission().pending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
```

When JavaScript is available, the router intercepts the form submission and calls the action function client-side. When JavaScript is disabled, the form submits as a regular HTTP POST to the server.

### Single-Flight Mutations

SolidJS Router supports **single-flight mutations** — when an action completes, the router automatically revalidates only the queries that the action's response indicates need updating, rather than refetching everything. This avoids the "waterfall" of refetches common in other frameworks.

```tsx
// The action returns data that the router uses for targeted revalidation
const updateProfile = action(async (formData: FormData) => {
  const response = await fetch("/api/profile", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  // The router can use the returned data directly instead of refetching
  // No separate GET request needed — the mutation response IS the new data
  return result as Profile;
});

function ProfileEditor() {
  const submission = useSubmission(updateProfile);

  // The query data is automatically updated from the action result
  // No manual revalidate() call needed for single-flight mutations
  const profile = createAsync(() => getProfile());

  return (
    <form action={updateProfile} method="post">
      <input name="name" value={profile()?.name ?? ""} />
      <input name="bio" value={profile()?.bio ?? ""} />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

To opt into automatic revalidation after actions, configure the router:

```tsx
<Router explicitLinks={true}>
  {/* routes */}
</Router>
```

---

## Streaming & SSR

### Router `url` Prop for SSR

When rendering on the server, you must tell the router what URL to render by passing the `url` prop:

```tsx
// server.tsx or server entry
import { renderToStringAsync } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

function App() {
  return (
    <Router url={request.url}>
      <Route path="/" component={Home} />
      <Route path="/users/:id" component={UserProfile} />
    </Router>
  );
}

// In your server handler
app.get("*", async (req, res) => {
  const html = await renderToStringAsync(() => <App url={req.url} />);
  res.send(html);
});
```

### Suspense Integration

SolidJS Router integrates deeply with Solid's `<Suspense>` component. When a route component uses `createAsync`, the data loading is tracked by the nearest `<Suspense>` boundary.

```tsx
import { Suspense } from "solid-js";
import { Router, Route, A } from "@solidjs/router";

function AppLayout(props: { children?: JSX.Element }) {
  return (
    <div>
      <nav>
        <A href="/">Home</A>
        <A href="/dashboard">Dashboard</A>
      </nav>
      {/* Suspense shows fallback while async data loads */}
      <Suspense fallback={<div class="spinner">Loading page...</div>}>
        {props.children}
      </Suspense>
    </div>
  );
}

function Dashboard() {
  // This async data fetch is tracked by Suspense
  const stats = createAsync(() => getDashboardStats());
  const recentActivity = createAsync(() => getRecentActivity());

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Both stats and recentActivity must resolve before this renders */}
      <StatsCard data={stats()} />
      <ActivityList items={recentActivity()} />
    </div>
  );
}

render(
  () => (
    <Router root={AppLayout}>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
    </Router>
  ),
  root!
);
```

### Streaming with Resources

For SSR streaming, use `renderToStream` instead of `renderToStringAsync`. The router sends HTML progressively as data resolves:

```tsx
import { renderToStream } from "solid-js/web";

app.get("*", async (req, res) => {
  const stream = renderToStream(() => (
    <Router url={req.url}>
      <Route path="/" component={Home} />
      <Route path="/products/:slug" component={ProductPage} />
    </Router>
  ));

  // Pipe the stream to the response
  stream.pipe(res);
});
```

With streaming, each `<Suspense>` boundary sends its fallback HTML first, then streams the resolved content when data is ready. This gives users a fast initial paint while data loads.

```tsx
function ProductPage() {
  const params = useParams();

  // Critical data — server waits for this (deferStream: false by default)
  const product = createAsync(() => getProduct(params.slug));

  // Non-critical data — deferred to client-side loading
  const reviews = createAsync(() => getReviews(params.slug), {
    deferStream: true,
  });

  return (
    <div>
      {/* Product info renders immediately on server */}
      <h1>{product()?.name}</h1>
      <p>{product()?.description}</p>

      {/* Reviews section — shows Suspense fallback on server, loads on client */}
      <Suspense fallback={<p>Loading reviews...</p>}>
        <ReviewList reviews={reviews()} />
      </Suspense>
    </div>
  );
}
```

---

## Alternative Routers

### HashRouter

`HashRouter` uses the URL hash fragment (`#`) for routing. This means all routes live after `#` in the URL (e.g., `http://example.com/#/dashboard`). It works entirely client-side — no server configuration needed.

```tsx
import { HashRouter, Route } from "@solidjs/router";

function App() {
  return (
    <HashRouter>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users/:id" component={UserProfile} />
    </HashRouter>
  );
}
```

**When to use HashRouter:**
- Static file hosting (GitHub Pages, S3) where you can't configure server-side routing
- Legacy browsers that don't support the History API
- Embedded widgets or iframes where you don't control the host page's server

**URLs look like:** `http://example.com/#/users/42`

### MemoryRouter

`MemoryRouter` keeps routing state in memory — no URL bar changes. Perfect for testing and stories.

```tsx
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";

// Create a memory history with an initial entry
const history = createMemoryHistory();
history.set("/users/42"); // Set initial path

function App() {
  return (
    <MemoryRouter history={history}>
      <Route path="/" component={Home} />
      <Route path="/users/:id" component={UserProfile} />
    </MemoryRouter>
  );
}
```

**Using MemoryRouter in tests:**

```tsx
import { render, screen } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";

test("renders user profile", async () => {
  const history = createMemoryHistory();
  history.set("/users/42");

  render(() => (
    <MemoryRouter history={history}>
      <Route path="/users/:id" component={UserProfile} />
    </MemoryRouter>
  ));

  expect(await screen.findByText("User 42")).toBeInTheDocument();
});

test("navigation works", async () => {
  const history = createMemoryHistory();
  history.set("/");

  render(() => (
    <MemoryRouter history={history}>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
    </MemoryRouter>
  ));

  // Navigate programmatically
  const { useNavigate } = await import("@solidjs/router");
  // ... or test link clicks
});
```

---

## Guards & Interceptors

### `useBeforeLeave`

Navigation guard that runs before the user leaves the current route. You can prevent navigation, show confirmation dialogs, or run cleanup logic.

```tsx
import { useBeforeLeave } from "@solidjs/router";

function EditForm() {
  const [isDirty, setIsDirty] = createSignal(false);

  useBeforeLeave((e) => {
    // e.to — the destination path
    // e.from — the current path
    // e.preventDefault() — block the navigation
    // e.retry(force) — retry the navigation, optionally forcing past the guard

    if (isDirty()) {
      // Prevent navigation and ask for confirmation
      e.preventDefault();

      if (confirm("You have unsaved changes. Leave anyway?")) {
        // Retry with force=true to bypass this guard
        e.retry(true);
      }
    }
  });

  return (
    <form>
      <input onInput={() => setIsDirty(true)} />
      <button type="submit">Save</button>
    </form>
  );
}
```

**Advanced guard with conditional logic:**

```tsx
function ProtectedSection() {
  const [hasUnsavedWork, setHasUnsavedWork] = createSignal(false);
  const [savePromise, setSavePromise] = createSignal<Promise<void> | null>(null);

  useBeforeLeave(async (e) => {
    if (!hasUnsavedWork()) return; // Allow navigation

    e.preventDefault();

    // Auto-save before leaving
    const promise = saveCurrentWork();
    setSavePromise(promise);

    try {
      await promise;
      setHasUnsavedWork(false);
      e.retry(); // Now allow navigation
    } catch (err) {
      if (confirm("Save failed. Discard changes?")) {
        e.retry(true); // Force navigation
      }
    }
  });

  return (
    <div>
      <Show when={savePromise()}>
        <p>Saving before you leave...</p>
      </Show>
      {/* form content */}
    </div>
  );
}
```

### `useIsRouting`

Returns a signal that indicates whether a route transition is in progress. Useful for showing global loading indicators.

```tsx
import { useIsRouting } from "@solidjs/router";

function AppLayout(props: { children?: JSX.Element }) {
  const isRouting = useIsRouting();

  return (
    <div>
      {/* Show a loading bar during navigation */}
      <div
        class="loading-bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "3px",
          background: "#4a90d9",
          transition: "width 0.3s",
          width: isRouting() ? "80%" : "0%",
          opacity: isRouting() ? 1 : 0,
        }}
      />
      {props.children}
    </div>
  );
}
```

**With Suspense for a smoother experience:**

```tsx
function AppLayout(props: { children?: JSX.Element }) {
  const isRouting = useIsRouting();

  return (
    <div class={isRouting() ? "route-transitioning" : ""}>
      <Suspense fallback={<LoadingSpinner />}>
        {props.children}
      </Suspense>
    </div>
  );
}
```

### `useCurrentMatches`

Access all currently matched route objects. Each match contains the route definition, resolved path, and parameters.

```tsx
import { useCurrentMatches } from "@solidjs/router";

function RouteDebugger() {
  const matches = useCurrentMatches();

  createEffect(() => {
    console.log("Current matches:");
    for (const match of matches()) {
      console.log("  Path:", match.path);
      console.log("  Route:", match.route.path);
      console.log("  Params:", match.params);
      console.log("  Info:", match.route.info);
    }
  });

  return null;
}
```

**Practical use — building a breadcrumb trail from route hierarchy:**

```tsx
function Breadcrumbs() {
  const matches = useCurrentMatches();

  const crumbs = createMemo(() =>
    matches()
      .map((match) => ({
        path: match.path,
        label: match.route.info?.breadcrumb ?? match.route.path,
        icon: match.route.info?.icon,
      }))
      .filter((crumb) => crumb.label !== "/")
  );

  return (
    <ol class="breadcrumb">
      <For each={crumbs()}>
        {(crumb, i) => (
          <li>
            <Show when={crumb.icon}>
              <span class="icon">{crumb.icon}</span>
            </Show>
            <Show
              when={i() < crumbs().length - 1}
              fallback={<span>{crumb.label}</span>}
            >
              <A href={crumb.path}>{crumb.label}</A>
            </Show>
          </li>
        )}
      </For>
    </ol>
  );
}
```

---

## Preloading

### Hover Preloading (~20ms Delay)

By default, SolidJS Router preloads route data when the user hovers over an `<A>` link. There's a built-in ~20ms delay to avoid unnecessary fetches from accidental hovers.

```tsx
// This works automatically — no configuration needed
<A href="/products/laptop">View Laptop</A>

// When the user hovers over this link for ~20ms,
// the router calls the route's preload function
```

The preload function is defined on the route:

```tsx
<Route
  path="/products/:slug"
  preload={async ({ params }) => {
    // This runs on hover (after 20ms delay) and on actual navigation
    await getProduct(params.slug);
  }}
  component={ProductPage}
/>
```

### Focus Preloading (Immediate)

When a link receives focus (via keyboard Tab or programmatic focus), preloading happens **immediately** without the 20ms delay. This ensures keyboard users get the same performance benefits.

```tsx
// Focus preloading is automatic for all <A> components
// No special configuration needed
<A href="/products/laptop">View Laptop</A>

// When this link receives focus (Tab key), preload fires immediately
```

### `usePreloadRoute`

Imperatively preload a route — useful for custom interactions or predictive preloading.

```tsx
import { usePreloadRoute } from "@solidjs/router";

function SmartPreloader() {
  const preloadRoute = usePreloadRoute();

  // Preload on custom event (e.g., mouse enters a custom component)
  function handleMouseEnter() {
    preloadRoute("/products/laptop");
  }

  // Preload likely next routes based on user behavior
  function preloadLikelyRoutes() {
    const likelyRoutes = ["/dashboard", "/notifications", "/messages"];
    for (const route of likelyRoutes) {
      preloadRoute(route);
    }
  }

  return (
    <div onMouseEnter={handleMouseEnter}>
      Hover to preload product page
    </div>
  );
}
```

**Predictive preloading example:**

```tsx
function SearchResults() {
  const preloadRoute = usePreloadRoute();
  const results = createAsync(() => searchProducts(keyword()));

  return (
    <For each={results()}>
      {(product) => (
        <div
          onMouseEnter={() => preloadRoute(`/products/${product.slug}`)}
          onFocus={() => preloadRoute(`/products/${product.slug}`)}
        >
          <A href={`/products/${product.slug}`}>
            {product.name}
          </A>
        </div>
      )}
    </For>
  );
}
```

---

## Lazy Loading

### `lazy()` for Code Splitting

Use Solid's `lazy()` function to code-split route components. Each lazy component is loaded only when its route is first matched.

```tsx
import { lazy } from "solid-js";
import { Router, Route } from "@solidjs/router";

// These components are loaded on demand
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/users/:id" component={UserProfile} />
      <Route path="/settings" component={Settings} />
      <Route path="/*" component={NotFound} />
    </Router>
  );
}
```

Lazy components work seamlessly with `<Suspense>` — the fallback is shown while the component chunk loads:

```tsx
function AppLayout(props: { children?: JSX.Element }) {
  return (
    <div>
      <nav>{/* ... */}</nav>
      <Suspense fallback={<PageSkeleton />}>
        {props.children}
      </Suspense>
    </div>
  );
}
```

### `.preload()` Method

Every `lazy()` component has a `.preload()` method that triggers the chunk download without rendering the component. Use this for predictive loading.

```tsx
import { lazy } from "solid-js";

const AdminPanel = lazy(() => import("./pages/AdminPanel"));

function App() {
  const navigate = useNavigate();

  function goToAdmin() {
    // Preload the admin panel chunk, then navigate
    AdminPanel.preload();
    navigate("/admin");
  }

  return <button onClick={goToAdmin}>Go to Admin</button>;
}
```

**Preloading on login — load likely routes after authentication:**

```tsx
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Notifications = lazy(() => import("./pages/Notifications"));

async function handleLogin(credentials: Credentials) {
  const result = await login(credentials);
  if (result.success) {
    // Preload routes the user will likely visit
    Dashboard.preload();
    Notifications.preload();
    navigate("/dashboard");
  }
}
```

**Combining lazy preload with route preload:**

```tsx
const HeavyReport = lazy(() => import("./pages/HeavyReport"));

const routes = [
  {
    path: "/reports",
    preload: () => {
      // Preload the component chunk AND the data
      HeavyReport.preload();
    },
    component: HeavyReport,
  },
];
```

---

## Migration from v0.9.x

SolidJS Router v1.x introduced significant API changes. Here's what changed and how to migrate.

### Removed APIs

| Removed API | Replacement |
|---|---|
| `<Outlet />` | `{props.children}` in route components |
| `<Routes>` | `<Router>` (Routes is no longer needed as a separate wrapper) |
| `useRoutes()` | `<Router routes={...} />` or component-based `<Route>` children |
| `route.data` | `route.preload` function |

### `element` → `component` Prop

Route definitions previously used `element` (a JSX element). Now use `component` (a component function).

**Before (v0.9.x):**

```tsx
<Route path="/about" element={<About />} />
```

**After (v1.x):**

```tsx
<Route path="/about" component={About} />
```

The `component` prop receives the route's children as `props.children`, enabling nested layout patterns without `<Outlet>`.

### Data Functions → Preload Mechanism

Route data functions have been replaced by the `preload` function and `query`/`createAsync` system.

**Before (v0.9.x):**

```tsx
// Route data function
const routes = [
  {
    path: "/users/:id",
    data: async ({ params }) => {
      const user = await fetchUser(params.id);
      return user;
    },
    element: <UserProfile />,
  },
];

// Accessing data in component
function UserProfile() {
  const data = useRouteData(); // returns the data function result
  return <h1>{data().name}</h1>;
}
```

**After (v1.x):**

```tsx
import { query, createAsync } from "@solidjs/router";

// Define a query
const getUser = query(async (id: string) => {
  const user = await fetchUser(id);
  return user;
}, "user");

// Route with preload
const routes = [
  {
    path: "/users/:id",
    preload: ({ params }) => getUser(params.id),
    component: UserProfile,
  },
];

// Accessing data in component
function UserProfile() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));
  return <h1>{user()?.name}</h1>;
}
```

### Outlet → props.children

**Before (v0.9.x):**

```tsx
import { Outlet } from "@solidjs/router";

function Layout() {
  return (
    <div>
      <nav>...</nav>
      <Outlet />
    </div>
  );
}
```

**After (v1.x):**

```tsx
function Layout(props: { children?: JSX.Element }) {
  return (
    <div>
      <nav>...</nav>
      {props.children}
    </div>
  );
}
```

### Routes → Router

**Before (v0.9.x):**

```tsx
<Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</Router>
```

**After (v1.x):**

```tsx
<Router>
  <Route path="/" component={Home} />
  <Route path="/about" component={About} />
</Router>
```

### useRoutes → Router routes prop

**Before (v0.9.x):**

```tsx
const routeDefs = [...];
function App() {
  return useRoutes(routeDefs);
}
```

**After (v1.x):**

```tsx
const routeDefs = [...];
function App() {
  return <Router routes={routeDefs} />;
}
```

### Complete Migration Example

**Before (v0.9.x):**

```tsx
import { Router, Routes, Route, Outlet, useRouteData, useNavigate } from "solid-app-router";

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/users/:id",
        data: async ({ params }) => {
          return await fetchUser(params.id);
        },
        element: <UserProfile />,
      },
    ],
  },
];

function Layout() {
  return (
    <div>
      <nav><A href="/">Home</A></nav>
      <Outlet />
    </div>
  );
}

function UserProfile() {
  const data = useRouteData();
  return <h1>{data().name}</h1>;
}

function App() {
  return (
    <Router>
      <Routes>{useRoutes(routes)}</Routes>
    </Router>
  );
}
```

**After (v1.x):**

```tsx
import { Router, Route, A, query, createAsync, useParams } from "@solidjs/router";

const getUser = query(async (id: string) => {
  return await fetchUser(id);
}, "user");

const routes = [
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/",
        component: Home,
      },
      {
        path: "/users/:id",
        preload: ({ params }) => getUser(params.id),
        component: UserProfile,
      },
    ],
  },
];

function Layout(props: { children?: JSX.Element }) {
  return (
    <div>
      <nav><A href="/">Home</A></nav>
      {props.children}
    </div>
  );
}

function UserProfile() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));
  return <h1>{user()?.name}</h1>;
}

function App() {
  return <Router routes={routes} />;
}
```

---

## Quick Reference

### Imports Cheat Sheet

```tsx
// Core
import { Router, Route, A, Navigate } from "@solidjs/router";

// Alternative routers
import { HashRouter, MemoryRouter, createMemoryHistory } from "@solidjs/router";

// Primitives
import {
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
  useMatch,
  useResolvedPath,
  useBeforeLeave,
  useIsRouting,
  useCurrentMatches,
  usePreloadRoute,
} from "@solidjs/router";

// Data fetching
import { query, createAsync, createAsyncStore, revalidate } from "@solidjs/router";

// Actions
import { action, useAction, useSubmission, useSubmissions } from "@solidjs/router";

// Utilities
import { redirect, MatchFilters } from "@solidjs/router";
```

### Route Definition Patterns

```tsx
// Static route
<Route path="/about" component={About} />

// Parameterized route
<Route path="/users/:id" component={User} />

// Optional parameter
<Route path="/docs/:section?" component={Docs} />

// Wildcard
<Route path="/files/*" component={Files} />
<Route path="/files/*rest" component={Files} />

// Multiple paths
<Route path={["/blog", "/articles"]} component={Blog} />

// With validation
<Route path="/users/:id" matchFilters={{ id: /^\d+$/ }} component={User} />

// With metadata
<Route path="/admin" component={Admin} info={{ requiresAuth: true, title: "Admin" }} />

// With preload
<Route path="/products/:slug" preload={({ params }) => getProduct(params.slug)} component={Product} />

// Nested with layout
<Route path="/dashboard" component={DashboardLayout}>
  <Route path="/" component={DashboardHome} />
  <Route path="/analytics" component={Analytics} />
</Route>

// Lazy loaded
<Route path="/heavy" component={lazy(() => import("./HeavyPage"))} />
```
