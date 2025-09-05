import { z } from 'zod';
import { Tool } from '../../../../types.ts';

// Define the structure for development preferences
interface DevelopmentPreferences {
  [projectType: string]: {
    preferredTechnologies?: {
      framework?: string;
      language?: string;
      styling?: string;
      buildTool?: string;
      additionalLibraries?: string[];
    };
    instructions?: string;
    updatedAt?: number;
  };
}

const GetDevelopmentPreferencesParams = z.object({
  /**
   * Type de projet (optionnel - si non spécifié, retourne toutes les préférences)
   */
  projectType: z
    .enum([
      'game',
      'website',
      'webapp',
      'mobile_app',
      'desktop_app',
      'library',
      'api',
      'cli_tool',
    ])
    .optional(),
});

export const getDevelopmentPreferencesTool: Tool<
  typeof GetDevelopmentPreferencesParams
> = {
  description:
    'Récupère les préférences de développement définies pour différents types de projets.',
  execute: async (params, context) => {
    const { session, log } = context;
    const parsedParams = GetDevelopmentPreferencesParams.parse(params);
    const { projectType } = parsedParams;

    try {
      // Récupérer les préférences depuis la session
      if (session?.metadata?.developmentPreferences) {
        const preferences = session.metadata
          .developmentPreferences as DevelopmentPreferences;

        if (projectType) {
          // Retourner les préférences pour un type spécifique
          const specificPreferences = preferences[projectType];
          if (specificPreferences) {
            return {
              success: true,
              preferences: {
                [projectType]: specificPreferences,
              },
            };
          } else {
            return {
              success: true,
              message: `Aucune préférence définie pour le type ${projectType}`,
            };
          }
        } else {
          // Retourner toutes les préférences
          return {
            success: true,
            preferences,
          };
        }
      } else {
        return {
          success: true,
          message: 'Aucune préférence de développement définie',
        };
      }
    } catch (error) {
      log.error({ err: error }, 'Error getting development preferences');
      throw new Error(
        `Failed to get development preferences: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
  name: 'get_development_preferences',
  parameters: GetDevelopmentPreferencesParams,
};
