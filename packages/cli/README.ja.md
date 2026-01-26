# add-ai-tools

様々なソースからAIエージェントリソース（Skills、Rules、Agents）を単一のコマンドでインストールできる汎用CLIツールです。

**[English](./README.md)** | **[한국어](./README.ko.md)** | **[中文](./README.zh-CN.md)**

## 概要

`add-ai-tools`はAIコーディングアシスタントリソースの管理を簡素化します。GitHubまたはBitbucketリポジトリからリソースを取得し、お好みのAIエージェントに適切な場所にインストールします。

### 主な機能

- **マルチソース対応** - GitHub、Bitbucket、Git SSH URLからインストール
- **マルチエージェント対応** - Claude Code、Cursor、GitHub Copilot、Antigravityに対応
- **インタラクティブモード** - リソース選択をガイドするプロンプト
- **ZIPエクスポート** - リソースをポータブルなZIPアーカイブとしてエクスポート
- **スマートな重複処理** - スキップ、上書き、リネーム、バックアップ、比較オプション
- **一括インストール** - 複数のリソースを一度にインストール

## インストール

```bash
# グローバルインストール
npm install -g add-ai-tools

# またはnpxで直接使用
npx add-ai-tools
```

## クイックスタート

### GitHubからインストール

```bash
# GitHub省略形を使用
npx add-ai-tools owner/repo

# 完全なGitHub URLを使用
npx add-ai-tools https://github.com/owner/repo

# 特定のパスからリソースをインストール
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/my-skill
```

### インタラクティブモード

```bash
npx add-ai-tools
```

インタラクティブモードは以下の手順をガイドします：
1. AIエージェントの選択（Claude Code、Cursorなど）
2. ソースリポジトリの入力
3. リソースタイプの選択（Skills、Rules、Agents）
4. インストールする特定のリソースの選択
5. インストールスコープの選択（プロジェクトまたはグローバル）

### ZIPとしてエクスポート

```bash
# インタラクティブプロンプトでエクスポート
npx add-ai-tools owner/repo --zip

# プロンプトなしで全リソースをエクスポート
npx add-ai-tools owner/repo --zip -y
```

## 対応ソース

| 形式 | 例 | 状態 |
|------|-----|:----:|
| GitHub省略形 | `owner/repo` | ✓ |
| GitHub URL | `https://github.com/owner/repo` | ✓ |
| パス付きGitHub URL | `https://github.com/owner/repo/tree/main/skills/my-skill` | ✓ |
| Bitbucket URL | `https://bitbucket.org/workspace/repo` | ✓ |
| Git SSH (GitHub) | `git@github.com:owner/repo.git` | ✓ |
| Git SSH (Bitbucket) | `git@bitbucket.org:owner/repo.git` | ✓ |
| GitLab URL | `https://gitlab.com/owner/repo` | 近日対応予定 |

## コマンドラインオプション

| オプション | 説明 | デフォルト |
|------------|------|-----------|
| `[source]` | リポジトリURLまたは省略形（オプション） | - |
| `--agent <agent>` | ターゲットエージェント | `claude-code` |
| `--scope <scope>` | インストールスコープ（`project`または`global`） | `project` |
| `-y, --yes` | すべての確認プロンプトをスキップ | `false` |
| `--zip` | インストールの代わりにZIPとしてリソースをエクスポート | `false` |
| `-h, --help` | ヘルプ情報を表示 | - |
| `-V, --version` | バージョン番号を表示 | - |

### 利用可能なエージェント

- `claude-code` - Claude Code（Anthropic）
- `cursor` - Cursor IDE
- `github-copilot` - GitHub Copilot
- `antigravity` - Antigravity

## 対応エージェントとリソース

| エージェント | Skills | Rules | Agents |
|-------------|:------:|:-----:|:------:|
| Claude Code | ✓ | ✓ | ✓ |
| Cursor | ✓ | ✓ | - |
| GitHub Copilot | ✓ | ✓ | - |
| Antigravity | ✓ | ✓ | - |

## インストールパス

リソースはエージェント固有の場所にインストールされます：

| エージェント | プロジェクトスコープ | グローバルスコープ |
|-------------|---------------------|-------------------|
| Claude Code | `.claude/skills/`、`.claude/rules/`、`.claude/agents/` | `~/.claude/skills/`、`~/.claude/rules/`、`~/.claude/agents/` |
| Cursor | `.cursor/skills/`、`.cursor/rules/` | `~/.cursor/skills/`、`~/.cursor/rules/` |
| GitHub Copilot | `.github/skills/`、`.github/instructions/` | `~/.copilot/skills/`、`~/.copilot/instructions/` |
| Antigravity | `.agent/skills/`、`.agent/rules/` | `~/.gemini/antigravity/skills/`、`~/.gemini/antigravity/rules/` |

## リソース構造

リソースは標準的な構造に従います：

```
skill-name/
├── SKILL.md           # メインスキルファイル（必須）
├── scripts/           # 実行可能なスクリプト（オプション）
├── references/        # 参考ドキュメント（オプション）
└── assets/            # 静的アセット（オプション）
```

このツールはリソースのインストール時に兄弟ディレクトリ（`scripts/`、`references/`、`assets/`）を自動的に処理します。

## 重複処理

インストール先にリソースが既に存在する場合、以下を選択できます：

| アクション | 説明 |
|-----------|------|
| **スキップ** | 既存のファイルを変更せずに保持 |
| **上書き** | 新しいバージョンで置き換え |
| **リネーム** | 新しい名前で保存（例：`skill-2`、`skill-3`） |
| **バックアップ** | 置き換え前に既存ファイルの`.backup`を作成 |
| **比較** | 差分比較を表示して決定 |

同一の内容は自動的に検出されスキップされます。

## 使用例

```bash
# 人気リポジトリからすべてのリソースをインストール
npx add-ai-tools vercel-labs/ai-chatbot

# グローバルスコープでCursorにインストール
npx add-ai-tools owner/repo --agent cursor --scope global

# プロンプトなしでインストール（すべてのデフォルト値を受け入れ）
npx add-ai-tools owner/repo -y

# インタラクティブモード - 引数不要
npx add-ai-tools

# 共有用にリソースをZIPとしてエクスポート
npx add-ai-tools owner/repo --zip

# プロンプトなしで全リソースをエクスポート
npx add-ai-tools owner/repo --zip -y

# Bitbucketからインストール
npx add-ai-tools https://bitbucket.org/workspace/repo

# サブディレクトリから特定のスキルをインストール
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/code-review
```

## 動作の仕組み

1. **ソースの解析** - 入力（省略形、URL、SSH）を解析してリポジトリを識別
2. **リソースの取得** - Git Trees APIを使用してリポジトリ構造を効率的に取得
3. **メタデータの解析** - リソースファイルからYAML frontmatterを抽出（名前、説明など）
4. **重複の処理** - 既存のリソースを確認し、必要に応じてアクションをプロンプト
5. **インストール** - 正しいエージェント固有の場所にファイルをアトミックに書き込み

## 必要要件

- Node.js 18.0.0以上
- npmまたはpnpm

## コントリビューション

コントリビューションを歓迎します！IssueやPull Requestをお気軽に提出してください。

## ライセンス

MIT
