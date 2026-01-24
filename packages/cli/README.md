# AI Toolkit CLI

AI Agent 리소스(Skills, Rules, Commands, Agents)를 쉽게 설치하는 CLI 도구입니다.

## 설치

```bash
npm install -g @ai-toolkit/cli
```

## 사용법

```bash
npx ai-toolkit
```

## Interactive 플로우

CLI는 단계별 인터랙티브 플로우를 제공합니다:

### 1. Agent 선택

대상 AI agent를 선택합니다:
- Claude Code
- Cursor
- GitHub Copilot
- Antigravity

### 2. Directory 선택

리소스 디렉토리를 선택합니다:
- **Common**: 범용 리소스 (모든 프로젝트에서 사용 가능)
- **Frontend**: 프론트엔드 개발 관련 (React, Vue, etc.)
- **App**: 앱 개발 관련 (Mobile, Desktop)

### 3. Type 선택

리소스 타입을 선택합니다 (Agent별 지원 타입만 표시):
- **Skills**: 재사용 가능한 프롬프트/지침
- **Rules**: 프로젝트 가이드라인 및 표준
- **Commands**: 커스텀 슬래시 명령어
- **Agents**: Agent 설정 (Claude Code 전용)

### 4. Resources 선택

설치할 리소스를 선택합니다.

### 5. Scope 선택

설치 범위를 선택합니다:
- **Project**: 현재 프로젝트에 설치 (권장)
- **Global**: 홈 디렉토리에 설치

### 6. 확인 및 설치

설치 요약을 확인하고 진행합니다.

## Agent별 지원 타입

| Agent | Skills | Rules | Commands | Agents |
|-------|:------:|:-----:|:--------:|:------:|
| Claude Code | O | O | O | O |
| Cursor | O | O | O | - |
| GitHub Copilot | O | O | - | - |
| Antigravity | O | O | O | - |

## 설치 경로

각 Agent별로 적절한 경로에 리소스가 설치됩니다:

### Claude Code
| Scope | Skills | Rules | Commands | Agents |
|-------|--------|-------|----------|--------|
| Project | `.claude/skills/` | `.claude/rules/` | `.claude/commands/` | `.claude/agents/` |
| Global | `~/.claude/skills/` | `~/.claude/rules/` | `~/.claude/commands/` | `~/.claude/agents/` |

### Cursor
| Scope | Skills | Rules | Commands |
|-------|--------|-------|----------|
| Project | `.cursor/skills/` | `.cursor/rules/` | `.cursor/commands/` |
| Global | `~/.cursor/skills/` | `~/.cursor/rules/` | `~/.cursor/commands/` |

### GitHub Copilot
| Scope | Skills | Rules |
|-------|--------|-------|
| Project | `.github/skills/` | `.github/instructions/` |
| Global | `~/.github/skills/` | `~/.github/instructions/` |

### Antigravity
| Scope | Skills | Rules | Commands |
|-------|--------|-------|----------|
| Project | `.agent/skills/` | `.agent/rules/` | `.agent/workflows/` |
| Global | `~/.agent/skills/` | `~/.agent/rules/` | `~/.agent/workflows/` |

## 중복 파일 처리

이미 존재하는 리소스를 설치하려고 할 때, 다음 옵션 중 선택할 수 있습니다:

- **Skip**: 기존 파일 유지
- **Overwrite**: 새 버전으로 교체
- **Rename**: 새 이름으로 저장 (e.g., `skill-2`)
- **Backup**: 기존 파일 백업 후 새 버전 설치
- **Compare**: 차이점 비교 후 결정

## 개발

### 빌드

```bash
pnpm build
```

### 테스트

```bash
pnpm test
```

### 로컬 실행

```bash
pnpm dev
```

## 프로젝트 구조

```
packages/cli/
├── src/
│   ├── commands/         # CLI 명령 핸들러
│   │   └── CommandHandler.ts
│   ├── path/             # Agent별 경로 해석
│   │   └── PathResolver.ts
│   ├── source/           # 레지스트리 리소스 탐색
│   │   └── RegistryResolver.ts
│   ├── prompts/          # 인터랙티브 프롬프트
│   │   └── InteractivePrompt.ts
│   ├── install/          # 설치 관리
│   │   ├── InstallManager.ts
│   │   ├── DuplicateHandler.ts
│   │   └── BatchHandler.ts
│   ├── parser/           # 리소스 파싱
│   │   └── ResourceParser.ts
│   ├── utils/            # 유틸리티
│   │   ├── Logger.ts
│   │   └── diff.ts
│   └── types.ts          # 타입 정의
├── bin/
│   └── cli.js            # CLI 엔트리포인트
└── README.md
```

## 라이선스

MIT
