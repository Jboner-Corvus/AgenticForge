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

const DevelopmentPreferencesParams = z.object({
  /**
   * Type de projet
   */
  projectType: z.enum(
    [
      'game',
      'website',
      'webapp',
      'mobile_app',
      'desktop_app',
      'library',
      'api',
      'cli_tool',
    ],
    {
      description: 'Type de projet à développer',
    },
  ),

  /**
   * Technologies préférées
   */
  preferredTechnologies: z
    .object({
      framework: z.string().optional(),
      language: z.string().optional(),
      styling: z.string().optional(),
      buildTool: z.string().optional(),
      additionalLibraries: z.array(z.string()).optional(),
    })
    .optional(),

  /**
   * Instructions spécifiques
   */
  instructions: z.string().optional(),
});

export const setDevelopmentPreferencesTool: Tool<
  typeof DevelopmentPreferencesParams
> = {
  description:
    'Définit les préférences de développement pour différents types de projets. Permet de spécifier les frameworks, langages et outils préférés.',
  execute: async (params, context) => {
    const { session, log } = context;
    const parsedParams = DevelopmentPreferencesParams.parse(params);
    const { projectType, preferredTechnologies, instructions } = parsedParams;

    try {
      // Stocker les préférences dans la session
      if (session) {
        if (!session.metadata) {
          session.metadata = {};
        }

        if (!session.metadata.developmentPreferences) {
          session.metadata.developmentPreferences = {};
        }

        const developmentPreferences = session.metadata
          .developmentPreferences as DevelopmentPreferences;
        developmentPreferences[projectType] = {
          preferredTechnologies,
          instructions,
          updatedAt: Date.now(),
        };

        log.info(`Development preferences set for ${projectType}`, {
          projectType,
          preferredTechnologies,
          instructions,
        });
      }

      return {
        success: true,
        message: `Préférences de développement enregistrées pour les projets de type ${projectType}`,
      };
    } catch (error) {
      log.error({ err: error }, 'Error setting development preferences');
      throw new Error(
        `Failed to set development preferences: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
  name: 'set_development_preferences',
  parameters: DevelopmentPreferencesParams,
};
