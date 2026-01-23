# Task 05: PathResolver 구현

```yaml
우선순위: P0
복잡도: Low
의존성: 02
차단: 09, 16
```

---

## 목표

Registry 패키지의 PathResolver를 구현하여 에이전트별 경로 매핑 기능을 제공합니다.

---

## 범위

### 포함 사항

- PathResolver 클래스 구현
- agents.json 읽기 및 경로 매핑
- ~ (tilde) 확장 (~ → $HOME)
- 에이전트/타입/스코프 조합 경로 반환
- 단위 테스트

### 제외 사항

- agents.json 생성 (Task 02에서 완료)
- 실제 파일 쓰기 (Task 09)

---

## 구현 가이드

### 1. src/PathResolver.ts

**위치**: `packages/registry/src/PathResolver.ts`

```typescript
import { homedir } from 'os';
import { join } from 'path';
import agents from './data/agents.json';
import type { AgentKey, ResourceType, AgentConfig } from './types';

export class PathResolver {
  private agents: Record<AgentKey, AgentConfig>;

  constructor() {
    this.agents = agents as Record<AgentKey, AgentConfig>;
  }

  /**
   * Resolve agent path
   * @param agent - Agent key (claude-code, cursor, etc.)
   * @param type - Resource type (skill, rule, command, agent)
   * @param scope - Install scope (project, global)
   * @returns Resolved path
   */
  resolveAgentPath(
    agent: AgentKey,
    type: ResourceType,
    scope: 'project' | 'global'
  ): string {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }

    const paths = agentConfig.paths[scope];
    if (!paths) {
      throw new Error(`Unknown scope: ${scope}`);
    }

    const pathTemplate = paths[type];
    if (!pathTemplate) {
      throw new Error(`Unknown resource type: ${type}`);
    }

    return this.expandTilde(pathTemplate);
  }

  /**
   * Get all supported agents
   */
  getSupportedAgents(): AgentKey[] {
    return Object.keys(this.agents) as AgentKey[];
  }

  /**
   * Get agent display name
   */
  getAgentName(agent: AgentKey): string {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }
    return agentConfig.name;
  }

  /**
   * Expand ~ to $HOME
   */
  private expandTilde(path: string): string {
    if (path.startsWith('~/')) {
      return join(homedir(), path.slice(2));
    }
    return path;
  }
}
```

### 2. src/index.ts 업데이트

**위치**: `packages/registry/src/index.ts`

```typescript
export { PathResolver } from './PathResolver';
export type { AgentKey, ResourceType, AgentConfig, AgentPaths } from './types';
export { default as agents } from './data/agents.json';
```

### 3. src/types.ts 업데이트

**위치**: `packages/registry/src/types.ts`

```typescript
export type AgentKey =
  | 'claude-code'
  | 'cursor'
  | 'antigravity'
  | 'gemini-cli'
  | 'github-copilot'
  | 'opencode';

export type ResourceType = 'skill' | 'rule' | 'command' | 'agent';

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
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/registry/src/PathResolver.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PathResolver } from './PathResolver';
import { homedir } from 'os';
import { join } from 'path';

describe('PathResolver', () => {
  const resolver = new PathResolver();

  describe('resolveAgentPath', () => {
    it('should resolve project path', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'project');
      expect(path).toBe('.claude/skills/');
    });

    it('should resolve global path with tilde expansion', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'global');
      expect(path).toBe(join(homedir(), '.claude/skills/'));
    });

    it('should resolve different resource types', () => {
      const skillsPath = resolver.resolveAgentPath('cursor', 'skill', 'project');
      const rulesPath = resolver.resolveAgentPath('cursor', 'rule', 'project');
      expect(skillsPath).toBe('.cursor/skills/');
      expect(rulesPath).toBe('.cursor/rules/');
    });

    it('should throw error for unknown agent', () => {
      expect(() => {
        resolver.resolveAgentPath('unknown' as any, 'skill', 'project');
      }).toThrow('Unknown agent: unknown');
    });

    it('should throw error for unknown scope', () => {
      expect(() => {
        resolver.resolveAgentPath('claude-code', 'skill', 'invalid' as any);
      }).toThrow('Unknown scope: invalid');
    });
  });

  describe('getSupportedAgents', () => {
    it('should return all supported agents', () => {
      const agents = resolver.getSupportedAgents();
      expect(agents).toContain('claude-code');
      expect(agents).toContain('cursor');
      expect(agents).toContain('antigravity');
      expect(agents.length).toBe(6);
    });
  });

  describe('getAgentName', () => {
    it('should return agent display name', () => {
      const name = resolver.getAgentName('claude-code');
      expect(name).toBe('Claude Code');
    });

    it('should throw error for unknown agent', () => {
      expect(() => {
        resolver.getAgentName('unknown' as any);
      }).toThrow('Unknown agent: unknown');
    });
  });

  describe('expandTilde', () => {
    it('should expand tilde for global paths', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'global');
      expect(path).toContain(homedir());
      expect(path).not.toContain('~');
    });

    it('should not expand non-tilde paths', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'project');
      expect(path).toBe('.claude/skills/');
    });
  });
});
```

### 수동 테스트

```bash
pnpm --filter @ai-toolkit/registry build
pnpm --filter @ai-toolkit/registry test
```

---

## 체크리스트

### 구현 전

- [ ] Task 02 완료 확인 (agents.json 존재)

### 구현 중

- [ ] PathResolver.ts 구현
- [ ] types.ts 업데이트
- [ ] index.ts export 추가
- [ ] PathResolver.test.ts 작성

### 구현 후

- [ ] `pnpm --filter @ai-toolkit/registry build` 성공
- [ ] `pnpm --filter @ai-toolkit/registry test` 모든 테스트 통과
- [ ] tilde 확장 동작 확인
- [ ] 모든 에이전트 경로 매핑 확인

---

## 통합 포인트

### 출력 (Export)

- PathResolver 클래스 (Task 09에서 사용)
- AgentKey, ResourceType 타입 (Task 04, 09에서 사용)

### 입력 (Import)

- agents.json (Task 02)

---

## 완료 조건

- [x] PathResolver 클래스 구현 완료
- [x] 모든 에이전트 경로 매핑 동작
- [x] Tilde 확장 동작
- [x] 단위 테스트 커버리지 80% 이상
- [x] TypeScript 컴파일 에러 없음

---

## Git 커밋

```bash
git add packages/registry/src/PathResolver.ts packages/registry/src/types.ts packages/registry/src/index.ts packages/registry/src/PathResolver.test.ts
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement PathResolver with agent path mapping"
```
