# SolidStart Reference

## Overview & Setup

### What is SolidStart

SolidStart is a full-stack meta-framework built on top of **SolidJS** and powered by **Vinxi** (a build tool based on Vite). It provides file-based routing, server functions, API routes, SSR, and deployment adapters out of the box. SolidStart embraces Solid's fine-grained reactivity model — no virtual DOM, no diffing — and extends it to the server with `"use server"` directives and server-side data loading.

**Key characteristics:**
- Fine-grained reactivity (Signals, Memos, Effects) — no virtual DOM overhead
- True SSR with streaming support (sync, async, stream rendering modes)
- Server functions with `"use server"` for type-safe client↔server communication
- File-based routing with nested layouts
- Built on Vinxi/Vite for fast dev experience
- Deployable to Node, Netlify Edge, Vercel, Cloudflare, Bun, Deno

### Project Creation

```bash
# Interactive scaffold (choose TypeScript, SSR mode, etc.)
npm create solid@latest my-app

# Or with npx
npx solid-start@latest my-app
```

The CLI prompts for:
- **TypeScript or JavaScript**
- **SSR or SPA mode**

Then install and run:

```bash
cd my-app
npm install
npm run dev        # dev server (default http://localhost:3000)
npm run build      # production build
npm start          # serve production build
```

### Project Structure

```
my-app/
├── public/                  # Static assets served as-is
│   └── favicon.ico
├── src/
│   ├── entry-client.tsx     # Client-side entry point
│   ├── entry-server.tsx     # Server-side entry point
│   ├── app.tsx              # Root app component (providers, error boundaries)
│   ├── app.module.css       # Global styles
│   └── routes/              # File-based routing directory
│       ├── index.tsx        # → /
│       ├── about.tsx        # → /about
│       └── users/
│           ├── index.tsx    # → /users
│           └── [id].tsx     # → /users/:id
├── vite.config.ts           # SolidStart + Vite configuration
├── package.json
└── tsconfig.json
```

---

## File-Based Routing

SolidStart uses file-system-based routing. Every file in `src/routes/` becomes a route. The framework generates a route manifest at build time.

### All File Patterns

| Pattern | File | URL Match | Description |
|---|---|---|---|
| **Static** | `about.tsx` | `/about` | Exact path match |
| **Index** | `index.tsx` | `/` | Matches the directory root |
| **Dynamic** | `[id].tsx` | `/users/42` | Single dynamic segment, available as `params.id` |
| **Optional** | `[[id]].tsx` | `/users` or `/users/42` | Segment is optional (present or absent) |
| **Catch-all** | `[...slug].tsx` | `/docs/a/b/c` | Matches remaining segments as `params.slug` (array) |
| **Group** | `(marketing)/about.tsx` | `/about` | Parenthesized folder is for organization only — doesn't add to URL path |
| **Named layout** | `dashboard/(layout).tsx` | — | Shared layout for sibling routes |

**Example: All patterns in one tree**

```
src/routes/
├── index.tsx                     # → /
├── about.tsx                     # → /about
├── (marketing)/                  # URL group — invisible in path
│   ├── pricing.tsx               # → /pricing
│   └── contact.tsx               # → /contact
├── users/
│   ├── index.tsx                 # → /users
│   ├── [id].tsx                  # → /users/:id        (dynamic)
│   └── [[optional]].tsx          # → /users or /users/x (optional)
├── docs/
│   └── [...slug].tsx             # → /docs/*            (catch-all)
└── dashboard/
    ├── (layout).tsx              # layout wrapper for dashboard/*
    ├── index.tsx                 # → /dashboard
    └── settings.tsx              # → /dashboard/settings
```

### Dynamic Route Example

```tsx
// src/routes/users/[id].tsx
import { useParams } from "@solidjs/router";
import { createAsync } from "@solidjs/start";
import { getUser } from "~/server/api";

export default function UserProfile() {
  const params = useParams();               // reactive: params.id
  const user = createAsync(() => getUser(params.id));

  return (
    <div>
      <h1>User {params.id}</h1>
      <p>{user()?.name}</p>
    </div>
  );
}
```

### Catch-All Route Example

```tsx
// src/routes/docs/[...slug].tsx
import { useParams } from "@solidjs/router";

export default function DocsPage() {
  const params = useParams(); // params.slug is string[]

  return (
    <div>
      <h1>Docs: {params.slug?.join(" / ")}</h1>
    </div>
  );
}
```

### Optional Segment Example

```tsx
// src/routes/users/[[optional]].tsx
import { useParams } from "@solidjs/router";

export default function UsersOrUser() {
  const params = useParams(); // params.optional may be undefined

  return (
    <div>
      {params.optional
        ? <h1>User {params.optional}</h1>
        : <h1>All Users</h1>}
    </div>
  );
}
```

### Layouts via props.children

Layouts are created by having a component that renders `props.children`. Place it as a sibling file to the routes it should wrap.

```tsx
// src/routes/users.tsx — layout for /users/*
import { Outlet } from "@solidjs/router";

export default function UsersLayout(props: { children: JSX.Element }) {
  return (
    <div class="users-shell">
      <nav>
        <a href="/users">List</a>
        <a href="/users/1">User 1</a>
      </nav>
      <main>{props.children}</main>
    </div>
  );
}
```

Alternatively, use `<Outlet />` (both patterns work):

```tsx
import { Outlet } from "@solidjs/router";

export default function UsersLayout() {
  return (
    <div class="users-shell">
      <nav>…</nav>
      <main><Outlet /></main>
    </div>
  );
}
```

### FileRoutes Component

Under the hood, SolidStart generates a `<FileRoutes>` component that maps the file system to route config. It is used in `app.tsx`:

```tsx
// src/app.tsx
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

export default function App() {
  return (
    <Router root={props => <>{props.children}</>}>
      <FileRoutes />
    </Router>
  );
}
```

You normally don't edit `FileRoutes` — it is auto-generated. But you can mix it with manual `<Route>` declarations if needed.

### Route Preloading with `route` Export

Use the `route` export on any route module to configure preloading:

```tsx
// src/routes/users/[id].tsx
import { preloadUserData } from "~/server/api";

export const route = {
  preload: ({ params }) => {
    // Runs on the server before rendering; triggers data fetch early
    preloadUserData(params.id);
  },
};

export default function UserProfile() {
  // data is already in flight or cached
  return <div>…</div>;
}
```

`preload` receives a context object with:
- `params` — route params
- `location` — current URL info
- `intent` — `"preload"` or `"navigate"`

---

## API Routes

API routes live in `src/routes/` and export named functions matching HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.

### GET/POST/PATCH/DELETE Exports

```tsx
// src/routes/api/todos.tsx
import { json } from "@solidjs/router";

// GET /api/todos
export async function GET(event: APIEvent) {
  const todos = await db.todos.findMany();
  return json(todos);
}

// POST /api/todos
export async function POST(event: APIEvent) {
  const body = await event.request.json();
  const todo = await db.todos.create({ data: body });
  return json(todo, { status: 201 });
}

// PATCH /api/todos/:id — use a dynamic route file
// src/routes/api/todos/[id].tsx
export async function PATCH(event: APIEvent) {
  const id = event.params.id;
  const body = await event.request.json();
  const updated = await db.todos.update({ where: { id }, data: body });
  return json(updated);
}

// DELETE /api/todos/:id
export async function DELETE(event: APIEvent) {
  const id = event.params.id;
  await db.todos.delete({ where: { id } });
  return json({ success: true });
}
```

### APIEvent Type

```ts
import type { APIEvent } from "@solidjs/start";

// APIEvent extends H3Event (from Vinxi's underlying H3 framework)
type APIEvent = {
  request: Request;        // Standard Web Request object
  params: Record<string, string>;  // Dynamic route params
  fetch: typeof globalThis.fetch;  // Server-side fetch (resolves internal routes)
  // ... inherited from H3Event
};
```

**Using `event.fetch` for internal requests:**

```tsx
export async function GET(event: APIEvent) {
  // Call another API route on the same server without a network hop
  const res = await event.fetch("/api/internal/stats");
  const stats = await res.json();
  return json(stats);
}
```

### GraphQL Example

```tsx
// src/routes/api/graphql.tsx
import { createSchema, createYoga } from "graphql-yoga";
import { json } from "@solidjs/router";

const typeDefs = `
  type Query {
    hello: String!
    user(id: ID!): User
  }
  type User {
    id: ID!
    name: String!
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello from SolidStart!",
    user: (_: any, { id }: { id: string }) => ({ id, name: `User ${id}` }),
  },
};

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  fetchAPI: { Request, Response },
});

export async function GET(event: APIEvent) {
  return yoga.handleRequest(event.request, { params: event.params });
}

export async function POST(event: APIEvent) {
  return yoga.handleRequest(event.request, { params: event.params });
}
```

### tRPC Integration Example

```tsx
// src/server/trpc.ts
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const appRouter = t.router({
  greeting: t.procedure.query(() => "Hello from tRPC!"),
  user: t.procedure.input<{ id: string }>().query(({ input }) => ({
    id: input.id,
    name: `User ${input.id}`,
  })),
  addTodo: t.procedure.input<{ title: string }>().mutation(({ input }) => {
    return { id: crypto.randomUUID(), title: input.title, done: false };
  }),
});

export type AppRouter = typeof appRouter;
```

```tsx
// src/routes/api/trpc/[...slug].tsx
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/trpc";

const handler = (event: APIEvent) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: event.request,
    router: appRouter,
    createContext: () => ({}),
  });

export const GET = handler;
export const POST = handler;
```

```tsx
// src/client side — using tRPC client
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "~/server/trpc";

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({ url: "/api/trpc" }),
  ],
});

// In a component or server function
async function demo() {
  const greeting = await trpc.greeting.query();
  const user = await trpc.user.query({ id: "42" });
  const newTodo = await trpc.addTodo.mutate({ title: "Learn SolidStart" });
}
```

---

## Server Functions

Server functions run exclusively on the server. They are the primary way to bridge client and server code in SolidStart.

### "use server" Directive

#### Inline Server Function

Place `"use server"` at the top of a function body. The function can be called from client code — SolidStart handles the RPC call automatically.

```tsx
// src/server/api.ts (shared file, imported by both client and server)
"use server";
// ↑ File-level directive: every exported function in this file is a server function

export async function getTodos() {
  return db.todos.findMany();
}

export async function addTodo(title: string) {
  return db.todos.create({ data: { title, done: false } });
}
```

**Inline (per-function) directive:**

```tsx
// src/lib/mixed.ts — contains both server and client code
import { db } from "~/server/db";

export async function getSecretData() {
  "use server"; // ← only this function is a server function
  return db.secrets.findAll();
}

export function formatDisplay(data: any) {
  // This runs on the client — NOT a server function
  return data.map((d: any) => d.name.toUpperCase());
}
```

### getServerFunctionMeta()

Retrieve metadata about the current server function invocation:

```tsx
import { getServerFunctionMeta } from "@solidjs/start/server";

export async function getCurrentUser() {
  "use server";
  const meta = getServerFunctionMeta();
  // meta contains: { env, request } — access to the raw request context
  const request = meta?.request;
  const authHeader = request?.headers.get("Authorization");

  if (!authHeader) throw new Error("Unauthorized");

  const user = await verifyToken(authHeader);
  return user;
}
```

### Serialization: json vs js Mode

SolidStart supports two serialization modes for server function arguments and return values:

| Mode | Config | Behavior |
|---|---|---|
| **json** (default) | `serialization: "json"` | Standard `JSON.stringify`/`JSON.parse`. Only JSON-compatible types. |
| **js** | `serialization: "js"` | Uses structured clone / richer serialization. Supports more types. |

```ts
// vite.config.ts
import solid from "vite-plugin-solid";
import solidStart from "@solidjs/start/vite";

export default defineConfig({
  plugins: [solid(), solidStart({ serialization: "js" })],
});
```

### Supported Types for Serialization

**json mode** (default):
- `string`, `number`, `boolean`, `null`
- Plain objects (`{}`), Arrays
- No: `Date`, `Map`, `Set`, `BigInt`, `undefined`, `Error`, functions

**js mode** (richer):
- All JSON types plus:
- `Date` (preserved as Date objects)
- `Map`, `Set`
- `BigInt`
- `undefined` (preserved)
- `Error` (basic properties)
- Typed arrays (`Uint8Array`, etc.)

```tsx
// With js serialization mode, you can pass/return richer types:
export async function getChartData() {
  "use server";
  return {
    timestamps: [new Date("2024-01-01"), new Date("2024-06-01")], // Date objects
    metadata: new Map([["source", "analytics"]]),                  // Map
    flags: new Set(["verified", "premium"]),                       // Set
  };
}
```

---

## Data Fetching & Mutation

### query() + createAsync() Pattern

`query()` wraps a server function for caching and deduplication. `createAsync()` creates a reactive resource from a query.

```tsx
// src/server/api.ts
"use server";
import { query } from "@solidjs/router";
import { db } from "~/server/db";

// query() makes this cacheable and deduped
export const getUser = query(async (id: string) => {
  return db.user.findUnique({ where: { id } });
}, "getUser");
```

```tsx
// src/routes/users/[id].tsx
import { createAsync } from "@solidjs/start";
import { getUser } from "~/server/api";
import { useParams } from "@solidjs/router";

export default function UserProfile() {
  const params = useParams();
  // createAsync: reactive — re-fetches when params.id changes
  const user = createAsync(() => getUser(params.id));

  return (
    <div>
      <h1>{user()?.name ?? "Loading…"}</h1>
      <p>Email: {user()?.email}</p>
    </div>
  );
}
```

**Multiple queries in a single component:**

```tsx
export default function Dashboard() {
  const params = useParams();
  const user = createAsync(() => getUser(params.id));
  const posts = createAsync(() => getPosts(params.id));

  return (
    <div>
      <h1>{user()?.name}</h1>
      <ul>{posts()?.map(p => <li key={p.id}>{p.title}</li>)}</ul>
    </div>
  );
}
```

### action() + form Pattern

`action()` creates a server function that handles form submissions with built-in progress tracking.

```tsx
// src/server/actions.ts
"use server";
import { action } from "@solidjs/router";
import { db } from "~/server/db";

export const createTodo = action(async (formData: FormData) => {
  const title = formData.get("title") as string;
  if (!title || title.length < 3) {
    throw new Error("Title must be at least 3 characters");
  }
  const todo = await db.todo.create({ data: { title, done: false } });
  return todo;
}, "createTodo");
```

```tsx
// src/routes/todos.tsx
import { createAsync } from "@solidjs/start";
import { action, useAction, useSubmission } from "@solidjs/router";
import { createTodo, getTodos } from "~/server/actions";

export default function Todos() {
  const todos = createAsync(() => getTodos());
  const submission = useSubmission(createTodo);
  const submitAction = useAction(createTodo);

  return (
    <div>
      <form action={createTodo} method="post">
        <input name="title" placeholder="New todo" />
        <button type="submit" disabled={submission.pending}>
          {submission.pending ? "Adding…" : "Add"}
        </button>
      </form>

      {/* Submission error display */}
      {submission.error && (
        <p class="error">{submission.error.message}</p>
      )}

      {/* Submission result */}
      {submission.result && (
        <p class="success">Created: {submission.result.title}</p>
      )}

      <ul>
        {todos()?.map(t => <li key={t.id}>{t.title}</li>)}
      </ul>
    </div>
  );
}
```

### useAction, useSubmission, useSubmissions

```tsx
import { useAction, useSubmission, useSubmissions } from "@solidjs/router";

// useAction — programmatically invoke an action
const submitAction = useAction(createTodo);

// Call with FormData or individual args depending on action signature
async function handleSubmit(e: SubmitEvent) {
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const result = await submitAction(fd);
  console.log("Created:", result);
}

// useSubmission — tracks the LATEST submission of a specific action
const submission = useSubmission(createTodo);
// submission.pending: boolean
// submission.error: Error | undefined
// submission.result: T | undefined
// submission.input: FormData | undefined (the submitted input)

// useSubmissions — tracks ALL submissions (useful for lists with multiple items)
const submissions = useSubmissions(deleteTodo);
// submissions() is an array of Submission objects
// Useful for showing per-item loading states:
```

**Per-item submission tracking example:**

```tsx
export default function TodoList() {
  const todos = createAsync(() => getTodos());
  const deleteSubmissions = useSubmissions(deleteTodo);

  return (
    <ul>
      {todos()?.map(todo => {
        const isDeleting = deleteSubmissions.some(
          s => s.pending && (s.input as FormData).get("id") === todo.id
        );
        return (
          <li>
            {todo.title}
            <form action={deleteTodo} method="post">
              <input type="hidden" name="id" value={todo.id} />
              <button type="submit" disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
```

### deferStream for Header Changes

When you need to set response headers based on server function results (e.g., redirect after auth), use `deferStream` to delay the stream until headers are finalized:

```tsx
import { action } from "@solidjs/router";
import { redirect } from "@solidjs/router";

export const login = action(async (formData: FormData) => {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await authenticate(email, password);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Set session cookie — needs deferStream so headers are sent
  throw redirect("/dashboard", {
    headers: {
      "Set-Cookie": await getSessionCookie(user.id),
    },
  });
}, "login");
```

```tsx
// In the consuming component, wrap createAsync with deferStream
import { createAsync, deferStream } from "@solidjs/start";

export default function LoginPage() {
  // deferStream ensures headers from redirects/cookie-setting are applied
  // before the stream begins
  return (
    <form action={login} method="post">
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Log In</button>
    </form>
  );
}
```

### Optimistic UI Pattern

Show anticipated results before the server responds, then reconcile:

```tsx
import { createAsync } from "@solidjs/start";
import { action, useAction, useSubmission, reconcile } from "@solidjs/router";

export const toggleTodo = action(async (id: string, done: boolean) => {
  "use server";
  const updated = await db.todo.update({ where: { id }, data: { done } });
  return updated;
}, "toggleTodo");

export default function TodoList() {
  const todos = createAsync(() => getTodos());
  const submission = useSubmission(toggleTodo);
  const submit = useAction(toggleTodo);

  function handleToggle(id: string, currentDone: boolean) {
    // Optimistic: update local signal immediately
    submit(id, !currentDone);
  }

  return (
    <ul>
      {todos()?.map(todo => {
        // If there's a pending submission for this todo, show optimistic value
        const isPending = submission.pending &&
          submission.input?.[0] === todo.id;
        const displayDone = isPending ? !todo.done : todo.done;

        return (
          <li>
            <input
              type="checkbox"
              checked={displayDone}
              onChange={() => handleToggle(todo.id, todo.done)}
              disabled={isPending}
            />
            <span style={{ "text-decoration": displayDone ? "line-through" : "none" }}>
              {todo.title}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
```

---

## Middleware

Middleware runs on every request, allowing you to inspect/modify requests and responses.

### createMiddleware: onRequest, onBeforeResponse

```tsx
// src/middleware.ts (or src/server/middleware.ts)
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  // Runs BEFORE the route handler
  onRequest: [
    async (event) => {
      const start = Date.now();
      event.locals.startTime = start;
      console.log(`→ ${event.request.method} ${new URL(event.request.url).pathname}`);
    },
  ],

  // Runs AFTER the route handler, BEFORE the response is sent
  onBeforeResponse: [
    async (event) => {
      const duration = Date.now() - event.locals.startTime;
      console.log(
        `← ${event.request.method} ${new URL(event.request.url).pathname} ` +
        `${event.response.status} (${duration}ms)`
      );
      // Modify response headers
      event.response.headers.set("X-Response-Time", `${duration}ms`);
    },
  ],
});
```

### event.locals for Request-Scoped Data

`event.locals` is an object that persists for the lifetime of a single request. Use it to pass data between middleware and route handlers.

```tsx
// src/middleware.ts
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onRequest: [
    async (event) => {
      // Parse auth token and attach user to locals
      const token = event.request.headers.get("Authorization")?.replace("Bearer ", "");

      if (token) {
        try {
          const user = await verifyJWT(token);
          event.locals.user = user; // Available in all downstream handlers
        } catch {
          event.locals.user = null;
        }
      } else {
        event.locals.user = null;
      }
    },
  ],
});
```

**Accessing locals in a server function:**

```tsx
import { getServerFunctionMeta } from "@solidjs/start/server";

export async function getProfile() {
  "use server";
  const meta = getServerFunctionMeta();
  // Access request context via meta
  // For API routes, locals are on the event directly
  return { /* ... */ };
}
```

**Accessing locals in an API route:**

```tsx
export async function GET(event: APIEvent) {
  const user = event.locals.user;
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  return json({ name: user.name, email: user.email });
}
```

### Chaining Middleware

Multiple middleware functions are composed in order:

```tsx
import { createMiddleware } from "@solidjs/start/middleware";

const loggingMiddleware = createMiddleware({
  onRequest: [async (event) => {
    console.log(`Request: ${event.request.method} ${event.request.url}`);
  }],
});

const authMiddleware = createMiddleware({
  onRequest: [async (event) => {
    const token = event.request.headers.get("Authorization");
    if (!token) {
      // Throw to short-circuit the chain
      throw new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    event.locals.token = token;
  }],
});

const corsMiddleware = createMiddleware({
  onBeforeResponse: [async (event) => {
    event.response.headers.set("Access-Control-Allow-Origin", "*");
  }],
});

// Combine in src/middleware.ts
export default createMiddleware({
  onRequest: [
    ...loggingMiddleware.onRequest ?? [],
    ...authMiddleware.onRequest ?? [],
  ],
  onBeforeResponse: [
    ...corsMiddleware.onBeforeResponse ?? [],
  ],
});
```

### Limitations

**Middleware does NOT run on client-side navigations.** When a user clicks a `<Link>` to navigate between pages, only server functions and queries are called — middleware is skipped because there's no full HTTP request. Middleware runs only on:
- Initial page load (full document request)
- API route calls
- Hard refreshes
- Direct URL access

For auth/validation on client navigations, use server functions instead.

---

## Sessions

### useSession from vinxi/http

SolidStart uses `useSession` from `vinxi/http` for cookie-based sessions:

```tsx
// src/server/session.ts
import { useSession } from "vinxi/http";

interface SessionData {
  userId?: string;
  role?: string;
}

export async function getSession() {
  return useSession<SessionData>({
    password: process.env.SESSION_SECRET!, // ≥32 characters required
    name: "ss",          // Cookie name prefix (optional, default "ss")
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    },
  });
}
```

**Reading and writing session data:**

```tsx
// src/server/auth.ts
"use server";
import { getSession } from "~/server/session";

export async function login(email: string, password: string) {
  const user = await authenticateUser(email, password);
  if (!user) throw new Error("Invalid credentials");

  const session = await getSession();
  await session.update({ userId: user.id, role: user.role });

  return { success: true };
}

export async function logout() {
  const session = await getSession();
  await session.update({ userId: undefined, role: undefined });
  return { success: true };
}

export async function currentUser() {
  const session = await getSession();
  if (!session.data.userId) return null;
  return db.user.findUnique({ where: { id: session.data.userId } });
}
```

### Password Requirements (≥32 chars)

The session `password` is used to encrypt the session cookie. It **must** be at least 32 characters long:

```ts
// ❌ Too short — will throw an error
useSession({ password: "my-secret" });

// ✅ 32+ characters
useSession({
  password: "this-is-exactly-thirty-two-chars!!"
});

// ✅ Use a strong environment variable
useSession({
  password: process.env.SESSION_SECRET! // e.g., "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
});
```

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → 64 hex characters (256 bits)
```

### Database Sessions Pattern

For large session data or when you need to revoke sessions, store sessions in a database:

```tsx
// src/server/db-session.ts
import { db } from "~/server/db";
import { cookies } from "vinxi/http";

const SESSION_COOKIE = "session_id";

export async function createSession(userId: string) {
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { id, userId, expiresAt: expires },
  });

  // Set cookie
  const cookie = cookies();
  cookie.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires,
    path: "/",
  });

  return id;
}

export async function getSessionUser() {
  const cookie = cookies();
  const sessionId = cookie.get(SESSION_COOKIE);
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}

export async function destroySession() {
  const cookie = cookies();
  const sessionId = cookie.get(SESSION_COOKIE);
  if (sessionId) {
    await db.session.delete({ where: { id: sessionId } });
  }
  cookie.delete(SESSION_COOKIE);
}
```

---

## SSR Entry Points

### entry-server.tsx: createHandler, StartServer

```tsx
// src/entry-server.tsx
// @refresh reload
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
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

- **`createHandler`** — wraps the server rendering logic; accepts a component function
- **`StartServer`** — the root server component; provides the `document` prop for customizing the HTML shell
- **`document` prop** — receives `{ assets, children, scripts }`:
  - `assets` — injected `<link>`, `<style>` tags from Vite
  - `children` — the rendered app HTML
  - `scripts` — client-side hydration scripts

### entry-client.tsx: mount, StartClient

```tsx
// src/entry-client.tsx
// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

mount(() => <StartClient />, document.getElementById("app")!);
```

- **`mount`** — hydrates the app into the existing DOM (or renders from scratch in SPA mode)
- **`StartClient`** — the client-side root component that sets up the router and hydration

### Rendering Modes: sync, async, stream

Configure rendering mode in `vite.config.ts`:

```ts
// vite.config.ts
import solid from "vite-plugin-solid";
import solidStart from "@solidjs/start/vite";

export default defineConfig({
  plugins: [
    solid(),
    solidStart({
      ssr: true, // enable SSR
    }),
  ],
  // Render mode is set via the StartServer component or config
});
```

**sync** (default for SSR):
```tsx
// Renders the entire page to a string, then sends it.
// Simplest mode. No streaming. Wait for all data before sending.
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => <StartServer document={({ assets, children, scripts }) => (
  <html lang="en"><head>{assets}</head><body><div id="app">{children}</div>{scripts}</body></html>
)} />);
```

**async**:
```tsx
// Renders asynchronously — waits for all resources to resolve.
// Sends complete HTML only after all data is loaded.
// Good for SEO when you need everything in the initial response.
```

**stream**:
```tsx
// Streams HTML to the client as data resolves.
// Best for pages with slow data — users see content incrementally.
// Uses renderToStream under the hood.
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>{assets}</head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

### Custom Document Component

Fully customize the HTML document shell:

```tsx
// src/entry-server.tsx
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts, title }) => (
      <html lang="en" class="dark">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#0f172a" />
          <link rel="icon" type="image/svg+xml" href="/logo.svg" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          {assets}
          <style>{`body { font-family: 'Inter', sans-serif; }`}</style>
        </head>
        <body class="bg-gray-950 text-gray-100">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
```

### Nonce for CSP

Add a nonce to inline scripts/styles for Content Security Policy:

```tsx
// src/entry-server.tsx
import { createHandler, StartServer } from "@solidjs/start/server";
import { getNonce } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => {
      const nonce = getNonce();
      return (
        <html lang="en">
          <head>
            <meta
              http-equiv="Content-Security-Policy"
              content={`default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'`}
            />
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      );
    }}
  />
));
```

---

## Configuration (defineConfig)

SolidStart configuration is done in `vite.config.ts` (v2) or `app.config.ts` (v1).

### All Options

```ts
// vite.config.ts
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import solidStart from "@solidjs/start/vite";

export default defineConfig({
  plugins: [
    solid(),
    solidStart({
      // ── SSR ────────────────────────────────────────────
      ssr: true,                  // Enable server-side rendering (default: true)
                                   // Set to false for SPA mode

      // ── Solid Plugin Options ───────────────────────────
      solid: {
        hydratable: true,          // Enable hydration (default: true for SSR)
      },

      // ── File Extensions ────────────────────────────────
      extensions: ["tsx", "jsx", "md", "mdx"],

      // ── Server Configuration ───────────────────────────
      server: {
        preset: "node",            // Deployment preset (see below)
        port: 3000,                // Dev server port
        host: true,                // Expose to network
        https: true,               // Enable HTTPS in dev
      },

      // ── Serialization Mode ─────────────────────────────
      serialization: "json",       // "json" (default) or "js"

      // ── Middleware ──────────────────────────────────────
      middleware: "auto",          // "auto" | "node" | "web"

      // ── App Root ───────────────────────────────────────
      appRoot: "src",              // Root directory for app source

      // ── Route Directory ────────────────────────────────
      routeDir: "src/routes",      // Directory for file-based routes

      // ── Dev Overlay ────────────────────────────────────
      devOverlay: true,            // Show Solid dev overlay in browser (default: true)

      // ── Experimental ───────────────────────────────────
      experimental: {
        islands: false,            // Enable islands architecture
        tasks: false,              // Enable background tasks
        websocket: false,          // Enable WebSocket support
      },
    }),
  ],

  // ── Standard Vite options ──────────────────────────────
  resolve: {
    alias: {
      "~": "./src",               // Path alias
    },
  },
});
```

### Server Presets

| Preset | Value | Notes |
|---|---|---|
| **Node.js** | `"node"` | Default. Produces a standalone Node server. |
| **Netlify Edge** | `"netlify_edge"` | Deploy to Netlify Edge Functions. |
| **Vercel** | `"vercel"` | Deploy to Vercel (serverless functions). |
| **Cloudflare** | `"cloudflare_module"` | Deploy to Cloudflare Workers (ESM format). |
| **Bun** | `"bun"` | Run with Bun runtime. |
| **Deno** | `"deno"` | Deploy to Deno Deploy. |

```ts
// Netlify Edge example
solidStart({
  server: {
    preset: "netlify_edge",
  },
})
```

```ts
// Cloudflare Workers example
solidStart({
  server: {
    preset: "cloudflare_module",
  },
})
```

### Pre-rendering: prerender.routes, crawlLinks

Generate static HTML at build time:

```ts
// vite.config.ts
solidStart({
  server: {
    preset: "node", // static prerender works with any preset
    prerender: {
      routes: ["/", "/about", "/pricing"],  // Routes to pre-render
      crawlLinks: true,                      // Follow <a href> to discover more routes
    },
  },
})
```

With `crawlLinks: true`, SolidStart starts at the listed routes and follows all `<a href>` links to discover additional pages to pre-render. This is useful for documentation sites and blogs.

### Per-Router Vite Config

You can customize Vite config per route group using `routeDir` as an array:

```ts
solidStart({
  routeDir: [
    "src/routes",           // Main routes
    // You can also configure different route directories
    // for different sections of your app
  ],
})
```

### Islands Mode (Experimental)

Islands architecture allows selective hydration — only interactive components get JavaScript:

```ts
// vite.config.ts
solidStart({
  experimental: {
    islands: true,
  },
})
```

```tsx
// Mark a component as an island (interactive)
// src/components/Counter.island.tsx
// The .island.tsx extension marks it for hydration
import { createSignal } from "solid-js";

export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  );
}
```

```tsx
// Use the island in a mostly-static page
import Counter from "~/components/Counter.island";

export default function StaticPage() {
  return (
    <div>
      <h1>Mostly Static Page</h1>
      <p>This content ships zero JavaScript.</p>
      <Counter /> {/* Only this component gets hydrated */}
    </div>
  );
}
```

---

## Security

### CSP with Nonce Pattern

Content Security Policy prevents XSS by restricting what scripts/styles can execute:

```tsx
// src/entry-server.tsx
import { createHandler, StartServer } from "@solidjs/start/server";
import { getNonce } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => {
      const nonce = getNonce();

      return (
        <html lang="en">
          <head>
            <meta
              http-equiv="Content-Security-Policy"
              content={[
                `default-src 'self'`,
                `script-src 'self' 'nonce-${nonce}' https://cdn.example.com`,
                `style-src 'self' 'unsafe-inline'`, // Tailwind needs unsafe-inline
                `img-src 'self' data: https:`,
                `font-src 'self' https://fonts.gstatic.com`,
                `connect-src 'self'`,
                `frame-ancestors 'none'`,
              ].join("; ")}
            />
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      );
    }}
  />
));
```

### CORS Middleware Pattern

```tsx
// src/middleware.ts
import { createMiddleware } from "@solidjs/start/middleware";

const ALLOWED_ORIGINS = [
  "https://myapp.com",
  "https://admin.myapp.com",
];

export default createMiddleware({
  onRequest: [
    async (event) => {
      const origin = event.request.headers.get("Origin");
      const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

      // Handle preflight
      if (event.request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": isAllowed ? origin : "",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
          },
        });
      }
    },
  ],
  onBeforeResponse: [
    async (event) => {
      const origin = event.request.headers.get("Origin");
      const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

      if (isAllowed) {
        event.response.headers.set("Access-Control-Allow-Origin", origin);
        event.response.headers.set("Access-Control-Allow-Credentials", "true");
      }
    },
  ],
});
```

### CSRF Origin Validation Pattern

```tsx
// src/middleware.ts
import { createMiddleware } from "@solidjs/start/middleware";

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ALLOWED_ORIGINS = new Set([
  "https://myapp.com",
  "http://localhost:3000", // dev
]);

export default createMiddleware({
  onRequest: [
    async (event) => {
      // Skip safe methods
      if (CSRF_SAFE_METHODS.has(event.request.method)) return;

      // Check Origin header
      const origin = event.request.headers.get("Origin");
      if (!origin || !ALLOWED_ORIGINS.has(origin)) {
        throw new Response("Forbidden — CSRF check failed", { status: 403 });
      }
    },
  ],
});
```

### XSS: Auto-Escaping, innerHTML Warning

SolidJS **automatically escapes** all JSX expressions — values inserted via `{}` are HTML-escaped by default:

```tsx
// ✅ Safe — auto-escaped
const userInput = '<script>alert("xss")</script>';
return <div>{userInput}</div>;
// Renders as: &lt;script&gt;alert("xss")&lt;/script&gt;

// ❌ DANGEROUS — bypasses escaping
return <div innerHTML={userInput} />;  // Executes the script!

// ❌ DANGEROUS — also bypasses escaping
return <div ref={el => { el.innerHTML = userInput; }} />;
```

**Rules:**
1. **Never** use `innerHTML` with user input
2. **Never** use `ref` to set `innerHTML` with user input
3. If you must render rich HTML (e.g., from a trusted CMS), sanitize first:

```tsx
import DOMPurify from "dompurify";

function SafeHtml({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html);
  return <div innerHTML={clean} />;
}
```

---

## Special Components

### clientOnly: Client-Exclusive Components

Lazy-load components that should only render on the client (e.g., heavy browser-only libraries):

```tsx
import { clientOnly } from "@solidjs/start";

// Create a client-only wrapper
const MapWidget = clientOnly(() => import("~/components/MapWidget"));
const Chart = clientOnly(() => import("~/components/Chart"));

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Renders nothing on server, loads + renders on client */}
      <MapWidget />
      <Chart />
    </div>
  );
}
```

**With fallback (shown during loading):**

```tsx
const Editor = clientOnly(() => import("~/components/Editor"));

// In usage:
<Editor fallback={<div>Loading editor…</div>} />
```

**Use cases:**
- Map libraries (Leaflet, Mapbox)
- Chart libraries (D3, Chart.js)
- Code editors (Monaco, CodeMirror)
- Canvas/WebGL visualizations

### HttpStatusCode: Set Status Codes

Set the HTTP response status code from any route component:

```tsx
import { HttpStatusCode } from "@solidjs/start";
import { createAsync } from "@solidjs/start";

export default function UserProfile() {
  const user = createAsync(() => getUser());

  return (
    <>
      {user() === null && (
        <HttpStatusCode code={404} />
      )}
      {user() && (
        <div>
          <h1>{user()?.name}</h1>
        </div>
      )}
    </>
  );
}
```

**Common patterns:**

```tsx
// Not found
<HttpStatusCode code={404} />

// Redirect (permanent)
<HttpStatusCode code={301} />

// Unauthorized
<HttpStatusCode code={401} />

// Server error
<HttpStatusCode code={500} />

// Created
<HttpStatusCode code={201} />
```

### HttpHeader: Set Response Headers

Set response headers from any route component:

```tsx
import { HttpHeader } from "@solidjs/start";

export default function DownloadPage() {
  return (
    <>
      <HttpHeader name="Cache-Control" value="public, max-age=31536000, immutable" />
      <HttpHeader name="X-Custom-Header" value="hello" />
      <div>Content</div>
    </>
  );
}
```

**Combined with HttpStatusCode for API-like responses:**

```tsx
import { HttpStatusCode, HttpHeader } from "@solidjs/start";

export default function DataPage() {
  const data = createAsync(() => getSlowData());

  return (
    <>
      <HttpStatusCode code={200} />
      <HttpHeader name="Cache-Control" value="private, max-age=60" />
      <HttpHeader name="X-Request-Id" value={crypto.randomUUID()} />
      <pre>{JSON.stringify(data(), null, 2)}</pre>
    </>
  );
}
```

---

## Background Tasks (Experimental)

SolidStart can define scheduled background tasks (cron jobs) that run on the server.

### defineTask + scheduledTasks (cron)

```ts
// src/server/tasks.ts
import { defineTask } from "@solidjs/start/tasks";

// Define a task
export const sendWeeklyDigest = defineTask({
  // Cron schedule (every Monday at 9 AM UTC)
  schedule: "0 9 * * 1",

  run: async () => {
    const users = await db.user.findMany({ where: { subscribed: true } });
    for (const user of users) {
      await sendEmail(user.email, "Weekly Digest", generateDigest(user));
    }
    console.log(`Sent digest to ${users.length} users`);
  },
});

export const cleanupExpiredSessions = defineTask({
  schedule: "0 0 * * *", // Daily at midnight UTC
  run: async () => {
    const deleted = await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    console.log(`Cleaned up ${deleted.count} expired sessions`);
  },
});
```

**Register tasks in config:**

```ts
// vite.config.ts
solidStart({
  experimental: {
    tasks: true,
  },
  // Register scheduled tasks
  scheduledTasks: [
    { task: "sendWeeklyDigest", schedule: "0 9 * * 1" },
    { task: "cleanupExpiredSessions", schedule: "0 0 * * *" },
  ],
})
```

### Manual Trigger via HTTP

Tasks can also be triggered manually through an API endpoint:

```tsx
// src/routes/api/tasks/[name].tsx
import { APIEvent } from "@solidjs/start";
import { json } from "@solidjs/router";

export async function POST(event: APIEvent) {
  const taskName = event.params.name;

  // Validate a secret to prevent unauthorized triggers
  const secret = event.request.headers.get("X-Task-Secret");
  if (secret !== process.env.TASK_SECRET) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  // Import and run the task
  try {
    const tasks = await import("~/server/tasks");
    const task = tasks[taskName];
    if (!task || typeof task.run !== "function") {
      return json({ error: "Task not found" }, { status: 404 });
    }
    await task.run();
    return json({ success: true, task: taskName });
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
```

---

## WebSocket (Experimental)

SolidStart provides experimental WebSocket support.

### Configuration and Handler Setup

```ts
// vite.config.ts
solidStart({
  experimental: {
    websocket: true,
  },
})
```

```tsx
// src/server/websocket.ts
import type { WebSocket } from "ws";

interface WSClient {
  ws: WebSocket;
  id: string;
}

const clients = new Set<WSClient>();

export function handleWebSocket(ws: WebSocket) {
  const client: WSClient = {
    ws,
    id: crypto.randomUUID(),
  };
  clients.add(client);
  console.log(`WebSocket connected: ${client.id}`);

  ws.on("message", (raw) => {
    const message = JSON.parse(raw.toString());

    switch (message.type) {
      case "chat":
        // Broadcast to all other clients
        for (const c of clients) {
          if (c.id !== client.id) {
            c.ws.send(JSON.stringify({
              type: "chat",
              from: client.id,
              text: message.text,
              timestamp: Date.now(),
            }));
          }
        }
        break;

      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
    }
  });

  ws.on("close", () => {
    clients.delete(client);
    console.log(`WebSocket disconnected: ${client.id}`);
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error (${client.id}):`, err);
    clients.delete(client);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: "welcome",
    id: client.id,
    message: "Connected to SolidStart WebSocket server",
  }));
}
```

**Client-side usage:**

```tsx
// src/components/Chat.tsx
import { createSignal, onCleanup } from "solid-js";

export default function Chat() {
  const [messages, setMessages] = createSignal<string[]>([]);
  const [input, setInput] = createSignal("");

  const ws = new WebSocket(`ws://${window.location.host}/ws`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "chat") {
      setMessages(prev => [...prev, `${data.from}: ${data.text}`]);
    }
  };

  onCleanup(() => ws.close());

  function send() {
    ws.send(JSON.stringify({ type: "chat", text: input() }));
    setInput("");
  }

  return (
    <div>
      <div class="messages">
        {messages().map((msg, i) => <p key={i}>{msg}</p>)}
      </div>
      <input
        value={input()}
        onInput={e => setInput(e.currentTarget.value)}
        onKeyDown={e => e.key === "Enter" && send()}
      />
      <button onClick={send}>Send</button>
    </div>
  );
}
```

---

## v1 → v2 Migration

### Dependency Changes

```bash
# Remove old packages
npm uninstall solid-start @solidjs/start

# Install new packages (v2)
npm install @solidjs/start@latest

# Ensure compatible SolidJS version
npm install solid-js@latest @solidjs/router@latest

# Vinxi is now a peer dependency
npm install vinxi
```

**Package name changes:**

| v1 | v2 |
|---|---|
| `solid-start` | `@solidjs/start` |
| `solid-start/router` | `@solidjs/start/router` |
| `solid-start/client` | `@solidjs/start/client` |
| `solid-start/server` | `@solidjs/start/server` |
| `solid-start/middleware` | `@solidjs/start/middleware` |

### Config Changes (app.config.ts → vite.config.ts)

**v1 (old):**
```ts
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true,
  server: {
    preset: "node",
  },
});
```

**v2 (new):**
```ts
// vite.config.ts
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import solidStart from "@solidjs/start/vite";

export default defineConfig({
  plugins: [
    solid(),
    solidStart({
      ssr: true,
      server: {
        preset: "node",
      },
    }),
  ],
});
```

### Script Changes

**v1 (old) — package.json:**
```json
{
  "scripts": {
    "dev": "solid-start dev",
    "build": "solid-start build",
    "start": "solid-start start"
  }
}
```

**v2 (new) — package.json:**
```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start"
  }
}
```

**Key differences:**
- v2 uses **Vinxi** as the CLI instead of `solid-start`
- The `app.config.ts` file is replaced by `vite.config.ts`
- The `vite-plugin-solid` plugin must be explicitly included in v2

---

## Deployment

### All Presets with Specific Configuration Notes

#### Node.js

```ts
// vite.config.ts
solidStart({ server: { preset: "node" } })
```

```bash
npm run build    # Outputs to .output/
npm start        # Runs the Node server
```

**Environment variables:** Use a `.env` file or pass `PORT=3000` to customize the port.

**Docker example:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

#### Netlify Edge

```ts
// vite.config.ts
solidStart({ server: { preset: "netlify_edge" } })
```

```bash
npm run build
# Deploy .output/ to Netlify
# Or use Netlify CLI:
npx netlify deploy --prod --dir=.output
```

**Notes:**
- Runs on Deno runtime (Edge Functions)
- No Node.js-specific APIs (use Web APIs)
- Session cookies must use `secure: true`

#### Vercel

```ts
// vite.config.ts
solidStart({ server: { preset: "vercel" } })
```

```bash
npm run build
# Deploy with Vercel CLI:
npx vercel --prod
# Or connect GitHub repo to Vercel dashboard
```

**Notes:**
- Automatic serverless function detection
- Set `vercel.json` for custom rewrites if needed
- Supports Edge runtime via `vercel-edge` preset (deprecated, use `netlify_edge` or `cloudflare_module` patterns)

#### Cloudflare Workers

```ts
// vite.config.ts
solidStart({ server: { preset: "cloudflare_module" } })
```

```bash
npm run build
# Deploy with Wrangler:
npx wrangler deploy
```

**Notes:**
- Uses ES modules format (`cloudflare_module`)
- No Node.js APIs — use Web APIs only
- Access KV, D1, R2 via `event.platform.env` in middleware
- Wrangler config (`wrangler.toml`):
```toml
name = "my-solidstart-app"
compatibility_date = "2024-01-01"
main = ".output/server/index.mjs"
```

#### Bun

```ts
// vite.config.ts
solidStart({ server: { preset: "bun" } })
```

```bash
npm run build
bun run .output/server/index.mjs
```

**Notes:**
- Leverages Bun's fast runtime
- Some npm packages may not be compatible with Bun's module resolution

#### Deno

```ts
// vite.config.ts
solidStart({ server: { preset: "deno" } })
```

```bash
npm run build
# Deploy to Deno Deploy:
deployctl deploy --project=my-app .output/server/index.mjs
```

**Notes:**
- Uses Deno's native runtime
- Web API compatible
- Works with Deno Deploy's global edge network

#### Static / Pre-rendered

For fully static sites (no server):

```ts
// vite.config.ts
solidStart({
  ssr: true,  // SSR needed for pre-rendering
  server: {
    preset: "node",
    prerender: {
      routes: ["/", "/about", "/blog"],
      crawlLinks: true,
    },
  },
})
```

```bash
npm run build
# Static files are in .output/public/
# Deploy to any static host (GitHub Pages, S3, etc.)
```

---

## Quick Reference: Imports

```ts
// Routing
import { Router, Route, useParams, useSearchParams, useNavigate, Outlet } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

// Server functions & data
import { createAsync } from "@solidjs/start";
import { query, action, useAction, useSubmission, useSubmissions, redirect, json } from "@solidjs/router";

// Entry points
import { createHandler, StartServer } from "@solidjs/start/server";
import { mount, StartClient } from "@solidjs/start/client";

// Middleware
import { createMiddleware } from "@solidjs/start/middleware";

// Sessions
import { useSession } from "vinxi/http";

// Special components
import { clientOnly, HttpStatusCode, HttpHeader } from "@solidjs/start";

// Server utilities
import { getServerFunctionMeta } from "@solidjs/start/server";

// Configuration
import solid from "vite-plugin-solid";
import solidStart from "@solidjs/start/vite";

// Types
import type { APIEvent } from "@solidjs/start";
```
