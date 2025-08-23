import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getErrDetails
} from "./chunk-E73UG3QD.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/createTool.tool.ts
init_esm_shims();
import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { z } from "zod";
var execAsync = promisify(exec);
var parameters = z.object({
  description: z.string().describe("Description de l'outil."),
  execute_function: z.string().describe("Corps de la fonction 'execute' (ex: 'return someValue;')."),
  parameters: z.string().describe("Sch\xE9ma Zod pour les param\xE8tres."),
  run_checks: z.boolean().optional().describe(
    "Lancer automatiquement small-checks apr\xE8s cr\xE9ation (d\xE9faut: false)"
  ),
  tool_name: z.string().regex(/^[a-z0-9-]+/).describe("Nom de l'outil (kebab-case).")
});
var GENERATED_TOOLS_DIR = path.resolve(
  process.cwd(),
  "packages/core/dist/tools/generated"
);
var TOOL_TEMPLATE = `
// \u{1F916} OUTIL G\xC9N\xC9R\xC9 AUTOMATIQUEMENT par l'agent AgenticForge
// \u{1F3AF} Outil: {{tool_name}}
// \u{1F4C1} Localisation: dist/tools/generated/ (outils runtime g\xE9n\xE9r\xE9s)
// \u{1F504} Distinction: outils natifs dans src/ vs outils g\xE9n\xE9r\xE9s dans dist/
import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.ts';


export const {{toolVarName}}Params = z.object({{{parameters}}});

export const {{toolVarName}}Tool: Tool<typeof {{toolVarName}}Params> = {
  name: '{{tool_name}}',
  description: '\u{1F916} [OUTIL G\xC9N\xC9R\xC9] {{description}}',
  parameters: {{toolVarName}}Params,
  execute: async (args, ctx: Ctx) => {
    {{{execute_function}}}
  },
};
`;
var TEST_TEMPLATE = `
// \u{1F9EA} TEST G\xC9N\xC9R\xC9 AUTOMATIQUEMENT pour l'outil : {{tool_name}}
// \u{1F4C1} Outil g\xE9n\xE9r\xE9 dans: dist/tools/generated/
// \u{1F3AF} Tests pour outils runtime (vs outils natifs dans src/)
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
    // TODO: Ajouter des param\xE8tres de test appropri\xE9s bas\xE9s sur le sch\xE9ma Zod
    const testArgs = {}; // \xC0 adapter selon les param\xE8tres d\xE9finis
    
    const result = await {{toolVarName}}Tool.execute(testArgs, mockCtx);
    
    // TODO: Ajouter des assertions sp\xE9cifiques au comportement attendu
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Test avec des param\xE8tres invalides ou des conditions d'erreur
    const invalidArgs = {}; // \xC0 adapter selon les cas d'erreur possibles
    
    try {
      await {{toolVarName}}Tool.execute(invalidArgs, mockCtx);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
`;
var toCamelCase = (str) => str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
var createToolTool = {
  description: "Cr\xE9e un outil MCP g\xE9n\xE9r\xE9 dans dist/tools/generated/ (distingu\xE9 des outils natifs dans src/). G\xE9n\xE8re du TypeScript + Zod + tests. Environnement: TypeScript/pnpm/MCP.",
  execute: async (args, ctx) => {
    const {
      description,
      execute_function,
      parameters: parameters2,
      run_checks = false,
      tool_name
    } = args;
    const toolVarName = toCamelCase(tool_name);
    const toolFileName = `${toolVarName}.tool.ts`;
    const toolFilePath = path.join(GENERATED_TOOLS_DIR, toolFileName);
    try {
      ctx.log.warn("AGENT IS CREATING A NEW TOOL.", { tool: tool_name });
      const toolFileContent = TOOL_TEMPLATE.replace("{{tool_name}}", tool_name).replace("{{toolVarName}}Params", `${toolVarName}Params`).replace("{{{parameters}}}", parameters2).replace("{{toolVarName}}Tool", `${toolVarName}Tool`).replace("{{toolVarName}}Params", `${toolVarName}Params`).replace("{{tool_name}}", tool_name).replace("{{description}}", description).replace("{{toolVarName}}Params", `${toolVarName}Params`).replace("{{{execute_function}}}", execute_function);
      await fs.mkdir(GENERATED_TOOLS_DIR, { recursive: true });
      await fs.writeFile(toolFilePath, toolFileContent, "utf-8");
      const testFileName = `${toolVarName}.tool.test.ts`;
      const testFilePath = path.join(GENERATED_TOOLS_DIR, testFileName);
      const testFileContent = TEST_TEMPLATE.replace(
        /\{\{tool_name\}\}/g,
        tool_name
      ).replace(/\{\{toolVarName\}\}/g, toolVarName).replace(/\{\{toolFileName\}\}/g, toolFileName.replace(".ts", "")).replace(/\{\{description\}\}/g, description);
      await fs.writeFile(testFilePath, testFileContent, "utf-8");
      const jsFilePath = toolFilePath.replace(".ts", ".ts");
      const jsContent = toolFileContent.replace(/import.*from.*\.ts';/g, "").replace("export const", "const").replace(/: Tool<.*>/g, "") + "\nexport { " + toolVarName + "Tool };";
      await fs.writeFile(jsFilePath, jsContent, "utf-8");
      let output = `Outil MCP TypeScript '${toolFileName}' cr\xE9\xE9 avec succ\xE8s!
Test unitaire '${testFileName}' g\xE9n\xE9r\xE9 automatiquement.
`;
      let successMessage = `Outil '${tool_name}' g\xE9n\xE9r\xE9 avec sch\xE9mas Zod + tests unitaires.`;
      if (run_checks) {
        try {
          ctx.log.info("Lancement automatique des small-checks...");
          const { stderr, stdout } = await execAsync("./run.sh small-checks", {
            cwd: process.cwd(),
            timeout: 6e4
            // 1 minute timeout
          });
          output += "\n=== R\xE9sultat des small-checks ===\n" + stdout;
          if (stderr) {
            output += "\nErreurs d\xE9tect\xE9es:\n" + stderr;
          }
          successMessage += " Small-checks ex\xE9cut\xE9s automatiquement.";
        } catch (error) {
          const err = error;
          output += "\n=== Erreur lors des small-checks ===\n" + (err.stdout || "") + (err.stderr || err.message);
          successMessage += " ATTENTION: Small-checks ont \xE9chou\xE9 - voir d\xE9tails ci-dessus.";
        }
      } else {
        successMessage += " \u{1F3AF} Outil cr\xE9\xE9 dans dist/tools/generated/ (outils g\xE9n\xE9r\xE9s vs natifs dans src/). Red\xE9marrez le worker pour activation imm\xE9diate. Lancez './run.sh small-checks' pour v\xE9rifier.";
      }
      ctx.log.warn(successMessage);
      return `${output}

${successMessage}`;
    } catch (error) {
      const errorMessage = `\xC9chec de la cr\xE9ation de l'outil: ${error.message}`;
      const errDetails = getErrDetails(error);
      ctx.log.error(errorMessage, {
        message: errDetails.message,
        name: errDetails.name,
        stack: errDetails.stack
      });
      return { erreur: errorMessage };
    }
  },
  name: "system_createTool",
  parameters
};

export {
  parameters,
  createToolTool
};
