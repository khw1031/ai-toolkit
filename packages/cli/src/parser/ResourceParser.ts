import { parse as parseYAML } from 'yaml';
import { basename, dirname } from 'node:path';
import type { ResourceType, SourceFile, Resource } from '../types';

/**
 * ResourceParser
 *
 * Converts source files to Resource objects by:
 * - Parsing YAML frontmatter
 * - Detecting resource type from filename
 * - Extracting metadata
 */
export class ResourceParser {
  /**
   * Parse source file to resource
   */
  parseResource(file: SourceFile, type: ResourceType): Resource {
    const frontmatter = this.parseYAMLFrontmatter(file.content);
    const detectedType = this.detectType(file.path) || type;

    const resource: Resource = {
      name: frontmatter.name || this.extractNameFromPath(file.path),
      type: detectedType,
      description: frontmatter.description || '',
      path: file.path,
      content: file.content,
      metadata: {
        author: frontmatter.author,
        version: frontmatter.version,
        license: frontmatter.license,
        category: frontmatter.category,
      },
    };

    // Include sibling files (scripts/, references/, assets/, etc.)
    if (file.siblingFiles && file.siblingFiles.length > 0) {
      resource.directory = {
        files: file.siblingFiles,
      };
    }

    return resource;
  }

  /**
   * Parse multiple source files
   */
  parseResources(files: SourceFile[], type: ResourceType): Resource[] {
    return files.map((file) => this.parseResource(file, type));
  }

  /**
   * Parse YAML frontmatter
   * Extracts content between --- delimiters
   */
  private parseYAMLFrontmatter(content: string): Record<string, any> {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {};
    }

    try {
      return parseYAML(match[1]) || {};
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter:', error);
      return {};
    }
  }

  /**
   * Detect resource type from file path
   */
  private detectType(filePath: string): ResourceType | null {
    const filename = basename(filePath);

    const typeMap: Record<string, ResourceType> = {
      'SKILL.md': 'skills',
      'RULES.md': 'rules',
      'AGENT.md': 'agents',
    };

    return typeMap[filename] || null;
  }

  /**
   * Extract resource name from file path
   * Example: skills/commit/SKILL.md -> commit
   */
  private extractNameFromPath(filePath: string): string {
    const dir = dirname(filePath);
    const parts = dir.split('/').filter(Boolean);

    // Get last directory name
    if (parts.length > 0) {
      const lastName = parts[parts.length - 1];
      // Skip if it's a type directory (skills, rules, etc.)
      if (!['skills', 'rules', 'commands', 'agents'].includes(lastName)) {
        return lastName;
      }
      // Try second-to-last
      if (parts.length > 1) {
        return parts[parts.length - 2];
      }
    }

    // Fallback to filename without extension
    return basename(filePath, '.md').toLowerCase();
  }
}
