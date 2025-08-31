import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/getDevelopmentPreferences.tool.ts
init_esm_shims();
import { z } from "zod";
var GetDevelopmentPreferencesParams = z.object({
  /**
   * Type de projet (optionnel - si non spécifié, retourne toutes les préférences)
   */
  projectType: z.enum([
    "game",
    "website",
    "webapp",
    "mobile_app",
    "desktop_app",
    "library",
    "api",
    "cli_tool"
  ]).optional()
});
var getDevelopmentPreferencesTool = {
  description: "R\xE9cup\xE8re les pr\xE9f\xE9rences de d\xE9veloppement d\xE9finies pour diff\xE9rents types de projets.",
  execute: async (params, context) => {
    const { session, log } = context;
    const parsedParams = GetDevelopmentPreferencesParams.parse(params);
    const { projectType } = parsedParams;
    try {
      if (session?.metadata?.developmentPreferences) {
        const preferences = session.metadata.developmentPreferences;
        if (projectType) {
          const specificPreferences = preferences[projectType];
          if (specificPreferences) {
            return {
              success: true,
              preferences: {
                [projectType]: specificPreferences
              }
            };
          } else {
            return {
              success: true,
              message: `Aucune pr\xE9f\xE9rence d\xE9finie pour le type ${projectType}`
            };
          }
        } else {
          return {
            success: true,
            preferences
          };
        }
      } else {
        return {
          success: true,
          message: "Aucune pr\xE9f\xE9rence de d\xE9veloppement d\xE9finie"
        };
      }
    } catch (error) {
      log.error({ err: error }, "Error getting development preferences");
      throw new Error(
        `Failed to get development preferences: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  name: "get_development_preferences",
  parameters: GetDevelopmentPreferencesParams
};

export {
  getDevelopmentPreferencesTool
};
