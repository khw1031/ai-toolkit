import { CommandHandler } from "./commands/CommandHandler";

// Export public API
export { InstallManager } from "./install/InstallManager";
export { DuplicateHandler } from "./install/DuplicateHandler";
export { BatchHandler } from "./install/BatchHandler";
export type { BatchAction, ResultSummary } from "./install/BatchHandler";
export { generateDiff, formatDiff, displayDiff } from "./utils/diff";

export async function main(): Promise<void> {
  const handler = new CommandHandler();
  await handler.run(process.argv);
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}
