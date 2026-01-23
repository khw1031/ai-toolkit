import { existsSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import { dirname, basename, join } from 'node:path';
import inquirer from 'inquirer';
import { atomicWrite } from '../utils/fs-safe';
import { displayDiff } from '../utils/diff';
import type { DuplicateAction } from '../types';

/**
 * DuplicateHandler
 *
 * Handles various duplicate resolution strategies for resource installation:
 * - skip: Do nothing, keep existing file
 * - overwrite: Replace existing file with new content
 * - rename: Create new file with incremented number (skill-2, skill-3)
 * - backup: Create .backup file before overwriting
 */
export class DuplicateHandler {
  /**
   * Handle rename - Find next available number
   * Examples: skill-2, skill-3, skill-4
   *
   * @param targetPath - The original target path (e.g., /path/to/my-skill/SKILL.md)
   * @param content - The new content to write
   * @returns The new path where the file was written
   */
  async rename(targetPath: string, content: string): Promise<string> {
    const dir = dirname(targetPath);
    const filename = basename(targetPath);
    const baseName = basename(dir); // Get directory name (skill name)
    const parentDir = dirname(dir);

    let counter = 2;
    let newPath: string;

    // Find next available number
    while (true) {
      const newDirName = `${baseName}-${counter}`;
      newPath = join(parentDir, newDirName, filename);

      if (!existsSync(join(parentDir, newDirName))) {
        break;
      }

      counter++;
    }

    // Write to new path
    await atomicWrite(newPath, content);

    return newPath;
  }

  /**
   * Handle backup - Create .backup file and overwrite
   *
   * If .backup already exists, creates numbered backups: .backup.1, .backup.2, etc.
   *
   * @param targetPath - The target path to backup and overwrite
   * @param content - The new content to write
   * @returns The backup path where the original content was saved
   */
  async backup(targetPath: string, content: string): Promise<string> {
    const baseBackupPath = `${targetPath}.backup`;
    let backupPath: string;

    // Check if backup already exists
    if (existsSync(baseBackupPath)) {
      // Create numbered backup: .backup.1, .backup.2, etc.
      let counter = 1;

      while (true) {
        backupPath = `${baseBackupPath}.${counter}`;
        if (!existsSync(backupPath)) {
          break;
        }
        counter++;
      }
    } else {
      backupPath = baseBackupPath;
    }

    // Copy original to backup
    await copyFile(targetPath, backupPath);

    // Overwrite original
    await atomicWrite(targetPath, content);

    return backupPath;
  }

  /**
   * Skip - Do nothing
   */
  async skip(): Promise<void> {
    // No action needed
  }

  /**
   * Overwrite - Replace file
   *
   * @param targetPath - The target path to overwrite
   * @param content - The new content to write
   */
  async overwrite(targetPath: string, content: string): Promise<void> {
    await atomicWrite(targetPath, content);
  }

  /**
   * Handle compare - Show diff and let user choose action
   *
   * Displays unified diff between existing and new content,
   * then prompts user to choose skip, overwrite, or backup.
   *
   * @param targetPath - The target file path
   * @param existingContent - Current content of the file
   * @param newContent - New content to potentially install
   * @param resourceName - Name of the resource for display
   * @returns The chosen action: 'skip', 'overwrite', or 'backup'
   */
  async compare(
    targetPath: string,
    existingContent: string,
    newContent: string,
    resourceName: string
  ): Promise<'skip' | 'overwrite' | 'backup'> {
    console.log(`\nComparing "${resourceName}":`);
    displayDiff(existingContent, newContent, resourceName);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do after seeing the diff?',
        choices: [
          { name: 'Skip - Keep existing', value: 'skip' },
          { name: 'Overwrite - Use new version', value: 'overwrite' },
          { name: 'Backup - Backup and overwrite', value: 'backup' },
        ],
      },
    ]);

    return action;
  }

  /**
   * Prompt user for single duplicate action
   *
   * Displays interactive menu for handling a single duplicate file.
   *
   * @param resourceName - Name of the resource
   * @param existingPath - Path where file already exists
   * @returns The chosen duplicate action
   */
  async promptForAction(
    resourceName: string,
    existingPath: string
  ): Promise<DuplicateAction> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `File "${resourceName}" already exists at ${existingPath}. What do you want to do?`,
        choices: [
          { name: 'Skip - Keep existing file', value: 'skip' },
          { name: 'Overwrite - Replace with new version', value: 'overwrite' },
          { name: 'Rename - Save new version with different name', value: 'rename' },
          { name: 'Backup - Backup existing and install new', value: 'backup' },
          { name: 'Compare - Show differences first', value: 'compare' },
        ],
      },
    ]);

    return action;
  }
}
