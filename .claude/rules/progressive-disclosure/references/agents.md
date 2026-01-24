# Agents에 Progressive Disclosure 적용

> Claude Code 서브에이전트 시스템 기반 작성 가이드

---

## 1. 디렉토리 구조

```
.claude/agents/           # 프로젝트 레벨
~/.claude/agents/         # 사용자 레벨
<plugin>/agents/          # 플러그인 레벨
```

### 단일 파일 에이전트 (간단한 경우)

```
agents/
├── code-reviewer.md
├── debugger.md
└── data-scientist.md
```

### 디렉토리 에이전트 (복잡한 경우)

```
agents/
└── code-reviewer/
    ├── CLAUDE.md          # 진입점 - 에이전트 개요 (README 역할)
    ├── AGENT.md           # 2단계 - 시스템 프롬프트
    └── references/        # 3단계 - 상세 문서 (온디맨드)
        └── review-criteria.md
```

### 단일 파일 vs 디렉토리 에이전트

| 형식 | 사용 시점 |
|------|----------|
| `agent-name.md` | 간단한 에이전트, 참조 문서 불필요 |
| `agent-name/` | 복잡한 에이전트, 상세 문서나 스크립트 필요 |

### CLAUDE.md vs AGENT.md

| 파일 | 역할 | 로드 시점 |
|------|------|----------|
| `CLAUDE.md` | 진입점 - 에이전트 개요, 사용 시나리오 | 탐색 시 |
| `AGENT.md` | 2단계 - 시스템 프롬프트 (실제 지침) | 호출 시 |

---

## 2. 단계별 내용

### 1단계: 메타데이터 (~100 토큰)

YAML frontmatter의 `name`과 `description` 필드.
Claude가 태스크 위임 시 어떤 에이전트를 사용할지 결정하는 데 사용됩니다.

```yaml
---
name: code-reviewer
description: >
  코드 품질, 보안, 모범 사례를 검토하는 전문가.
  코드 작성/수정 후 사전에 사용.
---
```

### 2단계: 지침 (시스템 프롬프트)

Markdown 본문이 서브에이전트의 시스템 프롬프트가 됩니다.
서브에이전트는 이 프롬프트와 기본 환경 정보만 받으며, 전체 Claude Code 시스템 프롬프트는 받지 않습니다.

**권장 섹션:**
- 역할 정의
- 호출 시 수행할 단계
- 출력 형식

### 3단계: 리소스 (온디맨드)

| 필드 | 용도 |
|------|------|
| `hooks` | PreToolUse, PostToolUse, Stop 훅 |
| `skills` | 시작 시 주입할 스킬 내용 |
| 외부 스크립트 | 훅에서 실행하는 검증 스크립트 |

---

## 3. Frontmatter 스키마

### 필수 필드

| 필드 | 설명 |
|------|------|
| `name` | 고유 식별자 (소문자, 하이픈만) |
| `description` | 언제 위임할지 Claude가 판단하는 기준 |

### 선택 필드

| 필드 | 설명 |
|------|------|
| `tools` | 허용할 도구 목록 (기본: 모두 상속) |
| `disallowedTools` | 거부할 도구 목록 |
| `model` | `sonnet`, `opus`, `haiku`, `inherit` |
| `permissionMode` | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `skills` | 시작 시 주입할 스킬 목록 |
| `hooks` | 에이전트 라이프사이클 훅 |

### 우선순위

```
1. --agents CLI 플래그 (세션 한정)
2. .claude/agents/ (프로젝트)
3. ~/.claude/agents/ (사용자)
4. 플러그인 agents/ (가장 낮음)
```

동일 이름일 경우 높은 우선순위가 적용됩니다.

---

## 4. 작성 가이드라인

### description 작성

```yaml
# 좋은 예 - 언제 사용할지 명확
description: >
  코드 리뷰 전문가. 코드 변경 후 사전에 품질, 보안,
  유지보수성을 검토합니다. 코드 작성/수정 직후 사용.

# 나쁜 예 - 모호함
description: 코드를 검토합니다.
```

**팁**: "사전에 사용" 같은 문구를 포함하면 Claude가 자동으로 위임합니다.

### 도구 제한

```yaml
# 읽기 전용 에이전트
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit

# 특정 도구만 허용
tools: Read, Grep, Glob
```

### 모델 선택

| 모델 | 사용 시점 |
|------|----------|
| `haiku` | 빠른 탐색, 간단한 검색, 비용 효율 |
| `sonnet` | 분석, 리뷰, 균형 잡힌 작업 |
| `opus` | 복잡한 추론, 아키텍처 결정 |
| `inherit` | 메인 대화와 동일 (기본값) |

---

## 5. 훅 구성

### 에이전트 frontmatter 내 훅

에이전트 활성화 시에만 실행:

```yaml
---
name: db-reader
description: 읽기 전용 DB 쿼리 실행
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly.sh"
---
```

### 프로젝트 레벨 훅

settings.json에서 에이전트 이벤트 처리:

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup.sh" }
        ]
      }
    ]
  }
}
```

---

## 6. 스킬 주입

에이전트에 도메인 지식을 사전 로드:

```yaml
---
name: api-developer
description: API 엔드포인트 구현
skills:
  - api-conventions
  - error-handling-patterns
---

API 엔드포인트를 구현합니다. 
사전 로드된 스킬의 컨벤션과 패턴을 따르세요.
```

**참고**: 스킬 전체 내용이 주입되며, 호출 가능하게 만드는 것이 아닙니다.

---

## 7. 실행 모드

### 포그라운드 vs 백그라운드

| 모드 | 동작 |
|------|------|
| 포그라운드 | 완료까지 대기, 권한 프롬프트 전달 |
| 백그라운드 | 동시 실행, 사전 승인된 권한만 사용 |

```
# 백그라운드 실행 요청
"이것을 백그라운드에서 실행해줘"

# 또는 실행 중 Ctrl+B로 백그라운드로 전환
```

### 재개 (Resume)

서브에이전트는 이전 컨텍스트를 유지하며 재개 가능:

```
code-reviewer 에이전트로 인증 모듈을 검토해줘
[에이전트 완료]

이어서 권한 부여 로직도 분석해줘
[이전 컨텍스트를 유지하며 재개]
```

---

## 8. 예제: 완전한 에이전트 구조

```yaml
---
name: code-reviewer
description: >
  코드 리뷰 전문가. 품질, 보안, 유지보수성 검토.
  코드 작성/수정 후 사전에 사용.
tools: Read, Grep, Glob, Bash
model: inherit
---

당신은 높은 코드 품질과 보안 기준을 보장하는 시니어 코드 리뷰어입니다.

호출 시:
1. git diff로 최근 변경 확인
2. 수정된 파일에 집중
3. 즉시 리뷰 시작

리뷰 체크리스트:
- 코드 명확성과 가독성
- 함수/변수 네이밍
- 중복 코드 없음
- 적절한 에러 처리
- 시크릿/API 키 노출 없음
- 입력 검증 구현
- 테스트 커버리지
- 성능 고려사항

피드백 우선순위별 정리:
- 치명적 이슈 (반드시 수정)
- 경고 (수정 권장)
- 제안 (개선 고려)

각 이슈에 대해 구체적인 수정 방법 포함.
```

---

## 9. 체크리스트

에이전트 작성 시 확인:

```
□ description이 언제 위임할지 명확히 설명하는가?
□ 필요한 도구만 허용되었는가?
□ 적절한 모델이 선택되었는가?
□ 시스템 프롬프트가 역할과 단계를 명확히 정의하는가?
□ 부작용 있는 작업에 훅 검증이 있는가?
□ 버전 관리에 체크인되었는가? (프로젝트 에이전트)
```
