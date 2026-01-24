import { Command as Commander } from 'commander';
import { getResourcesPath } from '@ai-toolkit/registry';
import type { Command, AgentKey, Resource } from '../types';
import { Logger } from '../utils/Logger';
import { InteractivePrompt } from '../prompts/InteractivePrompt';
import { GitHubResolver } from '../source/GitHubResolver';
import { LocalResolver } from '../source/LocalResolver';
// Phase2: import { BitbucketResolver } from '../source/BitbucketResolver';
import { URLResolver } from '../source/URLResolver';
import { ResourceParser } from '../parser/ResourceParser';
import { InstallManager, type InstallRequest } from '../install/InstallManager';

export class CommandHandler {
  private program: Commander;
  private logger: Logger;

  constructor() {
    this.program = new Commander();
    this.logger = new Logger();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('ai-toolkit')
      .description('Universal AI agent resource installer')
      .version('0.1.0');

    // Type flags
    this.program.option('--skills', 'Install skills');
    this.program.option('--rules', 'Install rules');
    this.program.option('--commands', 'Install commands');
    this.program.option('--agents-resource', 'Install agents');

    // Source and options
    this.program.option('--source <source>', 'Source (GitHub owner/repo, local path, URL)');
    this.program.option(
      '--on-duplicate <action>',
      'Duplicate handling (skip|overwrite|rename|backup|fail)'
    );
    this.program.option('--yes', 'Auto overwrite (non-interactive)');
    this.program.option('--scope <scope>', 'Install scope (project|global)');
    this.program.option('--agents <agents>', 'Comma-separated agent list');
  }

  async run(argv: string[]): Promise<void> {
    try {
      this.logger.displayWelcome();

      this.program.parse(argv);
      const options = this.program.opts();

      const command = this.parseCommand(options);

      // Route to interactive or non-interactive
      if (this.isInteractive(command)) {
        await this.runInteractive(command);
      } else {
        this.logger.info('Non-interactive mode');
        await this.runNonInteractive(command);
      }

      this.logger.displayCompletion();
    } catch (error: any) {
      this.logger.error(error.message);
      process.exit(1);
    }
  }

  private parseCommand(options: any): Command {
    const command: Command = {};

    // Parse type
    if (options.skills) command.type = 'skill';
    else if (options.rules) command.type = 'rule';
    else if (options.commands) command.type = 'command';
    else if (options.agentsResource) command.type = 'agent';

    // Parse other options
    if (options.source) command.source = options.source;
    if (options.onDuplicate) command.onDuplicate = options.onDuplicate;
    if (options.yes) {
      command.yes = true;
      command.onDuplicate = 'overwrite';
    }
    if (options.scope) command.scope = options.scope;
    if (options.agents) {
      command.agents = options.agents.split(',').map((a: string) => a.trim());
    }

    return command;
  }

  private isInteractive(command: Command): boolean {
    // Interactive if no type or agents specified
    // (source is optional - defaults to registry)
    return !command.type || !command.agents || command.agents.length === 0;
  }

  private async runInteractive(_command: Command): Promise<void> {
    const prompt = new InteractivePrompt();
    const result = await prompt.run();

    // Resolve source
    const sourceType = this.detectSourceType(result.source);
    const resolver =
      sourceType === 'github' ? new GitHubResolver() : new LocalResolver();

    this.logger.info(`Resolving source: ${result.source}`);
    const sourceFiles = await resolver.resolve(result.source, result.type);

    // Parse resources
    const parser = new ResourceParser();
    const resources = parser.parseResources(sourceFiles, result.type);

    // Let user select resources
    const selectedResources = await prompt.selectResources(resources);

    this.logger.success(
      `Selected ${selectedResources.length} resources for ${result.agents.length} agents`
    );
    this.logger.info('Installation will be implemented in subsequent tasks');
  }

  private detectSourceType(
    source: string
  ): 'github' | 'local' | 'url' {
    // Phase2: Bitbucket support (requires authentication for private repos)
    // if (source.includes('bitbucket.org')) {
    //   return 'bitbucket';
    // }
    if (source.includes('github.com') || /^[^\/]+\/[^\/]+$/.test(source)) {
      return 'github';
    }
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return 'url';
    }
    return 'local';
  }

  private async runNonInteractive(command: Command): Promise<void> {
    // Validation
    if (!command.type) {
      throw new Error('--skills, --rules, --commands, or --agents-resource is required');
    }
    if (!command.agents || command.agents.length === 0) {
      throw new Error('--agents is required (e.g., --agents=claude-code,cursor)');
    }

    // Default to registry resources if no source specified
    const source = command.source || getResourcesPath();
    const isDefaultSource = !command.source;

    this.logger.info(`Resource type: ${command.type}`);
    this.logger.info(`Source: ${source}${isDefaultSource ? ' (default registry)' : ''}`);
    this.logger.info(`Agents: ${command.agents.join(', ')}`);
    this.logger.info(`Scope: ${command.scope || 'project'}`);

    // 1. Resolve source
    this.logger.startProgress('Resolving source...');
    const sourceType = this.detectSourceType(source);
    const resolver = this.getResolver(sourceType);
    const sourceFiles = await resolver.resolve(source, command.type);
    this.logger.succeedProgress(`Found ${sourceFiles.length} files`);

    if (sourceFiles.length === 0) {
      this.logger.warn('No resources found in the source');
      return;
    }

    // 2. Parse resources
    this.logger.startProgress('Parsing resources...');
    const parser = new ResourceParser();
    const resources = parser.parseResources(sourceFiles, command.type);
    this.logger.succeedProgress(`Parsed ${resources.length} resources`);

    if (resources.length === 0) {
      this.logger.warn('No valid resources found');
      return;
    }

    // 3. Build install requests
    const requests: InstallRequest[] = [];
    for (const resource of resources) {
      for (const agent of command.agents as AgentKey[]) {
        requests.push({
          resource,
          agent,
          scope: (command.scope as 'project' | 'global') || 'project',
          onDuplicate: command.onDuplicate || 'skip',
        });
      }
    }

    // 4. Install
    this.logger.startProgress(`Installing ${resources.length} resources to ${command.agents.length} agents...`);
    const installManager = new InstallManager();
    const results = await installManager.install(requests);
    this.logger.succeedProgress('Installation complete');

    // 5. Display results
    this.logger.displayResults(results);
  }

  private getResolver(sourceType: 'github' | 'local' | 'url') {
    switch (sourceType) {
      case 'github':
        return new GitHubResolver();
      // Phase2: Bitbucket support
      // case 'bitbucket':
      //   return new BitbucketResolver();
      case 'url':
        return new URLResolver();
      case 'local':
      default:
        return new LocalResolver();
    }
  }
}
