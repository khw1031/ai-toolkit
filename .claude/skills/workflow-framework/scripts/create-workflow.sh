#!/bin/bash
# create-workflow.sh - Generate a new workflow skill from template
set -e

WORKFLOW_NAME=$1
STEP_COUNT=${2:-3}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
  cat << EOF
${BLUE}create-workflow.sh${NC} - Generate a new workflow skill

${YELLOW}Usage:${NC}
  create-workflow.sh <workflow-name> [step-count]

${YELLOW}Arguments:${NC}
  workflow-name    Name of the workflow (lowercase, hyphens allowed)
  step-count       Number of steps (default: 3)

${YELLOW}Examples:${NC}
  ./create-workflow.sh bug-fix 3
  ./create-workflow.sh code-review 2
  ./create-workflow.sh feature-development 3

${YELLOW}Output:${NC}
  Creates a complete workflow skill directory:
  workflow-name/
  ├── SKILL.md
  ├── scripts/task.sh
  ├── references/step-*.md
  └── assets/templates/*.md
EOF
}

error() {
  echo -e "${RED}Error:${NC} $1" >&2
  exit 1
}

success() {
  echo -e "${GREEN}$1${NC}"
}

info() {
  echo -e "${BLUE}$1${NC}"
}

# Validate workflow name
validate_name() {
  local name=$1
  if [[ ! "$name" =~ ^[a-z][a-z0-9-]*$ ]]; then
    error "Invalid workflow name: '$name'\nMust start with lowercase letter, contain only lowercase letters, numbers, and hyphens"
  fi
  if [ ${#name} -gt 64 ]; then
    error "Workflow name too long (max 64 characters)"
  fi
}

# Convert kebab-case to Title Case
to_title_case() {
  echo "$1" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1'
}

# Main
if [ -z "$WORKFLOW_NAME" ] || [ "$WORKFLOW_NAME" = "help" ] || [ "$WORKFLOW_NAME" = "--help" ]; then
  show_help
  exit 0
fi

validate_name "$WORKFLOW_NAME"

if [ -d "$WORKFLOW_NAME" ]; then
  error "Directory '$WORKFLOW_NAME' already exists"
fi

WORKFLOW_TITLE=$(to_title_case "$WORKFLOW_NAME")

info "Creating workflow: $WORKFLOW_NAME ($STEP_COUNT steps)"
echo ""

# Create directory structure
mkdir -p "$WORKFLOW_NAME"/{scripts,references,assets/{templates,rules}}

# ============================================================================
# SKILL.md
# ============================================================================
cat > "$WORKFLOW_NAME/SKILL.md" << EOF
---
name: $WORKFLOW_NAME
description: |
  [워크플로우 설명을 입력하세요]
  사용 시점: "[트리거 키워드1]", "[트리거 키워드2]"
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
allowed-tools: Bash Read Write Edit
---

# $WORKFLOW_TITLE

[워크플로우에 대한 간단한 설명]

## 핵심 원칙

1. **Context Isolation**: 각 Step은 새 대화에서 실행 권장
2. **Human in the Loop**: 사용자 입력 확인 후 진행
3. **Document as Interface**: Step 간 통신은 문서로 수행

## 워크플로우 개요

| Step | 역할 | 입력 | 출력 | 상세 |
|------|------|------|------|------|
$(for i in $(seq 1 $STEP_COUNT); do
  if [ $i -eq 1 ]; then
    echo "| $i. [Step $i 이름] | [역할] | input.md | output-step-$i.md | [references/step-$i.md](references/step-$i.md) |"
  else
    echo "| $i. [Step $i 이름] | [역할] | output-step-$((i-1)).md | output-step-$i.md | [references/step-$i.md](references/step-$i.md) |"
  fi
done)

---

## Task 시작

1. **Task ID 결정**: 사용자에게 요청 (예: \`PROJ-001\`)
2. **Task 초기화**: \`./scripts/task.sh init <TASK_ID>\`
3. **입력 작성**: \`.ai/tasks/<TASK_ID>/input.md\` 편집

---
$(for i in $(seq 1 $STEP_COUNT); do
cat << STEP

## Step $i: [Step 이름]

**역할**: [역할명]
**목표**: [이 Step의 목표]

### 참조 자료
- 상세 가이드: [references/step-$i.md](references/step-$i.md)
- 출력 템플릿: [assets/templates/output-step-$i.md](assets/templates/output-step-$i.md)

### 입출력
- **입력**: \`.ai/tasks/<TASK_ID>/$([ $i -eq 1 ] && echo "input.md" || echo "output-step-$((i-1)).md")\`
- **출력**: \`.ai/tasks/<TASK_ID>/output-step-$i.md\`

### 완료 조건
- [ ] [체크리스트 항목 1]
- [ ] [체크리스트 항목 2]

**완료 후**: \`./scripts/task.sh complete <TASK_ID> step-$i$([ $i -eq $STEP_COUNT ] && echo " --finish")\`

> **다음 Step은 새 대화에서 진행 권장**

---
STEP
done)

## 진행 상태 확인

\`\`\`bash
./scripts/task.sh status <TASK_ID>
./scripts/task.sh list
\`\`\`
EOF

echo "  Created: $WORKFLOW_NAME/SKILL.md"

# ============================================================================
# scripts/task.sh (copy from workflow-framework)
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/task.sh" ]; then
  cp "$SCRIPT_DIR/task.sh" "$WORKFLOW_NAME/scripts/task.sh"
  chmod +x "$WORKFLOW_NAME/scripts/task.sh"
  echo "  Created: $WORKFLOW_NAME/scripts/task.sh"
else
  # Create minimal task.sh if template not found
  cat > "$WORKFLOW_NAME/scripts/task.sh" << 'TASKSH'
#!/bin/bash
set -e
COMMAND=${1:-help}
TASK_ID=$2
STEP_ID=$3
FLAG=$4

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_NAME="$(basename "$SKILL_DIR")"
TASK_DIR=".ai/tasks/$TASK_ID"

case "$COMMAND" in
  init)
    [ -z "$TASK_ID" ] && echo "Error: TASK_ID required" && exit 1
    mkdir -p "$TASK_DIR"
    cat > "$TASK_DIR/status.yaml" << EOF
task_id: $TASK_ID
workflow: $SKILL_NAME
status: running
current_step: step-1
created_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
    [ -f "$SKILL_DIR/assets/templates/input.md" ] && cp "$SKILL_DIR/assets/templates/input.md" "$TASK_DIR/input.md"
    echo "Task $TASK_ID created"
    ;;
  status)
    [ -f "$TASK_DIR/status.yaml" ] && cat "$TASK_DIR/status.yaml" || echo "Task not found"
    ;;
  list)
    for dir in .ai/tasks/*/; do [ -f "$dir/status.yaml" ] && echo "$(basename "$dir")"; done
    ;;
  complete)
    echo "Step $STEP_ID completed"
    [ "$FLAG" = "--finish" ] && echo "Workflow completed!"
    ;;
  *) echo "Usage: task.sh {init|status|list|complete} [TASK_ID] [STEP_ID]" ;;
esac
TASKSH
  chmod +x "$WORKFLOW_NAME/scripts/task.sh"
  echo "  Created: $WORKFLOW_NAME/scripts/task.sh (minimal)"
fi

# ============================================================================
# references/step-*.md
# ============================================================================
for i in $(seq 1 $STEP_COUNT); do
cat > "$WORKFLOW_NAME/references/step-$i.md" << EOF
# Step $i 상세 가이드

> **Context Isolation**
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

[assets/templates/output-step-$i.md](../assets/templates/output-step-$i.md) 형식을 따르세요.
EOF
echo "  Created: $WORKFLOW_NAME/references/step-$i.md"
done

# ============================================================================
# assets/templates/input.md
# ============================================================================
cat > "$WORKFLOW_NAME/assets/templates/input.md" << 'EOF'
# 입력

## 1. 기본 정보

### 1.1 제목
<!-- 작업 제목 -->

### 1.2 설명
<!-- 상세 설명 -->

## 2. 요구사항

### 2.1 필수 요구사항
- [ ]

### 2.2 선택 요구사항
- [ ]

## 3. 제약 조건

<!-- 기술적/비즈니스적 제약 -->

## 4. 참고 자료

<!-- 관련 문서, 링크 -->
EOF
echo "  Created: $WORKFLOW_NAME/assets/templates/input.md"

# ============================================================================
# assets/templates/output-step-*.md
# ============================================================================
for i in $(seq 1 $STEP_COUNT); do
cat > "$WORKFLOW_NAME/assets/templates/output-step-$i.md" << EOF
# Step $i 결과

## 1. 요약

<!-- 핵심 결과 요약 -->

## 2. 상세 내용

### 2.1 [섹션 1]

### 2.2 [섹션 2]

## 3. 검증 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| [체크항목 1] | [ ] | |
| [체크항목 2] | [ ] | |

## 4. 다음 단계

<!-- 다음 Step을 위한 권장사항 -->
EOF
echo "  Created: $WORKFLOW_NAME/assets/templates/output-step-$i.md"
done

# ============================================================================
# assets/rules/general.md
# ============================================================================
cat > "$WORKFLOW_NAME/assets/rules/general.md" << 'EOF'
# 일반 규칙

> 적용 대상: 전체 워크플로우

## 원칙

1. 명확한 문서화: 모든 결정과 이유를 기록
2. 점진적 진행: 작은 단위로 검증하며 진행
3. 사용자 확인: 중요 결정 전 사용자 승인

## 체크리스트

- [ ] 입력 파일을 완전히 읽었는가
- [ ] 요구사항을 이해했는가
- [ ] 출력 형식을 따랐는가

## 예외 사항

- 긴급한 경우 사용자 판단에 따라 Step 건너뛰기 가능
EOF
echo "  Created: $WORKFLOW_NAME/assets/rules/general.md"

# ============================================================================
# metadata.json
# ============================================================================
cat > "$WORKFLOW_NAME/metadata.json" << EOF
{
  "name": "$WORKFLOW_NAME",
  "version": "1.0.0",
  "description": "Custom workflow skill",
  "steps": $STEP_COUNT,
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
echo "  Created: $WORKFLOW_NAME/metadata.json"

echo ""
success "Workflow '$WORKFLOW_NAME' created successfully!"
echo ""
info "Next steps:"
echo "  1. Edit SKILL.md to define your workflow"
echo "  2. Update references/step-*.md with detailed guides"
echo "  3. Customize templates in assets/templates/"
echo "  4. Test with: cd $WORKFLOW_NAME && ./scripts/task.sh init TEST-001"
