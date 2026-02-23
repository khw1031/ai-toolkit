import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import type { ParsedSource, Resource, ResourceType, SourceFile } from '../types.js';
import { ResourceParser } from '../parser/ResourceParser.js';

const execAsync = promisify(exec);

/**
 * 캐시된 파일 데이터
 */
interface CachedFile {
  path: string;
  content: string;
}

/**
 * 파일 정보 타입
 */
interface FileEntry {
  path: string;
  type: 'file' | 'directory';
}

/**
 * Bitbucket SSH 에러
 */
export class BitbucketApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string
  ) {
    super(message);
    this.name = 'BitbucketApiError';
  }
}

/**
 * Bitbucket 리소스를 찾을 수 없음
 */
export class BitbucketNotFoundError extends BitbucketApiError {
  constructor(path: string) {
    super(`Resource not found: ${path}`, 404, path);
    this.name = 'BitbucketNotFoundError';
  }
}

/**
 * Bitbucket 레이트 제한 (SSH에서는 사용되지 않지만 호환성 유지)
 */
export class BitbucketRateLimitError extends BitbucketApiError {
  constructor(path: string) {
    super('Rate limit exceeded', 429, path);
    this.name = 'BitbucketRateLimitError';
  }
}

/**
 * BitbucketFetcher - SSH를 통해 Bitbucket 레포지토리에서 리소스를 가져옵니다
 *
 * git archive --remote 명령을 사용하여 SSH 키 인증을 활용합니다.
 * 최적화: 단일 SSH 호출로 전체 디렉토리를 가져와 캐시합니다.
 */
/**
 * 리소스 파일이 아닌 일반 문서 파일 목록
 * findMainResourceFile 폴백 및 루트 레벨 처리에서 제외됩니다.
 */
const NON_RESOURCE_FILES = [
  'README.md', 'readme.md',
  'CHANGELOG.md', 'changelog.md',
  'LICENSE.md', 'license.md',
  'CONTRIBUTING.md', 'contributing.md',
  'CLAUDE.md', 'AGENTS.md',
];

export class BitbucketFetcher {
  private parser: ResourceParser;
  private fileCache: Map<string, CachedFile[]> = new Map();

  constructor() {
    this.parser = new ResourceParser();
  }

  /**
   * SSH URL 생성
   */
  private getSshUrl(owner: string, repo: string): string {
    return `git@bitbucket.org:${owner}/${repo}.git`;
  }

  /**
   * Bitbucket 소스에서 리소스 목록을 가져옵니다
   */
  async fetchResources(
    source: ParsedSource,
    types: ResourceType[]
  ): Promise<Resource[]> {
    if (source.type !== 'bitbucket' || !source.owner || !source.repo) {
      throw new Error('Invalid Bitbucket source');
    }

    const resources: Resource[] = [];
    const ref = source.ref || 'HEAD';

    // 캐시 초기화
    this.fileCache.clear();

    for (const type of types) {
      const dirPath = this.getResourceDirPath(type, source.subpath);

      // 단일 SSH 호출로 전체 디렉토리 가져오기
      const cachedFiles = await this.fetchAndCacheDirectory(
        source.owner,
        source.repo,
        dirPath,
        ref
      );

      if (cachedFiles.length === 0) {
        continue;
      }

      // 캐시된 데이터에서 리소스 파싱
      const typeResources = this.parseResourcesFromCache(cachedFiles, dirPath, type);
      resources.push(...typeResources);
    }

    return resources;
  }

  /**
   * 단일 SSH 호출로 전체 디렉토리를 가져와 캐시합니다
   */
  private async fetchAndCacheDirectory(
    owner: string,
    repo: string,
    dirPath: string,
    ref: string
  ): Promise<CachedFile[]> {
    const cacheKey = `${owner}/${repo}/${dirPath}/${ref}`;

    // 이미 캐시되어 있으면 반환
    const cached = this.fileCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const sshUrl = this.getSshUrl(owner, repo);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bitbucket-'));

    try {
      // 단일 git archive 호출로 전체 디렉토리 추출
      await execAsync(
        `git archive --remote=${sshUrl} ${ref} ${dirPath}/ 2>/dev/null | tar -xf - -C "${tempDir}" 2>/dev/null`,
        { maxBuffer: 50 * 1024 * 1024 }
      );

      // 추출된 파일들을 메모리에 로드
      const files = await this.loadFilesFromDirectory(tempDir, dirPath);
      this.fileCache.set(cacheKey, files);

      return files;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // SSH 접근 실패
      if (errorMessage.includes('Permission denied') || errorMessage.includes('Could not read')) {
        throw new BitbucketApiError(
          'SSH access denied. Check your SSH key configuration.',
          403,
          dirPath
        );
      }

      // 경로가 없는 경우 - 빈 배열 반환
      if (
        errorMessage.includes('did not match any files') ||
        errorMessage.includes('path not found') ||
        errorMessage.includes('tar: Error exit')
      ) {
        this.fileCache.set(cacheKey, []);
        return [];
      }

      throw new BitbucketApiError(`SSH error: ${errorMessage}`, 500, dirPath);
    } finally {
      // 임시 디렉토리 정리
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // 정리 실패 무시
      }
    }
  }

  /**
   * 디렉토리에서 모든 파일을 재귀적으로 로드합니다
   */
  private async loadFilesFromDirectory(
    baseDir: string,
    relativeTo: string
  ): Promise<CachedFile[]> {
    const files: CachedFile[] = [];
    const targetDir = path.join(baseDir, relativeTo);

    try {
      await this.loadFilesRecursive(targetDir, relativeTo, files);
    } catch {
      // 디렉토리가 없으면 빈 배열 반환
    }

    return files;
  }

  /**
   * 재귀적으로 파일 로드
   */
  private async loadFilesRecursive(
    dir: string,
    basePath: string,
    files: CachedFile[]
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        await this.loadFilesRecursive(fullPath, relativePath, files);
      } else if (entry.isFile()) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({ path: relativePath, content });
        } catch {
          // 파일 읽기 실패 무시
        }
      }
    }
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

    // 루트 레벨 .md 파일 처리 (비-리소스 파일 제외)
    for (const file of structure.rootFiles) {
      const fileName = this.getFileName(file.path);
      if (file.path.endsWith('.md') &&
          !NON_RESOURCE_FILES.some(nr => fileName.toLowerCase() === nr.toLowerCase())) {
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
    // 파일 엔트리로 변환
    const entries: FileEntry[] = files.map((f) => ({
      path: f.path,
      type: 'file' as const,
    }));

    // 메인 파일 찾기
    const mainFile = this.findMainResourceFile(entries, type);
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
  private parseSingleFileResource(
    file: CachedFile,
    type: ResourceType
  ): Resource | null {
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
    const cleanPath = filePath.endsWith('/') ? filePath.slice(0, -1) : filePath;
    const parts = cleanPath.split('/');
    return parts[parts.length - 1];
  }

  /**
   * 메인 리소스 파일을 찾습니다
   */
  private findMainResourceFile(
    entries: FileEntry[],
    type: ResourceType
  ): FileEntry | null {
    // 타입별 메인 파일명 (우선순위 순)
    const mainFileNames: Record<ResourceType, string[]> = {
      skills: ['SKILL.md', 'skill.md'],
      rules: ['RULE.md', 'RULES.md', 'rule.md', 'rules.md'],
      agents: ['AGENT.md', 'agent.md'],
    };

    const candidates = mainFileNames[type] || [];

    for (const candidate of candidates) {
      const found = entries.find((entry) => {
        const fileName = this.getFileName(entry.path);
        return entry.type === 'file' && fileName.toLowerCase() === candidate.toLowerCase();
      });
      if (found) {
        return found;
      }
    }

    // 비-리소스 파일을 제외한 첫 번째 .md 파일 반환
    return (
      entries.find((entry) => {
        const fileName = this.getFileName(entry.path);
        return entry.type === 'file' && fileName.endsWith('.md') &&
          !NON_RESOURCE_FILES.some(nr => fileName.toLowerCase() === nr.toLowerCase());
      }) || null
    );
  }
}

export const bitbucketFetcher = new BitbucketFetcher();
