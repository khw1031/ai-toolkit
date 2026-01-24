# Step 2: Design & Planning 결과

## 1. 코드베이스 분석

### 1.1 현재 상태

**프로젝트 구조**:
```
ai-toolkit/
├── README.md                    # 프로젝트 개요
├── CLI-PRD.md                   # CLI 상세 설계 (사용자 플로우, 6개 에이전트)
├── PRD.md                       # 전체 요구사항
├── IMPLEMENTATION_PLAN.md       # 초기 계획
├── .claude/                     # Claude Code 설정
│   ├── CLAUDE.md               # Progressive Disclosure 원칙
│   ├── settings.local.json     # 권한 설정
│   ├── rules/                  # 작성 규칙 (skills-authoring.md 등)
│   ├── references/             # 상세 가이드
│   ├── agents/                 # task-master, task-executor
│   └── skills/                 # 4개 기존 스킬 예제
│       ├── workflow-framework/
│       ├── feature-development/
│       ├── general-feature/
│       └── vercel-react-best-practices/
└── .ai/tasks/AI-TOOLKIT-001/   # 현재 작업 디렉토리
```

**TypeScript/Node.js 설정 상태**:
- ❌ package.json, tsconfig.json, turbo.json, pnpm-workspace.yaml 없음
- ❌ packages/ 디렉토리 없음
- ✅ 스킬 예제 4개 존재 (SKILL.md 포맷 확인 가능)
- ✅ CLI-PRD.md에 6개 에이전트 경로 정의 완료

**결론**: 프로젝트는 기획 단계 완료, TypeScript CLI 초기화 필요

### 1.2 기존 스킬 패턴 분석

| 스킬 | 구조 | 핵심 패턴 |
|------|------|----------|
| workflow-framework | SKILL.md + scripts/ + references/ + templates/ | Phase 분리, Task 관리 스크립트 |
| feature-development | SKILL.md + references/ + templates/ | 4단계 워크플로우, Git 통합 |
| general-feature | SKILL.md + references/ + templates/ + scripts/ | 5단계 워크플로우, Resume 기능 |
| vercel-react-best-practices | SKILL.md + rules/ | 45개 규칙, 우선순위별 분류 |

**공통 원칙**:
1. **Progressive Disclosure**: 메타데이터(~100토큰) → 본문(<5000토큰) → 상세 파일(온디맨드)
2. **Document as Interface**: Step 간 통신이 마크다운 문서 기반 (00-input.md → 10-output.md → ...)
3. **Context Isolation**: 각 Step은 새 대화에서 실행 권장
4. **Git as History**: 각 Step 완료 시 커밋으로 체크포인트

### 1.3 CLI-PRD 핵심 요구사항 재확인

**지원 에이전트 (6개)**:

| Agent | Project Path | Global Path |
|-------|--------------|-------------|
| Antigravity | `.agent/skills/` | `~/.gemini/antigravity/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Gemini CLI | `.gemini/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` |
| OpenCode | `.opencode/skills/` | `~/.config/opencode/skills/` |

**리소스 타입 (4개)**:
- Skills (SKILL.md)
- Rules (RULES.md)
- Commands (COMMANDS.md)
- Agents (AGENT.md)

**중복 처리 전략**:
- Skip, Overwrite, Rename, Backup, Compare (Merge 수동), Fail
- 일괄 처리: Ask each, Skip all, Overwrite all, Backup all
- 내용 동일 시 자동 Skip

---

## 2. 아키텍처 설계

### 2.1 전체 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  (npx ai-toolkit / --skills / --rules / --commands / ...)   │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│              @ai-toolkit/cli (CLI Package)                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ CommandHandler: CLI 진입점, 플래그 파싱               │  │
│  │ - parseFlags(): 플래그 → Command 객체                 │  │
│  │ - routeCommand(): 인터랙티브 vs 비인터랙티브          │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│  ┌────────────────▼───────────────────────────────────────┐  │
│  │ InteractivePrompt: inquirer 기반 UI                    │  │
│  │ - selectType(): Skills/Rules/Commands/Agents           │  │
│  │ - selectSource(): GitHub/Bitbucket/로컬/URL            │  │
│  │ - selectResources(): multi-select                      │  │
│  │ - selectAgents(): multi-select                         │  │
│  │ - selectScope(): project/global                        │  │
│  │ - handleDuplicate(): Skip/Overwrite/Rename/Backup      │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│  ┌────────────────▼───────────────────────────────────────┐  │
│  │ SourceResolver: 소스 → 파일 목록                       │  │
│  │ - resolveGitHub(): GitHub API → 파일 트리              │  │
│  │ - resolveBitbucket(): Bitbucket API → 파일 트리        │  │
│  │ - resolveLocal(): fs.readdir() → 파일 목록             │  │
│  │ - resolveDirectURL(): fetch() → 단일 파일              │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│  ┌────────────────▼───────────────────────────────────────┐  │
│  │ ResourceParser: 파일 → Resource 객체                   │  │
│  │ - parseResource(): YAML frontmatter + 메타 추출        │  │
│  │ - detectType(): SKILL.md/RULES.md/COMMANDS.md/AGENT.md │  │
│  │ - extractDirectory(): 폴더 전체 포함 여부              │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│  ┌────────────────▼───────────────────────────────────────┐  │
│  │ InstallManager: 설치 로직                              │  │
│  │ - checkDuplicate(): 기존 파일 존재 여부 + 해시 비교    │  │
│  │ - handleDuplicate(): 중복 처리 전략 실행               │  │
│  │ - install(): 파일 복사 (원자적 쓰기)                   │  │
│  │ - backup(): .backup 생성                               │  │
│  │ - rename(): 자동 넘버링 (skill-2, skill-3)             │  │
│  │ - compare(): diff 생성 및 표시                         │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│  ┌────────────────▼───────────────────────────────────────┐  │
│  │ Logger: 설치 결과 출력                                 │  │
│  │ - logProgress(): 진행 상황 표시                        │  │
│  │ - logResult(): 성공/실패/건너뜀 개수                   │  │
│  │ - writeLogFile(): 설치 로그 파일 생성 (선택)           │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ dependencies
                     │
┌────────────────────▼─────────────────────────────────────────┐
│           @ai-toolkit/registry (Registry Package)            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ agents.json: 6개 에이전트 메타데이터                   │  │
│  │ {                                                      │  │
│  │   "claude-code": {                                     │  │
│  │     "name": "Claude Code",                             │  │
│  │     "paths": {                                         │  │
│  │       "project": { "skills": ".claude/skills/", ... }, │  │
│  │       "global": { "skills": "~/.claude/skills/", ... } │  │
│  │     }                                                  │  │
│  │   },                                                   │  │
│  │   ...                                                  │  │
│  │ }                                                      │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ PathResolver: 에이전트별 경로 매핑                      │  │
│  │ - resolveAgentPath(agent, type, scope): 경로 반환      │  │
│  │ - expandTilde(): ~ → $HOME                             │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ resources/: 공식 리소스 (선택, P2)                     │  │
│  │ - skills/                                              │  │
│  │ - rules/                                               │  │
│  │ - commands/                                            │  │
│  │ - agents/                                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Turborepo Monorepo 구조

```
ai-toolkit/
├── package.json                 # Root package (private)
├── pnpm-workspace.yaml          # pnpm workspace 설정
├── turbo.json                   # Turborepo 빌드 파이프라인
├── tsconfig.base.json           # 공통 TypeScript 설정
├── .gitignore
├── README.md
├── packages/
│   ├── cli/                     # @ai-toolkit/cli
│   │   ├── package.json         # CLI 패키지
│   │   ├── tsconfig.json        # CLI TypeScript 설정 (extends base)
│   │   ├── src/
│   │   │   ├── index.ts         # CLI 진입점
│   │   │   ├── commands/
│   │   │   │   ├── CommandHandler.ts
│   │   │   │   └── types.ts     # Command 타입 정의
│   │   │   ├── install/
│   │   │   │   ├── InstallManager.ts
│   │   │   │   ├── DuplicateHandler.ts
│   │   │   │   └── FileWriter.ts
│   │   │   ├── prompts/
│   │   │   │   ├── InteractivePrompt.ts
│   │   │   │   └── validators.ts
│   │   │   ├── source/
│   │   │   │   ├── SourceResolver.ts
│   │   │   │   ├── GitHubResolver.ts
│   │   │   │   ├── BitbucketResolver.ts
│   │   │   │   ├── LocalResolver.ts
│   │   │   │   └── URLResolver.ts
│   │   │   ├── parser/
│   │   │   │   ├── ResourceParser.ts
│   │   │   │   └── YAMLParser.ts
│   │   │   └── utils/
│   │   │       ├── Logger.ts
│   │   │       ├── hash.ts      # 파일 해시 계산
│   │   │       ├── fs-safe.ts   # 원자적 파일 쓰기
│   │   │       └── diff.ts      # Compare 기능
│   │   ├── bin/
│   │   │   └── ai-toolkit.js    # npx 진입점 (#!/usr/bin/env node)
│   │   └── __tests__/
│   │       ├── commands.test.ts
│   │       ├── install.test.ts
│   │       └── source.test.ts
│   └── registry/                # @ai-toolkit/registry
│       ├── package.json         # Registry 패키지
│       ├── tsconfig.json        # Registry TypeScript 설정
│       ├── src/
│       │   ├── index.ts         # Registry 진입점 (agents.json export)
│       │   ├── PathResolver.ts  # 경로 매핑 로직
│       │   └── types.ts         # Agent 타입 정의
│       ├── data/
│       │   └── agents.json      # 6개 에이전트 메타데이터
│       └── resources/           # 공식 리소스 (선택, P2)
│           ├── skills/
│           ├── rules/
│           ├── commands/
│           └── agents/
├── .claude/                     # Claude Code 설정 (기존 유지)
│   └── ...
└── .ai/                         # 작업 관리 디렉토리
    └── tasks/
        └── AI-TOOLKIT-001/
```

**패키지 의존성**:
- `@ai-toolkit/cli` depends on `@ai-toolkit/registry`
- npx 실행 시 CLI 패키지가 진입점, Registry 데이터 참조

### 2.3 핵심 모듈 상세 설계

#### 2.3.1 CommandHandler

**책임**: CLI 진입점, 플래그 파싱, 명령 라우팅

```typescript
// packages/cli/src/commands/CommandHandler.ts
interface Command {
  type?: ResourceType;          // --skills, --rules, --commands, --agents
  source?: string;               // --source
  onDuplicate?: DuplicateAction; // --on-duplicate
  yes?: boolean;                 // --yes (비인터랙티브)
  scope?: 'project' | 'global';  // --scope
  agents?: AgentKey[];           // --agents
}

class CommandHandler {
  async run(argv: string[]): Promise<void>
  private parseFlags(argv: string[]): Command
  private routeCommand(cmd: Command): Promise<void>
}
```

**플래그 정의**:

| 플래그 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `--skills` | boolean | Skills 타입 선택 | `npx ai-toolkit --skills` |
| `--rules` | boolean | Rules 타입 선택 | `npx ai-toolkit --rules` |
| `--commands` | boolean | Commands 타입 선택 | `npx ai-toolkit --commands` |
| `--agents-resource` | boolean | Agents 타입 선택 | `npx ai-toolkit --agents-resource` |
| `--source` | string | 소스 경로 | `--source=owner/repo` |
| `--on-duplicate` | string | 중복 처리 전략 | `--on-duplicate=skip` |
| `--yes` | boolean | 자동 overwrite | `--yes` |
| `--scope` | string | project/global | `--scope=global` |
| `--agents` | string | 에이전트 목록 | `--agents=claude-code,cursor` |

#### 2.3.2 SourceResolver

**책임**: 소스(GitHub/Bitbucket/로컬/URL) → 파일 목록 변환

```typescript
// packages/cli/src/source/SourceResolver.ts
interface SourceFile {
  path: string;           // 파일 경로 (예: skills/commit/SKILL.md)
  content: string;        // 파일 내용
  isDirectory: boolean;   // 디렉토리 포함 여부
}

class SourceResolver {
  async resolve(source: string, type: ResourceType): Promise<SourceFile[]>
  private detectSourceType(source: string): 'github' | 'bitbucket' | 'local' | 'url'
}

class GitHubResolver {
  async resolve(owner: string, repo: string, type: ResourceType): Promise<SourceFile[]>
  private fetchTree(owner: string, repo: string): Promise<GitHubTree>
  private filterByType(tree: GitHubTree, type: ResourceType): GitHubNode[]
  private downloadFiles(nodes: GitHubNode[]): Promise<SourceFile[]>
}
```

**GitHub API 전략**:
- `/repos/:owner/:repo/git/trees/:sha?recursive=1` → 전체 파일 트리
- 3 depth 제한 (성능과 커버리지 균형)
- SKILL.md, RULES.md, COMMANDS.md, AGENT.md 필터링
- 폴더 전체 포함 시 재귀 다운로드

**rate limit 처리**:
- 401/403 응답 시 명확한 에러 메시지
- unauthenticated: 60 req/hour → 사용자에게 GitHub token 권장

#### 2.3.3 ResourceParser

**책임**: 파일 → Resource 객체 변환

```typescript
// packages/cli/src/parser/ResourceParser.ts
interface Resource {
  name: string;           // 리소스 이름 (YAML name 필드)
  type: ResourceType;     // 'skill' | 'rule' | 'command' | 'agent'
  description: string;    // 설명
  path: string;           // 원본 경로
  content: string;        // 파일 내용
  metadata: {
    author?: string;
    version?: string;
    license?: string;
    category?: string;
  };
  directory?: {           // 폴더 전체 포함 시
    files: SourceFile[];  // 하위 파일들
  };
}

class ResourceParser {
  parseResource(file: SourceFile, type: ResourceType): Resource
  private parseYAMLFrontmatter(content: string): Record<string, any>
  private detectType(filePath: string): ResourceType | null
  private extractDirectory(basePath: string, files: SourceFile[]): SourceFile[]
}
```

**YAML frontmatter 파싱**:
- `---` 블록 추출
- `name`, `description`, `metadata` 필드 추출
- 없으면 파일명에서 유추 (예: `commit/SKILL.md` → name: `commit`)

#### 2.3.4 InstallManager

**책임**: 설치 로직, 중복 처리, 파일 쓰기

```typescript
// packages/cli/src/install/InstallManager.ts
interface InstallRequest {
  resource: Resource;
  agent: AgentKey;
  scope: 'project' | 'global';
  onDuplicate: DuplicateAction;
}

interface InstallResult {
  resourceName: string;
  agent: AgentKey;
  success: boolean;
  action: 'created' | 'skipped' | 'overwritten' | 'renamed' | 'backed-up';
  path: string;
  backupPath?: string;
  renamedTo?: string;
  error?: string;
}

class InstallManager {
  async install(requests: InstallRequest[]): Promise<InstallResult[]>
  private async checkDuplicate(
    resourceName: string,
    agent: AgentKey,
    scope: 'project' | 'global',
    type: ResourceType
  ): Promise<DuplicateInfo | null>
  private async handleDuplicate(
    duplicate: DuplicateInfo,
    action: DuplicateAction,
    newContent: string
  ): Promise<InstallResult>
}

class DuplicateHandler {
  async skip(): Promise<void>
  async overwrite(newContent: string): Promise<void>
  async rename(newContent: string, baseName: string): Promise<string>
  async backup(newContent: string, existingPath: string): Promise<string>
  async compare(existingContent: string, newContent: string): Promise<string>
}

class FileWriter {
  async atomicWrite(path: string, content: string): Promise<void>
  // 임시 파일 생성 → 쓰기 → rename (원자적)
}
```

**중복 감지 로직**:
1. 경로 존재 여부 확인 (`fs.existsSync()`)
2. 기존 파일 읽기 → 해시 계산 (SHA-256)
3. 신규 파일 해시 계산
4. 해시 동일 → `isSameContent: true` → 자동 Skip

**중복 처리 전략**:

| 전략 | 동작 | 인터랙티브 | 비인터랙티브 |
|------|------|-----------|-------------|
| Skip | 기존 유지, 설치 안 함 | 사용자 선택 | `--on-duplicate=skip` |
| Overwrite | 기존 삭제, 신규 설치 | 사용자 선택 | `--on-duplicate=overwrite` 또는 `--yes` |
| Rename | 자동 넘버링 (skill-2) | 사용자 선택 | `--on-duplicate=rename` |
| Backup | .backup 생성 후 덮어쓰기 | 사용자 선택 | `--on-duplicate=backup` |
| Compare | diff 표시 후 선택 | 사용자 선택 | 비지원 (인터랙티브만) |
| Fail | 에러 발생 (CI용) | - | `--on-duplicate=fail` |

**일괄 처리**:
- 여러 리소스/에이전트에서 중복 발생 시 한 번에 전략 선택
- "Ask each", "Skip all", "Overwrite all", "Backup all"

#### 2.3.5 InteractivePrompt

**책임**: 사용자 입력 (inquirer 기반)

```typescript
// packages/cli/src/prompts/InteractivePrompt.ts
import inquirer from 'inquirer';

class InteractivePrompt {
  async selectType(): Promise<ResourceType>
  async selectSource(): Promise<string>
  async selectResources(resources: Resource[]): Promise<Resource[]>
  async selectAgents(): Promise<AgentKey[]>
  async selectScope(): Promise<'project' | 'global'>
  async handleDuplicate(duplicate: DuplicateInfo): Promise<DuplicateAction>
  async handleBatchDuplicates(duplicates: DuplicateInfo[]): Promise<'ask-each' | 'skip-all' | 'overwrite-all' | 'backup-all'>
}
```

**inquirer 프롬프트 예시**:

```typescript
// Type 선택
{
  type: 'list',
  name: 'type',
  message: 'What do you want to install?',
  choices: [
    { name: 'Skills', value: 'skill' },
    { name: 'Rules', value: 'rule' },
    { name: 'Commands', value: 'command' },
    { name: 'Agents', value: 'agent' },
  ]
}

// Resource 선택 (multi-select)
{
  type: 'checkbox',
  name: 'resources',
  message: 'Select resources to install:',
  choices: resources.map(r => ({
    name: `${r.name} - ${r.description}`,
    value: r,
    checked: false
  }))
}

// Agent 선택 (multi-select)
{
  type: 'checkbox',
  name: 'agents',
  message: 'Select agents:',
  choices: [
    { name: 'Claude Code', value: 'claude-code' },
    { name: 'Cursor', value: 'cursor' },
    // ...
  ]
}

// 중복 처리
{
  type: 'list',
  name: 'action',
  message: `⚠ "${duplicate.resourceName}" already exists. What to do?`,
  choices: [
    { name: 'Skip - Keep existing', value: 'skip' },
    { name: 'Overwrite - Replace with new', value: 'overwrite' },
    { name: 'Rename - Save as new (skill-2)', value: 'rename' },
    { name: 'Backup - Backup and overwrite', value: 'backup' },
    { name: 'Compare - View diff', value: 'compare' },
  ]
}
```

#### 2.3.6 PathResolver (Registry Package)

**책임**: 에이전트별 경로 매핑

```typescript
// packages/registry/src/PathResolver.ts
import agents from './data/agents.json';

interface AgentPaths {
  skills: string;
  rules: string;
  commands: string;
  agents: string;
}

interface AgentConfig {
  name: string;
  paths: {
    project: AgentPaths;
    global: AgentPaths;
  };
}

class PathResolver {
  resolveAgentPath(
    agent: AgentKey,
    type: ResourceType,
    scope: 'project' | 'global'
  ): string

  private expandTilde(path: string): string
  // ~ → $HOME 치환
}
```

**agents.json 구조**:

```json
{
  "claude-code": {
    "name": "Claude Code",
    "paths": {
      "project": {
        "skills": ".claude/skills/",
        "rules": ".claude/rules/",
        "commands": ".claude/commands/",
        "agents": ".claude/agents/"
      },
      "global": {
        "skills": "~/.claude/skills/",
        "rules": "~/.claude/rules/",
        "commands": "~/.claude/commands/",
        "agents": "~/.claude/agents/"
      }
    }
  },
  "cursor": {
    "name": "Cursor",
    "paths": {
      "project": {
        "skills": ".cursor/skills/",
        "rules": ".cursor/rules/",
        "commands": ".cursor/commands/",
        "agents": ".cursor/agents/"
      },
      "global": {
        "skills": "~/.cursor/skills/",
        "rules": "~/.cursor/rules/",
        "commands": "~/.cursor/commands/",
        "agents": "~/.cursor/agents/"
      }
    }
  },
  "antigravity": {
    "name": "Antigravity",
    "paths": {
      "project": {
        "skills": ".agent/skills/",
        "rules": ".agent/rules/",
        "commands": ".agent/commands/",
        "agents": ".agent/agents/"
      },
      "global": {
        "skills": "~/.gemini/antigravity/skills/",
        "rules": "~/.gemini/antigravity/rules/",
        "commands": "~/.gemini/antigravity/commands/",
        "agents": "~/.gemini/antigravity/agents/"
      }
    }
  },
  "gemini-cli": {
    "name": "Gemini CLI",
    "paths": {
      "project": {
        "skills": ".gemini/skills/",
        "rules": ".gemini/rules/",
        "commands": ".gemini/commands/",
        "agents": ".gemini/agents/"
      },
      "global": {
        "skills": "~/.gemini/skills/",
        "rules": "~/.gemini/rules/",
        "commands": "~/.gemini/commands/",
        "agents": "~/.gemini/agents/"
      }
    }
  },
  "github-copilot": {
    "name": "GitHub Copilot",
    "paths": {
      "project": {
        "skills": ".github/skills/",
        "rules": ".github/rules/",
        "commands": ".github/commands/",
        "agents": ".github/agents/"
      },
      "global": {
        "skills": "~/.copilot/skills/",
        "rules": "~/.copilot/rules/",
        "commands": "~/.copilot/commands/",
        "agents": "~/.copilot/agents/"
      }
    }
  },
  "opencode": {
    "name": "OpenCode",
    "paths": {
      "project": {
        "skills": ".opencode/skills/",
        "rules": ".opencode/rules/",
        "commands": ".opencode/commands/",
        "agents": ".opencode/agents/"
      },
      "global": {
        "skills": "~/.config/opencode/skills/",
        "rules": "~/.config/opencode/rules/",
        "commands": "~/.config/opencode/commands/",
        "agents": "~/.config/opencode/agents/"
      }
    }
  }
}
```

### 2.4 타입 정의

```typescript
// packages/cli/src/commands/types.ts
export type ResourceType = 'skill' | 'rule' | 'command' | 'agent';

export type AgentKey =
  | 'claude-code'
  | 'cursor'
  | 'antigravity'
  | 'gemini-cli'
  | 'github-copilot'
  | 'opencode';

export type DuplicateAction =
  | 'skip'
  | 'overwrite'
  | 'rename'
  | 'backup'
  | 'compare'
  | 'fail';

export interface DuplicateInfo {
  resourceName: string;
  resourceType: ResourceType;
  existingPath: string;
  existingMeta: {
    createdAt: Date;
    source?: string;
    contentHash: string;
  };
  newMeta: {
    source: string;
    contentHash: string;
  };
  isSameContent: boolean;
}
```

---

## 3. 기술 스택 및 의존성

### 3.1 기술 선택 근거

| 기술 | 선택 이유 |
|------|----------|
| **TypeScript** | 타입 안전성, IDE 지원, 유지보수성 |
| **pnpm** | 빠른 설치, 디스크 효율성, workspace 지원 |
| **Turborepo** | Monorepo 빌드 캐싱, 병렬 빌드 |
| **tsdown** | 빠른 TypeScript 빌드 (esbuild 기반) |
| **inquirer** | 검증된 CLI 인터랙티브 UI 라이브러리 |
| **commander** | CLI 플래그 파싱 표준 라이브러리 |
| **chalk** | 터미널 색상 출력 |
| **ora** | 로딩 스피너 (progress bar) |
| **fast-glob** | 빠른 파일 시스템 탐색 |
| **yaml** | YAML frontmatter 파싱 |
| **diff** | Compare 기능 (diff 생성) |

### 3.2 패키지별 의존성

#### @ai-toolkit/cli

```json
{
  "dependencies": {
    "@ai-toolkit/registry": "workspace:*",
    "inquirer": "^9.0.0",
    "commander": "^11.0.0",
    "chalk": "^5.0.0",
    "ora": "^7.0.0",
    "fast-glob": "^3.3.0",
    "yaml": "^2.3.0",
    "diff": "^5.1.0",
    "octokit": "^3.1.0"  // GitHub API
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/inquirer": "^9.0.0",
    "@types/diff": "^5.0.0",
    "typescript": "^5.3.0",
    "tsdown": "^1.0.0",
    "vitest": "^1.0.0"
  }
}
```

#### @ai-toolkit/registry

```json
{
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tsdown": "^1.0.0"
  }
}
```

### 3.3 Turborepo 파이프라인

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false
    }
  }
}
```

**빌드 순서**:
1. `@ai-toolkit/registry` 빌드 (의존성 없음)
2. `@ai-toolkit/cli` 빌드 (registry 의존)

---

## 4. 구현 계획

### 4.1 Phase 1: 프로젝트 초기화 (P0)

**목표**: Turborepo monorepo 기본 구조 생성, TypeScript 설정

**작업**:
1. **Root 패키지 초기화**:
   - `pnpm init` → package.json 생성 (private: true)
   - pnpm-workspace.yaml 생성
   - turbo.json 생성
   - tsconfig.base.json 생성
   - .gitignore 업데이트

2. **Registry 패키지 생성**:
   - `packages/registry/` 디렉토리 생성
   - package.json 생성 (`@ai-toolkit/registry`)
   - tsconfig.json 생성 (extends base)
   - src/index.ts, src/PathResolver.ts, src/types.ts 생성
   - data/agents.json 생성 (6개 에이전트 메타데이터)

3. **CLI 패키지 생성**:
   - `packages/cli/` 디렉토리 생성
   - package.json 생성 (`@ai-toolkit/cli`)
   - tsconfig.json 생성
   - src/index.ts, bin/ai-toolkit.js 생성
   - package.json에 bin 필드 추가

4. **빌드 테스트**:
   - `pnpm install` → workspace 설정 확인
   - `pnpm turbo build` → 빌드 성공 확인
   - `node packages/cli/bin/ai-toolkit.js` → 진입점 확인

**완료 조건**:
- ✅ `pnpm turbo build` 성공
- ✅ `npx . --help` 실행 시 CLI 진입 (로컬 테스트)

### 4.2 Phase 2: 핵심 모듈 구현 (P0)

**목표**: CLI 플래그 파싱, 인터랙티브 프롬프트, 경로 매핑

**작업**:
1. **CommandHandler 구현**:
   - commander로 플래그 파싱
   - `--skills`, `--rules`, `--commands`, `--agents-resource` 지원
   - `--source`, `--on-duplicate`, `--yes`, `--scope`, `--agents` 지원
   - 인터랙티브 vs 비인터랙티브 분기

2. **InteractivePrompt 구현**:
   - inquirer로 Type, Source, Resources, Agents, Scope 선택
   - 검증 로직 (빈 입력 방지)

3. **PathResolver 구현**:
   - agents.json 로드
   - resolveAgentPath() 구현
   - ~ → $HOME 치환

4. **단위 테스트**:
   - CommandHandler 플래그 파싱 테스트
   - PathResolver 경로 매핑 테스트

**완료 조건**:
- ✅ 인터랙티브 모드에서 Type, Source 입력까지 동작
- ✅ 6개 에이전트 경로 정확히 매핑

### 4.3 Phase 3: Source Resolution (P0)

**목표**: GitHub/Bitbucket/로컬에서 파일 목록 가져오기

**작업**:
1. **LocalResolver 구현**:
   - fs.readdir() 재귀 탐색
   - SKILL.md, RULES.md, COMMANDS.md, AGENT.md 필터링
   - 폴더 전체 포함 로직

2. **GitHubResolver 구현**:
   - octokit으로 GitHub API 호출
   - `/repos/:owner/:repo/git/trees/:sha?recursive=1` 사용
   - 3 depth 제한
   - raw 파일 다운로드

3. **SourceResolver 통합**:
   - 소스 타입 자동 감지 (owner/repo, https://, ./, /)
   - 적절한 Resolver로 라우팅

4. **에러 핸들링**:
   - GitHub rate limit 초과 시 명확한 메시지
   - 네트워크 오류 시 재시도 (최대 3회)

**완료 조건**:
- ✅ GitHub public repo에서 파일 목록 성공적으로 가져옴
- ✅ 로컬 디렉토리에서 파일 목록 성공적으로 가져옴

### 4.4 Phase 4: Resource Parsing (P0)

**목표**: 파일 → Resource 객체 변환

**작업**:
1. **YAMLParser 구현**:
   - `---` 블록 추출
   - yaml 라이브러리로 파싱

2. **ResourceParser 구현**:
   - YAML frontmatter에서 name, description, metadata 추출
   - 없으면 파일명에서 유추
   - 폴더 전체 포함 시 하위 파일 매핑

3. **단위 테스트**:
   - 정상적인 SKILL.md 파싱
   - frontmatter 없는 파일 처리
   - 잘못된 YAML 처리

**완료 조건**:
- ✅ 기존 스킬 (workflow-framework 등) 정확히 파싱
- ✅ name, description, metadata 추출 성공

### 4.5 Phase 5: 설치 로직 구현 (P0)

**목표**: 파일 복사, 중복 감지, Skip/Overwrite 처리

**작업**:
1. **FileWriter 구현**:
   - 원자적 쓰기 (임시 파일 → rename)
   - 디렉토리 자동 생성 (fs.mkdirSync recursive)

2. **DuplicateHandler 구현**:
   - checkDuplicate(): 경로 존재 여부 + 해시 비교
   - skip(), overwrite() 구현

3. **InstallManager 구현**:
   - 설치 요청 배열 받아 순차 처리
   - 중복 발견 시 DuplicateHandler로 라우팅
   - InstallResult 생성

4. **통합 테스트**:
   - 신규 설치 성공
   - 중복 Skip 성공
   - 중복 Overwrite 성공

**완료 조건**:
- ✅ GitHub에서 가져온 스킬을 로컬 .claude/skills/에 설치 성공
- ✅ 중복 감지 시 Skip/Overwrite 정상 동작

### 4.6 Phase 6: 중복 처리 고급 기능 (P1)

**목표**: Rename, Backup, Compare 구현

**작업**:
1. **Rename 구현**:
   - 자동 넘버링 (skill-2, skill-3)
   - 최대 넘버 탐색 후 +1

2. **Backup 구현**:
   - 기존 파일을 `.backup` 확장자로 복사
   - 백업 경로 InstallResult에 포함

3. **Compare 구현**:
   - diff 라이브러리로 unified diff 생성
   - 터미널 출력 (chalk로 색상)
   - 사용자 선택 (Skip/Overwrite)

4. **일괄 처리**:
   - 여러 중복 발견 시 "Ask each", "Skip all", "Overwrite all", "Backup all" 선택
   - 선택에 따라 전체 적용

**완료 조건**:
- ✅ Rename 시 skill-2, skill-3 자동 생성
- ✅ Backup 시 .backup 파일 생성 확인
- ✅ Compare 시 diff 출력 확인

### 4.7 Phase 7: 결과 출력 및 로깅 (P1)

**목표**: 설치 결과 표시, 로그 파일 생성

**작업**:
1. **Logger 구현**:
   - chalk로 색상 출력 (✓, ○, ↻, ✗)
   - 신규 설치, 건너뜀, 덮어씀, 실패 분류
   - 각 카테고리별 개수 표시

2. **Progress bar**:
   - ora 스피너로 진행 상황 표시
   - "Installing 3/10 resources..."

3. **로그 파일 생성** (선택):
   - `.ai-toolkit-install.log` 생성
   - JSON 형태로 InstallResult 배열 저장

**완료 조건**:
- ✅ 설치 완료 시 결과 요약 출력 (CLI-PRD 예시 형태)
- ✅ 진행 상황 스피너 표시

### 4.8 Phase 8: Bitbucket 및 URL 지원 (P1)

**목표**: Bitbucket, 직접 URL 소스 지원

**작업**:
1. **BitbucketResolver 구현**:
   - Bitbucket API로 파일 트리 가져오기
   - GitHub과 동일한 인터페이스

2. **URLResolver 구현**:
   - fetch()로 단일 파일 다운로드
   - Content-Type 검증

3. **통합 테스트**:
   - Bitbucket repo에서 설치
   - 직접 URL에서 설치

**완료 조건**:
- ✅ Bitbucket public repo에서 설치 성공
- ✅ 직접 URL에서 설치 성공

### 4.9 Phase 9: CI/CD 및 배포 (P1)

**목표**: npm publish, CI/CD 설정

**작업**:
1. **npm publish 설정**:
   - package.json에 files, publishConfig 추가
   - README.md 작성
   - LICENSE 파일 추가 (MIT)

2. **GitHub Actions CI**:
   - .github/workflows/ci.yml 생성
   - pnpm turbo build, test 실행
   - npm publish (tag push 시)

3. **테스트**:
   - `npm pack` → .tgz 파일 생성 확인
   - `npx <tarball>` → 로컬 테스트

**완료 조건**:
- ✅ npm에 @ai-toolkit/cli 퍼블리시 성공
- ✅ `npx @ai-toolkit/cli` 실행 성공

### 4.10 Phase 10: Registry 리소스 및 추가 기능 (P2)

**목표**: 공식 리소스 카탈로그, Uninstall/List/Update 명령어

**작업**:
1. **Registry resources/ 구축**:
   - packages/registry/resources/skills/ 생성
   - 공식 스킬 추가 (예: commit, review-pr)

2. **ResourceCatalog 구현**:
   - resources/ 인덱싱
   - `--catalog` 플래그로 공식 리소스 목록 표시

3. **Uninstall 명령어**:
   - `npx ai-toolkit uninstall --skills=commit`
   - 설치된 리소스 삭제

4. **List 명령어**:
   - `npx ai-toolkit list`
   - 설치된 리소스 목록 표시

**완료 조건**:
- ✅ `--catalog` 플래그로 공식 리소스 목록 표시
- ✅ `uninstall`, `list` 명령어 동작

---

## 5. 기술적 위험 요소 및 대응 방안

### 5.1 위험 요소

| 위험 | 영향 | 확률 | 대응 방안 |
|------|------|------|----------|
| **GitHub API rate limit** | 사용자가 60 req/hour 초과 시 설치 실패 | 중 | ① 명확한 에러 메시지 + GitHub token 권장 ② 로컬/URL 소스 권장 |
| **파일 시스템 권한 오류** | global 경로 설치 시 권한 부족 | 중 | ① 에러 메시지에 `sudo` 권장 포함 ② project scope 기본값 설정 |
| **네트워크 오류** | GitHub/Bitbucket 다운로드 실패 | 중 | ① 재시도 로직 (최대 3회) ② timeout 설정 (30초) |
| **YAML 파싱 오류** | 잘못된 frontmatter로 인한 실패 | 낮 | ① try-catch로 감싸기 ② 파일명에서 name 유추 |
| **경로 충돌** | 에이전트 경로가 사용자 설정과 다름 | 낮 | ① agents.json을 사용자가 수정 가능하도록 안내 ② 플래그로 직접 경로 지정 (--path) |
| **Monorepo 빌드 실패** | TypeScript/Turborepo 설정 오류 | 낮 | ① 간단한 tsconfig로 시작 ② CI에서 빌드 검증 |

### 5.2 성능 고려사항

**GitHub API 호출 최소화**:
- `/repos/:owner/:repo/git/trees/:sha?recursive=1` 한 번 호출로 전체 트리 가져오기
- 파일 다운로드는 병렬 처리 (Promise.all)

**파일 시스템 최적화**:
- 원자적 쓰기로 데이터 손실 방지
- 디렉토리 생성 시 recursive 옵션 사용

**메모리 효율성**:
- 대용량 파일 스트림 처리 (향후 P3)
- 현재는 파일 크기 제한 없음 (텍스트 파일 중심)

---

## 6. 테스트 전략

### 6.1 단위 테스트 (Vitest)

**대상**:
- CommandHandler: 플래그 파싱
- PathResolver: 경로 매핑
- YAMLParser: frontmatter 파싱
- hash.ts: SHA-256 해시 계산
- fs-safe.ts: 원자적 쓰기

**커버리지 목표**: 80% 이상

### 6.2 통합 테스트

**시나리오**:
1. GitHub repo → 로컬 설치 (project scope)
2. 로컬 디렉토리 → 글로벌 설치 (global scope)
3. 중복 Skip 처리
4. 중복 Overwrite 처리
5. 중복 Rename 처리
6. 일괄 Skip all

**환경**:
- 테스트용 GitHub repo 생성 (ai-toolkit-test-resources)
- 로컬 임시 디렉토리 생성 (테스트 후 삭제)

### 6.3 E2E 테스트

**시나리오**:
1. `npx ai-toolkit --skills --source=owner/repo --agents=claude-code --scope=project --on-duplicate=skip`
2. 인터랙티브 모드 전체 플로우 (수동 테스트)

**도구**: 수동 테스트 (향후 Playwright로 자동화 고려)

---

## 7. 문서화 계획

### 7.1 README.md

**내용**:
- 설치 방법 (`npx ai-toolkit`)
- 사용 예시 (인터랙티브, 비인터랙티브)
- 플래그 목록
- 지원 에이전트 목록
- 기여 가이드

### 7.2 CONTRIBUTING.md

**내용**:
- 개발 환경 설정 (pnpm, Turborepo)
- 빌드 방법 (`pnpm turbo build`)
- 테스트 실행 (`pnpm turbo test`)
- PR 가이드라인

### 7.3 agents.json 문서화

**내용**:
- 에이전트 추가 방법
- 경로 커스터마이징 방법

---

## 8. 다음 단계 (Step 3 준비사항)

Step 3 (Task Analysis)에서 고려해야 할 사항:

### 8.1 서브태스크 분해 기준

- **파일 단위**: 각 핵심 모듈을 개별 서브태스크로
  - 예: `01-TASK-CommandHandler.md`, `02-TASK-PathResolver.md`
- **Phase 단위**: 초기화 → 핵심 모듈 → Source → Parser → Install → ...
- **의존성 고려**: Registry 빌드 → CLI 빌드

### 8.2 병렬 실행 가능 작업

- `GitHubResolver`, `BitbucketResolver`, `LocalResolver` 동시 구현 가능
- `DuplicateHandler`의 skip/overwrite/rename/backup 동시 구현 가능
- 단위 테스트 작성 병렬 가능

### 8.3 순차 실행 필수 작업

- Phase 1 (초기화) → Phase 2 (핵심 모듈)
- ResourceParser → InstallManager (파싱 후 설치)

### 8.4 우선순위 결정

- **P0**: Phase 1-5 (프로젝트 초기화 ~ 기본 설치)
- **P1**: Phase 6-8 (고급 중복 처리 ~ Bitbucket/URL)
- **P2**: Phase 9-10 (배포 ~ Registry 리소스)

---

## 9. 체크리스트

### 9.1 설계 완료 확인

- [x] 코드베이스 분석 완료 (기존 스킬 패턴 파악)
- [x] Turborepo monorepo 구조 설계
- [x] 핵심 모듈 6개 설계 (CommandHandler, SourceResolver, ResourceParser, InstallManager, InteractivePrompt, PathResolver)
- [x] agents.json 구조 설계 (6개 에이전트 경로)
- [x] 중복 처리 전략 상세 설계 (5가지 옵션)
- [x] 기술 스택 결정 (TypeScript, pnpm, Turborepo, inquirer, commander, octokit)
- [x] 구현 계획 10단계 수립
- [x] 위험 요소 식별 및 대응 방안 수립
- [x] 테스트 전략 수립

### 9.2 다음 Step 준비

- [x] Phase별 작업 분해 준비 완료
- [x] 의존성 그래프 고려사항 정리
- [x] 우선순위 기준 명확화

---

## 10. 마무리

**Step 2 완료 상태**: ✅

**주요 결정사항**:
1. **Turborepo monorepo**: CLI와 Registry 패키지 분리
2. **6개 핵심 모듈**: CommandHandler, SourceResolver, ResourceParser, InstallManager, InteractivePrompt, PathResolver
3. **10단계 구현 계획**: 초기화 → 핵심 → Source → Parser → Install → 고급 중복 처리 → 결과 출력 → Bitbucket/URL → 배포 → Registry
4. **기술 스택**: TypeScript + pnpm + Turborepo + inquirer + commander + octokit

**다음 Step**: Step 3 (Task Analysis)에서 구현 작업을 서브태스크로 분해하고 병렬화 계획 수립
