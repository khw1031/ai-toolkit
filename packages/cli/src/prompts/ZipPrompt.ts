import inquirer from 'inquirer';
import type {
  ResourceType,
  Resource,
  ZipPromptResult,
} from '../types.js';

/**
 * ZipPrompt - ZIP 내보내기용 선택 플로우
 *
 * 플로우: Types → Resources → Confirm
 */
export class ZipPrompt {
  /**
   * ZIP 플로우 실행
   */
  async run(availableResources: Resource[] = []): Promise<ZipPromptResult> {
    console.log('AI Toolkit - ZIP Export Mode\n');

    // 1. 타입 선택
    const types = await this.selectTypes();

    // 2. 리소스 선택 (제공된 리소스 중 선택)
    const resources = await this.selectResources(availableResources, types);

    // 3. 확인
    const confirmed = await this.confirmExport(resources);
    if (!confirmed) {
      throw new Error('Export cancelled');
    }

    return { types, resources };
  }

  /**
   * 타입 복수 선택
   */
  async selectTypes(): Promise<ResourceType[]> {
    const allTypes: ResourceType[] = ['skills', 'rules', 'agents'];

    const descriptions: Record<ResourceType, string> = {
      skills: 'Skills - Reusable prompts and instructions',
      rules: 'Rules - Project guidelines and standards',
      agents: 'Agents - Specialized agent configurations',
    };

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select resource types to export:',
        choices: allTypes.map((type) => ({
          name: descriptions[type],
          value: type,
          checked: type === 'skills', // skills 기본 선택
        })),
        validate: (input: ResourceType[]) => {
          if (input.length === 0) {
            return 'Please select at least one type';
          }
          return true;
        },
      },
    ]);

    return selected;
  }

  /**
   * 리소스 복수 선택
   */
  async selectResources(
    availableResources: Resource[],
    types: ResourceType[]
  ): Promise<Resource[]> {
    // 선택된 타입으로 필터링
    const filteredResources = availableResources.filter((r) =>
      types.includes(r.type)
    );

    if (filteredResources.length === 0) {
      console.log('\nNo resources found for selected types.');
      return [];
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select resources to export:',
        choices: filteredResources.map((r) => ({
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

    return selected;
  }

  /**
   * 내보내기 확인
   */
  async confirmExport(resources: Resource[]): Promise<boolean> {
    console.log('\n--- Export Summary ---');
    console.log(`Resources (${resources.length}):`);
    resources.forEach((r) => {
      console.log(`  - [${r.type}] ${r.name}`);
    });
    console.log('');

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with export?',
        default: true,
      },
    ]);

    return confirmed;
  }
}

export const zipPrompt = new ZipPrompt();
