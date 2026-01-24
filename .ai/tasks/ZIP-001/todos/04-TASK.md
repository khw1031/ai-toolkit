# 04-TASK: ZipHandler 및 Commander 통합

```yaml
우선순위: P1
복잡도: Medium
의존성: 02, 03
차단: 05
예상 LOC: ~100
```

## 목표

ZipHandler 클래스를 구현하고 index.ts에 commander를 통합하여 `--zip` 플래그를 처리합니다.

## 범위

### 포함

- ZipHandler 클래스 생성
- run() 메서드 (오케스트레이션)
- index.ts에 commander 통합
- `--zip` 플래그 분기 처리

### 제외

- ZipPrompt, ZipExporter 구현 (02, 03에서 완료)

## 구현 가이드

### 1. ZipHandler.ts 생성

파일: `packages/cli/src/commands/ZipHandler.ts`

```typescript
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
```

### 2. index.ts 수정

파일: `packages/cli/src/index.ts`

**수정 전:**
```typescript
import { commandHandler } from "./commands/CommandHandler.js";

export async function main(): Promise<void> {
  await commandHandler.run();
}
```

**수정 후:**
```typescript
import { program } from 'commander';
import { commandHandler } from "./commands/CommandHandler.js";
import { zipHandler } from "./commands/ZipHandler.js";

// Export public API
export { InstallManager } from "./install/InstallManager.js";
export { DuplicateHandler } from "./install/DuplicateHandler.js";
export { BatchHandler } from "./install/BatchHandler.js";
export type { BatchAction, ResultSummary } from "./install/BatchHandler.js";
export { generateDiff, formatDiff, displayDiff } from "./utils/diff.js";
export { PathResolver, pathResolver } from "./path/index.js";
export { CommandHandler, commandHandler } from "./commands/CommandHandler.js";
export { ZipHandler, zipHandler } from "./commands/ZipHandler.js";

// CLI 옵션 파싱
program
  .name('ai-toolkit')
  .description('AI Toolkit - Install and manage AI resources')
  .option('--zip', 'Export resources as ZIP file')
  .parse();

const options = program.opts<{ zip?: boolean }>();

export async function main(): Promise<void> {
  if (options.zip) {
    await zipHandler.run();
  } else {
    await commandHandler.run();
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
```

## 테스트 요구사항

- [ ] `pnpm build` 성공
- [ ] `npx ai-toolkit --zip` 실행 시 ZIP 플로우 시작
- [ ] `npx ai-toolkit` (플래그 없음) 기존 설치 플로우 정상 동작

## 체크리스트

### 구현 전

- [ ] 02-TASK 완료 확인 (ZipExporter 구현됨)
- [ ] 03-TASK 완료 확인 (ZipPrompt 구현됨)

### 구현 중

- [ ] ZipHandler 클래스 생성
- [ ] run() 메서드 구현
- [ ] generateOutputPath() 헬퍼 구현
- [ ] printResult() 메서드 구현
- [ ] index.ts에 commander 추가
- [ ] --zip 플래그 분기 처리

### 구현 후

- [ ] `pnpm build` 성공
- [ ] 기존 플로우 테스트 통과
- [ ] Git 커밋

## 통합 포인트

### 출력 (export)

- `zipHandler` 싱글톤 → index.ts에서 사용

### 입력 (import)

- `zipPrompt` from '../prompts/ZipPrompt.js'
- `zipExporter` from '../export/ZipExporter.js'
- `Logger` from '../utils/Logger.js'
