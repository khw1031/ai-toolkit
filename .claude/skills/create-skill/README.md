# create-skill

Claude Code Skill을 생성합니다.

## 주요 기능

- Progressive Disclosure 핵심 설명 (3단계 정보 로드: Discovery → Activation → Execution)
- 스킬 디렉토리 구조 가이드 (SKILL.md, references/, scripts/, assets/)
- 필수 요소 정의 (name, description)
- description 작성 패턴 (무엇+언제 구조)
- 단계별 생성 절차 (디렉토리 생성 → Frontmatter 작성 → 본문 작성 → 검증)
- 본문 작성 기준 (500줄 이하, 핵심만 포함, 상세는 references/로 분리)
- 선택 필드 가이드 (argument-hint, disable-model-invocation, user-invocable, context, agent, allowed-tools)
- 사용 패턴 (일반 스킬, 사용자 전용, Claude 전용, 격리 실행)
- 파일 참조 규칙 (상대 경로, 1단계 깊이)
- 생성 완료 후 검증 체크리스트

## 사용 방법

- 호출: `/create-skill` (또는 트리거 키워드: 스킬 생성, SKILL.md 작성, 새 스킬 만들기)
- 인자: 없음 (대화형 프롬프트로 진행)

## 디렉토리 구조

```
create-skill/
├── SKILL.md
└── references/
    ├── schema.md
    ├── templates.md
    ├── body-guide.md
    └── validation.md
```
