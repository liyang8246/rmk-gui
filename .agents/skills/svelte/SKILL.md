---
name: svelte
description: Svelte 5 development — runes, components, CLI tools, and best practices. Use when creating, editing, or analyzing any .svelte file or .svelte.ts/.svelte.js module, when working with Svelte 5 runes ($state, $derived, $effect, $props, $bindable), when needing Svelte/SvelteKit documentation lookup or code validation via the @sveltejs/mcp CLI, or when asked about Svelte best practices. Also triggers for SvelteKit routing, data loading, form actions, adapters, deployment, stores, context, transitions, or Svelte 4-to-5 migration. Covers the full Svelte AI toolchain (CLI, MCP server, skills, subagents, plugins) as reference material.
---

# Svelte 5 Development Skill

This skill provides everything needed to write correct, modern Svelte 5 code without requiring an MCP server or plugin installation. It bundles the official Svelte AI documentation, CLI tool access, best practices, and a complete documentation catalog.

## CLI Tools (Standalone — No MCP Required)

The `@sveltejs/mcp` npm package provides CLI commands that work directly in your terminal via `npx`. These are the primary tools for documentation lookup and code validation when you don't use an MCP server. The `-y` flag skips the interactive confirmation prompt — important for automated contexts.

Note: MCP tool names use underscores (`get_documentation`, `svelte_autofixer`) while CLI subcommands use hyphens (`get-documentation`, `svelte-autofixer`). This skill always uses the CLI form with hyphens.

### List documentation sections

```bash
npx -y @sveltejs/mcp list-sections
```

Lists all available Svelte 5 and SvelteKit documentation sections with titles, use cases, and paths. The full catalog is also available in `references/docs-catalog.md` so you can skip this call when you already know the section you need.

### Get documentation

```bash
npx -y @sveltejs/mcp get-documentation "<section1>,<section2>,..."
```

Retrieves full documentation for specified sections. Each section can be matched by title or path.

```bash
npx -y @sveltejs/mcp get-documentation "$state,$derived,$effect"
npx -y @sveltejs/mcp get-documentation "svelte/$state,svelte/await-expressions"
npx -y @sveltejs/mcp get-documentation "kit/routing,kit/load"
```

### Svelte autofixer

```bash
npx -y @sveltejs/mcp svelte-autofixer "<code_or_path>" [options]
```

Analyzes Svelte code and returns issues plus suggestions. Pass a file path (preferred) or inline code.

**Options:**
- `--async` — enable async Svelte analysis (default: false)
- `--svelte-version <4|5>` — target version (default: 5)

```bash
# Analyze a file (preferred)
npx -y @sveltejs/mcp svelte-autofixer ./src/lib/Component.svelte

# Analyze inline code (escape $ as \$ in most shells)
npx -y @sveltejs/mcp svelte-autofixer '<script>let count = \$state(0);</script>'

# Target Svelte 4
npx -y @sveltejs/mcp svelte-autofixer ./Component.svelte --svelte-version 4
```

The output includes `issues`, `suggestions`, and `require_another_tool_call_after_fixing`. Run it in a loop: fix issues, re-run, repeat until clean.

**Important:** When passing code with runes (`$state`, `$derived`, etc.) via the terminal, escape the `$` character as `\$` to prevent shell variable substitution. Passing a file path avoids this issue entirely.

### Other CLI commands

```bash
npx -y @sveltejs/mcp --help
npx -y @sveltejs/mcp <command> --help
npx -y @sveltejs/mcp --version
```

## Workflow

1. **Uncertain about syntax?** Check the best practices section below, or run `get-documentation` with the relevant section path from `references/docs-catalog.md`.
2. **Writing or editing Svelte code?** Follow the best practices below, then validate with `svelte-autofixer` before finalizing.
3. **Always validate** — run `svelte-autofixer` on any Svelte component or module before considering it done. Fix all reported issues and re-run until clean.
4. **Not writing to a file?** After finalizing code, ask the user if they want a Svelte Playground link. The CLI doesn't generate playground links, but you can construct one manually if needed.

## Best Practices

These are the core rules for writing fast, robust, modern Svelte 5 code. For the full detailed guide with code examples, read `references/best-practices.md`.

### $state
Only use `$state` for variables that should be reactive — ones that cause an `$effect`, `$derived`, or template expression to update. Everything else can be a normal variable.

Objects and arrays (`$state({...})` or `$state([...])`) are deeply reactive — mutations trigger updates. This has a performance cost because the objects must be proxied. For large objects that are only reassigned (not mutated), use `$state.raw` instead. API responses often fall into this category.

### $derived
Use `$derived` (not `$effect`) to compute values from state:

```js
// do this
let square = $derived(num * num);

// don't do this
let square;
$effect(() => { square = num * num; });
```

`$derived` takes an expression, not a function. Use `$derived.by` when you need a function body. Derived values are writable — you can assign to them.

### $effect
Effects are an escape hatch — avoid them when possible, especially avoid updating state inside effects.

- Sync state to an external library (like D3)? Use `{@attach ...}` — usually cleaner.
- Run code in response to user interaction? Put it directly in an event handler.
- Log values for debugging? Use `$inspect`.
- Observe something external to Svelte? Use `createSubscriber` from `svelte/reactivity`.

Never wrap effect contents in `if (browser) {...}` — effects don't run on the server.

### $props
Treat props as though they will change. Values depending on props should use `$derived`:

```js
let { type } = $props();
// do this — color updates when type changes
let color = $derived(type === 'danger' ? 'red' : 'green');
// don't do this — color won't update
let color = type === 'danger' ? 'red' : 'green';
```

### $inspect.trace
If something isn't updating properly or runs more than expected, add `$inspect.trace(label)` as the first line of an `$effect` or `$derived.by` to trace dependencies and find what triggered the update.

### Events
Any element attribute starting with `on` is an event listener: `onclick`, `onkeydown`, etc. Attribute shorthand and spread attributes also work.

For `window` or `document` listeners, use `<svelte:window>` and `<svelte:document>` — avoid `onMount` or `$effect` for this.

### Snippets
Snippets are reusable markup blocks, instantiated with `{@render ...}`. They must be declared within the template. Read `references/snippet.md` and `references/render.md` for full details.

### Each blocks
Prefer keyed each blocks — `{#each items as item (item.id)}` — so Svelte can surgically insert/remove items. Keys must uniquely identify each item; never use the index as a key. Avoid destructuring if you need to mutate the item (e.g., `bind:value={item.count}`). Read `references/each.md` for details.

### CSS + JavaScript variables
Use the `style:` directive to set CSS custom properties from JS:

```svelte
<div style:--columns={columns}>...</div>
```

Then reference `var(--columns)` in the component's `<style>`.

### Styling child components
Component `<style>` is scoped. For parent-controlled child styling, prefer CSS custom properties (`<Child --color="red" />`). If impossible (e.g., library component), use `:global` overrides.

### Context
Prefer context over shared modules for state — it scopes state to the part of the app that needs it and prevents SSR leaks between users. Use `createContext` rather than `setContext`/`getContext` for type safety.

### Async Svelte (5.36+)
You can use `await` in `<script>`, `$derived(...)`, and markup. Requires `experimental.async` in `svelte.config.js`. Read `references/await-expressions.md` and `references/hydratable.md`.

### Avoid legacy features
Always use runes mode for new code:
- `$state` instead of implicit reactivity
- `$derived` and `$effect` instead of `$:` assignments
- `$props` instead of `export let`, `$$props`, `$$restProps`
- `onclick={...}` instead of `on:click={...}`
- `{#snippet ...}` and `{@render ...}` instead of `<slot>`, `$$slots`, `<svelte:fragment>`
- `<DynamicComponent>` instead of `<svelte:component this={...}>`
- `import Self from './ThisComponent.svelte'` instead of `<svelte:self>`
- Classes with `$state` fields instead of stores for shared reactivity
- `{@attach ...}` instead of `use:action`
- clsx-style arrays/objects in `class` attributes instead of `class:` directive

## Reference Files

Read these on demand when you need deeper information:

| File | When to read |
|------|-------------|
| `references/best-practices.md` | Full best practices guide with all code examples |
| `references/docs-catalog.md` | Complete list of all Svelte/SvelteKit documentation sections and paths — use to find the right section for `get-documentation` |
| `references/svelte-task-prompt.md` | The complete svelte-task prompt, AGENTS.md instructions, and subagent definition — useful for understanding the intended agent workflow |
| `references/cli-reference.md` | Full CLI reference for `@sveltejs/mcp` |
| `references/attach.md` | `{@attach ...}` directive — replacing `use:action`, DOM manipulation, third-party library integration |
| `references/await-expressions.md` | Async `await` in components (experimental, 5.36+) |
| `references/bind.md` | Function bindings `bind:value={get, set}` (5.9+) |
| `references/each.md` | Keyed each blocks and destructuring patterns |
| `references/hydratable.md` | `hydratable()` for SSR data serialization |
| `references/inspect.md` | `$inspect` and `$inspect.trace` debugging tools |
| `references/render.md` | `{@render ...}` tag for snippet instantiation |
| `references/snippet.md` | `{#snippet ...}` — creating reusable markup, passing to components, typing, exporting |
| `references/svelte-reactivity.md` | `createSubscriber` for integrating external event-based systems with Svelte reactivity |
| `references/mcp-setup.md` | MCP server overview + local and remote setup for all clients (Claude Code, Cursor, VS Code, Zed, etc.) |
| `references/mcp-features.md` | MCP tools, resources, and prompts reference |
| `references/plugins.md` | Plugin installation for Claude Code, OpenCode, Cursor, GitHub Copilot CLI, Codex CLI |
