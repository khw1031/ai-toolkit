---
name: workflow-framework
description: |
  복잡한 작업을 체계적인 단계로 나누어 처리하는 커스텀 워크플로우 스킬을 생성합니다.
  워크플로우 생성, 새 워크플로우 만들기, 스킬 만들기, 작업 흐름 설계,
  단계별 프로세스 설계, 반복 작업 자동화 워크플로우,
  커스텀 워크플로우 개발 시 사용하세요.
license: MIT
metadata:
  author: hanssem
  version: "1.0.0"
  category: framework
allowed-tools: Bash Read Write Edit
---

# Workflow Framework

사용자 요구사항에 맞는 커스텀 워크플로우 스킬을 생성하는 프레임워크입니다.

## 핵심 원칙

| 원칙 | 설명 | 구현 |
|------|------|------|
| **Context Isolation** | 각 Step은 독립적 컨텍스트에서 실행 | 새 대화 권장 + 역할 재정의 |
| **Human in the Loop** | 사용자 확인 후 다음 단계 진행 | Step 완료 시 승인 요청 |
| **Document as Interface** | Step 간 통신은 문서로 수행 | 입출력 파일 기반 전달 |

## 설계 원칙

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Phase 기반 분리                                          │
│    SKILL.md → scripts → references → templates → rules     │
├─────────────────────────────────────────────────────────────┤
│ 2. 토큰 예산 관리                                           │
│    - 메타데이터: ~100 토큰                                  │
│    - SKILL.md: <5000 토큰                                   │
│    - Step당: ~1000 토큰                                     │
├─────────────────────────────────────────────────────────────┤
│ 3. 검증 가능한 체크리스트                                   │
│    각 Step별 구체적 완료 기준 포함                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 워크플로우 생성 방법

### 방법 1: 스크립트 사용

```bash
./scripts/create-workflow.sh <workflow-name> <step-count>
```

예시:
```bash
./scripts/create-workflow.sh bug-fix 3
./scripts/create-workflow.sh code-review 2
```

### 방법 2: 수동 생성

아래 디렉토리 구조를 따라 직접 생성:

```
workflow-name/
├── SKILL.md                    # Phase 1: 메인 스킬 정의
├── scripts/
│   └── task.sh                 # Phase 2: Task 관리 스크립트
├── references/
│   ├── step-1.md               # Phase 3: Step별 상세 가이드
│   └── step-n.md
└── assets/
    ├── templates/              # Phase 4: 문서 템플릿
    │   ├── input.md
    │   └── output-step-n.md
    └── rules/                  # Phase 5: 공유 규칙
        └── *.md
```

---

## SKILL.md 작성 가이드

### YAML Frontmatter

```yaml
---
name: workflow-name           # 1-64자, 소문자/숫자/하이픈
description: |                # 무엇+언제 사용하는지
  [워크플로우 설명]
  사용 시점: "트리거1", "트리거2"
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
allowed-tools: Bash Read Write Edit
---
```

### 본문 구조

```markdown
# 워크플로우 이름

## 핵심 원칙
[Context Isolation, Human in the Loop, Document as Interface]

## 워크플로우 개요
| Step | 역할 | 입력 | 출력 | 상세 |
|------|------|------|------|------|
| 1 | [역할] | [입력] | [출력] | [references/step-1.md] |

## Task 시작
[초기화 방법]

## Step 1: [이름]
[역할, 목표, 참조, 입출력, 완료 조건]

## 진행 상태 확인
[task.sh 사용법]
```

---

## Task 관리

### Task 초기화

```bash
./scripts/task.sh init <TASK_ID>
```

생성되는 구조:
```
.ai/tasks/<TASK_ID>/
├── status.yaml      # 상태 파일
├── input.md         # 입력 (템플릿에서 복사)
├── output-step-1.md # Step 1 출력
├── output-step-2.md # Step 2 출력
└── ...
```

### 상태 확인

```bash
./scripts/task.sh status <TASK_ID>
./scripts/task.sh list
```

### Step 완료

```bash
./scripts/task.sh complete <TASK_ID> step-1
./scripts/task.sh complete <TASK_ID> step-3 --finish  # 마지막 Step
```

---

## Progressive Disclosure

```
시점                    로드 리소스                    토큰
─────────────────────────────────────────────────────────────
스킬 매칭 시            name, description             ~100
스킬 활성화 시          SKILL.md 본문                 ~800
Step N 진입 시          references/step-n.md          ~500
                       templates/output-step-n.md    ~200
                       rules/*.md (해당 규칙)        ~300
─────────────────────────────────────────────────────────────
Step당 총합             약 1,000 토큰
```

---

## 검증 체크리스트

### SKILL.md 검증
- [ ] name: 1-64자, 소문자/숫자/하이픈, 디렉토리명과 일치
- [ ] description: 무엇+언제+트리거 키워드 포함
- [ ] 본문 500줄 이하
- [ ] 참조 링크 1단계 깊이

### Step 검증
- [ ] 역할, 목표, 입출력, 완료 조건 포함
- [ ] Context Isolation 지시문 포함
- [ ] 체크리스트 구체적

### 실행 검증
- [ ] task.sh init 동작
- [ ] status.yaml 유효
- [ ] 템플릿 복사 정상

---

## 참조

- 상세 가이드: [references/framework-guide.md](references/framework-guide.md)
- Step 템플릿: [references/step-template.md](references/step-template.md)
- 예제 워크플로우: [../feature-development/](../feature-development/)
