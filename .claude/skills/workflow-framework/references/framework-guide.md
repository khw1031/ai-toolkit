# Workflow Framework 상세 가이드

> 커스텀 워크플로우 스킬 생성을 위한 완전 가이드

## 1. 워크플로우 설계 원칙

### 1.1 Phase 기반 분리

워크플로우 스킬의 구성요소는 의존성 순서에 따라 5개 Phase로 분리됩니다:

```
Phase 1: SKILL.md      → 스킬 진입점, 워크플로우 전체 흐름
Phase 2: scripts/      → Task 생명주기 관리
Phase 3: references/   → Step별 상세 가이드
Phase 4: templates/    → 입출력 문서 형식
Phase 5: rules/        → 공유 규칙 (보안, 스타일 등)
```

### 1.2 토큰 예산 관리

| 구성요소 | 권장 토큰 | 로드 시점 |
|----------|----------|----------|
| SKILL.md 전체 | <5000 | 스킬 활성화 시 |
| references/step-n.md | 500-800 | Step 진입 시 |
| templates/*.md | 100-300 | Step 진입 시 |
| rules/*.md | 200-400 | Step 진입 시 |

### 1.3 검증 가능한 체크리스트

각 Step은 다음을 포함해야 합니다:
- 구체적인 완료 기준
- 측정 가능한 검증 항목
- 명확한 성공/실패 판단 기준

---

## 2. SKILL.md 작성 상세

### 2.1 YAML Frontmatter

```yaml
---
name: workflow-name           # 필수: 1-64자
description: |                # 필수: 1-1024자
  [한 줄 설명]
  사용 시점: "키워드1", "키워드2"
license: MIT                  # 선택
compatibility: |              # 선택: 환경 요구사항
  macOS/Linux, bash 4.0+
metadata:                     # 선택
  author: team-name
  version: "1.0.0"
  category: development
allowed-tools: Bash Read Write Edit  # 선택
---
```

### 2.2 name 규칙

- 길이: 1-64자
- 허용: 소문자, 숫자, 하이픈(-)
- 금지: 대문자, 시작/끝 하이픈, 연속 하이픈, 언더스코어
- 디렉토리명과 일치해야 함

### 2.3 description 작성

**필수 포함 요소:**
1. 무엇을 하는지 (What)
2. 언제 사용하는지 (When)
3. 트리거 키워드

**예시:**
```yaml
description: |
  새 기능 개발을 위한 3단계 워크플로우. Research → Plan → Implement 순서로 진행.
  사용 시점: "새 기능 개발", "feature 구현", "기능 추가"
```

---

## 3. Step 설계

### 3.1 Step 구조

각 Step은 다음 요소를 포함:

```markdown
## Step N: [Step 이름]

**역할**: [역할명]  
**목표**: [이 Step의 목표]

### 참조 자료
- 상세 가이드: [references/step-n.md](references/step-n.md)
- 출력 템플릿: [assets/templates/output-step-n.md](assets/templates/output-step-n.md)
- 적용 규칙: [assets/rules/relevant.md](assets/rules/relevant.md)

### 입출력
- **입력**: `.ai/tasks/<TASK_ID>/[input-file]`
- **출력**: `.ai/tasks/<TASK_ID>/[output-file]`

### 완료 조건
- [ ] [체크리스트 항목]

**완료 후**: `./scripts/task.sh complete <TASK_ID> step-n [--finish]`

> 다음 Step은 **새 대화**에서 진행 권장
```

### 3.2 역할 정의 원칙

- 명확한 페르소나 설정 (예: "기술 리서처", "시니어 개발자")
- 책임 범위 명시
- 해당 역할에서 하지 말아야 할 것 명시

### 3.3 Context Isolation

Step 간 컨텍스트 오염을 방지하기 위해:
1. 각 Step 시작 시 역할 재정의
2. 이전 대화 무시 지시
3. 입력 파일만 참조하도록 명시

---

## 4. references/ 작성

### 4.1 파일 구조

```markdown
# Step N 상세 가이드

> **Context Isolation**
> 이전 대화의 내용은 이 Step과 관련이 없습니다.
> 아래 지시사항에만 집중하세요.

## 역할 정의
[페르소나와 역할 설명]

## 책임
[구체적인 책임 목록]

## 체크리스트
[검증 항목]

## 주의사항
[엣지 케이스, 피해야 할 것]

## 출력 가이드
[템플릿 참조 링크]
```

### 4.2 체크리스트 작성 팁

- 검증 가능한 항목만 포함
- 순서대로 확인할 수 있도록 배치
- 완료 기준이 명확해야 함

---

## 5. assets/templates/ 작성

### 5.1 입력 템플릿 (input.md)

```markdown
# [워크플로우] 입력

## 1. 기본 정보
[필수 입력 필드]

## 2. 요구사항
[기능적/비기능적 요구사항]

## 3. 제약 조건
[기술적/비즈니스적 제약]

## 4. 참고 자료
[관련 문서, 링크]
```

### 5.2 출력 템플릿 (output-step-n.md)

```markdown
# Step N 결과

## 1. 요약
[핵심 결과]

## 2. 상세 내용
[섹션별 내용]

## 3. 검증 결과
[체크리스트 상태]

## 4. 다음 단계
[다음 Step 권장사항]
```

---

## 6. assets/rules/ 작성

### 6.1 규칙 구조

```markdown
# [규칙명]

> 적용 대상: [Step 이름] 또는 [전체]

## 원칙
[핵심 원칙]

## 체크리스트
[검증 항목]

## 예외 사항
[예외 케이스]
```

### 6.2 공통 규칙 예시

- **code-style.md**: 코딩 컨벤션
- **security.md**: 보안 규칙
- **documentation.md**: 문서화 규칙
- **testing.md**: 테스트 규칙

---

## 7. 워크플로우 테스트

### 7.1 테스트 절차

```bash
# 1. Task 생성
./scripts/task.sh init TEST-001

# 2. 입력 파일 확인
cat .ai/tasks/TEST-001/input.md

# 3. 상태 확인
./scripts/task.sh status TEST-001

# 4. Step 완료
./scripts/task.sh complete TEST-001 step-1

# 5. 전체 완료
./scripts/task.sh complete TEST-001 step-3 --finish
```

### 7.2 검증 체크리스트

```
□ SKILL.md
  ├── □ name 규칙 준수
  ├── □ description 완전
  ├── □ 500줄 이하
  └── □ 참조 링크 유효

□ scripts/task.sh
  ├── □ 실행 권한 설정
  ├── □ init 동작
  ├── □ status 동작
  └── □ complete 동작

□ references/
  ├── □ 모든 Step 파일 존재
  └── □ Context Isolation 지시문 포함

□ assets/
  ├── □ input.md 존재
  └── □ 각 Step output 템플릿 존재
```
