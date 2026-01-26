import type { ParsedSource, Resource, ResourceType, SourceFile } from '../types.js';
import { ResourceParser } from '../parser/ResourceParser.js';

/**
 * GitHub Tree API 응답의 파일 항목
 */
interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/**
 * GitHub Tree API 응답
 */
interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

/**
 * GitHub Branch API 응답
 */
interface GitHubBranchResponse {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

/**
 * 캐시된 파일 데이터
 */
interface CachedFile {
  path: string;
  content: string;
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
 *
 * 최적화: Git Trees API로 구조를 한 번에 가져오고, 파일은 병렬로 fetch합니다.
 * - API 호출: 2회 (branch SHA + tree)
 * - 파일 fetch: raw.githubusercontent.com (Rate Limit 영향 없음)
 */
export class GitHubFetcher {
  private parser: ResourceParser;
  private baseApiUrl = 'https://api.github.com';
  private baseRawUrl = 'https://raw.githubusercontent.com';

  // 병렬 fetch 동시성 제한
  private concurrencyLimit = 10;

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

    // ref가 지정되지 않으면 기본 브랜치 사용
    const ref = source.ref || (await this.getDefaultBranch(source.owner, source.repo));

    // 1. 전체 트리 구조를 한 번에 가져오기
    const tree = await this.fetchTree(source.owner, source.repo, ref);

    for (const type of types) {
      const dirPath = this.getResourceDirPath(type, source.subpath);

      // 2. 트리에서 해당 디렉토리의 파일들 필터링
      const dirFiles = this.filterTreeByPath(tree, dirPath);

      if (dirFiles.length === 0) {
        continue;
      }

      // 3. 파일 내용을 병렬로 가져오기
      const cachedFiles = await this.fetchFilesParallel(
        source.owner,
        source.repo,
        ref,
        dirFiles
      );

      // 4. 캐시된 데이터에서 리소스 파싱
      const typeResources = this.parseResourcesFromCache(cachedFiles, dirPath, type);
      resources.push(...typeResources);
    }

    return resources;
  }

  /**
   * Git Trees API로 전체 트리 구조를 가져옵니다
   */
  private async fetchTree(
    owner: string,
    repo: string,
    ref: string
  ): Promise<GitHubTreeItem[]> {
    // 먼저 ref의 commit SHA를 가져옴
    const sha = await this.getRefSha(owner, repo, ref);

    // recursive=1로 전체 트리를 한 번에 가져옴
    // Note: SHA를 직접 사용해야 함 (branch 이름은 동작하지 않음)
    const url = `${this.baseApiUrl}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;


    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ai-toolkit',
      },
    });

    if (!response.ok) {
      this.handleHttpError(response.status, `tree/${sha}`);
    }

    const data: GitHubTreeResponse = await response.json();

    if (data.truncated) {
      console.warn('Warning: Repository tree was truncated. Some files may be missing.');
    }

    return data.tree;
  }

  /**
   * 레포지토리의 기본 브랜치를 가져옵니다
   */
  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const url = `${this.baseApiUrl}/repos/${owner}/${repo}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ai-toolkit',
      },
    });

    if (!response.ok) {
      // 실패하면 'main'을 기본값으로 사용
      return 'main';
    }

    const data = (await response.json()) as { default_branch: string };
    return data.default_branch || 'main';
  }

  /**
   * ref의 commit SHA를 가져옵니다
   */
  private async getRefSha(owner: string, repo: string, ref: string): Promise<string> {
    // branch로 시도
    const branchUrl = `${this.baseApiUrl}/repos/${owner}/${repo}/branches/${ref}`;

    const response = await fetch(branchUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ai-toolkit',
      },
    });

    if (response.ok) {
      const data: GitHubBranchResponse = await response.json();
      return data.commit.sha;
    }

    // branch가 없으면 ref를 직접 SHA로 사용 시도
    if (response.status === 404) {
      // ref가 이미 SHA일 수 있음
      return ref;
    }

    this.handleHttpError(response.status, `branches/${ref}`);
  }

  /**
   * 트리에서 특정 경로의 파일들을 필터링합니다
   */
  private filterTreeByPath(tree: GitHubTreeItem[], basePath: string): GitHubTreeItem[] {
    const prefix = basePath.endsWith('/') ? basePath : `${basePath}/`;

    return tree.filter((item) => {
      // blob(파일)만 필터링
      if (item.type !== 'blob') return false;

      // basePath로 시작하는 파일만
      return item.path.startsWith(prefix) || item.path === basePath;
    });
  }

  /**
   * 파일들을 병렬로 가져옵니다 (동시성 제한 적용)
   */
  private async fetchFilesParallel(
    owner: string,
    repo: string,
    ref: string,
    items: GitHubTreeItem[]
  ): Promise<CachedFile[]> {
    const results: CachedFile[] = [];

    // 배치로 나누어 처리 (동시성 제한)
    for (let i = 0; i < items.length; i += this.concurrencyLimit) {
      const batch = items.slice(i, i + this.concurrencyLimit);

      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            const content = await this.fetchFileContent(owner, repo, item.path, ref);
            return { path: item.path, content };
          } catch (error) {
            console.warn(
              `Failed to fetch file ${item.path}:`,
              error instanceof Error ? error.message : error
            );
            return null;
          }
        })
      );

      results.push(...batchResults.filter((r): r is CachedFile => r !== null));
    }

    return results;
  }

  /**
   * 파일 내용을 가져옵니다 (raw.githubusercontent.com 사용)
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
   * 캐시된 파일에서 리소스를 파싱합니다
   */
  private parseResourcesFromCache(
    cachedFiles: CachedFile[],
    dirPath: string,
    type: ResourceType
  ): Resource[] {
    const resources: Resource[] = [];

    // 디렉토리 구조 분석
    const structure = this.analyzeDirectoryStructure(cachedFiles, dirPath);

    for (const [subdir, files] of structure.subdirectories) {
      const resource = this.parseSubdirectoryResource(subdir, files, type);
      if (resource) {
        resources.push(resource);
      }
    }

    // 루트 레벨 .md 파일 처리
    for (const file of structure.rootFiles) {
      if (file.path.endsWith('.md')) {
        const resource = this.parseSingleFileResource(file, type);
        if (resource) {
          resources.push(resource);
        }
      }
    }

    return resources;
  }

  /**
   * 디렉토리 구조 분석
   */
  private analyzeDirectoryStructure(
    files: CachedFile[],
    basePath: string
  ): {
    subdirectories: Map<string, CachedFile[]>;
    rootFiles: CachedFile[];
  } {
    const subdirectories = new Map<string, CachedFile[]>();
    const rootFiles: CachedFile[] = [];
    const prefix = basePath.endsWith('/') ? basePath : `${basePath}/`;

    for (const file of files) {
      // basePath에서 상대 경로 계산
      const relativePath = file.path.startsWith(prefix)
        ? file.path.slice(prefix.length)
        : file.path;

      const parts = relativePath.split('/');

      if (parts.length === 1) {
        // 루트 레벨 파일
        rootFiles.push(file);
      } else {
        // 하위 디렉토리 파일
        const subdirName = parts[0];
        const subdirPath = `${basePath}/${subdirName}`;

        if (!subdirectories.has(subdirPath)) {
          subdirectories.set(subdirPath, []);
        }
        subdirectories.get(subdirPath)!.push(file);
      }
    }

    return { subdirectories, rootFiles };
  }

  /**
   * 하위 디렉토리에서 리소스 파싱
   */
  private parseSubdirectoryResource(
    subdirPath: string,
    files: CachedFile[],
    type: ResourceType
  ): Resource | null {
    // 메인 파일 찾기
    const mainFile = this.findMainResourceFile(files, type);
    if (!mainFile) {
      return null;
    }

    // 메인 파일 내용 찾기
    const mainFileData = files.find((f) => f.path === mainFile.path);
    if (!mainFileData) {
      return null;
    }

    // 사이드 파일들 (메인 파일 제외)
    const siblingFiles: SourceFile[] = files
      .filter((f) => f.path !== mainFile.path)
      .map((f) => {
        // subdirPath 기준 상대 경로
        const relativePath = f.path.startsWith(`${subdirPath}/`)
          ? f.path.slice(subdirPath.length + 1)
          : this.getFileName(f.path);
        return {
          path: relativePath,
          content: f.content,
          isDirectory: false,
        };
      });

    const sourceFile: SourceFile = {
      path: mainFile.path,
      content: mainFileData.content,
      isDirectory: false,
      siblingFiles,
    };

    try {
      return this.parser.parseResource(sourceFile, type);
    } catch (error) {
      console.warn(
        `Failed to parse resource from ${subdirPath}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  /**
   * 단일 파일 리소스 파싱
   */
  private parseSingleFileResource(file: CachedFile, type: ResourceType): Resource | null {
    const sourceFile: SourceFile = {
      path: file.path,
      content: file.content,
      isDirectory: false,
    };

    try {
      return this.parser.parseResource(sourceFile, type);
    } catch (error) {
      console.warn(
        `Failed to parse resource ${file.path}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
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
   * 경로에서 파일명만 추출합니다
   */
  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  /**
   * 메인 리소스 파일을 찾습니다
   */
  private findMainResourceFile(files: CachedFile[], type: ResourceType): CachedFile | null {
    // 타입별 메인 파일명 (우선순위 순)
    const mainFileNames: Record<ResourceType, string[]> = {
      skills: ['SKILL.md', 'skill.md'],
      rules: ['RULE.md', 'RULES.md', 'rule.md', 'rules.md', 'README.md'],
      agents: ['AGENT.md', 'agent.md'],
    };

    const candidates = mainFileNames[type] || [];

    for (const candidate of candidates) {
      const found = files.find((file) => {
        const fileName = this.getFileName(file.path);
        return fileName.toLowerCase() === candidate.toLowerCase();
      });
      if (found) {
        return found;
      }
    }

    // 첫 번째 .md 파일 반환
    return files.find((file) => file.path.endsWith('.md')) || null;
  }
}

export const githubFetcher = new GitHubFetcher();
