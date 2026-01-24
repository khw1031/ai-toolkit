# Task Master 사용 가이드

> general-feature 스킬의 Step 2.5에서 생성된 서브태스크들을 병렬로 실행하는 방법

## 개요

Task Master는 TASK_MASTER.md를 읽고 서브태스크들을 조율하여 병렬로 실행하는 오케스트레이터입니다.

## 전제 조건

1. **Step 2.5 완료**: `.ai/tasks/<TASK_ID>/todos/` 디렉토리에 TASK_MASTER.md와 개별 TASK.md 파일들이 생성되어 있어야 합니다.

```
.ai/tasks/PROJ-001/todos/
├── 00-TASK_MASTER.md
├── 01-TASK.md
├── 02-TASK.md
├── 03-TASK.md
...
```

## 사용 방법

### 방법 1: 새 대화에서 시작 (권장)

Step 2.5 완료 후 새 대화를 시작하고 다음과 같이 입력:

```
Task Master를 시작해줘.
TASK_ID는 PROJ-001이야.
```

Claude가 다음 순서로 작업을 진행합니다:

1. TASK_MASTER.md 읽기
2. 전체 구조 파악
3. 실행 가능한 태스크 식별
4. 사용자에게 실행 방식 확인
5. 서브에이전트 spawn 및 병렬 실행
6. 진행 상황 모니터링
7. 완료 보고

### 방법 2: 직접 프롬프트 제공

```
당신은 Task Master입니다.

TASK_ID: PROJ-001
TASK_MASTER: .ai/tasks/PROJ-001/todos/00-TASK_MASTER.md

.claude/agents/task-master/AGENT.md의 지침을 따라
서브태스크들을 조율하고 병렬 실행해주세요.
```

## 실행 흐름 예시

### 1. 초기화

```
Task Master를 시작합니다.

TASK_MASTER.md를 읽는 중...
✓ 00-TASK_MASTER.md 로드 완료

전체 구조 파악:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 서브태스크: 5개
Phase: 3개
병렬 실행 가능: 2개 (Phase 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

의존성 그래프:
  01-TASK ──┐
            ├──> 03-TASK ──┐
  02-TASK ──┘              ├──> 05-TASK
                           │
  04-TASK ─────────────────┘
```

### 2. 실행 계획

```
다음 태스크들을 실행할 수 있습니다:

┌─────────────────────────────────────────────────┐
│ Phase 1 (병렬 실행 가능)                        │
├─────────────────────────────────────────────────┤
│ 01-TASK: 인증 타입 및 인터페이스 정의           │
│   - 우선순위: P0                                │
│   - 복잡도: Low                                 │
│   - 예상 LOC: ~30                               │
│                                                 │
│ 02-TASK: API 클라이언트 구현                    │
│   - 우선순위: P0                                │
│   - 복잡도: Medium                              │
│   - 예상 LOC: ~80                               │
└─────────────────────────────────────────────────┘

실행 방식을 선택해주세요:
1. 모두 병렬 실행 (권장) ←
2. 하나씩 순차 실행
3. 선택적 실행

선택:
```

### 3. 병렬 실행

사용자가 "1"을 선택하면:

```
Phase 1 병렬 실행을 시작합니다...

┌──────────────────────────────────────────┐
│ [Agent-1] 01-TASK 시작                   │
│ [Agent-2] 02-TASK 시작                   │
└──────────────────────────────────────────┘

실행 중...
```

**내부 동작**:
```typescript
// 단일 응답에 여러 Task tool 호출
await Promise.all([
  Task({
    subagent_type: "general-purpose",
    description: "Execute 01-TASK",
    prompt: `
      당신은 Task Executor입니다.
      TASK_ID: PROJ-001
      TASK_FILE: 01-TASK.md

      .claude/agents/task-executor/AGENT.md의 지침을 따라
      이 태스크를 구현해주세요.
    `
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Execute 02-TASK",
    prompt: `
      당신은 Task Executor입니다.
      TASK_ID: PROJ-001
      TASK_FILE: 02-TASK.md

      .claude/agents/task-executor/AGENT.md의 지침을 따라
      이 태스크를 구현해주세요.
    `
  })
])
```

### 4. 진행 상황 모니터링

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
진행 상황: 2/5 완료 (40%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Agent-1] ✓ 01-TASK 완료
  • types/auth.ts 생성 (30 LOC)
  • 테스트: 5/5 통과
  • Git: feat/PROJ-001-[AI]: Add auth types

[Agent-2] ✓ 02-TASK 완료
  • api/auth.ts 생성 (80 LOC)
  • 테스트: 8/8 통과
  • Git: feat/PROJ-001-[AI]: Implement API client

TASK_MASTER.md 업데이트 완료
```

### 5. 다음 Phase

```
Phase 2 실행 가능:

┌─────────────────────────────────────────────────┐
│ 03-TASK: useAuth hook 구현                      │
│   - 우선순위: P1                                │
│   - 의존성: 01-TASK ✓, 02-TASK ✓               │
│   - 복잡도: Medium                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 04-TASK: AuthProvider 구현                      │
│   - 우선순위: P1                                │
│   - 의존성: 01-TASK ✓, 03-TASK ⏳              │
│   - 복잡도: High                                │
│   - 상태: 대기 중 (03-TASK 완료 필요)          │
└─────────────────────────────────────────────────┘

실행 방식:
1. 03-TASK 실행 (04-TASK는 대기) ←
2. 순차 실행 (03 → 04)

선택:
```

### 6. 완료 보고

모든 태스크 완료 후:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 모든 서브태스크가 완료되었습니다!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

완료된 작업:
  ✓ 01-TASK: 인증 타입 및 인터페이스 정의
  ✓ 02-TASK: API 클라이언트 구현
  ✓ 03-TASK: useAuth hook 구현
  ✓ 04-TASK: AuthProvider 구현
  ✓ 05-TASK: 통합 및 테스트

통계:
  • 총 LOC: ~250
  • 테스트: 25/25 통과
  • Git 커밋: 5개
  • 소요 시간: [자동 계산]

통합 테스트 실행 중...
  ✓ 모든 통합 테스트 통과

다음 단계:
  → Step 4: Review & Documentation
  → ./scripts/task.sh complete PROJ-001 step-2.5
```

## 고급 사용법

### 선택적 실행

특정 태스크만 실행하고 싶은 경우:

```
Task Master를 시작해줘.
TASK_ID는 PROJ-001이고, 03-TASK와 04-TASK만 실행해줘.
```

### 재시도

태스크 실패 시:

```
[Agent-1] ✗ 03-TASK 실패
  에러: TypeScript 컴파일 에러
    Property 'user' does not exist on type 'AuthState'.

옵션:
1. 재시도
2. 수동으로 수정 후 계속
3. 건너뛰기

선택:
```

사용자가 "2"를 선택하고 수정 완료 후:

```
수정이 완료되었습니다.
03-TASK를 재실행합니다...
```

### 의존성 강제 무시 (비권장)

```
04-TASK를 강제로 실행해줘.
(의존성: 03-TASK가 완료되지 않았지만 무시)
```

**경고**: 의존성을 무시하면 컴파일 에러나 런타임 에러가 발생할 수 있습니다.

## 문제 해결

### TASK_MASTER.md를 찾을 수 없음

```
에러: .ai/tasks/PROJ-001/todos/00-TASK_MASTER.md를 찾을 수 없습니다.

해결:
1. Step 2.5가 완료되었는지 확인
2. TASK_ID가 올바른지 확인
3. todos/ 디렉토리 존재 확인
```

### 서브에이전트 spawn 실패

```
에러: Task tool 호출 실패

해결:
1. 프롬프트가 너무 긴 경우: TASK.md 크기 확인
2. 동시 실행 제한: 병렬 실행 개수 줄이기
3. 재시도
```

### 진행 상황 불일치

```
TASK_MASTER.md의 진행 상황이 실제와 다릅니다.

해결:
1. TASK_MASTER.md를 다시 읽기
2. 수동으로 상태 표 수정
3. 계속 진행
```

## 수동 실행과의 비교

### 수동 실행 (Step 3)

```
장점:
  • 각 태스크를 직접 제어
  • 세밀한 구현 조정 가능
  • 학습 목적에 적합

단점:
  • 시간 소모 (순차적)
  • 반복 작업
```

### Task Master (자동 병렬 실행)

```
장점:
  • 병렬 실행으로 시간 절약
  • 일관된 품질
  • 의존성 자동 관리

단점:
  • 에러 시 디버깅 복잡
  • 커스터마이징 제한적
```

## 권장 사용 시나리오

### Task Master 사용 권장

- 서브태스크가 5개 이상
- 병렬 실행 가능한 태스크가 많음
- 반복적인 boilerplate 작업
- 시간이 제한적인 경우

### 수동 실행 권장

- 서브태스크가 3개 이하
- 복잡한 비즈니스 로직
- 실험적 구현
- 학습 목적

## 참고

- `.claude/agents/task-master/AGENT.md` - Task Master 상세 가이드
- `.claude/agents/task-executor/AGENT.md` - Task Executor 상세 가이드
- `.claude/rules/skills/general-feature/references/step-2.5.md` - Step 2.5 가이드
