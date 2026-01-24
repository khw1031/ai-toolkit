import { interactivePrompt } from '../prompts/InteractivePrompt.js';
import { InstallManager } from '../install/InstallManager.js';
import { Logger } from '../utils/Logger.js';
import type { InstallRequest, InstallResult } from '../types.js';

/**
 * CommandHandler - Registry 전용 간소화 버전
 *
 * 변경사항:
 * - Non-interactive 모드 제거
 * - Source resolver 분기 제거 (GitHub/Local/URL)
 * - Registry 전용 InteractivePrompt 플로우만 지원
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
   * 항상 Interactive 모드로 실행
   */
  async run(): Promise<void> {
    try {
      this.logger.displayWelcome();

      // Interactive 플로우 실행
      const result = await interactivePrompt.run();

      // 설치 요청 생성
      const installRequests: InstallRequest[] = result.resources.map((resource) => ({
        resource,
        agent: result.agent,
        scope: result.scope,
        onDuplicate: 'compare' as const, // 기본값: 비교 후 선택
      }));

      // 설치 실행
      this.logger.startProgress(`Installing ${installRequests.length} resource(s)...`);
      const results = await this.installManager.install(installRequests);
      this.logger.succeedProgress('Installation complete');

      // 결과 출력
      this.printResults(results);

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
   * 설치 결과 출력
   */
  private printResults(results: InstallResult[]): void {
    this.logger.displayResults(results);
  }
}

// Singleton instance export
export const commandHandler = new CommandHandler();
