# Rules에 Progressive Disclosure 적용

> Claude Code 규칙 시스템 기반 작성 가이드

---

## 1. 디렉토리 구조

```
.claude/
├── CLAUDE.md              # 프로젝트 진입점 - LLM/사용자를 위한 개요
├── rules/                 # 규칙 디렉토리
│   ├── rule-name.md       # 단일 파일 규칙 (간단한 규칙)
│   └── rule-name/         # 디렉토리 규칙 (복잡한 규칙)
│       ├── CLAUDE.md      # 진입점 - 규칙 개요 (README 역할)
│       ├── RULE.md        # 2단계 - 규칙 트리거 시 로드
│       └── references/    # 3단계 - 상세 문서 (온디맨드)
│           └── *.md
└── references/            # 프로젝트 레벨 상세 문서
    └── *.md
```

### 단일 파일 vs 디렉토리 규칙

| 형식 | 사용 시점 |
|------|----------|
| `rule-name.md` | 간단한 규칙, 참조 문서 불필요 |
| `rule-name/` | 복잡한 규칙, 상세 문서나 예제 필요 |

---

## 2. 단계별 내용

### 1단계: 메타데이터 (~100 토큰)

**CLAUDE.md** 또는 규칙 파일의 **description** frontmatter.
에이전트 시작 시 로드되어 규칙 활성화 여부를 결정합니다.

```yaml
---
description: >
  코드 리뷰 시 적용되는 품질 기준.
  PR 리뷰, 코드 검토 요청 시 활성화.
---
```

### 2단계: 지침 (<5000 토큰)

rules/*.md 또는 RULE.md 본문. 조건부로 활성화 시 로드됩니다.

**포함 내용:**
- 핵심 규칙과 원칙
- 필수 체크리스트
- 간결한 예제

### 3단계: 리소스 (온디맨드)

references/*.md 또는 규칙 디렉토리 내 references/.
필요할 때만 명시적으로 로드됩니다.

| 용도 | 예시 |
|------|------|
| 상세 가이드 | `FULL_GUIDE.md` |
| 전체 예제 모음 | `EXAMPLES.md` |
| 도메인별 문서 | `security.md`, `performance.md` |

---

## 3. 규칙 파일 형식

### 단일 파일 규칙

```markdown
---
description: 규칙에 대한 간단한 설명
---

# 규칙 제목

규칙 본문 내용...
```

### 디렉토리 규칙

```
rule-name/
├── CLAUDE.md          # 진입점 (README 역할)
├── RULE.md            # 규칙 본문 (필수)
└── references/        # 상세 문서 (선택)
    └── *.md
```

### paths 조건부 로드

특정 파일/경로 작업 시에만 규칙을 활성화:

```yaml
---
description: SKILL.md 작성 시 적용되는 규칙
paths:
  - "**/SKILL.md"
  - "**/skills/**"
---
```

**paths 패턴:**
- `**/*.ts` - 모든 TypeScript 파일
- `src/components/**` - 특정 디렉토리 하위 전체
- `**/test/**` - 테스트 관련 경로

---

## 4. Frontmatter 스키마

### 필수 필드

| 필드 | 용도 |
|------|------|
| `description` | 규칙 설명 및 활성화 트리거 키워드 |

### 선택 필드

| 필드 | 용도 |
|------|------|
| `paths` | 조건부 활성화 경로 패턴 목록 |
| `alwaysApply` | true면 항상 활성화 (기본: false) |

### description 작성

```yaml
# 좋은 예
description: >
  TypeScript 코드 작성 시 적용되는 타입 안전성 규칙.
  타입 정의, 인터페이스 설계, 제네릭 사용 시 참조.

# 나쁜 예
description: TypeScript 규칙
```

---

## 5. CLAUDE.md 구성

프로젝트의 핵심 진입점으로, 최소한의 정보만 포함:

```markdown
# 프로젝트 가이드

> 프로젝트 핵심 원칙 한 줄 요약

## 핵심 원칙
- 원칙 1
- 원칙 2

## 규칙 참조

| 규칙 | 적용 대상 | 설명 |
|------|----------|------|
| [rule-a](rules/rule-a.md) | `**/*.ts` | TypeScript 규칙 |
| [rule-b](rules/rule-b.md) | `**/test/**` | 테스트 규칙 |

## 상세 문서
- [전체 가이드](references/FULL_GUIDE.md)
```

**핵심:**
- CLAUDE.md는 최소화 (인덱스 역할)
- 상세 내용은 rules/ 또는 references/로 분리
- 규칙 테이블로 빠른 참조 제공

---

## 6. 작성 가이드라인

### 규칙 파일 크기

- **5000 토큰 / 500줄 이하** 유지
- 하나의 관심사에 집중
- 상세 예제는 references/로 분리

### 규칙 분리 원칙

```
# 잘못된 예: 모든 규칙을 하나에
rules/
└── all-rules.md  # 너무 큼

# 올바른 예: 관심사별 분리
rules/
├── typescript.md
├── testing.md
├── security.md
└── performance.md
```

### 참조 경로

- 1단계 깊이 유지
- 순환 참조 피하기
- 상대 경로 사용

```markdown
# 규칙 파일에서
[상세 가이드](../references/FULL_GUIDE.md)

# 또는 규칙 디렉토리 내에서
[상세 가이드](references/DETAIL.md)
```

---

## 7. 예제: 완전한 규칙 구조

### 프로젝트 구조

```
.claude/
├── CLAUDE.md
├── rules/
│   ├── typescript.md
│   ├── testing.md
│   └── progressive-disclosure/
│       ├── CLAUDE.md
│       ├── RULE.md
│       └── references/
│           ├── skills.md
│           └── rules.md
└── references/
    └── ARCHITECTURE.md
```

### CLAUDE.md 예제

```markdown
# 프로젝트 가이드

> 컨텍스트 효율적인 AI 도구 개발

## 핵심 원칙
- Progressive Disclosure 적용
- 타입 안전성 우선
- 테스트 커버리지 유지

## 활성 규칙

| 규칙 | 경로 | 설명 |
|------|------|------|
| [typescript](rules/typescript.md) | `**/*.ts` | 타입 규칙 |
| [testing](rules/testing.md) | `**/test/**` | 테스트 규칙 |
| [progressive-disclosure](rules/progressive-disclosure/) | 전역 | PD 원칙 |
```

### 규칙 파일 예제 (typescript.md)

```yaml
---
description: >
  TypeScript 코드 작성 시 적용되는 규칙.
  타입 정의, 인터페이스, 제네릭 관련 작업 시 활성화.
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript 규칙

## 필수 규칙
- strict 모드 사용
- any 타입 금지
- 명시적 반환 타입

## 상세 정보
[TypeScript 전체 가이드](../references/typescript-guide.md) 참조
```

---

## 8. 체크리스트

규칙 작성 시 확인:

```
□ description이 무엇/언제를 명확히 설명하는가?
□ paths가 적절한 파일에만 활성화되는가?
□ 본문이 5000 토큰 이하인가?
□ 하나의 관심사에 집중하는가?
□ 상세 내용이 references/로 분리되었는가?
□ CLAUDE.md에 규칙이 참조되었는가?
```
