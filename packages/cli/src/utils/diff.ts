import { createTwoFilesPatch } from 'diff';
import chalk from 'chalk';

/**
 * Generate unified diff between two contents
 */
export function generateDiff(
  oldContent: string,
  newContent: string,
  filename: string = 'file'
): string {
  return createTwoFilesPatch(
    `${filename} (existing)`,
    `${filename} (new)`,
    oldContent,
    newContent,
    '',
    ''
  );
}

/**
 * Format diff with colors
 */
export function formatDiff(diffText: string): string {
  return diffText
    .split('\n')
    .map((line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return chalk.green(line);
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return chalk.red(line);
      }
      if (line.startsWith('@@')) {
        return chalk.cyan(line);
      }
      return line;
    })
    .join('\n');
}

/**
 * Display diff to console
 */
export function displayDiff(
  oldContent: string,
  newContent: string,
  filename: string
): void {
  const diff = generateDiff(oldContent, newContent, filename);
  const formatted = formatDiff(diff);
  console.log('\n' + formatted + '\n');
}
