# Commands에 Progressive Disclosure 적용

> Slash Commands 작성 가이드 (Skills로 통합됨)

---

## 중요: Skills로 통합

**Custom slash commands가 Skills로 통합되었습니다.**

- `.claude/commands/review.md`와 `.claude/skills/review/SKILL.md`는 동일하게 `/review`를 생성
- 기존 `.claude/commands/` 파일은 계속 작동
- 동일 이름일 경우 **skill이 command보다 우선**
- 새로운 명령은 **Skills 형식 권장**

---

## 1. 디렉토리 구조

### 레거시 Commands 구조

```
.claude/commands/           # 프로젝트 레벨
~/.claude/commands/         # 사용자 레벨
```

단일 Markdown 파일:

```
commands/
├── review.md       → /review
├── fix-issue.md    → /fix-issue
└── deploy.md       → /deploy
```

### 권장 Skills 구조

```
.claude/skills/
├── review/
│   └── SKILL.md    → /review
├── fix-issue/
│   ├── SKILL.md    → /fix-issue
│   └── scripts/
└── deploy/
    ├── SKILL.md    → /deploy
    └── references/
```

---

## 2. 단계별 내용

### 1단계: 메타데이터 (~100 토큰)

| 형식 | 메타데이터 |
|------|-----------|
| Commands | 파일명 → 명령어 이름, 첫 문단 → 설명 |
| Skills | `name`, `description` frontmatter |

### 2단계: 지침

명령 본문 전체. 사용자가 `/명령어`를 입력하면 로드됩니다.

### 3단계: 리소스

| 형식 | 3단계 지원 |
|------|-----------|
| Commands | 지원 안 함 (단일 파일) |
| Skills | scripts/, references/, assets/ 지원 |

---

## 3. Commands 형식 (레거시)

### 기본 구조

```markdown
# 명령어 제목

첫 문단이 설명으로 사용됩니다.

## 지침

Claude가 따를 단계...
```

### 인자 사용

`$ARGUMENTS`로 전체 인자, `$1`, `$2`, `$3`으로 개별 인자 접근:

```markdown
# GitHub 이슈 수정

GitHub 이슈를 수정합니다.

## 지침

1. 이슈 $1 내용 확인
2. 요구사항 분석
3. 수정 구현
4. 테스트 작성
5. 커밋 생성
```

사용: `/fix-issue 123`

---

## 4. Skills 형식 (권장)

### 기본 구조

```yaml
---
name: fix-issue
description: GitHub 이슈를 수정합니다. 이슈 번호를 인자로 받습니다.
argument-hint: "[issue-number]"
disable-model-invocation: true
---

GitHub 이슈 $ARGUMENTS를 우리 코딩 표준에 따라 수정합니다.

1. 이슈 설명 읽기
2. 요구사항 이해
3. 수정 구현
4. 테스트 작성
5. 커밋 생성
```

### Frontmatter 옵션

| 필드 | 용도 |
|------|------|
| `name` | 명령어 이름 (생략 시 디렉토리명) |
| `description` | Claude가 자동 호출할지 판단하는 설명 |
| `argument-hint` | 자동완성 시 표시되는 인자 힌트 |
| `disable-model-invocation` | true면 사용자만 호출 가능 |
| `user-invocable` | false면 Claude만 호출 가능 |
| `allowed-tools` | 허용할 도구 목록 |
| `context` | `fork`면 서브에이전트에서 실행 |

---

## 5. Commands vs Skills 비교

| 기능 | Commands | Skills |
|------|----------|--------|
| 기본 동작 | 동일 | 동일 |
| 인자 지원 | `$ARGUMENTS`, `$1`... | `$ARGUMENTS` |
| 보조 파일 | 지원 안 함 | scripts/, references/, assets/ |
| Claude 자동 호출 | 항상 가능 | frontmatter로 제어 |
| 서브에이전트 실행 | 지원 안 함 | `context: fork` |
| 훅 지원 | 지원 안 함 | `hooks` frontmatter |
| 도구 제한 | 지원 안 함 | `allowed-tools` |

---

## 6. 마이그레이션 가이드

### Commands → Skills 변환

**Before** (`.claude/commands/deploy.md`):

```markdown
# 프로덕션 배포

애플리케이션을 프로덕션에 배포합니다.

1. 테스트 스위트 실행
2. 애플리케이션 빌드
3. 배포 대상에 푸시
```

**After** (`.claude/skills/deploy/SKILL.md`):

```yaml
---
name: deploy
description: 애플리케이션을 프로덕션에 배포합니다.
disable-model-invocation: true
---

애플리케이션을 프로덕션에 배포합니다:

1. 테스트 스위트 실행
2. 애플리케이션 빌드
3. 배포 대상에 푸시
4. 배포 성공 확인
```

### 변환 시 추가 고려사항

- 부작용 있는 명령: `disable-model-invocation: true` 추가
- 검증 스크립트: `scripts/` 디렉토리로 분리
- 상세 문서: `references/` 디렉토리로 분리

---

## 7. 사용 패턴

### 사용자 전용 명령 (부작용 있음)

```yaml
---
name: deploy
description: 프로덕션 배포
disable-model-invocation: true
---
```

### Claude 전용 지식 (백그라운드)

```yaml
---
name: legacy-context
description: 레거시 시스템 작동 방식 설명
user-invocable: false
---
```

### 둘 다 호출 가능 (기본)

```yaml
---
name: explain-code
description: 코드를 다이어그램과 비유로 설명
---
```

---

## 8. 체크리스트

명령 작성 시 확인:

```
□ 새 명령은 Skills 형식을 사용했는가?
□ 부작용 있는 명령에 disable-model-invocation이 있는가?
□ description이 명확하게 언제/무엇을 설명하는가?
□ 인자가 필요하면 argument-hint를 추가했는가?
□ 복잡한 로직은 scripts/로 분리했는가?
□ 상세 문서는 references/로 분리했는가?
```
