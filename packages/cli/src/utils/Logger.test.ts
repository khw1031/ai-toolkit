import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from './Logger';
import type { InstallResult } from '../types';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new Logger();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('summarizeResults', () => {
    it('should count results by action', () => {
      const results: InstallResult[] = [
        {
          resourceName: 'test1',
          agent: 'claude-code',
          success: true,
          action: 'created',
          path: '/path/1',
        },
        {
          resourceName: 'test2',
          agent: 'claude-code',
          success: true,
          action: 'skipped',
          path: '/path/2',
        },
        {
          resourceName: 'test3',
          agent: 'claude-code',
          success: false,
          action: 'failed',
          path: '/path/3',
          error: 'Error message',
        },
      ];

      const summary = logger.summarizeResults(results);

      expect(summary.created).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.overwritten).toBe(0);
      expect(summary.renamed).toBe(0);
      expect(summary.backedUp).toBe(0);
    });

    it('should count all action types', () => {
      const results: InstallResult[] = [
        { resourceName: 'r1', agent: 'claude-code', success: true, action: 'created', path: '/p1' },
        { resourceName: 'r2', agent: 'claude-code', success: true, action: 'created', path: '/p2' },
        { resourceName: 'r3', agent: 'claude-code', success: true, action: 'skipped', path: '/p3' },
        { resourceName: 'r4', agent: 'claude-code', success: true, action: 'overwritten', path: '/p4' },
        { resourceName: 'r5', agent: 'claude-code', success: true, action: 'renamed', path: '/p5' },
        { resourceName: 'r6', agent: 'claude-code', success: true, action: 'backed-up', path: '/p6' },
        { resourceName: 'r7', agent: 'claude-code', success: false, action: 'failed', path: '/p7', error: 'err' },
        { resourceName: 'r8', agent: 'claude-code', success: false, action: 'failed', path: '/p8', error: 'err' },
      ];

      const summary = logger.summarizeResults(results);

      expect(summary.created).toBe(2);
      expect(summary.skipped).toBe(1);
      expect(summary.overwritten).toBe(1);
      expect(summary.renamed).toBe(1);
      expect(summary.backedUp).toBe(1);
      expect(summary.failed).toBe(2);
    });

    it('should return zeros for empty results', () => {
      const summary = logger.summarizeResults([]);

      expect(summary.created).toBe(0);
      expect(summary.skipped).toBe(0);
      expect(summary.overwritten).toBe(0);
      expect(summary.renamed).toBe(0);
      expect(summary.backedUp).toBe(0);
      expect(summary.failed).toBe(0);
    });
  });

  describe('getActionIcon', () => {
    it('should return correct icons', () => {
      expect(logger.getActionIcon('created')).toBe('v');
      expect(logger.getActionIcon('skipped')).toBe('-');
      expect(logger.getActionIcon('overwritten')).toBe('~');
      expect(logger.getActionIcon('renamed')).toBe('>');
      expect(logger.getActionIcon('backed-up')).toBe('^');
      expect(logger.getActionIcon('failed')).toBe('x');
    });

    it('should return default icon for unknown action', () => {
      expect(logger.getActionIcon('unknown')).toBe('*');
    });
  });

  describe('getActionColor', () => {
    it('should return color functions for all actions', () => {
      const actions = ['created', 'skipped', 'overwritten', 'renamed', 'backed-up', 'failed'];

      actions.forEach((action) => {
        const colorFn = logger.getActionColor(action);
        expect(typeof colorFn).toBe('function');
        expect(colorFn('test')).toBeTruthy();
      });
    });

    it('should return default color for unknown action', () => {
      const colorFn = logger.getActionColor('unknown');
      expect(typeof colorFn).toBe('function');
    });
  });

  describe('displayResults', () => {
    it('should display results without errors', () => {
      const results: InstallResult[] = [
        {
          resourceName: 'test',
          agent: 'claude-code',
          success: true,
          action: 'created',
          path: '/path/test',
        },
      ];

      logger.displayResults(results);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should display failure details', () => {
      const results: InstallResult[] = [
        {
          resourceName: 'test-fail',
          agent: 'claude-code',
          success: false,
          action: 'failed',
          path: '/path/test',
          error: 'File write error',
        },
      ];

      logger.displayResults(results);

      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Failures');
    });

    it('should display backup path when present', () => {
      const results: InstallResult[] = [
        {
          resourceName: 'test-backup',
          agent: 'claude-code',
          success: true,
          action: 'backed-up',
          path: '/path/test',
          backupPath: '/path/test.bak',
        },
      ];

      logger.displayResults(results);

      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('backup');
    });

    it('should display renamed path when present', () => {
      const results: InstallResult[] = [
        {
          resourceName: 'test-rename',
          agent: 'claude-code',
          success: true,
          action: 'renamed',
          path: '/path/test',
          renamedTo: '/path/test-2',
        },
      ];

      logger.displayResults(results);

      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('test-2');
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      logger.info('Test info message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('Test info message');
    });
  });

  describe('success', () => {
    it('should log success message', () => {
      logger.success('Test success message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('Test success message');
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      logger.warn('Test warning message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('Test warning message');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('Test error message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('Test error message');
    });
  });

  describe('displayWelcome', () => {
    it('should display welcome message', () => {
      logger.displayWelcome();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('AI Toolkit');
    });
  });

  describe('displayCompletion', () => {
    it('should display completion message', () => {
      logger.displayCompletion();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('complete');
    });
  });

  describe('progress spinner', () => {
    it('should start and update progress', () => {
      logger.startProgress('Starting...');
      logger.updateProgress('In progress...');
      logger.stopProgress();
      // No errors thrown means success
    });

    it('should succeed progress', () => {
      logger.startProgress('Working...');
      logger.succeedProgress('Done!');
      // No errors thrown means success
    });

    it('should fail progress', () => {
      logger.startProgress('Working...');
      logger.failProgress('Failed!');
      // No errors thrown means success
    });

    it('should warn progress', () => {
      logger.startProgress('Working...');
      logger.warnProgress('Warning!');
      // No errors thrown means success
    });

    it('should handle update without start', () => {
      logger.updateProgress('No spinner');
      // Should not throw
    });

    it('should handle succeed without start', () => {
      logger.succeedProgress('No spinner');
      // Should not throw
    });

    it('should handle fail without start', () => {
      logger.failProgress('No spinner');
      // Should not throw
    });

    it('should handle warn without start', () => {
      logger.warnProgress('No spinner');
      // Should not throw
    });

    it('should handle stop without start', () => {
      logger.stopProgress();
      // Should not throw
    });
  });
});
