import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendToCanvas } from '../../../../utils/canvasUtils.ts';
import { displayCanvasTool } from './displayCanvas.tool';

// Mock the canvasUtils
vi.mock('../../../../utils/canvasUtils.ts', () => ({
  closeCanvas: vi.fn(),
  sendToCanvas: vi.fn(),
}));

describe('displayCanvasTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct name and description', () => {
    expect(displayCanvasTool.name).toBe('display_canvas');
    expect(displayCanvasTool.description).toBe(
      "Affiche du contenu dans le canvas de l'interface utilisateur. Peut afficher du HTML, Markdown, du texte brut ou une URL. Très utile pour montrer des visualisations, des rapports, des graphiques, des animations, des jeux simples, etc.",
    );
  });

  it('should have correct parameters schema', () => {
    const shape = displayCanvasTool.parameters._def.shape();
    expect(shape.content._def.typeName).toBe('ZodString');
    expect(shape.contentType._def.typeName).toBe('ZodOptional');
    expect(shape.contentType._def.innerType._def.typeName).toBe('ZodEnum');
    expect(shape.contentType._def.innerType._def.values).toEqual([
      'html',
      'markdown',
      'text',
      'url',
    ]);
    expect(shape.title._def.typeName).toBe('ZodOptional');
    expect(shape.title._def.innerType._def.typeName).toBe('ZodString');
    expect(displayCanvasTool.parameters._def.typeName).toBe('ZodObject');
  });

  it('should send HTML content to canvas successfully', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: 'info' as any,
      trace: vi.fn(),
      warn: vi.fn(),
    } as any;
    const content = '<h1>Test HTML</h1><p>This is a test</p>';

    const result = await displayCanvasTool.execute(
      { content, contentType: 'html' },
      {
        job: {
          ...mockJob,
          data: { prompt: 'test' },
          isFailed: async () => false,
          name: 'test-job',
        },
        llm: {
          getErrorType: () => 'UNKNOWN' as any,
          getLlmResponse: async () => 'test',
        },
        log: mockLog,
        reportProgress: vi.fn(),
        session: {
          history: [],
          identities: [],
          name: 'test-session',
          timestamp: Date.now(),
        },
        streamContent: vi.fn(),
        taskQueue: {} as any,
      },
    );

    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', content, 'html');
    expect(mockLog.info).toHaveBeenCalledWith(
      'Content sent to canvas for job test-job-id with type html',
    );
    expect(result).toEqual({
      success: true,
    });
  });

  it('should send Markdown content to canvas successfully', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: 'info' as any,
      trace: vi.fn(),
      warn: vi.fn(),
    } as any;
    const content = '# Test Markdown\n\nThis is a test';
    const contentType = 'markdown';

    const result = await displayCanvasTool.execute(
      { content, contentType },
      {
        job: {
          ...mockJob,
          data: { prompt: 'test' },
          isFailed: async () => false,
          name: 'test-job',
        },
        llm: {
          getErrorType: () => 'UNKNOWN' as any,
          getLlmResponse: async () => 'test',
        },
        log: mockLog,
        reportProgress: vi.fn(),
        session: {
          history: [],
          identities: [],
          name: 'test-session',
          timestamp: Date.now(),
        },
        streamContent: vi.fn(),
        taskQueue: {} as any,
      },
    );

    expect(sendToCanvas).toHaveBeenCalledWith(
      'test-job-id',
      content,
      'markdown',
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      'Content sent to canvas for job test-job-id with type markdown',
    );
    expect(result).toEqual({
      success: true,
    });
  });

  it('should send content with title to canvas', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: 'info' as any,
      trace: vi.fn(),
      warn: vi.fn(),
    } as any;
    const content = '<h1>Test HTML</h1><p>This is a test</p>';
    const title = 'Test Title';

    const result = await displayCanvasTool.execute(
      { content, contentType: 'html', title },
      {
        job: {
          ...mockJob,
          data: { prompt: 'test' },
          isFailed: async () => false,
          name: 'test-job',
        },
        llm: {
          getErrorType: () => 'UNKNOWN' as any,
          getLlmResponse: async () => 'test',
        },
        log: mockLog,
        reportProgress: vi.fn(),
        session: {
          history: [],
          identities: [],
          name: 'test-session',
          timestamp: Date.now(),
        },
        streamContent: vi.fn(),
        taskQueue: {} as any,
      },
    );

    expect(sendToCanvas).toHaveBeenCalledWith('test-job-id', content, 'html');
    expect(mockLog.info).toHaveBeenCalledWith(
      'Displaying content with title: Test Title',
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      'Content sent to canvas for job test-job-id with type html',
    );
    expect(result).toEqual({
      success: true,
    });
  });

  it('should handle errors when sending to canvas fails', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: 'info' as any,
      trace: vi.fn(),
      warn: vi.fn(),
    } as any;
    const content = '<h1>Test HTML</h1><p>This is a test</p>';

    // Mock sendToCanvas to throw an error
    (sendToCanvas as any).mockImplementationOnce(() => {
      throw new Error('Canvas error');
    });

    await expect(
      displayCanvasTool.execute(
        { content, contentType: 'html' },
        {
          job: {
            ...mockJob,
            data: { prompt: 'test' },
            isFailed: async () => false,
            name: 'test-job',
          },
          llm: {
            getErrorType: () => 'UNKNOWN' as any,
            getLlmResponse: async () => 'test',
          },
          log: mockLog,
          reportProgress: vi.fn(),
          session: {
            history: [],
            identities: [],
            name: 'test-session',
            timestamp: Date.now(),
          },
          streamContent: vi.fn(),
          taskQueue: {} as any,
        },
      ),
    ).rejects.toThrow('Failed to display content in canvas: Canvas error');

    expect(mockLog.error).toHaveBeenCalled();
  });
});
