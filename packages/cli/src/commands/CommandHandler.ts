import { Command as Commander } from 'commander';
import type { Command } from '../types';
import { Logger } from '../utils/Logger';
import { InteractivePrompt } from '../prompts/InteractivePrompt';
import { GitHubResolver } from '../source/GitHubResolver';
import { LocalResolver } from '../source/LocalResolver';
import { ResourceParser } from '../parser/ResourceParser';

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
    // Interactive if no type or source specified
    return !command.type || !command.source;
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
  ): 'github' | 'bitbucket' | 'local' | 'url' {
    if (source.includes('github.com') || /^[^\/]+\/[^\/]+$/.test(source)) {
      return 'github';
    }
    if (source.includes('bitbucket.org')) {
      return 'bitbucket';
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
    if (!command.source) {
      throw new Error('--source is required');
    }

    this.logger.info(`Resource type: ${command.type}`);
    this.logger.info(`Source: ${command.source}`);
    this.logger.info('Source resolution will be implemented in Task 06-07');
    // TODO: Implement in subsequent tasks
  }
}
