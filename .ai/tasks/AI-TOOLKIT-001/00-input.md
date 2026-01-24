# 입력

## 1. 기본 정보

### 1.1 제목
AI Toolkit - AI 코딩 에이전트용 Skills/Rules/Commands/Agents 배포 CLI

### 1.2 설명
7개 주요 AI 코딩 에이전트(Claude Code, Cursor, Gemini CLI, GitHub Copilot, Codex, Antigravity, OpenCode)에게 Skills, Rules, Commands, Agents를 일괄 배포하는 CLI 도구.
GitHub, Bitbucket, 로컬 디렉토리, 직접 URL에서 리소스를 가져와 각 에이전트의 프로젝트/전역 경로에 설치.
Turborepo 기반 monorepo로 CLI와 Registry를 분리 관리하며, npx 실행 시 registry 기반으로 동작.

## 2. 요구사항

### 2.1 필수 요구사항
- [ ] 인터랙티브 모드 (npx ai-toolkit)
- [ ] 플래그 모드 (--skills, --rules, --commands, --agents)
- [ ] Source 입력 지원 (GitHub owner/repo, GitHub URL, Bitbucket, 로컬 경로, 직접 URL)
- [ ] Resource 선택 (multi-select)
- [ ] Agent 선택 (7개 에이전트 multi-select)
- [ ] Scope 선택 (project/global)
- [ ] 중복 처리 (skip, overwrite, rename, backup, compare)
- [ ] 일괄 중복 처리 옵션
- [ ] 설치 결과 출력
- [ ] Turborepo monorepo 구조 (CLI + Registry 패키지 분리)
- [ ] TypeScript + pnpm + tsdown 기술 스택

### 2.2 선택 요구사항
- [ ] Compare 기능 (diff 표시)
- [ ] Merge 기능 (수동 병합)
- [ ] CI 환경 자동 감지
- [ ] --yes 플래그 (자동 overwrite)
- [ ] --on-duplicate 플래그

## 3. 제약 조건

- TypeScript + pnpm + tsdown 기술 스택
- Turborepo monorepo 구조
- npx 실행 가능해야 함
- 크로스 플랫폼 지원 (macOS, Linux, Windows)
- 에이전트별 경로 구조 준수
- 파일 시스템 안전성 (백업, 원자적 쓰기)
- Registry 패키지를 통한 zero-config 동작

## 4. 참고 자료

- [CLI-PRD.md](../../../CLI-PRD.md) - 전체 PRD 문서
- 7개 에이전트 경로 매핑 (PRD 3장 참조)
- 중복 처리 전략 (PRD 4장 참조)
