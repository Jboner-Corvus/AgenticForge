import { describe, it, expect, vi, beforeEach } from 'vitest';
import { displayExampleCanvasTool } from './displayExampleCanvas.tool';
import { sendToCanvas } from '../../../../utils/canvasUtils.js';

// Mock the canvasUtils
vi.mock('../../../../utils/canvasUtils.js', () => ({
  sendToCanvas: vi.fn(),
  closeCanvas: vi.fn()
}));

describe('displayExampleCanvasTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name and description', () => {
    expect(displayExampleCanvasTool.name).toBe('display_example_canvas');
    expect(displayExampleCanvasTool.description).toBe('Affiche des exemples prédéfinis dans le canvas de l\'interface utilisateur. Exemples disponibles: visualisation de données interactives, jeu Snake, animation de particules.');
  });

  it('should have correct parameters schema', () => {
    const shape = displayExampleCanvasTool.parameters._def.shape();
    expect(shape.example._def.typeName).toBe('ZodEnum');
    expect(shape.example._def.values).toEqual(['visualization', 'game', 'animation']);
    expect(shape.title._def.typeName).toBe('ZodOptional');
    expect(shape.title._def.innerType._def.typeName).toBe('ZodString');
    expect(displayExampleCanvasTool.parameters._def.typeName).toBe('ZodObject');
  });

  it('should send visualization example to canvas successfully', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = { 
      info: vi.fn(), 
      error: vi.fn(), 
      warn: vi.fn(), 
      debug: vi.fn(), 
      fatal: vi.fn(), 
      trace: vi.fn(),
      level: 'info' as any
    } as any;
    const example = 'visualization';
    
    const result = await displayExampleCanvasTool.execute(
      { example },
      {
        job: { ...mockJob, data: { prompt: 'test' }, isFailed: async () => false, name: 'test-job' },
        log: mockLog,
        streamContent: vi.fn(),
        reportProgress: vi.fn(),
        session: { history: [], identities: [], name: 'test-session', timestamp: Date.now() },
        taskQueue: {} as any,
        llm: { getErrorType: () => 'UNKNOWN' as any, getLlmResponse: async () => 'test' }
      }
    );
    
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('<!DOCTYPE html>'), 'html');
    expect(mockLog.info).toHaveBeenCalledWith('Example "visualization" sent to canvas for job test-job-id');
    expect(result).toEqual({
      success: true
    });
  });

  it('should send game example to canvas successfully', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = { 
      info: vi.fn(), 
      error: vi.fn(), 
      warn: vi.fn(), 
      debug: vi.fn(), 
      fatal: vi.fn(), 
      trace: vi.fn(),
      level: 'info' as any
    } as any;
    const example = 'game';
    
    const result = await displayExampleCanvasTool.execute(
      { example },
      {
        job: { ...mockJob, data: { prompt: 'test' }, isFailed: async () => false, name: 'test-job' },
        log: mockLog,
        streamContent: vi.fn(),
        reportProgress: vi.fn(),
        session: { history: [], identities: [], name: 'test-session', timestamp: Date.now() },
        taskQueue: {} as any,
        llm: { getErrorType: () => 'UNKNOWN' as any, getLlmResponse: async () => 'test' }
      }
    );
    
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('<!DOCTYPE html>'), 'html');
    expect(mockLog.info).toHaveBeenCalledWith('Example "game" sent to canvas for job test-job-id');
    expect(result).toEqual({
      success: true
    });
  });

  it('should send animation example to canvas successfully', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = { 
      info: vi.fn(), 
      error: vi.fn(), 
      warn: vi.fn(), 
      debug: vi.fn(), 
      fatal: vi.fn(), 
      trace: vi.fn(),
      level: 'info' as any
    } as any;
    const example = 'animation';
    
    const result = await displayExampleCanvasTool.execute(
      { example },
      {
        job: { ...mockJob, data: { prompt: 'test' }, isFailed: async () => false, name: 'test-job' },
        log: mockLog,
        streamContent: vi.fn(),
        reportProgress: vi.fn(),
        session: { history: [], identities: [], name: 'test-session', timestamp: Date.now() },
        taskQueue: {} as any,
        llm: { getErrorType: () => 'UNKNOWN' as any, getLlmResponse: async () => 'test' }
      }
    );
    
    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', expect.stringContaining('<!DOCTYPE html>'), 'html');
    expect(mockLog.info).toHaveBeenCalledWith('Example "animation" sent to canvas for job test-job-id');
    expect(result).toEqual({
      success: true
    });
  });

  it('should handle errors when sending unknown example', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = { 
      info: vi.fn(), 
      error: vi.fn(), 
      warn: vi.fn(), 
      debug: vi.fn(), 
      fatal: vi.fn(), 
      trace: vi.fn(),
      level: 'info' as any
    } as any;
    const example = 'unknown' as any;
    
    // Since Zod validation happens before our code, we expect it to throw a ZodError
    await expect(
      displayExampleCanvasTool.execute(
        { example },
        {
          job: { ...mockJob, data: { prompt: 'test' }, isFailed: async () => false, name: 'test-job' },
          log: mockLog,
          streamContent: vi.fn(),
          reportProgress: vi.fn(),
          session: { history: [], identities: [], name: 'test-session', timestamp: Date.now() },
          taskQueue: {} as any,
          llm: { getErrorType: () => 'UNKNOWN' as any, getLlmResponse: async () => 'test' }
        }
      )
    ).rejects.toThrow();
  });
});