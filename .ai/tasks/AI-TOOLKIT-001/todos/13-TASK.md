# Task 13: Rename & Backup 구현

```yaml
우선순위: P1
복잡도: Medium
의존성: 09
차단: 16
```

---

## 목표

InstallManager에 Rename 및 Backup 중복 처리 전략을 추가합니다.

---

## 범위

### 포함 사항

- Rename 로직 (자동 넘버링: skill-2, skill-3)
- Backup 로직 (.backup 파일 생성)
- DuplicateHandler 클래스
- InstallManager 확장
- 단위 테스트

### 제외 사항

- Compare, 일괄 처리 (Task 14)
- Skip, Overwrite (Task 09에서 완료)

---

## 구현 가이드

### 1. src/install/DuplicateHandler.ts

**위치**: `packages/cli/src/install/DuplicateHandler.ts`

```typescript
import { existsSync } from 'fs';
import { readFile, copyFile } from 'fs/promises';
import { dirname, basename, join } from 'path';
import { atomicWrite } from '../utils/fs-safe';

export class DuplicateHandler {
  /**
   * Handle rename - Find next available number
   * Examples: skill-2, skill-3, skill-4
   */
  async rename(targetPath: string, content: string): Promise<string> {
    const dir = dirname(targetPath);
    const filename = basename(targetPath);
    const baseName = basename(dirname(targetPath)); // Get directory name (skill name)

    let counter = 2;
    let newPath: string;

    // Find next available number
    while (true) {
      const newDirName = `${baseName}-${counter}`;
      newPath = join(dirname(dir), newDirName, filename);

      if (!existsSync(newPath)) {
        break;
      }

      counter++;
    }

    // Write to new path
    await atomicWrite(newPath, content);

    return newPath;
  }

  /**
   * Handle backup - Create .backup file and overwrite
   */
  async backup(targetPath: string, content: string): Promise<string> {
    const backupPath = `${targetPath}.backup`;

    // Check if backup already exists
    if (existsSync(backupPath)) {
      // Create numbered backup: .backup.1, .backup.2, etc.
      let counter = 1;
      let numberedBackupPath: string;

      while (true) {
        numberedBackupPath = `${backupPath}.${counter}`;
        if (!existsSync(numberedBackupPath)) {
          break;
        }
        counter++;
      }

      await copyFile(targetPath, numberedBackupPath);
    } else {
      await copyFile(targetPath, backupPath);
    }

    // Overwrite original
    await atomicWrite(targetPath, content);

    return backupPath;
  }

  /**
   * Skip - Do nothing
   */
  async skip(): Promise<void> {
    // No action needed
  }

  /**
   * Overwrite - Replace file
   */
  async overwrite(targetPath: string, content: string): Promise<void> {
    await atomicWrite(targetPath, content);
  }
}
```

### 2. InstallManager 확장

**위치**: `packages/cli/src/install/InstallManager.ts`

기존 InstallManager에 추가:

```typescript
import { DuplicateHandler } from './DuplicateHandler';

// In InstallManager class:

private duplicateHandler: DuplicateHandler;

constructor() {
  this.pathResolver = new PathResolver();
  this.duplicateHandler = new DuplicateHandler();
}

/**
 * Handle duplicate file (updated)
 */
private async handleDuplicate(
  request: InstallRequest,
  duplicate: DuplicateInfo,
  targetPath: string
): Promise<InstallResult> {
  const { onDuplicate } = request;

  switch (onDuplicate) {
    case 'skip':
      await this.duplicateHandler.skip();
      return {
        resourceName: request.resource.name,
        agent: request.agent,
        success: true,
        action: 'skipped',
        path: targetPath,
      };

    case 'overwrite':
      await this.duplicateHandler.overwrite(targetPath, request.resource.content);
      return {
        resourceName: request.resource.name,
        agent: request.agent,
        success: true,
        action: 'overwritten',
        path: targetPath,
      };

    case 'rename': {
      const newPath = await this.duplicateHandler.rename(
        targetPath,
        request.resource.content
      );
      return {
        resourceName: request.resource.name,
        agent: request.agent,
        success: true,
        action: 'renamed',
        path: newPath,
        renamedTo: newPath,
      };
    }

    case 'backup': {
      const backupPath = await this.duplicateHandler.backup(
        targetPath,
        request.resource.content
      );
      return {
        resourceName: request.resource.name,
        agent: request.agent,
        success: true,
        action: 'backed-up',
        path: targetPath,
        backupPath,
      };
    }

    case 'fail':
      throw new Error(`File already exists: ${targetPath}`);

    case 'compare':
      // Will be implemented in Task 14
      throw new Error('Compare is not implemented yet (Task 14)');

    default:
      throw new Error(`Unknown duplicate action: ${onDuplicate}`);
  }
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/install/DuplicateHandler.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DuplicateHandler } from './DuplicateHandler';
import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';

describe('DuplicateHandler', () => {
  const testDir = join(tmpdir(), 'ai-toolkit-duplicate-test');
  const handler = new DuplicateHandler();

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('rename', () => {
    it('should create skill-2 for first rename', async () => {
      const originalPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(originalPath, 'Original content');

      const newPath = await handler.rename(originalPath, 'New content');

      expect(newPath).toContain('my-skill-2');
      expect(existsSync(newPath)).toBe(true);
      const content = await readFile(newPath, 'utf-8');
      expect(content).toBe('New content');
    });

    it('should increment number for multiple renames', async () => {
      const originalPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(originalPath, 'Original');

      const path2 = await handler.rename(originalPath, 'V2');
      const path3 = await handler.rename(originalPath, 'V3');

      expect(path2).toContain('my-skill-2');
      expect(path3).toContain('my-skill-3');
    });
  });

  describe('backup', () => {
    it('should create .backup file', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'Original content');

      const backupPath = await handler.backup(targetPath, 'New content');

      expect(backupPath).toBe(`${targetPath}.backup`);
      expect(existsSync(backupPath)).toBe(true);

      // Original should be overwritten
      const newContent = await readFile(targetPath, 'utf-8');
      expect(newContent).toBe('New content');

      // Backup should have original content
      const backupContent = await readFile(backupPath, 'utf-8');
      expect(backupContent).toBe('Original content');
    });

    it('should create numbered backups if .backup exists', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'V1');

      await handler.backup(targetPath, 'V2');
      await writeFile(targetPath, 'V2'); // Reset for second backup
      const backup2 = await handler.backup(targetPath, 'V3');

      expect(existsSync(`${targetPath}.backup`)).toBe(true);
      expect(backup2).toContain('.backup');
    });
  });

  describe('overwrite', () => {
    it('should replace file content', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'Original');

      await handler.overwrite(targetPath, 'New content');

      const content = await readFile(targetPath, 'utf-8');
      expect(content).toBe('New content');
    });
  });
});
```

### InstallManager 통합 테스트 업데이트

**위치**: `packages/cli/src/install/InstallManager.test.ts`

기존 테스트에 추가:

```typescript
it('should rename when onDuplicate=rename', async () => {
  const resource1: Resource = {
    name: 'test-skill',
    type: 'skill',
    description: 'Test',
    path: 'test/SKILL.md',
    content: '---\nname: test\n---\nV1',
    metadata: {},
  };

  const resource2: Resource = {
    ...resource1,
    content: '---\nname: test\n---\nV2',
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
    onDuplicate: 'rename',
  };

  await manager.install([request1]);
  const results = await manager.install([request2]);

  expect(results[0].action).toBe('renamed');
  expect(results[0].renamedTo).toContain('test-skill-2');
});

it('should backup when onDuplicate=backup', async () => {
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
    content: '---\nname: test\n---\nNew',
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
    onDuplicate: 'backup',
  };

  await manager.install([request1]);
  const results = await manager.install([request2]);

  expect(results[0].action).toBe('backed-up');
  expect(results[0].backupPath).toBeDefined();
  expect(results[0].backupPath).toContain('.backup');
});
```

---

## 체크리스트

### 구현 전

- [ ] Task 09 완료 확인

### 구현 중

- [ ] DuplicateHandler.ts 구현
- [ ] rename() 메서드 구현
- [ ] backup() 메서드 구현
- [ ] InstallManager에 통합
- [ ] DuplicateHandler.test.ts 작성
- [ ] InstallManager.test.ts 업데이트

### 구현 후

- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] Rename 동작 확인 (skill-2, skill-3)
- [ ] Backup 동작 확인 (.backup 파일)

---

## 통합 포인트

### 출력 (Export)

- DuplicateHandler 클래스 (Task 14에서 확장)

### 입력 (Import)

- InstallManager (Task 09)
- atomicWrite (Task 09)

---

## 완료 조건

- [x] DuplicateHandler 구현 완료
- [x] Rename 로직 동작 (자동 넘버링)
- [x] Backup 로직 동작 (.backup 생성)
- [x] InstallManager 통합
- [x] 단위 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add packages/cli/src/install/DuplicateHandler.ts packages/cli/src/install/DuplicateHandler.test.ts packages/cli/src/install/InstallManager.ts packages/cli/src/install/InstallManager.test.ts
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement Rename and Backup duplicate handling"
```

---

## 완료 후: TASK_MASTER 업데이트

**중요**: 이 작업 완료 후 반드시 `.ai/tasks/AI-TOOLKIT-001/todos/00-TASK_MASTER.md`의 진행 상황을 업데이트하세요.

**업데이트 항목**:
- [ ] 해당 서브태스크의 상태를 `✅ completed`로 변경
- [ ] 최근 업데이트 테이블에 완료 날짜 추가
- [ ] Phase 진행률 업데이트
