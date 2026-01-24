# Step 3: Task Analysis 결과

## 1. 요약

ZIP-001 기능을 5개의 서브태스크로 분해. P0 2개(기반 작업), P1 2개(핵심 기능), P2 1개(마무리)로 구성. 01 완료 후 02, 03 병렬 실행 가능.

## 2. 서브태스크 개요

| ID | 태스크 | 우선순위 | 복잡도 | 예상 LOC |
|----|--------|----------|--------|----------|
| 01 | 타입 정의 및 의존성 설치 | P0 | Low | ~30 |
| 02 | ZipExporter 구현 | P0 | Medium | ~80 |
| 03 | ZipPrompt 구현 | P1 | Medium | ~120 |
| 04 | ZipHandler + Commander 통합 | P1 | Medium | ~100 |
| 05 | 테스트 및 마무리 | P2 | Low | ~30 |

**총 예상 LOC**: ~360

## 3. 의존성 그래프

```
01-타입/의존성 ─────┬──────────┐
                   │          │
                   ▼          ▼
            02-ZipExporter  03-ZipPrompt
                   │          │
                   └────┬─────┘
                        ▼
                04-ZipHandler+통합
                        │
                        ▼
                05-테스트/마무리
```

## 4. 병렬 실행 계획

### Wave 1 (순차)
- 01-타입/의존성

### Wave 2 (병렬 가능)
- 02-ZipExporter
- 03-ZipPrompt

### Wave 3 (순차)
- 04-ZipHandler+통합

### Wave 4 (순차)
- 05-테스트/마무리

## 5. 파일 생성/수정 계획

### 신규 파일

| 파일 | 태스크 |
|------|--------|
| `src/export/ZipExporter.ts` | 02 |
| `src/prompts/ZipPrompt.ts` | 03 |
| `src/commands/ZipHandler.ts` | 04 |

### 수정 파일

| 파일 | 태스크 | 변경 내용 |
|------|--------|----------|
| `src/types.ts` | 01 | ZipResult, ZipPromptResult 추가 |
| `src/index.ts` | 04 | commander 통합, --zip 분기 |
| `package.json` | 01 | archiver 의존성 추가 |

## 6. 생성된 문서

```
.ai/tasks/ZIP-001/todos/
├── 00-TASK_MASTER.md   # 전체 조율 문서
├── 01-TASK.md          # 타입 및 의존성
├── 02-TASK.md          # ZipExporter
├── 03-TASK.md          # ZipPrompt
├── 04-TASK.md          # ZipHandler + 통합
└── 05-TASK.md          # 테스트 및 마무리
```

## 7. 다음 단계

Step 4에서 구현 시:
1. 01-TASK부터 순차 실행
2. 01 완료 후 02, 03 병렬 실행 가능
3. 02, 03 완료 후 04 실행
4. 04 완료 후 05 실행 (최종 테스트)

**권장**: 각 태스크 완료 후 `pnpm build`로 빌드 확인
