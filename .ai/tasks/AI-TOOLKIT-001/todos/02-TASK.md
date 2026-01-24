# Task 02: Registry 패키지 구현

```yaml
우선순위: P0
복잡도: Medium
의존성: 01
차단: 05, 16
```

---

## 목표

`@ai-toolkit/registry` 패키지를 생성하고, 6개 에이전트 메타데이터(agents.json)와 PathResolver를 구현합니다.

---

## 범위

### 포함 사항

- packages/registry/ 디렉토리 구조 생성
- package.json 생성
- tsconfig.json 생성 (extends ../../tsconfig.base.json)
- src/types.ts (타입 정의)
- src/PathResolver.ts (경로 매핑 로직)
- src/index.ts (패키지 진입점)
- data/agents.json (6개 에이전트 메타데이터)
- 빌드 설정 (tsdown 또는 tsc)

### 제외 사항

- resources/ 디렉토리 (공식 리소스, P2에서 진행)
- CLI 패키지와의 통합 (Task 05에서 진행)

---

## 구현 가이드

### 1. package.json

**위치**: `packages/registry/package.json`

```json
{
  "name": "@ai-toolkit/registry",
  "version": "0.1.0",
  "description": "Agent registry and path resolver",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "data"
  ],
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

### 2. tsconfig.json

**위치**: `packages/registry/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. src/types.ts

**위치**: `packages/registry/src/types.ts`

```typescript
export type ResourceType = 'skill' | 'rule' | 'command' | 'agent';

export type AgentKey =
  | 'claude-code'
  | 'cursor'
  | 'antigravity'
  | 'gemini-cli'
  | 'github-copilot'
  | 'opencode';

export interface AgentPaths {
  skills: string;
  rules: string;
  commands: string;
  agents: string;
}

export interface AgentConfig {
  name: string;
  paths: {
    project: AgentPaths;
    global: AgentPaths;
  };
}

export type AgentRegistry = Record<AgentKey, AgentConfig>;
```

### 4. data/agents.json

**위치**: `packages/registry/data/agents.json`

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

### 5. src/PathResolver.ts

**위치**: `packages/registry/src/PathResolver.ts`

```typescript
import * as path from 'node:path';
import * as os from 'node:os';
import agentsData from '../data/agents.json' assert { type: 'json' };
import type { AgentKey, ResourceType, AgentRegistry } from './types';

const agents = agentsData as AgentRegistry;

export class PathResolver {
  /**
   * 에이전트별 경로를 반환합니다.
   * @param agent 에이전트 키
   * @param type 리소스 타입
   * @param scope project 또는 global
   * @returns 절대 경로
   */
  resolveAgentPath(
    agent: AgentKey,
    type: ResourceType,
    scope: 'project' | 'global'
  ): string {
    const agentConfig = agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }

    const basePath = agentConfig.paths[scope][type];
    return this.expandTilde(basePath);
  }

  /**
   * ~ 기호를 $HOME으로 치환합니다.
   */
  private expandTilde(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    return filePath;
  }

  /**
   * 모든 에이전트 목록을 반환합니다.
   */
  getAllAgents(): AgentKey[] {
    return Object.keys(agents) as AgentKey[];
  }

  /**
   * 에이전트 이름을 반환합니다.
   */
  getAgentName(agent: AgentKey): string {
    return agents[agent]?.name || agent;
  }
}
```

### 6. src/index.ts

**위치**: `packages/registry/src/index.ts`

```typescript
export { PathResolver } from './PathResolver';
export type {
  ResourceType,
  AgentKey,
  AgentPaths,
  AgentConfig,
  AgentRegistry,
} from './types';
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/registry/src/PathResolver.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PathResolver } from './PathResolver';

describe('PathResolver', () => {
  const resolver = new PathResolver();

  it('should resolve project skill path for claude-code', () => {
    const path = resolver.resolveAgentPath('claude-code', 'skill', 'project');
    expect(path).toBe('.claude/skills/');
  });

  it('should expand tilde in global paths', () => {
    const path = resolver.resolveAgentPath('claude-code', 'skill', 'global');
    expect(path).toMatch(/\/\.claude\/skills\/$/);
  });

  it('should throw error for unknown agent', () => {
    expect(() =>
      resolver.resolveAgentPath('unknown' as any, 'skill', 'project')
    ).toThrow('Unknown agent: unknown');
  });

  it('should return all agent keys', () => {
    const agents = resolver.getAllAgents();
    expect(agents).toHaveLength(6);
    expect(agents).toContain('claude-code');
    expect(agents).toContain('cursor');
  });
});
```

---

## 체크리스트

### 구현 전

- [ ] Task 01 완료 확인 (packages/registry/ 디렉토리 존재)

### 구현 중

- [ ] package.json 생성
- [ ] tsconfig.json 생성
- [ ] src/types.ts 생성
- [ ] data/agents.json 생성 (6개 에이전트 모두 포함)
- [ ] src/PathResolver.ts 구현
- [ ] src/index.ts 생성
- [ ] PathResolver.test.ts 작성

### 구현 후

- [ ] `pnpm install` (root에서)
- [ ] `pnpm --filter @ai-toolkit/registry build` 성공
- [ ] `pnpm --filter @ai-toolkit/registry test` 통과
- [ ] dist/ 디렉토리 생성 확인
- [ ] dist/index.d.ts 타입 정의 확인

---

## 통합 포인트

### 출력 (Export)

- PathResolver 클래스 (Task 05, 09에서 사용)
- AgentKey, ResourceType 타입 (Task 03, 04에서 사용)
- agents.json 데이터 (Task 10에서 사용)

### 입력 (Import)

- tsconfig.base.json (Task 01에서 생성)

---

## 완료 조건

- [x] packages/registry/ 구조 생성 완료
- [x] agents.json에 6개 에이전트 모두 포함
- [x] PathResolver 구현 및 테스트 통과
- [x] `pnpm turbo build` 성공 (registry 패키지 빌드)

---

## Git 커밋

```bash
git add packages/registry/
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement registry package with agents.json and PathResolver"
```

---

## 완료 후: TASK_MASTER 업데이트

**중요**: 이 작업 완료 후 반드시 `.ai/tasks/AI-TOOLKIT-001/todos/00-TASK_MASTER.md`의 진행 상황을 업데이트하세요.

**업데이트 항목**:
- [ ] 해당 서브태스크의 상태를 `✅ completed`로 변경
- [ ] 최근 업데이트 테이블에 완료 날짜 추가
- [ ] Phase 진행률 업데이트
