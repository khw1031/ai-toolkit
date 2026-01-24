import type { AgentRegistry } from '../types.js';

/**
 * Agent 설정 데이터
 * 각 AI 코딩 어시스턴트의 리소스 설치 경로 및 지원 타입 정의
 */
export const agents: AgentRegistry = {
  'claude-code': {
    name: 'Claude Code',
    supportedTypes: ['skills', 'rules', 'agents'],
    paths: {
      project: {
        skills: '.claude/skills/',
        rules: '.claude/rules/',
        agents: '.claude/agents/',
      },
      global: {
        skills: '~/.claude/skills/',
        rules: '~/.claude/rules/',
        agents: '~/.claude/agents/',
      },
    },
  },
  cursor: {
    name: 'Cursor',
    supportedTypes: ['skills', 'rules'],
    paths: {
      project: {
        skills: '.cursor/skills/',
        rules: '.cursor/rules/',
        agents: null,
      },
      global: {
        skills: '~/.cursor/skills/',
        rules: '~/.cursor/rules/',
        agents: null,
      },
    },
  },
  'github-copilot': {
    name: 'GitHub Copilot',
    supportedTypes: ['skills', 'rules'],
    paths: {
      project: {
        skills: '.github/skills/',
        rules: '.github/instructions/',
        agents: null,
      },
      global: {
        skills: '~/.copilot/skills/',
        rules: '~/.copilot/instructions/',
        agents: null,
      },
    },
  },
  antigravity: {
    name: 'Antigravity',
    supportedTypes: ['skills', 'rules'],
    paths: {
      project: {
        skills: '.agent/skills/',
        rules: '.agent/rules/',
        agents: null,
      },
      global: {
        skills: '~/.gemini/antigravity/skills/',
        rules: '~/.gemini/antigravity/rules/',
        agents: null,
      },
    },
  },
};

export default agents;
