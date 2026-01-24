import { createHash } from 'node:crypto';

/**
 * Calculate SHA-256 hash of content
 */
export function calculateHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * Check if two contents are identical
 */
export function isSameContent(content1: string, content2: string): boolean {
  return calculateHash(content1) === calculateHash(content2);
}
