# Task 16: CI/CD 및 npm 배포

```yaml
우선순위: P2
복잡도: Low
의존성: All
차단: None
```

---

## 목표

GitHub Actions CI/CD 설정 및 npm 패키지 배포를 완료합니다.

---

## 범위

### 포함 사항

- GitHub Actions workflow (테스트, 빌드)
- npm publish workflow
- package.json 설정 (공개 패키지)
- README.md 업데이트
- CHANGELOG.md 생성
- License 파일

### 제외 사항

- 추가 기능 구현
- 문서 웹사이트 (향후 구현)

---

## 구현 가이드

### 1. .github/workflows/ci.yml

**위치**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm turbo lint

      - name: Build
        run: pnpm turbo build

      - name: Test
        run: pnpm turbo test

  typecheck:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm turbo build --dry-run
```

### 2. .github/workflows/publish.yml

**위치**: `.github/workflows/publish.yml`

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm turbo build

      - name: Publish @ai-toolkit/cli
        working-directory: packages/cli
        run: pnpm publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish @ai-toolkit/registry
        working-directory: packages/registry
        run: pnpm publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 3. packages/cli/package.json 업데이트

**위치**: `packages/cli/package.json`

```json
{
  "name": "@ai-toolkit/cli",
  "version": "0.1.0",
  "description": "Universal AI agent resource installer",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "ai-toolkit": "bin/ai-toolkit.js"
  },
  "files": [
    "dist",
    "bin",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "lint": "eslint src --ext .ts",
    "dev": "tsc --watch"
  },
  "keywords": [
    "ai",
    "agent",
    "claude",
    "cursor",
    "copilot",
    "cli",
    "installer"
  ],
  "author": "AI Toolkit Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/ai-toolkit.git",
    "directory": "packages/cli"
  },
  "bugs": {
    "url": "https://github.com/your-org/ai-toolkit/issues"
  },
  "homepage": "https://github.com/your-org/ai-toolkit#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. packages/registry/package.json 업데이트

**위치**: `packages/registry/package.json`

```json
{
  "name": "@ai-toolkit/registry",
  "version": "0.1.0",
  "description": "Agent registry for AI Toolkit",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "data",
    "resources",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "lint": "eslint src --ext .ts"
  },
  "keywords": [
    "ai",
    "agent",
    "registry"
  ],
  "author": "AI Toolkit Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/ai-toolkit.git",
    "directory": "packages/registry"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 5. README.md

**위치**: `/Users/hynu/Projects/ai-toolkit/README.md`

```markdown
# AI Toolkit

Universal AI agent resource installer for Claude Code, Cursor, GitHub Copilot, and more.

## Features

- 🤖 **Multi-Agent Support**: Install resources for 6+ AI agents
- 📦 **Multiple Sources**: GitHub, Bitbucket, local directories, direct URLs
- 🔄 **Smart Duplicate Handling**: Skip, Overwrite, Rename, Backup, Compare
- 🎯 **Resource Types**: Skills, Rules, Commands, Agents
- 🌍 **Project & Global**: Install to project or user home directory
- 🎨 **Interactive & CLI**: Both interactive prompts and command-line flags

## Supported Agents

- Claude Code
- Cursor
- GitHub Copilot
- Antigravity
- Gemini CLI
- OpenCode

## Installation

```bash
npm install -g @ai-toolkit/cli
# or
npx @ai-toolkit/cli
```

## Usage

### Interactive Mode

```bash
ai-toolkit
```

### CLI Mode

```bash
# Install skills from GitHub
ai-toolkit --skills --source=owner/repo --agents=claude-code,cursor --scope=project

# Install rules with auto-overwrite
ai-toolkit --rules --source=./local-rules --agents=claude-code --scope=global --yes

# Install from URL
ai-toolkit --skills --source=https://raw.githubusercontent.com/owner/repo/main/SKILL.md
```

## Options

- `--skills` - Install skills
- `--rules` - Install rules
- `--commands` - Install commands
- `--agents-resource` - Install agents
- `--source <source>` - Source (GitHub owner/repo, local path, URL)
- `--agents <agents>` - Comma-separated agent list
- `--scope <scope>` - Install scope (project|global)
- `--on-duplicate <action>` - Duplicate handling (skip|overwrite|rename|backup|fail)
- `--yes` - Auto overwrite (non-interactive)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm turbo build

# Run tests
pnpm turbo test

# Development mode
pnpm turbo dev
```

## Monorepo Structure

```
ai-toolkit/
├── packages/
│   ├── cli/           # @ai-toolkit/cli
│   └── registry/      # @ai-toolkit/registry
```

## License

MIT
```

### 6. CHANGELOG.md

**위치**: `/Users/hynu/Projects/ai-toolkit/CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-01-XX

### Added

- Initial release
- Multi-agent support (Claude Code, Cursor, GitHub Copilot, Antigravity, Gemini CLI, OpenCode)
- Multiple source support (GitHub, Bitbucket, Local, URL)
- Duplicate handling (Skip, Overwrite, Rename, Backup, Compare)
- Interactive and CLI modes
- Progress display and result summary
```

### 7. LICENSE

**위치**: `/Users/hynu/Projects/ai-toolkit/LICENSE`

```
MIT License

Copyright (c) 2024 AI Toolkit Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 테스트 요구사항

### GitHub Actions 검증

1. **로컬 테스트**:
   ```bash
   # act로 로컬 GitHub Actions 테스트 (선택)
   act push -j test
   ```

2. **실제 Push**:
   ```bash
   git push origin main
   # GitHub에서 CI workflow 확인
   ```

### npm 배포 검증

1. **Dry-run**:
   ```bash
   cd packages/cli
   pnpm publish --dry-run
   ```

2. **실제 배포** (GitHub Release 생성 시 자동):
   - GitHub에서 Release 생성
   - Publish workflow 자동 실행
   - npm에서 패키지 확인

---

## 체크리스트

### 구현 전

- [ ] 모든 Task (01-15) 완료 확인
- [ ] npm 계정 생성 및 NPM_TOKEN 발급

### 구현 중

- [ ] .github/workflows/ci.yml 생성
- [ ] .github/workflows/publish.yml 생성
- [ ] package.json 업데이트 (cli, registry)
- [ ] README.md 작성
- [ ] CHANGELOG.md 작성
- [ ] LICENSE 추가
- [ ] GitHub Secrets에 NPM_TOKEN 추가

### 구현 후

- [ ] GitHub Actions CI 성공
- [ ] 테스트 커버리지 확인
- [ ] README.md 검토
- [ ] npm publish dry-run 성공

---

## 통합 포인트

### 출력 (Export)

- npm 패키지: @ai-toolkit/cli, @ai-toolkit/registry

### 입력 (Import)

- 모든 Task (01-15)

---

## 완료 조건

- [x] GitHub Actions CI workflow 동작
- [x] GitHub Actions publish workflow 설정
- [x] package.json 메타데이터 완료
- [x] README.md 작성 완료
- [x] CHANGELOG.md 작성 완료
- [x] LICENSE 추가 완료
- [x] npm publish 준비 완료

---

## Git 커밋

```bash
git add .github/workflows/ packages/*/package.json README.md CHANGELOG.md LICENSE
git commit -m "feat/AI-TOOLKIT-001-[AI]: Add CI/CD workflows and prepare npm publish"
```

---

## npm 배포 절차

### 1. 로컬 빌드 및 테스트

```bash
pnpm turbo build
pnpm turbo test
```

### 2. 버전 업데이트

```bash
# Root package.json과 각 패키지 버전 업데이트
pnpm version 0.1.0 -r
```

### 3. GitHub Release 생성

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 4. GitHub에서 Release 생성

- Releases → Create new release
- Tag: v0.1.0
- Title: v0.1.0 - Initial Release
- Description: CHANGELOG.md 내용 복사
- Publish release

### 5. npm 배포 확인

```bash
# 배포 후 확인
npm view @ai-toolkit/cli
npx @ai-toolkit/cli --help
```

---

## 완료 후: TASK_MASTER 업데이트

**중요**: 이 작업 완료 후 반드시 `.ai/tasks/AI-TOOLKIT-001/todos/00-TASK_MASTER.md`의 진행 상황을 업데이트하세요.

**업데이트 항목**:
- [ ] 해당 서브태스크의 상태를 `✅ completed`로 변경
- [ ] 최근 업데이트 테이블에 완료 날짜 추가
- [ ] Phase 진행률 업데이트
