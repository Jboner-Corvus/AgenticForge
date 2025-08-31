import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const GetDevelopmentPreferencesParams: z.ZodObject<{
    /**
     * Type de projet (optionnel - si non spécifié, retourne toutes les préférences)
     */
    projectType: z.ZodOptional<z.ZodEnum<["game", "website", "webapp", "mobile_app", "desktop_app", "library", "api", "cli_tool"]>>;
}, "strip", z.ZodTypeAny, {
    projectType?: "game" | "website" | "webapp" | "mobile_app" | "desktop_app" | "library" | "api" | "cli_tool" | undefined;
}, {
    projectType?: "game" | "website" | "webapp" | "mobile_app" | "desktop_app" | "library" | "api" | "cli_tool" | undefined;
}>;
declare const getDevelopmentPreferencesTool: Tool<typeof GetDevelopmentPreferencesParams>;

export { getDevelopmentPreferencesTool };
