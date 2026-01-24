// PathResolver는 CLI 패키지로 이동됨 (packages/cli/src/path/PathResolver.ts)
// CLI에서 직접 import하여 사용: import { pathResolver } from './path/index.js'

export type {
  ResourceType,
  AgentKey,
  RegistryDirectory,
  AgentPaths,
  AgentConfig,
  AgentRegistry,
} from "./types";
export { default as agents } from "../data/agents.json";
