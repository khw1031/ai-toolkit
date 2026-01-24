import { readdir, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ResourceType, RegistryDirectory, Resource, SourceFile } from '../types.js';
import { ResourceParser } from '../parser/ResourceParser.js';

/**
 * RegistryResolver
 *
 * Resolves resources from the bundled registry package.
 * Supports scanning common/, frontend/, app/ directories.
 */
export class RegistryResolver {
  private registryPath: string;
  private parser: ResourceParser;

  constructor() {
    this.registryPath = this.findRegistryPath();
    this.parser = new ResourceParser();
  }

  /**
   * Find registry resources path
   * Supports both development (monorepo) and production (node_modules) environments
   */
  private findRegistryPath(): string {
    // Get current file's directory (ESM compatible)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Development environment: walk up to find monorepo root (contains packages/)
    // and then navigate to packages/registry/resources
    const monorepoRoot = this.findMonorepoRoot(__dirname);
    if (monorepoRoot) {
      const devPath = join(monorepoRoot, 'packages/registry/resources');
      if (existsSync(devPath)) {
        return devPath;
      }
    }

    // Production environment: use @ai-toolkit/registry package
    try {
      // Try to find the registry package in node_modules
      const registryIndexPath = this.resolvePackagePath('@ai-toolkit/registry');
      if (registryIndexPath) {
        const resourcesPath = join(dirname(registryIndexPath), 'resources');
        if (existsSync(resourcesPath)) {
          return resourcesPath;
        }
      }
    } catch {
      // Fall through to error
    }

    throw new Error(
      'Cannot find registry resources path. ' +
        'Ensure @ai-toolkit/registry is properly installed.'
    );
  }

  /**
   * Find monorepo root by walking up directories looking for packages/ folder
   */
  private findMonorepoRoot(startDir: string): string | null {
    let current = startDir;
    const root = '/';

    while (current !== root) {
      // Check if this directory contains packages/registry
      const packagesPath = join(current, 'packages', 'registry');
      if (existsSync(packagesPath)) {
        return current;
      }
      current = dirname(current);
    }

    return null;
  }

  /**
   * Resolve package path from node_modules
   */
  private resolvePackagePath(packageName: string): string | null {
    try {
      // Use import.meta.resolve if available (Node 20+)
      // Otherwise fall back to require.resolve pattern
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);

      // Walk up to find node_modules
      let current = __dirname;
      while (current !== '/') {
        const nodeModulesPath = join(current, 'node_modules', packageName, 'dist', 'index.js');
        if (existsSync(nodeModulesPath)) {
          return nodeModulesPath;
        }
        current = dirname(current);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get available registry directories
   */
  getDirectories(): RegistryDirectory[] {
    return ['common', 'frontend', 'app'];
  }

  /**
   * Resolve resources from specified directory and types
   * @param directory - Registry directory (common, frontend, app)
   * @param types - Resource types to scan (skills, rules, commands, agents)
   */
  async resolve(
    directory: RegistryDirectory,
    types: ResourceType[]
  ): Promise<Resource[]> {
    const resources: Resource[] = [];

    for (const type of types) {
      const typePath = join(this.registryPath, directory, type);

      if (!existsSync(typePath)) {
        continue;
      }

      try {
        const entries = await readdir(typePath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip non-directories and hidden files
          if (!entry.isDirectory()) continue;
          if (entry.name.startsWith('.')) continue;

          const resourcePath = join(typePath, entry.name);
          const resource = await this.parseResource(resourcePath, type);

          if (resource) {
            resources.push(resource);
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to scan ${typePath}: ${message}`);
      }
    }

    return resources;
  }

  /**
   * Parse a single resource from its directory
   */
  private async parseResource(
    resourcePath: string,
    type: ResourceType
  ): Promise<Resource | null> {
    const metaFile = this.getMetaFileName(type);
    const metaPath = join(resourcePath, metaFile);

    if (!existsSync(metaPath)) {
      return null;
    }

    try {
      const content = await readFile(metaPath, 'utf-8');

      // Collect sibling files (scripts/, references/, etc.)
      const siblingFiles = await this.getAllFilesInDirectory(resourcePath);

      const sourceFile: SourceFile = {
        path: metaPath,
        content,
        isDirectory: false,
        siblingFiles,
      };

      // Convert plural type to singular for ResourceParser
      const singularType = this.toSingularType(type);

      return this.parser.parseResource(sourceFile, singularType);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to parse resource at ${metaPath}: ${message}`);
      return null;
    }
  }

  /**
   * Get meta file name for resource type
   */
  private getMetaFileName(type: ResourceType): string {
    const fileNames: Record<ResourceType, string> = {
      skills: 'SKILL.md',
      rules: 'RULES.md',
      commands: 'COMMANDS.md',
      agents: 'AGENT.md',
    };
    return fileNames[type];
  }

  /**
   * Convert plural ResourceType to singular for ResourceParser compatibility
   */
  private toSingularType(type: ResourceType): 'skill' | 'rule' | 'command' | 'agent' {
    const mapping: Record<ResourceType, 'skill' | 'rule' | 'command' | 'agent'> = {
      skills: 'skill',
      rules: 'rule',
      commands: 'command',
      agents: 'agent',
    };
    return mapping[type];
  }

  /**
   * Get all files in a resource directory recursively
   * Used to collect sibling files (scripts/, references/, assets/, etc.)
   */
  private async getAllFilesInDirectory(dirPath: string): Promise<SourceFile[]> {
    const files: SourceFile[] = [];

    const collectFiles = async (currentPath: string, relativePath: string = ''): Promise<void> => {
      try {
        const entries = await readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip hidden files
          if (entry.name.startsWith('.')) {
            continue;
          }

          const fullPath = join(currentPath, entry.name);
          const relPath = relativePath ? join(relativePath, entry.name) : entry.name;

          if (entry.isDirectory()) {
            await collectFiles(fullPath, relPath);
          } else if (entry.isFile()) {
            const content = await readFile(fullPath, 'utf-8');
            files.push({
              path: relPath, // Relative path from resource directory
              content,
              isDirectory: false,
            });
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to read directory ${currentPath}: ${message}`);
      }
    };

    await collectFiles(dirPath);
    return files;
  }

  /**
   * Get full path to a specific resource
   * Used for installation operations
   */
  getResourcePath(
    directory: RegistryDirectory,
    type: ResourceType,
    name: string
  ): string {
    return join(this.registryPath, directory, type, name);
  }

  /**
   * Check if a resource exists
   */
  resourceExists(
    directory: RegistryDirectory,
    type: ResourceType,
    name: string
  ): boolean {
    const resourcePath = this.getResourcePath(directory, type, name);
    const metaFile = this.getMetaFileName(type);
    return existsSync(join(resourcePath, metaFile));
  }

  /**
   * Get the registry base path (for debugging)
   */
  getRegistryPath(): string {
    return this.registryPath;
  }
}

// Export singleton instance
export const registryResolver = new RegistryResolver();
