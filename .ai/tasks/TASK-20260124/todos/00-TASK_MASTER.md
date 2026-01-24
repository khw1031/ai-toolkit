# TASK_MASTER: Interactive Mode Refactor

## INSTRUCTION

### Progressive Disclosure 원칙

각 서브태스크는 **독립적으로 실행 가능**해야 합니다:
- 이 TASK_MASTER는 전체 구조와 의존성만 제공
- 개별 TASK.md는 해당 작업의 구현 상세만 포함
- 전체 설계 문서를 다시 읽지 않아도 됨

### 코딩 컨벤션

- **언어**: TypeScript (ESM)
- **스타일**: Class 기반, async/await
- **파일명**: PascalCase (예: `PathResolver.ts`)
- **타입**: 명시적 타입 선언, `any` 금지
- **에러**: throw new Error() with 명확한 메시지

### 품질 기준

- [ ] TypeScript strict mode 통과
- [ ] 기존 패턴 준수 (Resolver, Handler, Prompt 패턴)
- [ ] 의미 있는 함수/변수명
- [ ] 필요시 JSDoc 주석

### Git 커밋 규칙

```
feat/TASK-20260124-[AI]: <간략한 설명>
```

---

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                      CommandHandler                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              InteractivePrompt (새 플로우)           │   │
│  │  Agent → Directory → Type → Resources → Confirm     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RegistryResolver (신규)                  │
│  - Registry 내부 디렉토리/리소스 탐색                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PathResolver (CLI로 이동)                  │
│  - Agent별 설치 경로 해석                                   │
│  - 특수 경로 매핑                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     InstallManager                          │
│  - 설치 실행 (기존 유지)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 서브태스크 목록

### P0 - Critical (기반)

| ID | 태스크 | 파일 | 의존성 |
|----|--------|------|--------|
| 01 | 타입 정의 및 agents.json 확장 | `types.ts`, `agents.json` | None |
| 02 | Registry 디렉토리 구조 생성 | `resources/` | None |

### P1 - High (핵심)

| ID | 태스크 | 파일 | 의존성 |
|----|--------|------|--------|
| 03 | PathResolver CLI 이동 | `path/PathResolver.ts` | 01 |
| 04 | RegistryResolver 구현 | `source/RegistryResolver.ts` | 01, 02 |
| 05 | InteractivePrompt 리팩토링 | `prompts/InteractivePrompt.ts` | 01, 03, 04 |
| 06 | CommandHandler 단순화 | `commands/CommandHandler.ts` | 03, 05 |

### P2 - Medium (정리)

| ID | 태스크 | 파일 | 의존성 |
|----|--------|------|--------|
| 07 | 레거시 코드 제거 | `source/*.ts` (제거) | 06 |
| 08 | 테스트 및 문서화 | `*.test.ts`, `README.md` | 07 |

---

## 의존성 그래프

```
     ┌────┐    ┌────┐
     │ 01 │    │ 02 │   ← Wave 1 (병렬)
     └──┬─┘    └─┬──┘
        │        │
   ┌────┼────────┤
   │    │        │
   ▼    ▼        ▼
┌────┐ ┌────────────┐
│ 03 │ │     04     │   ← Wave 2 (병렬)
└──┬─┘ └─────┬──────┘
   │         │
   └────┬────┘
        │
        ▼
     ┌────┐
     │ 05 │   ← Wave 3
     └──┬─┘
        │
        ▼
     ┌────┐
     │ 06 │
     └──┬─┘
        │
        ▼
     ┌────┐
     │ 07 │   ← Wave 4
     └──┬─┘
        │
        ▼
     ┌────┐
     │ 08 │
     └────┘
```

---

## 실행 계획

### Wave 1: 기반 작업
```bash
# 병렬 실행 가능
- 01-TASK.md: 타입 정의
- 02-TASK.md: 디렉토리 구조
```

### Wave 2: 핵심 로직 A
```bash
# Wave 1 완료 후, 병렬 실행 가능
- 03-TASK.md: PathResolver
- 04-TASK.md: RegistryResolver
```

### Wave 3: 핵심 로직 B
```bash
# Wave 2 완료 후, 순차 실행
- 05-TASK.md: InteractivePrompt
- 06-TASK.md: CommandHandler
```

### Wave 4: 정리
```bash
# Wave 3 완료 후, 순차 실행
- 07-TASK.md: 레거시 제거
- 08-TASK.md: 테스트/문서화
```

---

## 진행 상황

| 태스크 | 우선순위 | 상태 | 담당자 | 완료일 |
|--------|----------|------|--------|--------|
| 01-TASK | P0 | pending | - | - |
| 02-TASK | P0 | pending | - | - |
| 03-TASK | P1 | pending | - | - |
| 04-TASK | P1 | pending | - | - |
| 05-TASK | P1 | pending | - | - |
| 06-TASK | P1 | pending | - | - |
| 07-TASK | P2 | pending | - | - |
| 08-TASK | P2 | pending | - | - |

---

## 공통 참조

### Agent 지원 타입

| Agent | skills | rules | commands | agents |
|-------|:------:|:-----:|:--------:|:------:|
| claude-code | O | O | O | O |
| cursor | O | O | O | X |
| github-copilot | O | O | X | X |
| antigravity | O | O | O | X |

### 특수 경로 매핑

- `github-copilot` rules → `.github/instructions/`
- `antigravity` commands → `.agent/workflows/`

### Registry 디렉토리

```
packages/registry/resources/
├── common/
├── frontend/
└── app/
```
