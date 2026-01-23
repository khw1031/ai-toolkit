# Task 11: BitbucketResolver 구현

```yaml
우선순위: P1
복잡도: Medium
의존성: 03
차단: 16
```

---

## 목표

Bitbucket API를 사용하여 Bitbucket 리포지토리에서 리소스 파일을 가져오는 BitbucketResolver를 구현합니다.

---

## 범위

### 포함 사항

- BitbucketResolver 클래스
- Bitbucket 소스 파싱 (owner/repo, owner/repo@branch)
- Bitbucket API 2.0으로 파일 트리 가져오기
- 리소스 타입별 필터링
- 파일 다운로드
- Rate limit 처리
- 단위 테스트

### 제외 사항

- GitHub, Local, URL resolver (Task 06, 07, 12)

---

## 구현 가이드

### 1. src/source/BitbucketResolver.ts

**위치**: `packages/cli/src/source/BitbucketResolver.ts`

```typescript
import type { ResourceType, SourceFile } from '../types';

interface BitbucketSource {
  owner: string;
  repo: string;
  branch?: string;
}

interface BitbucketFileEntry {
  path: string;
  type: 'commit_file' | 'commit_directory';
  size?: number;
}

export class BitbucketResolver {
  private apiBase = 'https://api.bitbucket.org/2.0';
  private maxDepth = 3;

  /**
   * Resolve Bitbucket source to file list
   */
  async resolve(source: string, type: ResourceType): Promise<SourceFile[]> {
    const parsed = this.parseSource(source);
    const branch = parsed.branch || await this.getDefaultBranch(parsed.owner, parsed.repo);
    const tree = await this.fetchTree(parsed.owner, parsed.repo, branch);
    const filtered = this.filterByType(tree, type);
    return await this.downloadFiles(parsed.owner, parsed.repo, filtered, branch);
  }

  /**
   * Parse Bitbucket source
   * Supports:
   * - owner/repo
   * - owner/repo@branch
   * - https://bitbucket.org/owner/repo
   */
  private parseSource(source: string): BitbucketSource {
    // URL format
    const urlMatch = source.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)/);
    if (urlMatch) {
      return {
        owner: urlMatch[1],
        repo: urlMatch[2].replace('.git', ''),
      };
    }

    // owner/repo@branch format
    const branchMatch = source.match(/^([^\/]+)\/([^@]+)@(.+)$/);
    if (branchMatch) {
      return {
        owner: branchMatch[1],
        repo: branchMatch[2],
        branch: branchMatch[3],
      };
    }

    // owner/repo format
    const simpleMatch = source.match(/^([^\/]+)\/(.+)$/);
    if (simpleMatch) {
      return {
        owner: simpleMatch[1],
        repo: simpleMatch[2],
      };
    }

    throw new Error(`Invalid Bitbucket source: ${source}`);
  }

  /**
   * Get default branch
   */
  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const url = `${this.apiBase}/repositories/${owner}/${repo}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Repository not found: ${owner}/${repo}`);
        }
        throw new Error(`Failed to fetch repository: ${response.statusText}`);
      }

      const data = await response.json();
      return data.mainbranch?.name || 'main';
    } catch (error: any) {
      throw new Error(`Failed to get default branch: ${error.message}`);
    }
  }

  /**
   * Fetch Bitbucket repository tree
   */
  private async fetchTree(
    owner: string,
    repo: string,
    branch: string
  ): Promise<BitbucketFileEntry[]> {
    try {
      const files: BitbucketFileEntry[] = [];
      let url: string | null = `${this.apiBase}/repositories/${owner}/${repo}/src/${branch}`;

      // Bitbucket API uses pagination
      while (url) {
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Repository or branch not found: ${owner}/${repo}@${branch}`);
          }
          throw new Error(`Failed to fetch tree: ${response.statusText}`);
        }

        const data = await response.json();
        files.push(...data.values);

        // Check for next page
        url = data.next || null;
      }

      return files;
    } catch (error: any) {
      throw new Error(`Failed to fetch Bitbucket tree: ${error.message}`);
    }
  }

  /**
   * Filter tree by resource type
   */
  private filterByType(tree: BitbucketFileEntry[], type: ResourceType): BitbucketFileEntry[] {
    const filename = this.getResourceFilename(type);

    return tree.filter((entry) => {
      if (entry.type !== 'commit_file') return false;

      // Check depth
      const depth = entry.path.split('/').length;
      if (depth > this.maxDepth) return false;

      // Check filename
      return entry.path.endsWith(`/${filename}`) || entry.path === filename;
    });
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

  /**
   * Download files from Bitbucket
   */
  private async downloadFiles(
    owner: string,
    repo: string,
    entries: BitbucketFileEntry[],
    branch: string
  ): Promise<SourceFile[]> {
    const files: SourceFile[] = [];

    for (const entry of entries) {
      try {
        const url = `${this.apiBase}/repositories/${owner}/${repo}/src/${branch}/${entry.path}`;
        const response = await fetch(url);

        if (response.ok) {
          const content = await response.text();
          files.push({
            path: entry.path,
            content,
            isDirectory: false,
          });
        }
      } catch (error: any) {
        console.warn(`Failed to download ${entry.path}: ${error.message}`);
      }
    }

    return files;
  }
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/source/BitbucketResolver.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { BitbucketResolver } from './BitbucketResolver';

describe('BitbucketResolver', () => {
  describe('parseSource', () => {
    it('should parse owner/repo format', () => {
      const resolver = new BitbucketResolver();
      const parsed = (resolver as any).parseSource('owner/repo');
      expect(parsed).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse owner/repo@branch format', () => {
      const resolver = new BitbucketResolver();
      const parsed = (resolver as any).parseSource('owner/repo@develop');
      expect(parsed).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'develop',
      });
    });

    it('should parse Bitbucket URL', () => {
      const resolver = new BitbucketResolver();
      const parsed = (resolver as any).parseSource(
        'https://bitbucket.org/owner/repo'
      );
      expect(parsed.owner).toBe('owner');
      expect(parsed.repo).toBe('repo');
    });
  });

  describe('getResourceFilename', () => {
    it('should return correct filename for each type', () => {
      const resolver = new BitbucketResolver();
      expect((resolver as any).getResourceFilename('skill')).toBe('SKILL.md');
      expect((resolver as any).getResourceFilename('rule')).toBe('RULES.md');
    });
  });
});
```

---

## 체크리스트

### 구현 전

- [ ] Task 03 완료 확인

### 구현 중

- [ ] BitbucketResolver.ts 구현
- [ ] parseSource() 메서드 구현
- [ ] getDefaultBranch() 메서드 구현
- [ ] fetchTree() 메서드 구현 (pagination)
- [ ] filterByType() 메서드 구현
- [ ] downloadFiles() 메서드 구현
- [ ] BitbucketResolver.test.ts 작성

### 구현 후

- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] Bitbucket API 동작 확인

---

## 통합 포인트

### 출력 (Export)

- BitbucketResolver 클래스 (CommandHandler에서 사용)

### 입력 (Import)

- ResourceType, SourceFile (Task 03, 06)

---

## 완료 조건

- [x] BitbucketResolver 구현 완료
- [x] Bitbucket API로 파일 트리 가져오기 성공
- [x] Pagination 처리
- [x] 리소스 타입별 필터링 동작
- [x] 단위 테스트 커버리지 70% 이상

---

## Git 커밋

```bash
git add packages/cli/src/source/BitbucketResolver.ts packages/cli/src/source/BitbucketResolver.test.ts
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement BitbucketResolver with API 2.0"
```
