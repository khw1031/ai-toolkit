import { readdir, readFile, stat } from 'fs/promises';
import { join, resolve, isAbsolute } from 'path';
import type { ResourceType, SourceFile } from '../types';

export class LocalResolver {
  private maxDepth = 5; // Prevent infinite recursion

  /**
   * Resolve local path to file list
   * @param source - Local path (absolute or relative)
   * @param type - Resource type to filter
   */
  async resolve(source: string, type: ResourceType): Promise<SourceFile[]> {
    const absolutePath = this.resolveAbsolutePath(source);
    await this.validatePath(absolutePath);

    const files = await this.scanDirectory(absolutePath, type, 0);
    return files;
  }

  /**
   * Resolve to absolute path
   */
  private resolveAbsolutePath(source: string): string {
    if (isAbsolute(source)) {
      return source;
    }
    return resolve(process.cwd(), source);
  }

  /**
   * Validate path exists and is accessible
   */
  private async validatePath(path: string): Promise<void> {
    try {
      const stats = await stat(path);
      if (!stats.isDirectory() && !stats.isFile()) {
        throw new Error(`Path is not a file or directory: ${path}`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Path does not exist: ${path}`);
      }
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied: ${path}`);
      }
      throw error;
    }
  }

  /**
   * Recursively scan directory for resource files
   */
  private async scanDirectory(
    dirPath: string,
    type: ResourceType,
    depth: number
  ): Promise<SourceFile[]> {
    if (depth >= this.maxDepth) {
      console.warn(`Max depth reached at: ${dirPath}`);
      return [];
    }

    const files: SourceFile[] = [];
    const filename = this.getResourceFilename(type);

    try {
      const stats = await stat(dirPath);

      // If it's a file, check if it matches
      if (stats.isFile()) {
        if (dirPath.endsWith(filename)) {
          const content = await readFile(dirPath, 'utf-8');
          files.push({
            path: dirPath,
            content,
            isDirectory: false,
          });
        }
        return files;
      }

      // If it's a directory, scan recursively
      if (stats.isDirectory()) {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);

          // Skip hidden files and node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            const subFiles = await this.scanDirectory(fullPath, type, depth + 1);
            files.push(...subFiles);
          } else if (entry.isFile() && entry.name === filename) {
            const content = await readFile(fullPath, 'utf-8');
            files.push({
              path: fullPath,
              content,
              isDirectory: false,
            });
          } else if (entry.isSymbolicLink()) {
            // Follow symlinks carefully
            try {
              const symlinkStats = await stat(fullPath);
              if (symlinkStats.isDirectory()) {
                const subFiles = await this.scanDirectory(fullPath, type, depth + 1);
                files.push(...subFiles);
              }
            } catch (error) {
              console.warn(`Failed to follow symlink: ${fullPath}`);
            }
          }
        }
      }
    } catch (error: any) {
      console.warn(`Failed to scan ${dirPath}: ${error.message}`);
    }

    return files;
  }

  /**
   * Get resource filename by type
   */
  private getResourceFilename(type: ResourceType): string {
    const filenames: Record<ResourceType, string> = {
      skill: 'SKILL.md',
      rule: 'RULES.md',
      command: 'COMMANDS.md',
      agent: 'AGENT.md',
    };
    return filenames[type];
  }
}
