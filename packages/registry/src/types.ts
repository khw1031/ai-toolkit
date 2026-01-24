// 리소스 타입 (복수형으로 통일)
export type ResourceType = 'skills' | 'rules' | 'commands' | 'agents';

// 지원하는 Agent 키 (4개로 제한)
export type AgentKey = 'claude-code' | 'cursor' | 'github-copilot' | 'antigravity';

// Registry 디렉토리 타입
export type RegistryDirectory = 'common' | 'frontend' | 'app';

// Agent 경로 정의
export interface AgentPaths {
  skills: string;
  rules: string;
  commands: string | null;  // null = 미지원
  agents: string | null;    // null = 미지원
}

// Agent 설정
export interface AgentConfig {
  name: string;
  supportedTypes: ResourceType[];
  paths: {
    project: AgentPaths;
    global: AgentPaths;
  };
}

// Agent Registry 타입
export type AgentRegistry = Record<AgentKey, AgentConfig>;
