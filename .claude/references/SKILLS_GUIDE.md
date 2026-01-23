# Agent Skills 상세 가이드

> 이 문서는 `.claude/rules/skills-authoring.md`의 상세 참조 문서입니다.

---

## 1. 선택 필드 상세

### license

```yaml
license: Apache-2.0
license: MIT
license: Proprietary. LICENSE.txt 참조
```

### compatibility

| 항목 | 규칙 |
|------|------|
| 길이 | 1-500 글자 |
| 용도 | 환경 요구사항, 필수 도구 명시 |

```yaml
compatibility: Python 3.8+, git, docker 필요
compatibility: Claude Code 전용
compatibility: macOS/Linux만 지원, Windows 미지원
```

### metadata

임의의 키-값 쌍 저장:

```yaml
metadata:
  author: my-team
  version: "2.1.0"
  category: code-quality
  tags: ["git", "automation"]
```

### allowed-tools (실험적)

스킬이 사용할 수 있는 미리 승인된 도구:

```yaml
allowed-tools: Bash(git:*) Bash(npm:*) Read Write Edit
allowed-tools: Bash(python:*) WebFetch
```

---

## 2. 본문 구조 권장

```markdown
# 스킬 제목

## 개요
핵심 기능 요약 (2-3문장)

## 사용 방법
1. 첫 번째 단계
2. 두 번째 단계
3. 세 번째 단계

## 예제

### 기본 사용
입력: ...
출력: ...

### 고급 사용
입력: ...
출력: ...

## 주의사항
- 엣지 케이스 1
- 엣지 케이스 2

## 참고 자료
- [상세 문서](references/REFERENCE.md)
```

---

## 3. 네이밍 컨벤션

### 스킬 이름 패턴

```
[기능]-[대상]
[동작]-[도메인]
[도메인]-[기능]-[버전]
```

**예시**:
- `code-review` - 코드 리뷰
- `pdf-processor` - PDF 처리
- `git-commit-v2` - Git 커밋 (버전 2)

### 파일 이름

| 파일 | 명명 규칙 |
|------|----------|
| 메인 문서 | `SKILL.md` (필수, 대문자) |
| 참조 문서 | `UPPER_SNAKE.md` 또는 `kebab-case.md` |
| 스크립트 | `snake_case.py` 또는 `kebab-case.sh` |

---

## 4. scripts/ 상세 작성 규칙

```python
#!/usr/bin/env python3
"""
스크립트 설명
Usage: python scripts/example.py <arg1> <arg2>
"""

import sys

def main():
    if len(sys.argv) < 2:
        print("Error: 인자가 필요합니다", file=sys.stderr)
        print("Usage: python scripts/example.py <arg>", file=sys.stderr)
        sys.exit(1)
    
    # 로직 구현
    result = process(sys.argv[1])
    print(result)

if __name__ == "__main__":
    main()
```

---

## 5. 전체 예제

### 간단한 스킬

```yaml
---
name: code-formatter
description: >
  코드를 자동으로 포맷팅합니다. 
  "코드 정리", "포맷", "format" 요청 시 사용하세요.
---

# Code Formatter

## 사용 방법

1. 포맷할 파일 또는 디렉토리 지정
2. 언어 자동 감지 후 적절한 포맷터 실행
3. 결과 출력

## 지원 언어

- Python (black)
- JavaScript/TypeScript (prettier)
- Go (gofmt)

## 예제

```bash
# 단일 파일
format src/main.py

# 디렉토리
format src/
```
```

### 복잡한 스킬

```yaml
---
name: api-generator
description: >
  OpenAPI 스펙에서 API 클라이언트 코드를 생성합니다.
  "API 생성", "클라이언트 생성", "OpenAPI" 요청 시 사용하세요.
license: MIT
compatibility: Node.js 18+, openapi-generator-cli 필요
metadata:
  author: dev-team
  version: "1.2.0"
  category: code-generation
allowed-tools: Bash(npx:*) Read Write
---

# API Generator

## 개요

OpenAPI/Swagger 스펙 파일을 분석하여 타입 안전한 API 클라이언트를 생성합니다.

## 사용 방법

1. OpenAPI 스펙 파일 경로 확인
2. 타겟 언어 선택 (typescript, python, go)
3. 생성 스크립트 실행

## 예제

### TypeScript 클라이언트 생성

```bash
python scripts/generate.py spec.yaml --lang typescript --output ./client
```

## 고급 설정

상세 옵션은 [설정 가이드](references/CONFIG.md) 참조

## 문제 해결

[트러블슈팅 가이드](references/TROUBLESHOOTING.md) 참조
```

---

## 6. 버전 관리

스킬 버전 관리 권장사항:

```yaml
metadata:
  version: "1.0.0"  # SemVer 권장
```

| 버전 변경 | 의미 |
|-----------|------|
| MAJOR (1.x.x) | 호환되지 않는 변경 |
| MINOR (x.1.x) | 기능 추가 (하위 호환) |
| PATCH (x.x.1) | 버그 수정 |

---

## 7. 디렉토리별 용도

| 디렉토리 | 용도 | 예시 |
|----------|------|------|
| `scripts/` | 실행 코드 | `extract.py`, `build.sh` |
| `references/` | 상세 문서 | `API.md`, `TROUBLESHOOTING.md` |
| `assets/` | 정적 리소스 | 템플릿, 이미지, 스키마 |

---

## 8. 필드 요약

| 항목 | 필수 | 규칙 |
|------|------|------|
| `name` | ✅ | 1-64자, 소문자/숫자/하이픈 |
| `description` | ✅ | 1-1024자, 무엇+언제 |
| `license` | ❌ | 라이선스 식별자 |
| `compatibility` | ❌ | 1-500자, 환경 요구사항 |
| `metadata` | ❌ | 키-값 쌍 |
| `allowed-tools` | ❌ | 승인된 도구 목록 |
| 본문 | ✅ | < 500줄 권장 |
