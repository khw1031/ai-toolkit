# 03-TASK: PathResolver CLI 이동 및 확장

## 메타데이터

```yaml
우선순위: P1
복잡도: High
의존성: 01-TASK
차단: 05, 06
예상 LOC: ~150
```

## 목표

Registry 패키지의 PathResolver를 CLI로 이동하고, Agent별 지원 타입 조회와 경로 해석 기능을 확장합니다.

## 범위

### 포함

- `packages/cli/src/path/PathResolver.ts` 생성
- agents.json 로드 로직
- `getSupportedTypes(agent)` 메서드
- `resolveAgentPath(agent, type, scope)` 메서드
- Registry 패키지에서 PathResolver export 제거

### 제외

- InteractivePrompt 연동 (05-TASK에서 처리)
- 레거시 resolver 제거 (07-TASK에서 처리)

## 구현 가이드

### 1. PathResolver 클래스 생성

**파일**: `packages/cli/src/path/PathResolver.ts`

```typescript
import { AgentKey, ResourceType, AgentConfig } from '../types.js';
import agentsData from '@anthropic/ai-toolkit-registry/data/agents.json';

export class PathResolver {
  private agents: Record<AgentKey, AgentConfig>;

  constructor() {
    this.agents = agentsData as Record<AgentKey, AgentConfig>;
  }

  /**
   * Agent가 지원하는 리소스 타입 목록 반환
   */
  getSupportedTypes(agent: AgentKey): ResourceType[] {
    return this.agents[agent].supportedTypes;
  }

  /**
   * Agent별 설치 경로 해석
   * @param agent - 대상 에이전트
   * @param type - 리소스 타입
   * @param scope - 설치 범위 (project | global)
   * @returns 설치 경로 또는 null (미지원)
   */
  resolveAgentPath(
    agent: AgentKey,
    type: ResourceType,
    scope: 'project' | 'global'
  ): string | null {
    const agentConfig = this.agents[agent];
    const paths = agentConfig.paths[scope];
    return paths[type];
  }

  /**
   * 모든 Agent 목록 반환
   */
  getAgents(): AgentKey[] {
    return Object.keys(this.agents) as AgentKey[];
  }

  /**
   * Agent 설정 전체 반환
   */
  getAgentConfig(agent: AgentKey): AgentConfig {
    return this.agents[agent];
  }

  /**
   * 타입이 Agent에서 지원되는지 확인
   */
  isTypeSupported(agent: AgentKey, type: ResourceType): boolean {
    return this.agents[agent].supportedTypes.includes(type);
  }
}

export const pathResolver = new PathResolver();
```

### 2. Index 파일 생성

**파일**: `packages/cli/src/path/index.ts`

```typescript
export { PathResolver, pathResolver } from './PathResolver.js';
```

### 3. Registry 패키지 정리

**파일**: `packages/registry/src/index.ts`

```typescript
// PathResolver export 제거
// 기존: export { PathResolver } from './PathResolver.js';
// 변경: 제거

// 데이터만 export
export { default as agentsData } from '../data/agents.json';
```

## 테스트 요구사항

### 단위 테스트

```typescript
describe('PathResolver', () => {
  const resolver = new PathResolver();

  describe('getSupportedTypes', () => {
    it('claude-code는 4개 타입 모두 지원', () => {
      expect(resolver.getSupportedTypes('claude-code'))
        .toEqual(['skills', 'rules', 'commands', 'agents']);
    });

    it('github-copilot은 skills, rules만 지원', () => {
      expect(resolver.getSupportedTypes('github-copilot'))
        .toEqual(['skills', 'rules']);
    });
  });

  describe('resolveAgentPath', () => {
    it('claude-code skills project 경로', () => {
      expect(resolver.resolveAgentPath('claude-code', 'skills', 'project'))
        .toBe('.claude/skills/');
    });

    it('github-copilot rules는 instructions 경로', () => {
      expect(resolver.resolveAgentPath('github-copilot', 'rules', 'project'))
        .toBe('.github/instructions/');
    });

    it('github-copilot commands는 null', () => {
      expect(resolver.resolveAgentPath('github-copilot', 'commands', 'project'))
        .toBeNull();
    });
  });

  describe('isTypeSupported', () => {
    it('antigravity는 agents 미지원', () => {
      expect(resolver.isTypeSupported('antigravity', 'agents'))
        .toBe(false);
    });
  });
});
```

### 엣지 케이스

- [ ] 미지원 타입 요청 시 null 반환
- [ ] global scope 경로 해석 (~/ 처리)

## 체크리스트

### 구현 전

- [ ] 01-TASK 완료 확인 (types.ts, agents.json)
- [ ] 기존 PathResolver 코드 확인 (있다면)

### 구현 중

- [ ] `packages/cli/src/path/` 디렉토리 생성
- [ ] PathResolver 클래스 구현
- [ ] agents.json import 경로 확인
- [ ] 모든 메서드 타입 명시

### 구현 후

- [ ] TypeScript 컴파일 성공
- [ ] 단위 테스트 통과
- [ ] Registry 패키지에서 PathResolver export 제거

## 통합 포인트

### Export (이 태스크의 출력)

```typescript
// packages/cli/src/path/index.ts
export { PathResolver, pathResolver } from './PathResolver.js';
```

### Import (다른 태스크에서 사용)

- 05-TASK: InteractivePrompt에서 `getSupportedTypes()` 호출
- 06-TASK: CommandHandler에서 `resolveAgentPath()` 호출
