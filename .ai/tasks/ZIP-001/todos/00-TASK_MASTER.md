# ZIP-001 TASK MASTER

> ZIP 내보내기 기능 구현을 위한 전체 조율 문서

## INSTRUCTION

### Progressive Disclosure 원칙

각 서브태스크는 **독립적으로 실행 가능**하도록 설계되었습니다.
- 이 문서: 전체 구조, 의존성, 진행 상황 추적
- 개별 TASK.md: 해당 작업의 구현 상세만 포함

### 코딩 컨벤션

- **싱글톤 패턴**: 클래스 정의 후 `export const instance = new Class();`
- **ESM 모듈**: `.js` 확장자 포함하여 import
- **inquirer 패턴**: `type: 'list'` (단일), `type: 'checkbox'` (복수)
- **에러 처리**: `throw new Error('message')`

### 품질 기준

- TypeScript strict mode 통과
- 기존 코드 패턴과 일관성 유지
- 형제 파일 포함 (scripts/, references/, assets/)

### Git 커밋 규칙

```
feat(ZIP-001): <작업 내용>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## 아키텍처 개요

```
index.ts (commander)
    └─ --zip → ZipHandler.run()
                  ├─ ZipPrompt.run()
                  │   ├─ selectDirectories()
                  │   ├─ selectTypes()
                  │   ├─ selectResources()
                  │   └─ confirmExport()
                  └─ ZipExporter.export()
```

## 데이터 흐름

```
User → --zip flag → ZipHandler
                        ↓
                   ZipPrompt → directories[], types[], resources[]
                        ↓
                   ZipExporter → ai-toolkit-export-YYYY-MM-DD.zip
```

---

## 서브태스크 목록

### P0 - Critical (기반 작업)

| ID | 태스크 | 설명 | 병렬 |
|----|--------|------|------|
| 01 | 타입 및 의존성 | archiver 설치, 타입 정의 | O |
| 02 | ZipExporter | ZIP 생성 로직 | O (01 완료 후) |

### P1 - High (핵심 기능)

| ID | 태스크 | 설명 | 병렬 |
|----|--------|------|------|
| 03 | ZipPrompt | 선택 UI 구현 | O (01 완료 후) |
| 04 | ZipHandler + 통합 | 오케스트레이션 + index.ts 수정 | X (02,03 필요) |

### P2 - Medium (마무리)

| ID | 태스크 | 설명 | 병렬 |
|----|--------|------|------|
| 05 | 테스트 및 마무리 | 수동 테스트, 에러 처리 | X (04 필요) |

---

## 의존성 그래프

```
01-타입/의존성
     │
     ├──────┬──────┐
     ▼      ▼      │
02-Exporter  03-Prompt
     │      │
     └──┬───┘
        ▼
   04-Handler+통합
        │
        ▼
   05-테스트/마무리
```

**병렬 실행 가능**:
- 01 완료 후 → 02, 03 동시 실행 가능

---

## 실행 계획

### Phase 1: 기반 (01)

```bash
# 01-TASK 실행
pnpm add archiver
pnpm add -D @types/archiver
# types.ts 수정
```

### Phase 2: 핵심 로직 (02, 03 병렬)

```bash
# 02-TASK, 03-TASK 병렬 실행 가능
```

### Phase 3: 통합 (04)

```bash
# 04-TASK 실행
# ZipHandler 구현 + index.ts 수정
```

### Phase 4: 마무리 (05)

```bash
# 05-TASK 실행
npx ai-toolkit --zip  # 테스트
```

---

## 진행 상황

| 태스크 | 우선순위 | 상태 | 담당자 | 완료일 |
|--------|----------|------|--------|--------|
| 01-타입/의존성 | P0 | pending | - | - |
| 02-ZipExporter | P0 | pending | - | - |
| 03-ZipPrompt | P1 | pending | - | - |
| 04-ZipHandler+통합 | P1 | pending | - | - |
| 05-테스트/마무리 | P2 | pending | - | - |

---

## 체크리스트

### 전체 완료 조건

- [ ] 모든 서브태스크 completed
- [ ] `npx ai-toolkit --zip` 정상 동작
- [ ] `npx ai-toolkit` (기존 플로우) 정상 동작
- [ ] 생성된 ZIP 압축 해제 검증
