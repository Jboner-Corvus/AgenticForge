import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setDevelopmentPreferencesTool } from '../setDevelopmentPreferences.tool.ts';
import { getDevelopmentPreferencesTool } from '../getDevelopmentPreferences.tool.ts';

describe('Development Preferences Tools', () => {
  const mockContext: any = {
    session: {
      metadata: {},
    },
    log: {
      info: vi.fn(),
      error: vi.fn(),
    },
  };

  beforeEach(() => {
    mockContext.session.metadata = {};
    vi.clearAllMocks();
  });

  it('should set development preferences successfully', async () => {
    const params = {
      projectType: 'game' as const,
      preferredTechnologies: {
        framework: 'PixiJS',
        language: 'TypeScript',
      },
      instructions: 'Use modern game development practices',
    };

    const result = await setDevelopmentPreferencesTool.execute(
      params,
      mockContext,
    );

    expect(result).toEqual({
      success: true,
      message:
        'Préférences de développement enregistrées pour les projets de type game',
    });

    // Verify preferences were stored
    expect(mockContext.session.metadata.developmentPreferences).toBeDefined();
    // Check that the stored preferences contain the expected values (ignoring updatedAt)
    const storedPreferences =
      mockContext.session.metadata.developmentPreferences.game;
    expect(storedPreferences.preferredTechnologies).toEqual({
      framework: 'PixiJS',
      language: 'TypeScript',
    });
    expect(storedPreferences.instructions).toBe(
      'Use modern game development practices',
    );
    expect(storedPreferences.updatedAt).toBeDefined();
  });

  it('should get development preferences successfully', async () => {
    // First set some preferences
    const setParams = {
      projectType: 'website' as const,
      preferredTechnologies: {
        framework: 'React',
        language: 'TypeScript',
        styling: 'Tailwind CSS',
      },
    };

    await setDevelopmentPreferencesTool.execute(setParams, mockContext);

    // Then get them
    const getParams = {
      projectType: 'website' as const,
    };

    const result = await getDevelopmentPreferencesTool.execute(
      getParams,
      mockContext,
    );

    expect(result.success).toBe(true);
    expect(result.preferences).toBeDefined();
    expect(result.preferences.website).toBeDefined();
    expect(result.preferences.website.preferredTechnologies).toEqual({
      framework: 'React',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
    });
    // Verify that updatedAt exists in the returned preferences
    expect(result.preferences.website.updatedAt).toBeDefined();
  });

  it('should handle getting preferences when none are set', async () => {
    const params = {
      projectType: 'game' as const,
    };

    const result = await getDevelopmentPreferencesTool.execute(
      params,
      mockContext,
    );

    expect(result).toEqual({
      success: true,
      message: 'Aucune préférence de développement définie',
    });
  });
});
