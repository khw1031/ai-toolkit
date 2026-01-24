# 01-TASK: 타입 정의 및 agents.json 확장

## 메타데이터

```yaml
우선순위: P0
복잡도: Medium
의존성: None
차단: 03, 04, 05
예상 LOC: ~100
```

## 목표

TypeScript 타입 정의를 확장하고 agents.json에 supportedTypes와 경로 매핑을 추가합니다.

## 범위

### 포함

- `packages/cli/src/types.ts` 수정
- `packages/registry/data/agents.json` 확장

### 제외

- 실제 로직 구현 (다른 태스크에서 처리)
- 테스트 코드

## 구현 가이드

### 1. types.ts 수정

**파일**: `packages/cli/src/types.ts`

```typescript
// 기존 AgentKey 타입 제한 (4개만)
export type AgentKey = 'claude-code' | 'cursor' | 'github-copilot' | 'antigravity';

// 신규: Registry 디렉토리 타입
export type RegistryDirectory = 'common' | 'frontend' | 'app';

// 신규: 리소스 타입 (통일)
export type ResourceType = 'skills' | 'rules' | 'commands' | 'agents';

// AgentConfig 확장
export interface AgentConfig {
  name: string;
  supportedTypes: ResourceType[];  // 신규
  paths: {
    project: AgentPaths;
    global: AgentPaths;
  };
}

// AgentPaths 정의
export interface AgentPaths {
  skills: string;
  rules: string;
  commands: string | null;  // null = 미지원
  agents: string | null;    // null = 미지원
}

// InteractiveResult 변경
export interface InteractiveResult {
  agent: AgentKey;
  directory: RegistryDirectory;
  types: ResourceType[];
  resources: Resource[];
  scope: 'project' | 'global';
}
```

### 2. agents.json 확장

**파일**: `packages/registry/data/agents.json`

```json
{
  "claude-code": {
    "name": "Claude Code",
    "supportedTypes": ["skills", "rules", "commands", "agents"],
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
    "supportedTypes": ["skills", "rules", "commands"],
    "paths": {
      "project": {
        "skills": ".cursor/skills/",
        "rules": ".cursor/rules/",
        "commands": ".cursor/commands/",
        "agents": null
      },
      "global": {
        "skills": "~/.cursor/skills/",
        "rules": "~/.cursor/rules/",
        "commands": "~/.cursor/commands/",
        "agents": null
      }
    }
  },
  "github-copilot": {
    "name": "GitHub Copilot",
    "supportedTypes": ["skills", "rules"],
    "paths": {
      "project": {
        "skills": ".github/skills/",
        "rules": ".github/instructions/",
        "commands": null,
        "agents": null
      },
      "global": {
        "skills": "~/.copilot/skills/",
        "rules": "~/.copilot/instructions/",
        "commands": null,
        "agents": null
      }
    }
  },
  "antigravity": {
    "name": "Antigravity",
    "supportedTypes": ["skills", "rules", "commands"],
    "paths": {
      "project": {
        "skills": ".agent/skills/",
        "rules": ".agent/rules/",
        "commands": ".agent/workflows/",
        "agents": null
      },
      "global": {
        "skills": "~/.gemini/antigravity/skills/",
        "rules": "~/.gemini/antigravity/rules/",
        "commands": "~/.gemini/antigravity/workflows/",
        "agents": null
      }
    }
  }
}
```

## 테스트 요구사항

### 단위 테스트

- [ ] AgentKey 타입이 4개만 허용하는지 확인 (TypeScript 컴파일 테스트)
- [ ] agents.json이 AgentConfig 스키마와 일치하는지 확인

### 엣지 케이스

- [ ] null 경로 처리 (미지원 타입)

## 체크리스트

### 구현 전

- [ ] 기존 types.ts 구조 확인
- [ ] 기존 agents.json 구조 확인

### 구현 중

- [ ] AgentKey 타입 4개로 제한
- [ ] RegistryDirectory 타입 추가
- [ ] AgentConfig에 supportedTypes 추가
- [ ] agents.json 4개 agent 모두 작성

### 구현 후

- [ ] TypeScript 컴파일 에러 없음
- [ ] JSON 문법 유효성 검증

## 통합 포인트

### Export (이 태스크의 출력)

```typescript
// types.ts에서 export
export type AgentKey
export type RegistryDirectory
export type ResourceType
export interface AgentConfig
export interface AgentPaths
export interface InteractiveResult
```

### Import (다른 태스크에서 사용)

- 03-TASK: PathResolver에서 AgentConfig, AgentPaths 사용
- 04-TASK: RegistryResolver에서 RegistryDirectory 사용
- 05-TASK: InteractivePrompt에서 AgentKey, ResourceType, InteractiveResult 사용
