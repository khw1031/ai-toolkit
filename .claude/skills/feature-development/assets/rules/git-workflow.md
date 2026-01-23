# Git 워크플로우 규칙

> Feature Development 워크플로우의 Git 관련 규칙

## 브랜치 규칙

### 브랜치 네이밍

```
feat/<TICKET_ID>
```

예시:
- `feat/TASK-001`
- `feat/FEAT-123`

### 브랜치 생성

```bash
# main에서 분기
git checkout main
git pull origin main
git checkout -b feat/<TICKET_ID>
```

## 커밋 규칙

### 커밋 메시지 형식

```
<TICKET_ID>-<요약>-<step>
```

예시:
- `TASK-001-초기 설정-step0`
- `TASK-001-user plan 작성 완료-step1`
- `TASK-001-컴포넌트 생성-step3`
- `TASK-001-스타일링 적용-step3`
- `TASK-001-리뷰 완료-step4`

### 커밋 단위

| Step | 커밋 단위 |
|------|----------|
| Step 0 | 초기화 1회 |
| Step 1 | user-plan 완료 1회 |
| Step 2 | plan 완료 1회 |
| Step 3 | 의미 있는 변경마다 (컴포넌트, 기능, 스타일 등) |
| Step 4 | 리뷰 완료 1회 |

## PR 규칙

### PR 제목

```
<TICKET_ID>: <기능 요약>
```

예시:
- `TASK-001: 사용자 프로필 페이지 구현`

### PR 본문 템플릿

```markdown
## 변경 사항

- 변경 1
- 변경 2

## 관련 티켓

- TASK-001

## 테스트

- [x] 단위 테스트
- [ ] E2E 테스트
- [x] 수동 테스트

## 스크린샷 (필요시)

[스크린샷 첨부]

## 체크리스트

- [x] 요구사항 충족
- [x] 코드 리뷰 준비 완료
- [ ] 문서 업데이트 (필요시)
```

## 자주 사용하는 명령어

```bash
# 상태 확인
git status
git log --oneline -5

# 커밋
git add <files>
git commit -m "<TICKET_ID>-<요약>-<step>"

# PR 생성
gh pr create --title "<TICKET_ID>: <요약>" --body "..."

# 브랜치 정리 (완료 후)
git checkout main
git branch -d feat/<TICKET_ID>
```
