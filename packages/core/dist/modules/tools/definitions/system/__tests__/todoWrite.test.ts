import { describe, it, expect, vi, beforeEach } from 'vitest';
import { todoWriteTool, getTodosForSession } from '../todoWrite.tool';
import type { Ctx } from '../../../../../types';

// Mock Redis client
const mockPublish = vi.fn();
vi.mock('../../../../../modules/redis/redisClient', () => ({
  getRedisClientInstance: () => ({
    publish: mockPublish,
  }),
}));

describe('todoWrite.tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (
    sessionName = 'test-session',
    jobId = 'job-123',
  ): Ctx =>
    ({
      session: { name: sessionName } as any,
      job: { id: jobId } as any,
      log: {
        info: vi.fn(),
        error: vi.fn(),
      } as any,
    }) as Ctx;

  it('should handle simple todo creation like Claude Code', async () => {
    const ctx = createMockContext();
    const todos = [
      { id: '1', content: 'First task', status: 'pending' as const },
      { id: '2', content: 'Second task', status: 'in_progress' as const },
      { id: '3', content: 'Third task', status: 'completed' as const },
    ];

    const result = await todoWriteTool.execute({ todos }, ctx);

    expect(result.success).toBe(true);
    expect(result.todos).toEqual(todos);
    expect(result.message).toContain('3 total tasks');
  });

  it('should publish WebSocket message in Claude Code format', async () => {
    const ctx = createMockContext('session-1', 'job-456');
    const todos = [
      { id: '1', content: 'Test task', status: 'pending' as const },
    ];

    await todoWriteTool.execute({ todos }, ctx);

    expect(mockPublish).toHaveBeenCalledWith(
      'job:job-456:events',
      expect.stringContaining('"type":"claude_code_todo"'),
    );

    // Verify the published data structure
    const publishCall = mockPublish.mock.calls[0];
    const publishedData = JSON.parse(publishCall[1]);

    expect(publishedData.type).toBe('claude_code_todo');
    expect(publishedData.data.todos).toEqual(todos);
    expect(publishedData.data.stats.total).toBe(1);
    expect(publishedData.data.stats.pending).toBe(1);
  });

  it('should store todos globally per session', async () => {
    const ctx = createMockContext('session-test');
    const todos = [
      { id: '1', content: 'Stored task', status: 'pending' as const },
    ];

    await todoWriteTool.execute({ todos }, ctx);

    // Should be able to retrieve todos for this session
    const storedTodos = getTodosForSession('session-test');
    expect(storedTodos).toEqual(todos);
  });

  it('should calculate stats correctly', async () => {
    const ctx = createMockContext();
    const todos = [
      { id: '1', content: 'Task 1', status: 'pending' as const },
      { id: '2', content: 'Task 2', status: 'pending' as const },
      { id: '3', content: 'Task 3', status: 'in_progress' as const },
      { id: '4', content: 'Task 4', status: 'completed' as const },
      { id: '5', content: 'Task 5', status: 'completed' as const },
    ];

    await todoWriteTool.execute({ todos }, ctx);

    const publishCall = mockPublish.mock.calls[0];
    const publishedData = JSON.parse(publishCall[1]);

    expect(publishedData.data.stats).toEqual({
      pending: 2,
      in_progress: 1,
      completed: 2,
      total: 5,
    });
  });

  it('should handle errors gracefully', async () => {
    const ctx = createMockContext();
    mockPublish.mockRejectedValue(new Error('Redis error'));

    const result = await todoWriteTool.execute({ todos: [] }, ctx);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to update todos');
  });
});
