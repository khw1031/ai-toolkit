import { describe, it, expect } from 'vitest';
import { BatchHandler } from './BatchHandler';
import type { InstallRequest, InstallResult, Resource } from '../types';

describe('BatchHandler', () => {
  const handler = new BatchHandler();

  const createResource = (name: string): Resource => ({
    name,
    type: 'skill',
    description: `Test ${name}`,
    path: `${name}/SKILL.md`,
    content: `---\nname: ${name}\n---\nTest`,
    metadata: {},
  });

  const createRequest = (
    name: string,
    onDuplicate: InstallRequest['onDuplicate'] = 'skip'
  ): InstallRequest => ({
    resource: createResource(name),
    agent: 'claude-code',
    scope: 'project',
    onDuplicate,
  });

  const createResult = (
    name: string,
    action: InstallResult['action'],
    success: boolean = true
  ): InstallResult => ({
    resourceName: name,
    agent: 'claude-code',
    success,
    action,
    path: `/path/${name}`,
    error: action === 'failed' ? 'Some error' : undefined,
  });

  describe('applyBatchAction', () => {
    it('should apply skip-all', () => {
      const requests: InstallRequest[] = [
        createRequest('test1', 'overwrite'),
        createRequest('test2', 'rename'),
      ];

      const result = handler.applyBatchAction(requests, 'skip-all');

      expect(result[0].onDuplicate).toBe('skip');
      expect(result[1].onDuplicate).toBe('skip');
    });

    it('should apply overwrite-all', () => {
      const requests: InstallRequest[] = [
        createRequest('test1', 'skip'),
        createRequest('test2', 'backup'),
      ];

      const result = handler.applyBatchAction(requests, 'overwrite-all');

      expect(result[0].onDuplicate).toBe('overwrite');
      expect(result[1].onDuplicate).toBe('overwrite');
    });

    it('should apply backup-all', () => {
      const requests: InstallRequest[] = [
        createRequest('test1', 'skip'),
        createRequest('test2', 'overwrite'),
      ];

      const result = handler.applyBatchAction(requests, 'backup-all');

      expect(result[0].onDuplicate).toBe('backup');
      expect(result[1].onDuplicate).toBe('backup');
    });

    it('should not change requests for ask-each', () => {
      const requests: InstallRequest[] = [
        createRequest('test1', 'skip'),
        createRequest('test2', 'overwrite'),
      ];

      const result = handler.applyBatchAction(requests, 'ask-each');

      expect(result[0].onDuplicate).toBe('skip');
      expect(result[1].onDuplicate).toBe('overwrite');
    });

    it('should handle empty requests array', () => {
      const result = handler.applyBatchAction([], 'skip-all');
      expect(result).toEqual([]);
    });

    it('should preserve other request properties', () => {
      const requests: InstallRequest[] = [createRequest('test1', 'skip')];

      const result = handler.applyBatchAction(requests, 'overwrite-all');

      expect(result[0].resource.name).toBe('test1');
      expect(result[0].agent).toBe('claude-code');
      expect(result[0].scope).toBe('project');
    });
  });

  describe('summarizeResults', () => {
    it('should count results by action', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'skipped'),
        createResult('test3', 'overwritten'),
      ];

      const summary = handler.summarizeResults(results);

      expect(summary.created).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.overwritten).toBe(1);
      expect(summary.renamed).toBe(0);
      expect(summary.backedUp).toBe(0);
      expect(summary.failed).toBe(0);
    });

    it('should count all action types', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'skipped'),
        createResult('test3', 'overwritten'),
        createResult('test4', 'renamed'),
        createResult('test5', 'backed-up'),
        createResult('test6', 'failed', false),
      ];

      const summary = handler.summarizeResults(results);

      expect(summary.created).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.overwritten).toBe(1);
      expect(summary.renamed).toBe(1);
      expect(summary.backedUp).toBe(1);
      expect(summary.failed).toBe(1);
    });

    it('should handle empty results', () => {
      const summary = handler.summarizeResults([]);

      expect(summary.created).toBe(0);
      expect(summary.skipped).toBe(0);
      expect(summary.overwritten).toBe(0);
      expect(summary.renamed).toBe(0);
      expect(summary.backedUp).toBe(0);
      expect(summary.failed).toBe(0);
    });

    it('should count multiple of same action', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'created'),
        createResult('test3', 'created'),
      ];

      const summary = handler.summarizeResults(results);

      expect(summary.created).toBe(3);
    });
  });

  describe('formatSummary', () => {
    it('should format single action', () => {
      const summary = {
        created: 3,
        skipped: 0,
        overwritten: 0,
        renamed: 0,
        backedUp: 0,
        failed: 0,
      };

      const formatted = handler.formatSummary(summary);

      expect(formatted).toBe('3 created');
    });

    it('should format multiple actions', () => {
      const summary = {
        created: 2,
        skipped: 1,
        overwritten: 0,
        renamed: 0,
        backedUp: 0,
        failed: 1,
      };

      const formatted = handler.formatSummary(summary);

      expect(formatted).toBe('2 created, 1 skipped, 1 failed');
    });

    it('should handle all zero counts', () => {
      const summary = {
        created: 0,
        skipped: 0,
        overwritten: 0,
        renamed: 0,
        backedUp: 0,
        failed: 0,
      };

      const formatted = handler.formatSummary(summary);

      expect(formatted).toBe('No operations performed');
    });

    it('should include all non-zero counts', () => {
      const summary = {
        created: 1,
        skipped: 2,
        overwritten: 3,
        renamed: 4,
        backedUp: 5,
        failed: 6,
      };

      const formatted = handler.formatSummary(summary);

      expect(formatted).toContain('1 created');
      expect(formatted).toContain('2 skipped');
      expect(formatted).toContain('3 overwritten');
      expect(formatted).toContain('4 renamed');
      expect(formatted).toContain('5 backed up');
      expect(formatted).toContain('6 failed');
    });
  });

  describe('hasFailures', () => {
    it('should return true when failures exist', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'failed', false),
      ];

      expect(handler.hasFailures(results)).toBe(true);
    });

    it('should return false when no failures', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'skipped'),
      ];

      expect(handler.hasFailures(results)).toBe(false);
    });

    it('should return false for empty results', () => {
      expect(handler.hasFailures([])).toBe(false);
    });
  });

  describe('getFailedResults', () => {
    it('should return only failed results', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'failed', false),
        createResult('test3', 'skipped'),
        createResult('test4', 'failed', false),
      ];

      const failed = handler.getFailedResults(results);

      expect(failed.length).toBe(2);
      expect(failed[0].resourceName).toBe('test2');
      expect(failed[1].resourceName).toBe('test4');
    });

    it('should return empty array when no failures', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'skipped'),
      ];

      expect(handler.getFailedResults(results)).toEqual([]);
    });
  });

  describe('getSuccessfulResults', () => {
    it('should return only successful results', () => {
      const results: InstallResult[] = [
        createResult('test1', 'created'),
        createResult('test2', 'failed', false),
        createResult('test3', 'skipped'),
      ];

      const successful = handler.getSuccessfulResults(results);

      expect(successful.length).toBe(2);
      expect(successful[0].resourceName).toBe('test1');
      expect(successful[1].resourceName).toBe('test3');
    });

    it('should return empty array when all failed', () => {
      const results: InstallResult[] = [
        createResult('test1', 'failed', false),
        createResult('test2', 'failed', false),
      ];

      expect(handler.getSuccessfulResults(results)).toEqual([]);
    });
  });
});
