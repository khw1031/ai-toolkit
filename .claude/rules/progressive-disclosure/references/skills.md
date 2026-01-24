# Skills에 Progressive Disclosure 적용

> agentskills.io 명세 기반 스킬 작성 가이드

---

## 1. 디렉토리 구조

```
skill-name/
├── SKILL.md           # 필수 - 2단계 지침
├── scripts/           # 선택 - 3단계 실행 코드
├── references/        # 선택 - 3단계 상세 문서
└── assets/            # 선택 - 3단계 정적 자산
```

---

## 2. 단계별 내용

### 1단계: 메타데이터 (~100 토큰)

YAML frontmatter의 `name`과 `description` 필드. 에이전트 시작 시 모든 스킬에서 로드됩니다.

```yaml
---
name: pdf-processing
description: >
  PDF 파일에서 텍스트/테이블 추출, 폼 작성, 문서 병합.
  PDF 관련 작업 요청 시 사용.
---
```

### 2단계: 지침 (<5000 토큰)

SKILL.md 본문. 스킬 활성화 시 전체 로드됩니다.

**권장 섹션:**
- 단계별 사용 방법
- 입력/출력 예제
- 주요 엣지 케이스

### 3단계: 리소스 (온디맨드)

필요할 때만 로드되는 보조 파일들:

| 디렉토리 | 용도 | 예시 |
|---------|------|------|
| `scripts/` | 실행 가능한 코드 | `extract.py`, `merge.sh` |
| `references/` | 추가 문서 | `REFERENCE.md`, `FORMS.md` |
| `assets/` | 정적 자산 | 템플릿, 이미지, 스키마 |

---

## 3. Frontmatter 스키마

### 필수 필드

| 필드 | 제약 조건 |
|------|----------|
| `name` | 1-64자, 소문자/숫자/하이픈만, 디렉토리명과 일치 |
| `description` | 1-1024자, 무엇을 하는지 + 언제 사용하는지 포함 |

### 선택 필드

| 필드 | 용도 |
|------|------|
| `license` | 라이선스명 또는 라이선스 파일 참조 |
| `compatibility` | 환경 요구사항 (1-500자) |
| `metadata` | 임의의 키-값 매핑 |
| `allowed-tools` | 사전 승인된 도구 목록 (실험적) |

### name 필드 규칙

```yaml
# 유효
name: pdf-processing
name: data-analysis
name: code-review

# 무효
name: PDF-Processing  # 대문자 불가
name: -pdf            # 하이픈으로 시작 불가
name: pdf--processing # 연속 하이픈 불가
```

### description 필드 작성

```yaml
# 좋은 예
description: >
  PDF 파일에서 텍스트와 테이블을 추출하고, 폼을 작성하며, 
  여러 PDF를 병합합니다. PDF 문서 작업이나 사용자가 PDF, 
  폼, 문서 추출을 언급할 때 사용하세요.

# 나쁜 예
description: PDF 관련 작업을 도와줍니다.
```

---

## 4. 파일 참조 규칙

SKILL.md에서 다른 파일 참조 시 상대 경로 사용:

```markdown
자세한 내용은 [레퍼런스 가이드](references/REFERENCE.md)를 참조하세요.

추출 스크립트 실행:
scripts/extract.py
```

**핵심 규칙:**
- 참조 경로는 1단계 깊이 유지
- 깊은 중첩 참조 체인 피하기
- 개별 참조 파일은 집중된 내용으로 유지

---

## 5. 작성 가이드라인

### 본문 크기 제한

- **500줄 이하** 유지
- 상세 레퍼런스는 별도 파일로 분리
- 에이전트가 활성화 시 전체 본문을 로드하므로 간결하게

### scripts/ 디렉토리

- 자체 완결형이거나 의존성을 명확히 문서화
- 유용한 에러 메시지 포함
- 엣지 케이스를 우아하게 처리

### references/ 디렉토리

- 개별 파일을 집중된 주제로 유지
- 에이전트가 온디맨드로 로드하므로 작은 파일이 효율적
- 예: `REFERENCE.md`, `FORMS.md`, `finance.md`

### assets/ 디렉토리

- 템플릿 (문서, 설정)
- 이미지 (다이어그램, 예제)
- 데이터 파일 (룩업 테이블, 스키마)

---

## 6. 검증

skills-ref 라이브러리로 스킬 검증:

```bash
skills-ref validate ./my-skill
```

체크 항목:
- frontmatter 유효성
- 네이밍 컨벤션 준수
- 디렉토리명과 name 필드 일치

---

## 7. 예제: 완전한 스킬 구조

```
pdf-processing/
├── SKILL.md
├── scripts/
│   ├── extract.py
│   └── merge.sh
├── references/
│   ├── REFERENCE.md
│   └── FORMS.md
└── assets/
    └── form-template.pdf
```

**SKILL.md 예제:**

```yaml
---
name: pdf-processing
description: >
  PDF 파일에서 텍스트/테이블 추출, 폼 작성, 문서 병합.
  PDF 관련 작업 요청 시 사용.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---

# PDF Processing

PDF 문서 작업을 위한 스킬입니다.

## 사용 방법

1. 추출: `scripts/extract.py <input.pdf>`
2. 병합: `scripts/merge.sh <file1.pdf> <file2.pdf>`

## 상세 정보

- [기술 레퍼런스](references/REFERENCE.md)
- [폼 템플릿 가이드](references/FORMS.md)
```

---

## 8. 체크리스트

스킬 작성 시 확인:

```
□ name이 1-64자, 소문자/숫자/하이픈만 사용하는가?
□ name이 디렉토리명과 일치하는가?
□ description이 무엇+언제를 명확히 설명하는가?
□ SKILL.md 본문이 500줄 이하인가?
□ 상세 내용이 references/로 분리되었는가?
□ scripts/가 자체 완결형이거나 의존성이 문서화되었는가?
□ 파일 참조가 1단계 깊이인가?
```
