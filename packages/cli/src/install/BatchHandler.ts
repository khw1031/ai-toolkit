import type { InstallRequest, InstallResult, DuplicateAction } from '../types';

/**
 * Batch action types for handling multiple duplicates at once
 */
export type BatchAction = 'ask-each' | 'skip-all' | 'overwrite-all' | 'backup-all';

/**
 * Result summary structure
 */
export interface ResultSummary {
  created: number;
  skipped: number;
  overwritten: number;
  renamed: number;
  backedUp: number;
  failed: number;
}

/**
 * BatchHandler
 *
 * Handles batch operations for multiple install requests:
 * - Apply batch actions to all requests
 * - Summarize installation results
 */
export class BatchHandler {
  /**
   * Apply batch action to all requests
   * Converts batch action to individual duplicate actions
   */
  applyBatchAction(
    requests: InstallRequest[],
    batchAction: BatchAction
  ): InstallRequest[] {
    if (batchAction === 'ask-each') {
      return requests; // No change, will ask for each
    }

    const actionMap: Record<Exclude<BatchAction, 'ask-each'>, DuplicateAction> = {
      'skip-all': 'skip',
      'overwrite-all': 'overwrite',
      'backup-all': 'backup',
    };

    const onDuplicate = actionMap[batchAction];

    return requests.map((req) => ({
      ...req,
      onDuplicate,
    }));
  }

  /**
   * Group and count results by action type
   */
  summarizeResults(results: InstallResult[]): ResultSummary {
    return {
      created: results.filter((r) => r.action === 'created').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      overwritten: results.filter((r) => r.action === 'overwritten').length,
      renamed: results.filter((r) => r.action === 'renamed').length,
      backedUp: results.filter((r) => r.action === 'backed-up').length,
      failed: results.filter((r) => r.action === 'failed').length,
    };
  }

  /**
   * Format summary as human-readable string
   */
  formatSummary(summary: ResultSummary): string {
    const parts: string[] = [];

    if (summary.created > 0) {
      parts.push(`${summary.created} created`);
    }
    if (summary.skipped > 0) {
      parts.push(`${summary.skipped} skipped`);
    }
    if (summary.overwritten > 0) {
      parts.push(`${summary.overwritten} overwritten`);
    }
    if (summary.renamed > 0) {
      parts.push(`${summary.renamed} renamed`);
    }
    if (summary.backedUp > 0) {
      parts.push(`${summary.backedUp} backed up`);
    }
    if (summary.failed > 0) {
      parts.push(`${summary.failed} failed`);
    }

    if (parts.length === 0) {
      return 'No operations performed';
    }

    return parts.join(', ');
  }

  /**
   * Check if any results have failed
   */
  hasFailures(results: InstallResult[]): boolean {
    return results.some((r) => r.action === 'failed');
  }

  /**
   * Get failed results only
   */
  getFailedResults(results: InstallResult[]): InstallResult[] {
    return results.filter((r) => r.action === 'failed');
  }

  /**
   * Get successful results only
   */
  getSuccessfulResults(results: InstallResult[]): InstallResult[] {
    return results.filter((r) => r.success);
  }
}
