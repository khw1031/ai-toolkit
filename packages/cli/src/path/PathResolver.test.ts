import { describe, it, expect, beforeEach } from 'vitest';
import { homedir } from 'os';
import { join } from 'path';
import { PathResolver } from './PathResolver.js';

describe('PathResolver', () => {
  let resolver: PathResolver;

  beforeEach(() => {
    resolver = new PathResolver();
  });

  describe('getSupportedTypes', () => {
    it('claude-code는 skills, rules, agents 지원', () => {
      expect(resolver.getSupportedTypes('claude-code')).toEqual([
        'skills',
        'rules',
        'agents',
      ]);
    });

    it('github-copilot은 skills, rules만 지원', () => {
      expect(resolver.getSupportedTypes('github-copilot')).toEqual([
        'skills',
        'rules',
      ]);
    });

    it('cursor는 skills, rules 지원', () => {
      expect(resolver.getSupportedTypes('cursor')).toEqual([
        'skills',
        'rules',
      ]);
    });

    it('antigravity는 skills, rules 지원', () => {
      expect(resolver.getSupportedTypes('antigravity')).toEqual([
        'skills',
        'rules',
      ]);
    });
  });

  describe('resolveAgentPath', () => {
    it('claude-code skills project 경로', () => {
      expect(resolver.resolveAgentPath('claude-code', 'skills', 'project')).toBe(
        '.claude/skills/'
      );
    });

    it('claude-code skills global 경로 (~ 확장)', () => {
      expect(resolver.resolveAgentPath('claude-code', 'skills', 'global')).toBe(
        join(homedir(), '.claude/skills/')
      );
    });

    it('github-copilot rules는 instructions 경로', () => {
      expect(
        resolver.resolveAgentPath('github-copilot', 'rules', 'project')
      ).toBe('.github/instructions/');
    });

    it('cursor agents는 null', () => {
      expect(resolver.resolveAgentPath('cursor', 'agents', 'project')).toBeNull();
    });

    it('antigravity agents는 null', () => {
      expect(
        resolver.resolveAgentPath('antigravity', 'agents', 'project')
      ).toBeNull();
    });
  });

  describe('isTypeSupported', () => {
    it('claude-code는 skills, rules, agents 지원', () => {
      expect(resolver.isTypeSupported('claude-code', 'skills')).toBe(true);
      expect(resolver.isTypeSupported('claude-code', 'rules')).toBe(true);
      expect(resolver.isTypeSupported('claude-code', 'agents')).toBe(true);
    });

    it('github-copilot은 agents 미지원', () => {
      expect(resolver.isTypeSupported('github-copilot', 'skills')).toBe(true);
      expect(resolver.isTypeSupported('github-copilot', 'rules')).toBe(true);
      expect(resolver.isTypeSupported('github-copilot', 'agents')).toBe(false);
    });

    it('antigravity는 agents 미지원', () => {
      expect(resolver.isTypeSupported('antigravity', 'agents')).toBe(false);
    });

    it('cursor는 agents 미지원', () => {
      expect(resolver.isTypeSupported('cursor', 'agents')).toBe(false);
    });
  });

  describe('getAgents', () => {
    it('4개의 에이전트 반환', () => {
      const agents = resolver.getAgents();
      expect(agents).toHaveLength(4);
      expect(agents).toContain('claude-code');
      expect(agents).toContain('cursor');
      expect(agents).toContain('github-copilot');
      expect(agents).toContain('antigravity');
    });
  });

  describe('getAgentConfig', () => {
    it('claude-code 설정 반환', () => {
      const config = resolver.getAgentConfig('claude-code');
      expect(config.name).toBe('Claude Code');
      expect(config.supportedTypes).toEqual([
        'skills',
        'rules',
        'agents',
      ]);
    });

    it('존재하지 않는 agent는 에러', () => {
      expect(() =>
        resolver.getAgentConfig('unknown' as any)
      ).toThrow('Unknown agent: unknown');
    });
  });

  describe('getAgentName', () => {
    it('agent별 표시 이름 반환', () => {
      expect(resolver.getAgentName('claude-code')).toBe('Claude Code');
      expect(resolver.getAgentName('cursor')).toBe('Cursor');
      expect(resolver.getAgentName('github-copilot')).toBe('GitHub Copilot');
      expect(resolver.getAgentName('antigravity')).toBe('Antigravity');
    });
  });
});
