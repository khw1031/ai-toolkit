import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BitbucketResolver } from './BitbucketResolver';

describe('BitbucketResolver', () => {
  describe('parseSource', () => {
    it('should parse owner/repo format', () => {
      const resolver = new BitbucketResolver();
      const parsed = resolver.parseSource('owner/repo');
      expect(parsed).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse owner/repo@branch format', () => {
      const resolver = new BitbucketResolver();
      const parsed = resolver.parseSource('owner/repo@develop');
      expect(parsed).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'develop',
      });
    });

    it('should parse owner/repo@branch with feature branch', () => {
      const resolver = new BitbucketResolver();
      const parsed = resolver.parseSource('owner/repo@feature/new-feature');
      expect(parsed).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'feature/new-feature',
      });
    });

    it('should parse Bitbucket URL', () => {
      const resolver = new BitbucketResolver();
      const parsed = resolver.parseSource('https://bitbucket.org/owner/repo');
      expect(parsed.owner).toBe('owner');
      expect(parsed.repo).toBe('repo');
    });

    it('should parse Bitbucket URL with branch', () => {
      const resolver = new BitbucketResolver();
      const parsed = resolver.parseSource(
        'https://bitbucket.org/owner/repo/src/develop'
      );
      expect(parsed.owner).toBe('owner');
      expect(parsed.repo).toBe('repo');
      expect(parsed.branch).toBe('develop');
    });

    it('should remove .git extension from repo name', () => {
      const resolver = new BitbucketResolver();
      const parsed = resolver.parseSource(
        'https://bitbucket.org/owner/repo.git'
      );
      expect(parsed.repo).toBe('repo');
    });

    it('should throw error for invalid source', () => {
      const resolver = new BitbucketResolver();
      expect(() => {
        resolver.parseSource('invalid-source');
      }).toThrow('Invalid Bitbucket source');
    });
  });

  describe('getResourceFilename', () => {
    it('should return correct filename for each type', () => {
      const resolver = new BitbucketResolver();
      expect(resolver.getResourceFilename('skill')).toBe('SKILL.md');
      expect(resolver.getResourceFilename('rule')).toBe('RULES.md');
      expect(resolver.getResourceFilename('command')).toBe('COMMANDS.md');
      expect(resolver.getResourceFilename('agent')).toBe('AGENT.md');
    });
  });

  describe('filterByType', () => {
    it('should filter entries by resource type', () => {
      const resolver = new BitbucketResolver();
      const tree = [
        { path: 'SKILL.md', type: 'commit_file' as const },
        { path: 'skills/commit/SKILL.md', type: 'commit_file' as const },
        { path: 'README.md', type: 'commit_file' as const },
        { path: 'deep/nested/path/more/SKILL.md', type: 'commit_file' as const },
      ];

      const filtered = resolver.filterByType(tree, 'skill');

      // Should include root and nested, but not too deep
      expect(filtered).toHaveLength(2);
      expect(filtered.some((n) => n.path === 'SKILL.md')).toBe(true);
      expect(filtered.some((n) => n.path === 'skills/commit/SKILL.md')).toBe(true);
      expect(filtered.some((n) => n.path === 'deep/nested/path/more/SKILL.md')).toBe(
        false
      );
    });

    it('should exclude directory entries', () => {
      const resolver = new BitbucketResolver();
      const tree = [
        { path: 'SKILL.md', type: 'commit_file' as const },
        { path: 'skills', type: 'commit_directory' as const },
      ];

      const filtered = resolver.filterByType(tree, 'skill');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].path).toBe('SKILL.md');
    });

    it('should filter by rule type', () => {
      const resolver = new BitbucketResolver();
      const tree = [
        { path: 'SKILL.md', type: 'commit_file' as const },
        { path: 'RULES.md', type: 'commit_file' as const },
        { path: 'rules/coding/RULES.md', type: 'commit_file' as const },
      ];

      const filtered = resolver.filterByType(tree, 'rule');

      expect(filtered).toHaveLength(2);
      expect(filtered.some((n) => n.path === 'RULES.md')).toBe(true);
      expect(filtered.some((n) => n.path === 'rules/coding/RULES.md')).toBe(true);
    });
  });

  describe('getDefaultBranch', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return mainbranch name from API response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ mainbranch: { name: 'master' } }),
      });

      const resolver = new BitbucketResolver();
      const branch = await resolver.getDefaultBranch('owner', 'repo');

      expect(branch).toBe('master');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/owner/repo'
      );
    });

    it('should return "main" when mainbranch is not set', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const resolver = new BitbucketResolver();
      const branch = await resolver.getDefaultBranch('owner', 'repo');

      expect(branch).toBe('main');
    });

    it('should throw error when repository not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const resolver = new BitbucketResolver();
      await expect(resolver.getDefaultBranch('owner', 'nonexistent')).rejects.toThrow(
        'Repository not found: owner/nonexistent'
      );
    });

    it('should throw error on rate limit', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const resolver = new BitbucketResolver();
      await expect(resolver.getDefaultBranch('owner', 'repo')).rejects.toThrow(
        'rate limit exceeded'
      );
    });
  });

  describe('fetchTree', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should fetch tree with pagination', async () => {
      const mockFirstPage = {
        values: [{ path: 'SKILL.md', type: 'commit_file' }],
        next: 'https://api.bitbucket.org/2.0/page2',
      };
      const mockSecondPage = {
        values: [{ path: 'README.md', type: 'commit_file' }],
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFirstPage),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSecondPage),
        });

      const resolver = new BitbucketResolver();
      const tree = await resolver.fetchTree('owner', 'repo', 'main');

      expect(tree).toHaveLength(2);
      expect(tree.some((f) => f.path === 'SKILL.md')).toBe(true);
      expect(tree.some((f) => f.path === 'README.md')).toBe(true);
    });

    it('should throw error when branch not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const resolver = new BitbucketResolver();
      await expect(resolver.fetchTree('owner', 'repo', 'nonexistent')).rejects.toThrow(
        'Repository or branch not found: owner/repo@nonexistent'
      );
    });

    it('should handle rate limit error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const resolver = new BitbucketResolver();
      await expect(resolver.fetchTree('owner', 'repo', 'main')).rejects.toThrow(
        'rate limit exceeded'
      );
    });
  });

  describe('downloadFiles', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should download file content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# Skill Content'),
      });

      const resolver = new BitbucketResolver();
      const entries = [{ path: 'SKILL.md', type: 'commit_file' as const }];
      const files = await resolver.downloadFiles('owner', 'repo', entries, 'main');

      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('SKILL.md');
      expect(files[0].content).toBe('# Skill Content');
      expect(files[0].isDirectory).toBe(false);
    });

    it('should skip files that fail to download', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const resolver = new BitbucketResolver();
      const entries = [{ path: 'SKILL.md', type: 'commit_file' as const }];
      const files = await resolver.downloadFiles('owner', 'repo', entries, 'main');

      expect(files).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('should download multiple files', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('# Skill 1'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('# Skill 2'),
        });

      const resolver = new BitbucketResolver();
      const entries = [
        { path: 'skill1/SKILL.md', type: 'commit_file' as const },
        { path: 'skill2/SKILL.md', type: 'commit_file' as const },
      ];
      const files = await resolver.downloadFiles('owner', 'repo', entries, 'main');

      expect(files).toHaveLength(2);
      expect(files[0].content).toBe('# Skill 1');
      expect(files[1].content).toBe('# Skill 2');
    });
  });

  describe('resolve (integration)', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should resolve source and return filtered files', async () => {
      // Mock repository info
      const mockRepoResponse = {
        ok: true,
        json: () => Promise.resolve({ mainbranch: { name: 'main' } }),
      };

      // Mock tree response
      const mockTreeResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            values: [
              { path: 'SKILL.md', type: 'commit_file' },
              { path: 'README.md', type: 'commit_file' },
              { path: 'skills/commit/SKILL.md', type: 'commit_file' },
            ],
          }),
      };

      // Mock file downloads
      const mockFileResponse = {
        ok: true,
        text: () => Promise.resolve('# Skill Content'),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockRepoResponse)
        .mockResolvedValueOnce(mockTreeResponse)
        .mockResolvedValueOnce(mockFileResponse)
        .mockResolvedValueOnce(mockFileResponse);

      const resolver = new BitbucketResolver();
      const files = await resolver.resolve('owner/repo', 'skill');

      expect(files).toHaveLength(2);
      expect(files.every((f) => f.path.endsWith('SKILL.md'))).toBe(true);
    });

    it('should use specified branch', async () => {
      // Mock tree response (no need for repo response when branch is specified)
      const mockTreeResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            values: [{ path: 'SKILL.md', type: 'commit_file' }],
          }),
      };

      // Mock file download
      const mockFileResponse = {
        ok: true,
        text: () => Promise.resolve('# Skill Content'),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockTreeResponse)
        .mockResolvedValueOnce(mockFileResponse);

      const resolver = new BitbucketResolver();
      const files = await resolver.resolve('owner/repo@develop', 'skill');

      expect(files).toHaveLength(1);
      // Verify that develop branch was used in URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/src/develop/')
      );
    });
  });
});
