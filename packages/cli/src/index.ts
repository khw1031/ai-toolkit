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

// CLI 옵션 파싱
program
  .name('ai-toolkit')
  .description('AI Toolkit - Install and manage AI resources')
  .option('--zip', 'Export resources as ZIP file')
  .parse();

const options = program.opts<{ zip?: boolean }>();

export async function main(): Promise<void> {
  if (options.zip) {
    await zipHandler.run();
  } else {
    await commandHandler.run();
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
