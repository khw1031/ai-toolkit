# Rule Manager 상세 워크플로우

## 1단계: 요청 분석 상세

### 명확화 질문 템플릿

```markdown
규칙 추가 요청을 이해했습니다. 몇 가지 확인이 필요합니다:

1. **목적**: 이 규칙이 해결하려는 문제는 무엇인가요?
2. **범위**: 모든 파일에 적용되나요, 특정 패턴(예: *.ts, src/**)에만 적용되나요?
3. **트리거**: 언제 이 규칙이 활성화되어야 하나요?
   - 항상 자동으로?
   - 특정 작업(코드 리뷰, 새 파일 생성) 시?
   - 명시적 호출 시에만?
4. **예외**: 규칙이 적용되지 않아야 하는 경우가 있나요?
5. **예시**: 규칙 적용 전/후 예시를 보여주실 수 있나요?
```

### 요청 유형 분류

| 유형 | 특징 | 처리 방법 |
|------|------|----------|
| 명확한 규칙 | 내용, 범위, 트리거 명확 | 바로 구조 분석 |
| 부분 명확 | 일부 정보 누락 | 누락 부분만 질문 |
| 모호한 요청 | "좋은 코드 규칙 추가해줘" | 전체 명확화 필요 |

## 2단계: 구조 분석 상세

### 분석 스크립트

```bash
#!/bin/bash
echo "=== Skills 구조 ==="
find skills -name "SKILL.md" -exec dirname {} \; 2>/dev/null | sort

echo ""
echo "=== Rules 구조 ==="
find . -path "./rules/*" -name "*.md" 2>/dev/null | sort
find . -path "./assets/rules/*" -name "*.md" 2>/dev/null | sort

echo ""
echo "=== 기타 규칙 파일 ==="
find . -name ".cursorrules" -o -name "*.mdc" 2>/dev/null | sort

echo ""
echo "=== Skill별 references 현황 ==="
for skill in skills/*/; do
  count=$(find "$skill/references" -name "*.md" 2>/dev/null | wc -l)
  echo "$skill: $count files"
done
```

### 패턴 분석 체크포인트

```
[ ] skills/ 디렉토리 존재 여부
[ ] 기존 skill의 naming convention
[ ] references/ 사용 패턴
[ ] user-invocable 설정 패턴
[ ] description 작성 스타일
[ ] 규칙 간 계층 구조 (있는 경우)
```

## 3단계: 위치 판단 상세

### 의사결정 트리

```
[규칙 내용 분석]
       │
       ├─ 기존 skill과 80% 이상 관련? ────────┐
       │                                    │
       │                                    ▼
       │                           [기존 skill에 추가]
       │                                    │
       │                           ├─ SKILL.md 500줄 이하?
       │                           │         │
       │                           │    YES: 직접 추가
       │                           │    NO: references/ 분리
       │
       ├─ 새로운 독립 도메인? ──────────────┐
       │                                  │
       │                                  ▼
       │                          [새 skill 생성]
       │                                  │
       │                          └─ skills/{name}/
       │                                  ├─ SKILL.md
       │                                  └─ references/
       │
       └─ 여러 skill에 공통? ───────────────┐
                                          │
                                          ▼
                                  [구조 개선 제안]
                                          │
                                  ├─ 공통 skill 생성
                                  └─ 또는 references 공유
```

### 기존 Skill 추가 판단 기준

| 기준 | 점수 |
|------|------|
| 동일 도메인 | +3 |
| 유사 트리거 조건 | +2 |
| 동일 적용 범위 | +2 |
| 기존 skill 500줄 미만 | +1 |
| description에 언급 가능 | +1 |

**총점 5점 이상: 기존 skill에 추가 권장**

## 4단계: 사용자 확인 상세

### 제안서 템플릿 (기존 추가)

```markdown
## 규칙 추가 제안

### 요청 분석
- **요청 내용**: {user_request}
- **해석**: {interpreted_meaning}

### 규칙 정보
- **규칙 이름**: {rule_name}
- **목적**: {purpose}
- **트리거 조건**: {trigger_conditions}
- **적용 범위**: {scope}

### 위치 결정
- **결정**: 기존 skill에 추가
- **대상**: `skills/{existing_skill}/SKILL.md`
- **판단 근거**:
  - {reason_1}
  - {reason_2}

### 변경 미리보기

**현재 상태** (`skills/{existing_skill}/SKILL.md` 일부):
```yaml
## 기존 섹션
...
```

**변경 후**:
```yaml
## 기존 섹션
...

## 새로 추가되는 섹션: {rule_name}
{new_content}
```

### 영향 분석
- 기존 기능 영향: 없음 / 있음 (설명)
- 충돌 가능성: 없음 / 있음 (설명)

---

이대로 진행할까요?
- **Y**: 진행
- **N**: 취소
- **수정**: 변경 요청 (구체적으로 알려주세요)
```

### 제안서 템플릿 (새 생성)

```markdown
## 규칙 추가 제안

### 요청 분석
- **요청 내용**: {user_request}
- **해석**: {interpreted_meaning}

### 규칙 정보
- **규칙 이름**: {rule_name}
- **목적**: {purpose}
- **트리거 조건**: {trigger_conditions}
- **적용 범위**: {scope}

### 위치 결정
- **결정**: 새 skill 생성
- **경로**: `skills/{new_skill_name}/`
- **판단 근거**:
  - {reason_1}
  - {reason_2}

### 생성될 파일 구조

```
skills/{new_skill_name}/
├── SKILL.md
└── references/
    └── {detail_file}.md (필요시)
```

### SKILL.md 미리보기

```yaml
---
name: {new_skill_name}
description: >
  {description_line_1}
  {description_line_2_with_triggers}
user-invocable: {true/false}
---

# {Title}

{content_preview}
```

---

이대로 진행할까요?
- **Y**: 진행
- **N**: 취소
- **수정**: 변경 요청 (구체적으로 알려주세요)
```

## 5단계: 규칙 추가 상세

### 새 Skill 생성 절차

```bash
# 1. 디렉토리 생성
mkdir -p skills/{name}/references

# 2. SKILL.md 생성
cat > skills/{name}/SKILL.md << 'EOF'
---
name: {name}
description: >
  {description}
---

# {Title}

{content}
EOF

# 3. references 생성 (필요시)
cat > skills/{name}/references/detail.md << 'EOF'
# {Detail Title}

{detailed_content}
EOF
```

### 기존 Skill 수정 절차

```bash
# 1. 현재 내용 확인
cat skills/{name}/SKILL.md

# 2. 줄 수 확인
wc -l skills/{name}/SKILL.md

# 3-A. 500줄 이하면 직접 추가
# Edit skills/{name}/SKILL.md

# 3-B. 500줄 초과 예상시 references 분리
cat > skills/{name}/references/{new_rule}.md << 'EOF'
# {New Rule Title}

{content}
EOF

# SKILL.md에 링크 추가
# ## 상세 가이드 섹션에:
# - [{New Rule}](references/{new_rule}.md)
```

## 롤백 절차

문제 발생 시:

```bash
# Git 사용 시
git checkout -- skills/{name}/

# 수동 백업 사용 시
cp skills/{name}/SKILL.md.backup skills/{name}/SKILL.md
```
