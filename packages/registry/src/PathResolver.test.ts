import { describe, it, expect } from 'vitest';
import { PathResolver } from './PathResolver';

describe('PathResolver', () => {
  const resolver = new PathResolver();

  it('should resolve project skill path for claude-code', () => {
    const path = resolver.resolveAgentPath('claude-code', 'skills', 'project');
    expect(path).toBe('.claude/skills/');
  });

  it('should expand tilde in global paths', () => {
    const path = resolver.resolveAgentPath('claude-code', 'skills', 'global');
    expect(path).toMatch(/\/\.claude\/skills\/$/);
  });

  it('should throw error for unknown agent', () => {
    expect(() =>
      resolver.resolveAgentPath('unknown' as any, 'skills', 'project')
    ).toThrow('Unknown agent: unknown');
  });

  it('should return all agent keys', () => {
    const agents = resolver.getAllAgents();
    expect(agents).toHaveLength(6);
    expect(agents).toContain('claude-code');
    expect(agents).toContain('cursor');
  });
});
