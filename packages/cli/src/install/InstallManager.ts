import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { PathResolver } from '../path/PathResolver.js';
import { atomicWrite } from '../utils/fs-safe';
import { isSameContent } from '../utils/hash';
import { DuplicateHandler } from './DuplicateHandler';
import type {
  AgentKey,
  ResourceType,
  Resource,
  InstallRequest,
  InstallResult,
} from '../types';

interface DuplicateInfo {
  resourceName: string;
  path: string;
  existingContent: string;
  newContent: string;
  isSameContent: boolean;
}

/**
 * InstallManager
 *
 * Handles resource installation with duplicate detection and handling strategies:
 * - Skip: Keep existing file
 * - Overwrite: Replace existing file
 * - Rename: Create new file with incremented number (skill-2, skill-3)
 * - Backup: Create .backup file before overwriting
 * - Auto-skip: Automatically skip if content is identical
 */
export class InstallManager {
  private pathResolver: PathResolver;
  private duplicateHandler: DuplicateHandler;

  constructor() {
    this.pathResolver = new PathResolver();
    this.duplicateHandler = new DuplicateHandler();
  }

  /**
   * Install multiple resources
   */
  async install(requests: InstallRequest[]): Promise<InstallResult[]> {
    const results: InstallResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.installOne(request);
        results.push(result);
      } catch (error: any) {
        results.push({
          resourceName: request.resource.name,
          agent: request.agent,
          success: false,
          action: 'failed',
          path: '',
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Install single resource
   */
  private async installOne(request: InstallRequest): Promise<InstallResult> {
    const targetPath = this.resolveTargetPath(
      request.resource,
      request.agent,
      request.scope
    );

    const duplicate = await this.checkDuplicate(
      targetPath,
      request.resource.content
    );

    // Auto-skip if content is identical
    if (duplicate && duplicate.isSameContent) {
      return {
        resourceName: request.resource.name,
        agent: request.agent,
        success: true,
        action: 'skipped',
        path: targetPath,
      };
    }

    // Handle duplicate
    if (duplicate) {
      return await this.handleDuplicate(request, duplicate, targetPath);
    }

    // Create new file
    await atomicWrite(targetPath, request.resource.content);

    // Copy sibling files (scripts/, references/, assets/, etc.)
    if (request.resource.directory?.files) {
      const targetDir = dirname(targetPath);
      await this.copySiblingFiles(request.resource.directory.files, targetDir);
    }

    return {
      resourceName: request.resource.name,
      agent: request.agent,
      success: true,
      action: 'created',
      path: targetPath,
    };
  }

  /**
   * Copy sibling files to target directory
   */
  private async copySiblingFiles(files: { path: string; content: string }[], targetDir: string): Promise<void> {
    for (const file of files) {
      const targetPath = join(targetDir, file.path);
      await atomicWrite(targetPath, file.content);
    }
  }

  /**
   * Resolve target installation path
   */
  private resolveTargetPath(
    resource: Resource,
    agent: AgentKey,
    scope: 'project' | 'global'
  ): string {
    const basePath = this.pathResolver.resolveAgentPath(
      agent,
      resource.type,
      scope
    );
    const filename = this.getResourceFilename(resource.type);

    // If resource has a specific directory name, use it
    return join(basePath, resource.name, filename);
  }

  /**
   * Get resource filename
   */
  private getResourceFilename(type: ResourceType): string {
    const filenames: Record<ResourceType, string> = {
      skills: 'SKILL.md',
      rules: 'RULES.md',
      commands: 'COMMANDS.md',
      agents: 'AGENT.md',
    };
    return filenames[type];
  }

  /**
   * Check if file exists and get duplicate info
   */
  private async checkDuplicate(
    path: string,
    newContent: string
  ): Promise<DuplicateInfo | null> {
    if (!existsSync(path)) {
      return null;
    }

    try {
      const existingContent = await readFile(path, 'utf-8');
      return {
        resourceName: path.split('/').slice(-2, -1)[0], // Extract directory name
        path,
        existingContent,
        newContent,
        isSameContent: isSameContent(existingContent, newContent),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle duplicate file
   */
  private async handleDuplicate(
    request: InstallRequest,
    duplicate: DuplicateInfo,
    targetPath: string
  ): Promise<InstallResult> {
    const { onDuplicate } = request;

    switch (onDuplicate) {
      case 'skip':
        await this.duplicateHandler.skip();
        return {
          resourceName: request.resource.name,
          agent: request.agent,
          success: true,
          action: 'skipped',
          path: targetPath,
        };

      case 'overwrite':
        await this.duplicateHandler.overwrite(targetPath, request.resource.content);
        return {
          resourceName: request.resource.name,
          agent: request.agent,
          success: true,
          action: 'overwritten',
          path: targetPath,
        };

      case 'rename': {
        const newPath = await this.duplicateHandler.rename(
          targetPath,
          request.resource.content
        );
        return {
          resourceName: request.resource.name,
          agent: request.agent,
          success: true,
          action: 'renamed',
          path: newPath,
          renamedTo: newPath,
        };
      }

      case 'backup': {
        const backupPath = await this.duplicateHandler.backup(
          targetPath,
          request.resource.content
        );
        return {
          resourceName: request.resource.name,
          agent: request.agent,
          success: true,
          action: 'backed-up',
          path: targetPath,
          backupPath,
        };
      }

      case 'fail':
        throw new Error(`File already exists: ${targetPath}`);

      case 'compare': {
        // Show diff and let user choose action
        const action = await this.duplicateHandler.compare(
          targetPath,
          duplicate.existingContent,
          request.resource.content,
          request.resource.name
        );

        // Recursively handle with the chosen action
        const newRequest: InstallRequest = {
          ...request,
          onDuplicate: action,
        };

        return await this.handleDuplicate(newRequest, duplicate, targetPath);
      }

      default:
        throw new Error(`Unknown duplicate action: ${onDuplicate}`);
    }
  }
}
