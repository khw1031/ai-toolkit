# AI Toolkit

> Universal AI agent resource installer for Skills, Rules, Commands, and Agents

AI 코딩 에이전트(Claude Code, Cursor, GitHub Copilot, Antigravity)에 Skills, Rules, Commands, Agents를 일괄 배포하는 CLI 도구입니다.

## 설치 및 사용

```bash
npx @ai-toolkit/cli
```

대화형 UI로 리소스 타입, 소스, 에이전트를 선택합니다.

## 지원 에이전트

| 에이전트 | key | 지원 리소스 |
|---------|-----|------------|
| Claude Code | `claude-code` | skills, rules, commands, agents |
| Cursor | `cursor` | skills, rules, commands |
| GitHub Copilot | `github-copilot` | skills, rules |
| Antigravity | `antigravity` | skills, rules, commands |

### 설치 경로

#### Skills

| 에이전트 | project | global |
|---------|---------|--------|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` |
| Antigravity | `.agent/skills/` | `~/.gemini/antigravity/skills/` |

#### Rules

| 에이전트 | project | global |
|---------|---------|--------|
| Claude Code | `.claude/rules/` | `~/.claude/rules/` |
| Cursor | `.cursor/rules/` | `~/.cursor/rules/` |
| GitHub Copilot | `.github/instructions/` | `~/.copilot/instructions/` |
| Antigravity | `.agent/rules/` | `~/.gemini/antigravity/rules/` |

#### Commands

| 에이전트 | project | global |
|---------|---------|--------|
| Claude Code | `.claude/commands/` | `~/.claude/commands/` |
| Cursor | `.cursor/commands/` | `~/.cursor/commands/` |
| Antigravity | `.agent/workflows/` | `~/.gemini/antigravity/workflows/` |

#### Agents

| 에이전트 | project | global |
|---------|---------|--------|
| Claude Code | `.claude/agents/` | `~/.claude/agents/` |

## 중복 처리 전략

| 전략 | 설명 |
|------|------|
| `skip` | 기존 파일 유지 (동일 내용 자동 스킵) |
| `overwrite` | 새 파일로 덮어쓰기 |
| `rename` | 새 파일을 skill-2, skill-3 등으로 저장 |
| `backup` | 기존 파일을 .backup으로 백업 후 덮어쓰기 |
| `compare` | diff 확인 후 사용자 선택 |
| `fail` | 중복 시 에러 발생 |

## 리소스 타입

| 타입 | 파일명 | 설명 |
|------|--------|------|
| skills | `SKILL.md` | 재사용 가능한 작업 스킬 |
| rules | `RULES.md` | 코딩 규칙 및 가이드라인 |
| commands | `COMMANDS.md` | 슬래시 명령어 정의 |
| agents | `AGENT.md` | 에이전트 설정 파일 |

## 스킬 구조

```
skill-name/
├── SKILL.md           # 스킬 정의 (필수)
├── scripts/           # 실행 스크립트
├── references/        # Step별 상세 가이드
└── assets/
    ├── templates/     # 입출력 템플릿
    └── rules/         # 공유 규칙
```

## 사용 예시

Interactive 모드에서 다음 항목을 순서대로 선택합니다:

1. **리소스 타입** - skills, rules, commands, agents 중 선택
2. **소스** - GitHub 저장소(owner/repo), 로컬 경로, URL
3. **대상 에이전트** - 설치할 에이전트 선택
4. **설치 범위** - project(현재 프로젝트) 또는 global(전역)
5. **중복 처리** - 기존 파일과 충돌 시 처리 방법

```bash
npx @ai-toolkit/cli
```

## 개발

```bash
# 의존성 설치
pnpm install

# 빌드
pnpm turbo build

# 테스트
pnpm test
```
