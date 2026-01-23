# Task 04: CommandHandler 구현

```yaml
우선순위: P0
복잡도: Medium
의존성: 03
차단: 10, 16
```

---

## 목표

CLI 진입점과 플래그 파싱 로직을 구현합니다.

---

## 범위

### 포함 사항

- CommandHandler 클래스 (commander 기반)
- 플래그 파싱: --skills, --rules, --commands, --agents-resource
- 플래그 파싱: --source, --on-duplicate, --yes, --scope, --agents
- 인터랙티브 vs 비인터랙티브 분기
- src/index.ts 통합

### 제외 사항

- InteractivePrompt 구현 (Task 10)
- Source resolution 로직 (Task 06, 07)

---

## 구현 가이드

### 1. package.json 의존성 추가

**위치**: `packages/cli/package.json`

```json
{
  "dependencies": {
    "@ai-toolkit/registry": "workspace:*",
    "commander": "^11.0.0",
    "chalk": "^5.0.0"
  }
}
```

### 2. src/commands/CommandHandler.ts

**위치**: `packages/cli/src/commands/CommandHandler.ts`

```typescript
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
```

### 3. src/index.ts 업데이트

**위치**: `packages/cli/src/index.ts`

```typescript
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
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/commands/CommandHandler.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { CommandHandler } from './CommandHandler';

describe('CommandHandler', () => {
  it('should parse --skills flag', async () => {
    const handler = new CommandHandler();
    // Mock console.log
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args.join(' '));

    await handler.run(['node', 'cli', '--skills', '--source=owner/repo']);

    expect(logs.some(log => log.includes('skill'))).toBe(true);
    console.log = originalLog;
  });
});
```

### 수동 테스트

```bash
pnpm --filter @ai-toolkit/cli build
node packages/cli/bin/ai-toolkit.js --help
node packages/cli/bin/ai-toolkit.js --skills --source=owner/repo
```

---

## 체크리스트

### 구현 전

- [ ] Task 03 완료 확인

### 구현 중

- [ ] commander 의존성 추가
- [ ] CommandHandler.ts 구현
- [ ] 플래그 파싱 로직 구현
- [ ] src/index.ts 통합
- [ ] CommandHandler.test.ts 작성

### 구현 후

- [ ] `pnpm install` (새 의존성)
- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `node packages/cli/bin/ai-toolkit.js --help` 출력 확인
- [ ] `node packages/cli/bin/ai-toolkit.js --skills --source=test` 동작 확인

---

## 통합 포인트

### 출력 (Export)

- CommandHandler 클래스 (Task 10에서 확장)
- Command 타입 활용 (Task 10)

### 입력 (Import)

- Command 타입 (Task 03)

---

## 완료 조건

- [x] CommandHandler 구현 완료
- [x] 모든 플래그 파싱 동작
- [x] --help 출력 확인
- [x] 비인터랙티브 모드 에러 처리 확인

---

## Git 커밋

```bash
git add packages/cli/src/commands/ packages/cli/src/index.ts packages/cli/package.json
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement CommandHandler with flag parsing"
```
