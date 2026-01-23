# Step 2: Research & Planning 상세 가이드

> **Context Isolation**
> 이전 대화의 내용과 무관합니다. 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **React 아키텍트**입니다.

사용자의 요구사항을 분석하고 구체적인 구현 계획을 수립합니다.

## 목표

`00-user-plan.md`를 기반으로 `10-plan.md` 구현 계획서 생성

## AI 행동 지침

### 1. 선행 조건 확인

```bash
./scripts/task.sh status <TICKET_ID>
```

`00-user-plan.md`가 작성되었는지 확인:
- 파일이 없거나 템플릿 상태면 → Step 1 요청
- 내용이 충분하면 → 진행

### 2. 요구사항 분석

`00-user-plan.md` 읽기:

```bash
cat .ai/tasks/<TICKET_ID>/00-user-plan.md
```

### 3. 코드베이스 분석

관련 코드 탐색:
- 기존 컴포넌트 구조
- 스타일링 패턴 (CSS/Tailwind/Styled 등)
- 상태 관리 방식
- API 패턴
- 테스트 패턴

### 4. 계획 수립

`10-plan.md` 작성:

```markdown
# 구현 계획: <기능명>

## 요약
[한 문장 요약]

## 분석 결과

### 기존 구조 파악
- 관련 컴포넌트:
- 사용 패턴:

### 기술 결정
- 상태 관리:
- 스타일링:
- 테스트:

## 구현 단계

### Phase 1: [단계명]
- [ ] 작업 1
- [ ] 작업 2

### Phase 2: [단계명]
- [ ] 작업 3

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/...` | 신규 | ... |

## 리스크 및 고려사항
- 리스크 1:
- 대안:

## 예상 결과
[완료 후 예상 결과]
```

## 입력 파일

- **경로**: `.ai/tasks/<TICKET_ID>/00-user-plan.md`
- **내용**: 사용자가 작성한 요구사항

## 출력

- **경로**: `.ai/tasks/<TICKET_ID>/10-plan.md`
- **형식**: [templates/10-plan.md](../assets/templates/10-plan.md)

## 체크리스트

완료 전 확인:

- [ ] user-plan의 모든 요구사항이 반영되었는가
- [ ] 구현 단계가 구체적이고 실행 가능한가
- [ ] 파일 변경 목록이 명확한가
- [ ] 기존 코드 패턴을 따르고 있는가

## 완료 후

```bash
./scripts/task.sh complete <TICKET_ID> step-2-research
./scripts/task.sh commit <TICKET_ID> "구현 계획 수립 완료"
```

사용자에게 안내:
> "구현 계획이 완료되었습니다. `10-plan.md`를 검토해주세요.
> 승인 후 새 대화에서 '구현 진행' 또는 'implement'를 요청하세요."

---

> **다음 Step은 새 대화에서 진행하세요**
