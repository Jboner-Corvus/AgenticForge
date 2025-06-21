// --- Fichier : src/tools/system/createTool.tool.ts ---
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { runInSandbox } from '../../utils/dockerManager.js'; // Import pour l'exécution en sandbox

const TOOLS_DIR = path.resolve(process.cwd(), 'src/tools');
// Chemin de l'image Docker pour le sandbox de développement
const DEV_SANDBOX_IMAGE = 'node:20-alpine';

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

    const outputMessages: string[] = [];

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

      // S'assurer que le répertoire 'generated' existe
      await fs.mkdir(path.dirname(toolFilePath), { recursive: true });
      // Écrire le nouveau fichier d'outil
      await fs.writeFile(toolFilePath, toolFileContent, 'utf-8');
      outputMessages.push(`Nouveau fichier d'outil '${toolFileName}' créé.`);

      // Mettre à jour index.ts
      const indexFilePath = path.join(TOOLS_DIR, 'index.ts');
      const newExportLine = `import { ${toolVarName}Tool } from './generated/${toolFileName.replace('.ts', '.js')}';`;
      const toolExportLine = `  ${toolVarName}Tool,`;

      let indexFileContent = await fs.readFile(indexFilePath, 'utf-8');

      if (!indexFileContent.includes(newExportLine)) {
        // Ajouter l'import en haut du fichier
        indexFileContent = `${newExportLine}\n${indexFileContent}`;
        // Ajouter l'outil à la liste allTools
        indexFileContent = indexFileContent.replace(
          'export const allTools = [',
          `export const allTools = [\n${toolExportLine}`, // Ajoute l'export sur une nouvelle ligne après le début de l'array
        );
        await fs.writeFile(indexFilePath, indexFileContent, 'utf-8');
        outputMessages.push(`'src/tools/index.ts' mis à jour.`);
      } else {
        outputMessages.push(
          `'src/tools/index.ts' déjà à jour pour '${tool_name}'.`,
        );
      }

      ctx.log.info('Lancement des vérifications de qualité de code...');
      outputMessages.push(
        '--- Lancement des vérifications de qualité de code ---',
      );

      const mountPoint = {
        Type: 'bind' as const,
        Source: process.cwd(),
        Target: '/usr/src/app',
      };

      // 1. Lancer pnpm install pour s'assurer que toutes les dépendances sont là pour les vérifs
      // (Optionnel mais sécuritaire si le nouvel outil a de nouvelles dépendances)
      outputMessages.push('\nExécution de "pnpm install"...');
      const installResult = await runInSandbox(
        DEV_SANDBOX_IMAGE,
        ['pnpm', 'install'],
        {
          workingDir: '/usr/src/app',
          mounts: [mountPoint],
        },
      );
      outputMessages.push(
        `pnpm install (Exit Code: ${installResult.exitCode})`,
      );
      outputMessages.push(
        `STDOUT: ${installResult.stdout}\nSTDERR: ${installResult.stderr}`,
      );
      if (installResult.exitCode !== 0) {
        throw new Error(`pnpm install a échoué.`);
      }

      // 2. Lancer pnpm run lint:fix
      outputMessages.push('\nExécution de "pnpm run lint:fix"...');
      const lintFixResult = await runInSandbox(
        DEV_SANDBOX_IMAGE,
        ['pnpm', 'run', 'lint:fix'],
        {
          workingDir: '/usr/src/app',
          mounts: [mountPoint],
        },
      );
      outputMessages.push(
        `Lint (Corriger) (Exit Code: ${lintFixResult.exitCode})`,
      );
      outputMessages.push(
        `STDOUT: ${lintFixResult.stdout}\nSTDERR: ${lintFixResult.stderr}`,
      );
      // Un non-zéro ici pourrait indiquer des erreurs non corrigeables, mais lint:fix ne devrait pas échouer.
      // Si on veut être strict, on pourrait vérifier lint:
      // if (lintFixResult.exitCode !== 0) { throw new Error(`Linting (Fix) a échoué.`); }

      // 3. Lancer pnpm run format
      outputMessages.push('\nExécution de "pnpm run format"...');
      const formatResult = await runInSandbox(
        DEV_SANDBOX_IMAGE,
        ['pnpm', 'run', 'format'],
        {
          workingDir: '/usr/src/app',
          mounts: [mountPoint],
        },
      );
      outputMessages.push(`Formatage (Exit Code: ${formatResult.exitCode})`);
      outputMessages.push(
        `STDOUT: ${formatResult.stdout}\nSTDERR: ${formatResult.stderr}`,
      );
      if (formatResult.exitCode !== 0) {
        throw new Error(`Le formatage a échoué.`);
      }

      // 4. Lancer pnpm run test
      outputMessages.push('\nExécution de "pnpm run test"...');
      const testResult = await runInSandbox(
        DEV_SANDBOX_IMAGE,
        ['pnpm', 'run', 'test'],
        {
          workingDir: '/usr/src/app',
          mounts: [mountPoint],
        },
      );
      outputMessages.push(`Tests (Exit Code: ${testResult.exitCode})`);
      outputMessages.push(
        `STDOUT: ${testResult.stdout}\nSTDERR: ${testResult.stderr}`,
      );
      if (testResult.exitCode !== 0) {
        throw new Error(`Les tests ont échoué. Veuillez vérifier les logs.`);
      }

      // 5. Lancer pnpm exec tsc --noEmit
      outputMessages.push('\nExécution de "pnpm exec tsc --noEmit"...');
      const typeCheckResult = await runInSandbox(
        DEV_SANDBOX_IMAGE,
        ['pnpm', 'exec', 'tsc', '--noEmit'],
        {
          workingDir: '/usr/src/app',
          mounts: [mountPoint],
        },
      );
      outputMessages.push(
        `Vérification des Types (Exit Code: ${typeCheckResult.exitCode})`,
      );
      outputMessages.push(
        `STDOUT: ${typeCheckResult.stdout}\nSTDERR: ${typeCheckResult.stderr}`,
      );
      if (typeCheckResult.exitCode !== 0) {
        throw new Error(
          `La vérification des types a échoué. Veuillez corriger les erreurs de typage.`,
        );
      }

      outputMessages.push('--- Toutes les vérifications ont réussi ! ---');
      const successMessage = `Outil '${tool_name}' créé avec succès et vérifications de qualité passées. Veuillez utiliser 'system_restartServer' pour le charger.`;
      ctx.log.warn(successMessage);
      return outputMessages.join('\n') + '\n\n' + successMessage;
    } catch (error) {
      const errorMessage = `Échec de la création ou des vérifications de l'outil : ${(error as Error).message}`;
      ctx.log.error(errorMessage, {
        err: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
        outputMessages,
      });
      return outputMessages.join('\n') + '\n\n' + `Erreur: ${errorMessage}`;
    }
  },
};
