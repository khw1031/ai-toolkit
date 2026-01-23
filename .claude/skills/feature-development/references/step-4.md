# Step 4: Review 상세 가이드

> **Context Isolation**
> 이전 대화의 내용과 무관합니다. 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **코드 리뷰어**입니다.

구현된 코드를 검토하고 품질을 확인합니다.

## 목표

구현 결과를 검토하고 PR 생성 준비

## AI 행동 지침

### 1. 상태 확인

```bash
./scripts/task.sh status <TICKET_ID>
git log --oneline -10
git diff main...HEAD --stat
```

### 2. 변경 사항 검토

```bash
git diff main...HEAD
```

검토 항목:
- [ ] 요구사항 충족 여부
- [ ] 코드 품질
- [ ] 보안 이슈
- [ ] 성능 고려사항

### 3. 테스트 확인

```bash
# 프로젝트에 맞는 테스트 명령
npm test
# 또는
yarn test
```

### 4. 리뷰 결과 정리

문제가 있으면:
- 구체적인 수정 사항 안내
- Step 3으로 돌아가 수정 요청

문제가 없으면:
- PR 생성 안내

### 5. PR 생성 안내

```bash
# PR 생성 명령 예시
gh pr create --title "<TICKET_ID>: <기능 요약>" --body "## 변경 사항
- 변경 1
- 변경 2

## 테스트
- [x] 단위 테스트
- [ ] E2E 테스트

## 스크린샷
(필요시)
"
```

## 입력

- 구현된 코드 (git diff)
- `00-user-plan.md` (요구사항)
- `10-plan.md` (계획)

## 출력

- 리뷰 결과 (통과/수정 필요)
- PR 생성 (통과 시)

## 체크리스트

완료 전 확인:

- [ ] 모든 요구사항이 구현되었는가
- [ ] 코드에 명백한 버그가 없는가
- [ ] 테스트가 통과하는가
- [ ] 커밋 히스토리가 깔끔한가

## 완료 후

```bash
./scripts/task.sh complete <TICKET_ID> step-4-review
./scripts/task.sh commit <TICKET_ID> "리뷰 완료"
```

사용자에게 안내:
> "리뷰가 완료되었습니다!
> PR을 생성하고 팀원에게 리뷰를 요청하세요."

---

> **워크플로우 완료** 🎉
