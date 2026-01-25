// ============================================
// Core Types
// ============================================

/**
 * 리소스 타입 (복수형으로 통일)
 */
export type ResourceType = 'skills' | 'rules' | 'agents';

/**
 * 지원하는 Agent 키
 */
export type AgentKey = 'claude-code' | 'cursor' | 'github-copilot' | 'antigravity';

/**
 * Agent 경로 정의
 */
export interface AgentPaths {
  skills: string;
  rules: string;
  agents: string | null;    // null = 미지원
}

/**
 * Agent 설정
 */
export interface AgentConfig {
  name: string;
  supportedTypes: ResourceType[];
  paths: {
    project: AgentPaths;
    global: AgentPaths;
  };
}

/**
 * Agent Registry 타입
 */
export type AgentRegistry = Record<AgentKey, AgentConfig>;

// ============================================
// Source Parser Types
// ============================================

/**
 * 파싱된 소스 정보
 * 다양한 소스 포맷(GitHub, GitLab, Git URL 등)을 통일된 구조로 표현
 */
export interface ParsedSource {
  /** 소스 유형 */
  type: 'github' | 'gitlab' | 'git' | 'direct-url';
  /** 정규화된 URL */
  url?: string;
  /** 레포지토리 내 서브 경로 (예: skills/frontend-design) */
  subpath?: string;
  /** Git 브랜치/태그/커밋 참조 */
  ref?: string;
  /** GitHub/GitLab owner (조직 또는 사용자) */
  owner?: string;
  /** 레포지토리 이름 */
  repo?: string;
  /** 원본 입력 문자열 */
  raw: string;
}

// ============================================
// CLI Types
// ============================================

/**
 * 인터랙티브 모드 결과
 */
export interface InteractiveResult {
  agent: AgentKey;
  types: ResourceType[];
  resources: Resource[];
  scope: 'project' | 'global';
  source?: ParsedSource;
}

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
  types: ResourceType[];
  resources: Resource[];
}
