# Step 1: Requirements Analysis 결과

## 1. 요약

CLI의 Interactive 모드를 단순화하고, Agent 선택 우선 방식으로 UX를 개선한다. GitHub/Local/URL 등 다양한 소스 지원을 제거하고 Registry 내부 리소스만 사용하도록 변경한다. Non-interactive 모드를 제거하여 코드 복잡도를 줄인다.

## 2. 기능 정의

### 2.1 기능 목적

- **UX 개선**: Agent 먼저 선택 → 해당 Agent가 지원하는 옵션만 표시하여 혼란 감소
- **단순화**: 복잡한 소스 선택(GitHub/Local/URL/Bitbucket) 제거, Registry 중심으로 통합
- **유지보수성**: Non-interactive 모드 제거로 코드 경로 단순화

### 2.2 대상 사용자

- AI Toolkit CLI를 사용하여 리소스(skills, rules, commands, agents)를 설치하려는 개발자
- Claude Code, Cursor, GitHub Copilot, Gemini CLI, Antigravity, OpenCode 사용자

### 2.3 사용 시나리오

```
현재 플로우:
  type → source → agents → scope → resources → confirm

변경 후 플로우:
  agent → directory → resource_type → resources → confirm

예시:
  1. Agent 선택: claude-code
  2. Directory 선택: common (registry/resources/common/)
  3. Resource Type 선택: skills, rules (claude-code가 지원하는 타입만 표시)
  4. Resources 선택: [체크박스로 선택]
  5. 확인 및 설치
```

## 3. 요구사항 분류

### 3.1 P0 (Critical) - 필수 구현

- [ ] **Interactive 순서 변경**: Agent → Directory → Resource Type → Resources
- [ ] **Agent별 지원 타입 필터링**: 선택된 Agent가 지원하는 resource type만 표시
- [ ] **Registry 전용 모드**: GitHub/Local/URL/Bitbucket resolver 제거, Registry 내부만 사용
- [ ] **Non-interactive 모드 제거**: `runNonInteractive()` 및 관련 로직 제거

### 3.2 P1 (High) - 중요

- [ ] **Agent 지원 타입 매핑**: 4개 Agent × 4개 Type 매핑 + 특수 경로 변환 (instructions, workflows)
- [ ] **Registry 구조 재설계**: `packages/registry/resources/{common,frontend,app}/` 3개 directory 구조
- [ ] **PathResolver CLI 통합**: registry의 PathResolver 로직을 CLI로 통합 (registry는 순수 데이터 저장소)

### 3.3 P2 (Medium) - 추가 기능

- [ ] **설치 결과 표시 개선**: Agent별로 설치된 리소스 요약 표시
- [ ] **중복 처리 단순화**: Registry 전용이므로 중복 시나리오 감소

### 3.4 P3 (Low) - Nice-to-have

- [ ] **Directory 설명 표시**: 각 directory(common, frontend, backend 등)의 설명 표시
- [ ] **최근 설치 히스토리**: 이전에 설치한 리소스 빠른 재설치

## 4. 제약 조건

### 4.1 기술적 제약

- **Agent별 지원 타입 데이터 필요**: 웹 서칭 기반 최신 정보로 `agents.json` 확장 필요
- **Registry 구조 선행 정의 필요**: 1depth directory 구조(common, frontend, backend 등) 확정 필요
- **기존 테스트 코드 수정**: resolver 관련 테스트 제거/수정 필요

### 4.2 비즈니스적 제약

- **하위 호환성 불필요**: 기존 CLI 사용자에게 breaking change 알림
- **Registry/CLI 패키지 경계 결정 필요**: 로직 통합 vs 분리 아키텍처 판단

## 5. 성공 기준

| 기준 | 측정 방법 |
|------|----------|
| Interactive 플로우 완료 | Agent → Directory → Type → Resources → Install 성공 |
| Agent 필터링 동작 | Claude Code: 4개 모두, Cursor: skills/rules/commands, GitHub Copilot: skills/rules, Antigravity: skills/rules/commands |
| 경로 매핑 동작 | GitHub Copilot rules → `.github/instructions/`, Antigravity commands → `.agent/workflows/` (디렉토리 복사) |
| Registry 전용 동작 | Source 선택 옵션 없음 (Registry 내부만 탐색) |
| Non-interactive 코드 제거 | `runNonInteractive()` 관련 코드 0줄 |
| 지원 Agent 제한 | claude-code, cursor, github-copilot, antigravity 4개만 표시 |
| 지원 Type 통일 | skills, rules, commands, agents 4개만 표시 |

## 6. Agent별 지원 리소스 타입 (2026.01 기준)

> **지원 Agent**: claude-code, cursor, github-copilot, antigravity (4개)
> **지원 타입**: skills, rules, commands, agents (4개 - 통일된 UI)

### 6.1 UI 타입 ↔ 실제 설치 경로 매핑 (디렉토리 기반 통일)

| Agent | skills | rules | commands | agents |
|-------|--------|-------|----------|--------|
| **claude-code** | `.claude/skills/` | `.claude/rules/` | `.claude/commands/` | `.claude/agents/` |
| **cursor** | `.cursor/skills/` | `.cursor/rules/` | `.cursor/commands/` | ❌ |
| **github-copilot** | `.github/skills/` | `.github/instructions/`* | ❌ | ❌ |
| **antigravity** | `.agent/skills/` | `.agent/rules/` | `.agent/workflows/`* | ❌ |

> *GitHub Copilot의 rules → `.github/instructions/*.instructions.md` 파일로 설치 (디렉토리 복사)
> *Antigravity의 commands → `.agent/workflows/*.md` 파일로 설치 (디렉토리 복사)

### 6.2 Agent별 지원 타입 요약

| Agent | skills | rules | commands | agents |
|-------|:------:|:-----:|:--------:|:------:|
| **claude-code** | ✅ | ✅ | ✅ | ✅ |
| **cursor** | ✅ | ✅ | ✅ | ❌ |
| **github-copilot** | ✅ | ✅ | ❌ | ❌ |
| **antigravity** | ✅ | ✅ | ✅ | ❌ |

### 6.3 글로벌 경로

| Agent | 글로벌 경로 |
|-------|------------|
| **claude-code** | `~/.claude/` |
| **cursor** | `~/.cursor/` |
| **github-copilot** | `~/.copilot/` |
| **antigravity** | `~/.gemini/antigravity/` |

**Sources**:
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [Cursor Agent Skills](https://cursor.com/docs/context/skills)
- [GitHub Copilot Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [GitHub Copilot Instructions](https://docs.github.com/en/copilot/tutorials/use-custom-instructions)
- [Antigravity Rules & Workflows](https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/)

## 7. 확정된 사항 (사용자 확인 완료)

1. **지원 Agent**: claude-code, cursor, github-copilot, antigravity (4개)
2. **지원 Type**: skills, rules, commands, agents (4개 - 통일된 UI)
3. **Registry 1depth directory**: common, frontend, app (3개)
4. **PathResolver 처리**: CLI로 통합 (registry는 순수 데이터 저장소)
5. **특수 경로 매핑 (디렉토리 복사 방식)**:
   - GitHub Copilot: rules → `.github/instructions/` (*.instructions.md)
   - Antigravity: commands → `.agent/workflows/` (*.md)

## 8. 다음 단계

Step 2에서 고려해야 할 사항:
- Registry 디렉토리 구조 설계 (`packages/registry/resources/{common,frontend,app}/`)
- `agents.json` 스키마 확장:
  - `supportedTypes`: 지원하는 타입 배열
  - `pathMapping`: 특수 경로 변환 (rules→instructions, commands→workflows)
- InteractivePrompt.ts 리팩토링 설계 (Agent → Directory → Type → Resources)
- 제거할 파일 목록 (GitHubResolver, LocalResolver, URLResolver, BitbucketResolver 등)
- PathResolver CLI 통합 설계
- InstallManager 단순화 설계
