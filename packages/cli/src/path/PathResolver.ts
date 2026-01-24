import { homedir } from 'os';
import { join } from 'path';
import { agents as agentsData } from '../data/agents.js';
import type { AgentKey, ResourceType, AgentConfig, AgentPaths } from '../types.js';

/**
 * PathResolver - Agent별 경로 해석 및 지원 타입 관리
 *
 * 주요 기능:
 * - Agent가 지원하는 리소스 타입 조회
 * - Agent별 설치 경로 해석 (project/global scope)
 * - 타입 지원 여부 확인
 */
export class PathResolver {
  private agents: Record<AgentKey, AgentConfig>;

  constructor() {
    this.agents = agentsData as Record<AgentKey, AgentConfig>;
  }

  /**
   * Agent가 지원하는 리소스 타입 목록 반환
   * @param agent - 대상 에이전트
   * @returns 지원하는 리소스 타입 배열
   */
  getSupportedTypes(agent: AgentKey): ResourceType[] {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      return [];
    }
    return agentConfig.supportedTypes;
  }

  /**
   * Agent별 설치 경로 해석
   * @param agent - 대상 에이전트
   * @param type - 리소스 타입
   * @param scope - 설치 범위 (project | global)
   * @returns 설치 경로 또는 null (미지원)
   */
  resolveAgentPath(
    agent: AgentKey,
    type: ResourceType,
    scope: 'project' | 'global'
  ): string | null {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }

    const paths = agentConfig.paths[scope];
    if (!paths) {
      throw new Error(`Unknown scope: ${scope}`);
    }

    const pathTemplate = paths[type as keyof AgentPaths];
    if (pathTemplate === null || pathTemplate === undefined) {
      return null;
    }

    return this.expandTilde(pathTemplate);
  }

  /**
   * 타입이 Agent에서 지원되는지 확인
   * @param agent - 대상 에이전트
   * @param type - 확인할 리소스 타입
   * @returns 지원 여부
   */
  isTypeSupported(agent: AgentKey, type: ResourceType): boolean {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      return false;
    }
    return agentConfig.supportedTypes.includes(type);
  }

  /**
   * 모든 Agent 목록 반환
   * @returns Agent 키 배열
   */
  getAgents(): AgentKey[] {
    return Object.keys(this.agents) as AgentKey[];
  }

  /**
   * Agent 설정 전체 반환
   * @param agent - 대상 에이전트
   * @returns Agent 설정 객체
   */
  getAgentConfig(agent: AgentKey): AgentConfig {
    const agentConfig = this.agents[agent];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agent}`);
    }
    return agentConfig;
  }

  /**
   * Agent 표시 이름 반환
   * @param agent - 대상 에이전트
   * @returns 표시용 이름
   */
  getAgentName(agent: AgentKey): string {
    return this.getAgentConfig(agent).name;
  }

  /**
   * ~ 를 $HOME으로 확장
   * @param path - 경로 문자열
   * @returns 확장된 경로
   */
  private expandTilde(path: string): string {
    if (path.startsWith('~/')) {
      return join(homedir(), path.slice(2));
    }
    return path;
  }
}

// 싱글톤 인스턴스 export
export const pathResolver = new PathResolver();
