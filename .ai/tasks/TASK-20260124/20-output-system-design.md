# Step 2: Design & Planning 결과

## 1. 요약

CLI Interactive 모드를 Agent 중심으로 재설계한다. 기존 소스 선택(GitHub/Local/URL) 로직을 제거하고 Registry 전용으로 단순화한다. Agent별 지원 타입 필터링과 특수 경로 매핑(instructions, workflows)을 구현한다.

## 2. 코드베이스 분석

### 2.1 프로젝트 구조

```
packages/
├── cli/
│   └── src/
│       ├── commands/
│       │   └── CommandHandler.ts    # CLI 메인 라우터
│       ├── prompts/
│       │   └── InteractivePrompt.ts # Inquirer 기반 UI
│       ├── source/                  # 제거 대상
│       │   ├── GitHubResolver.ts
│       │   ├── LocalResolver.ts
│       │   ├── URLResolver.ts
│       │   └── BitbucketResolver.ts
│       ├── parser/
│       │   └── ResourceParser.ts    # 리소스 파싱
│       ├── install/
│       │   ├── InstallManager.ts    # 설치 관리
│       │   ├── DuplicateHandler.ts
│       │   └── BatchHandler.ts
│       ├── utils/
│       │   └── Logger.ts
│       └── types.ts
│
└── registry/
    ├── src/
    │   ├── index.ts
    │   ├── PathResolver.ts          # CLI로 이동
    │   └── types.ts
    ├── data/
    │   └── agents.json              # 확장 필요
    └── resources/                   # 구조 재설계
        └── skills/hello-world/
```

### 2.2 기존 패턴

- **코딩 컨벤션**: TypeScript, ESM, Class 기반
- **아키텍처 패턴**:
  - Resolver 패턴 (소스별 분리)
  - Handler 패턴 (중복 처리)
  - Prompt 패턴 (Inquirer 래핑)

### 2.3 관련 기존 코드

| 파일/모듈 | 역할 | 변경 사항 |
|-----------|------|----------|
| `CommandHandler.ts` | CLI 라우팅 | Non-interactive 제거, Registry 전용 |
| `InteractivePrompt.ts` | UI 프롬프트 | 순서 변경 (Agent → Directory → Type) |
| `types.ts` | 타입 정의 | AgentKey 제한, supportedTypes 추가 |
| `PathResolver.ts` | 경로 해석 | CLI로 이동, 경로 매핑 추가 |
| `agents.json` | Agent 설정 | supportedTypes, pathMapping 추가 |
| `GitHubResolver.ts` 등 | 소스 해석 | **제거** |

## 3. 아키텍처 설계

### 3.1 컴포넌트 구조 (변경 후)

```
┌─────────────────────────────────────────────────────────────┐
│                      CommandHandler                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              InteractivePrompt (새 플로우)           │   │
│  │  Agent → Directory → Type → Resources → Confirm     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RegistryResolver (신규)                  │
│  - Registry 내부 디렉토리/리소스 탐색                       │
│  - packages/registry/resources/{common,frontend,app}/       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     ResourceParser                          │
│  - SKILL.md, RULES.md 등 파싱 (기존 유지)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PathResolver (CLI로 이동)                  │
│  - Agent별 설치 경로 해석                                   │
│  - 특수 경로 매핑 (rules→instructions, commands→workflows)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     InstallManager                          │
│  - 설치 실행 (기존 유지)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름 (새 Interactive 플로우)

```
1. selectAgent()
   └─→ AgentKey[] (4개: claude-code, cursor, github-copilot, antigravity)

2. selectDirectory()
   └─→ string (common | frontend | app)

3. selectType(agent)
   └─→ ResourceType[] (agent가 지원하는 타입만 필터링)
   └─→ Agent별 필터:
       - claude-code: [skills, rules, commands, agents]
       - cursor: [skills, rules, commands]
       - github-copilot: [skills, rules]
       - antigravity: [skills, rules, commands]

4. RegistryResolver.resolve(directory, types)
   └─→ Resource[] (registry/resources/{directory}/{type}/ 탐색)

5. selectResources(resources)
   └─→ Resource[] (사용자 선택)

6. selectScope()
   └─→ 'project' | 'global'

7. confirmInstallation()
   └─→ boolean

8. PathResolver.resolveAgentPath(agent, type, scope)
   └─→ 실제 설치 경로 (경로 매핑 적용)

9. InstallManager.install(requests)
   └─→ InstallResult[]
```

### 3.3 인터페이스 정의

```typescript
// types.ts 변경

// Agent 제한 (4개)
export type AgentKey = 'claude-code' | 'cursor' | 'github-copilot' | 'antigravity';

// Directory 타입 추가
export type RegistryDirectory = 'common' | 'frontend' | 'app';

// Agent 설정 확장
export interface AgentConfig {
  name: string;
  supportedTypes: ResourceType[];  // 신규: 지원 타입
  paths: {
    project: AgentPaths;
    global: AgentPaths;
  };
  pathMapping?: {  // 신규: 특수 경로 매핑
    rules?: string;     // github-copilot: '.github/instructions/'
    commands?: string;  // antigravity: '.agent/workflows/'
  };
}

// InteractiveResult 변경
export interface InteractiveResult {
  agent: AgentKey;           // 단일 agent 선택
  directory: RegistryDirectory;
  types: ResourceType[];
  resources: Resource[];
  scope: 'project' | 'global';
}
```

### 3.4 agents.json 확장 스키마

```json
{
  "claude-code": {
    "name": "Claude Code",
    "supportedTypes": ["skill", "rule", "command", "agent"],
    "paths": {
      "project": {
        "skills": ".claude/skills/",
        "rules": ".claude/rules/",
        "commands": ".claude/commands/",
        "agents": ".claude/agents/"
      },
      "global": { ... }
    }
  },
  "github-copilot": {
    "name": "GitHub Copilot",
    "supportedTypes": ["skill", "rule"],
    "paths": {
      "project": {
        "skills": ".github/skills/",
        "rules": ".github/instructions/",
        "commands": null,
        "agents": null
      },
      "global": { ... }
    }
  },
  "antigravity": {
    "name": "Antigravity",
    "supportedTypes": ["skill", "rule", "command"],
    "paths": {
      "project": {
        "skills": ".agent/skills/",
        "rules": ".agent/rules/",
        "commands": ".agent/workflows/",
        "agents": null
      },
      "global": { ... }
    }
  }
}
```

### 3.5 Registry 디렉토리 구조

```
packages/registry/resources/
├── common/
│   ├── skills/
│   │   └── hello-world/
│   │       └── SKILL.md
│   ├── rules/
│   │   └── coding-standards/
│   │       └── RULES.md
│   ├── commands/
│   └── agents/
├── frontend/
│   ├── skills/
│   ├── rules/
│   ├── commands/
│   └── agents/
└── app/
    ├── skills/
    ├── rules/
    ├── commands/
    └── agents/
```

## 4. 구현 계획

### Phase 1: 기본 구조 변경

- [ ] `agents.json` 확장 (supportedTypes, pathMapping, Agent 제한)
- [ ] `types.ts` 업데이트 (AgentKey 제한, RegistryDirectory 추가)
- [ ] Registry 디렉토리 구조 생성 (`resources/{common,frontend,app}/`)

### Phase 2: PathResolver 이동 및 확장

- [ ] `PathResolver.ts`를 CLI로 이동 (`packages/cli/src/path/PathResolver.ts`)
- [ ] 경로 매핑 로직 추가 (rules→instructions, commands→workflows)
- [ ] `getSupportedTypes(agent)` 메서드 추가
- [ ] Registry 패키지에서 PathResolver 제거, 데이터만 export

### Phase 3: RegistryResolver 구현

- [ ] 신규 `RegistryResolver.ts` 생성
- [ ] Registry 내부 디렉토리 탐색 로직 구현
- [ ] Directory별 리소스 탐색 (`resources/{directory}/{type}/`)

### Phase 4: InteractivePrompt 리팩토링

- [ ] 순서 변경: `selectAgent()` → `selectDirectory()` → `selectType()` → `selectResources()`
- [ ] `selectType()`: Agent별 지원 타입 필터링
- [ ] Source 선택 제거

### Phase 5: CommandHandler 단순화

- [ ] `runNonInteractive()` 제거
- [ ] `isInteractive()` 제거 (항상 interactive)
- [ ] Source resolver 분기 제거
- [ ] Registry 전용 로직으로 단순화

### Phase 6: 코드 정리

- [ ] 제거: `GitHubResolver.ts`, `LocalResolver.ts`, `URLResolver.ts`, `BitbucketResolver.ts`
- [ ] 제거: 관련 테스트 파일들
- [ ] Registry 패키지 정리 (PathResolver 제거 후)

### Phase 7: 테스트 및 문서화

- [ ] 새 플로우 테스트 작성
- [ ] README 업데이트

## 5. 기술적 위험 및 대응

| 위험 요소 | 영향도 | 대응 방안 |
|-----------|--------|----------|
| Breaking change (기존 CLI 사용자) | Medium | README에 마이그레이션 가이드 추가 |
| 경로 매핑 오류 | High | 단위 테스트로 모든 경로 매핑 검증 |
| Registry 구조 불일치 | Medium | 구조 검증 스크립트 추가 |

## 6. 제거 파일 목록

### CLI 패키지 (`packages/cli/src/`)

| 파일 | 이유 |
|------|------|
| `source/GitHubResolver.ts` | Registry 전용으로 변경 |
| `source/GitHubResolver.test.ts` | 위와 동일 |
| `source/LocalResolver.ts` | Registry 전용으로 변경 |
| `source/LocalResolver.test.ts` | 위와 동일 |
| `source/URLResolver.ts` | Registry 전용으로 변경 |
| `source/URLResolver.test.ts` | 위와 동일 |
| `source/BitbucketResolver.ts` | Registry 전용으로 변경 |
| `source/BitbucketResolver.test.ts` | 위와 동일 |

### Registry 패키지 수정

| 파일 | 변경 |
|------|------|
| `src/PathResolver.ts` | CLI로 이동 후 제거 |
| `src/index.ts` | PathResolver export 제거 |

## 7. 다음 단계

Step 3에서 구현 시 주의사항:
- Phase 1-3을 먼저 완료한 후 Phase 4-5 진행 (의존성)
- 경로 매핑 테스트를 반드시 먼저 작성
- 제거 작업은 새 기능 완료 후 진행
