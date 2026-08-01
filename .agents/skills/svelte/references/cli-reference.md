# @sveltejs/mcp CLI Reference

The `@sveltejs/mcp` npm package normally launches the local `stdio` MCP server:

```bash
npx -y @sveltejs/mcp
```

When invoked with a subcommand, it behaves like a regular CLI and prints the result directly in your terminal. This is useful for agents, scripts, and quick manual checks — and it works without any MCP client.

## Usage

```bash
npx -y @sveltejs/mcp <command> [options]
```

Available commands:
- `list-sections`
- `get-documentation <sections>`
- `svelte-autofixer <code_or_path>`

## Help and Version

```bash
npx -y @sveltejs/mcp --help
npx -y @sveltejs/mcp <command> --help
npx -y @sveltejs/mcp --version
```

## list-sections

Lists all available Svelte and SvelteKit documentation sections.

```bash
npx -y @sveltejs/mcp list-sections
```

The output is a structured text list of sections, including each section's title, `use_cases`, and documentation path. This is the same catalog the MCP tool uses before calling `get-documentation`.

> The full catalog is also available in `docs-catalog.md` so you can skip this call when you already know the section you need.

## get-documentation

Fetches the full documentation for one or more sections.

```bash
npx -y @sveltejs/mcp get-documentation 'svelte/$state'
# or multiple sections
npx -y @sveltejs/mcp get-documentation 'svelte/$state,svelte/await-expressions'
```

Each section can be matched by title or by documentation path. If a section cannot be found, the CLI returns an error plus similar matches when available.

## svelte-autofixer

Runs the Svelte autofixer against either inline code or a file path:

```bash
npx -y @sveltejs/mcp svelte-autofixer 'src/routes/+page.svelte'
```

If the argument is an existing path, the CLI reads the file automatically. Otherwise it treats the argument as raw Svelte code.

Because most shells expand `$`, inline code should be quoted or escaped correctly. In practice, passing a file path is usually easier than passing source directly.

### Options

- `--svelte-version <4|5>` — choose which Svelte version to validate against (defaults to `5`)
- `--async` — enable async Svelte analysis for Svelte 5 projects

### Output

The command prints an object with:
- `issues`
- `suggestions`
- `require_another_tool_call_after_fixing`

### Agentic Loop

This output structure makes it easy to use in an agentic loop: run the autofixer, apply fixes, then run it again until it reports no remaining issues or suggestions.

```bash
# Example loop:
# 1. Write code to file
# 2. Run autofixer on file
# 3. Read issues/suggestions
# 4. Fix all issues
# 5. Re-run autofixer
# 6. Repeat until require_another_tool_call_after_fixing is false
```
