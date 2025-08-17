import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectPlanningTool } from './projectPlanning.tool';
import { sendToCanvas } from '../../../../utils/canvasUtils.js';
import { getRedisClientInstance } from '../../../redis/redisClient.js';

// Mock the canvasUtils
vi.mock('../../../../utils/canvasUtils.js', () => ({
  sendToCanvas: vi.fn(),
}));

// Mock the redis client
vi.mock('../../../redis/redisClient.js', () => ({
  getRedisClientInstance: vi.fn(() => ({
    publish: vi.fn(),
  })),
}));

describe('projectPlanningTool', () => {
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
    expect(projectPlanningTool.name).toBe('project_planning');
    expect(projectPlanningTool.description).toContain('Creates detailed project plans');
  });

  it('should generate a project plan successfully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    const result = await projectPlanningTool.execute({
      projectName: 'Duke Nukem 2',
      projectDescription: 'Create a retro-style first-person shooter game',
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('plan');
    if ('plan' in result && result.plan) {
      expect(result.plan.length).toBeGreaterThan(0);
      expect(result.plan[0]).toHaveProperty('id');
      expect(result.plan[0]).toHaveProperty('title');
      expect(result.plan[0]).toHaveProperty('description');
      expect(result.plan[0]).toHaveProperty('phase');
      expect(result.plan[0]).toHaveProperty('estimatedTime');
      expect(result.plan[0]).toHaveProperty('priority');
    }
    
    // Check that sendToCanvas was called with HTML template
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('<!DOCTYPE html>'), 'html');
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('Project Plan: Duke Nukem 2'), 'html');
    
    expect(mockCtx.log.info).toHaveBeenCalledWith('Generating project plan for: Duke Nukem 2');
  });

  it('should handle errors gracefully', async () => {
    const mockCtx = createMockContext('test-job-id');
    
    // Force an error by mocking sendToCanvas to throw
    vi.mocked(sendToCanvas).mockImplementationOnce(() => {
      throw new Error('Canvas error');
    });
    
    const result = await projectPlanningTool.execute({
      projectName: 'Test Project',
      projectDescription: 'Test project description',
    }, mockCtx);
    
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('Failed to generate project plan');
    }
  });

  it('should work without job ID (no canvas display)', async () => {
    const mockCtx = createMockContext(); // No job ID
    
    const result = await projectPlanningTool.execute({
      projectName: 'Test Project',
      projectDescription: 'Test project description',
    }, mockCtx);
    
    expect(result).toHaveProperty('success', true);
    expect(sendToCanvas).not.toHaveBeenCalled();
  });
});