import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enhancedTodoListTool } from './enhancedTodoList.tool';
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

describe('enhancedTodoListTool', () => {
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
    expect(enhancedTodoListTool.name).toBe('enhanced_todo_list');
    expect(enhancedTodoListTool.description).toContain('Manages enhanced todo lists');
  });

  it('should create a new project successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    const project = {
      id: 'project-1',
      name: 'Duke Nukem 2 Development',
      description: 'Creating the Duke Nukem 2 game',
      status: 'planning' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
    };
    
    const result = await enhancedTodoListTool.execute({
      action: 'create_project',
      project,
      title: 'Duke Nukem 2 Project'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('project');
    if ('project' in result && result.project) {
      expect(result.project.name).toBe('Duke Nukem 2 Development');
    }
    // Vérifier que sendToCanvas a été appelé avec les bons arguments
    expect(sendToCanvas).toHaveBeenCalled();
    expect(mockCtx.log.info).toHaveBeenCalledWith('Created project: Duke Nukem 2 Development');
  });

  it('should create new tasks successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    const tasks = [
      { 
        id: '1', 
        content: 'Design game levels', 
        status: 'pending' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      { 
        id: '2', 
        content: 'Create character sprites', 
        status: 'in_progress' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    
    const result = await enhancedTodoListTool.execute({
      action: 'create_task',
      tasks,
      title: 'Game Development Tasks'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('tasks');
    if ('tasks' in result && result.tasks) {
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].content).toBe('Design game levels');
    }
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('"type":"enhanced_todo_list"'), 'text');
    expect(mockCtx.log.info).toHaveBeenCalledWith('Created 2 tasks');
  });

  it('should update task status successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    // First create tasks
    await enhancedTodoListTool.execute({
      action: 'create_task',
      tasks: [{ 
        id: '1', 
        content: 'Design game levels', 
        status: 'pending' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
    }, mockCtx);
    
    // Clear previous calls
    vi.clearAllMocks();
    
    // Then update status
    const result = await enhancedTodoListTool.execute({
      action: 'update_task',
      taskId: '1',
      status: 'completed'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    if ('tasks' in result && result.tasks) {
      expect(result.tasks[0].status).toBe('completed');
    }
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('"type":"enhanced_todo_list"'), 'text');
    expect(mockCtx.log.info).toHaveBeenCalledWith('Updated task 1 to status completed');
  });

  it('should display tasks successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    // Create and display tasks
    const result = await enhancedTodoListTool.execute({
      action: 'create_task',
      tasks: [
        { 
          id: '1', 
          content: 'Design game levels', 
          status: 'pending' as const,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        { 
          id: '2', 
          content: 'Create character sprites', 
          status: 'completed' as const,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      title: 'My Game Tasks'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', 'Created 2 tasks successfully');
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('"type":"enhanced_todo_list"'), 'text');
  });

  it('should clear tasks and project successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    // First create tasks
    await enhancedTodoListTool.execute({
      action: 'create_task',
      tasks: [{ 
        id: '1', 
        content: 'Design game levels', 
        status: 'pending' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
    }, mockCtx);
    
    // Then clear
    const result = await enhancedTodoListTool.execute({
      action: 'clear'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', 'Todo list and project cleared');
    if ('tasks' in result && result.tasks) {
      expect(result.tasks).toHaveLength(0);
    }
    expect(mockCtx.log.info).toHaveBeenCalledWith('Cleared todo list and project');
  });

  it('should handle errors when updating non-existent task', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await enhancedTodoListTool.execute({
      action: 'update_task',
      taskId: 'non-existent',
      status: 'completed'
    }, mockCtx);
    
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('not found');
    }
  });

  it('should handle missing parameters for create_task action', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await enhancedTodoListTool.execute({
      action: 'create_task'
    }, mockCtx);
    
    expect(result).toHaveProperty('error', 'No tasks provided for create_task action');
  });

  it('should handle missing parameters for update_task action', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await enhancedTodoListTool.execute({
      action: 'update_task'
    }, mockCtx);
    
    expect(result).toHaveProperty('error', 'No taskId provided for update_task action');
  });

  it('should work without job ID (no canvas display)', async () => {
    const mockCtx = createMockContext(); // No job ID
    
    const result = await enhancedTodoListTool.execute({
      action: 'create_task',
      tasks: [{ 
        id: '1', 
        content: 'Design game levels', 
        status: 'pending' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(sendToCanvas).not.toHaveBeenCalled();
  });

  it('should handle state recovery', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await enhancedTodoListTool.execute({
      action: 'recover_state'
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message', 'State loaded successfully');
    if ('recoveryStatus' in result) {
      expect(result.recoveryStatus).toBeDefined();
    }
  });
});