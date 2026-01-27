import inquirer from "inquirer";
import ora from "ora";
import type {
  AgentKey,
  ResourceType,
  Resource,
  InteractiveResult,
  ParsedSource,
} from "../types.js";
import { pathResolver } from "../path/PathResolver.js";
import { parseSource, getSourceDisplayName } from "../source/SourceParser.js";
import { githubFetcher } from "../fetch/GitHubFetcher.js";
import { bitbucketFetcher } from "../fetch/BitbucketFetcher.js";
import type { BatchAction } from "../install/BatchHandler.js";

/**
 * InteractivePrompt - 외부 소스 기반 설치 플로우
 *
 * 플로우: Agent → Source URL → Type 선택 → Resources 선택 → Scope → Confirm
 */
export class InteractivePrompt {
  /**
   * Interactive 플로우 실행
   */
  async run(): Promise<InteractiveResult> {
    console.log("Welcome to AI Toolkit!\n");

    // 1. Agent 선택
    const agent = await this.selectAgent();

    // 2. Source URL 입력
    const source = await this.inputSource();
    const parsedSource = parseSource(source);

    console.log(`\nSource: ${getSourceDisplayName(parsedSource)}`);

    // 3. Type 선택 (Agent 지원 타입만)
    const types = await this.selectTypes(agent);

    // 4. 소스에서 리소스 탐색
    const spinner = ora("Fetching resources from source...").start();
    let availableResources: Resource[] = [];

    try {
      if (parsedSource.type === "github") {
        availableResources = await githubFetcher.fetchResources(
          parsedSource,
          types,
        );
      } else if (parsedSource.type === "bitbucket") {
        availableResources = await bitbucketFetcher.fetchResources(
          parsedSource,
          types,
        );
      } else {
        spinner.warn(
          `Source type "${parsedSource.type}" is not yet supported.`,
        );
      }
      spinner.succeed(`Found ${availableResources.length} resource(s)`);
    } catch (error) {
      spinner.fail(
        `Failed to fetch resources: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        agent,
        types,
        resources: [],
        scope: "project",
        source: parsedSource,
      };
    }

    // 5. 리소스 선택
    const resources = await this.selectResources(availableResources, types);

    // 6. Scope 선택
    const scope = await this.selectScope();

    return { agent, types, resources, scope, source: parsedSource };
  }

  /**
   * Agent 선택
   */
  async selectAgent(): Promise<AgentKey> {
    const agents = pathResolver.getAgents();

    const { agent } = await inquirer.prompt([
      {
        type: "list",
        name: "agent",
        message: "Select target agent:",
        choices: agents.map((key) => ({
          name: pathResolver.getAgentConfig(key).name,
          value: key,
        })),
      },
    ]);

    return agent;
  }

  /**
   * Source URL 입력
   */
  async inputSource(): Promise<string> {
    const { source } = await inquirer.prompt([
      {
        type: "input",
        name: "source",
        message: "Enter source (GitHub URL or owner/repo):",
        validate: (input: string) => {
          if (!input.trim()) {
            return "Please enter a source";
          }
          return true;
        },
      },
    ]);

    return source.trim();
  }

  /**
   * Type 선택 (Agent 지원 타입만 표시)
   */
  async selectTypes(agent: AgentKey): Promise<ResourceType[]> {
    const supportedTypes = pathResolver.getSupportedTypes(agent);

    const typeDescriptions: Record<ResourceType, string> = {
      skills: "Skills - Reusable prompts and instructions",
      rules: "Rules - Project guidelines and standards",
      agents: "Agents - Specialized agent configurations",
    };

    const { types } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "types",
        message: `Select resource types to install (${pathResolver.getAgentConfig(agent).name} supports):`,
        choices: supportedTypes.map((type) => ({
          name: typeDescriptions[type],
          value: type,
          checked: false,
        })),
        validate: (input: ResourceType[]) => {
          if (input.length === 0) {
            return "Please select at least one type";
          }
          return true;
        },
      },
    ]);

    return types;
  }

  /**
   * Scope 선택
   */
  async selectScope(): Promise<"project" | "global"> {
    const { scope } = await inquirer.prompt([
      {
        type: "list",
        name: "scope",
        message: "Select installation scope:",
        choices: [
          { name: "Project - Install in current directory", value: "project" },
          { name: "Global - Install in home directory", value: "global" },
        ],
        default: undefined,
      },
    ]);

    return scope;
  }

  /**
   * description에서 첫 줄만 추출하고 길이 제한
   */
  private truncateDescription(description: string, maxLength = 60): string {
    if (!description) return "No description";

    // 첫 줄만 추출 (줄바꿈 기준)
    const firstLine = description.split(/\r?\n/)[0].trim();

    // 길이 제한
    if (firstLine.length > maxLength) {
      return firstLine.slice(0, maxLength - 3) + "...";
    }

    return firstLine;
  }

  /**
   * 리소스 선택 (가져온 리소스 목록에서)
   */
  async selectResources(
    availableResources: Resource[],
    types: ResourceType[],
  ): Promise<Resource[]> {
    // 선택된 타입으로 필터링
    const filteredResources = availableResources.filter((r) =>
      types.includes(r.type),
    );

    if (filteredResources.length === 0) {
      console.log("\nNo resources found for selected types.");
      return [];
    }

    const { resources } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "resources",
        message: "Select resources to install:",
        choices: filteredResources.map((r) => ({
          name: `[${r.type}] ${r.name} - ${this.truncateDescription(r.description)}`,
          value: r,
          checked: false,
        })),
        pageSize: 15, // 한 번에 15개 표시
        validate: (input: Resource[]) => {
          if (input.length === 0) {
            return "Please select at least one resource";
          }
          return true;
        },
      },
    ]);

    return resources;
  }

  /**
   * 설치 확인
   */
  async confirmInstallation(
    agent: AgentKey,
    resources: Resource[],
    scope: "project" | "global",
  ): Promise<boolean> {
    console.log("\n--- Installation Summary ---");
    console.log(`Agent: ${pathResolver.getAgentConfig(agent).name}`);
    console.log(`Scope: ${scope}`);
    console.log(`Resources (${resources.length}):`);
    resources.forEach((r) => {
      const targetPath = pathResolver.resolveAgentPath(agent, r.type, scope);
      console.log(
        `  - [${r.type}] ${r.name} → ${targetPath || "Not supported"}`,
      );
    });
    console.log("");

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message: "Proceed with installation?",
        default: false,
      },
    ]);

    return confirmed;
  }

  /**
   * Handle single duplicate
   */
  async handleDuplicate(
    resourceName: string,
  ): Promise<"skip" | "overwrite" | "rename" | "backup" | "compare"> {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `"${resourceName}" already exists. What do you want to do?`,
        choices: [
          { name: "Skip - Keep existing file", value: "skip" },
          { name: "Overwrite - Replace with new version", value: "overwrite" },
          { name: "Rename - Save as new (e.g., skill-2)", value: "rename" },
          { name: "Backup - Backup existing and overwrite", value: "backup" },
          { name: "Compare - View differences first", value: "compare" },
        ],
      },
    ]);
    return action;
  }

  /**
   * Handle batch duplicates
   */
  async handleBatchDuplicates(duplicateCount: number): Promise<BatchAction> {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `${duplicateCount} files already exist. How do you want to handle them?`,
        choices: [
          { name: "Ask for each file", value: "ask-each" },
          { name: "Skip all - Keep all existing files", value: "skip-all" },
          {
            name: "Overwrite all - Replace all with new versions",
            value: "overwrite-all",
          },
          {
            name: "Backup all - Backup existing and install new",
            value: "backup-all",
          },
        ],
      },
    ]);

    return action;
  }
}

// Singleton instance export
export const interactivePrompt = new InteractivePrompt();
