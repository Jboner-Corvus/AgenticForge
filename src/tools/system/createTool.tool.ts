// src/tools/system/createTool.tool.ts
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { runQualityGate } from '../../utils/qualityGate.js';
import { getErrDetails } from '../../utils/errorUtils.js';

const GENERATED_TOOLS_DIR = path.resolve(process.cwd(), 'src/tools/generated');

const TOOL_TEMPLATE = `
// Outil généré par l'agent : %s
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';

export const %sParams = z.object(%s);

export const %sTool: Tool<typeof %sParams> = {
  name: '%s',
  description: '%s',
  parameters: %sParams,
  execute: %s,
};
`;

const toCamelCase = (str: string) =>
  str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());

export const createToolParams = z.object({
  tool_name: z
    .string()
    .regex(/^[a-z0-9-]+/)
    .describe("Nom de l'outil (kebab-case)."),
  description: z.string().describe("Description de l'outil."),
  parameters_schema: z.string().describe('Schéma Zod pour les paramètres.'),
  execute_function: z
    .string()
    .describe("Code TypeScript pour la fonction 'execute'."),
});

export const createToolTool: Tool<typeof createToolParams> = {
  name: 'system_createTool',
  description:
    "Écrit un nouveau fichier d'outil. DOIT être suivi par 'system_restartServer' pour le charger.",
  parameters: createToolParams,
  execute: async (args, ctx: Ctx) => {
    // CORRECTION LINT: 'description' est maintenant utilisé dans le template.
    const { tool_name, description, parameters_schema, execute_function } =
      args;
    const toolVarName = toCamelCase(tool_name);
    const toolFileName = `${toolVarName}.tool.ts`;
    const toolFilePath = path.join(GENERATED_TOOLS_DIR, toolFileName);

    try {
      ctx.log.warn('AGENT IS CREATING A NEW TOOL.', { tool: tool_name });

      // Remplacement plus simple et direct
      const toolFileContent = TOOL_TEMPLATE.replace(/%s/g, tool_name) // Nom de l'outil
        .replace(/%s/g, description) // Description
        .replace(/%sParams/g, `${toolVarName}Params`)
        .replace(/%sTool/g, `${toolVarName}Tool`)
        .replace('z.object(%s)', `z.object(${parameters_schema})`)
        .replace('execute: %s', `execute: ${execute_function}`);

      await fs.mkdir(GENERATED_TOOLS_DIR, { recursive: true });
      await fs.writeFile(toolFilePath, toolFileContent, 'utf-8');
      let output = `Nouveau fichier d'outil '${toolFileName}' créé.\n`;

      ctx.log.info('Lancement du Quality Gate...');
      const qualityResult = await runQualityGate();
      output += `\n${qualityResult.output}`;

      if (!qualityResult.success) {
        throw new Error('Le Quality Gate a échoué.');
      }

      const successMessage = `Outil '${tool_name}' créé et validé. Utilisez 'system_restartServer'.`;
      ctx.log.warn(successMessage);
      return `${output}\n\n${successMessage}`;
    } catch (error) {
      const errorMessage = `Échec de la création de l'outil: ${(error as Error).message}`;
      // CORRECTION APPLIQUÉE : On passe l'objet d'erreur directement.
      ctx.log.error(errorMessage, getErrDetails(error));
      return `Erreur: ${errorMessage}`;
    }
  },
};
