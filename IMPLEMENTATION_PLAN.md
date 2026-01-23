# Workflow Skills 구현 계획

> PRD.md 기반 feature-development 스킬 구현 계획서

---

## 1. 개요

### 1.1 목표

MCP 기반 워크플로우를 Claude Code Skills로 전환하여:
- 서버 없이 폴더 복사만으로 배포 가능
- 텍스트 파일로 즉시 디버깅/커스터마이징 가능
- Progressive Disclosure로 컨텍스트 효율성 확보

### 1.2 구현 범위

```
feature-development/
├── SKILL.md                         # 메인 스킬 정의
├── scripts/
│   └── task.sh                      # Task 관리 CLI
├── references/
│   ├── research.md                  # Research Step 상세 가이드
│   ├── plan.md                      # Plan Step 상세 가이드
│   └── implement.md                 # Implement Step 상세 가이드
└── assets/
    ├── templates/
    │   ├── feature-request.md       # 사용자 입력 양식
    │   ├── research-report.md       # Research 출력 형식
    │   ├── implementation-plan.md   # Plan 출력 형식
    │   └── implementation-result.md # Implement 출력 형식
    └── rules/
        ├── code-style.md            # 코딩 컨벤션
        └── security.md              # 보안 규칙
```

---

## 2. 구현 단계

### Phase 1: 핵심 스킬 정의 (SKILL.md)

#### Task 1.1: SKILL.md 작성
- **파일**: `feature-development/SKILL.md`
- **내용**:
  - YAML frontmatter (name, description, license, metadata, allowed-tools)
  - 핵심 원칙 (Context Isolation, Human in the Loop, Document as Interface)
  - 워크플로우 개요 테이블
  - Task 시작 섹션
  - Step 1-3 요약 (각 Step별 역할, 입출력, 참조 링크)
  - 진행 상태 확인 방법
- **검증 기준**:
  - [ ] name: 1-64자, 소문자/숫자/하이픈만
  - [ ] description: 무엇+언제 명확히 포함
  - [ ] 본문 500줄 이하

---

### Phase 2: Task 관리 스크립트

#### Task 2.1: task.sh 구현
- **파일**: `feature-development/scripts/task.sh`
- **명령어**:
  | 명령 | 설명 |
  |------|------|
  | `init <TASK_ID>` | 새 Task 생성, 디렉토리 및 status.yaml 초기화 |
  | `status <TASK_ID>` | Task 상태 출력 |
  | `list` | 전체 Task 목록 |
  | `complete <TASK_ID> <STEP> [--finish]` | Step 완료 처리 |
- **구현 세부사항**:
  - `.ai/tasks/<TASK_ID>/` 디렉토리 생성
  - `status.yaml` 상태 파일 관리
  - 입력 템플릿 자동 복사
- **검증 기준**:
  - [ ] 실행 권한 설정 (`chmod +x`)
  - [ ] 에러 메시지 명확
  - [ ] Usage 문서화

---

### Phase 3: Step별 상세 가이드 (references/)

#### Task 3.1: research.md 작성
- **파일**: `feature-development/references/research.md`
- **내용**:
  - Context Isolation 지시문 (역할 전환 안내)
  - 역할 정의 (기술 리서처)
  - 책임 목록
  - 체크리스트
  - 주의사항
  - 출력 가이드 (템플릿 참조)
- **검증 기준**:
  - [ ] 격리 지시문 포함
  - [ ] 체크리스트 구체적

#### Task 3.2: plan.md 작성
- **파일**: `feature-development/references/plan.md`
- **내용**:
  - Context Isolation 지시문
  - 역할 정의 (소프트웨어 아키텍트)
  - 책임 목록
  - 체크리스트
  - 출력 가이드

#### Task 3.3: implement.md 작성
- **파일**: `feature-development/references/implement.md`
- **내용**:
  - Context Isolation 지시문
  - 역할 정의 (시니어 개발자)
  - 책임 목록
  - 체크리스트
  - 코드 품질 기준
  - 출력 가이드

---

### Phase 4: 템플릿 (assets/templates/)

#### Task 4.1: feature-request.md (입력 템플릿)
- **파일**: `feature-development/assets/templates/feature-request.md`
- **내용**:
  - 기능 이름
  - 기능 설명
  - 요구사항 (기능적/비기능적)
  - 제약 조건
  - 우선순위

#### Task 4.2: research-report.md (Research 출력)
- **파일**: `feature-development/assets/templates/research-report.md`
- **내용**:
  - 개요 (조사 목적, 요구사항 요약)
  - 기술 분석 (옵션 비교, 추천 스택)
  - 보안 고려사항
  - 구현 복잡도
  - 다음 단계 권장사항

#### Task 4.3: implementation-plan.md (Plan 출력)
- **파일**: `feature-development/assets/templates/implementation-plan.md`
- **내용**:
  - 개요
  - 아키텍처 설계
  - 구현 단계별 계획
  - 파일/모듈 구조
  - 테스트 전략
  - 마일스톤

#### Task 4.4: implementation-result.md (Implement 출력)
- **파일**: `feature-development/assets/templates/implementation-result.md`
- **내용**:
  - 구현 요약
  - 변경된 파일 목록
  - 테스트 결과
  - 알려진 제한사항
  - 후속 작업

---

### Phase 5: 규칙 (assets/rules/)

#### Task 5.1: code-style.md
- **파일**: `feature-development/assets/rules/code-style.md`
- **내용**:
  - 일반 코딩 컨벤션
  - 언어별 스타일 가이드 참조
  - 네이밍 규칙
  - 파일 구조 원칙

#### Task 5.2: security.md
- **파일**: `feature-development/assets/rules/security.md`
- **내용**:
  - OWASP Top 10 체크리스트
  - 인증/인가 가이드라인
  - 데이터 검증 원칙
  - 비밀 관리 (환경변수, 시크릿)

---

## 3. 파일별 상세 스펙

### 3.1 SKILL.md 구조

```yaml
---
name: feature-development
description: |
  새 기능 개발을 위한 3단계 워크플로우. Research → Plan → Implement 순서로 진행.
  사용 시점: "새 기능 개발", "feature 구현", "JWT 인증 구현", "로그인 기능"
license: MIT
metadata:
  author: hanssem
  version: "1.0.0"
allowed-tools: Bash(git:*) Read Write Edit
---

# Feature Development Workflow

## 핵심 원칙
[Context Isolation, Human in the Loop, Document as Interface]

## 워크플로우 개요
[테이블: Step, 역할, 입력, 출력, 상세 링크]

## Task 시작
[초기화 안내]

## Step 1-3
[요약 + 참조 링크]

## 진행 상태 확인
[task.sh 사용법]
```

### 3.2 status.yaml 스키마

```yaml
task_id: string          # Task 식별자
workflow: string         # 워크플로우 이름
status: enum             # pending | running | completed | failed
current_step: string     # 현재 Step ID
created_at: datetime     # 생성 시각 (ISO 8601)
updated_at: datetime     # 마지막 업데이트
steps:
  research:
    status: enum         # pending | in_progress | completed | skipped
    started_at: datetime
    completed_at: datetime
  plan:
    status: enum
    started_at: datetime
    completed_at: datetime
  implement:
    status: enum
    started_at: datetime
    completed_at: datetime
```

---

## 4. 검증 계획

### 4.1 단위 테스트

| 항목 | 테스트 내용 |
|------|------------|
| task.sh init | 디렉토리 생성, status.yaml 초기화, input.md 복사 |
| task.sh status | 존재하는/존재하지 않는 Task 처리 |
| task.sh list | 빈 목록, 여러 Task 목록 출력 |
| task.sh complete | Step 상태 변경, --finish 플래그 처리 |

### 4.2 통합 테스트

```
시나리오: JWT 인증 기능 개발

1. Task 초기화
   $ ./scripts/task.sh init AUTH-001
   → .ai/tasks/AUTH-001/ 생성 확인

2. Research Step
   - input.md 편집
   - references/research.md 로드 확인
   - research.md 출력 검증

3. Plan Step (새 대화)
   - research.md 입력으로 사용
   - plan.md 출력 검증

4. Implement Step (새 대화)
   - plan.md 입력으로 사용
   - 코드 구현 및 result.md 출력 검증
```

### 4.3 Progressive Disclosure 검증

| 시점 | 로드되는 파일 | 예상 토큰 |
|------|-------------|----------|
| Skill 매칭 | name, description | ~100 |
| Skill 활성화 | SKILL.md 전체 | ~500 |
| Research 진입 | references/research.md, templates/*, rules/security.md | ~1,300 |
| Plan 진입 | references/plan.md, templates/*, rules/*.md | ~1,400 |
| Implement 진입 | references/implement.md, templates/*, rules/*.md | ~1,400 |

---

## 5. 구현 순서 요약

```
Phase 1: SKILL.md
├── Task 1.1: SKILL.md 작성

Phase 2: scripts/
├── Task 2.1: task.sh 구현

Phase 3: references/
├── Task 3.1: research.md
├── Task 3.2: plan.md
└── Task 3.3: implement.md

Phase 4: assets/templates/
├── Task 4.1: feature-request.md
├── Task 4.2: research-report.md
├── Task 4.3: implementation-plan.md
└── Task 4.4: implementation-result.md

Phase 5: assets/rules/
├── Task 5.1: code-style.md
└── Task 5.2: security.md
```

---

## 6. 예상 산출물 토큰 수

| 파일 | 예상 줄 수 | 예상 토큰 |
|------|-----------|----------|
| SKILL.md | ~150 | ~500 |
| task.sh | ~100 | ~300 |
| research.md | ~80 | ~300 |
| plan.md | ~80 | ~300 |
| implement.md | ~100 | ~350 |
| feature-request.md | ~40 | ~150 |
| research-report.md | ~50 | ~200 |
| implementation-plan.md | ~60 | ~220 |
| implementation-result.md | ~50 | ~180 |
| code-style.md | ~80 | ~300 |
| security.md | ~100 | ~350 |
| **총계** | **~890** | **~3,150** |

---

## 7. 위험 요소 및 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| Context Isolation 불완전 | Step 간 정보 오염 | "새 대화" 안내 강화, 역할 재정의 지시문 명확화 |
| task.sh 플랫폼 호환성 | Windows 미지원 | compatibility 필드에 macOS/Linux 명시, 향후 PowerShell 버전 고려 |
| 템플릿 과도한 복잡성 | 사용자 부담 | 최소 필수 필드만 포함, 선택 필드 별도 표시 |
| 토큰 예산 초과 | 컨텍스트 효율성 저하 | 각 파일 500줄 제한 엄격 준수, 정기 검토 |

---

## 8. 향후 확장 고려사항

1. **추가 워크플로우**
   - bug-fix: 버그 수정 워크플로우
   - refactoring: 리팩토링 워크플로우
   - code-review: 코드 리뷰 워크플로우

2. **도구 통합**
   - Git 브랜치 자동 생성/관리
   - PR 템플릿 연동
   - CI/CD 파이프라인 트리거

3. **상태 관리 고도화**
   - yq 기반 YAML 처리로 task.sh 개선
   - 상태 히스토리 추적
   - 롤백 기능

---

## 부록: 디렉토리 생성 명령어

```bash
# 전체 디렉토리 구조 생성
mkdir -p feature-development/{scripts,references,assets/{templates,rules}}

# 빈 파일 생성 (구조 확인용)
touch feature-development/SKILL.md
touch feature-development/scripts/task.sh
touch feature-development/references/{research,plan,implement}.md
touch feature-development/assets/templates/{feature-request,research-report,implementation-plan,implementation-result}.md
touch feature-development/assets/rules/{code-style,security}.md
```
