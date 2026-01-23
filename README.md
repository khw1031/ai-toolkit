# AI Toolkit

> Skills, Rules, Commands for AI Coding Agents

AI 코딩 에이전트를 위한 재사용 가능한 스킬 모음입니다.

## 설치

```bash
npx ai-toolkit
```

또는 특정 스킬만 설치:

```bash
npx ai-toolkit --skills --source=./skills/workflow-framework
```

## 포함된 스킬

| 스킬 | 설명 |
|------|------|
| [workflow-framework](skills/workflow-framework/) | 커스텀 워크플로우 생성을 위한 프레임워크 |
| [feature-development](skills/feature-development/) | 기능 개발 3단계 워크플로우 (Research → Plan → Implement) |

## 스킬 구조

```
skill-name/
├── SKILL.md           # 스킬 정의 (필수)
├── scripts/           # 실행 스크립트
├── references/        # Step별 상세 가이드
└── assets/
    ├── templates/     # 입출력 템플릿
    └── rules/         # 공유 규칙
```

## 지원 에이전트

- Claude Code
- Cursor
- Cline
- GitHub Copilot
- 그 외 20개 이상의 AI 코딩 에이전트

## 라이선스

MIT
