import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DuplicateHandler } from './DuplicateHandler';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

describe('DuplicateHandler', () => {
  const testDir = join(tmpdir(), 'ai-toolkit-duplicate-test');
  const handler = new DuplicateHandler();

  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('rename', () => {
    it('should create skill-2 for first rename', async () => {
      const originalPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(originalPath, 'Original content');

      const newPath = await handler.rename(originalPath, 'New content');

      expect(newPath).toContain('my-skill-2');
      expect(existsSync(newPath)).toBe(true);
      const content = await readFile(newPath, 'utf-8');
      expect(content).toBe('New content');
    });

    it('should increment number for multiple renames', async () => {
      const originalPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(originalPath, 'Original');

      const path2 = await handler.rename(originalPath, 'V2');
      const path3 = await handler.rename(originalPath, 'V3');

      expect(path2).toContain('my-skill-2');
      expect(path3).toContain('my-skill-3');
      expect(existsSync(path2)).toBe(true);
      expect(existsSync(path3)).toBe(true);

      const content2 = await readFile(path2, 'utf-8');
      const content3 = await readFile(path3, 'utf-8');
      expect(content2).toBe('V2');
      expect(content3).toBe('V3');
    });

    it('should preserve original file when renaming', async () => {
      const originalPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(originalPath, 'Original content');

      await handler.rename(originalPath, 'New content');

      // Original should still exist
      expect(existsSync(originalPath)).toBe(true);
      const originalContent = await readFile(originalPath, 'utf-8');
      expect(originalContent).toBe('Original content');
    });

    it('should handle skill with numbers in name', async () => {
      const originalPath = join(testDir, 'skill-v1', 'SKILL.md');
      await mkdir(join(testDir, 'skill-v1'), { recursive: true });
      await writeFile(originalPath, 'Original');

      const newPath = await handler.rename(originalPath, 'New');

      expect(newPath).toContain('skill-v1-2');
    });
  });

  describe('backup', () => {
    it('should create .backup file', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'Original content');

      const backupPath = await handler.backup(targetPath, 'New content');

      expect(backupPath).toBe(`${targetPath}.backup`);
      expect(existsSync(backupPath)).toBe(true);

      // Original should be overwritten
      const newContent = await readFile(targetPath, 'utf-8');
      expect(newContent).toBe('New content');

      // Backup should have original content
      const backupContent = await readFile(backupPath, 'utf-8');
      expect(backupContent).toBe('Original content');
    });

    it('should create numbered backups if .backup exists', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'V1');

      // First backup
      const backup1 = await handler.backup(targetPath, 'V2');
      expect(backup1).toBe(`${targetPath}.backup`);

      // Second backup - should create .backup.1
      const backup2 = await handler.backup(targetPath, 'V3');
      expect(backup2).toBe(`${targetPath}.backup.1`);

      // Third backup - should create .backup.2
      const backup3 = await handler.backup(targetPath, 'V4');
      expect(backup3).toBe(`${targetPath}.backup.2`);

      // Verify all backups exist with correct content
      expect(existsSync(`${targetPath}.backup`)).toBe(true);
      expect(existsSync(`${targetPath}.backup.1`)).toBe(true);
      expect(existsSync(`${targetPath}.backup.2`)).toBe(true);

      const content1 = await readFile(`${targetPath}.backup`, 'utf-8');
      const content2 = await readFile(`${targetPath}.backup.1`, 'utf-8');
      const content3 = await readFile(`${targetPath}.backup.2`, 'utf-8');
      expect(content1).toBe('V1');
      expect(content2).toBe('V2');
      expect(content3).toBe('V3');
    });

    it('should overwrite original after backup', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'Original');

      await handler.backup(targetPath, 'Updated');

      const currentContent = await readFile(targetPath, 'utf-8');
      expect(currentContent).toBe('Updated');
    });
  });

  describe('overwrite', () => {
    it('should replace file content', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'Original');

      await handler.overwrite(targetPath, 'New content');

      const content = await readFile(targetPath, 'utf-8');
      expect(content).toBe('New content');
    });

    it('should create file if not exists', async () => {
      const targetPath = join(testDir, 'new-skill', 'SKILL.md');

      await handler.overwrite(targetPath, 'New content');

      expect(existsSync(targetPath)).toBe(true);
      const content = await readFile(targetPath, 'utf-8');
      expect(content).toBe('New content');
    });
  });

  describe('skip', () => {
    it('should do nothing', async () => {
      const targetPath = join(testDir, 'my-skill', 'SKILL.md');
      await mkdir(join(testDir, 'my-skill'), { recursive: true });
      await writeFile(targetPath, 'Original');

      await handler.skip();

      // File should remain unchanged
      const content = await readFile(targetPath, 'utf-8');
      expect(content).toBe('Original');
    });
  });
});
