// 🧪 TEST GÉNÉRÉ AUTOMATIQUEMENT pour l'outil : custom-greeting
// 📁 Outil généré dans: dist/tools/generated/
// 🎯 Tests pour outils runtime (vs outils natifs dans src/)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customGreetingTool } from './customGreeting.tool';
import type { Ctx } from '../../../../types.ts';

describe('customGreetingTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: {
        id: 'test-job',
        data: { prompt: 'test' },
        isFailed: async () => false,
        name: 'test-job',
      },
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
          silent: false,
        })),
      } as any,
      streamContent: vi.fn(),
      reportProgress: vi.fn(),
      session: {
        history: [],
        identities: [],
        name: 'test-session',
        timestamp: Date.now(),
      },
      taskQueue: {} as any,
      llm: {
        getErrorType: () => 'UNKNOWN' as any,
        getLlmResponse: async () => 'test',
      },
    };
  });

  it('should have correct name and description', () => {
    expect(customGreetingTool.name).toBe('custom-greeting');
    expect(customGreetingTool.description).toBe(
      'Un outil personnalisé qui salue un utilisateur par son nom et lui souhaite la bienvenue dans AgenticForge.',
    );
    expect(customGreetingTool.parameters).toBeDefined();
  });

  it('should execute successfully with valid parameters', async () => {
    // TODO: Ajouter des paramètres de test appropriés basés sur le schéma Zod
    const testArgs = {}; // À adapter selon les paramètres définis

    const result = await customGreetingTool.execute(testArgs, mockCtx);

    // TODO: Ajouter des assertions spécifiques au comportement attendu
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Test avec des paramètres invalides ou des conditions d'erreur
    const invalidArgs = {}; // À adapter selon les cas d'erreur possibles

    try {
      await customGreetingTool.execute(invalidArgs, mockCtx);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
