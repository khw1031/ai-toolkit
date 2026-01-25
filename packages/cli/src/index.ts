#!/usr/bin/env node
import { program } from 'commander';
import { commandHandler } from "./commands/CommandHandler.js";
import { zipHandler } from "./commands/ZipHandler.js";

// CLI 설정
program
  .name('add-ai-tools')
  .description('AI Toolkit - Install and manage AI resources from various sources')
  .argument('[source]', 'Source to install from (GitHub shorthand or URL)')
  .option('--zip', 'Export resources as ZIP file')
  .option('--agent <agent>', 'Target agent (claude-code, cursor, github-copilot, antigravity)')
  .option('--scope <scope>', 'Installation scope (project, global)', 'project')
  .option('-y, --yes', 'Skip confirmation prompts')
  .parse();

const options = program.opts<{
  zip?: boolean;
  agent?: string;
  scope?: string;
  yes?: boolean;
}>();
const args = program.args;

async function main(): Promise<void> {
  const source = args[0];

  if (options.zip) {
    await zipHandler.run({
      source,
      yes: options.yes,
    });
  } else {
    await commandHandler.run({
      source,
      agent: options.agent,
      scope: options.scope as 'project' | 'global' | undefined,
      yes: options.yes,
    });
  }
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
