import ora, { type Ora } from 'ora';
import chalk from 'chalk';
import type { InstallResult } from '../types';

/**
 * Logger class for CLI output with progress spinner and colored messages
 *
 * Provides:
 * - Progress spinner (ora)
 * - Colored log messages (chalk)
 * - Installation results summary
 * - Welcome/completion messages
 */
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
   * Stop progress (generic)
   */
  stopProgress(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Log info message
   */
  info(message: string): void {
    console.log(chalk.blue('i'), message);
  }

  /**
   * Log success message
   */
  success(message: string): void {
    console.log(chalk.green('v'), message);
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    console.log(chalk.yellow('!'), message);
  }

  /**
   * Log error message
   */
  error(message: string): void {
    console.log(chalk.red('x'), message);
  }

  /**
   * Display installation results summary
   */
  displayResults(results: InstallResult[]): void {
    console.log('\n' + chalk.bold('Installation Results:') + '\n');

    const summary = this.summarizeResults(results);

    if (summary.created > 0) {
      console.log(chalk.green(`  v Created: ${summary.created}`));
    }
    if (summary.skipped > 0) {
      console.log(chalk.gray(`  - Skipped: ${summary.skipped}`));
    }
    if (summary.overwritten > 0) {
      console.log(chalk.yellow(`  ~ Overwritten: ${summary.overwritten}`));
    }
    if (summary.renamed > 0) {
      console.log(chalk.cyan(`  > Renamed: ${summary.renamed}`));
    }
    if (summary.backedUp > 0) {
      console.log(chalk.magenta(`  ^ Backed up: ${summary.backedUp}`));
    }
    if (summary.failed > 0) {
      console.log(chalk.red(`  x Failed: ${summary.failed}`));
    }

    console.log(chalk.bold(`\n  Total: ${results.length}`));

    // Show detailed failures
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.log('\n' + chalk.red.bold('Failures:'));
      failures.forEach((f) => {
        console.log(chalk.red(`  - ${f.resourceName} (${f.agent}): ${f.error}`));
      });
    }

    // Show detailed info
    if (results.length > 0) {
      console.log('\n' + chalk.bold('Details:'));
      results.forEach((r) => {
        const icon = this.getActionIcon(r.action);
        const color = this.getActionColor(r.action);
        const pathInfo = r.renamedTo || r.path;
        console.log(color(`  ${icon} ${r.resourceName} -> ${pathInfo}`));

        if (r.backupPath) {
          console.log(chalk.gray(`    (backup: ${r.backupPath})`));
        }
      });
    }

    console.log('');
  }

  /**
   * Summarize results by action type
   */
  summarizeResults(results: InstallResult[]): {
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
  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      created: 'v',
      skipped: '-',
      overwritten: '~',
      renamed: '>',
      'backed-up': '^',
      failed: 'x',
    };
    return icons[action] || '*';
  }

  /**
   * Get color function for action
   */
  getActionColor(action: string): (str: string) => string {
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
    console.log(chalk.bold.cyan('\nAI Toolkit - Universal Resource Installer\n'));
  }

  /**
   * Display completion message
   */
  displayCompletion(): void {
    console.log(chalk.green.bold('\nInstallation complete!\n'));
  }
}
