# 04-TASK: RegistryResolver 구현

## 메타데이터

```yaml
우선순위: P1
복잡도: Medium
의존성: 01-TASK, 02-TASK
차단: 05
예상 LOC: ~120
```

## 목표

Registry 내부 디렉토리/리소스를 탐색하는 RegistryResolver를 구현합니다.

## 범위

### 포함

- `packages/cli/src/source/RegistryResolver.ts` 생성
- Registry 디렉토리 탐색 로직
- SKILL.md, RULES.md 등 리소스 파싱 연동

### 제외

- 실제 파싱 로직 (기존 ResourceParser 활용)
- 레거시 resolver 제거 (07-TASK에서 처리)

## 구현 가이드

### 1. RegistryResolver 클래스 생성

**파일**: `packages/cli/src/source/RegistryResolver.ts`

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RegistryDirectory, ResourceType, Resource } from '../types.js';
import { ResourceParser } from '../parser/ResourceParser.js';

export class RegistryResolver {
  private registryPath: string;
  private parser: ResourceParser;

  constructor() {
    // Registry 패키지의 resources 경로
    this.registryPath = this.findRegistryPath();
    this.parser = new ResourceParser();
  }

  /**
   * Registry 패키지 경로 찾기
   */
  private findRegistryPath(): string {
    // 개발 환경: monorepo 내부
    const devPath = path.resolve(__dirname, '../../../../registry/resources');
    if (fs.existsSync(devPath)) {
      return devPath;
    }

    // 배포 환경: node_modules
    const prodPath = require.resolve('@anthropic/ai-toolkit-registry/package.json');
    return path.join(path.dirname(prodPath), 'resources');
  }

  /**
   * 디렉토리 목록 반환
   */
  getDirectories(): RegistryDirectory[] {
    return ['common', 'frontend', 'app'];
  }

  /**
   * 특정 디렉토리/타입의 리소스 탐색
   */
  async resolve(
    directory: RegistryDirectory,
    types: ResourceType[]
  ): Promise<Resource[]> {
    const resources: Resource[] = [];

    for (const type of types) {
      const typePath = path.join(this.registryPath, directory, type);

      if (!fs.existsSync(typePath)) {
        continue;
      }

      const entries = fs.readdirSync(typePath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.')) continue;  // .gitkeep 등 제외

        const resourcePath = path.join(typePath, entry.name);
        const resource = await this.parseResource(resourcePath, type);

        if (resource) {
          resources.push(resource);
        }
      }
    }

    return resources;
  }

  /**
   * 개별 리소스 파싱
   */
  private async parseResource(
    resourcePath: string,
    type: ResourceType
  ): Promise<Resource | null> {
    const metaFile = this.getMetaFileName(type);
    const metaPath = path.join(resourcePath, metaFile);

    if (!fs.existsSync(metaPath)) {
      return null;
    }

    return this.parser.parse(metaPath, type);
  }

  /**
   * 타입별 메타데이터 파일명
   */
  private getMetaFileName(type: ResourceType): string {
    const fileNames: Record<ResourceType, string> = {
      skills: 'SKILL.md',
      rules: 'RULES.md',
      commands: 'COMMAND.md',
      agents: 'AGENT.md',
    };
    return fileNames[type];
  }

  /**
   * 리소스 전체 경로 반환 (설치용)
   */
  getResourcePath(
    directory: RegistryDirectory,
    type: ResourceType,
    name: string
  ): string {
    return path.join(this.registryPath, directory, type, name);
  }
}

export const registryResolver = new RegistryResolver();
```

### 2. Index 업데이트

**파일**: `packages/cli/src/source/index.ts`

```typescript
export { RegistryResolver, registryResolver } from './RegistryResolver.js';
// 기존 resolver들은 나중에 제거 (07-TASK)
```

## 테스트 요구사항

### 단위 테스트

```typescript
describe('RegistryResolver', () => {
  const resolver = new RegistryResolver();

  describe('getDirectories', () => {
    it('3개 디렉토리 반환', () => {
      expect(resolver.getDirectories())
        .toEqual(['common', 'frontend', 'app']);
    });
  });

  describe('resolve', () => {
    it('common/skills에서 hello-world 찾기', async () => {
      const resources = await resolver.resolve('common', ['skills']);
      expect(resources.some(r => r.name === 'hello-world')).toBe(true);
    });

    it('빈 디렉토리는 빈 배열 반환', async () => {
      const resources = await resolver.resolve('frontend', ['agents']);
      expect(resources).toEqual([]);
    });
  });

  describe('getResourcePath', () => {
    it('올바른 경로 반환', () => {
      const p = resolver.getResourcePath('common', 'skills', 'hello-world');
      expect(p).toContain('common/skills/hello-world');
    });
  });
});
```

### 엣지 케이스

- [ ] 존재하지 않는 디렉토리 처리
- [ ] 빈 디렉토리 (only .gitkeep) 처리
- [ ] 잘못된 메타파일 처리

## 체크리스트

### 구현 전

- [ ] 01-TASK 완료 확인 (types.ts)
- [ ] 02-TASK 완료 확인 (디렉토리 구조)
- [ ] 기존 ResourceParser 인터페이스 확인

### 구현 중

- [ ] RegistryResolver 클래스 구현
- [ ] Registry 경로 탐색 로직
- [ ] ResourceParser 연동
- [ ] 타입별 메타파일명 매핑

### 구현 후

- [ ] TypeScript 컴파일 성공
- [ ] hello-world 리소스 탐색 테스트

## 통합 포인트

### Export (이 태스크의 출력)

```typescript
// packages/cli/src/source/index.ts
export { RegistryResolver, registryResolver } from './RegistryResolver.js';
```

### Import (다른 태스크에서 사용)

- 05-TASK: InteractivePrompt에서 `resolve()` 호출
