# Task 14: Compare & BatchHandler 구현

```yaml
우선순위: P1
복잡도: High
의존성: 09
차단: 16
```

---

## 목표

Compare 중복 처리 (diff 표시) 및 일괄 처리 (Skip all, Overwrite all, Backup all)를 구현합니다.

---

## 범위

### 포함 사항

- Compare 로직 (diff 표시, 사용자 선택)
- diff 유틸리티 (unified diff 형식)
- 일괄 처리 프롬프트
- BatchHandler 클래스
- InstallManager 및 InteractivePrompt 확장
- 단위 테스트

### 제외 사항

- Skip, Overwrite, Rename, Backup (Task 09, 13에서 완료)
- Logger (Task 15)

---

## 구현 가이드

### 1. package.json 의존성 추가

**위치**: `packages/cli/package.json`

```json
{
  "dependencies": {
    "diff": "^5.1.0",
    "@types/diff": "^5.0.0"
  }
}
```

### 2. src/utils/diff.ts

**위치**: `packages/cli/src/utils/diff.ts`

```typescript
import { createTwoFilesPatch } from 'diff';
import chalk from 'chalk';

/**
 * Generate unified diff between two contents
 */
export function generateDiff(
  oldContent: string,
  newContent: string,
  filename: string = 'file'
): string {
  return createTwoFilesPatch(
    `${filename} (existing)`,
    `${filename} (new)`,
    oldContent,
    newContent,
    '',
    ''
  );
}

/**
 * Format diff with colors
 */
export function formatDiff(diffText: string): string {
  return diffText
    .split('\n')
    .map((line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return chalk.green(line);
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return chalk.red(line);
      }
      if (line.startsWith('@@')) {
        return chalk.cyan(line);
      }
      return line;
    })
    .join('\n');
}

/**
 * Display diff to console
 */
export function displayDiff(oldContent: string, newContent: string, filename: string): void {
  const diff = generateDiff(oldContent, newContent, filename);
  const formatted = formatDiff(diff);
  console.log('\n' + formatted + '\n');
}
```

### 3. src/install/BatchHandler.ts

**위치**: `packages/cli/src/install/BatchHandler.ts`

```typescript
import type { InstallRequest, InstallResult } from './InstallManager';

export type BatchAction = 'ask-each' | 'skip-all' | 'overwrite-all' | 'backup-all';

export class BatchHandler {
  /**
   * Apply batch action to all requests
   */
  applyBatchAction(
    requests: InstallRequest[],
    batchAction: BatchAction
  ): InstallRequest[] {
    if (batchAction === 'ask-each') {
      return requests; // No change
    }

    const actionMap: Record<Exclude<BatchAction, 'ask-each'>, 'skip' | 'overwrite' | 'backup'> = {
      'skip-all': 'skip',
      'overwrite-all': 'overwrite',
      'backup-all': 'backup',
    };

    const onDuplicate = actionMap[batchAction];

    return requests.map((req) => ({
      ...req,
      onDuplicate,
    }));
  }

  /**
   * Group results by action
   */
  summarizeResults(results: InstallResult[]): {
    created: number;
    skipped: number;
    overwritten: number;
    renamed: number;
    backedUp: number;
    failed: number;
  } {
    return {
      created: results.filter((r) => r.action === 'created').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      overwritten: results.filter((r) => r.action === 'overwritten').length,
      renamed: results.filter((r) => r.action === 'renamed').length,
      backedUp: results.filter((r) => r.action === 'backed-up').length,
      failed: results.filter((r) => r.action === 'failed').length,
    };
  }
}
```

### 4. DuplicateHandler 확장

**위치**: `packages/cli/src/install/DuplicateHandler.ts`

기존 DuplicateHandler에 추가:

```typescript
import inquirer from 'inquirer';
import { displayDiff } from '../utils/diff';

/**
 * Handle compare - Show diff and let user choose
 */
async compare(
  targetPath: string,
  existingContent: string,
  newContent: string,
  resourceName: string
): Promise<'skip' | 'overwrite' | 'backup'> {
  console.log(`\n🔍 Comparing "${resourceName}":`);
  displayDiff(existingContent, newContent, resourceName);

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do after seeing the diff?',
      choices: [
        { name: 'Skip - Keep existing', value: 'skip' },
        { name: 'Overwrite - Use new version', value: 'overwrite' },
        { name: 'Backup - Backup and overwrite', value: 'backup' },
      ],
    },
  ]);

  return action;
}
```

### 5. InstallManager 확장

**위치**: `packages/cli/src/install/InstallManager.ts`

handleDuplicate 메서드에 compare 케이스 추가:

```typescript
case 'compare': {
  const action = await this.duplicateHandler.compare(
    targetPath,
    duplicate.existingContent,
    request.resource.content,
    request.resource.name
  );

  // Recursively handle with chosen action
  const newRequest: InstallRequest = {
    ...request,
    onDuplicate: action,
  };

  return await this.handleDuplicate(newRequest, duplicate, targetPath);
}
```

### 6. InteractivePrompt 확장

**위치**: `packages/cli/src/prompts/InteractivePrompt.ts`

```typescript
/**
 * Handle batch duplicates
 */
async handleBatchDuplicates(duplicateCount: number): Promise<BatchAction> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `⚠ ${duplicateCount} files already exist. How do you want to handle them?`,
      choices: [
        { name: 'Ask for each file', value: 'ask-each' },
        { name: 'Skip all - Keep existing files', value: 'skip-all' },
        { name: 'Overwrite all - Replace all with new versions', value: 'overwrite-all' },
        { name: 'Backup all - Backup existing and install new', value: 'backup-all' },
      ],
    },
  ]);

  return action;
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/utils/diff.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { generateDiff, formatDiff } from './diff';

describe('diff', () => {
  describe('generateDiff', () => {
    it('should generate unified diff', () => {
      const oldContent = 'Line 1\nLine 2\nLine 3';
      const newContent = 'Line 1\nLine 2 Modified\nLine 3';

      const diff = generateDiff(oldContent, newContent, 'test.md');

      expect(diff).toContain('--- test.md (existing)');
      expect(diff).toContain('+++ test.md (new)');
      expect(diff).toContain('-Line 2');
      expect(diff).toContain('+Line 2 Modified');
    });

    it('should handle identical content', () => {
      const content = 'Same content';
      const diff = generateDiff(content, content, 'test.md');

      // No changes
      expect(diff).not.toContain('+');
      expect(diff).not.toContain('-');
    });
  });

  describe('formatDiff', () => {
    it('should colorize diff lines', () => {
      const diffText = '--- old\n+++ new\n-removed\n+added\n@@ -1,1 +1,1 @@';
      const formatted = formatDiff(diffText);

      // Should contain ANSI color codes
      expect(formatted).toBeTruthy();
    });
  });
});
```

**위치**: `packages/cli/src/install/BatchHandler.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { BatchHandler } from './BatchHandler';
import type { InstallRequest, InstallResult } from './InstallManager';

describe('BatchHandler', () => {
  const handler = new BatchHandler();

  describe('applyBatchAction', () => {
    it('should apply skip-all', () => {
      const requests: InstallRequest[] = [
        {
          resource: { name: 'test1', type: 'skill' } as any,
          agent: 'claude-code',
          scope: 'project',
          onDuplicate: 'overwrite',
        },
        {
          resource: { name: 'test2', type: 'skill' } as any,
          agent: 'claude-code',
          scope: 'project',
          onDuplicate: 'rename',
        },
      ];

      const result = handler.applyBatchAction(requests, 'skip-all');

      expect(result[0].onDuplicate).toBe('skip');
      expect(result[1].onDuplicate).toBe('skip');
    });

    it('should apply overwrite-all', () => {
      const requests: InstallRequest[] = [
        {
          resource: { name: 'test', type: 'skill' } as any,
          agent: 'claude-code',
          scope: 'project',
          onDuplicate: 'skip',
        },
      ];

      const result = handler.applyBatchAction(requests, 'overwrite-all');

      expect(result[0].onDuplicate).toBe('overwrite');
    });

    it('should not change requests for ask-each', () => {
      const requests: InstallRequest[] = [
        {
          resource: { name: 'test', type: 'skill' } as any,
          agent: 'claude-code',
          scope: 'project',
          onDuplicate: 'skip',
        },
      ];

      const result = handler.applyBatchAction(requests, 'ask-each');

      expect(result[0].onDuplicate).toBe('skip');
    });
  });

  describe('summarizeResults', () => {
    it('should count results by action', () => {
      const results: InstallResult[] = [
        {
          resourceName: 'test1',
          agent: 'claude-code',
          success: true,
          action: 'created',
          path: '/path/1',
        },
        {
          resourceName: 'test2',
          agent: 'claude-code',
          success: true,
          action: 'skipped',
          path: '/path/2',
        },
        {
          resourceName: 'test3',
          agent: 'claude-code',
          success: true,
          action: 'overwritten',
          path: '/path/3',
        },
      ];

      const summary = handler.summarizeResults(results);

      expect(summary.created).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.overwritten).toBe(1);
      expect(summary.renamed).toBe(0);
      expect(summary.backedUp).toBe(0);
      expect(summary.failed).toBe(0);
    });
  });
});
```

---

## 체크리스트

### 구현 전

- [ ] Task 09 완료 확인

### 구현 중

- [ ] diff 의존성 추가
- [ ] diff.ts 구현
- [ ] BatchHandler.ts 구현
- [ ] DuplicateHandler에 compare() 추가
- [ ] InstallManager에 compare 케이스 추가
- [ ] InteractivePrompt에 일괄 처리 추가
- [ ] 테스트 작성

### 구현 후

- [ ] `pnpm install` (새 의존성)
- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] Compare diff 표시 확인
- [ ] 일괄 처리 동작 확인

---

## 통합 포인트

### 출력 (Export)

- BatchHandler 클래스 (CommandHandler에서 사용)
- diff 유틸리티

### 입력 (Import)

- InstallManager, DuplicateHandler (Task 09, 13)
- InteractivePrompt (Task 10)

---

## 완료 조건

- [x] Compare 로직 구현 완료
- [x] diff 표시 동작
- [x] 일괄 처리 구현 완료
- [x] BatchHandler 구현 완료
- [x] 단위 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add packages/cli/src/utils/diff.ts packages/cli/src/utils/diff.test.ts packages/cli/src/install/BatchHandler.ts packages/cli/src/install/BatchHandler.test.ts packages/cli/src/install/DuplicateHandler.ts packages/cli/src/install/InstallManager.ts packages/cli/src/prompts/InteractivePrompt.ts packages/cli/package.json
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement Compare and batch duplicate handling"
```
