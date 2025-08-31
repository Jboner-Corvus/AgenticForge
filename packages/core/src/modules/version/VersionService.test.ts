import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VersionService } from './VersionService';

// Mock the logger
vi.mock('../packages/core/src/logger.ts', () => ({
  getLoggerInstance: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock the file system
vi.mock('fs', () => ({
  default: {
    statSync: () => ({ mtime: { toISOString: () => '2023-01-01T00:00:00.000Z' } }),
    readFileSync: () => JSON.stringify({ version: '1.0.0' }),
  },
}));

describe('VersionService', () => {
  let versionService: VersionService;

  beforeEach(() => {
    versionService = new VersionService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle GitHub API errors gracefully with retry logic', async () => {
    // Mock fetch to simulate network errors
    const originalFetch = global.fetch;
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    try {
      await versionService.getLatestRelease();
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Failed to check for updates');
    }

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should handle GitHub API timeout gracefully', async () => {
    // Mock fetch to simulate timeout
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });
    });

    try {
      await versionService.getLatestRelease();
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Failed to check for updates');
    }

    // Restore original fetch
    global.fetch = originalFetch;
  });
});