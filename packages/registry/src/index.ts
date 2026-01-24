import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export { PathResolver } from './PathResolver';
export type {
  ResourceType,
  AgentKey,
  AgentPaths,
  AgentConfig,
  AgentRegistry,
} from './types';
export { default as agents } from '../data/agents.json';

/**
 * Get the path to the bundled resources directory
 * Used as default source when --source is not specified
 */
export function getResourcesPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, '../resources');
}
