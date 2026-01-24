# Task 06: GitHubResolver 구현

```yaml
우선순위: P0
복잡도: High
의존성: 03
차단: 08, 16
```

---

## 목표

GitHub API를 사용하여 GitHub 리포지토리에서 리소스 파일을 가져오는 GitHubResolver를 구현합니다.

---

## 범위

### 포함 사항

- GitHubResolver 클래스 (Octokit 기반)
- GitHub 소스 파싱 (owner/repo, owner/repo@branch, GitHub URL)
- Git Trees API로 파일 트리 가져오기
- 리소스 타입별 필터링 (SKILL.md, RULES.md 등)
- 파일 다운로드 (Raw Content API)
- Rate limit 처리 및 에러 메시지
- 단위 테스트

### 제외 사항

- Bitbucket, 로컬, URL resolver (Task 07, 11, 12)
- YAML 파싱 (Task 08)

---

## 구현 가이드

### 1. package.json 의존성 추가

**위치**: `packages/cli/package.json`

```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.0"
  }
}
```

### 2. src/source/GitHubResolver.ts

**위치**: `packages/cli/src/source/GitHubResolver.ts`

```typescript
import { Octokit } from '@octokit/rest';
import type { ResourceType, SourceFile } from '../types';

interface GitHubSource {
  owner: string;
  repo: string;
  branch?: string;
}

interface GitHubTreeNode {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export class GitHubResolver {
  private octokit: Octokit;
  private maxDepth = 3; // Performance limit

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Resolve GitHub source to file list
   * @param source - GitHub source (owner/repo, owner/repo@branch, or URL)
   * @param type - Resource type to filter
   */
  async resolve(source: string, type: ResourceType): Promise<SourceFile[]> {
    const parsed = this.parseSource(source);
    const tree = await this.fetchTree(parsed.owner, parsed.repo, parsed.branch);
    const filtered = this.filterByType(tree, type);
    return await this.downloadFiles(parsed.owner, parsed.repo, filtered, parsed.branch);
  }

  /**
   * Parse GitHub source
   * Supports:
   * - owner/repo
   * - owner/repo@branch
   * - https://github.com/owner/repo
   * - https://github.com/owner/repo/tree/branch
   */
  private parseSource(source: string): GitHubSource {
    // URL format
    const urlMatch = source.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (urlMatch) {
      return {
        owner: urlMatch[1],
        repo: urlMatch[2].replace('.git', ''),
        branch: urlMatch[3],
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

    throw new Error(`Invalid GitHub source: ${source}`);
  }

  /**
   * Fetch GitHub repository tree
   */
  private async fetchTree(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<GitHubTreeNode[]> {
    try {
      // Get default branch if not specified
      if (!branch) {
        const { data: repoData } = await this.octokit.repos.get({
          owner,
          repo,
        });
        branch = repoData.default_branch;
      }

      // Fetch tree recursively
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true',
      });

      return data.tree as GitHubTreeNode[];
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      if (error.status === 403) {
        throw new Error(
          'GitHub rate limit exceeded. Set GITHUB_TOKEN environment variable for higher limits.'
        );
      }
      throw new Error(`Failed to fetch GitHub tree: ${error.message}`);
    }
  }

  /**
   * Filter tree by resource type
   */
  private filterByType(tree: GitHubTreeNode[], type: ResourceType): GitHubTreeNode[] {
    const filename = this.getResourceFilename(type);

    return tree.filter((node) => {
      if (node.type !== 'blob') return false;

      // Check depth
      const depth = node.path.split('/').length;
      if (depth > this.maxDepth) return false;

      // Check filename
      return node.path.endsWith(`/${filename}`) || node.path === filename;
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
   * Download files from GitHub
   */
  private async downloadFiles(
    owner: string,
    repo: string,
    nodes: GitHubTreeNode[],
    branch?: string
  ): Promise<SourceFile[]> {
    const files: SourceFile[] = [];

    for (const node of nodes) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: node.path,
          ref: branch,
        });

        if ('content' in data) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          files.push({
            path: node.path,
            content,
            isDirectory: false,
          });
        }
      } catch (error: any) {
        console.warn(`Failed to download ${node.path}: ${error.message}`);
      }
    }

    return files;
  }
}
```

### 3. src/types.ts 업데이트

**위치**: `packages/cli/src/types.ts`

기존 타입에 추가:

```typescript
export interface SourceFile {
  path: string;           // 파일 경로 (예: skills/commit/SKILL.md)
  content: string;        // 파일 내용
  isDirectory: boolean;   // 디렉토리 포함 여부
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/source/GitHubResolver.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GitHubResolver } from './GitHubResolver';

describe('GitHubResolver', () => {
  describe('parseSource', () => {
    it('should parse owner/repo format', async () => {
      const resolver = new GitHubResolver();
      // Use reflection to access private method for testing
      const parsed = (resolver as any).parseSource('owner/repo');
      expect(parsed).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse owner/repo@branch format', async () => {
      const resolver = new GitHubResolver();
      const parsed = (resolver as any).parseSource('owner/repo@main');
      expect(parsed).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
      });
    });

    it('should parse GitHub URL', async () => {
      const resolver = new GitHubResolver();
      const parsed = (resolver as any).parseSource(
        'https://github.com/owner/repo'
      );
      expect(parsed.owner).toBe('owner');
      expect(parsed.repo).toBe('repo');
    });

    it('should parse GitHub URL with branch', async () => {
      const resolver = new GitHubResolver();
      const parsed = (resolver as any).parseSource(
        'https://github.com/owner/repo/tree/develop'
      );
      expect(parsed.branch).toBe('develop');
    });
  });

  describe('getResourceFilename', () => {
    it('should return correct filename for each type', () => {
      const resolver = new GitHubResolver();
      expect((resolver as any).getResourceFilename('skill')).toBe('SKILL.md');
      expect((resolver as any).getResourceFilename('rule')).toBe('RULES.md');
      expect((resolver as any).getResourceFilename('command')).toBe('COMMANDS.md');
      expect((resolver as any).getResourceFilename('agent')).toBe('AGENT.md');
    });
  });
});
```

### 통합 테스트 (선택)

```bash
# 실제 GitHub repo에서 스킬 가져오기
node packages/cli/bin/ai-toolkit.js --skills --source=your-username/test-repo
```

---

## 체크리스트

### 구현 전

- [ ] Task 03 완료 확인
- [ ] GitHub Personal Access Token 준비 (선택)

### 구현 중

- [ ] @octokit/rest 의존성 추가
- [ ] GitHubResolver.ts 구현
- [ ] parseSource() 메서드 구현
- [ ] fetchTree() 메서드 구현
- [ ] filterByType() 메서드 구현
- [ ] downloadFiles() 메서드 구현
- [ ] GitHubResolver.test.ts 작성

### 구현 후

- [ ] `pnpm install` (새 의존성)
- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] Rate limit 에러 메시지 확인

---

## 통합 포인트

### 출력 (Export)

- GitHubResolver 클래스 (Task 08에서 사용)
- SourceFile 인터페이스 (Task 08에서 사용)

### 입력 (Import)

- ResourceType (Task 03)

---

## 완료 조건

- [x] GitHubResolver 구현 완료
- [x] owner/repo, owner/repo@branch, URL 파싱 동작
- [x] GitHub API로 파일 트리 가져오기 성공
- [x] 리소스 타입별 필터링 동작
- [x] Rate limit 처리 및 에러 메시지
- [x] 단위 테스트 커버리지 70% 이상

---

## Git 커밋

```bash
git add packages/cli/src/source/GitHubResolver.ts packages/cli/src/source/GitHubResolver.test.ts packages/cli/src/types.ts packages/cli/package.json
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement GitHubResolver with rate limit handling"
```

---

## 완료 후: TASK_MASTER 업데이트

**중요**: 이 작업 완료 후 반드시 `.ai/tasks/AI-TOOLKIT-001/todos/00-TASK_MASTER.md`의 진행 상황을 업데이트하세요.

**업데이트 항목**:
- [ ] 해당 서브태스크의 상태를 `✅ completed`로 변경
- [ ] 최근 업데이트 테이블에 완료 날짜 추가
- [ ] Phase 진행률 업데이트
