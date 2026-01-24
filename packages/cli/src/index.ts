import { program } from 'commander';
import { commandHandler } from "./commands/CommandHandler.js";
import { zipHandler } from "./commands/ZipHandler.js";

// Export public API
export { InstallManager } from "./install/InstallManager.js";
export { DuplicateHandler } from "./install/DuplicateHandler.js";
export { BatchHandler } from "./install/BatchHandler.js";
export type { BatchAction, ResultSummary } from "./install/BatchHandler.js";
export { generateDiff, formatDiff, displayDiff } from "./utils/diff.js";
export { PathResolver, pathResolver } from "./path/index.js";
export { CommandHandler, commandHandler } from "./commands/CommandHandler.js";
export { ZipExporter, zipExporter } from "./export/index.js";
export { ZipHandler, zipHandler } from "./commands/ZipHandler.js";

// Source parser exports
export {
  parseSource,
  isDirectSkillUrl,
  isDirectResourcePath,
  getOwnerRepo,
  getSourceDisplayName,
} from "./source/index.js";

// Type exports
export type {
  ResourceType,
  AgentKey,
  AgentPaths,
  AgentConfig,
  AgentRegistry,
  ParsedSource,
  Resource,
  InstallRequest,
  InstallResult,
  DuplicateAction,
  SourceFile,
} from "./types.js";

// Agent data export
export { agents } from "./data/agents.js";

// CLI 설정
program
  .name('@hanssem/ai-toolkit')
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

export async function main(): Promise<void> {
  if (options.zip) {
    await zipHandler.run();
  } else {
    // source 인자가 있으면 외부 소스 모드, 없으면 인터랙티브 모드
    const source = args[0];
    await commandHandler.run({
      source,
      agent: options.agent,
      scope: options.scope as 'project' | 'global' | undefined,
      yes: options.yes,
    });
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
