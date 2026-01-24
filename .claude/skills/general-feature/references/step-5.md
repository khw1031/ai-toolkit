# Step 5: Review & Documentation

> **Context Isolation**
> 이전 대화의 내용은 이 Step과 관련이 없습니다.
> 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **Reviewer (검토자)**입니다.

## 책임

1. **구현 검증**: 요구사항이 제대로 구현되었는지 확인합니다.
2. **코드 품질 검토**: 보안, 성능, 가독성을 검토합니다.
3. **문서화**: README, API 문서, 코드 주석을 작성합니다.
4. **PR 준비**: Pull Request 생성을 위한 준비를 완료합니다.

## 작업 절차

### 1. 입력 파일 읽기

`.ai/tasks/<TASK_ID>/40-output-implementation.md` 파일을 읽어 구현 결과를 이해합니다.

### 2. 요구사항 대비 검증

Step 1의 요구사항과 비교하여 검증합니다:

- [ ] 모든 P0 요구사항이 구현되었는가?
- [ ] 성공 기준이 충족되었는가?
- [ ] 제약 조건이 준수되었는가?

### 3. 코드 품질 검토

다음 관점에서 코드를 검토합니다:

#### 보안
- 사용자 입력 검증
- 인증/인가 처리
- 민감 정보 노출 방지

#### 성능
- 불필요한 연산 제거
- 효율적인 알고리즘 사용
- 메모리 누수 방지

#### 가독성
- 명확한 변수/함수명
- 적절한 주석
- 일관된 코드 스타일

### 4. 문서화

다음 문서를 작성/업데이트합니다:

- **README.md**: 기능 설명, 사용 방법
- **API 문서**: 함수/클래스 인터페이스
- **코드 주석**: 복잡한 로직 설명
- **CHANGELOG.md**: 변경 이력

### 5. PR 준비

다음을 준비합니다:

- PR 제목: `feat: <TASK_ID> - <간단한 요약>`
- PR 설명: 무엇을, 왜, 어떻게 구현했는지
- 스크린샷 (UI 변경 시)
- 테스트 결과

## 체크리스트

완료 전 다음 항목을 확인하세요:

- [ ] 모든 요구사항이 구현되었는가?
- [ ] 보안 취약점이 없는가?
- [ ] 성능 이슈가 없는가?
- [ ] 코드 가독성이 좋은가?
- [ ] 문서화가 완료되었는가?
- [ ] 테스트가 모두 통과하는가?
- [ ] PR 설명이 명확한가?

## 주의사항

- **객관적 검토**: 구현자와 분리된 관점에서 검토합니다.
- **건설적 피드백**: 문제점뿐만 아니라 개선 방안도 제시합니다.
- **사용자 관점**: 실제 사용 시나리오를 고려합니다.

## 출력 가이드

[assets/templates/50-output-review.md](../assets/templates/50-output-review.md) 형식을 따르세요.

출력 파일 위치: `.ai/tasks/<TASK_ID>/50-output-review.md`

---

## 완료 후: 커밋 및 PR

### Git 커밋

```bash
# 최종 문서 커밋
git add .ai/tasks/<TASK_ID>/50-output-review.md
git commit -m "feat/<TASK_ID>-[AI]: Completed Step 5 review and documentation"
```

**커밋 메시지 형식**: `feat/<TASK_ID>-[AI]: Completed Step 5 review and documentation`

### PR 생성 (선택적)

```bash
# PR 생성
git push origin <branch-name>
gh pr create --title "<TASK_ID>: <title>" --body "$(cat .ai/tasks/<TASK_ID>/50-output-review.md)"
```

### 완료 안내

```
✅ Step 5 완료! 워크플로우가 모두 완료되었습니다!

다음 작업:
1. PR 리뷰 요청
2. 머지 후 브랜치 정리
```
