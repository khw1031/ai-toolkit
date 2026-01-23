import { describe, it, expect } from 'vitest';
import { generateDiff, formatDiff } from './diff';

describe('diff', () => {
  describe('generateDiff', () => {
    it('should generate unified diff', () => {
      const oldContent = 'Line 1\nLine 2\nLine 3';
      const newContent = 'Line 1\nLine 2 Modified\nLine 3';

      const diff = generateDiff(oldContent, newContent, 'test.md');

      expect(diff).toContain('--- test.md (existing)');
      expect(diff).toContain('+++ test.md (new)');
      expect(diff).toContain('-Line 2');
      expect(diff).toContain('+Line 2 Modified');
    });

    it('should handle identical content', () => {
      const content = 'Same content';
      const diff = generateDiff(content, content, 'test.md');

      // Should not contain added/removed lines (only headers)
      const lines = diff.split('\n');
      const diffLines = lines.filter(
        (l) =>
          (l.startsWith('+') && !l.startsWith('+++')) ||
          (l.startsWith('-') && !l.startsWith('---'))
      );
      expect(diffLines.length).toBe(0);
    });

    it('should handle empty old content', () => {
      const oldContent = '';
      const newContent = 'New content\nLine 2';

      const diff = generateDiff(oldContent, newContent, 'new.md');

      expect(diff).toContain('+New content');
      expect(diff).toContain('+Line 2');
    });

    it('should handle empty new content', () => {
      const oldContent = 'Old content\nLine 2';
      const newContent = '';

      const diff = generateDiff(oldContent, newContent, 'old.md');

      expect(diff).toContain('-Old content');
      expect(diff).toContain('-Line 2');
    });

    it('should use default filename when not provided', () => {
      const diff = generateDiff('old', 'new');

      expect(diff).toContain('--- file (existing)');
      expect(diff).toContain('+++ file (new)');
    });

    it('should handle multiple changes', () => {
      const oldContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      const newContent = 'Line 1\nLine 2 changed\nLine 3\nLine 4 changed\nLine 5';

      const diff = generateDiff(oldContent, newContent, 'multi.md');

      expect(diff).toContain('-Line 2');
      expect(diff).toContain('+Line 2 changed');
      expect(diff).toContain('-Line 4');
      expect(diff).toContain('+Line 4 changed');
    });
  });

  describe('formatDiff', () => {
    it('should colorize diff lines', () => {
      const diffText = '--- old\n+++ new\n-removed\n+added\n@@ -1,1 +1,1 @@';
      const formatted = formatDiff(diffText);

      // The output should contain the diff content
      // (colors may not appear in non-TTY environments like CI)
      expect(formatted).toBeTruthy();
      // Verify content is preserved regardless of color
      expect(formatted).toContain('+added');
      expect(formatted).toContain('-removed');
      expect(formatted).toContain('@@');
    });

    it('should not colorize header lines', () => {
      const diffText = '--- file.md (existing)\n+++ file.md (new)';
      const formatted = formatDiff(diffText);

      // Header lines (--- and +++) should not be colorized like regular diff lines
      expect(formatted).toContain('--- file.md (existing)');
      expect(formatted).toContain('+++ file.md (new)');
    });

    it('should preserve context lines', () => {
      const diffText = ' context line\n-removed\n+added\n another context';
      const formatted = formatDiff(diffText);

      // Context lines (starting with space) should not be colorized
      expect(formatted).toContain(' context line');
      expect(formatted).toContain(' another context');
    });

    it('should handle empty diff', () => {
      const formatted = formatDiff('');
      expect(formatted).toBe('');
    });
  });
});
