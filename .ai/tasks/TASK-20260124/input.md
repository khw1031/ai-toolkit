# Task Input

## Task ID
TASK-20260124

## Description
CLI Interactive 모드 개선 및 단순화

## Requirements
- [ ] Interactive 적용 순서 변경
  - LLM Agent 먼저 선택
  - 이후 1depth directory 선택 (common, frontend, backend, app 등)
  - 내부에서 skills, rules, commands, agents, tasks 선택 가능
  - 각 agent 모델에 가능한 옵션만 필터링해서 제공
- [ ] Non-interactive 모드 제거
- [ ] 여러 registry 지원 방식 제거 - registry 내부 resource만 사용하도록 변경

## Constraints
- 기존 registry 구조와의 호환성 고려
- Agent 별 지원 가능한 리소스 타입 매핑 필요
