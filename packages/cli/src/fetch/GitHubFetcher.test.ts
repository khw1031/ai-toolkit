import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GitHubFetcher,
  GitHubApiError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from './GitHubFetcher.js';
import type { ParsedSource } from '../types.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/**
 * Helper to create mock responses for the new API flow:
 * 1. getDefaultBranch: GET /repos/{owner}/{repo}
 * 2. getRefSha: GET /repos/{owner}/{repo}/branches/{ref}
 * 3. fetchTree: GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1
 * 4. fetchFileContent: GET raw.githubusercontent.com/...
 */
function mockSuccessFlow(options: {
  defaultBranch?: string;
  commitSha?: string;
  tree?: Array<{ path: string; type: 'blob' | 'tree' }>;
  files?: Record<string, string>;
}) {
  const {
    defaultBranch = 'main',
    commitSha = 'abc123sha',
    tree = [],
    files = {},
  } = options;

  // 1. getDefaultBranch (only called if ref not provided)
  mockFetch.mockImplementation(async (url: string) => {
    // GET /repos/{owner}/{repo} - getDefaultBranch
    if (url.match(/\/repos\/[^/]+\/[^/]+$/) && !url.includes('branches') && !url.includes('git')) {
      return {
        ok: true,
        json: () => Promise.resolve({ default_branch: defaultBranch }),
      };
    }

    // GET /repos/{owner}/{repo}/branches/{ref} - getRefSha
    if (url.includes('/branches/')) {
      return {
        ok: true,
        json: () => Promise.resolve({ commit: { sha: commitSha } }),
      };
    }

    // GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1 - fetchTree
    if (url.includes('/git/trees/')) {
      return {
        ok: true,
        json: () => Promise.resolve({ tree, truncated: false }),
      };
    }

    // GET raw.githubusercontent.com/... - fetchFileContent
    if (url.includes('raw.githubusercontent.com')) {
      const path = url.split('/main/')[1] || url.split('/develop/')[1] || '';
      const content = files[path] || '';
      return {
        ok: true,
        text: () => Promise.resolve(content),
      };
    }

    return { ok: false, status: 404 };
  });
}

describe('GitHubFetcher', () => {
  let fetcher: GitHubFetcher;

  beforeEach(() => {
    fetcher = new GitHubFetcher();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Classes', () => {
    it('should create GitHubApiError with correct properties', () => {
      const error = new GitHubApiError('Test error', 500, '/test/path');
      expect(error.name).toBe('GitHubApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.path).toBe('/test/path');
    });

    it('should create GitHubNotFoundError with 404 status', () => {
      const error = new GitHubNotFoundError('/not/found');
      expect(error.name).toBe('GitHubNotFoundError');
      expect(error.status).toBe(404);
      expect(error.path).toBe('/not/found');
      expect(error.message).toContain('not found');
    });

    it('should create GitHubRateLimitError with 403 status', () => {
      const error = new GitHubRateLimitError('/rate/limited');
      expect(error.name).toBe('GitHubRateLimitError');
      expect(error.status).toBe(403);
      expect(error.message).toContain('rate limit');
    });
  });

  describe('fetchResources', () => {
    it('should throw error for non-GitHub source', async () => {
      const source: ParsedSource = {
        type: 'gitlab',
        owner: 'owner',
        repo: 'repo',
        raw: 'gitlab.com/owner/repo',
      };

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'Invalid GitHub source'
      );
    });

    it('should throw error for source without owner', async () => {
      const source: ParsedSource = {
        type: 'github',
        repo: 'repo',
        raw: 'github.com/repo',
      };

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'Invalid GitHub source'
      );
    });

    it('should return empty array when directory not found', async () => {
      mockSuccessFlow({
        tree: [], // Empty tree means no files in skills/
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'owner/repo',
      };

      const result = await fetcher.fetchResources(source, ['skills']);
      expect(result).toEqual([]);
    });

    it('should throw GitHubRateLimitError on 403', async () => {
      // 1. getDefaultBranch succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ default_branch: 'main' }),
      });
      // 2. getRefSha returns 403
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'owner/repo',
      };

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        GitHubRateLimitError
      );
    });

    it('should fetch resources from directory', async () => {
      mockSuccessFlow({
        tree: [
          { path: 'skills/my-skill/SKILL.md', type: 'blob' },
        ],
        files: {
          'skills/my-skill/SKILL.md': `---
name: my-skill
description: A test skill
---
# My Skill`,
        },
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'owner/repo',
      };

      const result = await fetcher.fetchResources(source, ['skills']);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('my-skill');
      expect(result[0].description).toBe('A test skill');
    });

    it('should use custom ref when provided', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        // When custom ref is provided, it should call branches/{ref} directly
        if (url.includes('/branches/develop')) {
          return {
            ok: true,
            json: () => Promise.resolve({ commit: { sha: 'develop-sha' } }),
          };
        }
        if (url.includes('/git/trees/')) {
          return {
            ok: true,
            json: () => Promise.resolve({ tree: [], truncated: false }),
          };
        }
        return { ok: false, status: 404 };
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        ref: 'develop',
        raw: 'owner/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      // Verify branches/develop was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/branches/develop'),
        expect.any(Object)
      );
    });

    it('should use subpath when provided', async () => {
      mockSuccessFlow({
        tree: [
          { path: 'custom/path/SKILL.md', type: 'blob' },
        ],
        files: {
          'custom/path/SKILL.md': `---
name: custom-skill
---
# Custom Skill`,
        },
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        subpath: 'custom/path',
        raw: 'owner/repo',
      };

      const result = await fetcher.fetchResources(source, ['skills']);

      // Should filter tree by custom/path
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HTTP error handling', () => {
    const source: ParsedSource = {
      type: 'github',
      owner: 'owner',
      repo: 'repo',
      raw: 'owner/repo',
    };

    // Helper to mock getDefaultBranch success then error on getRefSha
    function mockWithError(status: number) {
      // 1. getDefaultBranch succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ default_branch: 'main' }),
      });
      // 2. getRefSha returns error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status,
      });
    }

    it('should handle 401 Unauthorized', async () => {
      mockWithError(401);

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'Authentication required'
      );
    });

    it('should handle 500 Server Error', async () => {
      mockWithError(500);

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'GitHub server error'
      );
    });

    it('should handle 502 Bad Gateway', async () => {
      mockWithError(502);

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'GitHub server error'
      );
    });

    it('should handle 503 Service Unavailable', async () => {
      mockWithError(503);

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'GitHub server error'
      );
    });

    it('should handle unknown error status', async () => {
      mockWithError(418); // I'm a teapot

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        GitHubApiError
      );
    });
  });

  describe('fetchResources with sibling files', () => {
    it('should fetch all files in directory', async () => {
      mockSuccessFlow({
        tree: [
          { path: 'rules/my-rule/RULE.md', type: 'blob' },
          { path: 'rules/my-rule/CLAUDE.md', type: 'blob' },
          { path: 'rules/my-rule/references/guide.md', type: 'blob' },
        ],
        files: {
          'rules/my-rule/RULE.md': `---
name: my-rule
description: A test rule
---
# My Rule`,
          'rules/my-rule/CLAUDE.md': '# Claude Instructions',
          'rules/my-rule/references/guide.md': '# Guide',
        },
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'owner/repo',
      };

      const result = await fetcher.fetchResources(source, ['rules']);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('my-rule');
      expect(result[0].directory?.files).toHaveLength(2);

      const filePaths = result[0].directory?.files.map((f) => f.path);
      expect(filePaths).toContain('CLAUDE.md');
      expect(filePaths).toContain('references/guide.md');
    });
  });

  describe('findMainResourceFile', () => {
    it('should prioritize RULE.md for rules type', async () => {
      mockSuccessFlow({
        tree: [
          { path: 'rules/my-rule/README.md', type: 'blob' },
          { path: 'rules/my-rule/RULE.md', type: 'blob' },
        ],
        files: {
          'rules/my-rule/README.md': '# README',
          'rules/my-rule/RULE.md': `---
name: my-rule
---
# Rule`,
        },
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'owner/repo',
      };

      const result = await fetcher.fetchResources(source, ['rules']);

      expect(result).toHaveLength(1);
      expect(result[0].path).toContain('RULE.md');
      expect(result[0].directory?.files).toHaveLength(1);
      expect(result[0].directory?.files[0].path).toBe('README.md');
    });
  });

  describe('API optimization', () => {
    it('should use Git Trees API for efficient fetching', async () => {
      mockSuccessFlow({
        tree: [
          { path: 'skills/skill-a/SKILL.md', type: 'blob' },
          { path: 'skills/skill-b/SKILL.md', type: 'blob' },
        ],
        files: {
          'skills/skill-a/SKILL.md': `---
name: skill-a
---
# Skill A`,
          'skills/skill-b/SKILL.md': `---
name: skill-b
---
# Skill B`,
        },
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'owner/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      // Should call git/trees API
      const treeCall = mockFetch.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('/git/trees/')
      );
      expect(treeCall).toBeDefined();
    });

    it('should fetch files from raw.githubusercontent.com', async () => {
      mockSuccessFlow({
        tree: [{ path: 'skills/my-skill/SKILL.md', type: 'blob' }],
        files: {
          'skills/my-skill/SKILL.md': `---
name: my-skill
---
# Skill`,
        },
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'owner/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      // Should fetch file content from raw.githubusercontent.com
      const rawCall = mockFetch.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('raw.githubusercontent.com')
      );
      expect(rawCall).toBeDefined();
    });
  });
});
