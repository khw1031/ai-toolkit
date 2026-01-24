# Task Input

## Task ID
ZIP-001

## Description
ai-toolkit CLI에 `--zip` 플래그를 추가하여 선택한 리소스를 ZIP 파일로 내보내는 기능 구현

## User Flow
```
npx ai-toolkit --zip
    ↓
┌─────────────────────────────────────┐
│  1. 디렉토리 선택 (common/frontend/app) │
│  2. 타입 선택 (skills/rules/commands/agents) │
│  3. 리소스 선택 (checkbox)              │
│  4. 확인 → zip 생성                    │
└─────────────────────────────────────┘
    ↓
output: ai-toolkit-export-2026-01-24.zip
```

## Requirements
- [x] `--zip` 플래그로 ZIP 내보내기 모드 진입
- [ ] 디렉토리 선택 (common/frontend/app 중 선택)
- [ ] 타입 선택 (skills/rules/commands/agents)
- [ ] 리소스 multi-select (checkbox)
- [ ] 선택한 리소스를 ZIP 파일로 생성
- [ ] 날짜 기반 파일명: `ai-toolkit-export-YYYY-MM-DD.zip`

## Technical Decisions
- **ZIP 라이브러리**: archiver (사용자 선택)
- **기존 인프라 활용**:
  - commander (이미 설치됨)
  - inquirer (기존 InteractivePrompt 사용)
  - RegistryResolver (리소스 디렉토리 스캔)

## File Structure
| 파일 | 역할 |
|------|------|
| src/index.ts | commander 통합, --zip 플래그 처리 |
| src/commands/ZipHandler.ts | zip 내보내기 워크플로우 오케스트레이션 |
| src/prompts/ZipPrompt.ts | 리소스 선택 프롬프트 |
| src/export/ZipExporter.ts | 실제 zip 생성 로직 |

## Constraints
- 기존 코드 구조 및 패턴 유지
- TypeScript strict mode 준수
