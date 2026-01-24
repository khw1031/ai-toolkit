# 02-TASK: ZipExporter 구현

```yaml
우선순위: P0
복잡도: Medium
의존성: 01
차단: 04
예상 LOC: ~80
```

## 목표

archiver 라이브러리를 사용하여 리소스를 ZIP 파일로 내보내는 ZipExporter 클래스를 구현합니다.

## 범위

### 포함

- ZipExporter 클래스 생성
- `export()` 메서드 구현
- 형제 파일 포함 로직
- 전체 경로 유지 (frontend/skills/my-skill/)

### 제외

- UI/프롬프트 (03에서 수행)
- 오케스트레이션 (04에서 수행)

## 구현 가이드

### 1. 디렉토리 생성

```bash
mkdir -p packages/cli/src/export
```

### 2. ZipExporter.ts 생성

파일: `packages/cli/src/export/ZipExporter.ts`

```typescript
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import type { Resource, ResourceType, ZipResult } from '../types.js';

/**
 * ZipExporter - 리소스를 ZIP으로 내보내기
 *
 * ZIP 구조:
 *   frontend/skills/my-skill/
 *     SKILL.md
 *     scripts/
 *     references/
 */
export class ZipExporter {
  /**
   * 리소스를 ZIP으로 내보내기
   */
  async export(resources: Resource[], outputPath: string): Promise<ZipResult> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve({
          success: true,
          outputPath,
          resourceCount: resources.length,
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      for (const resource of resources) {
        const basePath = this.getResourceBasePath(resource);
        const mainFileName = this.getMainFileName(resource.type);

        // 메인 파일 추가
        archive.append(resource.content, {
          name: path.posix.join(basePath, mainFileName),
        });

        // 형제 파일 추가
        if (resource.directory?.files) {
          for (const file of resource.directory.files) {
            if (!file.isDirectory) {
              archive.append(file.content, {
                name: path.posix.join(basePath, file.path),
              });
            }
          }
        }
      }

      archive.finalize();
    });
  }

  /**
   * 리소스의 기본 경로 추출
   * 예: /path/to/registry/frontend/skills/my-skill → frontend/skills/my-skill
   */
  private getResourceBasePath(resource: Resource): string {
    // resource.path에서 directory/type/name 추출
    const parts = resource.path.split(path.sep);
    const resourcesIndex = parts.findIndex((p) => p === 'resources');
    if (resourcesIndex !== -1) {
      return parts.slice(resourcesIndex + 1).join('/');
    }
    // fallback: type/name
    return `${resource.type}/${resource.name}`;
  }

  /**
   * 리소스 타입별 메인 파일명
   */
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

### 3. index.ts export 추가 (선택)

```typescript
// packages/cli/src/export/index.ts
export { ZipExporter, zipExporter } from './ZipExporter.js';
```

## 테스트 요구사항

- [ ] `pnpm build` 성공
- [ ] 단위 테스트 (선택):

```typescript
// 테스트 시나리오
const resources = [mockResource];
const result = await zipExporter.export(resources, './test.zip');
assert(result.success === true);
assert(fs.existsSync('./test.zip'));
```

## 체크리스트

### 구현 전

- [ ] 01-TASK 완료 확인 (archiver 설치됨)

### 구현 중

- [ ] export/ 디렉토리 생성
- [ ] ZipExporter 클래스 구현
- [ ] export() 메서드 구현
- [ ] getResourceBasePath() 헬퍼 구현
- [ ] getMainFileName() 헬퍼 구현

### 구현 후

- [ ] `pnpm build` 성공
- [ ] Git 커밋

## 통합 포인트

### 출력 (export)

- `zipExporter` 싱글톤 → 04-ZipHandler에서 사용

### 입력 (import)

- `Resource`, `ResourceType`, `ZipResult` from '../types.js'
