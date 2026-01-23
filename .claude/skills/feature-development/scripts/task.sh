#!/bin/bash
# Feature Development - Task Management Script
# Usage: ./task.sh <command> [args]

set -e

TASKS_DIR=".ai/tasks"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 사용법
usage() {
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  init <TICKET_ID>              새 태스크 초기화"
    echo "  status <TICKET_ID>            태스크 상태 확인"
    echo "  list                          모든 태스크 목록"
    echo "  complete <TICKET_ID> <STEP>   단계 완료 처리"
    echo "  commit <TICKET_ID> <MESSAGE>  단계별 커밋"
    echo ""
    echo "Examples:"
    echo "  $0 init TASK-001"
    echo "  $0 status TASK-001"
    echo "  $0 complete TASK-001 step-1-user-plan"
    echo "  $0 commit TASK-001 'user plan 작성 완료'"
    exit 1
}

# 태스크 디렉토리 확인
check_task_exists() {
    local ticket_id="$1"
    if [ ! -d "$TASKS_DIR/$ticket_id" ]; then
        print_error "태스크를 찾을 수 없습니다: $ticket_id"
        exit 1
    fi
}

# init 명령
cmd_init() {
    local ticket_id="$1"
    if [ -z "$ticket_id" ]; then
        print_error "티켓 ID가 필요합니다."
        usage
    fi

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    "$SCRIPT_DIR/init.sh" "$ticket_id"
}

# status 명령
cmd_status() {
    local ticket_id="$1"
    if [ -z "$ticket_id" ]; then
        print_error "티켓 ID가 필요합니다."
        usage
    fi

    check_task_exists "$ticket_id"

    local status_file="$TASKS_DIR/$ticket_id/status.yaml"

    echo ""
    echo -e "${CYAN}=== 태스크 상태: $ticket_id ===${NC}"
    echo ""

    if [ -f "$status_file" ]; then
        cat "$status_file"
    else
        print_warn "status.yaml 파일이 없습니다."
    fi

    echo ""
    echo -e "${CYAN}=== 파일 목록 ===${NC}"
    ls -la "$TASKS_DIR/$ticket_id/"

    # 현재 단계 안내
    echo ""
    if [ -f "$TASKS_DIR/$ticket_id/10-plan.md" ]; then
        echo -e "${GREEN}✓ 10-plan.md 존재 - Implementation 진행 가능${NC}"
    elif [ -f "$TASKS_DIR/$ticket_id/00-user-plan.md" ]; then
        local content_lines=$(wc -l < "$TASKS_DIR/$ticket_id/00-user-plan.md")
        if [ "$content_lines" -gt 20 ]; then
            echo -e "${GREEN}✓ 00-user-plan.md 작성됨 - Research 진행 가능${NC}"
        else
            echo -e "${YELLOW}! 00-user-plan.md 작성 필요${NC}"
        fi
    else
        echo -e "${YELLOW}! 00-user-plan.md 파일 없음${NC}"
    fi
}

# list 명령
cmd_list() {
    echo ""
    echo -e "${CYAN}=== 태스크 목록 ===${NC}"
    echo ""

    if [ ! -d "$TASKS_DIR" ]; then
        print_info "태스크가 없습니다."
        return
    fi

    for dir in "$TASKS_DIR"/*/; do
        if [ -d "$dir" ]; then
            local ticket_id=$(basename "$dir")
            local status_file="$dir/status.yaml"
            local current_step="unknown"

            if [ -f "$status_file" ]; then
                current_step=$(grep "current_step:" "$status_file" | awk '{print $2}' || echo "unknown")
            fi

            echo -e "  ${BLUE}$ticket_id${NC} - Step $current_step"
        fi
    done
    echo ""
}

# complete 명령
cmd_complete() {
    local ticket_id="$1"
    local step="$2"

    if [ -z "$ticket_id" ] || [ -z "$step" ]; then
        print_error "티켓 ID와 단계가 필요합니다."
        usage
    fi

    check_task_exists "$ticket_id"

    local status_file="$TASKS_DIR/$ticket_id/status.yaml"
    local timestamp=$(date -Iseconds)

    # 상태 업데이트 (간단한 sed 사용)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\($step:\)$/\1\n    status: completed\n    completed_at: $timestamp/" "$status_file" 2>/dev/null || true
    else
        # Linux
        sed -i "s/\($step:\)$/\1\n    status: completed\n    completed_at: $timestamp/" "$status_file" 2>/dev/null || true
    fi

    print_success "$step 완료 처리됨"

    # 자동 커밋 제안
    echo ""
    echo "커밋하시겠습니까? 다음 명령어를 실행하세요:"
    echo "  ./scripts/task.sh commit $ticket_id '$step 완료'"
}

# commit 명령
cmd_commit() {
    local ticket_id="$1"
    local message="$2"

    if [ -z "$ticket_id" ] || [ -z "$message" ]; then
        print_error "티켓 ID와 커밋 메시지가 필요합니다."
        usage
    fi

    check_task_exists "$ticket_id"

    # 현재 단계 파악
    local current_step="unknown"
    local status_file="$TASKS_DIR/$ticket_id/status.yaml"
    if [ -f "$status_file" ]; then
        current_step=$(grep "current_step:" "$status_file" | awk '{print $2}' || echo "unknown")
    fi

    # 커밋 메시지 형식: TICKET-MESSAGE-STEP
    local commit_msg="$ticket_id-$message-step$current_step"

    git add .
    git commit -m "$commit_msg"

    print_success "커밋 완료: $commit_msg"
}

# 메인 로직
COMMAND="${1:-}"
shift || true

case "$COMMAND" in
    init)
        cmd_init "$@"
        ;;
    status)
        cmd_status "$@"
        ;;
    list)
        cmd_list "$@"
        ;;
    complete)
        cmd_complete "$@"
        ;;
    commit)
        cmd_commit "$@"
        ;;
    *)
        usage
        ;;
esac
