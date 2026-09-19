# Industrial-Loading-system
## Claude Code MCP servers

This repo ships a project-scoped `.mcp.json` so any Claude Code session (local or cloud) gets the same tools:

| Server | What it provides | Setup |
|---|---|---|
| `filesystem` | Read/write/search files under the repo root | None (runs via `npx`) |
| `memory` | Persistent knowledge graph across sessions | None. Stored in `.claude/mcp-memory.json` (git-ignored). Override with `MEMORY_FILE_PATH`. |
| `github` | Issues, PRs, code search via GitHub's remote MCP server | Export `GITHUB_PERSONAL_ACCESS_TOKEN` in your shell before starting Claude Code. |

`.claude/settings.json` sets `enableAllProjectMcpServers` so these load without a per-server approval prompt.
Check status inside a session with `/mcp`.

## Claude Code skills and commands (Continuum plugin)

`.claude/settings.json` registers the private marketplace `KezzyWezzy/continuum-plugin` and enables its `continuum` plugin.
When you trust this project folder, Claude Code installs it automatically. Skills load by description and commands are
namespaced, for example `/continuum:bid`, `/continuum:cad`, `/continuum:pre-eng`. Run `/plugin` to see status.
Access to the private repo is required, so sign in to git with an account that can read it.
