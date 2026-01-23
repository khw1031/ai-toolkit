---
name: feature-development
description: |
  React 기능 개발을 위한 단계별 워크플로우를 제공합니다.
  기능개발, 화면개발, 기능구현, feature 개발, 새 기능 추가,
  컴포넌트 개발, 페이지 개발, React 구현 시 사용하세요.
license: MIT
metadata:
  author: ai-toolkit
  version: "1.0.0"
  category: workflow
allowed-tools: Bash Read Write Edit Glob Grep
---

# Feature Development Workflow

React 기능 개발을 체계적으로 진행하는 4단계 워크플로우입니다.

## 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **Context Isolation** | 각 Step은 새 대화에서 실행 권장 |
| **Human in the Loop** | 단계 완료 시 사용자 확인 후 진행 |
| **Document as Interface** | Step 간 통신은 문서 기반 |
| **Git Integration** | 단계별 자동 커밋 및 브랜치 관리 |

---

## 워크플로우 개요

```
Step 0: Init        → 티켓 디렉토리 생성, 브랜치 생성
Step 1: User Plan   → 사용자가 요구사항 작성
Step 2: Research    → AI가 분석하여 구현 계획 생성
Step 3: Implement   → 계획에 따라 코드 구현
Step 4: Review      → 구현 검토 및 완료
```

| Step | 역할 | 입력 | 출력 | 상세 |
|------|------|------|------|------|
| 0 | Init | 티켓번호 | 디렉토리 구조 | 자동 |
| 1 | User Plan | 사용자 요구사항 | `00-user-plan.md` | [step-1.md](references/step-1.md) |
| 2 | Research | user-plan | `10-plan.md` | [step-2.md](references/step-2.md) |
| 3 | Implement | plan | 구현 코드 | [step-3.md](references/step-3.md) |
| 4 | Review | 구현 결과 | 완료 보고 | [step-4.md](references/step-4.md) |

---

## Step 0: Init (자동)

사용자가 기능개발을 요청하면:

1. `.ai/tasks/` 디렉토리 확인/생성
2. 티켓번호 요청 (예: `TASK-001`)
3. 중복 시 `TASK-001-{timestamp}` 형식으로 생성
4. `feat/{TICKET}` 브랜치 생성 및 이동

```bash
./scripts/init.sh <TICKET_ID>
```

생성 구조:
```
.ai/tasks/<TICKET_ID>/
├── 00-user-plan.md    # Step 1에서 사용자 작성
├── 10-plan.md         # Step 2에서 AI 생성
└── status.yaml        # 진행 상태
```

---

## Step 1: User Plan

**역할**: 사용자가 요구사항을 직접 작성

1. `00-user-plan.md` 템플릿 제공
2. 사용자가 내용 작성
3. 작성 완료 후 다음 단계 요청

```bash
./scripts/task.sh status <TICKET_ID>  # 상태 확인
```

**완료 조건**: `00-user-plan.md`에 최소 요구사항 작성됨

→ 상세: [references/step-1.md](references/step-1.md)

---

## Step 2: Research & Planning

**역할**: AI가 user-plan을 분석하여 구현 계획 수립

1. `00-user-plan.md` 읽기
2. 코드베이스 분석
3. `10-plan.md` 생성

**완료 조건**: 구현 계획이 구체적이고 실행 가능

→ 상세: [references/step-2.md](references/step-2.md)

---

## Step 3: Implementation

**역할**: 계획에 따라 코드 구현

1. `10-plan.md` 읽기
2. 단계별 구현
3. 각 구현 후 커밋

**커밋 형식**: `{TICKET}-{요약}-step3`

→ 상세: [references/step-3.md](references/step-3.md)

---

## Step 4: Review

**역할**: 구현 검토 및 완료 처리

1. 구현 결과 검토
2. 테스트 확인
3. PR 생성 준비

→ 상세: [references/step-4.md](references/step-4.md)

---

## 진행 상태 확인

```bash
./scripts/task.sh status <TICKET_ID>   # 특정 태스크 상태
./scripts/task.sh list                  # 전체 태스크 목록
./scripts/task.sh complete <TICKET_ID> <STEP>  # 단계 완료
```

---

## Git 워크플로우

| 시점 | 동작 |
|------|------|
| Init | `feat/{TICKET}` 브랜치 생성 |
| 각 Step 완료 | `{TICKET}-{요약}-{step}` 커밋 |
| Review 완료 | PR 생성 안내 |

---

## 참조

- [Step 1 상세](references/step-1.md) - User Plan 작성
- [Step 2 상세](references/step-2.md) - Research & Planning
- [Step 3 상세](references/step-3.md) - Implementation
- [Step 4 상세](references/step-4.md) - Review
- [규칙](assets/rules/) - 공통 규칙
