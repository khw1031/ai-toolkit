# add-ai-tools

다양한 소스에서 AI 에이전트 리소스(Skills, Rules, Agents)를 단일 명령으로 설치하는 범용 CLI 도구입니다.

**[English](./README.md)** | **[中文](./README.zh-CN.md)** | **[日本語](./README.ja.md)**

## 개요

`add-ai-tools`는 AI 코딩 어시스턴트 리소스 관리를 단순화합니다. GitHub, Bitbucket 저장소에서 리소스를 가져와 선호하는 AI 에이전트에 맞는 위치에 설치합니다.

### 주요 기능

- **다중 소스 지원** - GitHub, Bitbucket, Git SSH URL에서 설치
- **다중 에이전트 지원** - Claude Code, Cursor, GitHub Copilot, Antigravity 지원
- **대화형 모드** - 쉬운 리소스 선택을 위한 가이드 프롬프트
- **ZIP 내보내기** - 휴대 가능한 ZIP 아카이브로 리소스 내보내기
- **스마트 중복 처리** - 건너뛰기, 덮어쓰기, 이름 변경, 백업, 비교 옵션
- **일괄 설치** - 여러 리소스를 한 번에 설치

## 설치

```bash
# 전역 설치
npm install -g add-ai-tools

# 또는 npx로 직접 사용
npx add-ai-tools
```

## 빠른 시작

### GitHub에서 설치

```bash
# GitHub 축약형 사용
npx add-ai-tools owner/repo

# 전체 GitHub URL 사용
npx add-ai-tools https://github.com/owner/repo

# 특정 경로의 리소스 설치
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/my-skill
```

### 대화형 모드

```bash
npx add-ai-tools
```

대화형 모드는 다음 단계를 안내합니다:
1. AI 에이전트 선택 (Claude Code, Cursor 등)
2. 소스 저장소 입력
3. 리소스 유형 선택 (Skills, Rules, Agents)
4. 설치할 특정 리소스 선택
5. 설치 범위 선택 (프로젝트 또는 전역)

### ZIP으로 내보내기

```bash
# 대화형 프롬프트로 내보내기
npx add-ai-tools owner/repo --zip

# 프롬프트 없이 모든 리소스 내보내기
npx add-ai-tools owner/repo --zip -y
```

## 지원되는 소스

| 형식 | 예시 | 상태 |
|------|------|:----:|
| GitHub 축약형 | `owner/repo` | ✓ |
| GitHub URL | `https://github.com/owner/repo` | ✓ |
| 경로 포함 GitHub URL | `https://github.com/owner/repo/tree/main/skills/my-skill` | ✓ |
| Bitbucket URL | `https://bitbucket.org/workspace/repo` | ✓ |
| Git SSH (GitHub) | `git@github.com:owner/repo.git` | ✓ |
| Git SSH (Bitbucket) | `git@bitbucket.org:owner/repo.git` | ✓ |
| GitLab URL | `https://gitlab.com/owner/repo` | 준비 중 |

## 명령줄 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `[source]` | 저장소 URL 또는 축약형 (선택사항) | - |
| `--agent <agent>` | 대상 에이전트 | `claude-code` |
| `--scope <scope>` | 설치 범위 (`project` 또는 `global`) | `project` |
| `-y, --yes` | 모든 확인 프롬프트 건너뛰기 | `false` |
| `--zip` | 설치 대신 ZIP으로 리소스 내보내기 | `false` |
| `-h, --help` | 도움말 정보 표시 | - |
| `-V, --version` | 버전 번호 표시 | - |

### 사용 가능한 에이전트

- `claude-code` - Claude Code (Anthropic)
- `cursor` - Cursor IDE
- `github-copilot` - GitHub Copilot
- `antigravity` - Antigravity

## 지원 에이전트 및 리소스

| 에이전트 | Skills | Rules | Agents |
|---------|:------:|:-----:|:------:|
| Claude Code | ✓ | ✓ | ✓ |
| Cursor | ✓ | ✓ | - |
| GitHub Copilot | ✓ | ✓ | - |
| Antigravity | ✓ | ✓ | - |

## 설치 경로

리소스는 에이전트별 위치에 설치됩니다:

| 에이전트 | 프로젝트 범위 | 전역 범위 |
|---------|--------------|----------|
| Claude Code | `.claude/skills/`, `.claude/rules/`, `.claude/agents/` | `~/.claude/skills/`, `~/.claude/rules/`, `~/.claude/agents/` |
| Cursor | `.cursor/skills/`, `.cursor/rules/` | `~/.cursor/skills/`, `~/.cursor/rules/` |
| GitHub Copilot | `.github/skills/`, `.github/instructions/` | `~/.copilot/skills/`, `~/.copilot/instructions/` |
| Antigravity | `.agent/skills/`, `.agent/rules/` | `~/.gemini/antigravity/skills/`, `~/.gemini/antigravity/rules/` |

## 리소스 구조

리소스는 표준 구조를 따릅니다:

```
skill-name/
├── SKILL.md           # 메인 스킬 파일 (필수)
├── scripts/           # 실행 가능한 스크립트 (선택)
├── references/        # 참조 문서 (선택)
└── assets/            # 정적 자산 (선택)
```

이 도구는 리소스 설치 시 형제 디렉토리(`scripts/`, `references/`, `assets/`)를 자동으로 처리합니다.

## 중복 처리

목적지에 이미 리소스가 존재할 때 선택할 수 있는 옵션:

| 동작 | 설명 |
|------|------|
| **건너뛰기** | 기존 파일을 변경하지 않고 유지 |
| **덮어쓰기** | 새 버전으로 교체 |
| **이름 변경** | 새 이름으로 저장 (예: `skill-2`, `skill-3`) |
| **백업** | 교체 전 기존 파일의 `.backup` 생성 |
| **비교** | 차이점 비교 후 결정 |

동일한 내용은 자동으로 감지되어 건너뜁니다.

## 예시

```bash
# 인기 저장소에서 모든 리소스 설치
npx add-ai-tools vercel-labs/ai-chatbot

# 전역 범위로 Cursor에 설치
npx add-ai-tools owner/repo --agent cursor --scope global

# 프롬프트 없이 설치 (모든 기본값 수락)
npx add-ai-tools owner/repo -y

# 대화형 모드 - 인자 필요 없음
npx add-ai-tools

# 공유를 위해 리소스를 ZIP으로 내보내기
npx add-ai-tools owner/repo --zip

# 프롬프트 없이 모든 리소스 내보내기
npx add-ai-tools owner/repo --zip -y

# Bitbucket에서 설치
npx add-ai-tools https://bitbucket.org/workspace/repo

# 하위 디렉토리에서 특정 스킬 설치
npx add-ai-tools https://github.com/owner/repo/tree/main/skills/code-review
```

## 작동 방식

1. **소스 파싱** - 입력(축약형, URL, SSH)을 파싱하여 저장소 식별
2. **리소스 가져오기** - Git Trees API를 사용하여 저장소 구조를 효율적으로 가져오기
3. **메타데이터 파싱** - 리소스 파일에서 YAML frontmatter 추출 (이름, 설명 등)
4. **중복 처리** - 기존 리소스 확인 및 필요시 동작 프롬프트
5. **설치** - 올바른 에이전트별 위치에 파일을 원자적으로 쓰기

## 요구 사항

- Node.js 18.0.0 이상
- npm 또는 pnpm

## 기여

기여를 환영합니다! 이슈와 풀 리퀘스트를 자유롭게 제출해 주세요.

## 라이선스

MIT
