# 08-TASK: 테스트 및 문서화

## 메타데이터

```yaml
우선순위: P2
복잡도: Medium
의존성: 07-TASK
차단: None
예상 LOC: ~150
```

## 목표

새 기능에 대한 테스트를 작성하고 README를 업데이트합니다.

## 범위

### 포함

- PathResolver 단위 테스트
- RegistryResolver 단위 테스트
- InteractivePrompt 통합 테스트 (mock 기반)
- README.md 업데이트

### 제외

- E2E 테스트 (수동 테스트로 대체)
- 상세 API 문서 (나중에 필요 시)

## 구현 가이드

### 1. PathResolver 테스트

**파일**: `packages/cli/src/path/PathResolver.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PathResolver } from './PathResolver.js';

describe('PathResolver', () => {
  const resolver = new PathResolver();

  describe('getAgents', () => {
    it('4개 agent 반환', () => {
      const agents = resolver.getAgents();
      expect(agents).toHaveLength(4);
      expect(agents).toContain('claude-code');
      expect(agents).toContain('cursor');
      expect(agents).toContain('github-copilot');
      expect(agents).toContain('antigravity');
    });
  });

  describe('getSupportedTypes', () => {
    it('claude-code는 4개 타입 지원', () => {
      const types = resolver.getSupportedTypes('claude-code');
      expect(types).toEqual(['skills', 'rules', 'commands', 'agents']);
    });

    it('cursor는 3개 타입 지원', () => {
      const types = resolver.getSupportedTypes('cursor');
      expect(types).toEqual(['skills', 'rules', 'commands']);
    });

    it('github-copilot은 2개 타입 지원', () => {
      const types = resolver.getSupportedTypes('github-copilot');
      expect(types).toEqual(['skills', 'rules']);
    });

    it('antigravity는 3개 타입 지원', () => {
      const types = resolver.getSupportedTypes('antigravity');
      expect(types).toEqual(['skills', 'rules', 'commands']);
    });
  });

  describe('resolveAgentPath', () => {
    describe('claude-code', () => {
      it('project skills → .claude/skills/', () => {
        expect(resolver.resolveAgentPath('claude-code', 'skills', 'project'))
          .toBe('.claude/skills/');
      });

      it('global rules → ~/.claude/rules/', () => {
        expect(resolver.resolveAgentPath('claude-code', 'rules', 'global'))
          .toBe('~/.claude/rules/');
      });
    });

    describe('github-copilot', () => {
      it('rules → .github/instructions/ (경로 매핑)', () => {
        expect(resolver.resolveAgentPath('github-copilot', 'rules', 'project'))
          .toBe('.github/instructions/');
      });

      it('commands → null (미지원)', () => {
        expect(resolver.resolveAgentPath('github-copilot', 'commands', 'project'))
          .toBeNull();
      });
    });

    describe('antigravity', () => {
      it('commands → .agent/workflows/ (경로 매핑)', () => {
        expect(resolver.resolveAgentPath('antigravity', 'commands', 'project'))
          .toBe('.agent/workflows/');
      });
    });
  });

  describe('isTypeSupported', () => {
    it('claude-code agents 지원', () => {
      expect(resolver.isTypeSupported('claude-code', 'agents')).toBe(true);
    });

    it('cursor agents 미지원', () => {
      expect(resolver.isTypeSupported('cursor', 'agents')).toBe(false);
    });
  });
});
```

### 2. RegistryResolver 테스트

**파일**: `packages/cli/src/source/RegistryResolver.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { RegistryResolver } from './RegistryResolver.js';

describe('RegistryResolver', () => {
  const resolver = new RegistryResolver();

  describe('getDirectories', () => {
    it('3개 디렉토리 반환', () => {
      const dirs = resolver.getDirectories();
      expect(dirs).toEqual(['common', 'frontend', 'app']);
    });
  });

  describe('resolve', () => {
    it('common/skills에서 리소스 찾기', async () => {
      const resources = await resolver.resolve('common', ['skills']);
      expect(resources.length).toBeGreaterThan(0);
    });

    it('빈 디렉토리는 빈 배열', async () => {
      const resources = await resolver.resolve('frontend', ['agents']);
      expect(resources).toEqual([]);
    });

    it('여러 타입 동시 검색', async () => {
      const resources = await resolver.resolve('common', ['skills', 'rules']);
      // skills와 rules 모두 포함
    });
  });

  describe('getResourcePath', () => {
    it('올바른 경로 반환', () => {
      const path = resolver.getResourcePath('common', 'skills', 'hello-world');
      expect(path).toContain('common');
      expect(path).toContain('skills');
      expect(path).toContain('hello-world');
    });
  });
});
```

### 3. README 업데이트

**파일**: `packages/cli/README.md`

```markdown
# AI Toolkit CLI

AI Agent 리소스(Skills, Rules, Commands, Agents)를 쉽게 설치하는 CLI 도구입니다.

## 설치

\`\`\`bash
npm install -g @anthropic/ai-toolkit-cli
\`\`\`

## 사용법

\`\`\`bash
npx ai-toolkit
\`\`\`

### Interactive 플로우

1. **Agent 선택**: 대상 AI agent 선택
   - Claude Code
   - Cursor
   - GitHub Copilot
   - Antigravity

2. **Directory 선택**: 리소스 디렉토리 선택
   - Common: 범용 리소스
   - Frontend: 프론트엔드 관련
   - App: 앱 개발 관련

3. **Type 선택**: 리소스 타입 선택 (Agent별 지원 타입만 표시)
   - Skills: 재사용 가능한 프롬프트/지침
   - Rules: 프로젝트 가이드라인
   - Commands: 커스텀 슬래시 명령어
   - Agents: Agent 설정

4. **Resources 선택**: 설치할 리소스 선택

5. **Scope 선택**: 설치 범위
   - Project: 현재 프로젝트에 설치
   - Global: 홈 디렉토리에 설치

6. **확인 및 설치**

### Agent별 지원 타입

| Agent | Skills | Rules | Commands | Agents |
|-------|:------:|:-----:|:--------:|:------:|
| Claude Code | ✅ | ✅ | ✅ | ✅ |
| Cursor | ✅ | ✅ | ✅ | ❌ |
| GitHub Copilot | ✅ | ✅ | ❌ | ❌ |
| Antigravity | ✅ | ✅ | ✅ | ❌ |

### 설치 경로

각 Agent별로 적절한 경로에 리소스가 설치됩니다:

- **Claude Code**: \`.claude/{skills,rules,commands,agents}/\`
- **Cursor**: \`.cursor/{skills,rules,commands}/\`
- **GitHub Copilot**: \`.github/{skills,instructions}/\`
- **Antigravity**: \`.agent/{skills,rules,workflows}/\`

## 라이선스

MIT
\`\`\`

## 테스트 요구사항

### 테스트 실행

```bash
# 단위 테스트
pnpm test

# 특정 파일만
pnpm test PathResolver.test.ts
pnpm test RegistryResolver.test.ts
```

### 커버리지 목표

- PathResolver: 100%
- RegistryResolver: 80%+

## 체크리스트

### 구현 전

- [ ] 07-TASK 완료 확인 (레거시 제거)
- [ ] 테스트 프레임워크 설정 확인 (vitest)

### 구현 중

- [ ] PathResolver.test.ts 작성
- [ ] RegistryResolver.test.ts 작성
- [ ] README.md 업데이트

### 구현 후

- [ ] 모든 테스트 통과
- [ ] README 내용 정확성 확인
- [ ] CLI 전체 플로우 수동 테스트

## 통합 포인트

### Export (이 태스크의 출력)

- 완성된 테스트 스위트
- 업데이트된 문서

### Import (다른 태스크에서 사용)

- 없음 (최종 태스크)
