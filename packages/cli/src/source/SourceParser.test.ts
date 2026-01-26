import { describe, it, expect } from 'vitest';
import {
  parseSource,
  isDirectSkillUrl,
  isDirectResourcePath,
  getOwnerRepo,
  getSourceDisplayName,
} from './SourceParser.js';

describe('SourceParser', () => {
  describe('isDirectSkillUrl', () => {
    it('should detect direct SKILL.md URLs', () => {
      expect(
        isDirectSkillUrl('https://raw.githubusercontent.com/owner/repo/main/SKILL.md')
      ).toBe(true);
      expect(
        isDirectSkillUrl('https://example.com/path/to/skill.md')
      ).toBe(true);
    });

    it('should detect other resource URLs', () => {
      expect(isDirectSkillUrl('https://example.com/RULES.md')).toBe(true);
      expect(isDirectSkillUrl('https://example.com/COMMANDS.md')).toBe(true);
      expect(isDirectSkillUrl('https://example.com/AGENT.md')).toBe(true);
    });

    it('should not detect repository URLs', () => {
      expect(isDirectSkillUrl('https://github.com/owner/repo')).toBe(false);
      expect(isDirectSkillUrl('https://github.com/owner/repo/tree/main')).toBe(false);
    });

    it('should not detect non-URLs', () => {
      expect(isDirectSkillUrl('./SKILL.md')).toBe(false);
      expect(isDirectSkillUrl('owner/repo')).toBe(false);
    });
  });

  describe('parseSource', () => {
    describe('GitHub shorthand', () => {
      it('should parse owner/repo format', () => {
        const result = parseSource('vercel-labs/agent-skills');
        expect(result.type).toBe('github');
        expect(result.owner).toBe('vercel-labs');
        expect(result.repo).toBe('agent-skills');
        expect(result.url).toBe('https://github.com/vercel-labs/agent-skills');
      });

      it('should handle underscores and dots in names', () => {
        const result = parseSource('my_org/my.repo');
        expect(result.type).toBe('github');
        expect(result.owner).toBe('my_org');
        expect(result.repo).toBe('my.repo');
      });
    });

    describe('GitHub URL', () => {
      it('should parse full GitHub URL', () => {
        const result = parseSource('https://github.com/vercel-labs/agent-skills');
        expect(result.type).toBe('github');
        expect(result.owner).toBe('vercel-labs');
        expect(result.repo).toBe('agent-skills');
        expect(result.url).toBe('https://github.com/vercel-labs/agent-skills');
      });

      it('should parse GitHub URL with .git suffix', () => {
        const result = parseSource('https://github.com/vercel-labs/agent-skills.git');
        expect(result.type).toBe('github');
        expect(result.owner).toBe('vercel-labs');
        expect(result.repo).toBe('agent-skills');
      });

      it('should parse GitHub URL with branch and path', () => {
        const result = parseSource(
          'https://github.com/vercel-labs/agent-skills/tree/main/skills/frontend-design'
        );
        expect(result.type).toBe('github');
        expect(result.owner).toBe('vercel-labs');
        expect(result.repo).toBe('agent-skills');
        expect(result.ref).toBe('main');
        expect(result.subpath).toBe('skills/frontend-design');
      });

      it('should parse GitHub blob URL', () => {
        const result = parseSource(
          'https://github.com/owner/repo/blob/develop/path/to/SKILL.md'
        );
        expect(result.type).toBe('github');
        expect(result.ref).toBe('develop');
        expect(result.subpath).toBe('path/to/SKILL.md');
      });
    });

    describe('GitLab URL', () => {
      it('should parse GitLab URL', () => {
        const result = parseSource('https://gitlab.com/org/repo');
        expect(result.type).toBe('gitlab');
        expect(result.owner).toBe('org');
        expect(result.repo).toBe('repo');
        expect(result.url).toBe('https://gitlab.com/org/repo');
      });

      it('should parse GitLab URL with path', () => {
        const result = parseSource('https://gitlab.com/org/repo/-/tree/main/skills');
        expect(result.type).toBe('gitlab');
        expect(result.owner).toBe('org');
        expect(result.repo).toBe('repo');
        expect(result.ref).toBe('main');
        expect(result.subpath).toBe('skills');
      });
    });

    describe('Git URL', () => {
      it('should parse SSH git URL', () => {
        const result = parseSource('git@github.com:vercel-labs/agent-skills.git');
        expect(result.type).toBe('github');
        expect(result.owner).toBe('vercel-labs');
        expect(result.repo).toBe('agent-skills');
        expect(result.url).toBe('https://github.com/vercel-labs/agent-skills');
      });

      it('should parse GitLab SSH URL', () => {
        const result = parseSource('git@gitlab.com:org/repo.git');
        expect(result.type).toBe('gitlab');
        expect(result.owner).toBe('org');
        expect(result.repo).toBe('repo');
      });

      it('should parse Bitbucket SSH URL', () => {
        const result = parseSource('git@bitbucket.org:workspace/repo.git');
        expect(result.type).toBe('bitbucket');
        expect(result.owner).toBe('workspace');
        expect(result.repo).toBe('repo');
        expect(result.url).toBe('https://bitbucket.org/workspace/repo');
      });

      it('should parse generic SSH git URL', () => {
        const result = parseSource('git@unknown.host:owner/repo.git');
        expect(result.type).toBe('git');
        expect(result.owner).toBe('owner');
        expect(result.repo).toBe('repo');
      });
    });

    describe('Bitbucket URL', () => {
      it('should parse Bitbucket URL', () => {
        const result = parseSource('https://bitbucket.org/workspace/repo');
        expect(result.type).toBe('bitbucket');
        expect(result.owner).toBe('workspace');
        expect(result.repo).toBe('repo');
        expect(result.url).toBe('https://bitbucket.org/workspace/repo');
      });

      it('should parse Bitbucket URL with .git suffix', () => {
        const result = parseSource('https://bitbucket.org/workspace/repo.git');
        expect(result.type).toBe('bitbucket');
        expect(result.owner).toBe('workspace');
        expect(result.repo).toBe('repo');
      });

      it('should parse Bitbucket URL with username prefix', () => {
        const result = parseSource('https://username@bitbucket.org/workspace/repo.git');
        expect(result.type).toBe('bitbucket');
        expect(result.owner).toBe('workspace');
        expect(result.repo).toBe('repo');
        expect(result.url).toBe('https://bitbucket.org/workspace/repo');
      });

      it('should parse Bitbucket URL with branch and path', () => {
        const result = parseSource(
          'https://bitbucket.org/workspace/repo/src/main/skills/my-skill'
        );
        expect(result.type).toBe('bitbucket');
        expect(result.owner).toBe('workspace');
        expect(result.repo).toBe('repo');
        expect(result.ref).toBe('main');
        expect(result.subpath).toBe('skills/my-skill');
      });
    });

    describe('Direct URL', () => {
      it('should parse direct SKILL.md URL', () => {
        const result = parseSource(
          'https://raw.githubusercontent.com/owner/repo/main/SKILL.md'
        );
        expect(result.type).toBe('direct-url');
        expect(result.url).toBe(
          'https://raw.githubusercontent.com/owner/repo/main/SKILL.md'
        );
      });
    });
  });

  describe('getOwnerRepo', () => {
    it('should extract owner/repo from parsed source', () => {
      const parsed = parseSource('vercel-labs/agent-skills');
      expect(getOwnerRepo(parsed)).toBe('vercel-labs/agent-skills');
    });

    it('should extract from URL if owner/repo not set', () => {
      const parsed = parseSource('https://github.com/owner/repo');
      expect(getOwnerRepo(parsed)).toBe('owner/repo');
    });
  });

  describe('isDirectResourcePath', () => {
    it('should return true for direct URL', () => {
      const parsed = parseSource('https://example.com/SKILL.md');
      expect(isDirectResourcePath(parsed)).toBe(true);
    });

    it('should return true for URL with subpath', () => {
      const parsed = parseSource(
        'https://github.com/owner/repo/tree/main/skills/my-skill'
      );
      expect(isDirectResourcePath(parsed)).toBe(true);
    });

    it('should return false for repository root', () => {
      const parsed = parseSource('vercel-labs/agent-skills');
      expect(isDirectResourcePath(parsed)).toBe(false);
    });
  });

  describe('getSourceDisplayName', () => {
    it('should format GitHub source', () => {
      const parsed = parseSource('vercel-labs/agent-skills');
      expect(getSourceDisplayName(parsed)).toBe('GitHub: vercel-labs/agent-skills');
    });

    it('should format GitHub source with subpath', () => {
      const parsed = parseSource(
        'https://github.com/vercel-labs/agent-skills/tree/main/skills/frontend-design'
      );
      expect(getSourceDisplayName(parsed)).toBe(
        'GitHub: vercel-labs/agent-skills/skills/frontend-design'
      );
    });

    it('should format Bitbucket source', () => {
      const parsed = parseSource('https://bitbucket.org/workspace/repo');
      expect(getSourceDisplayName(parsed)).toBe('Bitbucket: workspace/repo');
    });

    it('should format Bitbucket source with subpath', () => {
      const parsed = parseSource(
        'https://bitbucket.org/workspace/repo/src/main/skills/my-skill'
      );
      expect(getSourceDisplayName(parsed)).toBe(
        'Bitbucket: workspace/repo/skills/my-skill'
      );
    });
  });
});
