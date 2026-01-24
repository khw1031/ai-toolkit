# Step 1: Requirements Analysis 결과

## 1. 요약

ai-toolkit CLI에 `--zip` 플래그를 추가하여 registry 리소스를 선택적으로 ZIP 파일로 내보내는 기능. 기존 InteractivePrompt 패턴을 재사용하여 디렉토리 → 타입 → 리소스 순으로 선택 후 `archiver` 라이브러리로 ZIP 생성.

## 2. 기능 정의

### 2.1 기능 목적

- 선택한 리소스를 다른 프로젝트나 팀에 공유하기 위한 휴대용 패키지 생성
- 오프라인 환경에서 리소스 배포 가능
- 특정 리소스 조합을 백업 용도로 저장

### 2.2 대상 사용자

- ai-toolkit 리소스를 팀원에게 공유하려는 개발자
- 커스텀 리소스 패키지를 만들어 배포하려는 사용자
- 리소스 백업이 필요한 사용자

### 2.3 사용 시나리오

```
# 시나리오 1: 팀 공유
npx ai-toolkit --zip
→ frontend 디렉토리에서 skills 3개 선택
→ ai-toolkit-export-2026-01-24.zip 생성
→ Slack/Email로 팀원에게 전달

# 시나리오 2: 프로젝트 이관
npx ai-toolkit --zip
→ common/frontend/app 모든 디렉토리에서 필요한 리소스 선택
→ 새 프로젝트에서 압축 해제 후 사용
```

## 3. 요구사항 분류

### 3.1 P0 (Critical) - 필수 구현

- [ ] `--zip` 플래그 인식 및 ZIP 모드 진입
- [ ] 디렉토리 선택 (common/frontend/app - 복수 선택 가능)
- [ ] 타입 선택 (skills/rules/commands/agents - 복수 선택)
- [ ] 리소스 목록 표시 및 checkbox 선택
- [ ] 선택된 리소스를 ZIP 파일로 압축
- [ ] 날짜 기반 파일명: `ai-toolkit-export-YYYY-MM-DD.zip`

### 3.2 P1 (High) - 중요

- [ ] 선택 요약 및 확인 프롬프트
- [ ] 진행률 표시 (기존 Logger.startProgress 활용)
- [ ] 성공/실패 메시지 출력

### 3.3 P2 (Medium) - 추가 기능

- [ ] 출력 경로 지정 옵션: `--zip --output ./exports/`
- [ ] 형제 파일 포함 옵션: `--zip --include-siblings`

### 3.4 P3 (Low) - Nice-to-have

- [ ] 커스텀 파일명 옵션: `--zip --name my-package`
- [ ] 기존 파일 덮어쓰기 확인

## 4. 제약 조건

### 4.1 기술적 제약

- 기존 싱글톤 패턴 유지 (CommandHandler, InteractivePrompt 등)
- TypeScript strict mode 준수
- 기존 inquirer 패턴과 일관성 유지
- ESM 모듈 시스템 호환

### 4.2 비즈니스적 제약

- P0/P1 우선 구현, P2/P3는 향후 확장으로 남김
- 기존 설치 플로우(기본 모드)에 영향 없어야 함

## 5. 성공 기준

| 기준 | 측정 방법 |
|------|----------|
| `--zip` 플래그로 ZIP 모드 진입 | `npx ai-toolkit --zip` 실행 시 ZIP 선택 플로우 시작 |
| 리소스 선택 가능 | 3개 이상 리소스 선택 후 ZIP 생성 성공 |
| 유효한 ZIP 생성 | 생성된 ZIP 파일 압축 해제 시 원본과 동일한 구조 |
| 기존 기능 무영향 | `npx ai-toolkit` (플래그 없음) 기존 설치 플로우 정상 동작 |

## 6. 질문사항 (해결됨)

| 질문 | 결정 |
|------|------|
| ZIP 라이브러리 | `archiver` |
| 형제 파일 포함 | **기본 포함** (scripts/, references/, assets/) |
| ZIP 내부 구조 | **전체 경로 유지** (frontend/skills/my-skill/)

## 7. 다음 단계

Step 2에서 고려해야 할 사항:
- 기존 InteractivePrompt 확장 vs 별도 ZipPrompt 생성 결정
- ZipHandler와 기존 CommandHandler의 관계 (위임 vs 분기)
- archiver 라이브러리 통합 방식
- ZIP 내부 디렉토리 구조 설계
