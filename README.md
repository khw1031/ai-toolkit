# AI Toolkit

> Universal AI agent resource installer for Skills, Rules, Commands, and Agents

AI 코딩 에이전트(Claude Code, Cursor, Antigravity 등)에 Skills, Rules, Commands, Agents를 일괄 배포하는 CLI 도구입니다.

## 설치 및 사용

### Interactive 모드

```bash
npx @ai-toolkit/cli
```

대화형 UI로 리소스 타입, 소스, 에이전트를 선택합니다.

### Non-interactive 모드

```bash
# GitHub에서 스킬 설치
npx @ai-toolkit/cli --skills --source=owner/repo --agents=claude-code,cursor

# 로컬 경로에서 룰 설치
npx @ai-toolkit/cli --rules --source=./my-rules --agents=claude-code --scope=global

# 자동 덮어쓰기 모드
npx @ai-toolkit/cli --skills --source=owner/repo --agents=cursor --yes
```

## CLI 옵션

| 옵션 | 설명 | 예시 |
|------|------|------|
| `--skills` | Skills 리소스 설치 | `--skills` |
| `--rules` | Rules 리소스 설치 | `--rules` |
| `--commands` | Commands 리소스 설치 | `--commands` |
| `--agents-resource` | Agents 설정 설치 | `--agents-resource` |
| `--source <source>` | 소스 경로 (GitHub owner/repo, 로컬 경로, URL) | `--source=anthropics/skills` |
| `--agents <agents>` | 대상 에이전트 (쉼표 구분) | `--agents=claude-code,cursor` |
| `--scope <scope>` | 설치 범위 (project/global) | `--scope=global` |
| `--on-duplicate <action>` | 중복 처리 전략 | `--on-duplicate=backup` |
| `--yes` | 자동 덮어쓰기 (비인터랙티브) | `--yes` |

## 지원 에이전트

| 에이전트 | key | project 경로 | global 경로 |
|---------|-----|-------------|-------------|
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `cursor` | `.cursor/skills/` | `~/.cursor/skills/` |
| Antigravity | `antigravity` | `.agent/skills/` | `~/.gemini/antigravity/skills/` |
| Gemini CLI | `gemini-cli` | `.gemini/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `github-copilot` | `.github/skills/` | `~/.copilot/skills/` |
| OpenCode | `opencode` | `.opencode/skills/` | `~/.config/opencode/skills/` |

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
| skill | `SKILL.md` | 재사용 가능한 작업 스킬 |
| rule | `RULES.md` | 코딩 규칙 및 가이드라인 |
| command | `COMMANDS.md` | 슬래시 명령어 정의 |
| agent | `AGENT.md` | 에이전트 설정 파일 |

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

## 예제

### GitHub에서 커뮤니티 스킬 설치

```bash
npx @ai-toolkit/cli --skills --source=community/ai-skills --agents=claude-code
```

### 팀 전체에 룰 배포

```bash
npx @ai-toolkit/cli --rules --source=./team-rules --agents=claude-code,cursor,github-copilot --yes
```

### 글로벌 설정 설치

```bash
npx @ai-toolkit/cli --skills --source=owner/repo --agents=claude-code --scope=global
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

## 라이선스

MIT
