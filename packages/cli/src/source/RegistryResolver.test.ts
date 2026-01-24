import { describe, it, expect, beforeAll } from 'vitest';
import { RegistryResolver } from './RegistryResolver';

describe('RegistryResolver', () => {
  let resolver: RegistryResolver;

  beforeAll(() => {
    resolver = new RegistryResolver();
  });

  describe('constructor', () => {
    it('should initialize with valid registry path', () => {
      const registryPath = resolver.getRegistryPath();
      expect(registryPath).toBeDefined();
      expect(registryPath).toContain('registry/resources');
    });
  });

  describe('getDirectories', () => {
    it('should return 3 directories', () => {
      const directories = resolver.getDirectories();
      expect(directories).toHaveLength(3);
      expect(directories).toEqual(['common', 'frontend', 'app']);
    });
  });

  describe('resolve', () => {
    it('should find hello-world skill in common/skills', async () => {
      const resources = await resolver.resolve('common', ['skills']);

      expect(resources.length).toBeGreaterThanOrEqual(1);

      const helloWorld = resources.find(r => r.name === 'hello-world');
      expect(helloWorld).toBeDefined();
      expect(helloWorld?.type).toBe('skill');
      expect(helloWorld?.description).toBe('A simple hello world skill for testing');
    });

    it('should return empty array for directory with only .gitkeep', async () => {
      const resources = await resolver.resolve('common', ['agents']);
      expect(resources).toEqual([]);
    });

    it('should return empty array for non-existent type directory', async () => {
      const resources = await resolver.resolve('frontend', ['agents']);
      expect(resources).toEqual([]);
    });

    it('should handle multiple types at once', async () => {
      const resources = await resolver.resolve('common', ['skills', 'rules', 'commands', 'agents']);

      // At minimum, should find hello-world skill
      expect(resources.length).toBeGreaterThanOrEqual(1);
      expect(resources.some(r => r.name === 'hello-world')).toBe(true);
    });
  });

  describe('getResourcePath', () => {
    it('should return correct path for hello-world', () => {
      const path = resolver.getResourcePath('common', 'skills', 'hello-world');

      expect(path).toContain('common/skills/hello-world');
      expect(path).toContain('registry/resources');
    });

    it('should return correct path for different directory/type combinations', () => {
      const frontendSkill = resolver.getResourcePath('frontend', 'skills', 'test-skill');
      expect(frontendSkill).toContain('frontend/skills/test-skill');

      const appRule = resolver.getResourcePath('app', 'rules', 'test-rule');
      expect(appRule).toContain('app/rules/test-rule');
    });
  });

  describe('resourceExists', () => {
    it('should return true for existing hello-world skill', () => {
      const exists = resolver.resourceExists('common', 'skills', 'hello-world');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent resource', () => {
      const exists = resolver.resourceExists('common', 'skills', 'non-existent-skill');
      expect(exists).toBe(false);
    });

    it('should return false for resource in .gitkeep-only directory', () => {
      const exists = resolver.resourceExists('common', 'agents', 'any-agent');
      expect(exists).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty types array', async () => {
      const resources = await resolver.resolve('common', []);
      expect(resources).toEqual([]);
    });

    it('should skip hidden directories', async () => {
      // This tests that .gitkeep and other hidden files are properly ignored
      const resources = await resolver.resolve('common', ['skills']);

      // No resource should have a name starting with '.'
      resources.forEach(r => {
        expect(r.name.startsWith('.')).toBe(false);
      });
    });
  });
});
