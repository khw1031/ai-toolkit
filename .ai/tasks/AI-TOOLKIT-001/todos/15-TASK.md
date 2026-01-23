# Task 15: Logger 및 결과 출력

```yaml
우선순위: P2
복잡도: Low
의존성: 09
차단: 16
```

---

## 목표

설치 진행 상황 표시 및 결과 요약을 위한 Logger를 구현합니다.

---

## 범위

### 포함 사항

- Logger 클래스
- Progress bar (ora 또는 cli-progress)
- 설치 결과 요약 출력
- 에러 메시지 포맷팅
- 성공/실패 통계
- 단위 테스트

### 제외 사항

- 로그 파일 쓰기 (선택적, 향후 구현)
- 디버그 모드 (선택적, 향후 구현)

---

## 구현 가이드

### 1. package.json 의존성 추가

**위치**: `packages/cli/package.json`

```json
{
  "dependencies": {
    "ora": "^7.0.0",
    "chalk": "^5.0.0"
  }
}
```

### 2. src/utils/Logger.ts

**위치**: `packages/cli/src/utils/Logger.ts`

```typescript
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import type { InstallResult } from '../install/InstallManager';

export class Logger {
  private spinner: Ora | null = null;

  /**
   * Start progress spinner
   */
  startProgress(message: string): void {
    this.spinner = ora(message).start();
  }

  /**
   * Update progress message
   */
  updateProgress(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  /**
   * Stop progress with success
   */
  succeedProgress(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  /**
   * Stop progress with failure
   */
  failProgress(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  /**
   * Stop progress with warning
   */
  warnProgress(message?: string): void {
    if (this.spinner) {
      this.spinner.warn(message);
      this.spinner = null;
    }
  }

  /**
   * Log info message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Log success message
   */
  success(message: string): void {
    console.log(chalk.green('✔'), message);
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  /**
   * Log error message
   */
  error(message: string): void {
    console.log(chalk.red('✖'), message);
  }

  /**
   * Display installation results summary
   */
  displayResults(results: InstallResult[]): void {
    console.log('\n' + chalk.bold('Installation Results:') + '\n');

    const summary = this.summarizeResults(results);

    if (summary.created > 0) {
      console.log(chalk.green(`✔ Created: ${summary.created}`));
    }
    if (summary.skipped > 0) {
      console.log(chalk.gray(`⊘ Skipped: ${summary.skipped}`));
    }
    if (summary.overwritten > 0) {
      console.log(chalk.yellow(`↻ Overwritten: ${summary.overwritten}`));
    }
    if (summary.renamed > 0) {
      console.log(chalk.cyan(`✎ Renamed: ${summary.renamed}`));
    }
    if (summary.backedUp > 0) {
      console.log(chalk.magenta(`⎘ Backed up: ${summary.backedUp}`));
    }
    if (summary.failed > 0) {
      console.log(chalk.red(`✖ Failed: ${summary.failed}`));
    }

    console.log(chalk.bold(`\nTotal: ${results.length}`));

    // Show detailed failures
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.log('\n' + chalk.red.bold('Failures:'));
      failures.forEach((f) => {
        console.log(chalk.red(`  - ${f.resourceName} (${f.agent}): ${f.error}`));
      });
    }

    // Show detailed info
    console.log('\n' + chalk.bold('Details:'));
    results.forEach((r) => {
      const icon = this.getActionIcon(r.action);
      const color = this.getActionColor(r.action);
      const pathInfo = r.renamedTo || r.path;
      console.log(color(`  ${icon} ${r.resourceName} → ${pathInfo}`));

      if (r.backupPath) {
        console.log(chalk.gray(`    (backup: ${r.backupPath})`));
      }
    });

    console.log('');
  }

  /**
   * Summarize results
   */
  private summarizeResults(results: InstallResult[]): {
    created: number;
    skipped: number;
    overwritten: number;
    renamed: number;
    backedUp: number;
    failed: number;
  } {
    return {
      created: results.filter((r) => r.action === 'created').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      overwritten: results.filter((r) => r.action === 'overwritten').length,
      renamed: results.filter((r) => r.action === 'renamed').length,
      backedUp: results.filter((r) => r.action === 'backed-up').length,
      failed: results.filter((r) => r.action === 'failed').length,
    };
  }

  /**
   * Get icon for action
   */
  private getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      created: '✔',
      skipped: '⊘',
      overwritten: '↻',
      renamed: '✎',
      'backed-up': '⎘',
      failed: '✖',
    };
    return icons[action] || '•';
  }

  /**
   * Get color function for action
   */
  private getActionColor(action: string): (str: string) => string {
    const colors: Record<string, (str: string) => string> = {
      created: chalk.green,
      skipped: chalk.gray,
      overwritten: chalk.yellow,
      renamed: chalk.cyan,
      'backed-up': chalk.magenta,
      failed: chalk.red,
    };
    return colors[action] || chalk.white;
  }

  /**
   * Display welcome message
   */
  displayWelcome(): void {
    console.log(chalk.bold.cyan('\n🤖 AI Toolkit - Universal Resource Installer\n'));
  }

  /**
   * Display completion message
   */
  displayCompletion(): void {
    console.log(chalk.green.bold('\n✨ Installation complete!\n'));
  }
}
```

### 3. CommandHandler 통합

**위치**: `packages/cli/src/commands/CommandHandler.ts`

CommandHandler에 Logger 통합:

```typescript
import { Logger } from '../utils/Logger';

// In CommandHandler class:

private logger: Logger;

constructor() {
  this.program = new Commander();
  this.logger = new Logger();
  this.setupCommands();
}

async run(argv: string[]): Promise<void> {
  try {
    this.logger.displayWelcome();

    this.program.parse(argv);
    const options = this.program.opts();
    const command = this.parseCommand(options);

    if (this.isInteractive(command)) {
      await this.runInteractive(command);
    } else {
      await this.runNonInteractive(command);
    }

    this.logger.displayCompletion();
  } catch (error: any) {
    this.logger.error(error.message);
    process.exit(1);
  }
}

// In runNonInteractive:
private async runNonInteractive(command: Command): Promise<void> {
  // ... validation ...

  this.logger.startProgress('Resolving source...');
  const sourceFiles = await resolver.resolve(command.source, command.type);
  this.logger.succeedProgress(`Found ${sourceFiles.length} resources`);

  this.logger.startProgress('Parsing resources...');
  const resources = parser.parseResources(sourceFiles, command.type);
  this.logger.succeedProgress(`Parsed ${resources.length} resources`);

  this.logger.startProgress('Installing...');
  const results = await installManager.install(requests);
  this.logger.succeedProgress('Installation complete');

  this.logger.displayResults(results);
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/utils/Logger.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Logger } from './Logger';
import type { InstallResult } from '../install/InstallManager';

describe('Logger', () => {
  const logger = new Logger();

  describe('summarizeResults', () => {
    it('should count results by action', () => {
      const results: InstallResult[] = [
        {
          resourceName: 'test1',
          agent: 'claude-code',
          success: true,
          action: 'created',
          path: '/path/1',
        },
        {
          resourceName: 'test2',
          agent: 'claude-code',
          success: true,
          action: 'skipped',
          path: '/path/2',
        },
        {
          resourceName: 'test3',
          agent: 'claude-code',
          success: false,
          action: 'failed',
          path: '/path/3',
          error: 'Error message',
        },
      ];

      const summary = (logger as any).summarizeResults(results);

      expect(summary.created).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.failed).toBe(1);
    });
  });

  describe('getActionIcon', () => {
    it('should return correct icons', () => {
      expect((logger as any).getActionIcon('created')).toBe('✔');
      expect((logger as any).getActionIcon('skipped')).toBe('⊘');
      expect((logger as any).getActionIcon('failed')).toBe('✖');
    });
  });

  describe('displayResults', () => {
    it('should display results without errors', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const results: InstallResult[] = [
        {
          resourceName: 'test',
          agent: 'claude-code',
          success: true,
          action: 'created',
          path: '/path/test',
        },
      ];

      logger.displayResults(results);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
```

### 수동 테스트

```bash
pnpm --filter @ai-toolkit/cli build
node packages/cli/bin/ai-toolkit.js --skills --source=test-repo --agents=claude-code --scope=project --yes

# Should display:
# - Welcome message
# - Progress spinners
# - Results summary
# - Completion message
```

---

## 체크리스트

### 구현 전

- [ ] Task 09 완료 확인

### 구현 중

- [ ] ora, chalk 의존성 추가
- [ ] Logger.ts 구현
- [ ] startProgress() 구현
- [ ] displayResults() 구현
- [ ] CommandHandler 통합
- [ ] Logger.test.ts 작성

### 구현 후

- [ ] `pnpm install` (새 의존성)
- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] Progress spinner 동작 확인
- [ ] 결과 요약 출력 확인

---

## 통합 포인트

### 출력 (Export)

- Logger 클래스 (CommandHandler에서 사용)

### 입력 (Import)

- InstallResult (Task 09)

---

## 완료 조건

- [x] Logger 구현 완료
- [x] Progress spinner 동작
- [x] 결과 요약 출력
- [x] 에러 메시지 포맷팅
- [x] CommandHandler 통합
- [x] 단위 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add packages/cli/src/utils/Logger.ts packages/cli/src/utils/Logger.test.ts packages/cli/src/commands/CommandHandler.ts packages/cli/package.json
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement Logger with progress display and result summary"
```
