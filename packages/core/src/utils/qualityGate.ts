import { Queue } from 'bullmq';

import logger from '../logger.js';
import { executeShellCommandTool } from '../modules/tools/definitions/code/executeShellCommand.tool.js';
import { Ctx, ILlmProvider, SessionData } from '../types.js';

// Mock Ctx for qualityGate functions
const mockCtx: Ctx = {
  llm: {} as ILlmProvider,
  log: logger,
  reportProgress: async () => {},
  session: {} as SessionData,
  streamContent: async () => {},
  taskQueue: {} as Queue,
};

interface QualityResult {
  output: string;
  success: boolean;
}

interface SandboxResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

/**
 * Exécute une série de vérifications de qualité (types, format, lint) en exécutant des commandes shell.
 * @returns Un objet indiquant si toutes les vérifications ont réussi et la sortie combinée.
 */
export async function runQualityGate(): Promise<QualityResult> {
  const outputMessages: string[] = [];

  logger.info('Running all quality checks...');
  outputMessages.push(`--- Running Quality Gate ---`);

  let success = true;
  let combinedOutput = '';

  const commands = [
    { cmd: 'pnpm run lint:fix', name: 'Lint (Fix)' },
    { cmd: 'pnpm run format', name: 'Format' },
    { cmd: 'pnpm exec tsc --noEmit', name: 'Type Check' },
  ];

  for (const { cmd, name } of commands) {
    outputMessages.push(`
--- Running: ${name} ---`);
    const result = (await executeShellCommandTool.execute(
      { command: cmd },
      mockCtx,
    )) as SandboxResult;
    combinedOutput += `
${name} STDOUT:
${result.stdout || '(empty)'}`;
    combinedOutput += `
${name} STDERR:
${result.stderr || '(empty)'}`;

    if (result.exitCode !== 0) {
      success = false;
      outputMessages.push(`${name} FAILED with exit code ${result.exitCode}.`);
      logger.error(`${name} FAILED`, {
        stderr: result.stderr,
        stdout: result.stdout,
      });
      break; // Stop on first failure
    } else {
      outputMessages.push(`${name} PASSED.`);
    }
  }

  const allChecksPassed = success;

  outputMessages.push(`--- Quality Gate Execution Finished ---`);
  outputMessages.push(`Combined Output:
${combinedOutput}`);

  if (allChecksPassed) {
    outputMessages.push(`--- Quality Gate Passed ---`);
    logger.info('All quality checks passed successfully.');
  } else {
    const failureMessage = `Quality Gate FAILED.`;
    outputMessages.push(failureMessage);
    logger.error(failureMessage, {
      output: combinedOutput,
    });
  }

  return {
    output: outputMessages.join('\n'),
    success: allChecksPassed,
  };
}
