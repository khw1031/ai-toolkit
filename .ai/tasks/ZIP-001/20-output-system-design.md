# Step 2: Design & Planning 결과

## 1. 요약

`--zip` 플래그를 commander로 파싱하여 ZipHandler로 분기. ZipPrompt로 디렉토리/타입/리소스 선택 후 ZipExporter(archiver 기반)로 ZIP 생성. 기존 싱글톤 패턴과 일관된 구조 유지.

## 2. 코드베이스 분석

### 2.1 프로젝트 구조

```
packages/cli/src/
├── commands/
│   └── CommandHandler.ts    # 기존 설치 핸들러 (싱글톤)
├── prompts/
│   └── InteractivePrompt.ts # 6단계 선택 플로우 (싱글톤)
├── source/
│   └── RegistryResolver.ts  # 리소스 스캔 (싱글톤)
├── utils/
│   └── Logger.ts            # 콘솔 출력 (싱글톤)
├── types.ts                 # 타입 정의
└── index.ts                 # CLI 진입점
```

### 2.2 기존 패턴

- **싱글톤 패턴**: 모든 핵심 모듈이 싱글톤 인스턴스 export
- **inquirer 사용**: `type: 'list'` (단일 선택), `type: 'checkbox'` (복수 선택)
- **분리된 책임**: Handler(오케스트레이션) / Prompt(UI) / Resolver(데이터)

### 2.3 관련 기존 코드

| 파일/모듈 | 역할 | 연관성 |
|-----------|------|--------|
| `InteractivePrompt.selectDirectory()` | 디렉토리 선택 UI | **재사용 가능** |
| `InteractivePrompt.selectTypes()` | 타입 선택 UI | Agent 필터 제거 후 재사용 |
| `InteractivePrompt.selectResources()` | 리소스 선택 UI | **재사용 가능** |
| `registryResolver.resolve()` | 리소스 스캔 | **직접 사용** |
| `Logger` | 진행률/메시지 출력 | **직접 사용** |

## 3. 아키텍처 설계

### 3.1 컴포넌트 구조

```
index.ts
    │
    ├─ commander: --zip 플래그 감지
    │
    ├─ [--zip 없음] → CommandHandler.run() (기존 플로우)
    │
    └─ [--zip 있음] → ZipHandler.run()
                          │
                          ├─ ZipPrompt
                          │   ├─ selectDirectories()  # 복수 선택
                          │   ├─ selectTypes()
                          │   ├─ selectResources()
                          │   └─ confirmExport()
                          │
                          └─ ZipExporter
                              └─ export(resources, outputPath)
```

### 3.2 데이터 흐름

```
User → --zip flag
         ↓
    ZipHandler.run()
         ↓
    ZipPrompt.selectDirectories() → ['common', 'frontend']
         ↓
    ZipPrompt.selectTypes() → ['skills', 'rules']
         ↓
    registryResolver.resolve() → Resource[]
         ↓
    ZipPrompt.selectResources() → 선택된 Resource[]
         ↓
    ZipPrompt.confirmExport() → boolean
         ↓
    ZipExporter.export() → ai-toolkit-export-2026-01-24.zip
         ↓
    Logger.success() → "ZIP created successfully"
```

### 3.3 인터페이스 정의

```typescript
// types.ts에 추가

/**
 * ZIP 내보내기 결과
 */
export interface ZipResult {
  success: boolean;
  outputPath: string;
  resourceCount: number;
  error?: string;
}

/**
 * ZIP 프롬프트 결과 (Agent/Scope 없음)
 */
export interface ZipPromptResult {
  directories: RegistryDirectory[];
  types: ResourceType[];
  resources: Resource[];
}
```

### 3.4 파일별 상세 설계

#### `src/index.ts` 수정

```typescript
import { program } from 'commander';
import { commandHandler } from './commands/CommandHandler.js';
import { zipHandler } from './commands/ZipHandler.js';

program
  .option('--zip', 'Export resources as ZIP file')
  .parse();

const options = program.opts();

async function main(): Promise<void> {
  if (options.zip) {
    await zipHandler.run();
  } else {
    await commandHandler.run();
  }
}
```

#### `src/commands/ZipHandler.ts` (신규)

```typescript
export class ZipHandler {
  private zipPrompt: ZipPrompt;
  private zipExporter: ZipExporter;
  private logger: Logger;

  async run(): Promise<void> {
    // 1. Welcome
    this.logger.info('AI Toolkit - ZIP Export Mode\n');

    // 2. Interactive 선택
    const result = await this.zipPrompt.run();

    // 3. ZIP 생성
    const outputPath = this.generateOutputPath();
    this.logger.startProgress('Creating ZIP...');
    const zipResult = await this.zipExporter.export(result.resources, outputPath);

    // 4. 결과 출력
    this.logger.succeedProgress(`ZIP created: ${zipResult.outputPath}`);
  }

  private generateOutputPath(): string {
    const date = new Date().toISOString().split('T')[0];
    return `ai-toolkit-export-${date}.zip`;
  }
}

export const zipHandler = new ZipHandler();
```

#### `src/prompts/ZipPrompt.ts` (신규)

```typescript
export class ZipPrompt {
  /**
   * ZIP 플로우: Directories → Types → Resources → Confirm
   */
  async run(): Promise<ZipPromptResult> {
    // 1. 디렉토리 복수 선택
    const directories = await this.selectDirectories();

    // 2. 타입 선택
    const types = await this.selectTypes();

    // 3. 리소스 선택 (여러 디렉토리 합산)
    const resources = await this.selectResources(directories, types);

    // 4. 확인
    const confirmed = await this.confirmExport(resources);
    if (!confirmed) throw new Error('Export cancelled');

    return { directories, types, resources };
  }

  async selectDirectories(): Promise<RegistryDirectory[]> {
    // checkbox로 복수 선택 가능
  }

  async selectTypes(): Promise<ResourceType[]> {
    // Agent 필터 없이 전체 타입 표시
  }

  async selectResources(
    directories: RegistryDirectory[],
    types: ResourceType[]
  ): Promise<Resource[]> {
    // 여러 디렉토리에서 리소스 수집 후 선택
  }

  async confirmExport(resources: Resource[]): Promise<boolean> {
    // 선택 요약 표시 후 확인
  }
}

export const zipPrompt = new ZipPrompt();
```

#### `src/export/ZipExporter.ts` (신규)

```typescript
import archiver from 'archiver';
import * as fs from 'fs';

export class ZipExporter {
  /**
   * 리소스를 ZIP으로 내보내기
   *
   * ZIP 구조:
   *   frontend/skills/my-skill/
   *     SKILL.md
   *     scripts/
   *     references/
   */
  async export(resources: Resource[], outputPath: string): Promise<ZipResult> {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    for (const resource of resources) {
      // 메인 파일 추가
      const basePath = this.getResourceBasePath(resource);
      archive.append(resource.content, { name: `${basePath}/${this.getMainFileName(resource.type)}` });

      // 형제 파일 추가
      if (resource.directory?.files) {
        for (const file of resource.directory.files) {
          archive.append(file.content, { name: `${basePath}/${file.path}` });
        }
      }
    }

    await archive.finalize();

    return {
      success: true,
      outputPath,
      resourceCount: resources.length,
    };
  }

  private getResourceBasePath(resource: Resource): string {
    // resource.path에서 directory/type/name 추출
    // 예: frontend/skills/my-skill
  }

  private getMainFileName(type: ResourceType): string {
    const fileNames: Record<ResourceType, string> = {
      skills: 'SKILL.md',
      rules: 'RULES.md',
      commands: 'COMMANDS.md',
      agents: 'AGENT.md',
    };
    return fileNames[type];
  }
}

export const zipExporter = new ZipExporter();
```

## 4. 구현 계획

### Phase 1: 기본 구조 생성

- [ ] `archiver` 패키지 설치
- [ ] `src/types.ts`에 `ZipResult`, `ZipPromptResult` 타입 추가
- [ ] `src/export/ZipExporter.ts` 생성 (빈 클래스)
- [ ] `src/prompts/ZipPrompt.ts` 생성 (빈 클래스)
- [ ] `src/commands/ZipHandler.ts` 생성 (빈 클래스)

### Phase 2: 핵심 로직 구현

- [ ] `ZipPrompt.selectDirectories()` 구현 (checkbox)
- [ ] `ZipPrompt.selectTypes()` 구현 (checkbox, Agent 필터 없음)
- [ ] `ZipPrompt.selectResources()` 구현 (여러 디렉토리 합산)
- [ ] `ZipPrompt.confirmExport()` 구현
- [ ] `ZipExporter.export()` 구현 (archiver 사용)

### Phase 3: 통합 및 테스트

- [ ] `ZipHandler.run()` 구현 (오케스트레이션)
- [ ] `src/index.ts`에 commander 통합
- [ ] 수동 테스트: `npx ai-toolkit --zip`
- [ ] 생성된 ZIP 검증 (압축 해제 테스트)

### Phase 4: 최적화 및 문서화

- [ ] 에러 처리 강화
- [ ] 진행률 표시 개선
- [ ] 공개 API export 정리

## 5. 기술적 위험 및 대응

| 위험 요소 | 영향도 | 대응 방안 |
|-----------|--------|----------|
| archiver 스트림 에러 | High | try-catch + 임시 파일 정리 |
| 대용량 리소스 메모리 | Medium | 스트리밍 방식 유지 (archiver 기본) |
| 경로 구분자 (Windows) | Medium | path.posix 사용하여 ZIP 내부 경로 정규화 |
| commander 충돌 | Low | 기존 코드에 commander 미사용 확인됨 |

## 6. 다음 단계

Step 3에서 구현 시 주의사항:
- Phase 1 → Phase 2 → Phase 3 순서 준수
- 각 Phase 완료 후 수동 테스트
- 기존 `npx ai-toolkit` (플래그 없음) 정상 동작 확인 필수
