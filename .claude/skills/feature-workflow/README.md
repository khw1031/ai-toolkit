# feature-workflow

기능 구현을 5단계(Requirements → Design → Task → Implementation → Review) 워크플로우로 체계적으로 진행합니다. Agent Team 기반 병렬 구현을 지원합니다.

## 주요 기능

- 5단계 체계적 워크플로우: Requirements Analysis → Design & Planning → Task Analysis → Implementation → Review
- Context Isolation: 각 Step은 새 대화에서 실행 권장
- Human in the Loop: 각 단계 후 사용자 확인 절차
- Document as Interface: Step 간 통신은 문서로 수행
- Git as History: 각 Step 완료 시 커밋으로 체크포인트 생성
- Step별 입출력 문서 정의 (00-user-prompt.md → 10-output-plan.md → 20-output-system-design.md 등)
- Agent Team 기반 병렬 구현 (Step 4에서 TeamCreate → TaskCreate → Worker 스폰)
- 규칙 로드 시스템 (assets/rules/AGENTS.md에서 도메인별 규칙 동적 로드)
- 작업 재개 기능 (TASK_ID 언급 시 status.yaml 읽어서 자동 재개)
- 진행 상태 확인 명령어 (task.sh status, task.sh list)

## 사용 방법

- 호출: `/feature-workflow` (또는 트리거 키워드: 워크플로우, 기능 구현, 기능 개발, 작업 재개, TASK-ID 패턴, .ai/tasks)
- 인자: 없음 (대화형 프롬프트로 진행)

## 디렉토리 구조

```
feature-workflow/
├── SKILL.md
├── assets/
│   ├── rules/
│   │   └── AGENTS.md
│   └── templates/
├── references/
│   ├── step-1.md
│   ├── step-2.md
│   ├── step-3.md
│   ├── step-4.md
│   ├── step-5.md
│   ├── team-spawn.md
│   └── resume-guide.md
└── scripts/
    └── task.sh
```
