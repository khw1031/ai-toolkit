# Task 09: InstallManager 기본 구현

```yaml
우선순위: P0
복잡도: Medium
의존성: 05, 08
차단: 13, 14, 15, 16
```

---

## 목표

리소스 설치 및 기본 중복 처리 (Skip, Overwrite)를 수행하는 InstallManager를 구현합니다.

---

## 범위

### 포함 사항

- InstallManager 클래스
- 중복 감지 로직 (파일 존재 여부 + 해시 비교)
- Skip, Overwrite 중복 처리
- FileWriter (원자적 파일 쓰기)
- 해시 유틸리티 (SHA-256)
- 단위 테스트

### 제외 사항

- Rename, Backup, Compare 처리 (Task 13, 14)
- 일괄 처리 (Task 14)
- Logger 및 진행 표시 (Task 15)

---

## 구현 가이드

### 1. src/utils/hash.ts

**위치**: `packages/cli/src/utils/hash.ts`

```typescript
import { createHash } from 'crypto';

/**
 * Calculate SHA-256 hash of content
 */
export function calculateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Check if two contents are identical
 */
export function isSameContent(content1: string, content2: string): boolean {
  return calculateHash(content1) === calculateHash(content2);
}
```

### 2. src/utils/fs-safe.ts

**위치**: `packages/cli/src/utils/fs-safe.ts`

```typescript
import { writeFile, rename, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

/**
 * Atomic file write
 * Write to temp file first, then rename (atomic operation)
 */
export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  const tempFile = join(dir, `.${randomBytes(8).toString('hex')}.tmp`);

  try {
    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write to temp file
    await writeFile(tempFile, content, 'utf-8');

    // Atomic rename
    await rename(tempFile, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await rename(tempFile, tempFile + '.failed');
    } catch {}
    throw error;
  }
}
```

### 3. src/install/InstallManager.ts

**위치**: `packages/cli/src/install/InstallManager.ts`

```typescript
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PathResolver } from '@ai-toolkit/registry';
import { atomicWrite } from '../utils/fs-safe';
import { isSameContent } from '../utils/hash';
import type { AgentKey, ResourceType, Resource } from '../types';

export interface InstallRequest {
  resource: Resource;
  agent: AgentKey;
  scope: 'project' | 'global';
  onDuplicate: 'skip' | 'overwrite' | 'rename' | 'backup' | 'compare' | 'fail';
}

export interface InstallResult {
  resourceName: string;
  agent: AgentKey;
  success: boolean;
  action: 'created' | 'skipped' | 'overwritten' | 'renamed' | 'backed-up' | 'failed';
  path: string;
  backupPath?: string;
  renamedTo?: string;
  error?: string;
}

interface DuplicateInfo {
  resourceName: string;
  path: string;
  existingContent: string;
  newContent: string;
  isSameContent: boolean;
}

export class InstallManager {
  private pathResolver: PathResolver;

  constructor() {
    this.pathResolver = new PathResolver();
  }

  /**
   * Install resources
   */
  async install(requests: InstallRequest[]): Promise<InstallResult[]> {
    const results: InstallResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.installOne(request);
        results.push(result);
      } catch (error: any) {
        results.push({
          resourceName: request.resource.name,
          agent: request.agent,
          success: false,
          action: 'failed',
          path: '',
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Install single resource
   */
  private async installOne(request: InstallRequest): Promise<InstallResult> {
    const targetPath = this.resolveTargetPath(
      request.resource,
      request.agent,
      request.scope
    );

    const duplicate = await this.checkDuplicate(targetPath, request.resource.content);

    // Auto-skip if content is identical
    if (duplicate && duplicate.isSameContent) {
      return {
        resourceName: request.resource.name,
        agent: request.agent,
        success: true,
        action: 'skipped',
        path: targetPath,
      };
    }

    // Handle duplicate
    if (duplicate) {
      return await this.handleDuplicate(request, duplicate, targetPath);
    }

    // Create new file
    await atomicWrite(targetPath, request.resource.content);

    return {
      resourceName: request.resource.name,
      agent: request.agent,
      success: true,
      action: 'created',
      path: targetPath,
    };
  }

  /**
   * Resolve target installation path
   */
  private resolveTargetPath(
    resource: Resource,
    agent: AgentKey,
    scope: 'project' | 'global'
  ): string {
    const basePath = this.pathResolver.resolveAgentPath(agent, resource.type, scope);
    const filename = this.getResourceFilename(resource.type);

    // If resource has a specific directory name, use it
    return join(basePath, resource.name, filename);
  }

  /**
   * Get resource filename
   */
  private getResourceFilename(type: ResourceType): string {
    const filenames: Record<ResourceType, string> = {
      skill: 'SKILL.md',
      rule: 'RULES.md',
      command: 'COMMANDS.md',
      agent: 'AGENT.md',
    };
    return filenames[type];
  }

  /**
   * Check if file exists and get duplicate info
   */
  private async checkDuplicate(
    path: string,
    newContent: string
  ): Promise<DuplicateInfo | null> {
    if (!existsSync(path)) {
      return null;
    }

    try {
      const existingContent = await readFile(path, 'utf-8');
      return {
        resourceName: path.split('/').slice(-2, -1)[0], // Extract directory name
        path,
        existingContent,
        newContent,
        isSameContent: isSameContent(existingContent, newContent),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle duplicate file
   */
  private async handleDuplicate(
    request: InstallRequest,
    duplicate: DuplicateInfo,
    targetPath: string
  ): Promise<InstallResult> {
    const { onDuplicate } = request;

    switch (onDuplicate) {
      case 'skip':
        return {
          resourceName: request.resource.name,
          agent: request.agent,
          success: true,
          action: 'skipped',
          path: targetPath,
        };

      case 'overwrite':
        await atomicWrite(targetPath, request.resource.content);
        return {
          resourceName: request.resource.name,
          agent: request.agent,
          success: true,
          action: 'overwritten',
          path: targetPath,
        };

      case 'fail':
        throw new Error(`File already exists: ${targetPath}`);

      case 'rename':
      case 'backup':
      case 'compare':
        // Will be implemented in Task 13, 14
        throw new Error(`${onDuplicate} is not implemented yet (Task 13, 14)`);

      default:
        throw new Error(`Unknown duplicate action: ${onDuplicate}`);
    }
  }
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/install/InstallManager.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InstallManager } from './InstallManager';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { InstallRequest, Resource } from '../types';

describe('InstallManager', () => {
  const testDir = join(tmpdir(), 'ai-toolkit-install-test');
  const manager = new InstallManager();

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('install', () => {
    it('should create new file', async () => {
      const resource: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test skill',
        path: 'test/SKILL.md',
        content: '---\nname: test-skill\n---\nTest',
        metadata: {},
      };

      const request: InstallRequest = {
        resource,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      const results = await manager.install([request]);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].action).toBe('created');
    });

    it('should skip duplicate with same content', async () => {
      const content = '---\nname: test\n---\nTest';
      const resource: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content,
        metadata: {},
      };

      const request: InstallRequest = {
        resource,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      // Install first time
      await manager.install([request]);

      // Install second time (same content)
      const results = await manager.install([request]);

      expect(results[0].action).toBe('skipped');
    });

    it('should skip duplicate when onDuplicate=skip', async () => {
      const resource1: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content: '---\nname: test\n---\nOriginal',
        metadata: {},
      };

      const resource2: Resource = {
        ...resource1,
        content: '---\nname: test\n---\nModified',
      };

      const request1: InstallRequest = {
        resource: resource1,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      const request2: InstallRequest = {
        resource: resource2,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      await manager.install([request1]);
      const results = await manager.install([request2]);

      expect(results[0].action).toBe('skipped');
    });

    it('should overwrite when onDuplicate=overwrite', async () => {
      const resource1: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content: '---\nname: test\n---\nOriginal',
        metadata: {},
      };

      const resource2: Resource = {
        ...resource1,
        content: '---\nname: test\n---\nModified',
      };

      const request1: InstallRequest = {
        resource: resource1,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'overwrite',
      };

      const request2: InstallRequest = {
        resource: resource2,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'overwrite',
      };

      await manager.install([request1]);
      const results = await manager.install([request2]);

      expect(results[0].action).toBe('overwritten');
    });

    it('should fail when onDuplicate=fail', async () => {
      const resource: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content: '---\nname: test\n---\nTest',
        metadata: {},
      };

      const request: InstallRequest = {
        resource,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'fail',
      };

      await manager.install([request]);
      const results = await manager.install([request]);

      expect(results[0].success).toBe(false);
      expect(results[0].action).toBe('failed');
    });
  });
});
```

---

## 체크리스트

### 구현 전

- [ ] Task 05, 08 완료 확인

### 구현 중

- [ ] hash.ts 구현
- [ ] fs-safe.ts 구현
- [ ] InstallManager.ts 구현
- [ ] 중복 감지 로직 구현
- [ ] Skip, Overwrite 처리 구현
- [ ] InstallManager.test.ts 작성

### 구현 후

- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] 원자적 쓰기 동작 확인
- [ ] 해시 비교 동작 확인

---

## 통합 포인트

### 출력 (Export)

- InstallManager 클래스 (Task 13, 14, 15에서 확장)
- InstallRequest, InstallResult 인터페이스

### 입력 (Import)

- PathResolver (Task 05)
- Resource (Task 08)

---

## 완료 조건

- [x] InstallManager 구현 완료
- [x] 중복 감지 (해시 비교) 동작
- [x] Skip, Overwrite 처리 동작
- [x] 원자적 파일 쓰기 동작
- [x] 단위 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add packages/cli/src/install/InstallManager.ts packages/cli/src/install/InstallManager.test.ts packages/cli/src/utils/hash.ts packages/cli/src/utils/fs-safe.ts
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement InstallManager with Skip and Overwrite handling"
```
