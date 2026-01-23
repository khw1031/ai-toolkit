import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InstallManager } from './InstallManager';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { InstallRequest, Resource } from '../types';

describe('InstallManager', () => {
  const testDir = join(tmpdir(), 'ai-toolkit-install-test');
  const manager = new InstallManager();

  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('install', () => {
    it('should create new file', async () => {
      const resource: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test skill',
        path: 'test/SKILL.md',
        content: '---\nname: test-skill\n---\nTest',
        metadata: {},
      };

      const request: InstallRequest = {
        resource,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      const results = await manager.install([request]);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].action).toBe('created');
      expect(results[0].path).toContain('test-skill');

      // Verify file was created
      const createdContent = await readFile(results[0].path, 'utf-8');
      expect(createdContent).toBe(resource.content);
    });

    it('should skip duplicate with same content', async () => {
      const content = '---\nname: test\n---\nTest';
      const resource: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content,
        metadata: {},
      };

      const request: InstallRequest = {
        resource,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      // Install first time
      const firstResults = await manager.install([request]);
      expect(firstResults[0].action).toBe('created');

      // Install second time (same content)
      const results = await manager.install([request]);

      expect(results[0].action).toBe('skipped');
      expect(results[0].success).toBe(true);
    });

    it('should skip duplicate when onDuplicate=skip', async () => {
      const resource1: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content: '---\nname: test\n---\nOriginal',
        metadata: {},
      };

      const resource2: Resource = {
        ...resource1,
        content: '---\nname: test\n---\nModified',
      };

      const request1: InstallRequest = {
        resource: resource1,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      const request2: InstallRequest = {
        resource: resource2,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      };

      await manager.install([request1]);
      const results = await manager.install([request2]);

      expect(results[0].action).toBe('skipped');
      expect(results[0].success).toBe(true);

      // Verify original content is preserved
      const existingContent = await readFile(results[0].path, 'utf-8');
      expect(existingContent).toBe(resource1.content);
    });

    it('should overwrite when onDuplicate=overwrite', async () => {
      const resource1: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content: '---\nname: test\n---\nOriginal',
        metadata: {},
      };

      const resource2: Resource = {
        ...resource1,
        content: '---\nname: test\n---\nModified',
      };

      const request1: InstallRequest = {
        resource: resource1,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'overwrite',
      };

      const request2: InstallRequest = {
        resource: resource2,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'overwrite',
      };

      await manager.install([request1]);
      const results = await manager.install([request2]);

      expect(results[0].action).toBe('overwritten');
      expect(results[0].success).toBe(true);

      // Verify content was updated
      const newContent = await readFile(results[0].path, 'utf-8');
      expect(newContent).toBe(resource2.content);
    });

    it('should fail when onDuplicate=fail', async () => {
      const resource1: Resource = {
        name: 'test-skill',
        type: 'skill',
        description: 'Test',
        path: 'test/SKILL.md',
        content: '---\nname: test\n---\nOriginal',
        metadata: {},
      };

      const resource2: Resource = {
        ...resource1,
        content: '---\nname: test\n---\nModified', // Different content
      };

      const request1: InstallRequest = {
        resource: resource1,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'fail',
      };

      const request2: InstallRequest = {
        resource: resource2,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'fail',
      };

      await manager.install([request1]);
      const results = await manager.install([request2]);

      expect(results[0].success).toBe(false);
      expect(results[0].action).toBe('failed');
      expect(results[0].error).toContain('already exists');
    });

    it('should handle multiple resources', async () => {
      const resources: Resource[] = [
        {
          name: 'skill1',
          type: 'skill',
          description: 'Skill 1',
          path: 'skill1/SKILL.md',
          content: '---\nname: skill1\n---\nSkill 1',
          metadata: {},
        },
        {
          name: 'skill2',
          type: 'skill',
          description: 'Skill 2',
          path: 'skill2/SKILL.md',
          content: '---\nname: skill2\n---\nSkill 2',
          metadata: {},
        },
      ];

      const requests: InstallRequest[] = resources.map((resource) => ({
        resource,
        agent: 'claude-code',
        scope: 'project',
        onDuplicate: 'skip',
      }));

      const results = await manager.install(requests);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[0].action).toBe('created');
      expect(results[1].success).toBe(true);
      expect(results[1].action).toBe('created');
    });
  });
});
