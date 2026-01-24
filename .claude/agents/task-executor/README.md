# Task Executor 가이드

> 개별 서브태스크를 실행하는 Developer 에이전트

## 개요

Task Executor는 TASK.md 파일을 읽고 해당 작업을 구현합니다. Task Master에 의해 spawn되거나 독립적으로 실행될 수 있습니다.

## 사용 방법

### 방법 1: Task Master에 의한 자동 실행

Task Master가 자동으로 Task Executor를 spawn합니다. 사용자는 별도 조작이 필요하지 않습니다.

### 방법 2: 독립적으로 실행

특정 태스크만 실행하고 싶은 경우:

```
당신은 Task Executor입니다.

TASK_ID: PROJ-001
TASK_FILE: 01-TASK.md

.claude/agents/task-executor/AGENT.md의 지침을 따라
이 태스크를 구현해주세요.
```

## 실행 흐름

### 1. 파일 읽기

```
Task Executor 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK: PROJ-001 / 01-TASK.md

파일 로드 중...
  ✓ .ai/tasks/PROJ-001/todos/01-TASK.md
  ✓ .ai/tasks/PROJ-001/todos/00-TASK_MASTER.md (INSTRUCTION)
```

### 2. 목표 파악

```
┌─────────────────────────────────────────────────┐
│ 태스크 정보                                     │
├─────────────────────────────────────────────────┤
│ 제목: 인증 타입 및 인터페이스 정의              │
│ 우선순위: P0                                    │
│ 복잡도: Low                                     │
│ 의존성: None                                    │
└─────────────────────────────────────────────────┘

목표:
  • User, AuthState, AuthContext 타입 정의
  • TypeScript strict mode 준수
  • 재사용 가능한 인터페이스 설계

범위:
  포함: types/auth.ts 생성
  제외: 비즈니스 로직 구현 (다른 태스크)
```

### 3. 구현

```
[1/6] 구현 전 체크리스트
  ✓ TASK.md 이해 완료
  ✓ INSTRUCTION 읽기 완료
  ✓ 의존성 확인 (None)
  ✓ 필요 도구 확인 완료

[2/6] 파일 생성
  • types/auth.ts 생성

[3/6] 타입 정의
  • User 인터페이스
  • AuthState 타입
  • AuthContext 인터페이스

[4/6] 테스트 작성
  • types/auth.test.ts 생성
  • 5개 테스트 케이스 작성

[5/6] 테스트 실행
  ✓ User 타입 검증 (2 tests)
  ✓ AuthState 타입 검증 (2 tests)
  ✓ AuthContext 인터페이스 검증 (1 test)

[6/6] Git 커밋
  ✓ feat/PROJ-001-[AI]: Add auth types and interfaces
```

### 4. 완료 보고

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 01-TASK 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

구현 내용:
┌─────────────────────────────────────────┐
│ types/auth.ts                           │
├─────────────────────────────────────────┤
│ • User 인터페이스                       │
│   - id, email, name, role               │
│ • AuthState 타입                        │
│   - user, isAuthenticated, isLoading    │
│ • AuthContext 인터페이스                │
│   - state, login, logout                │
│                                         │
│ LOC: 30                                 │
└─────────────────────────────────────────┘

테스트:
  ✓ 5/5 통과

Git:
  • feat/PROJ-001-[AI]: Add auth types
  • SHA: a1b2c3d4e5f

통합 포인트:
  export { User, AuthState, AuthContext }

다음 태스크에서 사용:
  • 02-TASK (API 클라이언트)
  • 03-TASK (useAuth hook)
  • 04-TASK (AuthProvider)
```

### 5. TASK_MASTER 업데이트

```
TASK_MASTER.md 업데이트 중...

변경 사항:
| 태스크  | 우선순위 | 상태      | 담당자          | 완료일     |
|---------|----------|-----------|-----------------|------------|
| 01-TASK | P0       | completed | task-executor-1 | 2024-01-23 |

✓ 저장 완료
```

## Progressive Disclosure 준수

Task Executor는 Progressive Disclosure 원칙을 엄격히 준수합니다:

### 읽는 파일

1. **TASK.md** (해당 태스크)
   - 목표, 범위, 구현 가이드
   - ~1000 토큰

2. **TASK_MASTER.md의 INSTRUCTION만**
   - 공통 컨벤션, 품질 기준
   - ~500 토큰

**읽지 않는 파일**:
- Step 2의 전체 설계 문서 (X)
- 다른 TASK.md 파일들 (X)
- 전체 아키텍처 다이어그램 (X)

### 장점

- **토큰 효율**: 필요한 정보만 로드 (~1500 토큰)
- **명확한 범위**: TASK.md에 명시된 것만 구현
- **독립성**: 다른 컨텍스트 없이 실행 가능

## 체크리스트

### 구현 전

- [ ] TASK.md를 완전히 읽고 이해
- [ ] TASK_MASTER.md의 INSTRUCTION 확인
- [ ] 의존성 태스크 완료 확인
- [ ] 필요한 도구/라이브러리 확인

### 구현 중

- [ ] 타입/인터페이스 먼저 정의
- [ ] 코딩 컨벤션 준수
- [ ] 에러 처리 추가
- [ ] 보안 취약점 검토

### 구현 후

- [ ] 모든 테스트 통과
- [ ] Git 커밋 완료
- [ ] TASK_MASTER.md 업데이트
- [ ] export/import 문서화

## 일반적인 패턴

### 타입 정의 태스크

```typescript
// 1. 인터페이스 정의
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

// 2. 타입 정의
export type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// 3. 테스트
describe('User interface', () => {
  it('should have required fields', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test',
      role: 'user'
    }
    expect(user).toBeDefined()
  })
})
```

### API 클라이언트 태스크

```typescript
// 1. 인터페이스
import { User, AuthState } from './types/auth'

interface AuthClient {
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
}

// 2. 구현
export const authClient: AuthClient = {
  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      return await response.json()
    } catch (error) {
      throw new Error('Login failed')
    }
  },

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
  }
}

// 3. 테스트
describe('authClient', () => {
  it('should login successfully', async () => {
    const user = await authClient.login('test@example.com', 'password')
    expect(user).toHaveProperty('id')
  })
})
```

### Hook 구현 태스크

```typescript
// 1. Hook
import { useContext } from 'react'
import { AuthContext } from './contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

// 2. 테스트
import { renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('should throw error outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow()
  })
})
```

## 에러 처리

### 의존성 미완료

```
경고: 이 태스크는 다음에 의존합니다:
  • 01-TASK (상태: pending)

대기 중...

사용자 옵션:
1. 대기 (의존성 완료 시 자동 시작) ←
2. 중단
3. 강제 실행 (권장 안 함)
```

### 테스트 실패

```
테스트 실패:
  ✗ User 타입 검증
    Expected property 'role' to be required

구현을 수정합니다...

재시도...
  ✓ User 타입 검증 (2 tests)
```

### Git 커밋 실패

```
Git 커밋 실패:
  에러: Commit message does not match pattern

올바른 형식으로 재시도:
  feat/PROJ-001-[AI]: Add auth types and interfaces

✓ 커밋 성공
```

## 참고

- `.claude/agents/task-executor/AGENT.md` - 상세 가이드
- `.claude/rules/skills/general-feature/references/step-3.md` - Step 3 가이드
- TASK_MASTER.md의 INSTRUCTION - 프로젝트별 규칙
