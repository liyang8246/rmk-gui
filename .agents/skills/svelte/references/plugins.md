# Svelte AI Plugins

Plugins bundle the MCP server, skills, and subagent into a single installable package for various AI tools. If you don't want to use plugins, you can still access all the same functionality via the CLI — see `cli-reference.md`.

## Claude Code

The `sveltejs/ai-tools` repository is a Claude Code plugin marketplace.

### Installation

```bash
/plugin marketplace add sveltejs/ai-tools
/plugin install svelte
```

The plugin gives you the remote MCP server, skills, and a specialized agent for editing Svelte files.

## OpenCode

Published as `@sveltejs/opencode`.

### Installation

With OpenCode 1.3.4 or newer:

```bash
opencode plugin @sveltejs/opencode
```

Or add to config:

```json
{
	"$schema": "https://opencode.ai/config.json",
	"plugin": ["@sveltejs/opencode"]
}
```

### TUI Configuration

Add `@sveltejs/opencode` to `tui.json`:

```json
{
	"$schema": "https://opencode.ai/tui.json",
	"plugin": ["@sveltejs/opencode"]
}
```

Run `/svelte-plugin` or select 'Configure Svelte plugin' from the command palette.

### Configuration

Config files: `.opencode/svelte.json` (local) or `~/.config/opencode/svelte.json` (global).

```json
{
	"$schema": "https://svelte.dev/opencode/schema.json",
	"mcp": {
		"type": "remote",
		"enabled": true
	},
	"subagent": {
		"enabled": true,
		"agents": {
			"svelte-file-editor": {
				"model": "<other-model>",
				"temperature": 1,
				"top_p": 0.7,
				"maxSteps": 20
			}
		}
	},
	"skills": {
		"enabled": true
	},
	"instructions": {
		"enabled": true
	},
	"autoupdate": true
}
```

### Automatic updates

The plugin checks npm for newer versions and warns when one is available. Automatic updates are enabled by default — after detecting a newer version, the plugin removes itself from cache on shutdown, and OpenCode installs the latest version on next start. Set `"autoupdate": false` to only receive warnings.

## Cursor

Install from the Cursor Marketplace:

```bash
/add-plugin svelte
```

Plugins can be installed for the current project or at user level. The plugin gives you:
- Remote Svelte MCP server (from `.mcp.json`)
- Rules and skills in Cursor's rules UI
- `svelte-file-editor` agent in chat

> The Cursor CLI does not support plugins yet. Plugin support in Cloud Agents is limited to MCP servers.

## GitHub Copilot CLI

The `sveltejs/ai-tools` repository is a GitHub Copilot CLI plugin marketplace.

### Installation

In VS Code, run 'Install plugin from source' with the repository URL:

```
https://github.com/sveltejs/ai-tools
```

Or from Copilot CLI:

```bash
copilot plugin marketplace add sveltejs/ai-tools
copilot plugin install svelte@ai-tools
```

Or from an interactive session:

```
/plugin marketplace add sveltejs/ai-tools
/plugin install svelte@ai-tools
```

## Codex CLI

The `sveltejs/ai-tools` repository is a Codex CLI plugin marketplace.

### Installation

```bash
codex plugin marketplace add sveltejs/ai-tools
```

Then open the plugin directory from an interactive session:

```bash
codex
/plugins
```

Choose the Svelte marketplace, select the `svelte` plugin, and install it.

Codex can read the repository's legacy-compatible `.claude-plugin/marketplace.json` file, so the same marketplace source works for both Claude Code and Codex CLI.
