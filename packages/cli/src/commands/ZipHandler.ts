import inquirer from 'inquirer';
import { zipPrompt } from '../prompts/ZipPrompt.js';
import { zipExporter } from '../export/ZipExporter.js';
import { Logger } from '../utils/Logger.js';
import { parseSource, getSourceDisplayName } from '../source/SourceParser.js';
import { githubFetcher } from '../fetch/GitHubFetcher.js';
import { bitbucketFetcher } from '../fetch/BitbucketFetcher.js';
import type { ZipResult, ResourceType } from '../types.js';

/**
 * ZipHandler 옵션
 */
export interface ZipHandlerOptions {
  source?: string;
  yes?: boolean;
}

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
  async run(options: ZipHandlerOptions = {}): Promise<void> {
    try {
      console.log('AI Toolkit - ZIP Export Mode\n');

      // 1. 소스 결정 (인자 또는 프롬프트)
      const source = options.source || (await this.promptSource());

      if (!source) {
        this.logger.warn('No source provided. Exiting.');
        return;
      }

      // 2. 소스 파싱
      const parsed = parseSource(source);
      this.logger.info(`Source: ${getSourceDisplayName(parsed)}`);

      // 3. 리소스 Fetch
      this.logger.startProgress('Fetching resources from source...');

      const types: ResourceType[] = ['skills', 'rules', 'agents'];

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

      // 4. 리소스 선택
      let selectedResources = resources;
      if (!options.yes) {
        const result = await zipPrompt.run(resources);
        selectedResources = result.resources;

        if (selectedResources.length === 0) {
          this.logger.info('No resources selected.');
          return;
        }
      }

      // 5. ZIP 생성
      const outputPath = this.generateOutputPath();
      this.logger.startProgress('Creating ZIP...');

      const zipResult = await zipExporter.export(selectedResources, outputPath);

      // 6. 결과 출력
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
   * 소스 입력 프롬프트
   */
  private async promptSource(): Promise<string> {
    const { source } = await inquirer.prompt([
      {
        type: 'input',
        name: 'source',
        message: 'Enter source (GitHub shorthand or URL):',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Please enter a source';
          }
          return true;
        },
      },
    ]);

    return source.trim();
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
