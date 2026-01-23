#!/bin/bash
# Feature Development - Init Script
# Usage: ./init.sh <TICKET_ID>

set -e

TICKET_ID="${1:-}"
TASKS_DIR=".ai/tasks"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 사용법 출력
usage() {
    echo "Usage: $0 <TICKET_ID>"
    echo ""
    echo "Examples:"
    echo "  $0 TASK-001"
    echo "  $0 FEAT-123"
    exit 1
}

# 티켓 ID 검증
if [ -z "$TICKET_ID" ]; then
    print_error "티켓 ID가 필요합니다."
    usage
fi

# .ai/tasks 디렉토리 생성
if [ ! -d "$TASKS_DIR" ]; then
    mkdir -p "$TASKS_DIR"
    print_info ".ai/tasks 디렉토리 생성됨"
fi

# 중복 검사 및 디렉토리 생성
TASK_DIR="$TASKS_DIR/$TICKET_ID"
if [ -d "$TASK_DIR" ]; then
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    TICKET_ID="${TICKET_ID}-${TIMESTAMP}"
    TASK_DIR="$TASKS_DIR/$TICKET_ID"
    print_warn "중복된 티켓번호. 새 ID: $TICKET_ID"
fi

mkdir -p "$TASK_DIR"
print_info "태스크 디렉토리 생성: $TASK_DIR"

# 템플릿 경로
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$SKILL_DIR/assets/templates"

# user-plan 템플릿 복사
if [ -f "$TEMPLATE_DIR/00-user-plan.md" ]; then
    cp "$TEMPLATE_DIR/00-user-plan.md" "$TASK_DIR/00-user-plan.md"
else
    # 템플릿이 없으면 기본 내용 생성
    cat > "$TASK_DIR/00-user-plan.md" << 'EOF'
# User Plan

> 이 문서에 구현하고자 하는 기능을 작성해주세요.

## 기능 개요

[구현하려는 기능을 간단히 설명해주세요]

## 상세 요구사항

### 기능적 요구사항

- [ ] 요구사항 1
- [ ] 요구사항 2

### UI/UX 요구사항

- [ ] UI 요구사항 1

## 참고 자료

- 관련 디자인:
- 참고 코드:
- 기타:

## 제약 사항

[기술적 제약이나 비즈니스 제약이 있다면 작성해주세요]

---

> **작성 완료 후**: 새 대화에서 "다음 단계" 또는 "research 진행"을 요청하세요.
EOF
fi
print_info "00-user-plan.md 생성됨"

# status.yaml 생성
cat > "$TASK_DIR/status.yaml" << EOF
ticket_id: $TICKET_ID
created_at: $(date -Iseconds)
current_step: 1
steps:
  step-0-init:
    status: completed
    completed_at: $(date -Iseconds)
  step-1-user-plan:
    status: in_progress
    started_at: $(date -Iseconds)
  step-2-research:
    status: pending
  step-3-implement:
    status: pending
  step-4-review:
    status: pending
EOF
print_info "status.yaml 생성됨"

# Git 브랜치 생성
BRANCH_NAME="feat/$TICKET_ID"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [ -n "$CURRENT_BRANCH" ]; then
    # 이미 해당 브랜치가 있는지 확인
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        print_warn "브랜치 '$BRANCH_NAME'가 이미 존재합니다. 해당 브랜치로 이동합니다."
        git checkout "$BRANCH_NAME"
    else
        git checkout -b "$BRANCH_NAME"
        print_success "브랜치 생성 및 이동: $BRANCH_NAME"
    fi
else
    print_warn "Git 저장소가 아니거나 브랜치 정보를 가져올 수 없습니다."
fi

echo ""
print_success "=== 초기화 완료 ==="
echo ""
echo "태스크 디렉토리: $TASK_DIR"
echo "현재 브랜치: $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo ""
echo "다음 단계:"
echo "  1. $TASK_DIR/00-user-plan.md 파일을 작성하세요"
echo "  2. 작성 완료 후 새 대화에서 '다음 단계' 또는 'research 진행'을 요청하세요"
