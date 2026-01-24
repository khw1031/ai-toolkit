# 06-TASK: CommandHandler 단순화

## 메타데이터

```yaml
우선순위: P1
복잡도: Medium
의존성: 03-TASK, 05-TASK
차단: 07
예상 LOC: ~100
```

## 목표

CommandHandler를 Registry 전용으로 단순화하고, Non-interactive 모드와 Source resolver 분기를 제거합니다.

## 범위

### 포함

- `packages/cli/src/commands/CommandHandler.ts` 리팩토링
- `runNonInteractive()` 제거
- Source resolver 분기 제거
- InteractivePrompt + InstallManager 연동

### 제외

- 레거시 resolver 파일 삭제 (07-TASK에서 처리)
- 테스트 업데이트 (08-TASK에서 처리)

## 구현 가이드

### 1. 제거 대상 코드

```typescript
// 제거할 것들
- runNonInteractive() 메서드 전체
- isInteractive() 메서드
- sourceResolvers 관련 로직
- GitHub/Local/URL 분기 처리
```

### 2. CommandHandler 리팩토링

**파일**: `packages/cli/src/commands/CommandHandler.ts`

```typescript
import { interactivePrompt } from '../prompts/InteractivePrompt.js';
import { InstallManager } from '../install/InstallManager.js';
import { pathResolver } from '../path/PathResolver.js';
import { registryResolver } from '../source/RegistryResolver.js';
import { Logger } from '../utils/Logger.js';

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
      this.logger.info('AI Toolkit CLI');
      this.logger.info('');

      // Interactive 플로우 실행
      const result = await interactivePrompt.run();

      // 설치 요청 생성
      const installRequests = result.resources.map(resource => ({
        resource,
        agent: result.agent,
        scope: result.scope,
        targetPath: pathResolver.resolveAgentPath(
          result.agent,
          resource.type,
          result.scope
        ),
        sourcePath: registryResolver.getResourcePath(
          result.directory,
          resource.type,
          resource.name
        ),
      }));

      // 설치 실행
      const results = await this.installManager.install(installRequests);

      // 결과 출력
      this.printResults(results);

    } catch (error) {
      if (error instanceof Error && error.message === 'Installation cancelled') {
        this.logger.info('Installation cancelled');
        return;
      }
      this.logger.error(`Error: ${error}`);
      throw error;
    }
  }

  /**
   * 설치 결과 출력
   */
  private printResults(results: InstallResult[]): void {
    this.logger.info('');
    this.logger.info('--- Installation Complete ---');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      this.logger.success(`Installed: ${successful.length} resource(s)`);
      successful.forEach(r => {
        this.logger.info(`  ✓ ${r.resource.name} → ${r.targetPath}`);
      });
    }

    if (failed.length > 0) {
      this.logger.error(`Failed: ${failed.length} resource(s)`);
      failed.forEach(r => {
        this.logger.error(`  ✗ ${r.resource.name}: ${r.error}`);
      });
    }
  }
}

export const commandHandler = new CommandHandler();
```

### 3. 진입점 (index.ts) 단순화

**파일**: `packages/cli/src/index.ts`

```typescript
import { commandHandler } from './commands/CommandHandler.js';

async function main() {
  await commandHandler.run();
}

main().catch(console.error);
```

## 테스트 요구사항

### 통합 테스트

```typescript
describe('CommandHandler', () => {
  it('Interactive 플로우 완료 후 설치 실행', async () => {
    // Mock InteractivePrompt.run()
    // Mock InstallManager.install()
    // 결과 출력 확인
  });

  it('취소 시 정상 종료', async () => {
    // InteractivePrompt에서 cancel 시
    // 에러 없이 종료
  });
});
```

### 수동 테스트

- [ ] `npx ai-toolkit` 실행 시 Interactive 플로우 시작
- [ ] 전체 플로우 완료 후 설치 성공
- [ ] 취소 시 정상 종료

## 체크리스트

### 구현 전

- [ ] 03-TASK 완료 확인 (PathResolver)
- [ ] 05-TASK 완료 확인 (InteractivePrompt)
- [ ] 기존 CommandHandler.ts 백업

### 구현 중

- [ ] runNonInteractive() 제거
- [ ] isInteractive() 제거
- [ ] Source resolver 분기 제거
- [ ] InteractivePrompt 연동
- [ ] InstallManager 연동
- [ ] 결과 출력 로직

### 구현 후

- [ ] TypeScript 컴파일 성공
- [ ] 전체 플로우 수동 테스트
- [ ] 설치 결과 정상 출력

## 통합 포인트

### Export (이 태스크의 출력)

```typescript
// packages/cli/src/commands/CommandHandler.ts
export { CommandHandler, commandHandler } from './CommandHandler.js';
```

### Import (다른 태스크에서 사용)

- 07-TASK: 레거시 코드 제거 시 참조
- 08-TASK: 테스트 작성
