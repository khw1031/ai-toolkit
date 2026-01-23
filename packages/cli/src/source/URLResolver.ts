import type { ResourceType, SourceFile } from '../types';

export class URLResolver {
  /**
   * Resolve URL to single file
   */
  async resolve(url: string, type: ResourceType): Promise<SourceFile[]> {
    this.validateURL(url);

    const content = await this.downloadFile(url);
    this.validateContent(content, type);

    // Extract filename from URL
    const filename = this.extractFilename(url, type);

    return [
      {
        path: filename,
        content,
        isDirectory: false,
      },
    ];
  }

  /**
   * Validate URL format
   */
  private validateURL(url: string): void {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs are supported');
      }
    } catch (error: any) {
      if (error.message === 'Only HTTP/HTTPS URLs are supported') {
        throw error;
      }
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<string> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check Content-Type
      const contentType = response.headers.get('content-type');
      if (contentType && !this.isTextContent(contentType)) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      return await response.text();
    } catch (error: any) {
      if (error.message.startsWith('Unsupported content type:') ||
          error.message.startsWith('HTTP ')) {
        throw error;
      }
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Check if content type is text-based
   */
  private isTextContent(contentType: string): boolean {
    const textTypes = [
      'text/',
      'application/json',
      'application/yaml',
      'application/x-yaml',
    ];
    return textTypes.some((type) => contentType.includes(type));
  }

  /**
   * Validate content matches resource type
   */
  private validateContent(content: string, type: ResourceType): void {
    // Basic validation: check if content looks like markdown
    if (!content.includes('#') && !content.includes('---')) {
      console.warn('Warning: Content does not look like a valid resource file');
    }
  }

  /**
   * Extract filename from URL
   */
  private extractFilename(url: string, type: ResourceType): string {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Try to get filename from URL
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.endsWith('.md')) {
        return lastPart;
      }
    }

    // Fallback to default filename
    return this.getResourceFilename(type);
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
