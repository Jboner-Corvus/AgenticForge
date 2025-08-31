import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const DevelopmentPreferencesParams: z.ZodObject<{
    /**
     * Type de projet
     */
    projectType: z.ZodEnum<["game", "website", "webapp", "mobile_app", "desktop_app", "library", "api", "cli_tool"]>;
    /**
     * Technologies préférées
     */
    preferredTechnologies: z.ZodOptional<z.ZodObject<{
        framework: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodString>;
        styling: z.ZodOptional<z.ZodString>;
        buildTool: z.ZodOptional<z.ZodString>;
        additionalLibraries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        framework?: string | undefined;
        language?: string | undefined;
        styling?: string | undefined;
        buildTool?: string | undefined;
        additionalLibraries?: string[] | undefined;
    }, {
        framework?: string | undefined;
        language?: string | undefined;
        styling?: string | undefined;
        buildTool?: string | undefined;
        additionalLibraries?: string[] | undefined;
    }>>;
    /**
     * Instructions spécifiques
     */
    instructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    projectType: "game" | "website" | "webapp" | "mobile_app" | "desktop_app" | "library" | "api" | "cli_tool";
    preferredTechnologies?: {
        framework?: string | undefined;
        language?: string | undefined;
        styling?: string | undefined;
        buildTool?: string | undefined;
        additionalLibraries?: string[] | undefined;
    } | undefined;
    instructions?: string | undefined;
}, {
    projectType: "game" | "website" | "webapp" | "mobile_app" | "desktop_app" | "library" | "api" | "cli_tool";
    preferredTechnologies?: {
        framework?: string | undefined;
        language?: string | undefined;
        styling?: string | undefined;
        buildTool?: string | undefined;
        additionalLibraries?: string[] | undefined;
    } | undefined;
    instructions?: string | undefined;
}>;
declare const setDevelopmentPreferencesTool: Tool<typeof DevelopmentPreferencesParams>;

export { setDevelopmentPreferencesTool };
