import { describe, it, expect } from 'vitest';
import { ResourceParser } from './ResourceParser';
import type { SourceFile } from '../types';

describe('ResourceParser', () => {
  const parser = new ResourceParser();

  describe('parseResource', () => {
    it('should parse resource with YAML frontmatter', () => {
      const file: SourceFile = {
        path: 'skills/commit/SKILL.md',
        content: `---
name: commit
description: Create git commits
author: AI Toolkit
version: 1.0.0
license: MIT
category: git
---

# Commit Skill

This is a commit skill.`,
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');

      expect(resource.name).toBe('commit');
      expect(resource.description).toBe('Create git commits');
      expect(resource.type).toBe('skill');
      expect(resource.metadata.author).toBe('AI Toolkit');
      expect(resource.metadata.version).toBe('1.0.0');
      expect(resource.metadata.license).toBe('MIT');
      expect(resource.metadata.category).toBe('git');
    });

    it('should extract name from path if not in frontmatter', () => {
      const file: SourceFile = {
        path: 'skills/my-skill/SKILL.md',
        content: '# My Skill\n\nNo frontmatter',
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.name).toBe('my-skill');
    });

    it('should detect type from filename', () => {
      const file: SourceFile = {
        path: 'rules/code-style/RULES.md',
        content: '---\nname: code-style\n---\nRules',
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.type).toBe('rule'); // Detected from filename
    });

    it('should handle missing frontmatter', () => {
      const file: SourceFile = {
        path: 'skills/test/SKILL.md',
        content: '# Test Skill\n\nNo YAML',
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.name).toBe('test');
      expect(resource.description).toBe('');
    });

    it('should handle malformed YAML gracefully', () => {
      const file: SourceFile = {
        path: 'skills/bad/SKILL.md',
        content: `---
invalid: yaml: : :
---
Content`,
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.name).toBe('bad');
    });
  });

  describe('parseResources', () => {
    it('should parse multiple files', () => {
      const files: SourceFile[] = [
        {
          path: 'skills/skill1/SKILL.md',
          content: '---\nname: skill1\n---\nSkill 1',
          isDirectory: false,
        },
        {
          path: 'skills/skill2/SKILL.md',
          content: '---\nname: skill2\n---\nSkill 2',
          isDirectory: false,
        },
      ];

      const resources = parser.parseResources(files, 'skill');
      expect(resources.length).toBe(2);
      expect(resources[0].name).toBe('skill1');
      expect(resources[1].name).toBe('skill2');
    });
  });

  describe('extractNameFromPath', () => {
    it('should extract from directory name', () => {
      const name = (parser as any).extractNameFromPath(
        'skills/commit/SKILL.md'
      );
      expect(name).toBe('commit');
    });

    it('should skip type directories', () => {
      const name = (parser as any).extractNameFromPath('skills/SKILL.md');
      expect(name).toBe('skill'); // Fallback to filename
    });

    it('should handle nested paths', () => {
      const name = (parser as any).extractNameFromPath(
        'repo/skills/my-skill/SKILL.md'
      );
      expect(name).toBe('my-skill');
    });
  });
});
