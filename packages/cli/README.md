# add-ai-tools

A universal CLI tool for installing AI agent resources (Skills, Rules, Agents) from various sources with a single command.

**[한국어](./README.ko.md)** | **[中文](./README.zh-CN.md)** | **[日本語](./README.ja.md)**

## Overview

`add-ai-tools` simplifies the process of managing AI coding assistant resources. It fetches resources from GitHub or Bitbucket repositories and installs them to the appropriate location for your preferred AI agent.

### Key Features

- **Multi-Source Support** - Install from GitHub, Bitbucket, or Git SSH URLs
- **Multi-Agent Support** - Works with Claude Code, Cursor, GitHub Copilot, and Antigravity
- **Interactive Mode** - Guided prompts for easy resource selection
- **ZIP Export** - Export resources as portable ZIP archives
- **Smart Duplicate Handling** - Skip, overwrite, rename, backup, or compare duplicates
- **Batch Installation** - Install multiple resources at once

## Installation

```bash
# Install globally
npm install -g add-ai-tools

# Or use directly with npx
npx add-ai-tools
```

## Quick Start

### Install from GitHub

```bash
# Using GitHub shorthand
npx add-ai-tools owner/repo

# Using full GitHub URL
npx add-ai-tools https://github.com/owner/repo

# Install specific resource from a path
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/my-skill
```

### Interactive Mode

```bash
npx add-ai-tools
```

The interactive mode guides you through:
1. Selecting your AI agent (Claude Code, Cursor, etc.)
2. Entering the source repository
3. Choosing resource types (Skills, Rules, Agents)
4. Selecting specific resources to install
5. Choosing installation scope (project or global)

### Export as ZIP

```bash
# Export with interactive prompts
npx add-ai-tools owner/repo --zip

# Export all resources without prompts
npx add-ai-tools owner/repo --zip -y
```

## Supported Sources

| Format | Example | Status |
|--------|---------|:------:|
| GitHub shorthand | `owner/repo` | ✓ |
| GitHub URL | `https://github.com/owner/repo` | ✓ |
| GitHub URL with path | `https://github.com/owner/repo/tree/main/skills/my-skill` | ✓ |
| Bitbucket URL | `https://bitbucket.org/workspace/repo` | ✓ |
| Git SSH (GitHub) | `git@github.com:owner/repo.git` | ✓ |
| Git SSH (Bitbucket) | `git@bitbucket.org:owner/repo.git` | ✓ |
| GitLab URL | `https://gitlab.com/owner/repo` | Coming Soon |

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `[source]` | Repository URL or shorthand (optional) | - |
| `--agent <agent>` | Target agent | `claude-code` |
| `--scope <scope>` | Installation scope (`project` or `global`) | `project` |
| `-y, --yes` | Skip all confirmation prompts | `false` |
| `--zip` | Export resources as ZIP instead of installing | `false` |
| `-h, --help` | Display help information | - |
| `-V, --version` | Display version number | - |

### Available Agents

- `claude-code` - Claude Code (Anthropic)
- `cursor` - Cursor IDE
- `github-copilot` - GitHub Copilot
- `antigravity` - Antigravity

## Supported Agents & Resources

| Agent | Skills | Rules | Agents |
|-------|:------:|:-----:|:------:|
| Claude Code | ✓ | ✓ | ✓ |
| Cursor | ✓ | ✓ | - |
| GitHub Copilot | ✓ | ✓ | - |
| Antigravity | ✓ | ✓ | - |

## Installation Paths

Resources are installed to agent-specific locations:

| Agent | Project Scope | Global Scope |
|-------|---------------|--------------|
| Claude Code | `.claude/skills/`, `.claude/rules/`, `.claude/agents/` | `~/.claude/skills/`, `~/.claude/rules/`, `~/.claude/agents/` |
| Cursor | `.cursor/skills/`, `.cursor/rules/` | `~/.cursor/skills/`, `~/.cursor/rules/` |
| GitHub Copilot | `.github/skills/`, `.github/instructions/` | `~/.copilot/skills/`, `~/.copilot/instructions/` |
| Antigravity | `.agent/skills/`, `.agent/rules/` | `~/.gemini/antigravity/skills/`, `~/.gemini/antigravity/rules/` |

## Resource Structure

Resources follow a standard structure:

```
skill-name/
├── SKILL.md           # Main skill file (required)
├── scripts/           # Executable scripts (optional)
├── references/        # Reference documentation (optional)
└── assets/            # Static assets (optional)
```

The tool automatically handles sibling directories (`scripts/`, `references/`, `assets/`) when installing resources.

## Duplicate Handling

When a resource already exists at the destination, you can choose:

| Action | Description |
|--------|-------------|
| **Skip** | Keep the existing file unchanged |
| **Overwrite** | Replace with the new version |
| **Rename** | Save with a new name (e.g., `skill-2`, `skill-3`) |
| **Backup** | Create a `.backup` of existing file before replacing |
| **Compare** | View a diff comparison and decide |

Identical content is automatically detected and skipped.

## Examples

```bash
# Install all resources from a popular repo
npx add-ai-tools vercel-labs/ai-chatbot

# Install to Cursor with global scope
npx add-ai-tools owner/repo --agent cursor --scope global

# Install without any prompts (accept all defaults)
npx add-ai-tools owner/repo -y

# Interactive mode - no arguments needed
npx add-ai-tools

# Export resources as ZIP for sharing
npx add-ai-tools owner/repo --zip

# Export all resources without prompts
npx add-ai-tools owner/repo --zip -y

# Install from Bitbucket
npx add-ai-tools https://bitbucket.org/workspace/repo

# Install specific skill from a subdirectory
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/code-review
```

## How It Works

1. **Parse Source** - The tool parses your input (shorthand, URL, or SSH) to identify the repository
2. **Fetch Resources** - Uses the Git Trees API for efficient fetching of repository structure
3. **Parse Metadata** - Extracts YAML frontmatter from resource files (name, description, etc.)
4. **Handle Duplicates** - Checks for existing resources and prompts for action if needed
5. **Install** - Writes files atomically to the correct agent-specific location

## Requirements

- Node.js 18.0.0 or higher
- npm or pnpm

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT
