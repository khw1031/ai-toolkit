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

    it('should remove .git extension from repo name', async () => {
      const resolver = new GitHubResolver();
      const parsed = (resolver as any).parseSource(
        'https://github.com/owner/repo.git'
      );
      expect(parsed.repo).toBe('repo');
    });

    it('should throw error for invalid source', async () => {
      const resolver = new GitHubResolver();
      expect(() => {
        (resolver as any).parseSource('invalid-source');
      }).toThrow('Invalid GitHub source');
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

  describe('filterByType', () => {
    it('should filter nodes by resource type', () => {
      const resolver = new GitHubResolver();
      const tree = [
        { path: 'SKILL.md', type: 'blob' as const, sha: '123' },
        { path: 'skills/commit/SKILL.md', type: 'blob' as const, sha: '456' },
        { path: 'README.md', type: 'blob' as const, sha: '789' },
        { path: 'deep/nested/path/more/SKILL.md', type: 'blob' as const, sha: 'abc' },
      ];

      const filtered = (resolver as any).filterByType(tree, 'skill');

      // Should include root and nested, but not too deep
      expect(filtered).toHaveLength(2);
      expect(filtered.some((n: any) => n.path === 'SKILL.md')).toBe(true);
      expect(filtered.some((n: any) => n.path === 'skills/commit/SKILL.md')).toBe(true);
      expect(filtered.some((n: any) => n.path === 'deep/nested/path/more/SKILL.md')).toBe(false);
    });

    it('should exclude tree nodes', () => {
      const resolver = new GitHubResolver();
      const tree = [
        { path: 'SKILL.md', type: 'blob' as const, sha: '123' },
        { path: 'skills', type: 'tree' as const, sha: '456' },
      ];

      const filtered = (resolver as any).filterByType(tree, 'skill');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].path).toBe('SKILL.md');
    });
  });
});
