import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
// src/tools/system/createTool.tool.ts
import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.ts';

import { getErrDetails } from '../../../../utils/errorUtils.ts';
import { runQualityGate } from '../../../../utils/qualityGate.ts';

const execAsync = promisify(exec);

export const parameters = z.object({
  description: z.string().describe("Description de l'outil."),
  execute_function: z
    .string()
    .describe("Corps de la fonction 'execute' (ex: 'return someValue;')."),
  parameters: z.string().describe('Schéma Zod pour les paramètres.'),
  tool_name: z
    .string()
    .regex(/^[a-z0-9-]+/)
    .describe("Nom de l'outil (kebab-case)."),
  run_checks: z.boolean().optional().describe("Lancer automatiquement small-checks après création (défaut: false)"),
});

// Les outils générés vont TOUJOURS dans dist/ pour les distinguer des outils natifs
const GENERATED_TOOLS_DIR = path.resolve(process.cwd(), 'packages/core/dist/tools/generated');

const TOOL_TEMPLATE = `
// 🤖 OUTIL GÉNÉRÉ AUTOMATIQUEMENT par l'agent AgenticForge
// 🎯 Outil: {{tool_name}}
// 📁 Localisation: dist/tools/generated/ (outils runtime générés)
// 🔄 Distinction: outils natifs dans src/ vs outils générés dans dist/
import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.ts';


export const {{toolVarName}}Params = z.object({{{parameters}}});

export const {{toolVarName}}Tool: Tool<typeof {{toolVarName}}Params> = {
  name: '{{tool_name}}',
  description: '🤖 [OUTIL GÉNÉRÉ] {{description}}',
  parameters: {{toolVarName}}Params,
  execute: async (args, ctx: Ctx) => {
    {{{execute_function}}}
  },
};
`;

const TEST_TEMPLATE = `
// 🧪 TEST GÉNÉRÉ AUTOMATIQUEMENT pour l'outil : {{tool_name}}
// 📁 Outil généré dans: dist/tools/generated/
// 🎯 Tests pour outils runtime (vs outils natifs dans src/)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {{toolVarName}}Tool } from './{{toolFileName}}';
import type { Ctx } from '../../../../types.ts';

describe('{{toolVarName}}Tool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: { id: 'test-job', data: { prompt: 'test' }, isFailed: async () => false, name: 'test-job' },
      log: { 
        info: vi.fn(), 
        error: vi.fn(), 
        warn: vi.fn(), 
        debug: vi.fn(), 
        fatal: vi.fn(), 
        trace: vi.fn(),
        level: 'info' as any,
        silent: false,
        child: vi.fn(() => ({
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          fatal: vi.fn(),
          trace: vi.fn(),
          level: 'info' as any,
          silent: false
        }))
      } as any,
      streamContent: vi.fn(),
      reportProgress: vi.fn(),
      session: { history: [], identities: [], name: 'test-session', timestamp: Date.now() },
      taskQueue: {} as any,
      llm: { getErrorType: () => 'UNKNOWN' as any, getLlmResponse: async () => 'test' }
    };
  });

  it('should have correct name and description', () => {
    expect({{toolVarName}}Tool.name).toBe('{{tool_name}}');
    expect({{toolVarName}}Tool.description).toBe('{{description}}');
    expect({{toolVarName}}Tool.parameters).toBeDefined();
  });

  it('should execute successfully with valid parameters', async () => {
    // TODO: Ajouter des paramètres de test appropriés basés sur le schéma Zod
    const testArgs = {}; // À adapter selon les paramètres définis
    
    const result = await {{toolVarName}}Tool.execute(testArgs, mockCtx);
    
    // TODO: Ajouter des assertions spécifiques au comportement attendu
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Test avec des paramètres invalides ou des conditions d'erreur
    const invalidArgs = {}; // À adapter selon les cas d'erreur possibles
    
    try {
      await {{toolVarName}}Tool.execute(invalidArgs, mockCtx);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
`;

const toCamelCase = (str: string) =>
  str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());

export const createToolTool: Tool<typeof parameters> = {
  description: "Crée un outil MCP généré dans dist/tools/generated/ (distingué des outils natifs dans src/). Génère du TypeScript + Zod + tests. Environnement: TypeScript/pnpm/MCP.",
  execute: async (args: z.infer<typeof parameters>, ctx: Ctx) => {
    const { description, execute_function, parameters, tool_name, run_checks = false } = args;
    const toolVarName = toCamelCase(tool_name);
    const toolFileName = `${toolVarName}.tool.ts`;
    const toolFilePath = path.join(GENERATED_TOOLS_DIR, toolFileName);

    try {
      ctx.log.warn('AGENT IS CREATING A NEW TOOL.', { tool: tool_name });

      const toolFileContent = TOOL_TEMPLATE.replace('{{tool_name}}', tool_name)
        .replace('{{toolVarName}}Params', `${toolVarName}Params`)
        .replace('{{{parameters}}}', parameters)
        .replace('{{toolVarName}}Tool', `${toolVarName}Tool`)
        .replace('{{toolVarName}}Params', `${toolVarName}Params`)
        .replace('{{tool_name}}', tool_name)
        .replace('{{description}}', description)
        .replace('{{toolVarName}}Params', `${toolVarName}Params`)
        .replace('{{{execute_function}}}', execute_function);

      // Ensure the directory exists before writing the file
      await fs.mkdir(GENERATED_TOOLS_DIR, { recursive: true });
      await fs.writeFile(toolFilePath, toolFileContent, 'utf-8');
      
      // Générer automatiquement le fichier de test
      const testFileName = `${toolVarName}.tool.test.ts`;
      const testFilePath = path.join(GENERATED_TOOLS_DIR, testFileName);
      
      const testFileContent = TEST_TEMPLATE
        .replace(/\{\{tool_name\}\}/g, tool_name)
        .replace(/\{\{toolVarName\}\}/g, toolVarName)
        .replace(/\{\{toolFileName\}\}/g, toolFileName.replace('.ts', ''))
        .replace(/\{\{description\}\}/g, description);
      
      await fs.writeFile(testFilePath, testFileContent, 'utf-8');
      
      // Générer aussi la version JavaScript pour l'exécution runtime
      const jsFilePath = toolFilePath.replace('.ts', '.ts');
      const jsContent = toolFileContent
        .replace(/import.*from.*\.ts';/g, '') // Supprimer les imports TS
        .replace('export const', 'const')
        .replace(/: Tool<.*>/g, '')
        + '\nexport { ' + toolVarName + 'Tool };';
      
      await fs.writeFile(jsFilePath, jsContent, 'utf-8');
      
      let output = `Outil MCP TypeScript '${toolFileName}' créé avec succès!\nTest unitaire '${testFileName}' généré automatiquement.\n`;
      let successMessage = `Outil '${tool_name}' généré avec schémas Zod + tests unitaires.`;
      
      // Lancer automatiquement small-checks si demandé
      if (run_checks) {
        try {
          ctx.log.info('Lancement automatique des small-checks...');
          const { stdout, stderr } = await execAsync('./run.sh small-checks', { 
            cwd: process.cwd(),
            timeout: 60000 // 1 minute timeout
          });
          output += '\n=== Résultat des small-checks ===\n' + stdout;
          if (stderr) {
            output += '\nErreurs détectées:\n' + stderr;
          }
          successMessage += ' Small-checks exécutés automatiquement.';
        } catch (error) {
          const err = error as { stdout?: string; stderr?: string; message: string };
          output += '\n=== Erreur lors des small-checks ===\n' + (err.stdout || '') + (err.stderr || err.message);
          successMessage += ' ATTENTION: Small-checks ont échoué - voir détails ci-dessus.';
        }
      } else {
        successMessage += ' 🎯 Outil créé dans dist/tools/generated/ (outils générés vs natifs dans src/). Redémarrez le worker pour activation immédiate. Lancez \'./run.sh small-checks\' pour vérifier.';
      }
      
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
