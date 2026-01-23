import type { ResourceType, SourceFile } from '../types';

interface BitbucketSource {
  owner: string;
  repo: string;
  branch?: string;
}

interface BitbucketFileEntry {
  path: string;
  type: 'commit_file' | 'commit_directory';
  size?: number;
}

interface BitbucketTreeResponse {
  values: BitbucketFileEntry[];
  next?: string;
}

interface BitbucketRepoResponse {
  mainbranch?: {
    name: string;
  };
}

export class BitbucketResolver {
  private apiBase = 'https://api.bitbucket.org/2.0';
  private maxDepth = 3; // Performance limit

  /**
   * Resolve Bitbucket source to file list
   * @param source - Bitbucket source (owner/repo, owner/repo@branch, or URL)
   * @param type - Resource type to filter
   */
  async resolve(source: string, type: ResourceType): Promise<SourceFile[]> {
    const parsed = this.parseSource(source);
    const branch = parsed.branch || (await this.getDefaultBranch(parsed.owner, parsed.repo));
    const tree = await this.fetchTree(parsed.owner, parsed.repo, branch);
    const filtered = this.filterByType(tree, type);
    return await this.downloadFiles(parsed.owner, parsed.repo, filtered, branch);
  }

  /**
   * Parse Bitbucket source
   * Supports:
   * - owner/repo
   * - owner/repo@branch
   * - https://bitbucket.org/owner/repo
   * - https://bitbucket.org/owner/repo/src/branch
   */
  parseSource(source: string): BitbucketSource {
    // URL format with branch
    const urlWithBranchMatch = source.match(
      /bitbucket\.org\/([^\/]+)\/([^\/]+)\/src\/([^\/]+)/
    );
    if (urlWithBranchMatch) {
      return {
        owner: urlWithBranchMatch[1],
        repo: urlWithBranchMatch[2].replace('.git', ''),
        branch: urlWithBranchMatch[3],
      };
    }

    // URL format without branch
    const urlMatch = source.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)/);
    if (urlMatch) {
      return {
        owner: urlMatch[1],
        repo: urlMatch[2].replace('.git', ''),
      };
    }

    // owner/repo@branch format
    const branchMatch = source.match(/^([^\/]+)\/([^@]+)@(.+)$/);
    if (branchMatch) {
      return {
        owner: branchMatch[1],
        repo: branchMatch[2],
        branch: branchMatch[3],
      };
    }

    // owner/repo format
    const simpleMatch = source.match(/^([^\/]+)\/(.+)$/);
    if (simpleMatch) {
      return {
        owner: simpleMatch[1],
        repo: simpleMatch[2],
      };
    }

    throw new Error(`Invalid Bitbucket source: ${source}`);
  }

  /**
   * Get default branch from Bitbucket repository
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const url = `${this.apiBase}/repositories/${owner}/${repo}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Repository not found: ${owner}/${repo}`);
        }
        if (response.status === 429) {
          throw new Error(
            'Bitbucket rate limit exceeded. Please wait and try again later.'
          );
        }
        throw new Error(`Failed to fetch repository: ${response.statusText}`);
      }

      const data = (await response.json()) as BitbucketRepoResponse;
      return data.mainbranch?.name || 'main';
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to get default branch: ${error.message}`);
      }
      throw new Error('Failed to get default branch: Unknown error');
    }
  }

  /**
   * Fetch Bitbucket repository tree with pagination support
   */
  async fetchTree(
    owner: string,
    repo: string,
    branch: string
  ): Promise<BitbucketFileEntry[]> {
    try {
      const files: BitbucketFileEntry[] = [];
      let url: string | null =
        `${this.apiBase}/repositories/${owner}/${repo}/src/${branch}/?pagelen=100`;

      // Bitbucket API uses pagination
      while (url) {
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              `Repository or branch not found: ${owner}/${repo}@${branch}`
            );
          }
          if (response.status === 429) {
            throw new Error(
              'Bitbucket rate limit exceeded. Please wait and try again later.'
            );
          }
          throw new Error(`Failed to fetch tree: ${response.statusText}`);
        }

        const data = (await response.json()) as BitbucketTreeResponse;

        // Process entries - recursively fetch directories
        for (const entry of data.values) {
          if (entry.type === 'commit_file') {
            files.push(entry);
          } else if (entry.type === 'commit_directory') {
            // Check depth before recursing
            const depth = entry.path.split('/').length;
            if (depth < this.maxDepth) {
              const subFiles = await this.fetchDirectoryTree(
                owner,
                repo,
                branch,
                entry.path
              );
              files.push(...subFiles);
            }
          }
        }

        // Check for next page
        url = data.next || null;
      }

      return files;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch Bitbucket tree: ${error.message}`);
      }
      throw new Error('Failed to fetch Bitbucket tree: Unknown error');
    }
  }

  /**
   * Fetch files within a directory recursively
   */
  private async fetchDirectoryTree(
    owner: string,
    repo: string,
    branch: string,
    path: string
  ): Promise<BitbucketFileEntry[]> {
    const files: BitbucketFileEntry[] = [];
    let url: string | null =
      `${this.apiBase}/repositories/${owner}/${repo}/src/${branch}/${path}?pagelen=100`;

    while (url) {
      const response = await fetch(url);

      if (!response.ok) {
        // Skip directories that can't be accessed
        return files;
      }

      const data = (await response.json()) as BitbucketTreeResponse;

      for (const entry of data.values) {
        if (entry.type === 'commit_file') {
          files.push(entry);
        } else if (entry.type === 'commit_directory') {
          // Check depth before recursing
          const depth = entry.path.split('/').length;
          if (depth < this.maxDepth) {
            const subFiles = await this.fetchDirectoryTree(
              owner,
              repo,
              branch,
              entry.path
            );
            files.push(...subFiles);
          }
        }
      }

      url = data.next || null;
    }

    return files;
  }

  /**
   * Filter tree by resource type
   */
  filterByType(tree: BitbucketFileEntry[], type: ResourceType): BitbucketFileEntry[] {
    const filename = this.getResourceFilename(type);

    return tree.filter((entry) => {
      if (entry.type !== 'commit_file') return false;

      // Check depth
      const depth = entry.path.split('/').length;
      if (depth > this.maxDepth) return false;

      // Check filename
      return entry.path.endsWith(`/${filename}`) || entry.path === filename;
    });
  }

  /**
   * Get resource filename by type
   */
  getResourceFilename(type: ResourceType): string {
    const filenames: Record<ResourceType, string> = {
      skill: 'SKILL.md',
      rule: 'RULES.md',
      command: 'COMMANDS.md',
      agent: 'AGENT.md',
    };
    return filenames[type];
  }

  /**
   * Download files from Bitbucket
   */
  async downloadFiles(
    owner: string,
    repo: string,
    entries: BitbucketFileEntry[],
    branch: string
  ): Promise<SourceFile[]> {
    const files: SourceFile[] = [];

    for (const entry of entries) {
      try {
        const url = `${this.apiBase}/repositories/${owner}/${repo}/src/${branch}/${entry.path}`;
        const response = await fetch(url);

        if (response.ok) {
          const content = await response.text();
          files.push({
            path: entry.path,
            content,
            isDirectory: false,
          });
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.warn(`Failed to download ${entry.path}: ${error.message}`);
        } else {
          console.warn(`Failed to download ${entry.path}: Unknown error`);
        }
      }
    }

    return files;
  }
}
