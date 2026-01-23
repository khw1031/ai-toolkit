import { writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Atomic file write
 * Write to temp file first, then rename (atomic operation)
 */
export async function atomicWrite(
  filePath: string,
  content: string
): Promise<void> {
  const dir = dirname(filePath);
  const tempFile = join(dir, `.${randomBytes(8).toString('hex')}.tmp`);

  try {
    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write to temp file
    await writeFile(tempFile, content, 'utf-8');

    // Atomic rename
    await rename(tempFile, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
