# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ai-toolkit** is a universal CLI tool (`add-ai-tools`) for installing AI agent resources (Skills, Rules, Agents) from GitHub/Bitbucket repositories into multiple AI coding assistants: Claude Code, Cursor, GitHub Copilot, and Antigravity.

## Commands

```bash
# Root (pnpm monorepo with Turborepo)
pnpm install          # Install dependencies (requires pnpm>=10, node>=24)
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Type-check all packages
pnpm dev              # Dev mode

# CLI package (packages/cli)
pnpm --filter add-ai-tools test                    # Run all CLI tests
pnpm --filter add-ai-tools test -- SourceParser    # Run single test file
pnpm --filter add-ai-tools test -- --watch         # Watch mode
pnpm --filter add-ai-tools lint                    # tsc --noEmit
pnpm --filter add-ai-tools build                   # tsdown → dist/index.mjs
pnpm --filter add-ai-tools dev                     # Run with tsx
```

## Architecture

Monorepo with single package at `packages/cli/`. Built with tsdown into a single ESM bundle (`dist/index.mjs`). All source is TypeScript with ESM (`"type": "module"`).

### Data Flow

```
User Input → SourceParser → Fetcher (GitHub/Bitbucket) → ResourceParser → InstallManager → filesystem
                                                                              ↕
                                                                      DuplicateHandler
```

### Key Modules (`packages/cli/src/`)

| Module | Purpose |
|--------|---------|
| `source/SourceParser.ts` | Parses GitHub URLs, shorthand (`owner/repo`), Bitbucket URLs, git SSH into unified `ParsedSource` |
| `fetch/GitHubFetcher.ts` | Fetches repo tree via GitHub API, file content from raw.githubusercontent.com |
| `fetch/BitbucketFetcher.ts` | Same pattern for Bitbucket repos |
| `parser/ResourceParser.ts` | Extracts YAML frontmatter + metadata from `.md` files, detects resource type from filename (`SKILL.md`, `RULES.md`, `AGENT.md`) |
| `install/InstallManager.ts` | Orchestrates installation with SHA-256 hash dedup |
| `install/DuplicateHandler.ts` | Strategies: skip, overwrite, rename, backup, compare (with diff) |
| `install/BatchHandler.ts` | Batch duplicate handling (skip-all, overwrite-all, etc.) |
| `data/agents.ts` | Agent registry defining install paths per agent/scope |
| `path/PathResolver.ts` | Maps (agent + resource type + scope) → filesystem path |
| `commands/CommandHandler.ts` | Install flow orchestration |
| `commands/ZipHandler.ts` | ZIP export flow |
| `types.ts` | All TypeScript type definitions |

### Patterns

- **Singleton exports**: Most services export a singleton instance (`export const commandHandler = new CommandHandler()`)
- **Atomic writes**: `fs-safe.ts` uses temp file + rename for safe writes
- **Tests co-located**: `*.test.ts` next to source files, using Vitest

### Agent Support Matrix

| Agent | Skills | Rules | Agents |
|-------|--------|-------|--------|
| claude-code | `.claude/skills/` | `.claude/rules/` | `.claude/agents/` |
| cursor | `.cursor/skills/` | `.cursor/rules/` | `.cursor/agents/` |
| github-copilot | `.github/skills/` | `.github/instructions/` | N/A |
| antigravity | `.agent/skills/` | `.agent/rules/` | N/A |

## Rules

<rules>

<rule name="think-before-coding">
## Think Before Coding

코딩을 시작하기 전에 가정을 명시하고, 불확실한 부분은 질문하라.
잘못된 가정 위에 코드를 쌓으면 나중에 전체를 다시 작성하게 된다.

<examples>
<example type="good">
"이 함수는 입력이 항상 양수라고 가정합니다. 맞나요?" → 확인 후 구현
</example>
<example type="bad">
요구사항을 추측하고 바로 코드 작성 → 의도와 다른 결과물
</example>
</examples>
</rule>

<rule name="simplicity-first">
## Simplicity First

요청된 기능만 정확히 구현하라. 요청받지 않은 추상화, 유틸리티 함수, 에러 처리, 타입 어노테이션을 추가하지 마라.
과잉 설계는 코드 복잡도를 높이고 리뷰 부담을 키운다.

<examples>
<example type="good">
"버튼 클릭 시 API 호출" 요청 → 버튼 핸들러와 API 호출만 구현
</example>
<example type="bad">
"버튼 클릭 시 API 호출" 요청 → 재시도 로직, 로딩 상태, 에러 바운더리, 커스텀 훅까지 추가
</example>
</examples>

**예외**: 보안 취약점(인젝션, XSS 등)은 요청 없이도 반드시 방어하라.
</rule>

<rule name="surgical-changes">
## Surgical Changes

변경은 요청된 범위에만 한정하라. 주변 코드의 스타일 개선, 리팩토링, 주석 추가를 하지 마라.
범위를 벗어난 변경은 의도치 않은 부작용을 유발하고 코드 리뷰를 어렵게 만든다.

<examples>
<example type="good">
"함수 A의 반환값을 수정해주세요" → 함수 A만 변경
</example>
<example type="bad">
"함수 A의 반환값을 수정해주세요" → 함수 A 변경 + 함수 B 리팩토링 + 파일 전체 포매팅 정리
</example>
</examples>
</rule>

<rule name="goal-driven-execution">
## Goal-Driven Execution

모호한 요청은 검증 가능한 목표로 구체화하라. 명확한 완료 기준이 있어야 정확한 결과를 낼 수 있다.

<examples>
<example type="good">
"로그인 기능 추가" → "로그인 폼 제출 시 /api/auth에 POST 요청을 보내고, 성공 시 /dashboard로 리다이렉트"
</example>
<example type="bad">
"로그인 기능 추가" → 범위가 불명확한 채로 구현 시작
</example>
</examples>
</rule>

</rules>

## Available Skills

<available-skills>

<skill name="changelog" ref=".claude/skills/changelog">
  <description>CHANGELOG.md에 변경 사항과 담당자를 정리하고 package.json 버전을 올립니다.</description>
  <trigger>changelog 작성, 변경 이력 정리, 버전 올리기, 릴리즈 노트, CHANGELOG 업데이트 요청 시 사용.</trigger>
</skill>

<skill name="code-review-team" ref=".claude/skills/code-review-team">
  <description>프로젝트 컨텍스트를 파악한 뒤 전문가 관점으로 코드 리뷰하고, 사용자 승인 후 Agent Team SPAWN으로 병렬 개선 작업을 수행합니다.</description>
  <trigger>코드리뷰, 코드 리뷰, code review, 리뷰해줘, 리팩토링, 코드검토, PR 리뷰, 변경사항 검토.</trigger>
</skill>

<skill name="create-agent" ref=".claude/skills/create-agent">
  <description>Claude Code Agent를 생성합니다.</description>
  <trigger>에이전트 생성, AGENT.md 작성, 새 에이전트 만들기 요청 시 활성화.</trigger>
</skill>

<skill name="create-ai-tool" ref=".claude/skills/create-ai-tool">
  <description>사용자 요구사항을 분석하여 Skill 또는 Agent 중 적절한 유형을 결정하고 생성을 위임합니다.</description>
  <trigger>도구 만들기, 스킬 vs 에이전트, 어떤 걸 만들어야 할지, 도구 유형 선택 요청 시 활성화.</trigger>
</skill>

<skill name="create-skill" ref=".claude/skills/create-skill">
  <description>Claude Code Skill을 생성합니다.</description>
  <trigger>스킬 생성, SKILL.md 작성, 새 스킬 만들기 요청 시 활성화.</trigger>
</skill>

<skill name="feature-workflow" ref=".claude/skills/feature-workflow">
  <description>기능 구현을 5단계(Requirements → Design → Task → Implementation → Review) 워크플로우로 체계적으로 진행합니다. Agent Team 기반 병렬 구현을 지원합니다.</description>
  <trigger>워크플로우, 기능 구현, 기능 개발, 작업 재개, TASK-ID 패턴, .ai/tasks 요청 시 활성화.</trigger>
</skill>

<skill name="git-commit" ref=".claude/skills/git-commit">
  <description>Git 변경 사항을 분석하여 의미있는 커밋 메시지를 자동 생성합니다.</description>
  <trigger>커밋, 커밋 메시지 작성, 변경사항 커밋, git commit 요청 시 사용.</trigger>
</skill>

<skill name="kind-senior-developer" ref=".claude/skills/kind-senior-developer">
  <description>특정 커밋이나 문서의 변경 사항을 친절한 시니어 개발자처럼 분석하고 설명합니다.</description>
  <trigger>코드 분석, 커밋 설명, 변경 사항 이해, 코드 리뷰 설명, 시니어 설명, 코드 해설 요청 시 사용.</trigger>
</skill>

<skill name="progressive-disclosure" ref=".claude/skills/progressive-disclosure">
  <description>LLM 컨텍스트 윈도우를 효율적으로 사용하는 3단계 정보 로드 원칙. Skills, Agents, Prompts 작성 시 참조.</description>
  <trigger>SKILL.md, AGENT.md 작성, 프롬프트 설계, 컨텍스트 최적화 시 활성화.</trigger>
</skill>

<skill name="rule-manager" ref=".claude/skills/rule-manager">
  <description>Skill 기반의 규칙을 레포지토리에 추가하고 관리합니다. 기존 구조 분석 → 적절한 위치 판단 → 사용자 확인 후 추가.</description>
  <trigger>규칙 추가, 룰 추가, rule 추가, 새 규칙, 컨벤션 추가, 스타일 가이드 추가, 가이드라인 추가 요청 시 활성화.</trigger>
</skill>

<skill name="skills-ref" ref=".claude/skills/skills-ref">
  <description>스킬 디렉토리를 스캔하여 CLAUDE.md에 Available Skills 섹션을 XML 구조로 생성합니다.</description>
  <trigger>스킬 등록, 스킬 목록 생성, CLAUDE.md 스킬 섹션, skills ref, 스킬 인덱스, available skills 작성 요청 시 활성화.</trigger>
</skill>

</available-skills>
