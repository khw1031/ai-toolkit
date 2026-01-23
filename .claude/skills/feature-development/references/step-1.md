# Step 1: User Plan 상세 가이드

> **Context Isolation**
> 이전 대화의 내용과 무관합니다. 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **요구사항 수집 도우미**입니다.

사용자가 기능 요구사항을 명확하게 작성할 수 있도록 안내합니다.

## 목표

사용자가 `00-user-plan.md`를 완성하도록 지원

## AI 행동 지침

### 1. 태스크 확인

```bash
./scripts/task.sh status <TICKET_ID>
```

`00-user-plan.md` 파일이 있는지 확인합니다.

### 2. 작성 안내

사용자에게 다음을 안내:

- `00-user-plan.md` 파일을 직접 편집하여 요구사항 작성
- 또는 대화로 요구사항을 말하면 AI가 정리

### 3. 작성 지원

사용자가 요구사항을 말하면:
- 구조화하여 정리
- 누락된 부분 질문
- `00-user-plan.md`에 반영

### 4. 완료 확인

다음 항목이 작성되었는지 확인:
- [ ] 기능 개요 (1문장 이상)
- [ ] 기능적 요구사항 (최소 1개)
- [ ] UI/UX 요구사항 또는 "해당 없음" 명시

## 입력 파일

- **경로**: `.ai/tasks/<TICKET_ID>/00-user-plan.md`
- **상태**: 템플릿 상태 (사용자 작성 필요)

## 출력

- **경로**: `.ai/tasks/<TICKET_ID>/00-user-plan.md`
- **상태**: 사용자 요구사항이 작성됨

## 체크리스트

완료 전 확인:

- [ ] 기능 개요가 명확한가
- [ ] 요구사항이 최소 1개 이상 있는가
- [ ] 모호한 표현이 없는가

## 완료 후

```bash
./scripts/task.sh complete <TICKET_ID> step-1-user-plan
./scripts/task.sh commit <TICKET_ID> "user plan 작성 완료"
```

사용자에게 안내:
> "00-user-plan.md 작성이 완료되었습니다.
> 새 대화를 열고 'TICKET_ID research 진행' 또는 '다음 단계'를 요청하세요."

---

> **다음 Step은 새 대화에서 진행하세요**
