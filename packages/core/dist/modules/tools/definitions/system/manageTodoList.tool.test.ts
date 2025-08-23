import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';
import { manageTodoListTool } from './manageTodoList.tool';

// Mock the redis client
const mockPublish = vi.fn();
vi.mock('../../../../modules/redis/redisClient.ts', () => ({
  getRedisClientInstance: vi.fn(() => ({
    publish: mockPublish,
  })),
}));

describe('manageTodoListTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (jobId?: string) => ({
    job: jobId
      ? {
          data: { prompt: 'test' },
          id: jobId,
          isFailed: async () => false,
          name: 'test-job',
        }
      : undefined,
    llm: {
      getErrorType: () => 'UNKNOWN' as any,
      getLlmResponse: async () => 'test',
    },
    log: {
      child: vi.fn(() => ({
        debug: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
        info: vi.fn(),
        level: 'info' as any,
        silent: false,
        trace: vi.fn(),
        warn: vi.fn(),
      })),
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: 'info' as any,
      silent: false,
      trace: vi.fn(),
      warn: vi.fn(),
    } as any,
    reportProgress: vi.fn(),
    session: {
      history: [],
      identities: [],
      name: 'test-session',
      timestamp: Date.now(),
    },
    streamContent: vi.fn(),
    taskQueue: {} as any,
  });

  it('should have correct name and description', () => {
    expect(manageTodoListTool.name).toBe('manage_todo_list');
    expect(manageTodoListTool.description).toContain('Manages a todo list');
  });

  it('should create new todos successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    const todos = [
      { content: 'Task 1', id: '1', status: 'pending' as const },
      { content: 'Task 2', id: '2', status: 'in_progress' as const },
    ];

    const result = await manageTodoListTool.execute(
      {
        action: 'create',
        title: 'Test Todo List',
        todos,
      },
      mockCtx,
    );

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('todos');
    if ('todos' in result && result.todos) {
      expect(result.todos).toHaveLength(2);
      expect(result.todos[0].content).toBe('Task 1');
    }

    // Check that Redis publish was called with todo_list data
    expect(getRedisClientInstance).toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalledWith(
      'job:test-job-id:events',
      expect.stringContaining('"type":"todo_list"'),
    );
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      'Created 2 todos for native interface',
    );
  });

  it('should update todo status successfully', async () => {
    const mockCtx = createMockContext('test-job-id');

    // First create todos
    await manageTodoListTool.execute(
      {
        action: 'create',
        todos: [{ content: 'Task 1', id: '1', status: 'pending' as const }],
      },
      mockCtx,
    );

    // Clear previous calls
    vi.clearAllMocks();

    // Then update status
    const result = await manageTodoListTool.execute(
      {
        action: 'update',
        itemId: '1',
        status: 'completed',
      },
      mockCtx,
    );

    expect(result).toHaveProperty('success', true);
    if ('todos' in result && result.todos) {
      expect(result.todos[0].status).toBe('completed');
    }

    // Check that Redis publish was called with todo_list data
    expect(getRedisClientInstance).toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalledWith(
      'job:test-job-id:events',
      expect.stringContaining('"type":"todo_list"'),
    );
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      'Updated todo 1 to status completed',
    );
  });

  it('should display todos successfully', async () => {
    const mockCtx = createMockContext('test-job-id');

    // Create and display todos in one go
    const result = await manageTodoListTool.execute(
      {
        action: 'create',
        title: 'My Tasks',
        todos: [
          { content: 'Task 1', id: '1', status: 'pending' as const },
          { content: 'Task 2', id: '2', status: 'completed' as const },
        ],
      },
      mockCtx,
    );

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', 'Created 2 todo items');

    // Check that Redis publish was called with todo_list data
    expect(getRedisClientInstance).toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalledWith(
      'job:test-job-id:events',
      expect.stringContaining('"type":"todo_list"'),
    );
  });

  it('should clear todos successfully', async () => {
    const mockCtx = createMockContext('test-job-id');

    // First create todos
    await manageTodoListTool.execute(
      {
        action: 'create',
        todos: [{ content: 'Task 1', id: '1', status: 'pending' as const }],
      },
      mockCtx,
    );

    // Then clear
    const result = await manageTodoListTool.execute(
      {
        action: 'clear',
      },
      mockCtx,
    );

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', 'Todo list cleared');
    if ('todos' in result && result.todos) {
      expect(result.todos).toHaveLength(0);
    }
    expect(mockCtx.log.info).toHaveBeenCalledWith('Todo list cleared');
  });

  it('should handle errors when updating non-existent todo', async () => {
    const mockCtx = createMockContext('test-job-id');

    const result = await manageTodoListTool.execute(
      {
        action: 'update',
        itemId: 'non-existent',
        status: 'completed',
      },
      mockCtx,
    );

    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('not found');
    }
  });

  it('should handle missing parameters for create action', async () => {
    const mockCtx = createMockContext('test-job-id');

    const result = await manageTodoListTool.execute(
      {
        action: 'create',
      },
      mockCtx,
    );

    expect(result).toHaveProperty(
      'error',
      'No todos provided for create action',
    );
  });

  it('should handle missing parameters for update action', async () => {
    const mockCtx = createMockContext('test-job-id');

    const result = await manageTodoListTool.execute(
      {
        action: 'update',
      },
      mockCtx,
    );

    expect(result).toHaveProperty(
      'error',
      'Item ID and status are required for update action',
    );
  });

  it('should work without job ID (no canvas display)', async () => {
    const mockCtx = createMockContext(); // No job ID

    const result = await manageTodoListTool.execute(
      {
        action: 'create',
        todos: [{ content: 'Task 1', id: '1', status: 'pending' as const }],
      },
      mockCtx,
    );

    expect(result).toHaveProperty('success', true);
    // Should not call Redis publish when there's no job ID
    expect(getRedisClientInstance).not.toHaveBeenCalled();
  });
});
