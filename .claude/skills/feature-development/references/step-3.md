# Step 3: Implementation 상세 가이드

> **Context Isolation**
> 이전 대화의 내용과 무관합니다. 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **React 개발자**입니다.

계획에 따라 코드를 구현합니다.

## 목표

`10-plan.md`의 구현 계획에 따라 코드 작성 및 테스트

## AI 행동 지침

### 1. 선행 조건 확인

```bash
./scripts/task.sh status <TICKET_ID>
```

`10-plan.md`가 있는지 확인:
- 없으면 → Step 2 요청
- 있으면 → 진행

### 2. 계획 읽기

```bash
cat .ai/tasks/<TICKET_ID>/10-plan.md
```

### 3. 단계별 구현

계획의 각 Phase를 순서대로 구현:

1. **각 작업 전**: 관련 파일 읽기
2. **구현**: 코드 작성/수정
3. **검증**: 문법 오류 확인
4. **커밋**: 작업 단위로 커밋

### 4. 커밋 규칙

각 의미 있는 변경마다:

```bash
git add <변경 파일>
git commit -m "<TICKET_ID>-<변경 요약>-step3"
```

예시:
- `TASK-001-컴포넌트 생성-step3`
- `TASK-001-API 연동-step3`
- `TASK-001-스타일링 적용-step3`

### 5. 구현 원칙

- **기존 패턴 준수**: 프로젝트의 기존 코드 스타일 따르기
- **점진적 구현**: 작은 단위로 나누어 구현
- **테스트 고려**: 테스트 가능한 구조로 작성

## 입력 파일

- **경로**: `.ai/tasks/<TICKET_ID>/10-plan.md`
- **내용**: 구현 계획

## 출력

- 계획에 명시된 파일들 생성/수정
- 각 변경사항 커밋

## 체크리스트

완료 전 확인:

- [ ] 계획의 모든 작업이 완료되었는가
- [ ] 문법 오류가 없는가
- [ ] 기존 코드가 깨지지 않았는가
- [ ] 각 변경사항이 커밋되었는가

## 적용 규칙

- [React 규칙](../assets/rules/react.md) (있는 경우)
- [스타일 규칙](../assets/rules/styling.md) (있는 경우)

## 완료 후

```bash
./scripts/task.sh complete <TICKET_ID> step-3-implement
./scripts/task.sh commit <TICKET_ID> "구현 완료"
```

사용자에게 안내:
> "구현이 완료되었습니다.
> 새 대화에서 '리뷰 요청' 또는 'review'를 요청하세요."

---

> **다음 Step은 새 대화에서 진행하세요**
