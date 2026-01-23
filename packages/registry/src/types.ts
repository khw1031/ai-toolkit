export type ResourceType = 'skills' | 'rules' | 'commands' | 'agents';

export type AgentKey =
  | 'claude-code'
  | 'cursor'
  | 'antigravity'
  | 'gemini-cli'
  | 'github-copilot'
  | 'opencode';

export interface AgentPaths {
  skills: string;
  rules: string;
  commands: string;
  agents: string;
}

export interface AgentConfig {
  name: string;
  paths: {
    project: AgentPaths;
    global: AgentPaths;
  };
}

export type AgentRegistry = Record<AgentKey, AgentConfig>;
