# 05-TASK: 테스트 및 마무리

```yaml
우선순위: P2
복잡도: Low
의존성: 04
차단: None
예상 LOC: ~30 (수정)
```

## 목표

전체 기능을 테스트하고 에러 처리를 보완하여 기능을 완성합니다.

## 범위

### 포함

- 수동 테스트 (npx ai-toolkit --zip)
- 생성된 ZIP 검증
- 기존 플로우 회귀 테스트
- 에러 처리 보완 (필요시)

### 제외

- 새 기능 추가 (P2/P3 요구사항은 향후 작업)

## 테스트 시나리오

### 1. ZIP 내보내기 기본 플로우

```bash
cd packages/cli
pnpm build
npx ai-toolkit --zip
```

**예상 동작:**
1. 디렉토리 선택 프롬프트 표시
2. 타입 선택 프롬프트 표시
3. 리소스 선택 프롬프트 표시
4. 확인 프롬프트 표시
5. ZIP 파일 생성
6. 성공 메시지 출력

### 2. ZIP 파일 검증

```bash
# ZIP 파일 생성 확인
ls -la ai-toolkit-export-*.zip

# 압축 해제
unzip -l ai-toolkit-export-*.zip

# 구조 확인
# 예: frontend/skills/my-skill/SKILL.md
```

**예상 구조:**
```
ai-toolkit-export-2026-01-24.zip
├── common/
│   └── skills/
│       └── example-skill/
│           ├── SKILL.md
│           └── scripts/
├── frontend/
│   └── skills/
│       └── react-skill/
│           └── SKILL.md
```

### 3. 기존 플로우 회귀 테스트

```bash
npx ai-toolkit
```

**예상 동작:**
- 기존 설치 플로우 정상 시작
- Agent 선택 → Directory 선택 → ... 플로우 동작

### 4. 취소 테스트

```bash
npx ai-toolkit --zip
# → 확인 프롬프트에서 'n' 선택
```

**예상 동작:**
- "Export cancelled" 메시지 출력
- 에러 없이 종료

### 5. 빈 선택 테스트

```bash
npx ai-toolkit --zip
# → 리소스 0개 선택 시도
```

**예상 동작:**
- "Please select at least one resource" 검증 메시지

## 에러 처리 보완 (필요시)

확인할 사항:
- [ ] 디스크 공간 부족 시 에러 처리
- [ ] 파일 쓰기 권한 없을 때 에러 처리
- [ ] 리소스 읽기 실패 시 에러 처리

**수정 위치** (필요한 경우):
- `ZipExporter.ts`: try-catch 보강
- `ZipHandler.ts`: 에러 메시지 개선

## 체크리스트

### 테스트

- [ ] ZIP 내보내기 기본 플로우 성공
- [ ] 생성된 ZIP 구조 정확
- [ ] 형제 파일 포함 확인
- [ ] 기존 플로우 정상 동작
- [ ] 취소 시 정상 종료
- [ ] 빈 선택 검증 동작

### 마무리

- [ ] 불필요한 console.log 제거
- [ ] 코드 정리
- [ ] Git 커밋

## 완료 후

모든 테스트 통과 시:

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(ZIP-001): Complete ZIP export feature

- Add --zip flag for export mode
- Implement ZipHandler, ZipPrompt, ZipExporter
- Include sibling files (scripts/, references/)
- Preserve directory structure in ZIP

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## 알려진 제한사항

향후 개선 (P2/P3):
- 출력 경로 지정 옵션: `--zip --output ./exports/`
- 커스텀 파일명 옵션: `--zip --name my-package`
- 기존 파일 덮어쓰기 확인
