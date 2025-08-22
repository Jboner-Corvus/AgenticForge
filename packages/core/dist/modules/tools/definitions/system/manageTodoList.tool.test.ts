import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manageTodoListTool } from './manageTodoList.tool';
import { sendToCanvas } from '../../../../utils/canvasUtils.ts';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';

// Mock the canvasUtils
vi.mock('../../../../utils/canvasUtils.ts', () => ({
  sendToCanvas: vi.fn(),
}));

// Mock the redis client
vi.mock('../../../../modules/redis/redisClient.ts', () => ({
  getRedisClientInstance: vi.fn(() => ({
    publish: vi.fn(),
  })),
}));

describe('manageTodoListTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (jobId?: string) => ({
    job: jobId ? { id: jobId, data: { prompt: 'test' }, isFailed: async () => false, name: 'test-job' } : undefined,
    log: { 
      info: vi.fn(), 
      error: vi.fn(), 
      warn: vi.fn(), 
      debug: vi.fn(), 
      fatal: vi.fn(), 
      trace: vi.fn(),
      level: 'info' as any,
      silent: false,
      child: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        level: 'info' as any,
        silent: false
      }))
    } as any,
    streamContent: vi.fn(),
    reportProgress: vi.fn(),
    session: { history: [], identities: [], name: 'test-session', timestamp: Date.now() },
    taskQueue: {} as any,
    llm: { getErrorType: () => 'UNKNOWN' as any, getLlmResponse: async () => 'test' }
  });

  it('should have correct name and description', () => {
    expect(manageTodoListTool.name).toBe('manage_todo_list');
    expect(manageTodoListTool.description).toContain('Manages a todo list');
  });

  it('should create new todos successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    const todos = [
      { id: '1', content: 'Task 1', status: 'pending' as const },
      { id: '2', content: 'Task 2', status: 'in_progress' as const },
    ];
    
    const result = await manageTodoListTool.execute({
      action: 'create',
      todos,
      title: 'Test Todo List'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('todos');
    if ('todos' in result && result.todos) {
      expect(result.todos).toHaveLength(2);
      expect(result.todos[0].content).toBe('Task 1');
    }
    // Check that sendToCanvas was called with HTML template (first call)
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('<!DOCTYPE html>'), 'html');
    // Check that sendToCanvas was also called with JSON data
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('"type":"todo_list"'), 'json');
    expect(mockCtx.log.info).toHaveBeenCalledWith('Created 2 todos');
  });

  it('should update todo status successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    // First create todos
    await manageTodoListTool.execute({
      action: 'create',
      todos: [{ id: '1', content: 'Task 1', status: 'pending' as const }],
    }, mockCtx);
    
    // Clear previous calls
    vi.clearAllMocks();
    
    // Then update status
    const result = await manageTodoListTool.execute({
      action: 'update',
      itemId: '1',
      status: 'completed'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    if ('todos' in result && result.todos) {
      expect(result.todos[0].status).toBe('completed');
    }
    // Check that sendToCanvas was called with JSON data
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('"type":"todo_list"'), 'json');
    expect(mockCtx.log.info).toHaveBeenCalledWith('Updated todo 1 to status completed');
  });

  it('should display todos successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    // Create and display todos in one go (template should be sent)
    const result = await manageTodoListTool.execute({
      action: 'create',
      todos: [
        { id: '1', content: 'Task 1', status: 'pending' as const },
        { id: '2', content: 'Task 2', status: 'completed' as const },
      ],
      title: 'My Tasks'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', 'Created 2 todo items');
    // Check that sendToCanvas was called with JSON data (template may have been sent already in this session)
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('"type":"todo_list"'), 'json');
  });

  it('should clear todos successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    // First create todos
    await manageTodoListTool.execute({
      action: 'create',
      todos: [{ id: '1', content: 'Task 1', status: 'pending' as const }],
    }, mockCtx);
    
    // Then clear
    const result = await manageTodoListTool.execute({
      action: 'clear'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', 'Todo list cleared');
    if ('todos' in result && result.todos) {
      expect(result.todos).toHaveLength(0);
    }
    expect(mockCtx.log.info).toHaveBeenCalledWith('Cleared todo list');
  });

  it('should handle errors when updating non-existent todo', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await manageTodoListTool.execute({
      action: 'update',
      itemId: 'non-existent',
      status: 'completed'
    }, mockCtx);
    
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('not found');
    }
  });

  it('should handle missing parameters for create action', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await manageTodoListTool.execute({
      action: 'create'
    }, mockCtx);
    
    expect(result).toHaveProperty('error', 'No todos provided for create action');
  });

  it('should handle missing parameters for update action', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await manageTodoListTool.execute({
      action: 'update'
    }, mockCtx);
    
    expect(result).toHaveProperty('error', 'Item ID and status are required for update action');
  });

  it('should work without job ID (no canvas display)', async () => {
    const mockCtx = createMockContext(); // No job ID
    
    const result = await manageTodoListTool.execute({
      action: 'create',
      todos: [{ id: '1', content: 'Task 1', status: 'pending' as const }],
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(sendToCanvas).not.toHaveBeenCalled();
  });
});