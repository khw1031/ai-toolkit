import { homedir } from 'os';
import { join } from 'path';
import agents from '../data/agents.json';
import type { AgentKey, ResourceType, AgentConfig } from './types';

export class PathResolver {
  private agents: Record<AgentKey, AgentConfig>;

  constructor() {
    this.agents = agents as Record<AgentKey, AgentConfig>;
  }

  /**
   * Resolve agent path
   * @param agent - Agent key (claude-code, cursor, etc.)
   * @param type - Resource type (skill, rule, command, agent)
   * @param scope - Install scope (project, global)
   * @returns Resolved path
   */
  resolveAgentPath(
    agent: AgentKey,
    type: ResourceType,
    scope: 'project' | 'global'
  ): string {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }

    const paths = agentConfig.paths[scope];
    if (!paths) {
      throw new Error(`Unknown scope: ${scope}`);
    }

    // Map singular type to plural property name
    const typeMap: Record<ResourceType, keyof typeof paths> = {
      skill: 'skills',
      rule: 'rules',
      command: 'commands',
      agent: 'agents',
    };

    const pathTemplate = paths[typeMap[type]];
    if (!pathTemplate) {
      throw new Error(`Unknown resource type: ${type}`);
    }

    return this.expandTilde(pathTemplate);
  }

  /**
   * Get all supported agents
   */
  getSupportedAgents(): AgentKey[] {
    return Object.keys(this.agents) as AgentKey[];
  }

  /**
   * Get agent display name
   */
  getAgentName(agent: AgentKey): string {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }
    return agentConfig.name;
  }

  /**
   * Expand ~ to $HOME
   */
  private expandTilde(path: string): string {
    if (path.startsWith('~/')) {
      return join(homedir(), path.slice(2));
    }
    return path;
  }
}
