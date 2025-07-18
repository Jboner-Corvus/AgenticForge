import { promises as fs } from 'fs';
import path from 'path';
// src/tools/system/createTool.tool.ts
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { getErrDetails } from '../../utils/errorUtils.js';
import {
  runQualityGate,
  runToolTestsInSandbox,
} from '../../utils/qualityGate.js';

export const parameters = z.object({
  description: z.string().describe("Description de l'outil."),
  execute_function: z
    .string()
    .describe("Code TypeScript pour la fonction 'execute'."),
  parameters: z.string().describe('Schéma Zod pour les paramètres.'),
  tool_name: z
    .string()
    .regex(/^[a-z0-9-]+/)
    .describe("Nom de l'outil (kebab-case)."),
});

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

export const createToolTool: Tool<typeof parameters> = {
  description: "Écrit un nouveau fichier d'outil.",
  execute: async (args, ctx: Ctx) => {
    const { description, execute_function, parameters, tool_name } = args;
    const toolVarName = toCamelCase(tool_name);
    const toolFileName = `${toolVarName}.tool.ts`;
    const toolFilePath = path.join(GENERATED_TOOLS_DIR, toolFileName);

    try {
      ctx.log.warn('AGENT IS CREATING A NEW TOOL.', { tool: tool_name });

      const toolFileContent = TOOL_TEMPLATE.replace(/%s/g, (match) => {
        if (match === '%sParams') return `${toolVarName}Params`;
        if (match === '%sTool') return `${toolVarName}Tool`;
        if (match === 'z.object(%s)') return `z.object(${parameters})`;
        if (match === 'execute: %s') return `execute: ${execute_function}`;
        if (match.includes("Description de l'outil")) return description;
        return tool_name;
      });

      await fs.mkdir(GENERATED_TOOLS_DIR, { recursive: true });
      await fs.writeFile(toolFilePath, toolFileContent, 'utf-8');
      let output = `Nouveau fichier d'outil '${toolFileName}' créé.\n`;

      ctx.log.info('Lancement du Quality Gate...');
      const qualityResult = await runQualityGate();
      output += `\n${qualityResult.output}`;

      if (!qualityResult.success) {
        return { erreur: `Le Quality Gate a échoué: ${qualityResult.output}` };
      }

      ctx.log.info('Lancement du test du nouvel outil...');
      const testResult = await runToolTestsInSandbox(toolFilePath);
      output += `\n${testResult.output}`;

      if (!testResult.success) {
        return {
          erreur: `Le test du nouvel outil a échoué: ${testResult.output}`,
        };
      }

      const successMessage = `Outil '${tool_name}' créé et validé.`;
      ctx.log.warn(successMessage);
      return `${output}\n\n${successMessage}`;
    } catch (error) {
      const errorMessage = `Échec de la création de l'outil: ${(error as Error).message}`;
      const errDetails = getErrDetails(error);
      ctx.log.error(errorMessage, {
        message: errDetails.message,
        name: errDetails.name,
        stack: errDetails.stack,
      });
      return { erreur: errorMessage };
    }
  },
  name: 'system_createTool',
  parameters,
};
