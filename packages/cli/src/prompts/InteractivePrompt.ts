import inquirer from 'inquirer';
import { PathResolver } from '@ai-toolkit/registry';
import type { ResourceType, AgentKey, Resource } from '../types';
import type { BatchAction } from '../install/BatchHandler';

export interface InteractiveResult {
  type: ResourceType;
  source: string;
  resources: Resource[];
  agents: AgentKey[];
  scope: 'project' | 'global';
}

export class InteractivePrompt {
  private pathResolver: PathResolver;

  constructor() {
    this.pathResolver = new PathResolver();
  }

  /**
   * Run interactive prompts
   */
  async run(): Promise<InteractiveResult> {
    console.log('Welcome to AI Toolkit!\n');

    const type = await this.selectType();
    const source = await this.selectSource();
    const agents = await this.selectAgents();
    const scope = await this.selectScope();

    return {
      type,
      source,
      resources: [], // Will be populated after source resolution
      agents,
      scope,
    };
  }

  /**
   * Select resource type
   */
  async selectType(): Promise<ResourceType> {
    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What do you want to install?',
        choices: [
          { name: 'Skills - AI agent capabilities', value: 'skill' },
          { name: 'Rules - Coding guidelines', value: 'rule' },
          { name: 'Commands - CLI commands', value: 'command' },
          { name: 'Agents - Agent configurations', value: 'agent' },
        ],
      },
    ]);
    return type;
  }

  /**
   * Select source
   */
  async selectSource(): Promise<string> {
    const { sourceType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'sourceType',
        message: 'Where do you want to install from?',
        choices: [
          { name: 'GitHub repository', value: 'github' },
          { name: 'Local directory', value: 'local' },
          { name: 'Bitbucket repository', value: 'bitbucket' },
          { name: 'Direct URL', value: 'url' },
        ],
      },
    ]);

    const { source } = await inquirer.prompt([
      {
        type: 'input',
        name: 'source',
        message: this.getSourcePromptMessage(sourceType),
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Source cannot be empty';
          }
          return true;
        },
      },
    ]);

    return source;
  }

  /**
   * Get source prompt message
   */
  private getSourcePromptMessage(sourceType: string): string {
    const messages: Record<string, string> = {
      github: 'Enter GitHub repository (owner/repo):',
      bitbucket: 'Enter Bitbucket repository (owner/repo):',
      local: 'Enter local directory path:',
      url: 'Enter direct URL to resource file:',
    };
    return messages[sourceType] || 'Enter source:';
  }

  /**
   * Select resources from list
   */
  async selectResources(resources: Resource[]): Promise<Resource[]> {
    if (resources.length === 0) {
      console.log('\nNo resources found in the source.');
      return [];
    }

    const { selectedResources } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedResources',
        message: 'Select resources to install:',
        choices: resources.map((r) => ({
          name: `${r.name}${r.description ? ` - ${r.description}` : ''}`,
          value: r,
          checked: false,
        })),
        validate: (input: Resource[]) => {
          if (input.length === 0) {
            return 'You must select at least one resource';
          }
          return true;
        },
      },
    ]);

    return selectedResources;
  }

  /**
   * Select agents
   */
  async selectAgents(): Promise<AgentKey[]> {
    const allAgents = this.pathResolver.getSupportedAgents();

    const { agents } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'agents',
        message: 'Select agents to install for:',
        choices: allAgents.map((key) => ({
          name: this.pathResolver.getAgentName(key),
          value: key,
          checked: false,
        })),
        validate: (input: AgentKey[]) => {
          if (input.length === 0) {
            return 'You must select at least one agent';
          }
          return true;
        },
      },
    ]);

    return agents;
  }

  /**
   * Select scope
   */
  async selectScope(): Promise<'project' | 'global'> {
    const { scope } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scope',
        message: 'Where do you want to install?',
        choices: [
          {
            name: 'Project - Current directory (.claude/, .cursor/, etc.)',
            value: 'project',
          },
          {
            name: 'Global - User home directory (~/.claude/, ~/.cursor/, etc.)',
            value: 'global',
          },
        ],
      },
    ]);
    return scope;
  }

  /**
   * Handle single duplicate
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
   *
   * When multiple files already exist, this allows the user to choose
   * a single action to apply to all of them instead of prompting for each.
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

  /**
   * Confirm installation
   *
   * @param resourceCount - Number of resources to install
   * @param agentCount - Number of agents to install for
   * @returns true if user confirms, false otherwise
   */
  async confirmInstallation(
    resourceCount: number,
    agentCount: number
  ): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Install ${resourceCount} resource(s) for ${agentCount} agent(s)?`,
        default: true,
      },
    ]);

    return confirmed;
  }
}
