#!/usr/bin/env node

import { CommandHandler } from './commands/CommandHandler';

export async function main(): Promise<void> {
  const handler = new CommandHandler();
  await handler.run(process.argv);
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
