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
