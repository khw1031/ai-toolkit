import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BitbucketFetcher,
  BitbucketApiError,
  BitbucketNotFoundError,
  BitbucketRateLimitError,
} from './BitbucketFetcher.js';
import type { ParsedSource } from '../types.js';

// Mock child_process exec
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdtemp: vi.fn(),
  rm: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = await import('child_process');
const fs = await import('fs/promises');

describe('BitbucketFetcher', () => {
  let fetcher: BitbucketFetcher;
  const tempDir = '/tmp/bitbucket-test123';

  beforeEach(() => {
    fetcher = new BitbucketFetcher();
    vi.clearAllMocks();

    // Default mock setup
    vi.mocked(fs.mkdtemp).mockResolvedValue(tempDir);
    vi.mocked(fs.rm).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Classes', () => {
    it('should create BitbucketApiError with correct properties', () => {
      const error = new BitbucketApiError('Test error', 500, '/test/path');
      expect(error.name).toBe('BitbucketApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.path).toBe('/test/path');
    });

    it('should create BitbucketNotFoundError with 404 status', () => {
      const error = new BitbucketNotFoundError('/not/found');
      expect(error.name).toBe('BitbucketNotFoundError');
      expect(error.status).toBe(404);
      expect(error.path).toBe('/not/found');
      expect(error.message).toContain('not found');
    });

    it('should create BitbucketRateLimitError with 429 status', () => {
      const error = new BitbucketRateLimitError('/rate/limited');
      expect(error.name).toBe('BitbucketRateLimitError');
      expect(error.status).toBe(429);
    });
  });

  describe('fetchResources', () => {
    it('should throw error for non-Bitbucket source', async () => {
      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        raw: 'github.com/owner/repo',
      };

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'Invalid Bitbucket source'
      );
    });

    it('should throw error for source without owner', async () => {
      const source: ParsedSource = {
        type: 'bitbucket',
        repo: 'repo',
        raw: 'bitbucket.org/repo',
      };

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'Invalid Bitbucket source'
      );
    });

    it('should return empty array when directory not found', async () => {
      // Mock exec to fail with path not found
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('path not found'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        raw: 'workspace/repo',
      };

      const result = await fetcher.fetchResources(source, ['skills']);
      expect(result).toEqual([]);
    });

    it('should fetch resources from directory with single SSH call', async () => {
      // Mock successful git archive + tar extraction
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      // Mock directory structure after extraction
      vi.mocked(fs.readdir).mockImplementation(async (dirPath) => {
        const pathStr = String(dirPath);
        if (pathStr.endsWith('/skills')) {
          return [
            { name: 'my-skill', isDirectory: () => true, isFile: () => false },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        if (pathStr.endsWith('/my-skill')) {
          return [
            { name: 'SKILL.md', isDirectory: () => false, isFile: () => true },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        return [] as unknown as ReturnType<typeof fs.readdir>;
      });

      // Mock file content
      vi.mocked(fs.readFile).mockResolvedValue(`---
name: my-skill
description: A test skill
---
# My Skill`);

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        raw: 'workspace/repo',
      };

      const result = await fetcher.fetchResources(source, ['skills']);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('my-skill');
      expect(result[0].description).toBe('A test skill');

      // Verify only one exec call was made (single SSH call)
      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('git archive --remote=git@bitbucket.org:workspace/repo.git'),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should use custom ref when provided', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('path not found'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        ref: 'develop',
        raw: 'workspace/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('develop'),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should use subpath when provided', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('path not found'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        subpath: 'custom/path',
        raw: 'workspace/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('custom/path'),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should clean up temp directory after fetch', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof exec>;
      });
      vi.mocked(fs.readdir).mockResolvedValue([] as unknown as ReturnType<typeof fs.readdir>);

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        raw: 'workspace/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      expect(fs.rm).toHaveBeenCalledWith(tempDir, { recursive: true, force: true });
    });
  });

  describe('SSH error handling', () => {
    const source: ParsedSource = {
      type: 'bitbucket',
      owner: 'workspace',
      repo: 'repo',
      raw: 'workspace/repo',
    };

    it('should handle Permission denied error', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Permission denied (publickey)'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'SSH access denied'
      );
    });

    it('should handle Could not read error', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Could not read from remote repository'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'SSH access denied'
      );
    });

    it('should handle path not found error gracefully', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('path not found'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      const result = await fetcher.fetchResources(source, ['skills']);
      expect(result).toEqual([]);
    });

    it('should handle tar error gracefully', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('tar: Error exit'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      const result = await fetcher.fetchResources(source, ['skills']);
      expect(result).toEqual([]);
    });
  });

  describe('fetchResources with sibling files', () => {
    it('should fetch all files in directory', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      // Mock directory structure
      vi.mocked(fs.readdir).mockImplementation(async (dirPath) => {
        const pathStr = String(dirPath);
        if (pathStr.endsWith('/rules')) {
          return [
            { name: 'my-rule', isDirectory: () => true, isFile: () => false },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        if (pathStr.endsWith('/my-rule')) {
          return [
            { name: 'RULE.md', isDirectory: () => false, isFile: () => true },
            { name: 'CLAUDE.md', isDirectory: () => false, isFile: () => true },
            { name: 'references', isDirectory: () => true, isFile: () => false },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        if (pathStr.endsWith('/references')) {
          return [
            { name: 'guide.md', isDirectory: () => false, isFile: () => true },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        return [] as unknown as ReturnType<typeof fs.readdir>;
      });

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('RULE.md')) {
          return `---
name: my-rule
description: A test rule
---
# My Rule`;
        }
        if (pathStr.endsWith('CLAUDE.md')) {
          return '# Claude Instructions';
        }
        if (pathStr.endsWith('guide.md')) {
          return '# Guide';
        }
        return '';
      });

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        raw: 'workspace/repo',
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

  describe('findMainResourceFile priority', () => {
    it('should prioritize SKILL.md for skills type', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      vi.mocked(fs.readdir).mockImplementation(async (dirPath) => {
        const pathStr = String(dirPath);
        if (pathStr.endsWith('/skills')) {
          return [
            { name: 'my-skill', isDirectory: () => true, isFile: () => false },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        if (pathStr.endsWith('/my-skill')) {
          return [
            { name: 'README.md', isDirectory: () => false, isFile: () => true },
            { name: 'SKILL.md', isDirectory: () => false, isFile: () => true },
          ] as unknown as ReturnType<typeof fs.readdir>;
        }
        return [] as unknown as ReturnType<typeof fs.readdir>;
      });

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('SKILL.md')) {
          return `---
name: my-skill
---
# Skill`;
        }
        if (pathStr.endsWith('README.md')) {
          return '# README';
        }
        return '';
      });

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        raw: 'workspace/repo',
      };

      const result = await fetcher.fetchResources(source, ['skills']);

      expect(result).toHaveLength(1);
      expect(result[0].path).toContain('SKILL.md');
      expect(result[0].directory?.files).toHaveLength(1);
      expect(result[0].directory?.files[0].path).toBe('README.md');
    });
  });

  describe('SSH URL generation', () => {
    it('should generate correct SSH URL', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('path not found'), '', '');
        }
        return {} as ReturnType<typeof exec>;
      });

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'my-workspace',
        repo: 'my-repo',
        raw: 'my-workspace/my-repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('git@bitbucket.org:my-workspace/my-repo.git'),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('caching', () => {
    it('should not make duplicate SSH calls for the same directory', async () => {
      vi.mocked(exec).mockImplementation((_cmd, _opts, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
        return {} as ReturnType<typeof exec>;
      });
      vi.mocked(fs.readdir).mockResolvedValue([] as unknown as ReturnType<typeof fs.readdir>);

      const source: ParsedSource = {
        type: 'bitbucket',
        owner: 'workspace',
        repo: 'repo',
        raw: 'workspace/repo',
      };

      // Call with same source
      await fetcher.fetchResources(source, ['skills']);

      // Verify only one exec call was made
      expect(exec).toHaveBeenCalledTimes(1);
    });
  });
});
