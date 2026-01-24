import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Resource, InteractiveResult } from '../types.js';

// Mock dependencies - use vi.hoisted for hoisted mocks
const mocks = vi.hoisted(() => {
  const mockInstall = vi.fn();
  const mockInteractiveRun = vi.fn();
  const mockSelectResources = vi.fn();
  const mockFetchResources = vi.fn();
  const mockLoggerMethods = {
    displayWelcome: vi.fn(),
    displayCompletion: vi.fn(),
    displayResults: vi.fn(),
    startProgress: vi.fn(),
    succeedProgress: vi.fn(),
    failProgress: vi.fn(),
    warnProgress: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
  return { mockInstall, mockInteractiveRun, mockSelectResources, mockFetchResources, mockLoggerMethods };
});

vi.mock('../prompts/InteractivePrompt.js', () => ({
  interactivePrompt: {
    run: mocks.mockInteractiveRun,
    selectResources: mocks.mockSelectResources,
  },
}));

vi.mock('../fetch/GitHubFetcher.js', () => ({
  githubFetcher: {
    fetchResources: mocks.mockFetchResources,
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
    mocks.mockSelectResources.mockClear();
    mocks.mockFetchResources.mockClear();
    mocks.mockFetchResources.mockResolvedValue([]);
    mocks.mockSelectResources.mockResolvedValue([]);
    Object.values(mocks.mockLoggerMethods).forEach(fn => fn.mockClear());

    handler = new CommandHandler();
  });

  describe('run', () => {
    it('should execute interactive flow and install resources', async () => {
      const mockResource: Resource = {
        name: 'test-skill',
        description: 'Test skill',
        type: 'skills',
        path: '/path/to/skill',
        content: 'test content',
        metadata: {},
      };

      const mockResult: InteractiveResult = {
        agent: 'claude-code',
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
        type: 'skills',
        path: '/path/to/skill',
        content: 'test content',
        metadata: {},
      };

      const mockResult: InteractiveResult = {
        agent: 'cursor',
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

    it('should handle empty resources selection without calling install', async () => {
      const mockResult: InteractiveResult = {
        agent: 'github-copilot',
        types: ['skills'],
        resources: [],
        scope: 'project',
      };

      mocks.mockInteractiveRun.mockResolvedValue(mockResult);

      await handler.run();

      expect(mocks.mockInteractiveRun).toHaveBeenCalledTimes(1);
      // When resources is empty, install should NOT be called
      expect(mocks.mockInstall).not.toHaveBeenCalled();
      expect(mocks.mockLoggerMethods.info).toHaveBeenCalledWith('No resources selected.');
    });

    it('should work with all supported agents', async () => {
      const agents = ['claude-code', 'cursor', 'github-copilot', 'antigravity'] as const;

      for (const agent of agents) {
        // Clear for each iteration
        mocks.mockInstall.mockClear();
        mocks.mockInteractiveRun.mockClear();

        const mockResource: Resource = {
          name: 'test-skill',
          description: 'Test skill',
          type: 'skills',
          path: '/path/to/skill',
          content: 'test content',
          metadata: {},
        };

        const mockResult: InteractiveResult = {
          agent,
          types: ['skills'],
          resources: [mockResource], // Need at least one resource to trigger install
          scope: 'project',
        };

        mocks.mockInteractiveRun.mockResolvedValue(mockResult);

        await handler.run();

        expect(mocks.mockInteractiveRun).toHaveBeenCalledTimes(1);
        expect(mocks.mockInstall).toHaveBeenCalledTimes(1);
      }
    });

    it('should fetch resources when source is provided', async () => {
      const mockResource: Resource = {
        name: 'test-skill',
        description: 'Test skill',
        type: 'skills',
        path: '/path/to/skill',
        content: 'test content',
        metadata: {},
      };

      mocks.mockFetchResources.mockResolvedValue([mockResource]);
      mocks.mockSelectResources.mockResolvedValue([mockResource]);

      await handler.run({ source: 'vercel-labs/agent-skills' });

      expect(mocks.mockLoggerMethods.info).toHaveBeenCalledWith(
        expect.stringContaining('GitHub: vercel-labs/agent-skills')
      );
      expect(mocks.mockFetchResources).toHaveBeenCalled();
      // Interactive run should NOT be called when source is provided
      expect(mocks.mockInteractiveRun).not.toHaveBeenCalled();
    });

    it('should skip resource selection with --yes flag', async () => {
      const mockResource: Resource = {
        name: 'test-skill',
        description: 'Test skill',
        type: 'skills',
        path: '/path/to/skill',
        content: 'test content',
        metadata: {},
      };

      mocks.mockFetchResources.mockResolvedValue([mockResource]);

      await handler.run({ source: 'vercel-labs/agent-skills', yes: true });

      // selectResources should NOT be called with --yes
      expect(mocks.mockSelectResources).not.toHaveBeenCalled();
      expect(mocks.mockInstall).toHaveBeenCalled();
    });
  });
});
