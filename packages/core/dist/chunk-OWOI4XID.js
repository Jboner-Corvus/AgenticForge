import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/setDevelopmentPreferences.tool.ts
init_esm_shims();
import { z } from "zod";
var DevelopmentPreferencesParams = z.object({
  /**
   * Type de projet
   */
  projectType: z.enum(
    [
      "game",
      "website",
      "webapp",
      "mobile_app",
      "desktop_app",
      "library",
      "api",
      "cli_tool"
    ],
    {
      description: "Type de projet \xE0 d\xE9velopper"
    }
  ),
  /**
   * Technologies préférées
   */
  preferredTechnologies: z.object({
    framework: z.string().optional(),
    language: z.string().optional(),
    styling: z.string().optional(),
    buildTool: z.string().optional(),
    additionalLibraries: z.array(z.string()).optional()
  }).optional(),
  /**
   * Instructions spécifiques
   */
  instructions: z.string().optional()
});
var setDevelopmentPreferencesTool = {
  description: "D\xE9finit les pr\xE9f\xE9rences de d\xE9veloppement pour diff\xE9rents types de projets. Permet de sp\xE9cifier les frameworks, langages et outils pr\xE9f\xE9r\xE9s.",
  execute: async (params, context) => {
    const { session, log } = context;
    const parsedParams = DevelopmentPreferencesParams.parse(params);
    const { projectType, preferredTechnologies, instructions } = parsedParams;
    try {
      if (session) {
        if (!session.metadata) {
          session.metadata = {};
        }
        if (!session.metadata.developmentPreferences) {
          session.metadata.developmentPreferences = {};
        }
        const developmentPreferences = session.metadata.developmentPreferences;
        developmentPreferences[projectType] = {
          preferredTechnologies,
          instructions,
          updatedAt: Date.now()
        };
        log.info(`Development preferences set for ${projectType}`, {
          projectType,
          preferredTechnologies,
          instructions
        });
      }
      return {
        success: true,
        message: `Pr\xE9f\xE9rences de d\xE9veloppement enregistr\xE9es pour les projets de type ${projectType}`
      };
    } catch (error) {
      log.error({ err: error }, "Error setting development preferences");
      throw new Error(
        `Failed to set development preferences: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  name: "set_development_preferences",
  parameters: DevelopmentPreferencesParams
};

export {
  setDevelopmentPreferencesTool
};
