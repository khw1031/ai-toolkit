# create-agent

Claude Code Agent를 생성합니다.

## 주요 기능

- 에이전트 필수 요소 가이드 (name, description)
- description 작성 패턴 (What + When + "Use proactively" 구조)
- 단일 파일(간단) vs 폴더 구조(references 필요) 선택
- Frontmatter 작성 (선택 필드: tools, disallowedTools, model, permissionMode, maxTurns, skills, hooks, mcpServers, memory)
- 도구 제한 패턴 (읽기 전용, 수정 가능, 최소 권한, 스폰 제어 등)
- 모델 선택 가이드 (haiku, sonnet, opus, inherit)
- 생성 단계별 체크리스트

## 사용 방법

- 호출: `/create-agent` (또는 트리거 키워드: 에이전트 생성, AGENT.md 작성, 새 에이전트 만들기)
- 인자: 없음 (대화형 프롬프트로 진행)

## 디렉토리 구조

```
create-agent/
├── SKILL.md
└── references/
    ├── schema.md
    └── templates.md
```
