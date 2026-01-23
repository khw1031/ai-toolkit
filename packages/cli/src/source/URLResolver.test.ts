import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { URLResolver } from './URLResolver';

describe('URLResolver', () => {
  describe('validateURL', () => {
    it('should accept valid HTTP URL', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('http://example.com/SKILL.md');
      }).not.toThrow();
    });

    it('should accept valid HTTPS URL', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('https://example.com/SKILL.md');
      }).not.toThrow();
    });

    it('should reject non-HTTP protocols', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('ftp://example.com/SKILL.md');
      }).toThrow('Only HTTP/HTTPS URLs are supported');
    });

    it('should reject invalid URLs', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('not-a-url');
      }).toThrow('Invalid URL');
    });

    it('should accept GitHub raw URLs', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL(
          'https://raw.githubusercontent.com/owner/repo/main/SKILL.md'
        );
      }).not.toThrow();
    });
  });

  describe('extractFilename', () => {
    it('should extract filename from URL', () => {
      const resolver = new URLResolver();
      const filename = (resolver as any).extractFilename(
        'https://example.com/path/to/SKILL.md',
        'skill'
      );
      expect(filename).toBe('SKILL.md');
    });

    it('should fallback to default filename when no .md extension', () => {
      const resolver = new URLResolver();
      const filename = (resolver as any).extractFilename(
        'https://example.com/path',
        'skill'
      );
      expect(filename).toBe('SKILL.md');
    });

    it('should extract filename from GitHub raw URL', () => {
      const resolver = new URLResolver();
      const filename = (resolver as any).extractFilename(
        'https://raw.githubusercontent.com/owner/repo/main/skills/commit/SKILL.md',
        'skill'
      );
      expect(filename).toBe('SKILL.md');
    });

    it('should extract custom .md filenames', () => {
      const resolver = new URLResolver();
      const filename = (resolver as any).extractFilename(
        'https://example.com/path/custom-skill.md',
        'skill'
      );
      expect(filename).toBe('custom-skill.md');
    });

    it('should fallback for each resource type', () => {
      const resolver = new URLResolver();

      expect(
        (resolver as any).extractFilename('https://example.com/path', 'skill')
      ).toBe('SKILL.md');
      expect(
        (resolver as any).extractFilename('https://example.com/path', 'rule')
      ).toBe('RULES.md');
      expect(
        (resolver as any).extractFilename('https://example.com/path', 'command')
      ).toBe('COMMANDS.md');
      expect(
        (resolver as any).extractFilename('https://example.com/path', 'agent')
      ).toBe('AGENT.md');
    });
  });

  describe('isTextContent', () => {
    it('should accept text/plain content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('text/plain')).toBe(true);
    });

    it('should accept text/markdown content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('text/markdown')).toBe(true);
    });

    it('should accept text/html content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('text/html')).toBe(true);
    });

    it('should accept application/json content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('application/json')).toBe(true);
    });

    it('should accept application/yaml content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('application/yaml')).toBe(true);
    });

    it('should accept application/x-yaml content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('application/x-yaml')).toBe(true);
    });

    it('should accept content type with charset', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('text/plain; charset=utf-8')).toBe(
        true
      );
    });

    it('should reject image/png content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('image/png')).toBe(false);
    });

    it('should reject application/pdf content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('application/pdf')).toBe(false);
    });

    it('should reject application/octet-stream content type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('application/octet-stream')).toBe(
        false
      );
    });
  });

  describe('getResourceFilename', () => {
    it('should return SKILL.md for skill type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).getResourceFilename('skill')).toBe('SKILL.md');
    });

    it('should return RULES.md for rule type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).getResourceFilename('rule')).toBe('RULES.md');
    });

    it('should return COMMANDS.md for command type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).getResourceFilename('command')).toBe(
        'COMMANDS.md'
      );
    });

    it('should return AGENT.md for agent type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).getResourceFilename('agent')).toBe('AGENT.md');
    });
  });

  describe('validateContent', () => {
    it('should not throw for valid markdown content', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateContent('# Title\n\nContent', 'skill');
      }).not.toThrow();
    });

    it('should not throw for frontmatter content', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateContent(
          '---\nname: test\n---\nContent',
          'skill'
        );
      }).not.toThrow();
    });

    it('should warn for non-markdown content', () => {
      const resolver = new URLResolver();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (resolver as any).validateContent('plain text without markdown', 'skill');

      expect(warnSpy).toHaveBeenCalledWith(
        'Warning: Content does not look like a valid resource file'
      );
      warnSpy.mockRestore();
    });
  });

  describe('downloadFile', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should download file successfully', async () => {
      const mockContent = '# SKILL.md\n\nContent here';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue(mockContent),
      });

      const resolver = new URLResolver();
      const content = await (resolver as any).downloadFile(
        'https://example.com/SKILL.md'
      );

      expect(content).toBe(mockContent);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/SKILL.md');
    });

    it('should throw error for non-OK response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const resolver = new URLResolver();
      await expect(
        (resolver as any).downloadFile('https://example.com/notfound.md')
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should throw error for unsupported content type', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        text: vi.fn().mockResolvedValue(''),
      });

      const resolver = new URLResolver();
      await expect(
        (resolver as any).downloadFile('https://example.com/image.png')
      ).rejects.toThrow('Unsupported content type: image/png');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const resolver = new URLResolver();
      await expect(
        (resolver as any).downloadFile('https://example.com/file.md')
      ).rejects.toThrow('Failed to download file: Network error');
    });

    it('should accept response without content-type header', async () => {
      const mockContent = '# Content';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue(mockContent),
      });

      const resolver = new URLResolver();
      const content = await (resolver as any).downloadFile(
        'https://example.com/file.md'
      );

      expect(content).toBe(mockContent);
    });
  });

  describe('resolve', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should resolve URL to single file', async () => {
      const mockContent = '# SKILL\n\nDescription';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/markdown' }),
        text: vi.fn().mockResolvedValue(mockContent),
      });

      const resolver = new URLResolver();
      const files = await resolver.resolve(
        'https://example.com/path/SKILL.md',
        'skill'
      );

      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        path: 'SKILL.md',
        content: mockContent,
        isDirectory: false,
      });
    });

    it('should throw for invalid URL', async () => {
      const resolver = new URLResolver();
      await expect(resolver.resolve('not-a-url', 'skill')).rejects.toThrow(
        'Invalid URL'
      );
    });

    it('should throw for non-HTTP protocol', async () => {
      const resolver = new URLResolver();
      await expect(
        resolver.resolve('ftp://example.com/file.md', 'skill')
      ).rejects.toThrow('Only HTTP/HTTPS URLs are supported');
    });

    it('should resolve GitHub raw URL', async () => {
      const mockContent =
        '---\nname: commit\ndescription: Commit changes\n---\n# Commit Skill';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
        text: vi.fn().mockResolvedValue(mockContent),
      });

      const resolver = new URLResolver();
      const files = await resolver.resolve(
        'https://raw.githubusercontent.com/owner/repo/main/skills/commit/SKILL.md',
        'skill'
      );

      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('SKILL.md');
      expect(files[0].content).toBe(mockContent);
    });

    it('should use fallback filename when URL has no .md extension', async () => {
      const mockContent = '# Rule content';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue(mockContent),
      });

      const resolver = new URLResolver();
      const files = await resolver.resolve(
        'https://example.com/api/content',
        'rule'
      );

      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('RULES.md');
    });
  });
});
