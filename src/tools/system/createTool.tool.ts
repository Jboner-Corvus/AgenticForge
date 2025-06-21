// --- Fichier : src/tools/system/createTool.tool.ts ---
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';

const TOOLS_DIR = path.resolve(process.cwd(), 'src/tools');

const TOOL_TEMPLATE = `
/**
 * Outil généré par l'agent : %s
 * Description : %s
 */
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
    .regex(/^[a-z0-9-]+$/)
    .describe(
      "Le nom de l'outil (ex: 'get-weather', 'convert-currency'). Doit être en kebab-case.",
    ),
  description: z
    .string()
    .describe("Description détaillée de ce que fait l'outil."),
  parameters_schema: z
    .string()
    .describe(
      "Le schéma Zod pour les paramètres, sous forme de chaîne de caractères (ex: `{ city: z.string().describe('The city') }`).",
    ),
  execute_function: z
    .string()
    .describe(
      "Le code TypeScript pour la fonction 'execute', sous forme de chaîne de caractères (ex: `async (args, ctx) => { ... }`).",
    ),
});

export const createToolTool: Tool<typeof createToolParams> = {
  name: 'system_createTool',
  description:
    "Writes a new tool file to the server's source code. After using this, you MUST call system_restartServer to load the new tool.",
  parameters: createToolParams,
  execute: async (args, ctx: Ctx) => {
    const { tool_name, description, parameters_schema, execute_function } =
      args;
    const toolVarName = toCamelCase(tool_name);
    const toolFileName = `${toolVarName}.tool.ts`;
    const toolFilePath = path.join(TOOLS_DIR, 'generated', toolFileName);

    try {
      ctx.log.warn(
        'AGENT IS CREATING A NEW TOOL. THIS IS A HIGH-RISK OPERATION.',
        { tool: args },
      );

      const toolFileContent = TOOL_TEMPLATE.trim().replace(
        /%s/g,
        (match, offset, string) => {
          // Un peu de logique pour remplacer correctement
          if (string.includes("Outil généré par l'agent")) return tool_name;
          if (string.includes('Description :')) return description;
          if (string.includes('z.object(%s)')) return parameters_schema;
          if (string.includes('execute: %s')) return execute_function;
          return toolVarName;
        },
      );

      await fs.mkdir(path.dirname(toolFilePath), { recursive: true });
      await fs.writeFile(toolFilePath, toolFileContent, 'utf-8');

      const indexFilePath = path.join(TOOLS_DIR, 'index.ts');
      const newExportLine = `import { ${toolVarName}Tool } from './generated/${toolFileName.replace('.ts', '.js')}';`;

      let indexFileContent = await fs.readFile(indexFilePath, 'utf-8');

      if (!indexFileContent.includes(newExportLine)) {
        indexFileContent = `${newExportLine}\n${indexFileContent}`;
        indexFileContent = indexFileContent.replace(
          'export const allTools = [',
          `export const allTools = [\n  ${toolVarName}Tool,`,
        );
        await fs.writeFile(indexFilePath, indexFileContent, 'utf-8');
      }

      const successMessage = `Successfully created new tool '${tool_name}' and updated the index. Please use 'system_restartServer' to load it.`;
      ctx.log.warn(successMessage);
      return successMessage;
    } catch (error) {
      const errorMessage = `Failed to create new tool: ${(error as Error).message}`;
      ctx.log.error(errorMessage, {
        err: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
      });
      return `Error: ${errorMessage}`;
    }
  },
};
