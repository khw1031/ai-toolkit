import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Resource, InteractiveResult } from '../types.js';

// Mock dependencies - use vi.hoisted for hoisted mocks
const mocks = vi.hoisted(() => {
  const mockInstall = vi.fn();
  const mockInteractiveRun = vi.fn();
  const mockLoggerMethods = {
    displayWelcome: vi.fn(),
    displayCompletion: vi.fn(),
    displayResults: vi.fn(),
    startProgress: vi.fn(),
    succeedProgress: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
  return { mockInstall, mockInteractiveRun, mockLoggerMethods };
});

vi.mock('../prompts/InteractivePrompt.js', () => ({
  interactivePrompt: {
    run: mocks.mockInteractiveRun,
  },
}));

vi.mock('../install/InstallManager.js', () => ({
  InstallManager: vi.fn().mockImplementation(() => ({
    install: mocks.mockInstall,
  })),
}));

vi.mock('../utils/Logger.js', () => ({
  Logger: vi.fn().mockImplementation(() => mocks.mockLoggerMethods),
}));

// Import after mocks are set up
import { CommandHandler } from './CommandHandler.js';

describe('CommandHandler', () => {
  let handler: CommandHandler;

  beforeEach(() => {
    // Reset mock call history without removing implementations
    mocks.mockInstall.mockClear();
    mocks.mockInstall.mockResolvedValue([]);
    mocks.mockInteractiveRun.mockClear();
    Object.values(mocks.mockLoggerMethods).forEach(fn => fn.mockClear());

    handler = new CommandHandler();
  });

  describe('run', () => {
    it('should execute interactive flow and install resources', async () => {
      const mockResource: Resource = {
        name: 'test-skill',
        description: 'Test skill',
        type: 'skill',
        content: 'test content',
        version: '1.0.0',
        files: [],
      };

      const mockResult: InteractiveResult = {
        agent: 'claude-code',
        directory: 'common',
        types: ['skills'],
        resources: [mockResource],
        scope: 'project',
      };

      mocks.mockInteractiveRun.mockResolvedValue(mockResult);

      await handler.run();

      expect(mocks.mockInteractiveRun).toHaveBeenCalledTimes(1);
      expect(mocks.mockInstall).toHaveBeenCalledTimes(1);
      expect(mocks.mockLoggerMethods.displayWelcome).toHaveBeenCalledTimes(1);
      expect(mocks.mockLoggerMethods.displayCompletion).toHaveBeenCalledTimes(1);
    });

    it('should handle installation cancellation', async () => {
      mocks.mockInteractiveRun.mockRejectedValue(
        new Error('Installation cancelled')
      );

      // Should not throw, just log info
      await handler.run();

      expect(mocks.mockInteractiveRun).toHaveBeenCalledTimes(1);
      expect(mocks.mockLoggerMethods.info).toHaveBeenCalledWith('Installation cancelled');
    });

    it('should throw error on unexpected failures', async () => {
      mocks.mockInteractiveRun.mockRejectedValue(new Error('Network error'));

      await expect(handler.run()).rejects.toThrow('Network error');
      expect(mocks.mockLoggerMethods.error).toHaveBeenCalledWith('Error: Network error');
    });

    it('should create install requests with correct structure', async () => {
      const mockResource: Resource = {
        name: 'test-skill',
        description: 'Test skill',
        type: 'skill',
        content: 'test content',
        version: '1.0.0',
        files: [],
      };

      const mockResult: InteractiveResult = {
        agent: 'cursor',
        directory: 'frontend',
        types: ['skills', 'rules'],
        resources: [mockResource],
        scope: 'global',
      };

      mocks.mockInteractiveRun.mockResolvedValue(mockResult);

      await handler.run();

      // Verify install was called with correct structure
      expect(mocks.mockInstall).toHaveBeenCalledTimes(1);
      expect(mocks.mockInstall).toHaveBeenCalledWith([
        {
          resource: mockResource,
          agent: 'cursor',
          scope: 'global',
          onDuplicate: 'compare',
        },
      ]);
    });

    it('should handle empty resources selection', async () => {
      const mockResult: InteractiveResult = {
        agent: 'github-copilot',
        directory: 'app',
        types: ['skills'],
        resources: [],
        scope: 'project',
      };

      mocks.mockInteractiveRun.mockResolvedValue(mockResult);

      await handler.run();

      expect(mocks.mockInteractiveRun).toHaveBeenCalledTimes(1);
      expect(mocks.mockInstall).toHaveBeenCalledWith([]);
    });

    it('should work with all supported agents', async () => {
      const agents = ['claude-code', 'cursor', 'github-copilot', 'antigravity'] as const;

      for (const agent of agents) {
        // Clear for each iteration
        mocks.mockInstall.mockClear();
        mocks.mockInteractiveRun.mockClear();

        const mockResult: InteractiveResult = {
          agent,
          directory: 'common',
          types: ['skills'],
          resources: [],
          scope: 'project',
        };

        mocks.mockInteractiveRun.mockResolvedValue(mockResult);

        await handler.run();

        expect(mocks.mockInteractiveRun).toHaveBeenCalledTimes(1);
        expect(mocks.mockInstall).toHaveBeenCalledTimes(1);
      }
    });
  });
});
