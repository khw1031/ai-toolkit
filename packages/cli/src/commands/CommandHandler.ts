import { Command as Commander } from 'commander';
import type { Command } from '../types';

export class CommandHandler {
  private program: Commander;

  constructor() {
    this.program = new Commander();
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
    this.program.parse(argv);
    const options = this.program.opts();

    const command = this.parseCommand(options);

    // Route to interactive or non-interactive
    if (this.isInteractive(command)) {
      console.log('Interactive mode - to be implemented in Task 10');
      // await this.runInteractive(command);
    } else {
      console.log('Non-interactive mode');
      await this.runNonInteractive(command);
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

  private async runNonInteractive(command: Command): Promise<void> {
    // Validation
    if (!command.type) {
      throw new Error('--skills, --rules, --commands, or --agents-resource is required');
    }
    if (!command.source) {
      throw new Error('--source is required');
    }

    console.log('Command:', command);
    console.log('Source resolution will be implemented in Task 06-07');
    // TODO: Implement in subsequent tasks
  }
}
