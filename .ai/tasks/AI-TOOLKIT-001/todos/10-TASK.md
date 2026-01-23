# Task 10: InteractivePrompt 구현

```yaml
우선순위: P1
복잡도: Medium
의존성: 04
차단: 16
```

---

## 목표

inquirer 기반 인터랙티브 UI를 구현하여 사용자 입력을 받습니다.

---

## 범위

### 포함 사항

- InteractivePrompt 클래스 (inquirer 기반)
- Type 선택 (Skills/Rules/Commands/Agents)
- Source 입력 (GitHub/Bitbucket/Local/URL)
- Resource 선택 (multi-select)
- Agent 선택 (multi-select)
- Scope 선택 (project/global)
- Duplicate 처리 선택 (Skip/Overwrite/Rename/Backup/Compare)
- CommandHandler에 통합

### 제외 사항

- 일괄 처리 프롬프트 (Task 14)
- Compare diff 표시 (Task 14)

---

## 구현 가이드

### 1. package.json 의존성 추가

**위치**: `packages/cli/package.json`

```json
{
  "dependencies": {
    "inquirer": "^9.0.0",
    "@types/inquirer": "^9.0.0"
  }
}
```

### 2. src/prompts/InteractivePrompt.ts

**위치**: `packages/cli/src/prompts/InteractivePrompt.ts`

```typescript
import inquirer from 'inquirer';
import { PathResolver } from '@ai-toolkit/registry';
import type { ResourceType, AgentKey, Resource } from '../types';

export interface InteractiveResult {
  type: ResourceType;
  source: string;
  resources: Resource[];
  agents: AgentKey[];
  scope: 'project' | 'global';
}

export class InteractivePrompt {
  private pathResolver: PathResolver;

  constructor() {
    this.pathResolver = new PathResolver();
  }

  /**
   * Run interactive prompts
   */
  async run(): Promise<InteractiveResult> {
    console.log('Welcome to AI Toolkit!\n');

    const type = await this.selectType();
    const source = await this.selectSource();
    const agents = await this.selectAgents();
    const scope = await this.selectScope();

    return {
      type,
      source,
      resources: [], // Will be populated after source resolution
      agents,
      scope,
    };
  }

  /**
   * Select resource type
   */
  async selectType(): Promise<ResourceType> {
    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What do you want to install?',
        choices: [
          { name: 'Skills - AI agent capabilities', value: 'skill' },
          { name: 'Rules - Coding guidelines', value: 'rule' },
          { name: 'Commands - CLI commands', value: 'command' },
          { name: 'Agents - Agent configurations', value: 'agent' },
        ],
      },
    ]);
    return type;
  }

  /**
   * Select source
   */
  async selectSource(): Promise<string> {
    const { sourceType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'sourceType',
        message: 'Where do you want to install from?',
        choices: [
          { name: 'GitHub repository', value: 'github' },
          { name: 'Local directory', value: 'local' },
          { name: 'Bitbucket repository', value: 'bitbucket' },
          { name: 'Direct URL', value: 'url' },
        ],
      },
    ]);

    const { source } = await inquirer.prompt([
      {
        type: 'input',
        name: 'source',
        message: this.getSourcePromptMessage(sourceType),
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Source cannot be empty';
          }
          return true;
        },
      },
    ]);

    return source;
  }

  /**
   * Get source prompt message
   */
  private getSourcePromptMessage(sourceType: string): string {
    const messages: Record<string, string> = {
      github: 'Enter GitHub repository (owner/repo):',
      bitbucket: 'Enter Bitbucket repository (owner/repo):',
      local: 'Enter local directory path:',
      url: 'Enter direct URL to resource file:',
    };
    return messages[sourceType] || 'Enter source:';
  }

  /**
   * Select resources from list
   */
  async selectResources(resources: Resource[]): Promise<Resource[]> {
    if (resources.length === 0) {
      console.log('\n⚠ No resources found in the source.');
      return [];
    }

    const { selectedResources } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedResources',
        message: 'Select resources to install:',
        choices: resources.map((r) => ({
          name: `${r.name}${r.description ? ` - ${r.description}` : ''}`,
          value: r,
          checked: false,
        })),
        validate: (input) => {
          if (input.length === 0) {
            return 'You must select at least one resource';
          }
          return true;
        },
      },
    ]);

    return selectedResources;
  }

  /**
   * Select agents
   */
  async selectAgents(): Promise<AgentKey[]> {
    const allAgents = this.pathResolver.getSupportedAgents();

    const { agents } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'agents',
        message: 'Select agents to install for:',
        choices: allAgents.map((key) => ({
          name: this.pathResolver.getAgentName(key),
          value: key,
          checked: false,
        })),
        validate: (input) => {
          if (input.length === 0) {
            return 'You must select at least one agent';
          }
          return true;
        },
      },
    ]);

    return agents;
  }

  /**
   * Select scope
   */
  async selectScope(): Promise<'project' | 'global'> {
    const { scope } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scope',
        message: 'Where do you want to install?',
        choices: [
          { name: 'Project - Current directory (.claude/, .cursor/, etc.)', value: 'project' },
          { name: 'Global - User home directory (~/.claude/, ~/.cursor/, etc.)', value: 'global' },
        ],
      },
    ]);
    return scope;
  }

  /**
   * Handle single duplicate
   */
  async handleDuplicate(resourceName: string): Promise<'skip' | 'overwrite' | 'rename' | 'backup' | 'compare'> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `⚠ "${resourceName}" already exists. What do you want to do?`,
        choices: [
          { name: 'Skip - Keep existing file', value: 'skip' },
          { name: 'Overwrite - Replace with new version', value: 'overwrite' },
          { name: 'Rename - Save as new (e.g., skill-2)', value: 'rename' },
          { name: 'Backup - Backup existing and overwrite', value: 'backup' },
          { name: 'Compare - View differences (Task 14)', value: 'compare' },
        ],
      },
    ]);
    return action;
  }
}
```

### 3. CommandHandler 통합

**위치**: `packages/cli/src/commands/CommandHandler.ts`

기존 CommandHandler에 추가:

```typescript
import { InteractivePrompt } from '../prompts/InteractivePrompt';
import { GitHubResolver } from '../source/GitHubResolver';
import { LocalResolver } from '../source/LocalResolver';
import { ResourceParser } from '../parser/ResourceParser';

// In CommandHandler class:

private async runInteractive(command: Command): Promise<void> {
  const prompt = new InteractivePrompt();
  const result = await prompt.run();

  // Resolve source
  const resolver = this.detectSourceType(result.source) === 'github'
    ? new GitHubResolver()
    : new LocalResolver();

  const sourceFiles = await resolver.resolve(result.source, result.type);

  // Parse resources
  const parser = new ResourceParser();
  const resources = parser.parseResources(sourceFiles, result.type);

  // Let user select resources
  const selectedResources = await prompt.selectResources(resources);

  console.log(`Selected ${selectedResources.length} resources for ${result.agents.length} agents`);
  console.log('Installation will be implemented in subsequent tasks');
}

private detectSourceType(source: string): 'github' | 'bitbucket' | 'local' | 'url' {
  if (source.includes('github.com') || /^[^\/]+\/[^\/]+$/.test(source)) {
    return 'github';
  }
  if (source.includes('bitbucket.org')) {
    return 'bitbucket';
  }
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return 'url';
  }
  return 'local';
}
```

---

## 테스트 요구사항

### 수동 테스트

```bash
pnpm --filter @ai-toolkit/cli build
node packages/cli/bin/ai-toolkit.js

# Follow interactive prompts:
# 1. Select "Skills"
# 2. Select "GitHub repository"
# 3. Enter "your-username/test-repo"
# 4. Select agents
# 5. Select scope
```

---

## 체크리스트

### 구현 전

- [ ] Task 04 완료 확인

### 구현 중

- [ ] inquirer 의존성 추가
- [ ] InteractivePrompt.ts 구현
- [ ] selectType() 구현
- [ ] selectSource() 구현
- [ ] selectResources() 구현
- [ ] selectAgents() 구현
- [ ] selectScope() 구현
- [ ] handleDuplicate() 구현
- [ ] CommandHandler 통합

### 구현 후

- [ ] `pnpm install` (새 의존성)
- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `node packages/cli/bin/ai-toolkit.js` 실행
- [ ] 모든 프롬프트 동작 확인

---

## 통합 포인트

### 출력 (Export)

- InteractivePrompt 클래스 (Task 14에서 확장)

### 입력 (Import)

- PathResolver (Task 05)
- ResourceType, AgentKey (Task 03, 05)

---

## 완료 조건

- [x] InteractivePrompt 구현 완료
- [x] 모든 선택 프롬프트 동작
- [x] CommandHandler 통합
- [x] 사용자 입력 검증
- [x] 인터랙티브 모드 실행 성공

---

## Git 커밋

```bash
git add packages/cli/src/prompts/InteractivePrompt.ts packages/cli/src/commands/CommandHandler.ts packages/cli/package.json
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement InteractivePrompt with inquirer UI"
```

---

## 완료 후: TASK_MASTER 업데이트

**중요**: 이 작업 완료 후 반드시 `.ai/tasks/AI-TOOLKIT-001/todos/00-TASK_MASTER.md`의 진행 상황을 업데이트하세요.

**업데이트 항목**:
- [ ] 해당 서브태스크의 상태를 `✅ completed`로 변경
- [ ] 최근 업데이트 테이블에 완료 날짜 추가
- [ ] Phase 진행률 업데이트
