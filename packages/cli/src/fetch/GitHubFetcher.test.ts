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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
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
      // Mock directory listing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { name: 'my-skill', path: 'skills/my-skill', type: 'dir' },
        ]),
      });

      // Mock subdirectory listing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { name: 'SKILL.md', path: 'skills/my-skill/SKILL.md', type: 'file' },
        ]),
      });

      // Mock file content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`---
name: my-skill
description: A test skill
---
# My Skill`),
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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        ref: 'develop',
        raw: 'owner/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('ref=develop'),
        expect.any(Object)
      );
    });

    it('should use subpath when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const source: ParsedSource = {
        type: 'github',
        owner: 'owner',
        repo: 'repo',
        subpath: 'custom/path',
        raw: 'owner/repo',
      };

      await fetcher.fetchResources(source, ['skills']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('custom/path'),
        expect.any(Object)
      );
    });
  });

  describe('HTTP error handling', () => {
    const source: ParsedSource = {
      type: 'github',
      owner: 'owner',
      repo: 'repo',
      raw: 'owner/repo',
    };

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'Authentication required'
      );
    });

    it('should handle 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'GitHub server error'
      );
    });

    it('should handle 502 Bad Gateway', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
      });

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'GitHub server error'
      );
    });

    it('should handle 503 Service Unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        'GitHub server error'
      );
    });

    it('should handle unknown error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 418, // I'm a teapot
      });

      await expect(fetcher.fetchResources(source, ['skills'])).rejects.toThrow(
        GitHubApiError
      );
    });
  });

  describe('fetchResources with sibling files', () => {
    it('should fetch all files in directory', async () => {
      // Mock directory listing for 'rules'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { name: 'my-rule', path: 'rules/my-rule', type: 'dir' },
        ]),
      });

      // Mock subdirectory listing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { name: 'RULE.md', path: 'rules/my-rule/RULE.md', type: 'file' },
          { name: 'CLAUDE.md', path: 'rules/my-rule/CLAUDE.md', type: 'file' },
          { name: 'references', path: 'rules/my-rule/references', type: 'dir' },
        ]),
      });

      // Mock main file content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`---
name: my-rule
description: A test rule
---
# My Rule`),
      });

      // Mock sibling file content (CLAUDE.md)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# Claude Instructions'),
      });

      // Mock references directory listing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { name: 'guide.md', path: 'rules/my-rule/references/guide.md', type: 'file' },
        ]),
      });

      // Mock references/guide.md content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# Guide'),
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

      const filePaths = result[0].directory?.files.map(f => f.path);
      expect(filePaths).toContain('CLAUDE.md');
      expect(filePaths).toContain('references/guide.md');
    });
  });

  describe('findMainResourceFile', () => {
    it('should prioritize RULE.md for rules type', async () => {
      // Mock directory listing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { name: 'my-rule', path: 'rules/my-rule', type: 'dir' },
        ]),
      });

      // Mock subdirectory with multiple .md files
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { name: 'README.md', path: 'rules/my-rule/README.md', type: 'file' },
          { name: 'RULE.md', path: 'rules/my-rule/RULE.md', type: 'file' },
        ]),
      });

      // Mock RULE.md content (should be selected as main)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`---
name: my-rule
---
# Rule`),
      });

      // Mock README.md content (sibling file)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# README'),
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
});
