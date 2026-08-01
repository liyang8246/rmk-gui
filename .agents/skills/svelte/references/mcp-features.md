# MCP Server Features: Tools, Resources, and Prompts

The Svelte MCP server provides tools, resources, and prompts that pull from official Svelte documentation. When using the CLI instead of the MCP server, the same tools are available as CLI subcommands (see `cli-reference.md`).

## Tools

Tools are invoked by the LLM during a session.

### list-sections

Provides a list of all available documentation sections. Returns a structured list with titles, use_cases, and paths.

**CLI equivalent:**
```bash
npx @sveltejs/mcp list-sections
```

The full catalog is also embedded in `docs-catalog.md` so you can skip this call when you already know the section you need.

### get-documentation

Allows the model to get the full (and up-to-date) documentation for the requested sections directly from svelte.dev/docs.

**CLI equivalent:**
```bash
npx @sveltejs/mcp get-documentation 'svelte/$state,svelte/$derived'
```

### svelte-autofixer

Uses static analysis to provide suggestions for code that the LLM generates. Can be invoked in an agentic loop until all issues and suggestions are resolved.

**CLI equivalent:**
```bash
npx @sveltejs/mcp svelte-autofixer ./src/lib/Component.svelte
```

### playground-link

Generates an ephemeral playground link with the generated code. Useful when generated code is not written to a file and you want to quickly test it. The code is not stored anywhere except the URL itself.

> This tool is only available through the MCP server, not the CLI. If you need a playground link without the MCP server, construct it manually at https://svelte.dev/playground.

## Resources

Resources are included by the user (not by the LLM) and are useful if you want to include specific knowledge in your session. For example, if you know that the component will need to use transitions, you can include the transition documentation directly without asking the LLM to do it for you.

### doc-section

This dynamic resource allows you to add every section of the Svelte documentation as a resource. The URI looks like `svelte://slug-of-the-docs.md` and the returned resource contains the `llms.txt` version of the specific page you selected.

## Prompts

Prompts are selected by the user and are sent as a user message. They can be useful to write repetitive instructions for the LLM on how to properly use the MCP server.

### svelte-task

This prompt should be used whenever you are asking the model to work on a Svelte-related task. It instructs the LLM which documentation sections are available, which tools to invoke, when to invoke them, and how to interpret the results.

The full prompt is available in `svelte-task-prompt.md`.
