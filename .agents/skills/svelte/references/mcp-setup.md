# MCP Server Setup

The Svelte MCP (Model Context Protocol) server helps your agent write better Svelte code by providing relevant documentation and statically analyzing generated code to suggest fixes and best practices.

If you don't want to use an MCP server, you can still access all the same tools via the CLI (`references/cli-reference.md`). The MCP server is optional — the CLI provides the same `list-sections`, `get-documentation`, and `svelte-autofixer` capabilities.

## Setup Options

- **Local setup** using `@sveltejs/mcp` (npm package, stdio transport)
- **Remote setup** using `https://mcp.svelte.dev/mcp` (HTTP transport)

## Local Setup

Install via npm or run with npx:

```bash
npx -y @sveltejs/mcp
```

### Claude Code

```bash
claude mcp add -t stdio -s [scope] svelte -- npx -y @sveltejs/mcp
```

The `[scope]` must be `user`, `project`, or `local`.

### Claude Desktop

In Settings > Developer, click Edit Config. Edit `claude_desktop_config.json`:

```json
{
	"mcpServers": {
		"svelte": {
			"command": "npx",
			"args": ["-y", "@sveltejs/mcp"]
		}
	}
}
```

### Codex CLI

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.svelte]
command = "npx"
args = ["-y", "@sveltejs/mcp"]
```

### Copilot CLI

```bash
/mcp add
```

Or create/edit `~/.copilot/mcp-config.json`:

```json
{
	"mcpServers": {
		"svelte": {
			"command": "npx",
			"args": ["-y", "@sveltejs/mcp"]
		}
	}
}
```

### Antigravity CLI

Create/edit `~/.gemini/config/mcp_config.json`:

```json
{
	"mcpServers": {
		"svelte": {
			"command": "npx",
			"args": ["-y", "@sveltejs/mcp"]
		}
	}
}
```

### OpenCode

```bash
opencode mcp add
```

Select 'Local' under 'Select MCP server type', then enter `npx -y @sveltejs/mcp` as the command.

### VS Code

1. Open command palette
2. Select "MCP: Add Server..."
3. Select "Command (stdio)"
4. Insert `npx -y @sveltejs/mcp` and press Enter
5. Name it `svelte`
6. Choose Global or Workspace

### Cursor

1. Open command palette
2. Select "View: Open MCP Settings"
3. Click "Add custom MCP"

```json
{
	"mcpServers": {
		"svelte": {
			"command": "npx",
			"args": ["-y", "@sveltejs/mcp"]
		}
	}
}
```

### Zed

Install the Svelte MCP Server extension, or configure manually:

1. Open command palette
2. Search "agent:open settings"
3. Find MCP Servers section
4. Click "Add Server" > "Add Custom Server"

```json
{
	"svelte": {
		"command": "npx",
		"args": ["-y", "@sveltejs/mcp"]
	}
}
```

### Other clients

Use `npx` as the command and `-y @sveltejs/mcp` as the arguments for stdio servers.

## Remote Setup

The remote MCP server is available at `https://mcp.svelte.dev/mcp`.

### Claude Code

```bash
claude mcp add -t http -s [scope] svelte https://mcp.svelte.dev/mcp
```

### Claude Desktop

1. Open Settings > Connectors
2. Click Add Custom Connector
3. Name: `svelte`
4. URL: `https://mcp.svelte.dev/mcp`
5. Click Add

### Codex CLI

Add to `~/.codex/config.toml`:

```toml
experimental_use_rmcp_client = true
[mcp_servers.svelte]
url = "https://mcp.svelte.dev/mcp"
```

### Copilot CLI

```bash
/mcp add
```

Or create/edit `~/.copilot/mcp-config.json`:

```json
{
	"mcpServers": {
		"svelte": {
			"url": "https://mcp.svelte.dev/mcp"
		}
	}
}
```

### Antigravity CLI

Create/edit `~/.gemini/config/mcp_config.json`:

```json
{
	"mcpServers": {
		"svelte": {
			"url": "https://mcp.svelte.dev/mcp"
		}
	}
}
```

### OpenCode

```bash
opencode mcp add
```

Select 'Remote', enter `https://mcp.svelte.dev/mcp` as the URL.

### VS Code

1. Open command palette
2. Select "MCP: Add Server..."
3. Select "HTTP (HTTP or Server-Sent-Events)"
4. Insert `https://mcp.svelte.dev/mcp`
5. Name it `svelte`
6. Choose Global or Workspace

### Cursor

1. Open command palette
2. Select "View: Open MCP Settings"
3. Click "Add custom MCP"

```json
{
	"mcpServers": {
		"svelte": {
			"url": "https://mcp.svelte.dev/mcp"
		}
	}
}
```

### GitHub Coding Agent

1. Open repository Settings
2. Go to Copilot > Coding agent
3. Edit MCP configuration:

```json
{
	"mcpServers": {
		"svelte": {
			"type": "http",
			"url": "https://mcp.svelte.dev/mcp",
			"tools": ["*"]
		}
	}
}
```

4. Click Save MCP configuration

### Other clients

Use `https://mcp.svelte.dev/mcp` as the URL for remote servers.
