# SolidJS Testing Recipes

Complete guide to testing SolidJS applications with Vitest and SolidJS Testing Library.

---

## Setup

### Install Dependencies

```bash
npm install -D vitest jsdom @solidjs/testing-library @testing-library/user-event @testing-library/jest-dom
```

### vitest.config.ts

```ts
import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    // SolidJS transforms need to be respected
    deps: {
      // Prevent vitest from processing solid-js with Node transforms
      inline: [/solid-js/],
    },
  },
});
```

### test/setup.ts

```ts
import "@testing-library/jest-dom/vitest";
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"],
    "jsx": "preserve",
    "jsxImportSource": "solid-js"
  }
}
```

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Component Testing

### render() from @solidjs/testing-library

`render()` takes a component function (not JSX directly) and returns queries, `container`, `unmount`, and more.

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { Greeting } from "./Greeting";

function Greeting(props: { name: string }) {
  return <h1>Hello, {props.name}!</h1>;
}

describe("Greeting", () => {
  it("renders the name", () => {
    render(() => <Greeting name="Solid" />);
    expect(screen.getByText("Hello, Solid!")).toBeInTheDocument();
  });
});
```

### Basic Component Test Pattern

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { Counter } from "./Counter";

function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      <span data-testid="count">{count()}</span>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

describe("Counter", () => {
  it("starts at 0", () => {
    render(() => <Counter />);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("increments on click", async () => {
    const user = userEvent.setup();
    render(() => <Counter />);
    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
```

### Query Priority

Follow this order when selecting elements. Prefer queries that reflect how users interact with your app:

| Priority | Query Method | Example |
|----------|-------------|---------|
| 1 | `getByRole` | `screen.getByRole("button", { name: /submit/i })` |
| 2 | `getByLabelText` | `screen.getByLabelText("Email")` |
| 3 | `getByPlaceholderText` | `screen.getByPlaceholderText("Enter email")` |
| 4 | `getByText` | `screen.getByText("Welcome back")` |
| 5 | `getByDisplayValue` | `screen.getByDisplayValue("john@test.com")` |
| 6 | `getByAltText` | `screen.getByAltText("Company logo")` |
| 7 | `getByTitle` | `screen.getByTitle("Close dialog")` |
| 8 | `getByTestId` | `screen.getByTestId("user-list")` |

> **Rule of thumb**: Use `getBy*` when element should exist, `findBy*` for async elements (returns a Promise), and `queryBy*` when element should NOT exist.

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";

function LoginForm() {
  return (
    <form>
      <label for="email">Email</label>
      <input id="email" type="email" placeholder="Enter email" />
      <label for="password">Password</label>
      <input id="password" type="password" placeholder="Enter password" />
      <button type="submit">Sign In</button>
    </form>
  );
}

describe("LoginForm query priority", () => {
  it("uses role for buttons", () => {
    render(() => <LoginForm />);
    // 1. Role (best)
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("uses label text for inputs", () => {
    render(() => <LoginForm />);
    // 2. LabelText (best for form fields)
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("uses placeholder as fallback", () => {
    render(() => <LoginForm />);
    // 3. PlaceholderText
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("uses text for non-interactive content", () => {
    render(() => <LoginForm />);
    // 4. Text (for labels, headings, paragraphs)
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("uses test-id only as last resort", () => {
    render(() => <LoginForm />);
    // 8. TestId (last resort)
    // Only use when no semantic query works
  });
});
```

### get vs find vs query

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";

describe("query variants", () => {
  it("getBy* - throws if not found (element MUST exist)", () => {
    render(() => <div>Hello</div>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // screen.getByText("Missing") → throws error immediately
  });

  it("queryBy* - returns null if not found (element should NOT exist)", () => {
    render(() => <div>Hello</div>);
    expect(screen.queryByText("Missing")).not.toBeInTheDocument();
  });

  it("findBy* - returns promise, waits for element (async)", async () => {
    render(() => <div>Hello</div>);
    // Waits up to 1000ms by default
    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });

  it("getAllBy* - returns array (multiple matches expected)", () => {
    render(() => (
      <ul>
        <li>Apple</li>
        <li>Banana</li>
        <li>Cherry</li>
      </ul>
    ));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
```

---

## User Interactions

### userEvent.setup()

Always use `userEvent.setup()` — it simulates realistic browser events (focus, blur, click sequences) unlike `fireEvent`.

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { createSignal } from "solid-js";

function SearchForm() {
  const [query, setQuery] = createSignal("");
  const [submitted, setSubmitted] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setSubmitted(query());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
        placeholder="Search..."
      />
      <button type="submit">Search</button>
      {submitted() && <p>Results for: {submitted()}</p>}
    </form>
  );
}

describe("SearchForm interactions", () => {
  it("types into input and submits", async () => {
    const user = userEvent.setup();
    render(() => <SearchForm />);

    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "solidjs");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(screen.getByText(/results for: solidjs/i)).toBeInTheDocument();
  });
});
```

### Click Events

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { createSignal } from "solid-js";

function ClickDemo() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count()}</button>
      <button onClick={() => setCount(0)}>Reset</button>
      <input type="checkbox" aria-label="Toggle" />
    </div>
  );
}

describe("click interactions", () => {
  it("clicks increment button", async () => {
    const user = userEvent.setup();
    render(() => <ClickDemo />);

    await user.click(screen.getByRole("button", { name: /count: 0/i }));
    expect(screen.getByRole("button", { name: /count: 1/i })).toBeInTheDocument();
  });

  it("clicks reset button", async () => {
    const user = userEvent.setup();
    render(() => <ClickDemo />);

    await user.click(screen.getByRole("button", { name: /count: 0/i }));
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByRole("button", { name: /count: 0/i })).toBeInTheDocument();
  });

  it("toggles checkbox", async () => {
    const user = userEvent.setup();
    render(() => <ClickDemo />);

    const checkbox = screen.getByRole("checkbox", { name: /toggle/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
```

### Type and Keyboard Events

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { createSignal } from "solid-js";

function KeyboardDemo() {
  const [value, setValue] = createSignal("");
  return (
    <div>
      <input
        type="text"
        value={value()}
        onInput={(e) => setValue(e.currentTarget.value)}
        aria-label="Text input"
      />
      <textarea aria-label="Notes" />
      <p data-testid="output">{value()}</p>
    </div>
  );
}

describe("keyboard interactions", () => {
  it("types text character by character", async () => {
    const user = userEvent.setup();
    render(() => <KeyboardDemo />);

    const input = screen.getByRole("textbox", { name: /text input/i });
    await user.type(input, "Hello");
    expect(screen.getByTestId("output")).toHaveTextContent("Hello");
  });

  it("supports keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(() => <KeyboardDemo />);

    const input = screen.getByRole("textbox", { name: /text input/i });
    await user.type(input, "Hello");
    await user.keyboard("{Control>}a{/Control}"); // Select all
    await user.keyboard("{Backspace}"); // Delete selection
    expect(screen.getByTestId("output")).toHaveTextContent("");
  });

  it("clears and retypes", async () => {
    const user = userEvent.setup();
    render(() => <KeyboardDemo />);

    const input = screen.getByRole("textbox", { name: /text input/i });
    await user.type(input, "Hello");
    await user.clear(input);
    await user.type(input, "World");
    expect(screen.getByTestId("output")).toHaveTextContent("World");
  });

  it("tabs between elements", async () => {
    const user = userEvent.setup();
    render(() => <KeyboardDemo />);

    await user.tab();
    expect(screen.getByRole("textbox", { name: /text input/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: /notes/i })).toHaveFocus();
  });
});
```

### Pointer Events

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { createSignal } from "solid-js";

function DragDemo() {
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [hovered, setHovered] = createSignal(false);

  return (
    <div
      data-testid="draggable"
      style={{ width: 100, height: 100 }}
      onPointerMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {hovered() ? "Hovered" : "Not hovered"}
      <span data-testid="pos">{position().x},{position().y}</span>
    </div>
  );
}

describe("pointer interactions", () => {
  it("tracks pointer hover", async () => {
    const user = userEvent.setup();
    render(() => <DragDemo />);

    const box = screen.getByTestId("draggable");
    expect(screen.getByText("Not hovered")).toBeInTheDocument();

    await user.hover(box);
    expect(screen.getByText("Hovered")).toBeInTheDocument();

    await user.unhover(box);
    expect(screen.getByText("Not hovered")).toBeInTheDocument();
  });

  it("tracks pointer movement", async () => {
    const user = userEvent.setup();
    render(() => <DragDemo />);

    const box = screen.getByTestId("draggable");
    await user.pointer([
      { keys: "[MouseLeft>]", target: box },
      { coords: { x: 50, y: 75 }, target: box },
      { keys: "[/MouseLeft]", target: box },
    ]);

    expect(screen.getByTestId("pos")).toHaveTextContent("50,75");
  });
});
```

### Timer Handling

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSignal, onCleanup } from "solid-js";

function AutoSave() {
  const [status, setStatus] = createSignal("idle");
  const [content, setContent] = createSignal("");

  // Debounced auto-save
  let timer: ReturnType<typeof setTimeout>;
  const handleChange = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    setContent(val);
    setStatus("typing");
    clearTimeout(timer);
    timer = setTimeout(() => {
      setStatus("saved");
    }, 1000);
  };

  onCleanup(() => clearTimeout(timer));

  return (
    <div>
      <input type="text" onInput={handleChange} aria-label="Content" />
      <span data-testid="status">{status()}</span>
    </div>
  );
}

describe("AutoSave with fake timers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves after debounce period", async () => {
    // When using fake timers, userEvent must advance them
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(() => <AutoSave />);

    const input = screen.getByRole("textbox", { name: /content/i });
    await user.type(input, "Hello");
    expect(screen.getByTestId("status")).toHaveTextContent("typing");

    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByTestId("status")).toHaveTextContent("saved");
  });

  it("resets debounce on continued typing", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(() => <AutoSave />);

    const input = screen.getByRole("textbox", { name: /content/i });
    await user.type(input, "H");
    await vi.advanceTimersByTimeAsync(500);
    await user.type(input, "e");
    await vi.advanceTimersByTimeAsync(500);

    // Still typing because debounce reset
    expect(screen.getByTestId("status")).toHaveTextContent("typing");

    await vi.advanceTimersByTimeAsync(500);
    expect(screen.getByTestId("status")).toHaveTextContent("saved");
  });
});
```

---

## Testing with Context

### Wrapper Pattern

Use the `wrapper` option to wrap components with providers.

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { createContext, useContext, ParentComponent, JSX } from "solid-js";

// --- Context setup ---
interface Theme {
  mode: "light" | "dark";
  toggle: () => void;
}

const ThemeContext = createContext<Theme>();

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

const ThemeProvider: ParentComponent<{ initial?: "light" | "dark" }> = (props) => {
  const [mode, setMode] = createSignal(props.initial ?? "light");
  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
  return (
    <ThemeContext.Provider value={{ mode: mode(), toggle }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

// --- Component under test ---
function ThemeToggle() {
  const theme = useTheme();
  return (
    <div>
      <span data-testid="mode">{theme.mode}</span>
      <button onClick={theme.toggle}>Toggle Theme</button>
    </div>
  );
}

// --- Tests ---
describe("ThemeToggle with context", () => {
  it("renders with default theme", () => {
    render(() => <ThemeToggle />, { wrapper: ThemeProvider });
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("renders with custom initial theme", () => {
    render(() => <ThemeToggle />, {
      wrapper: (props) => <ThemeProvider initial="dark" {...props} />,
    });
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });
});
```

### Custom Wrapper Function

Build reusable test wrappers that compose multiple providers.

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createContext, useContext, ParentComponent, JSX } from "solid-js";

// --- Auth context ---
const AuthContext = createContext<{ user: string | null; login: (name: string) => void }>();

const AuthProvider: ParentComponent = (props) => {
  const [user, setUser] = createSignal<string | null>(null);
  return (
    <AuthContext.Provider value={{ user: user(), login: setUser }}>
      {props.children}
    </AuthContext.Provider>
  );
};

// --- Notification context ---
const NotifContext = createContext<{ notify: (msg: string) => void }>();

const NotifProvider: ParentComponent<{ onNotify?: (msg: string) => void }> = (props) => {
  const notify = (msg: string) => props.onNotify?.(msg);
  return (
    <NotifContext.Provider value={{ notify }}>
      {props.children}
    </NotifContext.Provider>
  );
};

// --- Composed wrapper ---
function createTestWrapper(options?: { onNotify?: (msg: string) => void }) {
  const Wrapper: ParentComponent = (props) => (
    <AuthProvider>
      <NotifProvider onNotify={options?.onNotify}>{props.children}</NotifProvider>
    </AuthProvider>
  );
  return Wrapper;
}

// --- Component under test ---
function LoginButton() {
  const auth = useContext(AuthContext)!;
  const notif = useContext(NotifContext)!;
  return (
    <div>
      {auth.user ? <span>Logged in as {auth.user}</span> : <span>Not logged in</span>}
      <button onClick={() => { auth.login("Alice"); notif.notify("Welcome!"); }}>Login</button>
    </div>
  );
}

// --- Tests ---
describe("LoginButton with composed providers", () => {
  it("logs in and sends notification", async () => {
    const onNotify = vi.fn();
    const Wrapper = createTestWrapper({ onNotify });

    const user = userEvent.setup();
    render(() => <LoginButton />, { wrapper: Wrapper });

    expect(screen.getByText("Not logged in")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /login/i }));
    expect(screen.getByText("Logged in as Alice")).toBeInTheDocument();
    expect(onNotify).toHaveBeenCalledWith("Welcome!");
  });
});
```

---

## Testing Routes

### Router is Lazy-Loaded

The SolidJS router loads lazily, so the first query must be async (`findBy*`).

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Router, Route } from "@solidjs/router";

function Home() {
  return <h1>Home Page</h1>;
}

function About() {
  return <h1>About Page</h1>;
}

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
    </Router>
  );
}

describe("Router", () => {
  it("renders home page", async () => {
    render(() => <App />);
    // Router is lazy-loaded → first query MUST be async (findBy)
    const heading = await screen.findByRole("heading", { name: /home page/i });
    expect(heading).toBeInTheDocument();
  });

  it("navigates to about page", async () => {
    const user = userEvent.setup();
    render(() => <App />);

    // Wait for router to be ready
    await screen.findByRole("heading", { name: /home page/i });

    // Navigate
    await user.click(screen.getByText("About"));
    const aboutHeading = await screen.findByRole("heading", { name: /about page/i });
    expect(aboutHeading).toBeInTheDocument();
  });
});
```

### Render with Location Option

Set the initial route with the `location` option.

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { Router, Route, useParams } from "@solidjs/router";

function UserProfile() {
  const params = useParams();
  return <h1>User {params.id}</h1>;
}

function App() {
  return (
    <Router>
      <Route path="/users/:id" component={UserProfile} />
    </Router>
  );
}

describe("Route with location option", () => {
  it("renders user profile at specific route", async () => {
    render(() => <App />, { location: "/users/123" });
    // First query is async because router loads lazily
    const heading = await screen.findByRole("heading", { name: /user 123/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders different user IDs", async () => {
    render(() => <App />, { location: "/users/abc" });
    const heading = await screen.findByRole("heading", { name: /user abc/i });
    expect(heading).toBeInTheDocument();
  });
});
```

### Testing Route Parameters

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { Router, Route, useParams, useSearchParams } from "@solidjs/router";

function SearchResults() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  return (
    <div>
      <h1>Category: {params.category}</h1>
      <p>Query: {searchParams.q ?? "none"}</p>
      <p>Page: {searchParams.page ?? "1"}</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Route path="/search/:category" component={SearchResults} />
    </Router>
  );
}

describe("Route parameters", () => {
  it("reads path params and search params", async () => {
    render(() => <App />, { location: "/search/electronics?q=laptop&page=3" });
    expect(await screen.findByText("Category: electronics")).toBeInTheDocument();
    expect(screen.getByText("Query: laptop")).toBeInTheDocument();
    expect(screen.getByText("Page: 3")).toBeInTheDocument();
  });

  it("uses defaults for missing search params", async () => {
    render(() => <App />, { location: "/search/books" });
    expect(await screen.findByText("Category: books")).toBeInTheDocument();
    expect(screen.getByText("Query: none")).toBeInTheDocument();
    expect(screen.getByText("Page: 1")).toBeInTheDocument();
  });
});
```

---

## Testing Portals

Portals render content outside the test container. Use `screen` queries instead of container-scoped queries.

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSignal, Show, Portal } from "solid-js";

function Modal(props: { title: string; children: JSX.Element; onClose: () => void }) {
  return (
    <Portal>
      <div role="dialog" aria-modal="true" aria-label={props.title}>
        <h2>{props.title}</h2>
        {props.children}
        <button onClick={props.onClose}>Close</button>
      </div>
    </Portal>
  );
}

function App() {
  const [open, setOpen] = createSignal(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <Show when={open()}>
        <Modal title="Confirm" onClose={() => setOpen(false)}>
          <p>Are you sure?</p>
        </Modal>
      </Show>
    </div>
  );
}

describe("Portal / Modal", () => {
  it("renders modal content in portal (accessible via screen)", async () => {
    const user = userEvent.setup();
    render(() => <App />);

    // Modal not visible yet
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open modal/i }));

    // Portal content is accessible via screen queries
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /confirm/i })).toBeInTheDocument();
  });

  it("closes modal", async () => {
    const user = userEvent.setup();
    render(() => <App />);

    await user.click(screen.getByRole("button", { name: /open modal/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

---

## Testing Directives

### renderDirective()

`renderDirective()` from `@solidjs/testing-library` returns `[setArg, container]` so you can change the directive's argument reactively.

```ts
import { renderDirective } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { createSignal, onCleanup } from "solid-js";

// --- A click-outside directive ---
function clickOutside(el: HTMLElement, accessor: () => () => void) {
  const onClick = (e: MouseEvent) => {
    if (!el.contains(e.target as Node)) {
      accessor()(); // Call the callback
    }
  };
  document.body.addEventListener("click", onClick);
  onCleanup(() => document.body.removeEventListener("click", onClick));
}

// --- Directive directive test ---
describe("clickOutside directive", () => {
  it("calls callback when clicking outside", async () => {
    const callback = vi.fn();
    const [setArg, container] = renderDirective(clickOutside, () => callback);

    // Click inside the element — should NOT trigger
    container.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    expect(callback).not.toHaveBeenCalled();

    // Click on the body (outside) — SHOULD trigger
    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("updates callback when arg changes", async () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const [setArg, container] = renderDirective(clickOutside, () => firstCallback);

    // Click outside with first callback
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(firstCallback).toHaveBeenCalledTimes(1);

    // Update the directive's argument
    setArg(() => secondCallback);

    // Click outside with second callback
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });
});
```

### Tooltip Directive Example

```ts
import { renderDirective } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";

// --- Tooltip directive ---
function tooltip(el: HTMLElement, accessor: () => string) {
  const text = accessor();
  el.setAttribute("title", text);
  el.setAttribute("aria-label", text);
}

describe("tooltip directive", () => {
  it("sets title and aria-label", () => {
    const [setArg, container] = renderDirective(tooltip, "Help text");
    expect(container).toHaveAttribute("title", "Help text");
    expect(container).toHaveAttribute("aria-label", "Help text");
  });

  it("updates when argument changes", () => {
    const [setArg, container] = renderDirective(tooltip, "Old tip");
    expect(container).toHaveAttribute("title", "Old tip");

    setArg("New tip");
    expect(container).toHaveAttribute("title", "New tip");
  });
});
```

---

## Testing Reactive Primitives

### renderHook()

`renderHook()` returns `{ result }` for testing signals, effects, memos, and other primitives outside a component.

```ts
import { renderHook } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { createSignal, createMemo, createEffect } from "solid-js";

// --- Custom hook: useCounter ---
function useCounter(initial = 0) {
  const [count, setCount] = createSignal(initial);
  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset = () => setCount(initial);
  const doubled = createMemo(() => count() * 2);
  return { count, increment, decrement, reset, doubled };
}

describe("useCounter hook", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(useCounter);
    expect(result.count()).toBe(0);
    expect(result.doubled()).toBe(0);
  });

  it("initializes with custom value", () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.count()).toBe(5);
    expect(result.doubled()).toBe(10);
  });

  it("increments", () => {
    const { result } = renderHook(useCounter);
    result.increment();
    expect(result.count()).toBe(1);
    expect(result.doubled()).toBe(2);
  });

  it("decrements", () => {
    const { result } = renderHook(() => useCounter(3));
    result.decrement();
    expect(result.count()).toBe(2);
    expect(result.doubled()).toBe(4);
  });

  it("resets to initial value", () => {
    const { result } = renderHook(() => useCounter(10));
    result.increment();
    result.increment();
    expect(result.count()).toBe(12);
    result.reset();
    expect(result.count()).toBe(10);
  });
});
```

### Testing a Custom Signal-Based Hook

```ts
import { renderHook } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { createSignal, createMemo } from "solid-js";

// --- useDebouncedValue ---
function useDebouncedValue<T>(value: () => T, delay: number) {
  const [debounced, setDebounced] = createSignal(value());
  let timer: ReturnType<typeof setTimeout>;

  createEffect(() => {
    const current = value();
    clearTimeout(timer);
    timer = setTimeout(() => setDebounced(() => current), delay);
  });

  return debounced;
}

describe("useDebouncedValue", () => {
  it("returns initial value immediately", () => {
    const [value, setValue] = createSignal("hello");
    const { result } = renderHook(() => useDebouncedValue(value, 500));
    expect(result()).toBe("hello");
  });
});
```

---

## Testing Effects

### Effect Timing

Effects run **after** the render phase. When you synchronously change signals inside a test, effects may not have fired yet. Use `vi.waitFor` or structure tests to account for this.

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import { createSignal, createEffect, onCleanup } from "solid-js";

function EffectLogger(props: { value: () => string }) {
  createEffect(() => {
    console.log("Value changed:", props.value());
  });
  return <span data-testid="display">{props.value()}</span>;
}

describe("effect timing", () => {
  it("effect runs after render", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const [value, setValue] = createSignal("initial");

    render(() => <EffectLogger value={value} />);

    // Effect has run after the initial render
    expect(logSpy).toHaveBeenCalledWith("Value changed:", "initial");

    setValue("updated");

    // After signal change, the effect fires synchronously within Solid's reactive system
    expect(logSpy).toHaveBeenCalledWith("Value changed:", "updated");

    logSpy.mockRestore();
  });
});
```

### testEffect Pattern

For multi-step effect testing, wrap assertions inside a reactive root and use a promise-based pattern.

```ts
import { describe, it, expect, vi } from "vitest";
import { createSignal, createEffect, onCleanup } from "solid-js";

/**
 * Helper to test effects step by step.
 * Runs a callback inside a reactive root and resolves
 * when the effect has fired.
 */
function testEffect<T>(
  fn: () => T,
  effectFn: (result: T) => (void | (() => void))
): Promise<void> {
  return new Promise((resolve) => {
    const disposer = createRoot((dispose) => {
      const result = fn();
      let cleanup: void | (() => void);

      createEffect(() => {
        cleanup?.();
        cleanup = effectFn(result);
      });

      // Give Solid a tick to run effects
      setTimeout(() => {
        dispose();
        resolve();
      }, 0);
    });
  });
}

import { createRoot } from "solid-js";

describe("testEffect pattern", () => {
  it("tracks signal changes across multiple steps", async () => {
    const [name, setName] = createSignal("Alice");
    const log: string[] = [];

    await testEffect(
      () => name,
      (nameSignal) => {
        log.push(nameSignal());
      }
    );

    expect(log).toContain("Alice");
  });

  it("tests cleanup with onCleanup", async () => {
    const [active, setActive] = createSignal(true);
    const cleanupLog: string[] = [];

    await testEffect(
      () => active,
      (activeSignal) => {
        if (activeSignal()) {
          cleanupLog.push("setup");
          onCleanup(() => cleanupLog.push("cleanup"));
        }
      }
    );

    expect(cleanupLog).toContain("setup");
  });
});
```

### Testing Cleanup with onCleanup

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import { createSignal, onCleanup, createEffect } from "solid-js";

function Timer() {
  const [seconds, setSeconds] = createSignal(0);
  const interval = setInterval(() => setSeconds((s) => s + 1), 1000);

  onCleanup(() => {
    clearInterval(interval);
  });

  return <span data-testid="timer">{seconds()}</span>;
}

describe("onCleanup", () => {
  it("cleans up interval on unmount", () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    const { unmount } = render(() => <Timer />);

    // Timer is running
    vi.advanceTimersByTime(3000);
    expect(screen.getByTestId("timer")).toHaveTextContent("3");

    // Unmount triggers cleanup
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
```

---

## Testing Async Data (createResource)

### Suspense + Resource Testing

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSignal, createResource, Suspense, ErrorBoundary } from "solid-js";
import { JSX } from "solid-js";

// --- API mock ---
const mockFetchUser = vi.fn();

async function fetchUser(id: string): Promise<{ name: string; email: string }> {
  const res = await mockFetchUser(id);
  return res;
}

// --- Component ---
function UserProfile(props: { id: string }) {
  const [user] = createResource(() => props.id, fetchUser);
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div>
        <h1>{user()?.name ?? ""}</h1>
        <p>{user()?.email ?? ""}</p>
      </div>
    </Suspense>
  );
}

// --- Tests ---
describe("createResource with Suspense", () => {
  beforeEach(() => {
    mockFetchUser.mockReset();
  });

  it("shows loading state then data", async () => {
    mockFetchUser.mockResolvedValue({
      name: "Alice",
      email: "alice@example.com",
    });

    render(() => <UserProfile id="1" />);

    // Loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Data loaded
    expect(await screen.findByRole("heading", { name: /alice/i })).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    mockFetchUser.mockRejectedValue(new Error("Network error"));

    function ErrorCatcher(props: { fallback: JSX.Element; children: JSX.Element }) {
      return (
        <ErrorBoundary fallback={(err) => <p>Error: {err.message}</p>}>
          {props.children}
        </ErrorBoundary>
      );
    }

    render(() => <UserProfile id="1" />, { wrapper: ErrorCatcher });

    // Loading first
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Error displayed
    expect(await screen.findByText(/error: network error/i)).toBeInTheDocument();
  });

  it("refetches when id changes", async () => {
    mockFetchUser
      .mockResolvedValueOnce({ name: "Alice", email: "alice@example.com" })
      .mockResolvedValueOnce({ name: "Bob", email: "bob@example.com" });

    const [id, setId] = createSignal("1");

    render(() => <UserProfile id={id()} />);
    expect(await screen.findByRole("heading", { name: /alice/i })).toBeInTheDocument();

    // Change ID → refetch
    setId("2");
    expect(await screen.findByRole("heading", { name: /bob/i })).toBeInTheDocument();
    expect(mockFetchUser).toHaveBeenCalledTimes(2);
  });
});
```

### Mocking Fetch

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi, afterEach } from "vitest";
import { createResource, Suspense } from "solid-js";

// --- Mock globalThis.fetch ---
afterEach(() => {
  vi.restoreAllMocks();
});

function TodoList() {
  const [todos] = createResource(async () => {
    const res = await fetch("/api/todos");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<{ id: number; title: string; done: boolean }[]>;
  });

  return (
    <Suspense fallback={<p>Loading todos...</p>}>
      <ul>
        {(todos() ?? []).map((todo) => (
          <li key={todo.id} data-done={todo.done}>
            {todo.title}
          </li>
        ))}
      </ul>
    </Suspense>
  );
}

describe("TodoList with mocked fetch", () => {
  it("renders todos from API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 1, title: "Learn Solid", done: false },
          { id: 2, title: "Write tests", done: true },
        ]),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    render(() => <TodoList />);
    expect(await screen.findByText("Learn Solid")).toBeInTheDocument();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByText("Write tests").closest("li")).toHaveAttribute("data-done", "true");
  });

  it("handles fetch error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Server down"));

    // Wrap in ErrorBoundary to catch thrown error
    function SafeTodoList() {
      return (
        <ErrorBoundary fallback={(err) => <p>Failed: {err.message}</p>}>
          <TodoList />
        </ErrorBoundary>
      );
    }

    render(() => <SafeTodoList />);
    expect(await screen.findByText(/failed: server down/i)).toBeInTheDocument();
  });
});
```

### Testing Loading / Error / Success States Explicitly

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import { createResource, Suspense, Switch, Match, ErrorBoundary } from "solid-js";

function DataComponent() {
  const [data] = createResource(async () => {
    const res = await fetch("/api/data");
    return res.json() as Promise<{ value: string }>;
  });

  return (
    <Suspense fallback={<span data-testid="state">loading</span>}>
      <Switch>
        <Match when={data.error}>
          <span data-testid="state">error</span>
        </Match>
        <Match when={data()}>
          <span data-testid="state">success: {data()!.value}</span>
        </Match>
      </Switch>
    </Suspense>
  );
}

describe("DataComponent states", () => {
  it("transitions from loading to success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: "hello" }), {
        headers: { "Content-Type": "application/json" },
      })
    );

    render(() => <DataComponent />);
    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    expect(await screen.findByTestId("state")).toHaveTextContent("success: hello");
  });
});
```

---

## Testing Actions (Router)

### useSubmission for Tracking Action State

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Router, Route, Action, action, useSubmission } from "@solidjs/router";
import { createSignal, Show, Suspense } from "solid-js";

// --- Define an action ---
const submitForm = action(async (formData: FormData) => {
  const name = formData.get("name") as string;
  // Simulate API call
  await new Promise((r) => setTimeout(r, 100));
  if (!name) throw new Error("Name is required");
  return { success: true, name };
});

// --- Component using the action ---
function FormWithAction() {
  const submission = useSubmission(submitForm);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await submitForm(new FormData(e.currentTarget));
      }}
    >
      <input name="name" aria-label="Name" />
      <button type="submit">Submit</button>
      <Show when={submission.pending}>
        <span data-testid="status">Submitting...</span>
      </Show>
      <Show when={submission.result}>
        <span data-testid="status">Success: {submission.result?.name}</span>
      </Show>
      <Show when={submission.error}>
        <span data-testid="status">Error: {submission.error?.message}</span>
      </Show>
    </form>
  );
}

// --- Test ---
describe("Form action with useSubmission", () => {
  it("shows pending then success state", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(() => (
      <Router>
        <Route path="/" component={FormWithAction} />
      </Router>
    ));

    // Wait for router
    const input = await screen.findByRole("textbox", { name: /name/i });
    await user.type(input, "Alice");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Pending state
    expect(screen.getByTestId("status")).toHaveTextContent("Submitting...");

    // Advance timers to resolve action
    await vi.advanceTimersByTimeAsync(200);

    // Success state
    expect(screen.getByTestId("status")).toHaveTextContent("Success: Alice");

    vi.useRealTimers();
  });
});
```

### Testing Form Submissions

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createSignal } from "solid-js";

function ContactForm(props: { onSubmit: (data: { email: string; message: string }) => void }) {
  const [email, setEmail] = createSignal("");
  const [message, setMessage] = createSignal("");
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email().includes("@")) newErrors.email = "Invalid email";
    if (message().length < 10) newErrors.message = "Message too short";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      props.onSubmit({ email: email(), message: message() });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label for="email">Email</label>
      <input id="email" type="email" value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
      {errors().email && <span role="alert">{errors().email}</span>}

      <label for="message">Message</label>
      <textarea id="message" value={message()} onInput={(e) => setMessage(e.currentTarget.value)} />
      {errors().message && <span role="alert">{errors().message}</span>}

      <button type="submit">Send</button>
    </form>
  );
}

describe("ContactForm validation", () => {
  it("shows validation errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(() => <ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "invalid");
    await user.type(screen.getByLabelText("Message"), "short");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    expect(screen.getByText("Message too short")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(() => <ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Message"), "This is a long enough message");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      message: "This is a long enough message",
    });
  });
});
```

---

## Testing Stores

### Testing Store Mutations

```ts
import { renderHook } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { createStore, produce, reconcile } from "solid-js/store";

// --- Custom hook using store ---
function useTodoStore() {
  const [todos, setTodos] = createStore<{ id: number; text: string; done: boolean }[]>([]);
  const nextId = () => Math.max(0, ...todos.map((t) => t.id)) + 1;

  const addTodo = (text: string) => {
    setTodos((prev) => [...prev, { id: nextId(), text, done: false }]);
  };

  const toggleTodo = (id: number) => {
    setTodos(
      (todo) => todo.id === id,
      "done",
      (prev) => !prev
    );
  };

  const removeTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const updateText = (id: number, text: string) => {
    setTodos((todo) => todo.id === id, "text", text);
  };

  return { todos, addTodo, toggleTodo, removeTodo, updateText };
}

describe("useTodoStore", () => {
  it("adds a todo", () => {
    const { result } = renderHook(useTodoStore);
    result.addTodo("Learn Solid");
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0].text).toBe("Learn Solid");
    expect(result.todos[0].done).toBe(false);
  });

  it("toggles a todo", () => {
    const { result } = renderHook(useTodoStore);
    result.addTodo("Test stores");
    result.toggleTodo(result.todos[0].id);
    expect(result.todos[0].done).toBe(true);
    result.toggleTodo(result.todos[0].id);
    expect(result.todos[0].done).toBe(false);
  });

  it("removes a todo", () => {
    const { result } = renderHook(useTodoStore);
    result.addTodo("First");
    result.addTodo("Second");
    result.removeTodo(result.todos[0].id);
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0].text).toBe("Second");
  });

  it("updates todo text", () => {
    const { result } = renderHook(useTodoStore);
    result.addTodo("Old text");
    result.updateText(result.todos[0].id, "New text");
    expect(result.todos[0].text).toBe("New text");
  });
});
```

### Testing produce / reconcile

```ts
import { renderHook } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { createStore, produce, reconcile } from "solid-js/store";

describe("produce", () => {
  it("mutates store immutably inside produce", () => {
    const [state, setState] = createStore({
      items: [{ id: 1, name: "A" }],
    });

    // Using produce for mutable-style updates
    setState(
      "items",
      produce((items) => {
        items.push({ id: 2, name: "B" });
        items[0].name = "A-updated";
      })
    );

    expect(state.items).toHaveLength(2);
    expect(state.items[0].name).toBe("A-updated");
    expect(state.items[1].name).toBe("B");
  });
});

describe("reconcile", () => {
  it("replaces store data while preserving references where possible", () => {
    const [state, setState] = createStore({
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
    });

    const firstUserRef = state.users[0];

    // reconcile replaces data but tries to keep same-ref objects
    setState(
      "users",
      reconcile([
        { id: 1, name: "Alice Updated" },
        { id: 2, name: "Bob" },
      ])
    );

    expect(state.users[0].name).toBe("Alice Updated");
    // reconcile preserves referential stability for unchanged objects
    // (depending on key matching strategy)
    expect(state.users[1].name).toBe("Bob");
  });

  it("reconcile with key function", () => {
    const [state, setState] = createStore({
      items: [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
      ],
    });

    setState(
      "items",
      reconcile(
        [
          { id: "a", value: 10 },
          { id: "b", value: 2 },
        ],
        { key: "id" }
      )
    );

    expect(state.items[0].value).toBe(10);
    expect(state.items[1].value).toBe(2);
  });
});
```

### Testing Nested Store Paths

```ts
import { renderHook } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { createStore } from "solid-js/store";

describe("nested store mutations", () => {
  it("updates deeply nested properties", () => {
    const [state, setState] = createStore({
      user: {
        profile: {
          name: "Alice",
          settings: { theme: "dark", notifications: true },
        },
      },
    });

    // Deep path update
    setState("user", "profile", "settings", "theme", "light");
    expect(state.user.profile.settings.theme).toBe("light");

    // Object replacement at a path
    setState("user", "profile", "settings", { theme: "auto", notifications: false });
    expect(state.user.profile.settings.theme).toBe("auto");
    expect(state.user.profile.settings.notifications).toBe(false);
  });

  it("uses functional updates", () => {
    const [state, setState] = createStore({
      counters: [0, 0, 0] as number[],
    });

    setState("counters", 1, (prev) => prev + 5);
    expect(state.counters).toEqual([0, 5, 0]);

    setState("counters", (prev) => prev.map((c) => c * 2));
    expect(state.counters).toEqual([0, 10, 0]);
  });
});
```

---

## Benchmarking

### bench() from Vitest

Vitest provides `bench()` to compare performance of different implementations.

```ts
import { describe, bench } from "vitest";
import { For, Index, createSignal } from "solid-js";
import { render, cleanup } from "@solidjs/testing-library";

const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

describe("For vs Index benchmark", () => {
  bench("For component with 1000 items", async () => {
    const disposer = render(() => (
      <ul>
        <For each={items}>
          {(item) => <li>{item.name}</li>}
        </For>
      </ul>
    ));
    disposer.unmount();
  });

  bench("Index component with 1000 items", async () => {
    const disposer = render(() => (
      <ul>
        <Index each={items}>
          {(item) => <li>{item().name}</li>}
        </Index>
      </ul>
    ));
    disposer.unmount();
  });
});
```

### Signal Write Benchmark

```ts
import { describe, bench } from "vitest";
import { createSignal, createMemo, batch } from "solid-js";
import { createRoot } from "solid-js";

describe("Signal update patterns", () => {
  bench("individual signal updates", () => {
    createRoot(() => {
      const [a, setA] = createSignal(0);
      const [b, setB] = createSignal(0);
      const [c, setC] = createSignal(0);

      setA(1);
      setB(2);
      setC(3);
    });
  });

  bench("batched signal updates", () => {
    createRoot(() => {
      const [a, setA] = createSignal(0);
      const [b, setB] = createSignal(0);
      const [c, setC] = createSignal(0);

      batch(() => {
        setA(1);
        setB(2);
        setC(3);
      });
    });
  });

  bench("memo computation", () => {
    createRoot(() => {
      const [a, setA] = createSignal(1);
      const [b, setB] = createSignal(2);
      const sum = createMemo(() => a() + b());
      setA(10);
      sum(); // Force evaluation
    });
  });
});
```

Run benchmarks with:

```bash
npx vitest bench
```

---

## Coverage

### @vitest/coverage-v8 Setup

```bash
npm install -D @vitest/coverage-v8
```

### vitest.config.ts with Coverage

```ts
import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/types.ts",
        "src/**/__tests__/**",
      ],
      // Thresholds to enforce
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
npx open-cli coverage/index.html

# Check coverage in CI (fails if below thresholds)
npx vitest run --coverage
```

### Coverage for SolidJS-Specific Code

```ts
// vitest.config.ts - include JSX/TSX files in coverage
coverage: {
  include: [
    "src/components/**/*.{ts,tsx}",
    "src/hooks/**/*.ts",
    "src/stores/**/*.ts",
    "src/directives/**/*.ts",
  ],
  // SolidJS generates some code that shouldn't be covered
  exclude: [
    "src/**/*.test.{ts,tsx}",
    "src/**/*.stories.{ts,tsx}",
    "src/app.tsx",        // Root app component
    "src/routes/**/*.tsx", // Route definitions (tested via integration)
  ],
}
```

---

## Common Patterns

### Testing Conditional Rendering with Show

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { createSignal, Show } from "solid-js";

function TogglePanel() {
  const [visible, setVisible] = createSignal(false);
  return (
    <div>
      <button onClick={() => setVisible((v) => !v)}>
        {visible() ? "Hide" : "Show"}
      </button>
      <Show when={visible()}>
        <div data-testid="panel">Secret content</div>
      </Show>
      <Show when={visible()} fallback={<p>Panel is hidden</p>}>
        <p>Panel is visible</p>
      </Show>
    </div>
  );
}

describe("Show conditional rendering", () => {
  it("toggles panel visibility", async () => {
    const user = userEvent.setup();
    render(() => <TogglePanel />);

    // Initially hidden
    expect(screen.queryByTestId("panel")).not.toBeInTheDocument();
    expect(screen.getByText("Panel is hidden")).toBeInTheDocument();

    // Show
    await user.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByTestId("panel")).toBeInTheDocument();
    expect(screen.getByText("Panel is visible")).toBeInTheDocument();

    // Hide
    await user.click(screen.getByRole("button", { name: /hide/i }));
    expect(screen.queryByTestId("panel")).not.toBeInTheDocument();
    expect(screen.getByText("Panel is hidden")).toBeInTheDocument();
  });
});
```

### Testing List Rendering with For

```ts
import { render, screen, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { createSignal, For } from "solid-js";

function TodoApp() {
  const [todos, setTodos] = createSignal([
    { id: 1, text: "Learn Solid", done: false },
    { id: 2, text: "Write tests", done: false },
    { id: 3, text: "Ship it", done: false },
  ]);

  const toggle = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const remove = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ul aria-label="Todo list">
      <For each={todos()}>
        {(todo) => (
          <li data-testid={`todo-${todo.id}`}>
            <span style={{ "text-decoration": todo.done ? "line-through" : "none" }}>
              {todo.text}
            </span>
            <button onClick={() => toggle(todo.id)}>Toggle</button>
            <button onClick={() => remove(todo.id)}>Delete</button>
          </li>
        )}
      </For>
    </ul>
  );
}

describe("For list rendering", () => {
  it("renders all items", () => {
    render(() => <TodoApp />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByText("Learn Solid")).toBeInTheDocument();
  });

  it("toggles an item", async () => {
    const user = userEvent.setup();
    render(() => <TodoApp />);

    const firstItem = screen.getByTestId("todo-1");
    const toggleBtn = within(firstItem).getByRole("button", { name: /toggle/i });
    await user.click(toggleBtn);

    const textSpan = within(firstItem).getByText("Learn Solid");
    expect(textSpan).toHaveStyle("text-decoration: line-through");
  });

  it("removes an item", async () => {
    const user = userEvent.setup();
    render(() => <TodoApp />);

    const deleteBtn = within(screen.getByTestId("todo-2")).getByRole("button", { name: /delete/i });
    await user.click(deleteBtn);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("Write tests")).not.toBeInTheDocument();
  });

  it("keyed For preserves DOM on reorder", () => {
    // For is keyed by default (uses each item's reference or index)
    // This means items are reused, not recreated, when the list changes
    const { container } = render(() => <TodoApp />);
    const firstLi = container.querySelector("li");
    expect(firstLi?.textContent).toContain("Learn Solid");
  });
});
```

### Testing Error Boundaries

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary, createSignal, JSX, Show } from "solid-js";

function BuggyComponent(props: { shouldThrow: boolean }) {
  if (props.shouldThrow) {
    throw new Error("Component crashed!");
  }
  return <p>All good</p>;
}

function App() {
  const [shouldThrow, setShouldThrow] = createSignal(false);
  return (
    <div>
      <button onClick={() => setShouldThrow(true)}>Crash</button>
      <ErrorBoundary
        fallback={(err, reset) => (
          <div role="alert">
            <p>Error: {err.message}</p>
            <button onClick={reset}>Retry</button>
          </div>
        )}
      >
        <BuggyComponent shouldThrow={shouldThrow()} />
      </ErrorBoundary>
    </div>
  );
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(() => <App />);
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders fallback when child throws", async () => {
    const user = userEvent.setup();
    render(() => <App />);

    await user.click(screen.getByRole("button", { name: /crash/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/error: component crashed/i)).toBeInTheDocument();
    expect(screen.queryByText("All good")).not.toBeInTheDocument();
  });

  it("can retry after error", async () => {
    const user = userEvent.setup();
    const [shouldThrow, setShouldThrow] = createSignal(true);

    render(() => (
      <ErrorBoundary
        fallback={(err, reset) => (
          <button
            onClick={() => {
              setShouldThrow(false);
              reset();
            }}
          >
            Retry
          </button>
        )}
      >
        <BuggyComponent shouldThrow={shouldThrow()} />
      </ErrorBoundary>
    ));

    // Error state
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();

    // Retry
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});
```

### Testing Event Delegation vs Native Events

SolidJS uses event delegation for common events (click, input, etc.) — handlers are attached at the document root, not on individual elements. This is transparent in most tests, but can matter for `stopPropagation`.

```ts
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

function DelegationDemo() {
  const onOuter = vi.fn();
  const onInner = vi.fn();

  // Solid attaches click handlers at the document root via delegation
  // stopPropagation still works correctly
  return (
    <div data-testid="outer" onClick={onOuter}>
      <button
        data-testid="inner"
        onClick={(e) => {
          e.stopPropagation();
          onInner();
        }}
      >
        Click me
      </button>
    </div>
  );
}

describe("event delegation", () => {
  it("stopPropagation prevents parent handler", async () => {
    const user = userEvent.setup();

    const onOuter = vi.fn();
    const onInner = vi.fn();

    render(() => (
      <div data-testid="outer" onClick={onOuter}>
        <button
          data-testid="inner"
          onClick={(e) => {
            e.stopPropagation();
            onInner();
          }}
        >
          Click me
        </button>
      </div>
    ));

    await user.click(screen.getByTestId("inner"));
    expect(onInner).toHaveBeenCalledTimes(1);
    expect(onOuter).not.toHaveBeenCalled();
  });

  it("delegated events bubble to parent by default", async () => {
    const user = userEvent.setup();
    const onOuter = vi.fn();
    const onInner = vi.fn();

    render(() => (
      <div data-testid="outer" onClick={onOuter}>
        <button data-testid="inner" onClick={onInner}>Click me</button>
      </div>
    ));

    await user.click(screen.getByTestId("inner"));
    expect(onInner).toHaveBeenCalledTimes(1);
    expect(onOuter).toHaveBeenCalledTimes(1);
  });

  it("native (non-delegated) events work with on: prefix", async () => {
    const user = userEvent.setup();
    const onNativeClick = vi.fn();

    // Using on:click (lowercase, with colon) attaches a native listener
    render(() => (
      <button data-testid="native-btn" on:click={onNativeClick}>
        Native
      </button>
    ));

    await user.click(screen.getByTestId("native-btn"));
    expect(onNativeClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Refs and DOM Access

```ts
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import { createSignal, onMount, onCleanup, JSX, createEffect, ref } from "solid-js";

function AutoFocusInput() {
  let inputRef!: HTMLInputElement;

  onMount(() => {
    inputRef.focus();
  });

  return <input ref={inputRef} type="text" aria-label="Auto-focused" />;
}

function MeasureElement() {
  let divRef!: HTMLDivElement;
  const [width, setWidth] = createSignal(0);

  onMount(() => {
    // In jsdom, offsetWidth is 0 by default
    setWidth(divRef.offsetWidth);
  });

  return (
    <div>
      <div ref={divRef} data-testid="measured" style={{ width: "200px" }}>
        Content
      </div>
      <span data-testid="width">Width: {width()}</span>
    </div>
  );
}

function CallbackRef() {
  const [refEl, setRefEl] = createSignal<HTMLElement | null>(null);

  createEffect(() => {
    if (refEl()) {
      refEl()!.setAttribute("data-custom", "true");
    }
  });

  return <div ref={setRefEl}>Callback ref</div>;
}

describe("refs and DOM access", () => {
  it("auto-focuses input on mount", () => {
    render(() => <AutoFocusInput />);
    const input = screen.getByRole("textbox", { name: /auto-focused/i });
    expect(input).toHaveFocus();
  });

  it("measures element on mount", () => {
    render(() => <MeasureElement />);
    // jsdom returns 0 for offsetWidth
    expect(screen.getByTestId("width")).toHaveTextContent("Width: 0");
  });

  it("uses callback ref pattern", () => {
    render(() => <CallbackRef />);
    expect(screen.getByText("Callback ref")).toHaveAttribute("data-custom", "true");
  });

  it("accesses ref after user interaction", async () => {
    let inputRef!: HTMLInputElement;
    const user = userEvent.setup();

    render(() => (
      <div>
        <input
          ref={inputRef}
          type="text"
          aria-label="Test input"
        />
        <button
          onClick={() => {
            inputRef.value = "Set via ref";
            inputRef.dispatchEvent(new Event("input", { bubbles: true }));
          }}
        >
          Fill
        </button>
      </div>
    ));

    await user.click(screen.getByRole("button", { name: /fill/i }));
    expect(screen.getByRole("textbox", { name: /test input/i })).toHaveValue("Set via ref");
  });
});
```

---

## Quick Reference

| What | Tool | Key API |
|------|------|---------|
| Component test | `@solidjs/testing-library` | `render(() => <Comp />)` |
| Queries | `@testing-library/dom` | `screen.getByRole`, `findByText`, `queryByTestId` |
| User events | `@testing-library/user-event` | `userEvent.setup()` |
| Directives | `@solidjs/testing-library` | `renderDirective(dir, initialArg)` |
| Hooks/Signals | `@solidjs/testing-library` | `renderHook(() => useMyHook())` |
| Fake timers | `vitest` | `vi.useFakeTimers()`, `vi.advanceTimersByTime()` |
| Mocking | `vitest` | `vi.fn()`, `vi.spyOn()`, `vi.mock()` |
| Routes | `@solidjs/router` | `render(() => <App />, { location: "/path" })` |
| Portals | `solid-js` | Use `screen` queries (not container) |
| Coverage | `@vitest/coverage-v8` | `vitest run --coverage` |
| Benchmarks | `vitest` | `bench("name", () => { ... })` |
