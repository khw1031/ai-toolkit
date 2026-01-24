import inquirer from 'inquirer';
import type {
  AgentKey,
  RegistryDirectory,
  ResourceType,
  Resource,
  InteractiveResult,
} from '../types.js';
import { pathResolver } from '../path/PathResolver.js';
import { registryResolver } from '../source/RegistryResolver.js';
import type { BatchAction } from '../install/BatchHandler.js';

/**
 * InteractivePrompt - 새 플로우로 리팩토링
 *
 * 플로우: Agent → Directory → Type → Resources → Scope → Confirm
 *
 * - Agent별 지원 타입 필터링 (PathResolver 연동)
 * - Directory별 리소스 탐색 (RegistryResolver 연동)
 */
export class InteractivePrompt {
  /**
   * Interactive 플로우 실행
   */
  async run(): Promise<InteractiveResult> {
    console.log('Welcome to AI Toolkit!\n');

    // 1. Agent 선택
    const agent = await this.selectAgent();

    // 2. Directory 선택
    const directory = await this.selectDirectory();

    // 3. Type 선택 (Agent 지원 타입만)
    const types = await this.selectTypes(agent);

    // 4. Resources 선택
    const resources = await this.selectResources(directory, types);

    // 5. Scope 선택
    const scope = await this.selectScope();

    // 6. 확인
    const confirmed = await this.confirmInstallation(agent, resources, scope);

    if (!confirmed) {
      throw new Error('Installation cancelled');
    }

    return { agent, directory, types, resources, scope };
  }

  /**
   * Agent 선택
   * PathResolver를 사용하여 지원 Agent 목록 조회
   */
  async selectAgent(): Promise<AgentKey> {
    const agents = pathResolver.getAgents();

    const { agent } = await inquirer.prompt([
      {
        type: 'list',
        name: 'agent',
        message: 'Select target agent:',
        choices: agents.map((key) => ({
          name: pathResolver.getAgentConfig(key).name,
          value: key,
        })),
      },
    ]);

    return agent;
  }

  /**
   * Directory 선택
   * RegistryResolver를 사용하여 사용 가능한 디렉토리 조회
   */
  async selectDirectory(): Promise<RegistryDirectory> {
    const directories = registryResolver.getDirectories();

    const directoryDescriptions: Record<RegistryDirectory, string> = {
      common: 'Common - General purpose resources',
      frontend: 'Frontend - React, Vue, etc.',
      app: 'App - Mobile, Desktop apps',
    };

    const { directory } = await inquirer.prompt([
      {
        type: 'list',
        name: 'directory',
        message: 'Select resource directory:',
        choices: directories.map((dir) => ({
          name: directoryDescriptions[dir],
          value: dir,
        })),
      },
    ]);

    return directory;
  }

  /**
   * Type 선택 (Agent 지원 타입만 표시)
   * PathResolver.getSupportedTypes()를 사용하여 Agent별 지원 타입 필터링
   */
  async selectTypes(agent: AgentKey): Promise<ResourceType[]> {
    const supportedTypes = pathResolver.getSupportedTypes(agent);

    const typeDescriptions: Record<ResourceType, string> = {
      skills: 'Skills - Reusable prompts and instructions',
      rules: 'Rules - Project guidelines and standards',
      commands: 'Commands - Custom slash commands',
      agents: 'Agents - Specialized agent configurations',
    };

    const { types } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'types',
        message: `Select resource types (${pathResolver.getAgentConfig(agent).name} supports):`,
        choices: supportedTypes.map((type) => ({
          name: typeDescriptions[type],
          value: type,
          checked: type === 'skills', // skills 기본 선택
        })),
        validate: (input: ResourceType[]) => {
          if (input.length === 0) {
            return 'Please select at least one type';
          }
          return true;
        },
      },
    ]);

    return types;
  }

  /**
   * Resources 선택
   * RegistryResolver.resolve()를 사용하여 디렉토리별 리소스 탐색
   */
  async selectResources(
    directory: RegistryDirectory,
    types: ResourceType[]
  ): Promise<Resource[]> {
    const availableResources = await registryResolver.resolve(directory, types);

    if (availableResources.length === 0) {
      console.log('\nNo resources found in selected directory/types.');
      return [];
    }

    const { resources } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'resources',
        message: 'Select resources to install:',
        choices: availableResources.map((r) => ({
          name: `[${r.type}] ${r.name} - ${r.description || 'No description'}`,
          value: r,
        })),
        validate: (input: Resource[]) => {
          if (input.length === 0) {
            return 'Please select at least one resource';
          }
          return true;
        },
      },
    ]);

    return resources;
  }

  /**
   * Scope 선택
   */
  async selectScope(): Promise<'project' | 'global'> {
    const { scope } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scope',
        message: 'Select installation scope:',
        choices: [
          { name: 'Project - Install in current directory', value: 'project' },
          { name: 'Global - Install in home directory', value: 'global' },
        ],
        default: 'project',
      },
    ]);

    return scope;
  }

  /**
   * 설치 확인
   * 설치 요약 정보를 표시하고 사용자 확인을 받음
   */
  async confirmInstallation(
    agent: AgentKey,
    resources: Resource[],
    scope: 'project' | 'global'
  ): Promise<boolean> {
    console.log('\n--- Installation Summary ---');
    console.log(`Agent: ${pathResolver.getAgentConfig(agent).name}`);
    console.log(`Scope: ${scope}`);
    console.log(`Resources (${resources.length}):`);
    resources.forEach((r) => {
      const targetPath = pathResolver.resolveAgentPath(agent, r.type, scope);
      console.log(`  - [${r.type}] ${r.name} → ${targetPath || 'Not supported'}`);
    });
    console.log('');

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with installation?',
        default: true,
      },
    ]);

    return confirmed;
  }

  /**
   * Handle single duplicate
   * 레거시 코드 호환성을 위해 유지
   */
  async handleDuplicate(
    resourceName: string
  ): Promise<'skip' | 'overwrite' | 'rename' | 'backup' | 'compare'> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `"${resourceName}" already exists. What do you want to do?`,
        choices: [
          { name: 'Skip - Keep existing file', value: 'skip' },
          { name: 'Overwrite - Replace with new version', value: 'overwrite' },
          { name: 'Rename - Save as new (e.g., skill-2)', value: 'rename' },
          { name: 'Backup - Backup existing and overwrite', value: 'backup' },
          { name: 'Compare - View differences first', value: 'compare' },
        ],
      },
    ]);
    return action;
  }

  /**
   * Handle batch duplicates - prompt for action to apply to all duplicates
   * 레거시 코드 호환성을 위해 유지
   *
   * @param duplicateCount - Number of duplicate files detected
   * @returns The batch action to apply
   */
  async handleBatchDuplicates(duplicateCount: number): Promise<BatchAction> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `${duplicateCount} files already exist. How do you want to handle them?`,
        choices: [
          { name: 'Ask for each file', value: 'ask-each' },
          { name: 'Skip all - Keep all existing files', value: 'skip-all' },
          { name: 'Overwrite all - Replace all with new versions', value: 'overwrite-all' },
          { name: 'Backup all - Backup existing and install new', value: 'backup-all' },
        ],
      },
    ]);

    return action;
  }
}

// Singleton instance export
export const interactivePrompt = new InteractivePrompt();
