# add-ai-tools

一个通用的 CLI 工具，可以从各种来源一键安装 AI 代理资源（Skills、Rules、Agents）。

**[English](./README.md)** | **[한국어](./README.ko.md)** | **[日本語](./README.ja.md)**

## 概述

`add-ai-tools` 简化了 AI 编码助手资源的管理流程。它可以从 GitHub 或 Bitbucket 仓库获取资源，并安装到您首选的 AI 代理对应的位置。

### 主要特性

- **多来源支持** - 支持从 GitHub、Bitbucket 或 Git SSH URL 安装
- **多代理支持** - 兼容 Claude Code、Cursor、GitHub Copilot 和 Antigravity
- **交互模式** - 引导式提示，轻松选择资源
- **ZIP 导出** - 将资源导出为便携的 ZIP 归档
- **智能重复处理** - 支持跳过、覆盖、重命名、备份或比较重复文件
- **批量安装** - 一次安装多个资源

## 安装

```bash
# 全局安装
npm install -g add-ai-tools

# 或使用 npx 直接运行
npx add-ai-tools
```

## 快速开始

### 从 GitHub 安装

```bash
# 使用 GitHub 简写
npx add-ai-tools owner/repo

# 使用完整 GitHub URL
npx add-ai-tools https://github.com/owner/repo

# 从特定路径安装资源
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/my-skill
```

### 交互模式

```bash
npx add-ai-tools
```

交互模式将引导您完成以下步骤：
1. 选择您的 AI 代理（Claude Code、Cursor 等）
2. 输入源仓库地址
3. 选择资源类型（Skills、Rules、Agents）
4. 选择要安装的具体资源
5. 选择安装范围（项目级或全局）

### 导出为 ZIP

```bash
# 使用交互式提示导出
npx add-ai-tools owner/repo --zip

# 无提示导出所有资源
npx add-ai-tools owner/repo --zip -y
```

## 支持的来源

| 格式 | 示例 | 状态 |
|------|------|:----:|
| GitHub 简写 | `owner/repo` | ✓ |
| GitHub URL | `https://github.com/owner/repo` | ✓ |
| 带路径的 GitHub URL | `https://github.com/owner/repo/tree/main/skills/my-skill` | ✓ |
| Bitbucket URL | `https://bitbucket.org/workspace/repo` | ✓ |
| Git SSH (GitHub) | `git@github.com:owner/repo.git` | ✓ |
| Git SSH (Bitbucket) | `git@bitbucket.org:owner/repo.git` | ✓ |
| GitLab URL | `https://gitlab.com/owner/repo` | 即将推出 |

## 命令行选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `[source]` | 仓库 URL 或简写（可选） | - |
| `--agent <agent>` | 目标代理 | `claude-code` |
| `--scope <scope>` | 安装范围（`project` 或 `global`） | `project` |
| `-y, --yes` | 跳过所有确认提示 | `false` |
| `--zip` | 导出为 ZIP 而非安装 | `false` |
| `-h, --help` | 显示帮助信息 | - |
| `-V, --version` | 显示版本号 | - |

### 可用代理

- `claude-code` - Claude Code（Anthropic）
- `cursor` - Cursor IDE
- `github-copilot` - GitHub Copilot
- `antigravity` - Antigravity

## 支持的代理和资源

| 代理 | Skills | Rules | Agents |
|------|:------:|:-----:|:------:|
| Claude Code | ✓ | ✓ | ✓ |
| Cursor | ✓ | ✓ | - |
| GitHub Copilot | ✓ | ✓ | - |
| Antigravity | ✓ | ✓ | - |

## 安装路径

资源将安装到代理特定的位置：

| 代理 | 项目范围 | 全局范围 |
|------|----------|----------|
| Claude Code | `.claude/skills/`、`.claude/rules/`、`.claude/agents/` | `~/.claude/skills/`、`~/.claude/rules/`、`~/.claude/agents/` |
| Cursor | `.cursor/skills/`、`.cursor/rules/` | `~/.cursor/skills/`、`~/.cursor/rules/` |
| GitHub Copilot | `.github/skills/`、`.github/instructions/` | `~/.copilot/skills/`、`~/.copilot/instructions/` |
| Antigravity | `.agent/skills/`、`.agent/rules/` | `~/.gemini/antigravity/skills/`、`~/.gemini/antigravity/rules/` |

## 资源结构

资源遵循标准结构：

```
skill-name/
├── SKILL.md           # 主要技能文件（必需）
├── scripts/           # 可执行脚本（可选）
├── references/        # 参考文档（可选）
└── assets/            # 静态资源（可选）
```

该工具在安装资源时会自动处理同级目录（`scripts/`、`references/`、`assets/`）。

## 重复处理

当目标位置已存在资源时，您可以选择：

| 操作 | 描述 |
|------|------|
| **跳过** | 保持现有文件不变 |
| **覆盖** | 用新版本替换 |
| **重命名** | 以新名称保存（如 `skill-2`、`skill-3`） |
| **备份** | 替换前创建现有文件的 `.backup` |
| **比较** | 查看差异对比后决定 |

相同内容会自动检测并跳过。

## 示例

```bash
# 从热门仓库安装所有资源
npx add-ai-tools vercel-labs/ai-chatbot

# 以全局范围安装到 Cursor
npx add-ai-tools owner/repo --agent cursor --scope global

# 无提示安装（接受所有默认值）
npx add-ai-tools owner/repo -y

# 交互模式 - 无需参数
npx add-ai-tools

# 导出资源为 ZIP 以便分享
npx add-ai-tools owner/repo --zip

# 无提示导出所有资源
npx add-ai-tools owner/repo --zip -y

# 从 Bitbucket 安装
npx add-ai-tools https://bitbucket.org/workspace/repo

# 从子目录安装特定技能
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/code-review
```

## 工作原理

1. **解析来源** - 解析您的输入（简写、URL 或 SSH）以识别仓库
2. **获取资源** - 使用 Git Trees API 高效获取仓库结构
3. **解析元数据** - 从资源文件中提取 YAML frontmatter（名称、描述等）
4. **处理重复** - 检查现有资源，必要时提示操作
5. **安装** - 原子性地将文件写入正确的代理特定位置

## 系统要求

- Node.js 18.0.0 或更高版本
- npm 或 pnpm

## 贡献

欢迎贡献！请随时提交 Issue 和 Pull Request。

## 许可证

MIT
