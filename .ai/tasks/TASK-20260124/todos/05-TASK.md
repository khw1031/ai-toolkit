# 05-TASK: InteractivePrompt 리팩토링

## 메타데이터

```yaml
우선순위: P1
복잡도: High
의존성: 01-TASK, 03-TASK, 04-TASK
차단: 06
예상 LOC: ~200
```

## 목표

InteractivePrompt의 플로우를 `Agent → Directory → Type → Resources → Confirm`으로 변경하고, Agent별 지원 타입 필터링을 적용합니다.

## 범위

### 포함

- `packages/cli/src/prompts/InteractivePrompt.ts` 전체 리팩토링
- 새 플로우 구현
- PathResolver, RegistryResolver 연동

### 제외

- CommandHandler 연동 (06-TASK에서 처리)
- 레거시 코드 제거 (07-TASK에서 처리)

## 구현 가이드

### 1. 새 플로우 설계

```
기존: type → source → agents → scope → resources → confirm
변경: agent → directory → type → resources → scope → confirm
```

### 2. InteractivePrompt 리팩토링

**파일**: `packages/cli/src/prompts/InteractivePrompt.ts`

```typescript
import inquirer from 'inquirer';
import { AgentKey, RegistryDirectory, ResourceType, Resource, InteractiveResult } from '../types.js';
import { pathResolver } from '../path/PathResolver.js';
import { registryResolver } from '../source/RegistryResolver.js';

export class InteractivePrompt {
  /**
   * Interactive 플로우 실행
   */
  async run(): Promise<InteractiveResult> {
    // 1. Agent 선택
    const agent = await this.selectAgent();

    // 2. Directory 선택
    const directory = await this.selectDirectory();

    // 3. Type 선택 (Agent 지원 타입만)
    const types = await this.selectTypes(agent);

    // 4. Resources 선택
    const resources = await this.selectResources(directory, types);

    // 5. Scope 선택
    const scope = await this.selectScope();

    // 6. 확인
    const confirmed = await this.confirmInstallation(agent, resources, scope);

    if (!confirmed) {
      throw new Error('Installation cancelled');
    }

    return { agent, directory, types, resources, scope };
  }

  /**
   * Agent 선택
   */
  private async selectAgent(): Promise<AgentKey> {
    const agents = pathResolver.getAgents();

    const { agent } = await inquirer.prompt([
      {
        type: 'list',
        name: 'agent',
        message: 'Select target agent:',
        choices: agents.map(key => ({
          name: pathResolver.getAgentConfig(key).name,
          value: key,
        })),
      },
    ]);

    return agent;
  }

  /**
   * Directory 선택
   */
  private async selectDirectory(): Promise<RegistryDirectory> {
    const directories = registryResolver.getDirectories();

    const directoryDescriptions: Record<RegistryDirectory, string> = {
      common: 'Common - General purpose resources',
      frontend: 'Frontend - React, Vue, etc.',
      app: 'App - Mobile, Desktop apps',
    };

    const { directory } = await inquirer.prompt([
      {
        type: 'list',
        name: 'directory',
        message: 'Select resource directory:',
        choices: directories.map(dir => ({
          name: directoryDescriptions[dir],
          value: dir,
        })),
      },
    ]);

    return directory;
  }

  /**
   * Type 선택 (Agent 지원 타입만 표시)
   */
  private async selectTypes(agent: AgentKey): Promise<ResourceType[]> {
    const supportedTypes = pathResolver.getSupportedTypes(agent);

    const typeDescriptions: Record<ResourceType, string> = {
      skills: 'Skills - Reusable prompts and instructions',
      rules: 'Rules - Project guidelines and standards',
      commands: 'Commands - Custom slash commands',
      agents: 'Agents - Specialized agent configurations',
    };

    const { types } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'types',
        message: `Select resource types (${pathResolver.getAgentConfig(agent).name} supports):`,
        choices: supportedTypes.map(type => ({
          name: typeDescriptions[type],
          value: type,
          checked: type === 'skills',  // skills 기본 선택
        })),
        validate: (input: ResourceType[]) => {
          if (input.length === 0) {
            return 'Please select at least one type';
          }
          return true;
        },
      },
    ]);

    return types;
  }

  /**
   * Resources 선택
   */
  private async selectResources(
    directory: RegistryDirectory,
    types: ResourceType[]
  ): Promise<Resource[]> {
    const availableResources = await registryResolver.resolve(directory, types);

    if (availableResources.length === 0) {
      console.log('No resources found in selected directory/types');
      return [];
    }

    const { resources } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'resources',
        message: 'Select resources to install:',
        choices: availableResources.map(r => ({
          name: `[${r.type}] ${r.name} - ${r.description || 'No description'}`,
          value: r,
        })),
        validate: (input: Resource[]) => {
          if (input.length === 0) {
            return 'Please select at least one resource';
          }
          return true;
        },
      },
    ]);

    return resources;
  }

  /**
   * Scope 선택
   */
  private async selectScope(): Promise<'project' | 'global'> {
    const { scope } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scope',
        message: 'Select installation scope:',
        choices: [
          { name: 'Project - Install in current directory', value: 'project' },
          { name: 'Global - Install in home directory', value: 'global' },
        ],
        default: 'project',
      },
    ]);

    return scope;
  }

  /**
   * 설치 확인
   */
  private async confirmInstallation(
    agent: AgentKey,
    resources: Resource[],
    scope: 'project' | 'global'
  ): Promise<boolean> {
    console.log('\n--- Installation Summary ---');
    console.log(`Agent: ${pathResolver.getAgentConfig(agent).name}`);
    console.log(`Scope: ${scope}`);
    console.log(`Resources (${resources.length}):`);
    resources.forEach(r => {
      const targetPath = pathResolver.resolveAgentPath(agent, r.type, scope);
      console.log(`  - [${r.type}] ${r.name} → ${targetPath}`);
    });
    console.log('');

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with installation?',
        default: true,
      },
    ]);

    return confirmed;
  }
}

export const interactivePrompt = new InteractivePrompt();
```

## 테스트 요구사항

### 통합 테스트 시나리오

```typescript
describe('InteractivePrompt', () => {
  // Mock inquirer for testing

  it('Agent 선택 후 해당 Agent 지원 타입만 표시', async () => {
    // claude-code 선택 시 4개 타입 표시
    // github-copilot 선택 시 2개 타입만 표시
  });

  it('Directory 선택 후 해당 리소스만 표시', async () => {
    // common 선택 시 common/ 내 리소스만 표시
  });

  it('설치 경로가 Agent/Type에 맞게 표시', async () => {
    // github-copilot + rules → .github/instructions/ 표시
  });
});
```

### 수동 테스트 체크리스트

- [ ] Agent 선택 화면에 4개 agent만 표시
- [ ] claude-code 선택 시 4개 타입 체크박스
- [ ] github-copilot 선택 시 2개 타입 체크박스 (skills, rules)
- [ ] Directory 선택 후 해당 디렉토리 리소스만 표시
- [ ] 설치 확인 시 올바른 경로 표시

## 체크리스트

### 구현 전

- [ ] 01-TASK 완료 확인 (types)
- [ ] 03-TASK 완료 확인 (PathResolver)
- [ ] 04-TASK 완료 확인 (RegistryResolver)
- [ ] 기존 InteractivePrompt.ts 백업

### 구현 중

- [ ] selectAgent() 구현
- [ ] selectDirectory() 구현
- [ ] selectTypes() - Agent 필터링 적용
- [ ] selectResources() - RegistryResolver 연동
- [ ] selectScope() 구현
- [ ] confirmInstallation() - 경로 표시

### 구현 후

- [ ] TypeScript 컴파일 성공
- [ ] 전체 플로우 수동 테스트
- [ ] 모든 Agent에 대해 타입 필터링 동작 확인

## 통합 포인트

### Export (이 태스크의 출력)

```typescript
// packages/cli/src/prompts/InteractivePrompt.ts
export { InteractivePrompt, interactivePrompt } from './InteractivePrompt.js';
```

### Import (다른 태스크에서 사용)

- 06-TASK: CommandHandler에서 `run()` 호출
