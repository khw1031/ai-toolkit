import type { ParsedSource, Resource, ResourceType, SourceFile } from '../types.js';
import { ResourceParser } from '../parser/ResourceParser.js';

/**
 * GitHub API 응답 타입
 */
interface GitHubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

/**
 * GitHub API 에러
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

/**
 * GitHub 리소스를 찾을 수 없음
 */
export class GitHubNotFoundError extends GitHubApiError {
  constructor(path: string) {
    super(`Resource not found: ${path}`, 404, path);
    this.name = 'GitHubNotFoundError';
  }
}

/**
 * GitHub API 레이트 제한
 */
export class GitHubRateLimitError extends GitHubApiError {
  constructor(path: string) {
    super(
      'GitHub API rate limit exceeded. Try again later or use authenticated requests.',
      403,
      path
    );
    this.name = 'GitHubRateLimitError';
  }
}

/**
 * GitHubFetcher - GitHub 레포지토리에서 리소스를 가져옵니다
 */
export class GitHubFetcher {
  private parser: ResourceParser;
  private baseApiUrl = 'https://api.github.com';
  private baseRawUrl = 'https://raw.githubusercontent.com';

  constructor() {
    this.parser = new ResourceParser();
  }

  /**
   * GitHub 소스에서 리소스 목록을 가져옵니다
   */
  async fetchResources(
    source: ParsedSource,
    types: ResourceType[]
  ): Promise<Resource[]> {
    if (source.type !== 'github' || !source.owner || !source.repo) {
      throw new Error('Invalid GitHub source');
    }

    const resources: Resource[] = [];
    const ref = source.ref || 'main';

    for (const type of types) {
      const dirPath = this.getResourceDirPath(type, source.subpath);
      const typeResources = await this.fetchResourcesFromDir(
        source.owner,
        source.repo,
        dirPath,
        type,
        ref
      );
      resources.push(...typeResources);
    }

    return resources;
  }

  /**
   * 디렉토리에서 리소스를 가져옵니다
   */
  private async fetchResourcesFromDir(
    owner: string,
    repo: string,
    dirPath: string,
    type: ResourceType,
    ref: string
  ): Promise<Resource[]> {
    try {
      const contents = await this.listDirectory(owner, repo, dirPath, ref);
      const resources: Resource[] = [];

      for (const item of contents) {
        if (item.type === 'dir') {
          // 하위 디렉토리인 경우 (예: rules/progressive-disclosure/)
          const resource = await this.fetchResourceFromSubdir(
            owner,
            repo,
            item.path,
            type,
            ref
          );
          if (resource) {
            resources.push(resource);
          }
        } else if (item.type === 'file' && item.name.endsWith('.md')) {
          // 직접 .md 파일인 경우
          const resource = await this.fetchSingleResource(
            owner,
            repo,
            item.path,
            type,
            ref
          );
          if (resource) {
            resources.push(resource);
          }
        }
      }

      return resources;
    } catch (error) {
      // 디렉토리가 없는 경우 빈 배열 반환
      if (error instanceof GitHubNotFoundError) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 하위 디렉토리에서 리소스를 가져옵니다 (디렉토리 전체 복제)
   */
  private async fetchResourceFromSubdir(
    owner: string,
    repo: string,
    dirPath: string,
    type: ResourceType,
    ref: string
  ): Promise<Resource | null> {
    try {
      const contents = await this.listDirectory(owner, repo, dirPath, ref);

      // 메인 리소스 파일 찾기 (메타데이터 파싱용)
      const mainFile = this.findMainResourceFile(contents, type);

      if (!mainFile) {
        return null;
      }

      // 메인 파일 내용 가져오기
      const content = await this.fetchFileContent(owner, repo, mainFile.path, ref);

      // 디렉토리 내 모든 파일 가져오기 (메인 파일 제외)
      const siblingFiles = await this.fetchAllFilesInDir(
        owner,
        repo,
        dirPath,
        contents,
        ref,
        mainFile.name
      );

      const sourceFile: SourceFile = {
        path: mainFile.path,
        content,
        isDirectory: false,
        siblingFiles,
      };

      return this.parser.parseResource(sourceFile, type);
    } catch (error) {
      // 404는 무시하고 null 반환
      if (error instanceof GitHubNotFoundError) {
        return null;
      }
      // 다른 에러는 경고 출력 후 null 반환
      console.warn(`Failed to fetch resource from ${dirPath}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 디렉토리 내 모든 파일을 가져옵니다 (메인 파일 제외, 상대 경로)
   */
  private async fetchAllFilesInDir(
    owner: string,
    repo: string,
    basePath: string,
    contents: GitHubContent[],
    ref: string,
    excludeFile: string
  ): Promise<SourceFile[]> {
    const files: SourceFile[] = [];

    for (const item of contents) {
      // 메인 파일 제외
      if (item.type === 'file' && item.name === excludeFile) {
        continue;
      }

      if (item.type === 'file') {
        try {
          const content = await this.fetchFileContent(owner, repo, item.path, ref);
          files.push({
            path: item.name, // 파일명만 (상대 경로)
            content,
            isDirectory: false,
          });
        } catch (error) {
          console.warn(`Failed to fetch file ${item.path}:`, error instanceof Error ? error.message : error);
        }
      } else if (item.type === 'dir') {
        // 하위 디렉토리의 모든 파일을 재귀적으로 가져옴
        const dirFiles = await this.fetchDirectoryFilesRecursive(
          owner,
          repo,
          item.path,
          ref,
          basePath
        );
        files.push(...dirFiles);
      }
    }

    return files;
  }

  /**
   * 단일 리소스 파일을 가져옵니다
   */
  private async fetchSingleResource(
    owner: string,
    repo: string,
    filePath: string,
    type: ResourceType,
    ref: string
  ): Promise<Resource | null> {
    try {
      const content = await this.fetchFileContent(owner, repo, filePath, ref);

      const sourceFile: SourceFile = {
        path: filePath,
        content,
        isDirectory: false,
      };

      return this.parser.parseResource(sourceFile, type);
    } catch (error) {
      if (error instanceof GitHubNotFoundError) {
        return null;
      }
      console.warn(`Failed to fetch resource ${filePath}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 디렉토리 내 모든 파일을 재귀적으로 가져옵니다 (상대 경로 반환)
   */
  private async fetchDirectoryFilesRecursive(
    owner: string,
    repo: string,
    dirPath: string,
    ref: string,
    basePath: string
  ): Promise<SourceFile[]> {
    try {
      const contents = await this.listDirectory(owner, repo, dirPath, ref);
      const files: SourceFile[] = [];

      for (const item of contents) {
        // basePath 기준 상대 경로 계산
        const relativePath = item.path.startsWith(`${basePath}/`)
          ? item.path.slice(basePath.length + 1)
          : item.path;

        if (item.type === 'file') {
          try {
            const content = await this.fetchFileContent(owner, repo, item.path, ref);
            files.push({
              path: relativePath,
              content,
              isDirectory: false,
            });
          } catch (error) {
            console.warn(`Failed to fetch file ${item.path}:`, error instanceof Error ? error.message : error);
          }
        } else if (item.type === 'dir') {
          const subFiles = await this.fetchDirectoryFilesRecursive(
            owner,
            repo,
            item.path,
            ref,
            basePath
          );
          files.push(...subFiles);
        }
      }

      return files;
    } catch (error) {
      if (error instanceof GitHubNotFoundError) {
        return [];
      }
      console.warn(`Failed to fetch directory ${dirPath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * GitHub API로 디렉토리 목록을 가져옵니다
   */
  private async listDirectory(
    owner: string,
    repo: string,
    path: string,
    ref: string
  ): Promise<GitHubContent[]> {
    const url = `${this.baseApiUrl}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ai-toolkit',
      },
    });

    if (!response.ok) {
      this.handleHttpError(response.status, path);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * 파일 내용을 가져옵니다
   */
  private async fetchFileContent(
    owner: string,
    repo: string,
    path: string,
    ref: string
  ): Promise<string> {
    const url = `${this.baseRawUrl}/${owner}/${repo}/${ref}/${path}`;

    const response = await fetch(url);

    if (!response.ok) {
      this.handleHttpError(response.status, path);
    }

    return response.text();
  }

  /**
   * HTTP 에러를 처리합니다
   */
  private handleHttpError(status: number, path: string): never {
    switch (status) {
      case 404:
        throw new GitHubNotFoundError(path);
      case 403:
        throw new GitHubRateLimitError(path);
      case 401:
        throw new GitHubApiError('Authentication required', status, path);
      case 500:
      case 502:
      case 503:
        throw new GitHubApiError('GitHub server error. Please try again later.', status, path);
      default:
        throw new GitHubApiError(`GitHub API error: ${status}`, status, path);
    }
  }

  /**
   * 리소스 타입에 맞는 디렉토리 경로를 반환합니다
   */
  private getResourceDirPath(type: ResourceType, subpath?: string): string {
    if (subpath) {
      return subpath;
    }
    return type; // 'rules', 'skills', 'agents'
  }

  /**
   * 메인 리소스 파일을 찾습니다
   */
  private findMainResourceFile(
    contents: GitHubContent[],
    type: ResourceType
  ): GitHubContent | null {
    // 타입별 메인 파일명 (우선순위 순)
    const mainFileNames: Record<ResourceType, string[]> = {
      skills: ['SKILL.md', 'skill.md'],
      rules: ['RULE.md', 'RULES.md', 'rule.md', 'rules.md', 'README.md'],
      agents: ['AGENT.md', 'agent.md'],
    };

    const candidates = mainFileNames[type] || [];

    for (const candidate of candidates) {
      const found = contents.find(
        (item) => item.type === 'file' && item.name.toLowerCase() === candidate.toLowerCase()
      );
      if (found) {
        return found;
      }
    }

    // 첫 번째 .md 파일 반환
    return contents.find(
      (item) => item.type === 'file' && item.name.endsWith('.md')
    ) || null;
  }
}

export const githubFetcher = new GitHubFetcher();
