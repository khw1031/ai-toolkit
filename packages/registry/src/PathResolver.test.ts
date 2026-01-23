import { describe, it, expect } from 'vitest';
import { PathResolver } from './PathResolver';
import { homedir } from 'os';
import { join } from 'path';

describe('PathResolver', () => {
  const resolver = new PathResolver();

  describe('resolveAgentPath', () => {
    it('should resolve project path', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'project');
      expect(path).toBe('.claude/skills/');
    });

    it('should resolve global path with tilde expansion', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'global');
      expect(path).toBe(join(homedir(), '.claude/skills/'));
    });

    it('should resolve different resource types', () => {
      const skillsPath = resolver.resolveAgentPath('cursor', 'skill', 'project');
      const rulesPath = resolver.resolveAgentPath('cursor', 'rule', 'project');
      expect(skillsPath).toBe('.cursor/skills/');
      expect(rulesPath).toBe('.cursor/rules/');
    });

    it('should throw error for unknown agent', () => {
      expect(() => {
        resolver.resolveAgentPath('unknown' as any, 'skill', 'project');
      }).toThrow('Unknown agent: unknown');
    });

    it('should throw error for unknown scope', () => {
      expect(() => {
        resolver.resolveAgentPath('claude-code', 'skill', 'invalid' as any);
      }).toThrow('Unknown scope: invalid');
    });
  });

  describe('getSupportedAgents', () => {
    it('should return all supported agents', () => {
      const agents = resolver.getSupportedAgents();
      expect(agents).toContain('claude-code');
      expect(agents).toContain('cursor');
      expect(agents).toContain('antigravity');
      expect(agents.length).toBe(6);
    });
  });

  describe('getAgentName', () => {
    it('should return agent display name', () => {
      const name = resolver.getAgentName('claude-code');
      expect(name).toBe('Claude Code');
    });

    it('should throw error for unknown agent', () => {
      expect(() => {
        resolver.getAgentName('unknown' as any);
      }).toThrow('Unknown agent: unknown');
    });
  });

  describe('expandTilde', () => {
    it('should expand tilde for global paths', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'global');
      expect(path).toContain(homedir());
      expect(path).not.toContain('~');
    });

    it('should not expand non-tilde paths', () => {
      const path = resolver.resolveAgentPath('claude-code', 'skill', 'project');
      expect(path).toBe('.claude/skills/');
    });
  });
});
