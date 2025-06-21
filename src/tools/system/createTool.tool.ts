/**
 * src/tools/system/createTool.tool.ts
 *
 * Outil Prométhéen : Permet à l'agent de créer de nouveaux outils pour lui-même.
 *
 * ATTENTION : Cet outil est le summum de la liberté et du danger.
 * Il écrit du code exécutable directement dans le code source du serveur.
 * Il n'y a aucune sandbox ici.
 */
import { z } from 'zod';
import type { Tool, Ctx } from '@fastmcp/fastmcp';
import { promises as fs } from 'fs';
import path from 'path';

// Le chemin vers le répertoire où les outils sont stockés.
const TOOLS_DIR = path.resolve(process.cwd(), 'src/tools');

// Un template de code pour un nouveau fichier d'outil.
// L'agent devra fournir les parties variables.
const TOOL_TEMPLATE = `
/**
 * Outil généré par l'agent : %s
 * Description : %s
 */
import { z } from 'zod';
import type { Tool, Ctx } from '@fastmcp/fastmcp';
// L'agent peut ajouter des imports ici s'il est assez intelligent
// import ...

export const %sParams = z.object(%s);

export const %sTool: Tool<typeof %sParams> = {
  name: '%s',
  description: '%s',
  parameters: %sParams,
  execute: %s,
};
`;

// Helper pour convertir un nom d'outil (ex: 'my-tool') en nom de variable (ex: 'myTool')
const toCamelCase = (str: string) => str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());

export const createToolParams = z.object({
  tool_name: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .describe(
      "Le nom de l'outil (ex: 'get-weather', 'convert-currency'). Doit être en kebab-case."
    ),
  description: z.string().describe("Description détaillée de ce que fait l'outil."),
  parameters_schema: z
    .string()
    .describe(
      "Le schéma Zod pour les paramètres, sous forme de chaîne de caractères (ex: `{ city: z.string().describe('The city') }`)."
    ),
  execute_function: z
    .string()
    .describe(
      "Le code TypeScript pour la fonction 'execute', sous forme de chaîne de caractères (ex: `async (args, ctx) => { ... }`)."
    ),
});

export const createToolTool: Tool<typeof createToolParams> = {
  name: 'system_createTool',
  description:
    "Writes a new tool file to the server's source code. After using this, you MUST call system_restartServer to load the new tool.",
  parameters: createToolParams,
  execute: async (args, ctx: Ctx) => {
    const { tool_name, description, parameters_schema, execute_function } = args;
    const toolVarName = toCamelCase(tool_name);
    const toolFileName = `${toolVarName}.tool.ts`;
    const toolFilePath = path.join(TOOLS_DIR, 'generated', toolFileName); // On les met dans un sous-dossier pour l'organisation

    try {
      ctx.log.warn({ tool: args }, 'AGENT IS CREATING A NEW TOOL. THIS IS A HIGH-RISK OPERATION.');

      // Formate le contenu du fichier de l'outil en utilisant le template.
      const toolFileContent = TOOL_TEMPLATE.trim()
        .replace('%s', tool_name)
        .replace('%s', description)
        .replace(/%s/g, toolVarName) // remplace toutes les occurrences
        .replace('%s', parameters_schema)
        .replace('%s', execute_function);

      // Crée le répertoire 'generated' s'il n'existe pas
      await fs.mkdir(path.dirname(toolFilePath), { recursive: true });

      // Écrit le nouveau fichier d'outil.
      await fs.writeFile(toolFilePath, toolFileContent, 'utf-8');

      // Met à jour le fichier d'index pour inclure le nouvel outil.
      // C'est l'étape la plus complexe et la plus fragile.
      const indexFilePath = path.join(TOOLS_DIR, 'index.ts');
      const newExportLine = `import { ${toolVarName}Tool } from './generated/${toolFileName}.js';`;

      let indexFileContent = await fs.readFile(indexFilePath, 'utf-8');

      // Ajoute l'import
      indexFileContent = `${newExportLine}\n${indexFileContent}`;

      // Ajoute le nom de l'outil au tableau `allTools`
      indexFileContent = indexFileContent.replace(
        'export const allTools = [',
        `export const allTools = [\n  ${toolVarName}Tool,`
      );

      await fs.writeFile(indexFilePath, indexFileContent, 'utf-8');

      const successMessage = `Successfully created new tool '${tool_name}' and updated the index. Please use 'system_restartServer' to load it.`;
      ctx.log.warn(successMessage);
      return successMessage;
    } catch (error) {
      const errorMessage = `Failed to create new tool: ${(error as Error).message}`;
      ctx.log.error({ err: error }, errorMessage);
      return `Error: ${errorMessage}`;
    }
  },
};
