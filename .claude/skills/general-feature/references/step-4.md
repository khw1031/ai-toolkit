# Step 4: Implementation

> **Context Isolation**
> 이전 대화의 내용은 이 Step과 관련이 없습니다.
> 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **Coordinator (조율자)**입니다.

## 책임

1. **Agent 조율**: Task Executor Agent를 활용하여 구현 작업을 수행합니다.
2. **작업 할당**: Step 3에서 분해된 태스크를 Agent에게 할당합니다.
3. **진행 관리**: Agent 작업 진행 상황을 모니터링합니다.
4. **결과 취합**: Agent가 완료한 작업을 검증하고 문서화합니다.

## 작업 절차

### 1. 입력 파일 읽기

다음 파일들을 읽어 구현 계획을 이해합니다:

- `.ai/tasks/<TASK_ID>/20-output-system-design.md` - 전체 설계
- `.ai/tasks/<TASK_ID>/30-output-task.md` - 작업 분해 결과
- `.ai/tasks/<TASK_ID>/todos/00-TASK_MASTER.md` - 전체 작업 조율 계획
- `.ai/tasks/<TASK_ID>/todos/*.md` - 개별 서브태스크

### 2. Task Executor Agent 호출

Step 3에서 생성된 개별 태스크를 Task Executor Agent에게 할당합니다:

```
Task 도구를 사용하여 general-purpose 또는 적합한 전문 Agent 호출:
- subagent_type: "general-purpose" (또는 적합한 전문 Agent)
- prompt: "<TASK_ID> todos/01-TASK.md 작업 수행"
- 각 todos/*.md 파일에 정의된 작업을 Agent에게 할당
```

**병렬 실행 가능 태스크**:
- Step 3의 dependency graph에서 독립적인 태스크는 병렬로 Agent 호출
- 의존성이 있는 태스크는 순차적으로 실행

### 3. Agent 작업 모니터링

Agent 작업 진행을 확인합니다:

- Agent가 반환한 결과 검토
- 구현된 코드 확인
- 테스트 통과 여부 확인
- 문제 발생 시 재조정

### 4. 구현 결과 문서화 (TASK_MASTER 완료 시)

모든 Agent 작업이 완료되면 결과를 취합하여 문서화합니다.

**트리거 조건**: `todos/00-TASK_MASTER.md`의 모든 서브태스크가 ✅ completed

**필수 작업**:

1. **40-output-implementation.md 생성**
   - 템플릿: `assets/templates/40-output-implementation.md`
   - 출력 위치: `.ai/tasks/<TASK_ID>/40-output-implementation.md`

2. **내용 작성**
   - Phase별 구현 내역 정리
   - 모든 변경 파일 목록 작성
   - 검증 결과 체크리스트 완성
   - Step 5 검토 요청사항 작성

3. **status.yaml 업데이트**
   - **출력물 생성 후에만** step-4.status를 completed로 변경
   - current_step을 step-5로 변경

> ⚠️ **주의**: 40-output-implementation.md 생성 없이 status.yaml을 completed로 변경하지 마세요.

## 체크리스트

완료 전 다음 항목을 확인하세요:

- [ ] 모든 개별 태스크가 Agent를 통해 완료되었는가?
- [ ] Agent가 생성한 코드가 설계 문서와 일치하는가?
- [ ] 단위 테스트가 작성되고 통과하는가?
- [ ] 코드 컨벤션을 준수하는가?
- [ ] 엣지 케이스가 처리되었는가?
- [ ] 보안 취약점은 없는가? (XSS, SQL Injection 등)
- [ ] Git 커밋이 의미 있게 분리되었는가?
- [ ] 구현 결과가 40-output-implementation.md에 문서화되었는가?

## 주의사항

- **Agent 활용**: 직접 코드를 작성하지 말고 Task Executor Agent를 활용합니다.
- **병렬 실행**: 독립적인 태스크는 여러 Agent를 병렬로 실행하여 효율성을 높입니다.
- **작업 검증**: Agent가 완료한 작업을 반드시 검토하고 검증합니다.
- **의존성 관리**: 태스크 간 의존성을 고려하여 실행 순서를 결정합니다.

## 출력 가이드

[assets/templates/40-output-implementation.md](../assets/templates/40-output-implementation.md) 형식을 따르세요.

출력 파일 위치: `.ai/tasks/<TASK_ID>/40-output-implementation.md`

---

## 완료 처리

### 1. 사용자 확인 (필수)

TASK_MASTER의 모든 태스크가 completed이고 40-output-implementation.md가 작성되었다면 사용자에게 확인합니다:

```
📋 Step 4 체크리스트 완료 확인:
- [x] 모든 서브태스크 Agent를 통해 완료됨
- [x] 코드가 설계 문서와 일치함
- [x] 단위 테스트 통과
- [x] 40-output-implementation.md 작성 완료

👉 Step 4를 완료 처리할까요?
```

> ⚠️ **사용자 승인 없이 다음 단계로 진행하지 마세요.**

### 2. 승인 후 처리

사용자가 승인하면 다음을 수행합니다:

#### Git 커밋

```bash
git add .ai/tasks/<TASK_ID>/40-output-implementation.md
git commit -m "feat/<TASK_ID>-[AI]: Completed Step 4 implementation summary"
```

#### status.yaml 업데이트

```yaml
current_step: step-5
steps:
  step-4:
    status: completed
  step-5:
    status: pending
```

### 3. 다음 Step 안내

```
✅ Step 4 완료!

새 대화에서 다음 명령어로 Step 5를 시작하세요:
"<TASK_ID> 작업 이어서 진행해줘"
```
