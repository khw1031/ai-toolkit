# Step 1: Requirements Analysis 결과

## 1. 요약

AI 코딩 에이전트용 Skills/Rules/Commands/Agents를 일괄 배포하는 CLI 도구 개발. 6개 주요 에이전트(Antigravity, Claude Code, Cursor, Gemini CLI, GitHub Copilot, OpenCode)에 대해 GitHub/Bitbucket/로컬/직접 URL로부터 리소스를 가져와 프로젝트 또는 전역 경로에 설치하며, 중복 처리 전략을 통해 안전하게 배포. Turborepo 기반 monorepo로 CLI와 Registry를 분리 관리.

## 2. 기능 정의

### 2.1 기능 목적

- **문제**: AI 코딩 에이전트마다 Skills/Rules/Commands/Agents 경로가 다르고, 수동 배포 시 실수 발생 가능
- **솔루션**: 단일 CLI로 7개 주요 에이전트에 일괄 배포 자동화, Registry 패키지로 공식 리소스 관리
- **가치**: 개발자가 커뮤니티 리소스를 쉽게 공유/설치하고, 팀 전체에 일관된 설정 배포 가능

### 2.2 대상 사용자

- **Primary**: AI 코딩 에이전트를 사용하는 개발자
- **Secondary**: Skills/Rules 제작자 (배포 편의성)
- **Tertiary**: 팀 리더 (팀 전체 Rules 배포)

### 2.3 사용 시나리오

1. **커뮤니티 Skills 설치**: GitHub에서 유용한 스킬을 발견하고 내 Claude Code, Cursor에 설치
2. **팀 Rules 배포**: 회사 코딩 가이드를 팀원 모두의 에이전트에 배포
3. **로컬 스킬 테스트**: 로컬에서 개발한 스킬을 여러 에이전트에서 테스트
4. **CI/CD 통합**: 프로젝트 초기화 시 자동으로 필수 스킬 설치
5. **Agent 설정 공유**: 팀 전체가 사용하는 에이전트 설정(AGENT.md)을 일괄 배포
6. **Registry 기반 설치**: npx ai-toolkit으로 공식 리소스 카탈로그에서 선택 설치

## 3. 요구사항 분류

### 3.1 P0 (Critical) - 필수 구현

- [ ] CLI 진입점 (npx ai-toolkit)
- [ ] 타입 선택 (Skills/Rules/Commands/Agents)
- [ ] Source 입력 (GitHub owner/repo, Bitbucket, 로컬 경로)
- [ ] Resource 목록 파싱 (SKILL.md, RULES.md, COMMANDS.md, AGENT.md 감지)
- [ ] Resource 선택 (최소 1개 이상)
- [ ] Agent 선택 (6개 목록에서 multi-select)
- [ ] Scope 선택 (project/global)
- [ ] 기본 설치 로직 (파일 복사)
- [ ] 중복 감지 (동일 이름 존재 여부)
- [ ] 중복 처리 - Skip 옵션
- [ ] 중복 처리 - Overwrite 옵션
- [ ] 설치 결과 출력 (성공/실패 개수, 경로)

### 3.2 P1 (High) - 중요

- [ ] GitHub URL 지원 (https://github.com/owner/repo) / Bitbucket URL 지원
- [ ] 중복 처리 - Rename 옵션 (자동 넘버링)
- [ ] 중복 처리 - Backup 옵션 (.backup 생성)
- [ ] 일괄 중복 처리 (Ask each/Skip all/Overwrite all)
- [ ] --skills, --rules, --commands, --agents 플래그
- [ ] --on-duplicate 플래그 (skip/overwrite/rename/backup/fail)
- [ ] 내용 해시 비교 (동일 내용 자동 Skip)
- [ ] 에러 핸들링 (파일 권한, 네트워크 오류 등)

### 3.3 P2 (Medium) - 추가 기능

- [ ] 직접 URL 지원 (https://docs.example.com/skill.md)
- [ ] Compare 기능 (기존 vs 신규 diff)
- [ ] --yes 플래그 (자동 overwrite, 비인터랙티브)
- [ ] CI 환경 자동 감지 (TTY 체크)
- [ ] 설치 로그 파일 생성
- [ ] Resource 메타데이터 표시 (version, author, description)
- [ ] Progress bar (다수 에이전트/리소스 설치 시)

### 3.4 P3 (Low) - Nice-to-have

- [ ] Merge 기능 (수동 병합 에디터 열기)
- [ ] Uninstall 명령어
- [ ] List 명령어 (설치된 리소스 목록)
- [ ] Update 명령어 (최신 버전 확인)
- [ ] 설정 파일 (.ai-toolkit.json)
- [ ] 플러그인 시스템 (커스텀 에이전트 추가)

## 4. 제약 조건

### 4.1 기술적 제약

- **기술 스택**:
  - TypeScript (타입 안전성)
  - pnpm (패키지 관리, monorepo 지원)
  - tsdown (빠른 TypeScript 빌드)
  - Turborepo (monorepo 빌드 오케스트레이션)
- **Node.js 환경**: npx 실행 가능해야 함 (최소 Node 18+)
- **크로스 플랫폼**: macOS, Linux, Windows 모두 지원
- **파일 시스템 안전성**:
  - 원자적 쓰기 (임시 파일 → rename)
  - 백업 생성 시 데이터 손실 방지
- **네트워크 의존성**: GitHub/Bitbucket API rate limit 고려
- **경로 복잡도**: 7개 에이전트별 project/global 경로 매핑 정확성
- **Monorepo 구조**: Turborepo로 CLI와 Registry 패키지 분리 관리

### 4.2 비즈니스적 제약

- **무료 오픈소스**: 외부 유료 서비스 의존 금지
- **배포 방식**: npm registry에 퍼블리시 (npx 실행)
- **유지보수성**: 새 에이전트 추가 시 코드 수정 최소화

## 5. 성공 기준

| 기준 | 측정 방법 |
|------|----------|
| 6개 에이전트 모두 설치 가능 | 각 에이전트별 설치 테스트 통과 |
| GitHub/Bitbucket에서 리소스 가져오기 성공 | public repo에서 SKILL.md 파싱 및 다운로드 |
| 4가지 타입 모두 지원 | Skills/Rules/Commands/Agents 설치 성공 |
| 중복 처리 정확성 | 동일 이름 감지 후 선택한 옵션대로 처리 |
| 크로스 플랫폼 동작 | macOS, Linux, Windows에서 설치 성공 |
| 인터랙티브 UX | 사용자 입력 없이 막히는 구간 없음 |
| 설치 실패 시 명확한 에러 메시지 | 권한 오류, 네트워크 오류 등 구분 |
| 기존 파일 손실 방지 | backup/skip 선택 시 원본 유지 |
| Monorepo 빌드 성공 | Turborepo 파이프라인 통과 |
| npx 즉시 실행 | 별도 설정 없이 npx ai-toolkit 실행 |

## 6. 질문사항 및 결정사항

### 6.1 결정된 사항

1. **디렉토리 구조 보존**: ✅ skill-a 폴더 전체 복사
   - SKILL.md, scripts/, references/, assets/ 모두 포함
   - 완전한 리소스 유지

2. **Agent 미설치 처리**: ✅ 경로 생성 후 설치
   - 에이전트가 없어도 경로만 생성하고 리소스 설치
   - 사용자가 나중에 에이전트 설치 시 바로 사용 가능

3. **Monorepo 아키텍처**: ✅ Turborepo 기반 패키지 분리
   - **@ai-toolkit/cli**: 사용자 인터페이스, 설치 로직
   - **@ai-toolkit/registry**: 7개 에이전트 메타데이터, 공식 리소스 저장소
   - **배포 전략**: npx 실행 시 registry 데이터를 기준으로 복사
   - **장점**: Registry 독립 업데이트, CLI 가볍게 유지, zero-config

4. **리소스 타입 확장**: ✅ Skills/Rules/Commands/Agents 모두 지원
   - AGENT.md 형식 추가 (에이전트별 설정 파일)

5. **기술 스택**: ✅ TypeScript + pnpm + tsdown
   - 타입 안전성, 빠른 빌드, monorepo 최적화

### 6.2 추가 고려사항

1. **Resource 자동 감지**: GitHub repo에서 모든 SKILL.md를 찾을 때 재귀 탐색 깊이 제한이 필요한가?
   - **결정**: 3 depth 제한 (성능과 커버리지 균형)

2. **버전 충돌**: 기존 리소스와 신규 리소스의 버전이 다를 때 (예: v1.0 → v2.0) 자동 판단 기준?
   - **결정**: 무조건 사용자에게 물어보기 (Compare 옵션 제공)

## 7. 다음 단계

Step 2에서 고려해야 할 사항:

### 7.1 Turborepo Monorepo 구조
```
ai-toolkit/
├── packages/
│   ├── cli/              # @ai-toolkit/cli
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   ├── install/
│   │   │   ├── prompts/
│   │   │   └── utils/
│   │   └── package.json
│   └── registry/         # @ai-toolkit/registry
│       ├── agents/       # 6개 에이전트 메타데이터
│       ├── resources/    # 공식 Skills/Rules/Commands/Agents
│       └── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

### 7.2 핵심 모듈 설계
- **CLI 패키지** (@ai-toolkit/cli):
  - CommandHandler (CLI 진입점, 플래그 파싱)
  - SourceResolver (GitHub/Bitbucket/로컬/URL → 파일 목록)
  - ResourceParser (SKILL.md, RULES.md, COMMANDS.md, AGENT.md 파싱)
  - InstallManager (중복 처리, 파일 쓰기)
  - InteractivePrompt (inquirer 기반 UI)

- **Registry 패키지** (@ai-toolkit/registry):
  - AgentRegistry (6개 에이전트 메타데이터 JSON)
  - ResourceCatalog (공식 리소스 색인)
  - PathResolver (에이전트별 경로 매핑 로직)

### 7.3 기술 스택 통합
- **tsdown 설정**: 각 패키지별 빌드 설정
- **pnpm workspace**: 패키지 간 의존성 관리
- **Turborepo pipeline**: 빌드 순서 및 캐싱 전략

### 7.4 npx 실행 전략
- CLI 패키지가 Registry 패키지를 의존성으로 참조
- npx 실행 시 Registry의 agents.json, resources/ 디렉토리 활용
- Zero-config: 사용자 설정 없이 바로 실행 가능

### 7.5 기존 유사 도구 조사
- npm install 중복 처리 방식
- brew install 덮어쓰기 전략
- apt-get conflict resolution
- nx/turborepo monorepo 패턴

### 7.6 테스트 전략
- 각 에이전트별 mock 경로 테스트
- GitHub/Bitbucket API mock (rate limit 시뮬레이션)
- 파일 시스템 권한 에러 시뮬레이션
- Monorepo 빌드 파이프라인 테스트
