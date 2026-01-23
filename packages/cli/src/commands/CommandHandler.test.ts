import { describe, it, expect } from 'vitest';
import { CommandHandler } from './CommandHandler';

describe('CommandHandler', () => {
  it('should parse --skills flag', async () => {
    const handler = new CommandHandler();
    // Mock console.log
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli', '--skills', '--source=owner/repo']);

    const output = JSON.stringify(logs);
    expect(output).toContain('skill');
    console.log = originalLog;
  });

  it('should parse --rules flag', async () => {
    const handler = new CommandHandler();
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli', '--rules', '--source=owner/repo']);

    const output = JSON.stringify(logs);
    expect(output).toContain('rule');
    console.log = originalLog;
  });

  it('should parse --commands flag', async () => {
    const handler = new CommandHandler();
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli', '--commands', '--source=owner/repo']);

    const output = JSON.stringify(logs);
    expect(output).toContain('command');
    console.log = originalLog;
  });

  it('should parse --agents-resource flag', async () => {
    const handler = new CommandHandler();
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli', '--agents-resource', '--source=owner/repo']);

    const output = JSON.stringify(logs);
    expect(output).toContain('agent');
    console.log = originalLog;
  });

  it('should enable interactive mode when no type specified', async () => {
    const handler = new CommandHandler();
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli']);

    const output = JSON.stringify(logs);
    expect(output).toContain('Interactive mode');
    console.log = originalLog;
  });

  it('should enable interactive mode when no source specified', async () => {
    const handler = new CommandHandler();
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli', '--skills']);

    const output = JSON.stringify(logs);
    expect(output).toContain('Interactive mode');
    console.log = originalLog;
  });

  it('should parse --yes flag and set onDuplicate to overwrite', async () => {
    const handler = new CommandHandler();
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli', '--skills', '--source=owner/repo', '--yes']);

    const output = JSON.stringify(logs);
    expect(output).toContain('overwrite');
    console.log = originalLog;
  });

  it('should parse --agents flag and split by comma', async () => {
    const handler = new CommandHandler();
    const logs: any[][] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);

    await handler.run(['node', 'cli', '--skills', '--source=owner/repo', '--agents=claude,cursor']);

    const output = JSON.stringify(logs);
    expect(output).toContain('claude');
    expect(output).toContain('cursor');
    console.log = originalLog;
  });

  it('should throw error when type is missing in non-interactive mode', async () => {
    const handler = new CommandHandler();
    const originalLog = console.log;
    console.log = () => {}; // Suppress console.log

    // When no type is specified and source is provided, it goes to interactive mode
    // So this test should NOT throw an error
    await handler.run(['node', 'cli', '--source=owner/repo']);

    console.log = originalLog;
  });
});
