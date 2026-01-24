import type { ParsedSource } from '../types.js';

/**
 * GitHub URL 매칭 정규식
 * 예: https://github.com/owner/repo
 *     https://github.com/owner/repo/tree/branch/path/to/skill
 *     https://github.com/owner/repo/blob/branch/path/to/file.md
 */
const GITHUB_URL_REGEX =
  /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/]+)(?:\/(.+))?)?$/;

/**
 * GitLab URL 매칭 정규식
 * 예: https://gitlab.com/owner/repo
 *     https://gitlab.com/owner/repo/-/tree/branch/path
 */
const GITLAB_URL_REGEX =
  /^https?:\/\/(?:www\.)?gitlab\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/-\/(?:tree|blob)\/([^/]+)(?:\/(.+))?)?$/;

/**
 * GitHub shorthand 매칭 정규식
 * 예: owner/repo
 *     vercel-labs/agent-skills
 */
const GITHUB_SHORTHAND_REGEX = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;

/**
 * Git URL 매칭 정규식 (SSH 또는 git:// 프로토콜)
 * 예: git@github.com:owner/repo.git
 *     git://github.com/owner/repo.git
 */
const GIT_URL_REGEX = /^(?:git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?|git:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?)$/;

/**
 * 입력이 직접 SKILL.md URL인지 확인
 * 예: https://raw.githubusercontent.com/.../SKILL.md
 */
export function isDirectSkillUrl(input: string): boolean {
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return false;
  }

  // SKILL.md, RULES.md 등으로 끝나는 URL
  const lowerInput = input.toLowerCase();
  return (
    lowerInput.endsWith('/skill.md') ||
    lowerInput.endsWith('/rules.md') ||
    lowerInput.endsWith('/commands.md') ||
    lowerInput.endsWith('/agent.md')
  );
}

/**
 * 소스 문자열을 파싱하여 ParsedSource 객체로 변환
 *
 * 지원하는 소스 포맷:
 * - GitHub shorthand: owner/repo
 * - GitHub URL: https://github.com/owner/repo
 * - GitHub URL with path: https://github.com/owner/repo/tree/main/skills/frontend-design
 * - GitLab URL: https://gitlab.com/owner/repo
 * - Git URL: git@github.com:owner/repo.git
 * - Direct URL: https://raw.githubusercontent.com/.../SKILL.md
 */
export function parseSource(input: string): ParsedSource {
  const trimmed = input.trim();

  // 1. GitHub URL (직접 URL 체크보다 먼저 - GitHub blob URL도 GitHub로 처리)
  const githubMatch = trimmed.match(GITHUB_URL_REGEX);
  if (githubMatch) {
    const [, owner, repo, ref, subpath] = githubMatch;
    return {
      type: 'github',
      url: `https://github.com/${owner}/${repo}`,
      owner,
      repo,
      ref: ref || undefined,
      subpath: subpath || undefined,
      raw: input,
    };
  }

  // 4. GitLab URL
  const gitlabMatch = trimmed.match(GITLAB_URL_REGEX);
  if (gitlabMatch) {
    const [, owner, repo, ref, subpath] = gitlabMatch;
    return {
      type: 'gitlab',
      url: `https://gitlab.com/${owner}/${repo}`,
      owner,
      repo,
      ref: ref || undefined,
      subpath: subpath || undefined,
      raw: input,
    };
  }

  // 5. Git URL (SSH 또는 git://)
  const gitMatch = trimmed.match(GIT_URL_REGEX);
  if (gitMatch) {
    // SSH format: git@host:owner/repo.git
    if (gitMatch[1]) {
      const [, host, owner, repo] = gitMatch;
      const isGitHub = host === 'github.com';
      const isGitLab = host === 'gitlab.com';

      return {
        type: isGitHub ? 'github' : isGitLab ? 'gitlab' : 'git',
        url: `https://${host}/${owner}/${repo}`,
        owner,
        repo,
        raw: input,
      };
    }
    // git:// format: git://host/owner/repo.git
    if (gitMatch[4]) {
      const [, , , , host, owner, repo] = gitMatch;
      const isGitHub = host === 'github.com';
      const isGitLab = host === 'gitlab.com';

      return {
        type: isGitHub ? 'github' : isGitLab ? 'gitlab' : 'git',
        url: `https://${host}/${owner}/${repo}`,
        owner,
        repo,
        raw: input,
      };
    }
  }

  // 6. GitHub shorthand (owner/repo)
  const shorthandMatch = trimmed.match(GITHUB_SHORTHAND_REGEX);
  if (shorthandMatch) {
    const [, owner, repo] = shorthandMatch;
    return {
      type: 'github',
      url: `https://github.com/${owner}/${repo}`,
      owner,
      repo,
      raw: input,
    };
  }

  // 7. 직접 리소스 URL (GitHub/GitLab이 아닌 도메인의 SKILL.md 등)
  if (isDirectSkillUrl(trimmed)) {
    return {
      type: 'direct-url',
      url: trimmed,
      raw: input,
    };
  }

  // 8. 일반 HTTPS URL (알 수 없는 Git 호스트)
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return {
      type: 'git',
      url: trimmed,
      raw: input,
    };
  }

  // 파싱 실패
  throw new Error(`Invalid source format: ${input}. Please use GitHub URL (https://github.com/owner/repo) or owner/repo format.`);
}

/**
 * ParsedSource에서 owner/repo 식별자 추출 (텔레메트리용)
 */
export function getOwnerRepo(parsed: ParsedSource): string | null {
  if (parsed.owner && parsed.repo) {
    return `${parsed.owner}/${parsed.repo}`;
  }

  // URL에서 추출 시도
  if (parsed.url) {
    const match = parsed.url.match(/(?:github|gitlab)\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }

  return null;
}

/**
 * ParsedSource가 특정 스킬/리소스를 직접 가리키는지 확인
 */
export function isDirectResourcePath(parsed: ParsedSource): boolean {
  // 직접 URL인 경우
  if (parsed.type === 'direct-url') {
    return true;
  }

  // subpath가 있는 경우
  if (parsed.subpath) {
    return true;
  }

  return false;
}

/**
 * 소스 유형에 따른 표시 문자열 반환
 */
export function getSourceDisplayName(parsed: ParsedSource): string {
  switch (parsed.type) {
    case 'github':
      return parsed.owner && parsed.repo
        ? `GitHub: ${parsed.owner}/${parsed.repo}${parsed.subpath ? `/${parsed.subpath}` : ''}`
        : parsed.url || parsed.raw;
    case 'gitlab':
      return parsed.owner && parsed.repo
        ? `GitLab: ${parsed.owner}/${parsed.repo}${parsed.subpath ? `/${parsed.subpath}` : ''}`
        : parsed.url || parsed.raw;
    case 'git':
      return `Git: ${parsed.url || parsed.raw}`;
    case 'direct-url':
      return `URL: ${parsed.url}`;
    default:
      return parsed.raw;
  }
}
