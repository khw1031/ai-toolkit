import type { ResourceType, AgentKey } from '@ai-toolkit/registry';

// Re-export registry types
export type { ResourceType, AgentKey };

/**
 * 중복 처리 전략
 */
export type DuplicateAction =
  | 'skip'
  | 'overwrite'
  | 'rename'
  | 'backup'
  | 'compare'
  | 'fail';

/**
 * CLI 명령 옵션
 */
export interface Command {
  type?: ResourceType;
  source?: string;
  onDuplicate?: DuplicateAction;
  yes?: boolean;
  scope?: 'project' | 'global';
  agents?: AgentKey[];
}

/**
 * 소스 파일 정보
 */
export interface SourceFile {
  path: string;
  content: string;
  isDirectory: boolean;
  /** Sibling files in the same resource directory (scripts/, references/, etc.) */
  siblingFiles?: SourceFile[];
}

/**
 * 리소스 정보
 */
export interface Resource {
  name: string;
  type: ResourceType;
  description: string;
  path: string;
  content: string;
  metadata: {
    author?: string;
    version?: string;
    license?: string;
    category?: string;
  };
  directory?: {
    files: SourceFile[];
  };
}

/**
 * 중복 감지 정보
 */
export interface DuplicateInfo {
  resourceName: string;
  resourceType: ResourceType;
  existingPath: string;
  existingMeta: {
    createdAt: Date;
    source?: string;
    contentHash: string;
  };
  newMeta: {
    source: string;
    contentHash: string;
  };
  isSameContent: boolean;
}

/**
 * 설치 요청
 */
export interface InstallRequest {
  resource: Resource;
  agent: AgentKey;
  scope: 'project' | 'global';
  onDuplicate: DuplicateAction;
}

/**
 * 설치 결과
 */
export interface InstallResult {
  resourceName: string;
  agent: AgentKey;
  success: boolean;
  action: 'created' | 'skipped' | 'overwritten' | 'renamed' | 'backed-up' | 'failed';
  path: string;
  backupPath?: string;
  renamedTo?: string;
  error?: string;
}
