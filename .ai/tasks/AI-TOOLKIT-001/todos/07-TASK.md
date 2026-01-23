# Task 07: LocalResolver 구현

```yaml
우선순위: P0
복잡도: Low
의존성: 03
차단: 08, 16
```

---

## 목표

로컬 파일 시스템에서 리소스 파일을 가져오는 LocalResolver를 구현합니다.

---

## 범위

### 포함 사항

- LocalResolver 클래스 (fs 기반)
- 로컬 경로 파싱 (절대 경로, 상대 경로)
- 재귀적 파일 탐색
- 리소스 타입별 필터링
- 심볼릭 링크 처리
- 단위 테스트

### 제외 사항

- GitHub, Bitbucket, URL resolver (Task 06, 11, 12)
- YAML 파싱 (Task 08)

---

## 구현 가이드

### 1. src/source/LocalResolver.ts

**위치**: `packages/cli/src/source/LocalResolver.ts`

```typescript
import { readdir, readFile, stat } from 'fs/promises';
import { join, resolve, isAbsolute } from 'path';
import type { ResourceType, SourceFile } from '../types';

export class LocalResolver {
  private maxDepth = 5; // Prevent infinite recursion

  /**
   * Resolve local path to file list
   * @param source - Local path (absolute or relative)
   * @param type - Resource type to filter
   */
  async resolve(source: string, type: ResourceType): Promise<SourceFile[]> {
    const absolutePath = this.resolveAbsolutePath(source);
    await this.validatePath(absolutePath);

    const files = await this.scanDirectory(absolutePath, type, 0);
    return files;
  }

  /**
   * Resolve to absolute path
   */
  private resolveAbsolutePath(source: string): string {
    if (isAbsolute(source)) {
      return source;
    }
    return resolve(process.cwd(), source);
  }

  /**
   * Validate path exists and is accessible
   */
  private async validatePath(path: string): Promise<void> {
    try {
      const stats = await stat(path);
      if (!stats.isDirectory() && !stats.isFile()) {
        throw new Error(`Path is not a file or directory: ${path}`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Path does not exist: ${path}`);
      }
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied: ${path}`);
      }
      throw error;
    }
  }

  /**
   * Recursively scan directory for resource files
   */
  private async scanDirectory(
    dirPath: string,
    type: ResourceType,
    depth: number
  ): Promise<SourceFile[]> {
    if (depth >= this.maxDepth) {
      console.warn(`Max depth reached at: ${dirPath}`);
      return [];
    }

    const files: SourceFile[] = [];
    const filename = this.getResourceFilename(type);

    try {
      const stats = await stat(dirPath);

      // If it's a file, check if it matches
      if (stats.isFile()) {
        if (dirPath.endsWith(filename)) {
          const content = await readFile(dirPath, 'utf-8');
          files.push({
            path: dirPath,
            content,
            isDirectory: false,
          });
        }
        return files;
      }

      // If it's a directory, scan recursively
      if (stats.isDirectory()) {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);

          // Skip hidden files and node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            const subFiles = await this.scanDirectory(fullPath, type, depth + 1);
            files.push(...subFiles);
          } else if (entry.isFile() && entry.name === filename) {
            const content = await readFile(fullPath, 'utf-8');
            files.push({
              path: fullPath,
              content,
              isDirectory: false,
            });
          } else if (entry.isSymbolicLink()) {
            // Follow symlinks carefully
            try {
              const symlinkStats = await stat(fullPath);
              if (symlinkStats.isDirectory()) {
                const subFiles = await this.scanDirectory(fullPath, type, depth + 1);
                files.push(...subFiles);
              }
            } catch (error) {
              console.warn(`Failed to follow symlink: ${fullPath}`);
            }
          }
        }
      }
    } catch (error: any) {
      console.warn(`Failed to scan ${dirPath}: ${error.message}`);
    }

    return files;
  }

  /**
   * Get resource filename by type
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
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/source/LocalResolver.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalResolver } from './LocalResolver';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('LocalResolver', () => {
  const testDir = join(tmpdir(), 'ai-toolkit-test');
  const resolver = new LocalResolver();

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'skills'), { recursive: true });
    await mkdir(join(testDir, 'skills', 'commit'), { recursive: true });
    await writeFile(
      join(testDir, 'skills', 'commit', 'SKILL.md'),
      '---\nname: commit\n---\nCommit skill'
    );
    await writeFile(
      join(testDir, 'skills', 'SKILL.md'),
      '---\nname: root-skill\n---\nRoot skill'
    );
  });

  afterEach(async () => {
    // Clean up
    await rm(testDir, { recursive: true, force: true });
  });

  describe('resolve', () => {
    it('should find all SKILL.md files', async () => {
      const files = await resolver.resolve(testDir, 'skill');
      expect(files.length).toBe(2);
      expect(files.some((f) => f.path.includes('commit/SKILL.md'))).toBe(true);
    });

    it('should handle absolute paths', async () => {
      const files = await resolver.resolve(testDir, 'skill');
      expect(files.length).toBeGreaterThan(0);
    });

    it('should handle relative paths', async () => {
      const originalCwd = process.cwd();
      process.chdir(testDir);
      const files = await resolver.resolve('.', 'skill');
      expect(files.length).toBeGreaterThan(0);
      process.chdir(originalCwd);
    });

    it('should skip hidden directories', async () => {
      await mkdir(join(testDir, '.hidden'), { recursive: true });
      await writeFile(join(testDir, '.hidden', 'SKILL.md'), 'Hidden skill');

      const files = await resolver.resolve(testDir, 'skill');
      expect(files.some((f) => f.path.includes('.hidden'))).toBe(false);
    });

    it('should skip node_modules', async () => {
      await mkdir(join(testDir, 'node_modules'), { recursive: true });
      await writeFile(join(testDir, 'node_modules', 'SKILL.md'), 'Module skill');

      const files = await resolver.resolve(testDir, 'skill');
      expect(files.some((f) => f.path.includes('node_modules'))).toBe(false);
    });

    it('should throw error for non-existent path', async () => {
      await expect(resolver.resolve('/non/existent/path', 'skill')).rejects.toThrow(
        'Path does not exist'
      );
    });
  });

  describe('getResourceFilename', () => {
    it('should return correct filename for each type', () => {
      expect((resolver as any).getResourceFilename('skill')).toBe('SKILL.md');
      expect((resolver as any).getResourceFilename('rule')).toBe('RULES.md');
      expect((resolver as any).getResourceFilename('command')).toBe('COMMANDS.md');
      expect((resolver as any).getResourceFilename('agent')).toBe('AGENT.md');
    });
  });
});
```

### 수동 테스트

```bash
# 로컬 디렉토리에서 스킬 가져오기
node packages/cli/bin/ai-toolkit.js --skills --source=./test-skills
```

---

## 체크리스트

### 구현 전

- [ ] Task 03 완료 확인

### 구현 중

- [ ] LocalResolver.ts 구현
- [ ] resolveAbsolutePath() 메서드 구현
- [ ] validatePath() 메서드 구현
- [ ] scanDirectory() 재귀 구현
- [ ] 심볼릭 링크 처리
- [ ] LocalResolver.test.ts 작성

### 구현 후

- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] 재귀 탐색 동작 확인
- [ ] 숨김 파일/node_modules 스킵 확인

---

## 통합 포인트

### 출력 (Export)

- LocalResolver 클래스 (Task 08에서 사용)

### 입력 (Import)

- ResourceType, SourceFile (Task 03)

---

## 완료 조건

- [x] LocalResolver 구현 완료
- [x] 절대 경로, 상대 경로 파싱 동작
- [x] 재귀적 파일 탐색 동작
- [x] 숨김 파일, node_modules 스킵
- [x] 심볼릭 링크 처리
- [x] 단위 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add packages/cli/src/source/LocalResolver.ts packages/cli/src/source/LocalResolver.test.ts
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement LocalResolver with recursive scanning"
```

---

## 완료 후: TASK_MASTER 업데이트

**중요**: 이 작업 완료 후 반드시 `.ai/tasks/AI-TOOLKIT-001/todos/00-TASK_MASTER.md`의 진행 상황을 업데이트하세요.

**업데이트 항목**:
- [ ] 해당 서브태스크의 상태를 `✅ completed`로 변경
- [ ] 최근 업데이트 테이블에 완료 날짜 추가
- [ ] Phase 진행률 업데이트
