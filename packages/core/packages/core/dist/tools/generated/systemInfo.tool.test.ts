
// 🧪 TEST GÉNÉRÉ AUTOMATIQUEMENT pour l'outil : system-info
// 📁 Outil généré dans: dist/tools/generated/
// 🎯 Tests pour outils runtime (vs outils natifs dans src/)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemInfoTool } from './systemInfo.tool';
import type { Ctx } from '../../../../types.ts';

describe('systemInfoTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: { id: 'test-job', data: { prompt: 'test' }, isFailed: async () => false, name: 'test-job' },
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
    };
  });

  it('should have correct name and description', () => {
    expect(systemInfoTool.name).toBe('system-info');
    expect(systemInfoTool.description).toBe('Gathers system information including CPU usage, memory usage, and disk space');
    expect(systemInfoTool.parameters).toBeDefined();
  });

  it('should execute successfully with valid parameters', async () => {
    // TODO: Ajouter des paramètres de test appropriés basés sur le schéma Zod
    const testArgs = {}; // À adapter selon les paramètres définis
    
    const result = await systemInfoTool.execute(testArgs, mockCtx);
    
    // TODO: Ajouter des assertions spécifiques au comportement attendu
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Test avec des paramètres invalides ou des conditions d'erreur
    const invalidArgs = {}; // À adapter selon les cas d'erreur possibles
    
    try {
      await systemInfoTool.execute(invalidArgs, mockCtx);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
