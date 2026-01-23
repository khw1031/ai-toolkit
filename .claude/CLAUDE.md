# AI Toolkit 프로젝트 가이드

> 이 프로젝트의 핵심 원칙과 규칙 참조 안내

---

## 핵심 원칙: Progressive Disclosure

모든 문서와 규칙은 컨텍스트 효율성을 위해 3단계 로드 원칙을 따릅니다:

1. **메타데이터** (~100 토큰): 항상 로드
2. **지침** (<5000 토큰 권장): 활성화 시 로드
3. **리소스**: 필요시 온디맨드 로드

---

## 규칙 참조

이 프로젝트의 상세 규칙은 `.claude/rules/` 디렉토리에서 모듈식으로 관리됩니다.

### 활성 규칙

| 규칙 | 적용 대상 | 설명 |
|------|----------|------|
| [progressive-disclosure](rules/progressive-disclosure.md) | 전역 | 컨텍스트 효율성 원칙 |
| [skills-authoring](rules/skills-authoring.md) | `**/SKILL.md`, `**/skills/**` | 스킬 작성 규칙 |

### 상세 참조 문서

상세 가이드와 예제는 `.claude/references/` 디렉토리에서 온디맨드로 참조합니다:

- [SKILLS_GUIDE.md](references/SKILLS_GUIDE.md) - 스킬 작성 전체 예제 및 선택 필드 상세

---

## 작업별 규칙 적용

### 스킬 관련 작업 시

SKILL.md 생성, 수정, 검토 시 반드시 `.claude/rules/skills-authoring.md` 규칙을 따르세요.

**핵심 체크리스트**:
- `name`: 1-64자, 소문자/숫자/하이픈만
- `description`: 무엇+언제 명확히 포함
- 본문 500줄 이하 유지
- 상세 내용은 `references/`로 분리

### 새로운 규칙 추가 시

1. `.claude/rules/`에 집중된 규칙 파일 생성
2. YAML frontmatter로 적용 경로 지정 (선택)
3. 이 문서의 "활성 규칙" 테이블 업데이트

---

## 디렉토리 구조

```
.claude/
├── CLAUDE.md              # 이 파일 - 핵심 원칙 및 규칙 참조
├── rules/                 # 모듈식 규칙 (조건부 로드)
│   ├── progressive-disclosure.md
│   └── skills-authoring.md
└── references/            # 상세 문서 (온디맨드 로드)
    └── SKILLS_GUIDE.md
```
