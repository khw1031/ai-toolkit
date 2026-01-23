# Task 03: CLI 패키지 기반 구조

```yaml
우선순위: P0
복잡도: Low
의존성: 01
차단: 04, 06, 07, 11, 12
```

---

## 목표

`@ai-toolkit/cli` 패키지의 기본 구조와 공통 타입을 생성합니다.

---

## 범위

### 포함 사항

- packages/cli/ 디렉토리 구조 생성
- package.json 생성 (registry 의존성 포함)
- tsconfig.json 생성
- src/types.ts (CLI 전용 타입)
- src/index.ts (진입점)
- bin/ai-toolkit.js (npx 진입점)
- 기본 디렉토리 (commands/, source/, parser/, install/, prompts/, utils/)

### 제외 사항

- 개별 모듈 구현 (Task 04-15에서 진행)
- 의존성 라이브러리 설치 (commander, inquirer 등)

---

## 구현 가이드

### 1. package.json

**위치**: `packages/cli/package.json`

```json
{
  "name": "@ai-toolkit/cli",
  "version": "0.1.0",
  "description": "Universal AI agent resource installer CLI",
  "type": "module",
  "bin": {
    "ai-toolkit": "./bin/ai-toolkit.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "bin"
  ],
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "tsc --noEmit",
    "dev": "node --loader ts-node/esm ./src/index.ts"
  },
  "dependencies": {
    "@ai-toolkit/registry": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

### 2. tsconfig.json

**위치**: `packages/cli/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. src/types.ts

**위치**: `packages/cli/src/types.ts`

```typescript
import type { ResourceType, AgentKey } from '@ai-toolkit/registry';

// Re-export registry types
export type { ResourceType, AgentKey };

/**
 * 중복 처리 전략
 */
export type DuplicateAction =
  | 'skip'
  | 'overwrite'
  | 'rename'
  | 'backup'
  | 'compare'
  | 'fail';

/**
 * CLI 명령 옵션
 */
export interface Command {
  type?: ResourceType;
  source?: string;
  onDuplicate?: DuplicateAction;
  yes?: boolean;
  scope?: 'project' | 'global';
  agents?: AgentKey[];
}

/**
 * 소스 파일 정보
 */
export interface SourceFile {
  path: string;
  content: string;
  isDirectory: boolean;
}

/**
 * 리소스 정보
 */
export interface Resource {
  name: string;
  type: ResourceType;
  description: string;
  path: string;
  content: string;
  metadata: {
    author?: string;
    version?: string;
    license?: string;
    category?: string;
  };
  directory?: {
    files: SourceFile[];
  };
}

/**
 * 중복 감지 정보
 */
export interface DuplicateInfo {
  resourceName: string;
  resourceType: ResourceType;
  existingPath: string;
  existingMeta: {
    createdAt: Date;
    source?: string;
    contentHash: string;
  };
  newMeta: {
    source: string;
    contentHash: string;
  };
  isSameContent: boolean;
}

/**
 * 설치 요청
 */
export interface InstallRequest {
  resource: Resource;
  agent: AgentKey;
  scope: 'project' | 'global';
  onDuplicate: DuplicateAction;
}

/**
 * 설치 결과
 */
export interface InstallResult {
  resourceName: string;
  agent: AgentKey;
  success: boolean;
  action: 'created' | 'skipped' | 'overwritten' | 'renamed' | 'backed-up';
  path: string;
  backupPath?: string;
  renamedTo?: string;
  error?: string;
}
```

### 4. src/index.ts

**위치**: `packages/cli/src/index.ts`

```typescript
#!/usr/bin/env node

/**
 * AI Toolkit CLI
 * Universal AI agent resource installer
 */

export async function main(): Promise<void> {
  console.log('AI Toolkit CLI - Coming soon');
  // CommandHandler will be implemented in Task 04
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
```

### 5. bin/ai-toolkit.js

**위치**: `packages/cli/bin/ai-toolkit.js`

```javascript
#!/usr/bin/env node

import('../dist/index.js')
  .then(({ main }) => main())
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
```

### 6. 디렉토리 구조 생성

**명령어**:

```bash
cd packages/cli
mkdir -p src/commands src/source src/parser src/install src/prompts src/utils
```

---

## 테스트 요구사항

### 빌드 테스트

```bash
# Root에서 실행
pnpm install
pnpm --filter @ai-toolkit/cli build
```

### 진입점 테스트

```bash
node packages/cli/bin/ai-toolkit.js
# "AI Toolkit CLI - Coming soon" 출력 확인
```

---

## 체크리스트

### 구현 전

- [ ] Task 01 완료 확인

### 구현 중

- [ ] package.json 생성 (registry 의존성 포함)
- [ ] tsconfig.json 생성
- [ ] src/types.ts 생성 (모든 타입 정의)
- [ ] src/index.ts 생성
- [ ] bin/ai-toolkit.js 생성 (실행 권한 부여)
- [ ] 디렉토리 구조 생성 (commands/, source/, parser/, install/, prompts/, utils/)

### 구현 후

- [ ] `pnpm install` 성공
- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `node packages/cli/bin/ai-toolkit.js` 실행 가능
- [ ] dist/ 디렉토리 생성 확인
- [ ] dist/index.d.ts 타입 정의 확인

---

## 통합 포인트

### 출력 (Export)

- src/types.ts (Task 04-15에서 사용)
- 디렉토리 구조 (각 모듈 위치 확정)

### 입력 (Import)

- @ai-toolkit/registry (Task 02에서 생성)
- tsconfig.base.json (Task 01에서 생성)

---

## 완료 조건

- [x] packages/cli/ 구조 생성 완료
- [x] 모든 타입 정의 완료
- [x] registry 의존성 설정 완료
- [x] `pnpm turbo build` 성공 (cli 패키지 빌드)
- [x] npx 진입점 동작 확인

---

## Git 커밋

```bash
chmod +x packages/cli/bin/ai-toolkit.js
git add packages/cli/
git commit -m "feat/AI-TOOLKIT-001-[AI]: Add CLI package base structure and types"
```
