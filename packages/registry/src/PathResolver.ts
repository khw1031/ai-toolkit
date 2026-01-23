import * as path from 'node:path';
import * as os from 'node:os';
import agentsData from '../data/agents.json' assert { type: 'json' };
import type { AgentKey, ResourceType, AgentRegistry } from './types';

const agents = agentsData as AgentRegistry;

export class PathResolver {
  /**
   * 에이전트별 경로를 반환합니다.
   * @param agent 에이전트 키
   * @param type 리소스 타입
   * @param scope project 또는 global
   * @returns 절대 경로
   */
  resolveAgentPath(
    agent: AgentKey,
    type: ResourceType,
    scope: 'project' | 'global'
  ): string {
    const agentConfig = agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }

    const basePath = agentConfig.paths[scope][type];
    return this.expandTilde(basePath);
  }

  /**
   * ~ 기호를 $HOME으로 치환합니다.
   */
  private expandTilde(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    return filePath;
  }

  /**
   * 모든 에이전트 목록을 반환합니다.
   */
  getAllAgents(): AgentKey[] {
    return Object.keys(agents) as AgentKey[];
  }

  /**
   * 에이전트 이름을 반환합니다.
   */
  getAgentName(agent: AgentKey): string {
    return agents[agent]?.name || agent;
  }
}
