import { Octokit } from '@octokit/rest';
import type { ResourceType, SourceFile } from '../types';

interface GitHubSource {
  owner: string;
  repo: string;
  branch?: string;
}

interface GitHubTreeNode {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export class GitHubResolver {
  private octokit: Octokit;
  private maxDepth = 3; // Performance limit

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Resolve GitHub source to file list
   * @param source - GitHub source (owner/repo, owner/repo@branch, or URL)
   * @param type - Resource type to filter
   */
  async resolve(source: string, type: ResourceType): Promise<SourceFile[]> {
    const parsed = this.parseSource(source);
    const tree = await this.fetchTree(parsed.owner, parsed.repo, parsed.branch);
    const filtered = this.filterByType(tree, type);
    return await this.downloadFiles(parsed.owner, parsed.repo, filtered, parsed.branch);
  }

  /**
   * Parse GitHub source
   * Supports:
   * - owner/repo
   * - owner/repo@branch
   * - https://github.com/owner/repo
   * - https://github.com/owner/repo/tree/branch
   */
  private parseSource(source: string): GitHubSource {
    // URL format
    const urlMatch = source.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (urlMatch) {
      return {
        owner: urlMatch[1],
        repo: urlMatch[2].replace('.git', ''),
        branch: urlMatch[3],
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

    throw new Error(`Invalid GitHub source: ${source}`);
  }

  /**
   * Fetch GitHub repository tree
   */
  private async fetchTree(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<GitHubTreeNode[]> {
    try {
      // Get default branch if not specified
      if (!branch) {
        const { data: repoData } = await this.octokit.repos.get({
          owner,
          repo,
        });
        branch = repoData.default_branch;
      }

      // Fetch tree recursively
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true',
      });

      return data.tree as GitHubTreeNode[];
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      if (error.status === 403) {
        throw new Error(
          'GitHub rate limit exceeded. Set GITHUB_TOKEN environment variable for higher limits.'
        );
      }
      throw new Error(`Failed to fetch GitHub tree: ${error.message}`);
    }
  }

  /**
   * Filter tree by resource type
   */
  private filterByType(tree: GitHubTreeNode[], type: ResourceType): GitHubTreeNode[] {
    const filename = this.getResourceFilename(type);

    return tree.filter((node) => {
      if (node.type !== 'blob') return false;

      // Check depth
      const depth = node.path.split('/').length;
      if (depth > this.maxDepth) return false;

      // Check filename
      return node.path.endsWith(`/${filename}`) || node.path === filename;
    });
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

  /**
   * Download files from GitHub
   */
  private async downloadFiles(
    owner: string,
    repo: string,
    nodes: GitHubTreeNode[],
    branch?: string
  ): Promise<SourceFile[]> {
    const files: SourceFile[] = [];

    for (const node of nodes) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: node.path,
          ref: branch,
        });

        if ('content' in data) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          files.push({
            path: node.path,
            content,
            isDirectory: false,
          });
        }
      } catch (error: any) {
        console.warn(`Failed to download ${node.path}: ${error.message}`);
      }
    }

    return files;
  }
}
