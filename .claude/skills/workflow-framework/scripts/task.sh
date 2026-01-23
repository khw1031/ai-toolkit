#!/bin/bash
# task.sh - Task lifecycle management for workflow skills
set -e

COMMAND=${1:-help}
TASK_ID=$2
STEP_ID=$3
FLAG=$4

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_NAME="$(basename "$SKILL_DIR")"
TASKS_BASE=".ai/tasks"
TASK_DIR="$TASKS_BASE/$TASK_ID"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
  cat << EOF
${BLUE}task.sh${NC} - Task lifecycle management

${YELLOW}Usage:${NC}
  task.sh <command> [options]

${YELLOW}Commands:${NC}
  ${GREEN}init${NC} <TASK_ID>                    Create new task
  ${GREEN}status${NC} <TASK_ID>                  Show task status
  ${GREEN}list${NC}                              List all tasks
  ${GREEN}complete${NC} <TASK_ID> <STEP> [--finish]  Mark step as completed
  ${GREEN}help${NC}                              Show this help

${YELLOW}Examples:${NC}
  ./scripts/task.sh init PROJ-001
  ./scripts/task.sh status PROJ-001
  ./scripts/task.sh complete PROJ-001 step-1
  ./scripts/task.sh complete PROJ-001 step-3 --finish

${YELLOW}Task Directory:${NC}
  $TASKS_BASE/<TASK_ID>/
  ├── status.yaml      # Task status
  ├── input.md         # User input
  └── output-*.md      # Step outputs
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

warn() {
  echo -e "${YELLOW}$1${NC}"
}

# Get current timestamp in ISO 8601 format
timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Count steps from SKILL.md (looks for "## Step N:" pattern)
count_steps() {
  if [ -f "$SKILL_DIR/SKILL.md" ]; then
    grep -c "^## Step [0-9]" "$SKILL_DIR/SKILL.md" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

# Generate steps YAML based on step count
generate_steps_yaml() {
  local step_count=$1
  local indent="  "

  for i in $(seq 1 "$step_count"); do
    echo "${indent}step-$i:"
    echo "${indent}  status: pending"
  done
}

cmd_init() {
  [ -z "$TASK_ID" ] && error "TASK_ID required\nUsage: task.sh init <TASK_ID>"

  # Check if task already exists
  if [ -d "$TASK_DIR" ]; then
    warn "Task $TASK_ID already exists at $TASK_DIR"
    read -p "Overwrite? (y/N): " confirm
    [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && exit 0
    rm -rf "$TASK_DIR"
  fi

  mkdir -p "$TASK_DIR"

  # Count steps from SKILL.md
  local step_count
  step_count=$(count_steps)
  [ "$step_count" -eq 0 ] && step_count=3  # Default to 3 steps

  # Create status.yaml
  cat > "$TASK_DIR/status.yaml" << EOF
task_id: $TASK_ID
workflow: $SKILL_NAME
status: running
current_step: step-1
created_at: $(timestamp)
updated_at: $(timestamp)
steps:
$(generate_steps_yaml "$step_count")
EOF

  # Copy input template if exists
  if [ -f "$SKILL_DIR/assets/templates/input.md" ]; then
    cp "$SKILL_DIR/assets/templates/input.md" "$TASK_DIR/input.md"
    info "Input template copied"
  else
    # Create minimal input file
    cat > "$TASK_DIR/input.md" << EOF
# Task Input

## Task ID
$TASK_ID

## Description
<!-- Describe what you want to accomplish -->

## Requirements
- [ ]

## Constraints
<!-- Any limitations or requirements -->
EOF
  fi

  success "Task $TASK_ID created"
  echo ""
  info "Next steps:"
  echo "  1. Edit: $TASK_DIR/input.md"
  echo "  2. Start Step 1"
  echo "  3. Complete: ./scripts/task.sh complete $TASK_ID step-1"
}

cmd_status() {
  [ -z "$TASK_ID" ] && error "TASK_ID required\nUsage: task.sh status <TASK_ID>"
  [ ! -f "$TASK_DIR/status.yaml" ] && error "Task $TASK_ID not found"

  echo ""
  info "Task: $TASK_ID"
  echo "─────────────────────────────────"
  cat "$TASK_DIR/status.yaml"
  echo ""

  # List output files
  info "Files:"
  ls -la "$TASK_DIR/" 2>/dev/null | grep -v "^total" | grep -v "^d" || echo "  (none)"
}

cmd_list() {
  echo ""
  info "Tasks in $TASKS_BASE/"
  echo "─────────────────────────────────"

  if [ ! -d "$TASKS_BASE" ]; then
    echo "  (no tasks found)"
    return
  fi

  local found=0
  for dir in "$TASKS_BASE"/*/; do
    if [ -f "$dir/status.yaml" ]; then
      found=1
      local task_id
      task_id=$(basename "$dir")
      local status
      status=$(grep "^status:" "$dir/status.yaml" | cut -d' ' -f2)
      local current_step
      current_step=$(grep "^current_step:" "$dir/status.yaml" | cut -d' ' -f2)
      local workflow
      workflow=$(grep "^workflow:" "$dir/status.yaml" | cut -d' ' -f2)

      case "$status" in
        completed) echo -e "  ${GREEN}$task_id${NC} [$workflow] - $status" ;;
        running)   echo -e "  ${YELLOW}$task_id${NC} [$workflow] - $status ($current_step)" ;;
        failed)    echo -e "  ${RED}$task_id${NC} [$workflow] - $status" ;;
        *)         echo "  $task_id [$workflow] - $status" ;;
      esac
    fi
  done

  [ "$found" -eq 0 ] && echo "  (no tasks found)"
  echo ""
}

cmd_complete() {
  [ -z "$TASK_ID" ] && error "TASK_ID required"
  [ -z "$STEP_ID" ] && error "STEP_ID required\nUsage: task.sh complete <TASK_ID> <STEP>"
  [ ! -f "$TASK_DIR/status.yaml" ] && error "Task $TASK_ID not found"

  local now
  now=$(timestamp)

  # Update status.yaml using sed (portable approach)
  # Update the step status
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/updated_at:.*/updated_at: $now/" "$TASK_DIR/status.yaml"
    sed -i '' "/$STEP_ID:/,/status:/{s/status: pending/status: completed/;s/status: in_progress/status: completed/;}" "$TASK_DIR/status.yaml"
  else
    # Linux
    sed -i "s/updated_at:.*/updated_at: $now/" "$TASK_DIR/status.yaml"
    sed -i "/$STEP_ID:/,/status:/{s/status: pending/status: completed/;s/status: in_progress/status: completed/;}" "$TASK_DIR/status.yaml"
  fi

  success "Step $STEP_ID completed"

  if [ "$FLAG" = "--finish" ]; then
    # Mark task as completed
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/^status: running/status: completed/" "$TASK_DIR/status.yaml"
    else
      sed -i "s/^status: running/status: completed/" "$TASK_DIR/status.yaml"
    fi
    echo ""
    success "Workflow completed!"
    echo ""
    info "Task outputs:"
    ls "$TASK_DIR/"*.md 2>/dev/null || echo "  (none)"
  else
    # Find next step
    local step_num
    step_num=$(echo "$STEP_ID" | grep -o '[0-9]*')
    local next_step="step-$((step_num + 1))"

    # Update current_step
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/current_step:.*/current_step: $next_step/" "$TASK_DIR/status.yaml"
      sed -i '' "/$next_step:/,/status:/{s/status: pending/status: in_progress/;}" "$TASK_DIR/status.yaml"
    else
      sed -i "s/current_step:.*/current_step: $next_step/" "$TASK_DIR/status.yaml"
      sed -i "/$next_step:/,/status:/{s/status: pending/status: in_progress/;}" "$TASK_DIR/status.yaml"
    fi

    echo ""
    info "Next: $next_step"
    warn "Recommended: Start a new conversation for the next step"
  fi
}

# Main
case "$COMMAND" in
  init)     cmd_init ;;
  status)   cmd_status ;;
  list)     cmd_list ;;
  complete) cmd_complete ;;
  help|--help|-h) show_help ;;
  *)
    error "Unknown command: $COMMAND"
    show_help
    ;;
esac
