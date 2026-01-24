import inquirer from 'inquirer';
import type {
  RegistryDirectory,
  ResourceType,
  Resource,
  ZipPromptResult,
} from '../types.js';
import { registryResolver } from '../source/RegistryResolver.js';

/**
 * ZipPrompt - ZIP 내보내기용 선택 플로우
 *
 * 플로우: Directories → Types → Resources → Confirm
 * (Agent, Scope 선택 없음)
 */
export class ZipPrompt {
  /**
   * ZIP 플로우 실행
   */
  async run(): Promise<ZipPromptResult> {
    console.log('AI Toolkit - ZIP Export Mode\n');

    // 1. 디렉토리 복수 선택
    const directories = await this.selectDirectories();

    // 2. 타입 선택
    const types = await this.selectTypes();

    // 3. 리소스 선택 (여러 디렉토리 합산)
    const resources = await this.selectResources(directories, types);

    // 4. 확인
    const confirmed = await this.confirmExport(resources);
    if (!confirmed) {
      throw new Error('Export cancelled');
    }

    return { directories, types, resources };
  }

  /**
   * 디렉토리 복수 선택 (checkbox)
   */
  async selectDirectories(): Promise<RegistryDirectory[]> {
    const directories = registryResolver.getDirectories();

    const descriptions: Record<RegistryDirectory, string> = {
      common: 'Common - General purpose resources',
      frontend: 'Frontend - React, Vue, etc.',
      app: 'App - Mobile, Desktop apps',
    };

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select directories to export from:',
        choices: directories.map((dir) => ({
          name: descriptions[dir],
          value: dir,
          checked: true, // 기본 전체 선택
        })),
        validate: (input: RegistryDirectory[]) => {
          if (input.length === 0) {
            return 'Please select at least one directory';
          }
          return true;
        },
      },
    ]);

    return selected;
  }

  /**
   * 타입 복수 선택 (Agent 필터 없음)
   */
  async selectTypes(): Promise<ResourceType[]> {
    const allTypes: ResourceType[] = ['skills', 'rules', 'commands', 'agents'];

    const descriptions: Record<ResourceType, string> = {
      skills: 'Skills - Reusable prompts and instructions',
      rules: 'Rules - Project guidelines and standards',
      commands: 'Commands - Custom slash commands',
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
   * 리소스 복수 선택 (여러 디렉토리 합산)
   */
  async selectResources(
    directories: RegistryDirectory[],
    types: ResourceType[]
  ): Promise<Resource[]> {
    // 여러 디렉토리에서 리소스 수집
    const allResources: Resource[] = [];
    for (const dir of directories) {
      const resources = await registryResolver.resolve(dir, types);
      allResources.push(...resources);
    }

    if (allResources.length === 0) {
      console.log('\nNo resources found in selected directories/types.');
      return [];
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select resources to export:',
        choices: allResources.map((r) => ({
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
