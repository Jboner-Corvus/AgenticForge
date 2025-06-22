// src/utils/qualityGate.ts
import { runInSandbox } from './dockerManager.js';
import logger from '../logger.js';
import { config } from '../config.js'; // CORRECTION: Le chemin est maintenant '../config.js'

const DEV_SANDBOX_IMAGE = 'node:20-alpine';
const mountPoint = {
  Type: 'bind' as const,
  Source: config.HOST_PROJECT_PATH || process.cwd(),
  Target: '/usr/src/app',
};

interface QualityResult {
  success: boolean;
  output: string;
}

/**
 * Exécute une série de vérifications de qualité (types, format, lint) dans un sandbox Docker.
 * @returns Un objet indiquant si toutes les vérifications ont réussi et la sortie combinée.
 */
export async function runQualityGate(): Promise<QualityResult> {
  const outputMessages: string[] = [];
  let allChecksPassed = true;

  const qualityCommand = [
    'sh',
    '-c',
    `
      echo "--- Installing pnpm..."
      npm install -g pnpm
      
      echo "\n--- Running: Lint (Fix)..."
      pnpm run lint:fix
      
      echo "\n--- Running: Format..."
      pnpm run format
      
      echo "\n--- Running: Type Check..."
      pnpm exec tsc --noEmit
    `,
  ];

  logger.info('Running all quality checks in a single sandbox...');
  outputMessages.push(`--- Running Quality Gate ---`);

  const result = await runInSandbox(DEV_SANDBOX_IMAGE, qualityCommand, {
    workingDir: '/usr/src/app',
    mounts: [mountPoint],
  });

  outputMessages.push(`--- Sandbox Execution Finished ---`);
  outputMessages.push(`Exit Code: ${result.exitCode}`);
  if (result.stdout) outputMessages.push(`STDOUT:\n${result.stdout}`);
  if (result.stderr) outputMessages.push(`STDERR:\n${result.stderr}`);

  if (result.exitCode !== 0) {
    allChecksPassed = false;
    const failureMessage = `Quality Gate FAILED.`;
    outputMessages.push(failureMessage);
    logger.error(failureMessage, {
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  if (allChecksPassed) {
    outputMessages.push('\n--- Quality Gate Passed ---');
    logger.info('All quality checks passed successfully.');
  }

  return {
    success: allChecksPassed,
    output: outputMessages.join('\n'),
  };
}