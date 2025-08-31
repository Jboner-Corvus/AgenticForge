import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setDevelopmentPreferencesTool } from '../../../../../src/modules/tools/definitions/system/setDevelopmentPreferences.tool.ts';
import { getDevelopmentPreferencesTool } from '../../../../../src/modules/tools/definitions/system/getDevelopmentPreferences.tool.ts';

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
    expect(mockContext.session.metadata.developmentPreferences.game).toEqual({
      preferredTechnologies: {
        framework: 'PixiJS',
        language: 'TypeScript',
      },
      instructions: 'Use modern game development practices',
    });
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

    expect(result).toEqual({
      success: true,
      preferences: {
        website: {
          preferredTechnologies: {
            framework: 'React',
            language: 'TypeScript',
            styling: 'Tailwind CSS',
          },
        },
      },
    });
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
      message: 'Aucune préférence définie pour le type game',
    });
  });

  it('should get all development preferences when no project type specified', async () => {
    // Set multiple preferences
    const gameParams = {
      projectType: 'game' as const,
      preferredTechnologies: {
        framework: 'PixiJS',
      },
    };

    const webParams = {
      projectType: 'website' as const,
      preferredTechnologies: {
        framework: 'React',
        styling: 'Tailwind CSS',
      },
    };

    await setDevelopmentPreferencesTool.execute(gameParams, mockContext);
    await setDevelopmentPreferencesTool.execute(webParams, mockContext);

    // Get all preferences
    const result = await getDevelopmentPreferencesTool.execute({}, mockContext);

    expect(result).toEqual({
      success: true,
      preferences: {
        game: {
          preferredTechnologies: {
            framework: 'PixiJS',
          },
        },
        website: {
          preferredTechnologies: {
            framework: 'React',
            styling: 'Tailwind CSS',
          },
        },
      },
    });
  });
});
