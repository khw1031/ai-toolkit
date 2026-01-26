import { interactivePrompt } from '../prompts/InteractivePrompt.js';
import { InstallManager } from '../install/InstallManager.js';
import { Logger } from '../utils/Logger.js';
import { parseSource, getSourceDisplayName } from '../source/SourceParser.js';
import { githubFetcher } from '../fetch/GitHubFetcher.js';
import { bitbucketFetcher } from '../fetch/BitbucketFetcher.js';
import { pathResolver } from '../path/PathResolver.js';
import type { InstallRequest, InstallResult, AgentKey, ParsedSource, ResourceType } from '../types.js';

/**
 * CLI 실행 옵션
 */
export interface CommandOptions {
  source?: string;
  agent?: string;
  scope?: 'project' | 'global';
  yes?: boolean;
}

/**
 * CommandHandler - 외부 소스 기반 설치
 *
 * 지원 소스 포맷:
 * - GitHub shorthand: owner/repo
 * - GitHub URL: https://github.com/owner/repo
 * - GitHub URL with path: https://github.com/owner/repo/tree/main/skills/frontend-design
 * - GitLab URL: https://gitlab.com/owner/repo
 * - Git URL: git@github.com:owner/repo.git
 * - Direct URL: https://raw.githubusercontent.com/.../SKILL.md
 */
export class CommandHandler {
  private installManager: InstallManager;
  private logger: Logger;

  constructor() {
    this.installManager = new InstallManager();
    this.logger = new Logger();
  }

  /**
   * CLI 실행 진입점
   */
  async run(options: CommandOptions = {}): Promise<void> {
    try {
      this.logger.displayWelcome();

      if (options.source) {
        // 소스가 제공된 경우: 외부 소스에서 설치
        await this.runWithSource(options);
      } else {
        // 소스가 없는 경우: 인터랙티브 모드
        await this.runInteractive(options);
      }

      this.logger.displayCompletion();
    } catch (error) {
      if (error instanceof Error && error.message === 'Installation cancelled') {
        this.logger.info('Installation cancelled');
        return;
      }
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 소스가 제공된 경우 실행
   */
  private async runWithSource(options: CommandOptions): Promise<void> {
    const parsed = parseSource(options.source!);

    this.logger.info(`Source: ${getSourceDisplayName(parsed)}`);

    // Agent 결정 (옵션 또는 기본값)
    const agent: AgentKey = (options.agent as AgentKey) || 'claude-code';
    const scope = options.scope || 'project';

    // 지원하는 모든 리소스 타입 가져오기
    const types: ResourceType[] = pathResolver.getSupportedTypes(agent);

    // 리소스 fetching
    this.logger.startProgress('Fetching resources from source...');

    try {
      let resources;
      if (parsed.type === 'github') {
        resources = await githubFetcher.fetchResources(parsed, types);
      } else if (parsed.type === 'bitbucket') {
        resources = await bitbucketFetcher.fetchResources(parsed, types);
      } else {
        this.logger.failProgress(`Source type "${parsed.type}" is not yet supported.`);
        return;
      }

      if (resources.length === 0) {
        this.logger.warnProgress('No resources found in source.');
        return;
      }

      this.logger.succeedProgress(`Found ${resources.length} resource(s)`);

      // 리소스 선택 (--yes가 없으면 interactive)
      let selectedResources = resources;
      if (!options.yes) {
        selectedResources = await interactivePrompt.selectResources(resources, types);
        if (selectedResources.length === 0) {
          this.logger.info('No resources selected.');
          return;
        }
      }

      // 설치 요청 생성
      const installRequests: InstallRequest[] = selectedResources.map((resource) => ({
        resource,
        agent,
        scope,
        onDuplicate: 'compare' as const,
      }));

      // 설치 실행
      this.logger.startProgress(`Installing ${installRequests.length} resource(s)...`);
      const results = await this.installManager.install(installRequests);
      this.logger.succeedProgress('Installation complete');

      // 결과 출력
      this.printResults(results);
    } catch (error) {
      this.logger.failProgress(`Failed to fetch resources: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 인터랙티브 모드 실행
   */
  private async runInteractive(options: CommandOptions): Promise<void> {
    // Interactive 플로우 실행
    const result = await interactivePrompt.run();

    if (result.resources.length === 0) {
      this.logger.info('No resources selected.');
      return;
    }

    // 설치 요청 생성
    const installRequests: InstallRequest[] = result.resources.map((resource) => ({
      resource,
      agent: result.agent,
      scope: result.scope,
      onDuplicate: 'compare' as const,
    }));

    // 설치 실행
    this.logger.startProgress(`Installing ${installRequests.length} resource(s)...`);
    const results = await this.installManager.install(installRequests);
    this.logger.succeedProgress('Installation complete');

    // 결과 출력
    this.printResults(results);
  }

  /**
   * 파싱된 소스 정보 로깅 (디버깅용)
   */
  private logParsedSource(parsed: ParsedSource): void {
    console.log('\nParsed source details:');
    console.log(JSON.stringify(parsed, null, 2));
  }

  /**
   * 설치 결과 출력
   */
  private printResults(results: InstallResult[]): void {
    this.logger.displayResults(results);
  }
}

// Singleton instance export
export const commandHandler = new CommandHandler();
