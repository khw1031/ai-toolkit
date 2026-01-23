# Workflow Skills Framework

> 사용자 입력과 문서 기반으로 커스텀 워크플로우를 생성하는 스킬 프레임워크

---

## 1. 개요

### 1.1 프레임워크 목적

Workflow Skills Framework는 다음을 가능하게 합니다:

| 목적 | 설명 |
|------|------|
| **커스텀 워크플로우 생성** | 사용자 요구사항에 맞는 다단계 워크플로우 정의 |
| **컨텍스트 효율성** | Progressive Disclosure로 토큰 예산 관리 |
| **재사용성** | 템플릿과 규칙의 모듈화로 워크플로우 간 공유 |
| **확장성** | 새로운 Step, 역할, 규칙 추가 용이 |

### 1.2 핵심 설계 원칙

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1️⃣ Phase 기반 분리                                                  │
│    의존성 순서: SKILL.md → scripts → references → templates → rules │
├─────────────────────────────────────────────────────────────────────┤
│ 2️⃣ 토큰 예산 관리                                                   │
│    - 1단계: ~100 토큰 (메타데이터)                                   │
│    - 2단계: <5000 토큰 (SKILL.md 본문)                               │
│    - 3단계: 필요시 로드 (references, assets)                        │
├─────────────────────────────────────────────────────────────────────┤
│ 3️⃣ 검증 가능한 체크리스트                                           │
│    각 Step별 구체적인 완료 기준과 검증 항목 포함                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 워크플로우 실행 원칙

| 원칙 | 설명 | 구현 방법 |
|------|------|----------|
| **Context Isolation** | 각 Step은 독립적인 컨텍스트에서 실행 | 새 대화 권장 + 역할 재정의 지시문 |
| **Human in the Loop** | 사용자 확인 후 다음 단계 진행 | Step 완료 시 사용자 승인 요청 |
| **Document as Interface** | Step 간 통신은 문서로 수행 | 입출력 파일 기반 데이터 전달 |

---

## 2. 워크플로우 구조 설계

### 2.1 디렉토리 구조 (Phase 기반)

```
workflow-name/
│
├── SKILL.md                    # Phase 1: 메인 스킬 정의
│                               #   - 워크플로우 개요
│                               #   - Step 요약 및 참조 링크
│                               #   - <500줄, <5000 토큰
│
├── scripts/                    # Phase 2: 실행 스크립트
│   └── task.sh                 #   - Task 생명주기 관리
│                               #   - 상태 파일 조작
│
├── references/                 # Phase 3: Step별 상세 가이드
│   ├── step-1.md               #   - 역할 정의
│   ├── step-2.md               #   - 체크리스트
│   └── step-n.md               #   - 주의사항
│
└── assets/                     # Phase 4-5: 정적 리소스
    ├── templates/              # Phase 4: 문서 템플릿
    │   ├── input.md            #   - 입력 양식
    │   └── output-step-n.md    #   - Step별 출력 형식
    └── rules/                  # Phase 5: 공유 규칙
        └── *.md                #   - 코딩 컨벤션, 보안 등
```

### 2.2 Phase별 역할과 토큰 예산

| Phase | 구성요소 | 역할 | 토큰 예산 | 로드 시점 |
|-------|----------|------|----------|----------|
| 1 | SKILL.md | 워크플로우 진입점, 전체 흐름 정의 | <5000 | 스킬 활성화 시 |
| 2 | scripts/ | Task 생성, 상태 관리, Step 전환 | N/A | 필요시 실행 |
| 3 | references/ | Step별 역할, 체크리스트, 상세 지침 | 각 500-800 | Step 진입 시 |
| 4 | templates/ | 입출력 문서 형식 | 각 100-300 | Step 진입 시 |
| 5 | rules/ | 공유 규칙 (보안, 스타일 등) | 각 200-400 | Step 진입 시 |

### 2.3 Progressive Disclosure 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1️⃣ 메타데이터 (~100 tokens) - 스킬 매칭 시                          │
│    name, description → 트리거 키워드로 스킬 선택                     │
├─────────────────────────────────────────────────────────────────────┤
│ 2️⃣ 지침 (<5000 tokens) - 스킬 활성화 시                             │
│    SKILL.md 본문                                                    │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ ## 워크플로우 개요                                        │    │
│    │ ## Step 1: [이름] (요약)                                  │    │
│    │    → 상세: [references/step-1.md] 참조                    │    │
│    │ ## Step 2: [이름] (요약)                                  │    │
│    │    → 상세: [references/step-2.md] 참조                    │    │
│    │ ...                                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│ 3️⃣ 리소스 (필요시) - Step 진입 시                                   │
│                                                                     │
│    Step N 진입 시 로드:                                             │
│    ├── references/step-n.md       (역할, 체크리스트)                │
│    ├── assets/templates/input.md  (입력 형식, 첫 Step만)            │
│    ├── assets/templates/output-step-n.md  (출력 형식)               │
│    └── assets/rules/*.md          (해당 Step에 필요한 규칙)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. SKILL.md 설계 가이드

### 3.1 YAML Frontmatter 스펙

```yaml
---
name: workflow-name           # 필수: 1-64자, 소문자/숫자/하이픈
description: |                # 필수: 1-1024자
  [무엇을 하는지] + [언제 사용하는지]
  트리거 키워드: "키워드1", "키워드2", "키워드3"
license: MIT                  # 선택: 라이선스
compatibility: |              # 선택: 환경 요구사항
  macOS/Linux, bash 4.0+
metadata:                     # 선택: 추가 정보
  author: team-name
  version: "1.0.0"
  category: development
allowed-tools: Bash Read Write Edit  # 선택: 허용 도구
---
```

### 3.2 본문 구조 템플릿

```markdown
# [워크플로우 이름]

## 핵심 원칙

1. **Context Isolation**: 각 Step은 새 대화에서 실행 권장
2. **Human in the Loop**: 사용자 입력 확인 후 진행
3. **Document as Interface**: Step 간 통신은 문서로 수행

## 워크플로우 개요

| Step | 역할 | 입력 | 출력 | 상세 |
|------|------|------|------|------|
| 1. [Step명] | [역할] | [입력 파일] | [출력 파일] | [references/step-1.md] |
| 2. [Step명] | [역할] | [입력 파일] | [출력 파일] | [references/step-2.md] |
| ... | ... | ... | ... | ... |

---

## Task 시작

1. **Task ID 결정**: 사용자에게 요청 (예: `PROJ-001`)
2. **Task 초기화**: `./scripts/task.sh init <TASK_ID>`
3. **입력 작성**: `.ai/tasks/<TASK_ID>/input.md` 편집 안내

---

## Step 1: [Step 이름]

**역할**: [역할명]  
**목표**: [목표 설명]

### 참조 자료
- 상세 가이드: [references/step-1.md](references/step-1.md)
- 출력 템플릿: [assets/templates/output-step-1.md](assets/templates/output-step-1.md)
- 적용 규칙: [assets/rules/relevant-rule.md](assets/rules/relevant-rule.md)

### 입출력
- **입력**: `.ai/tasks/<TASK_ID>/input.md`
- **출력**: `.ai/tasks/<TASK_ID>/step-1-output.md`

### 완료 조건
- [ ] 체크리스트 항목 1
- [ ] 체크리스트 항목 2

**완료 후**: `./scripts/task.sh complete <TASK_ID> step-1`

> ⚠️ 다음 Step은 **새 대화**에서 진행 권장

---

## Step 2: [Step 이름]
[위와 동일한 구조]

---

## 진행 상태 확인

```bash
./scripts/task.sh status <TASK_ID>
```
```

### 3.3 검증 체크리스트

SKILL.md 작성 후 확인:

```
□ name: 1-64자, 소문자/숫자/하이픈만, 디렉토리명과 일치
□ description: 무엇+언제 포함, 트리거 키워드 명시
□ 본문: 500줄 이하
□ 각 Step: 역할, 목표, 입출력, 완료 조건 포함
□ 참조 링크: 1단계 깊이 (references/, assets/)
□ Context Isolation: "새 대화 권장" 안내 포함
```

---

## 4. references/ 설계 가이드

### 4.1 Step 상세 가이드 구조

```markdown
# [Step 이름] 상세 가이드

> ⚠️ **Context Isolation**
> 이전 대화의 내용은 이 Step과 관련이 없습니다.
> 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **[역할명]**입니다.

## 책임

1. [책임 1]
2. [책임 2]
3. [책임 3]

## 체크리스트

- [ ] [검증 항목 1]
- [ ] [검증 항목 2]
- [ ] [검증 항목 3]

## 주의사항

- [주의사항 1]
- [주의사항 2]

## 출력 가이드

[assets/templates/output-step-n.md](../assets/templates/output-step-n.md) 형식을 따르세요.
```

### 4.2 토큰 예산 가이드

| 섹션 | 권장 토큰 |
|------|----------|
| 역할 정의 | 50-100 |
| 책임 | 100-200 |
| 체크리스트 | 100-150 |
| 주의사항 | 50-100 |
| 출력 가이드 | 50-100 |
| **총계** | **350-650** |

---

## 5. assets/ 설계 가이드

### 5.1 templates/ 구조

#### 입력 템플릿 (input.md)

```markdown
# [워크플로우] 입력

## 1. 기본 정보

### 1.1 [항목명]
<!-- 설명 -->

### 1.2 [항목명]
<!-- 설명 -->

## 2. 요구사항

### 2.1 필수 요구사항
- [ ] 

### 2.2 선택 요구사항
- [ ] 

## 3. 제약 조건

<!-- 기술적/비즈니스적 제약 -->

## 4. 참고 자료

<!-- 관련 문서, 링크 등 -->
```

#### 출력 템플릿 (output-step-n.md)

```markdown
# [Step 이름] 결과

## 1. 요약

<!-- 핵심 결과 요약 -->

## 2. 상세 내용

### 2.1 [섹션명]

### 2.2 [섹션명]

## 3. 검증 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| [체크항목] | ✅/❌ | |

## 4. 다음 단계

<!-- 다음 Step을 위한 권장사항 -->
```

### 5.2 rules/ 구조

```markdown
# [규칙명]

> 적용 대상: [Step 이름] 또는 [전체]

## 원칙

1. [원칙 1]
2. [원칙 2]

## 체크리스트

- [ ] [검증 항목]
- [ ] [검증 항목]

## 예외 사항

- [예외 케이스]
```

---

## 6. scripts/task.sh 설계

### 6.1 명령어 스펙

| 명령 | 용법 | 설명 |
|------|------|------|
| `init` | `task.sh init <TASK_ID>` | 새 Task 생성 |
| `status` | `task.sh status <TASK_ID>` | Task 상태 조회 |
| `list` | `task.sh list` | 전체 Task 목록 |
| `complete` | `task.sh complete <TASK_ID> <STEP> [--finish]` | Step 완료 처리 |

### 6.2 상태 파일 스키마 (status.yaml)

```yaml
task_id: string              # Task 식별자
workflow: string             # 워크플로우 이름
status: enum                 # pending | running | completed | failed
current_step: string         # 현재 Step ID
created_at: datetime         # ISO 8601
updated_at: datetime         # ISO 8601
steps:
  step-1:
    status: enum             # pending | in_progress | completed | skipped
    started_at: datetime
    completed_at: datetime
  step-2:
    status: enum
    started_at: datetime
    completed_at: datetime
  # ...
```

### 6.3 구현 템플릿

```bash
#!/bin/bash
set -e

COMMAND=$1
TASK_ID=$2
STEP_ID=$3
FLAG=$4

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TASK_DIR=".ai/tasks/$TASK_ID"

show_help() {
  cat << EOF
Usage: task.sh <command> [options]

Commands:
  init <TASK_ID>                    Create new task
  status <TASK_ID>                  Show task status
  list                              List all tasks
  complete <TASK_ID> <STEP> [--finish]  Mark step as completed

Examples:
  ./scripts/task.sh init PROJ-001
  ./scripts/task.sh status PROJ-001
  ./scripts/task.sh complete PROJ-001 step-1
  ./scripts/task.sh complete PROJ-001 step-3 --finish
EOF
}

cmd_init() {
  if [ -z "$TASK_ID" ]; then
    echo "Error: TASK_ID required"
    exit 1
  fi

  mkdir -p "$TASK_DIR"

  # status.yaml 생성 (워크플로우별 커스터마이징 필요)
  cat > "$TASK_DIR/status.yaml" << EOF
task_id: $TASK_ID
workflow: $(basename "$SKILL_DIR")
status: running
current_step: step-1
created_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
updated_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
steps:
  step-1: { status: pending }
  step-2: { status: pending }
  # 워크플로우에 맞게 Step 추가
EOF

  # 입력 템플릿 복사
  if [ -f "$SKILL_DIR/assets/templates/input.md" ]; then
    cp "$SKILL_DIR/assets/templates/input.md" "$TASK_DIR/input.md"
  fi

  echo "✅ Task $TASK_ID created"
  echo "📝 Edit: $TASK_DIR/input.md"
}

cmd_status() {
  if [ ! -f "$TASK_DIR/status.yaml" ]; then
    echo "Error: Task $TASK_ID not found"
    exit 1
  fi
  cat "$TASK_DIR/status.yaml"
}

cmd_list() {
  echo "Tasks:"
  for dir in .ai/tasks/*/; do
    if [ -f "$dir/status.yaml" ]; then
      task=$(basename "$dir")
      status=$(grep "^status:" "$dir/status.yaml" | cut -d' ' -f2)
      step=$(grep "^current_step:" "$dir/status.yaml" | cut -d' ' -f2)
      echo "  $task: $status ($step)"
    fi
  done
}

cmd_complete() {
  if [ -z "$STEP_ID" ]; then
    echo "Error: STEP_ID required"
    exit 1
  fi

  if [ ! -f "$TASK_DIR/status.yaml" ]; then
    echo "Error: Task $TASK_ID not found"
    exit 1
  fi

  # 상태 업데이트 (실제 구현에서는 yq 등 사용 권장)
  sed -i.bak "s/updated_at:.*/updated_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")/" "$TASK_DIR/status.yaml"
  
  echo "✅ Step $STEP_ID completed for $TASK_ID"

  if [ "$FLAG" = "--finish" ]; then
    sed -i.bak "s/^status:.*/status: completed/" "$TASK_DIR/status.yaml"
    echo "🎉 Workflow completed!"
  else
    echo "➡️ Next step ready"
  fi
  
  rm -f "$TASK_DIR/status.yaml.bak"
}

case "$COMMAND" in
  init)     cmd_init ;;
  status)   cmd_status ;;
  list)     cmd_list ;;
  complete) cmd_complete ;;
  help|--help|-h) show_help ;;
  *)        show_help ;;
esac
```

---

## 7. 워크플로우 생성 가이드

### 7.1 새 워크플로우 생성 절차

```
1. 요구사항 분석
   └── 워크플로우 목적, Step 수, 역할 정의

2. Phase 1: SKILL.md 작성
   ├── YAML frontmatter (name, description)
   ├── 핵심 원칙
   ├── 워크플로우 개요 테이블
   └── Step별 요약 섹션

3. Phase 2: scripts/task.sh 커스터마이징
   └── status.yaml의 steps 섹션 수정

4. Phase 3: references/ 작성
   └── 각 Step별 상세 가이드

5. Phase 4: assets/templates/ 작성
   ├── input.md (입력 템플릿)
   └── output-step-n.md (각 Step 출력 템플릿)

6. Phase 5: assets/rules/ 작성
   └── 워크플로우에 필요한 규칙

7. 검증
   └── 체크리스트 확인, 테스트 실행
```

### 7.2 디렉토리 생성 스크립트

```bash
#!/bin/bash
# create-workflow.sh <workflow-name> <step-count>

WORKFLOW_NAME=$1
STEP_COUNT=${2:-3}

if [ -z "$WORKFLOW_NAME" ]; then
  echo "Usage: create-workflow.sh <workflow-name> [step-count]"
  exit 1
fi

# 디렉토리 생성
mkdir -p "$WORKFLOW_NAME"/{scripts,references,assets/{templates,rules}}

# SKILL.md 스켈레톤
cat > "$WORKFLOW_NAME/SKILL.md" << EOF
---
name: $WORKFLOW_NAME
description: |
  [워크플로우 설명]
  사용 시점: "[트리거 키워드1]", "[트리거 키워드2]"
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
allowed-tools: Bash Read Write Edit
---

# $(echo "$WORKFLOW_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

## 핵심 원칙

1. **Context Isolation**: 각 Step은 새 대화에서 실행 권장
2. **Human in the Loop**: 사용자 입력 확인 후 진행
3. **Document as Interface**: Step 간 통신은 문서로 수행

## 워크플로우 개요

| Step | 역할 | 입력 | 출력 | 상세 |
|------|------|------|------|------|
$(for i in $(seq 1 $STEP_COUNT); do echo "| $i. Step-$i | [역할] | [입력] | [출력] | [references/step-$i.md] |"; done)

---

## Task 시작

1. **Task ID 결정**: 사용자에게 요청
2. **Task 초기화**: \`./scripts/task.sh init <TASK_ID>\`
3. **입력 작성**: \`.ai/tasks/<TASK_ID>/input.md\` 편집

---

$(for i in $(seq 1 $STEP_COUNT); do
cat << STEP

## Step $i: [Step 이름]

**역할**: [역할명]  
**목표**: [목표]

- 상세 가이드: [references/step-$i.md](references/step-$i.md)
- 출력 템플릿: [assets/templates/output-step-$i.md](assets/templates/output-step-$i.md)

**입력**: \`.ai/tasks/<TASK_ID>/$([ $i -eq 1 ] && echo "input.md" || echo "output-step-$((i-1)).md")\`  
**출력**: \`.ai/tasks/<TASK_ID>/output-step-$i.md\`

**완료 후**: \`./scripts/task.sh complete <TASK_ID> step-$i$([ $i -eq $STEP_COUNT ] && echo " --finish")\`

> ⚠️ 다음 Step은 **새 대화**에서 진행 권장

---
STEP
done)

## 진행 상태 확인

\`\`\`bash
./scripts/task.sh status <TASK_ID>
\`\`\`
EOF

# references/ 스켈레톤
for i in $(seq 1 $STEP_COUNT); do
cat > "$WORKFLOW_NAME/references/step-$i.md" << EOF
# Step $i 상세 가이드

> ⚠️ **Context Isolation**
> 이전 대화의 내용은 이 Step과 관련이 없습니다.

## 역할 정의

당신은 **[역할명]**입니다.

## 책임

1. [책임 1]
2. [책임 2]

## 체크리스트

- [ ] [검증 항목 1]
- [ ] [검증 항목 2]

## 출력 가이드

[assets/templates/output-step-$i.md](../assets/templates/output-step-$i.md) 형식을 따르세요.
EOF
done

# templates/ 스켈레톤
cat > "$WORKFLOW_NAME/assets/templates/input.md" << 'EOF'
# 입력

## 1. 기본 정보

### 1.1 [항목]
<!-- 설명 -->

## 2. 요구사항

- [ ] 

## 3. 제약 조건

<!-- -->
EOF

for i in $(seq 1 $STEP_COUNT); do
cat > "$WORKFLOW_NAME/assets/templates/output-step-$i.md" << EOF
# Step $i 결과

## 1. 요약

## 2. 상세 내용

## 3. 검증 결과

| 항목 | 상태 |
|------|------|
| | ✅/❌ |

## 4. 다음 단계

EOF
done

# task.sh 복사 (템플릿에서)
cat > "$WORKFLOW_NAME/scripts/task.sh" << 'TASKSH'
#!/bin/bash
set -e

COMMAND=$1
TASK_ID=$2
STEP_ID=$3
FLAG=$4

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TASK_DIR=".ai/tasks/$TASK_ID"

show_help() {
  cat << EOF
Usage: task.sh <command> [options]

Commands:
  init <TASK_ID>                    Create new task
  status <TASK_ID>                  Show task status
  list                              List all tasks
  complete <TASK_ID> <STEP> [--finish]  Mark step as completed
EOF
}

cmd_init() {
  [ -z "$TASK_ID" ] && echo "Error: TASK_ID required" && exit 1
  mkdir -p "$TASK_DIR"
  cat > "$TASK_DIR/status.yaml" << EOF
task_id: $TASK_ID
workflow: $(basename "$SKILL_DIR")
status: running
current_step: step-1
created_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
  [ -f "$SKILL_DIR/assets/templates/input.md" ] && cp "$SKILL_DIR/assets/templates/input.md" "$TASK_DIR/input.md"
  echo "✅ Task $TASK_ID created"
  echo "📝 Edit: $TASK_DIR/input.md"
}

cmd_status() {
  [ ! -f "$TASK_DIR/status.yaml" ] && echo "Error: Task not found" && exit 1
  cat "$TASK_DIR/status.yaml"
}

cmd_list() {
  echo "Tasks:"
  for dir in .ai/tasks/*/; do
    [ -f "$dir/status.yaml" ] && echo "  $(basename "$dir")"
  done
}

cmd_complete() {
  [ -z "$STEP_ID" ] && echo "Error: STEP_ID required" && exit 1
  echo "✅ Step $STEP_ID completed"
  [ "$FLAG" = "--finish" ] && echo "🎉 Workflow completed!"
}

case "$COMMAND" in
  init) cmd_init ;; status) cmd_status ;; list) cmd_list ;; complete) cmd_complete ;; *) show_help ;;
esac
TASKSH
chmod +x "$WORKFLOW_NAME/scripts/task.sh"

echo "✅ Workflow '$WORKFLOW_NAME' created with $STEP_COUNT steps"
echo "📁 Directory: $WORKFLOW_NAME/"
```

---

## 8. 토큰 예산 계산

### 8.1 워크플로우별 예상 토큰

| 구성요소 | 3-Step | 5-Step | 7-Step |
|----------|--------|--------|--------|
| SKILL.md | ~800 | ~1,200 | ~1,600 |
| references/ (총합) | ~1,500 | ~2,500 | ~3,500 |
| templates/ (총합) | ~600 | ~900 | ~1,200 |
| rules/ (공유) | ~500 | ~500 | ~500 |
| **Step당 로드** | ~1,000 | ~1,000 | ~1,000 |

### 8.2 Step 진입 시 토큰 분포

```
Step N 진입 시 로드되는 토큰:
├── references/step-n.md     ~500
├── templates/output-step-n.md   ~200
└── rules/*.md (해당 규칙)   ~300
────────────────────────────
총계                         ~1,000 토큰/Step
```

---

## 9. 검증 체크리스트

### 9.1 워크플로우 전체 검증

```
□ SKILL.md
  ├── □ name 규칙 준수 (소문자/숫자/하이픈, 1-64자)
  ├── □ description에 무엇+언제+트리거 키워드 포함
  ├── □ 본문 500줄 이하
  └── □ 모든 참조 링크 유효

□ scripts/task.sh
  ├── □ 실행 권한 설정 (chmod +x)
  ├── □ 에러 메시지 명확
  └── □ help 명령 동작

□ references/
  ├── □ 각 Step별 파일 존재
  ├── □ Context Isolation 지시문 포함
  └── □ 체크리스트 구체적

□ assets/templates/
  ├── □ input.md 존재
  └── □ 각 Step별 output 템플릿 존재

□ assets/rules/
  └── □ 필요한 규칙 파일 존재
```

### 9.2 실행 검증

```
□ Task 생성: ./scripts/task.sh init TEST-001
  └── □ .ai/tasks/TEST-001/ 생성됨
  └── □ status.yaml 유효
  └── □ input.md 복사됨

□ Step 실행
  └── □ references/ 로드 시 역할 전환 명확
  └── □ 출력이 템플릿 형식 준수

□ Step 완료: ./scripts/task.sh complete TEST-001 step-1
  └── □ 상태 업데이트됨

□ 워크플로우 완료: --finish 플래그 동작
```

---

## 10. 예제: Feature Development 워크플로우

### 10.1 구조

```
feature-development/
├── SKILL.md
├── scripts/
│   └── task.sh
├── references/
│   ├── research.md
│   ├── plan.md
│   └── implement.md
└── assets/
    ├── templates/
    │   ├── feature-request.md
    │   ├── research-report.md
    │   ├── implementation-plan.md
    │   └── implementation-result.md
    └── rules/
        ├── code-style.md
        └── security.md
```

### 10.2 Step 요약

| Step | 역할 | 목표 |
|------|------|------|
| Research | 기술 리서처 | 기술 요구사항 분석 및 옵션 조사 |
| Plan | 소프트웨어 아키텍트 | 구현 계획 및 아키텍처 설계 |
| Implement | 시니어 개발자 | 계획 기반 코드 구현 |

### 10.3 실행 시나리오

```
[대화 1: Task 시작 + Research]
├── Task 초기화: ./scripts/task.sh init AUTH-001
├── 입력 작성: .ai/tasks/AUTH-001/input.md
├── Research 실행 → research-report.md 생성
└── 완료: ./scripts/task.sh complete AUTH-001 research

[대화 2: Plan] (새 대화)
├── research-report.md 입력으로 사용
├── Plan 실행 → implementation-plan.md 생성
└── 완료: ./scripts/task.sh complete AUTH-001 plan

[대화 3: Implement] (새 대화)
├── implementation-plan.md 입력으로 사용
├── Implement 실행 → 코드 + implementation-result.md 생성
└── 완료: ./scripts/task.sh complete AUTH-001 implement --finish
```

---

## 11. 결론

### 11.1 이 프레임워크를 사용해야 할 때

| 상황 | 권장 |
|------|------|
| 3-7 Step의 순차적 워크플로우 | ✅ 적합 |
| 문서 중심 작업 (분석, 계획, 리뷰) | ✅ 적합 |
| 빠른 프로토타이핑 및 커스터마이징 | ✅ 적합 |
| 복잡한 분기/조건부 로직 | ❌ MCP 권장 |
| 실시간 외부 API 연동 | ❌ MCP 권장 |

### 11.2 핵심 가치

1. **폴더 복사만으로 배포**: 서버 빌드 불필요
2. **텍스트 파일로 디버깅**: 즉시 수정 및 확인 가능
3. **사용자 커스터마이징**: 비개발자도 워크플로우 수정 가능
4. **토큰 효율성**: Progressive Disclosure로 컨텍스트 최적화
