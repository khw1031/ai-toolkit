import { zipPrompt } from '../prompts/ZipPrompt.js';
import { zipExporter } from '../export/ZipExporter.js';
import { Logger } from '../utils/Logger.js';
import type { ZipResult } from '../types.js';

/**
 * ZipHandler - ZIP 내보내기 워크플로우 오케스트레이션
 */
export class ZipHandler {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  /**
   * ZIP 내보내기 실행
   */
  async run(): Promise<void> {
    try {
      // 1. Interactive 선택
      const result = await zipPrompt.run();

      if (result.resources.length === 0) {
        this.logger.warn('No resources selected. Exiting.');
        return;
      }

      // 2. ZIP 생성
      const outputPath = this.generateOutputPath();
      this.logger.startProgress('Creating ZIP...');

      const zipResult = await zipExporter.export(result.resources, outputPath);

      // 3. 결과 출력
      if (zipResult.success) {
        this.logger.succeedProgress('ZIP created successfully');
        this.printResult(zipResult);
      } else {
        this.logger.failProgress('ZIP creation failed');
        if (zipResult.error) {
          this.logger.error(zipResult.error);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Export cancelled') {
        this.logger.info('Export cancelled');
        return;
      }
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 출력 파일 경로 생성
   */
  private generateOutputPath(): string {
    const date = new Date().toISOString().split('T')[0];
    return `ai-toolkit-export-${date}.zip`;
  }

  /**
   * 결과 출력
   */
  private printResult(result: ZipResult): void {
    console.log('');
    console.log('--- Export Complete ---');
    console.log(`File: ${result.outputPath}`);
    console.log(`Resources: ${result.resourceCount}`);
    console.log('');
  }
}

export const zipHandler = new ZipHandler();
