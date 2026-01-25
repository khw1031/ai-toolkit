# add-ai-tools

Install AI agent resources (Skills, Rules, Agents) from various sources with a single command.

## Installation

```bash
npm install -g add-ai-tools
```

## Quick Start

### Install from GitHub

```bash
# Using GitHub shorthand
npx add-ai-tools owner/repo

# Using GitHub URL
npx add-ai-tools https://github.com/owner/repo

# Install specific resource
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/my-skill
```

### Interactive Mode

```bash
npx add-ai-tools
```

Follow the prompts to select agent, resource type, and resources to install.

### Export as ZIP

```bash
# Export from GitHub source (with prompts)
npx add-ai-tools owner/repo --zip

# Interactive source input
npx add-ai-tools --zip

# Export all resources without prompts
npx add-ai-tools owner/repo --zip -y
```

## Supported Sources

| Format | Example |
|--------|---------|
| GitHub shorthand | `owner/repo` |
| GitHub URL | `https://github.com/owner/repo` |
| GitHub URL with path | `https://github.com/owner/repo/tree/main/skills/my-skill` |
| GitLab URL | `https://gitlab.com/owner/repo` |
| Git SSH | `git@github.com:owner/repo.git` |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--agent <agent>` | Target agent (`claude-code`, `cursor`, `github-copilot`, `antigravity`) | `claude-code` |
| `--scope <scope>` | Installation scope (`project`, `global`) | `project` |
| `-y, --yes` | Skip confirmation prompts | `false` |
| `--zip` | Export resources as ZIP | `false` |

## Supported Agents

| Agent | Skills | Rules | Agents |
|-------|:------:|:-----:|:------:|
| Claude Code | ✓ | ✓ | ✓ |
| Cursor | ✓ | ✓ | - |
| GitHub Copilot | ✓ | ✓ | - |
| Antigravity | ✓ | ✓ | - |

## Installation Paths

Resources are installed to the appropriate location for each agent:

| Agent | Project Scope | Global Scope |
|-------|---------------|--------------|
| Claude Code | `.claude/` | `~/.claude/` |
| Cursor | `.cursor/` | `~/.cursor/` |
| GitHub Copilot | `.github/` | `~/.copilot/` |
| Antigravity | `.agent/` | `~/.gemini/antigravity/` |

## Duplicate Handling

When a resource already exists, you can choose to:

- **Skip** - Keep existing file
- **Overwrite** - Replace with new version
- **Rename** - Save as new name (e.g., `skill-2`)
- **Backup** - Backup existing file before replacing
- **Compare** - View diff and decide

Identical content is automatically skipped.

## Examples

```bash
# Install all resources from a repo to Claude Code
npx add-ai-tools vercel-labs/ai-chatbot

# Install to Cursor with global scope
npx add-ai-tools owner/repo --agent cursor --scope global

# Install without prompts
npx add-ai-tools owner/repo -y

# Interactive mode
npx add-ai-tools

# Export resources as ZIP from GitHub
npx add-ai-tools owner/repo --zip

# Export all resources without prompts
npx add-ai-tools owner/repo --zip -y
```

## License

MIT
